import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { WeeklyPayout, DriverWallet, WalletTransaction } from '../interfaces/payment';
import { EnhancedPaymentService } from './enhancedPaymentService';

export class WeeklyPayoutService {
  
  // Process weekly payouts for all drivers
  static async processWeeklyPayouts(): Promise<void> {
    try {
      console.log('Starting weekly payout process...');
      
      // Get all driver wallets with pending amounts
      const walletsQuery = query(
        collection(db, 'driver_wallets'),
        where('pendingAmount', '>', 0)
      );
      
      const walletsSnapshot = await getDocs(walletsQuery);
      const batchId = `payout_${Date.now()}`;
      
      for (const walletDoc of walletsSnapshot.docs) {
        const wallet = {
          id: walletDoc.id,
          ...walletDoc.data(),
          lastPayoutDate: walletDoc.data().lastPayoutDate?.toDate(),
          createdAt: walletDoc.data().createdAt?.toDate() || new Date(),
          updatedAt: walletDoc.data().updatedAt?.toDate() || new Date()
        } as DriverWallet;

        if (wallet.pendingAmount > 0) {
          await this.createDriverPayout(wallet, batchId);
        }
      }
      
      console.log(`Weekly payout process completed. Batch ID: ${batchId}`);
    } catch (error) {
      console.error('Error processing weekly payouts:', error);
      throw error;
    }
  }

  // Create payout for a specific driver
  private static async createDriverPayout(wallet: DriverWallet, batchId: string): Promise<void> {
    try {
      // Get pending transactions
      const pendingTransactions = wallet.transactions.filter(
        tx => tx.status === 'pending' && tx.type === 'earning'
      );

      if (pendingTransactions.length === 0) {
        return;
      }

      const payoutAmount = wallet.pendingAmount;
      const transactionIds = pendingTransactions.map(tx => tx.id);

      // Create payout record
      const payout: WeeklyPayout = {
        batchId,
        driverId: wallet.driverId,
        amount: payoutAmount,
        transactionIds,
        payoutDate: new Date(),
        status: 'pending',
        paymentMethod: 'bank_transfer', // Default method
        createdAt: new Date()
      };

      const payoutRef = await addDoc(collection(db, 'weekly_payouts'), {
        ...payout,
        payoutDate: serverTimestamp(),
        createdAt: serverTimestamp()
      });

      // Update wallet
      const batch = writeBatch(db);
      
      // Update wallet amounts
      const walletRef = doc(db, 'driver_wallets', wallet.id!);
      batch.update(walletRef, {
        pendingAmount: 0,
        paidAmount: wallet.paidAmount + payoutAmount,
        lastPayoutDate: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Mark transactions as completed and add payout batch
      const updatedTransactions = wallet.transactions.map(tx => {
        if (pendingTransactions.some(pending => pending.id === tx.id)) {
          return {
            ...tx,
            status: 'completed' as const,
            payoutBatch: batchId
          };
        }
        return tx;
      });

      batch.update(walletRef, {
        transactions: updatedTransactions
      });

      await batch.commit();

      console.log(`Payout created for driver ${wallet.driverId}: Rs.${payoutAmount}`);
      
      // In a real implementation, you would integrate with a payment gateway
      // to actually transfer the money to the driver's bank account
      await this.simulatePayoutProcessing(payoutRef.id, payout);
      
    } catch (error) {
      console.error(`Error creating payout for driver ${wallet.driverId}:`, error);
      throw error;
    }
  }

  // Simulate payout processing (replace with real payment gateway integration)
  private static async simulatePayoutProcessing(payoutId: string, payout: WeeklyPayout): Promise<void> {
    try {
      // Simulate processing delay
      setTimeout(async () => {
        try {
          await updateDoc(doc(db, 'weekly_payouts', payoutId), {
            status: 'completed',
            processedAt: serverTimestamp()
          });
          
          console.log(`Payout ${payoutId} completed: Rs.${payout.amount} sent to driver ${payout.driverId}`);
        } catch (error) {
          console.error(`Error completing payout ${payoutId}:`, error);
          
          await updateDoc(doc(db, 'weekly_payouts', payoutId), {
            status: 'failed',
            processedAt: serverTimestamp()
          });
        }
      }, 2000); // 2 second delay to simulate processing
      
    } catch (error) {
      console.error('Error in payout simulation:', error);
    }
  }

  // Get payout history for a driver
  static async getDriverPayoutHistory(driverId: string): Promise<WeeklyPayout[]> {
    try {
      const q = query(
        collection(db, 'weekly_payouts'),
        where('driverId', '==', driverId),
        orderBy('payoutDate', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        payoutDate: doc.data().payoutDate?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        processedAt: doc.data().processedAt?.toDate()
      })) as WeeklyPayout[];
    } catch (error) {
      console.error('Error getting driver payout history:', error);
      return [];
    }
  }

  // Get all payouts for a specific batch
  static async getBatchPayouts(batchId: string): Promise<WeeklyPayout[]> {
    try {
      const q = query(
        collection(db, 'weekly_payouts'),
        where('batchId', '==', batchId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        payoutDate: doc.data().payoutDate?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        processedAt: doc.data().processedAt?.toDate()
      })) as WeeklyPayout[];
    } catch (error) {
      console.error('Error getting batch payouts:', error);
      return [];
    }
  }

  // Get payout statistics
  static async getPayoutStatistics(): Promise<{
    totalPaidThisWeek: number;
    totalPaidThisMonth: number;
    pendingPayouts: number;
    failedPayouts: number;
  }> {
    try {
      const now = new Date();
      const weekStart = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // Get all payouts
      const payoutsSnapshot = await getDocs(collection(db, 'weekly_payouts'));
      const payouts = payoutsSnapshot.docs.map(doc => ({
        ...doc.data(),
        payoutDate: doc.data().payoutDate?.toDate() || new Date()
      })) as WeeklyPayout[];

      const totalPaidThisWeek = payouts
        .filter(p => p.status === 'completed' && p.payoutDate >= weekStart)
        .reduce((sum, p) => sum + p.amount, 0);

      const totalPaidThisMonth = payouts
        .filter(p => p.status === 'completed' && p.payoutDate >= monthStart)
        .reduce((sum, p) => sum + p.amount, 0);

      const pendingPayouts = payouts
        .filter(p => p.status === 'pending')
        .reduce((sum, p) => sum + p.amount, 0);

      const failedPayouts = payouts
        .filter(p => p.status === 'failed')
        .reduce((sum, p) => sum + p.amount, 0);

      return {
        totalPaidThisWeek,
        totalPaidThisMonth,
        pendingPayouts,
        failedPayouts
      };
    } catch (error) {
      console.error('Error getting payout statistics:', error);
      return {
        totalPaidThisWeek: 0,
        totalPaidThisMonth: 0,
        pendingPayouts: 0,
        failedPayouts: 0
      };
    }
  }

  // Schedule weekly payouts (this would typically be a cloud function)
  static scheduleWeeklyPayouts(): void {
    // This would typically be implemented as a cloud function that runs weekly
    console.log('Scheduling weekly payouts...');
    
    // For development, you could set up a periodic check
    // Run every Sunday at midnight
    const now = new Date();
    const nextSunday = new Date(now);
    nextSunday.setDate(now.getDate() + (7 - now.getDay()));
    nextSunday.setHours(0, 0, 0, 0);
    
    const timeUntilNextSunday = nextSunday.getTime() - now.getTime();
    
    setTimeout(() => {
      this.processWeeklyPayouts().catch(console.error);
      
      // Set up weekly interval
      setInterval(() => {
        this.processWeeklyPayouts().catch(console.error);
      }, 7 * 24 * 60 * 60 * 1000); // Weekly
      
    }, timeUntilNextSunday);
  }

  // Manual payout trigger (for admin use)
  static async triggerManualPayout(driverId?: string): Promise<void> {
    try {
      if (driverId) {
        // Payout for specific driver
        const wallet = await EnhancedPaymentService.getDriverWallet(driverId);
        if (wallet && wallet.pendingAmount > 0) {
          const batchId = `manual_payout_${Date.now()}`;
          await this.createDriverPayout(wallet, batchId);
          console.log(`Manual payout initiated for driver ${driverId}`);
        } else {
          console.log(`No pending amount for driver ${driverId}`);
        }
      } else {
        // Payout for all drivers
        await this.processWeeklyPayouts();
        console.log('Manual payout initiated for all drivers');
      }
    } catch (error) {
      console.error('Error triggering manual payout:', error);
      throw error;
    }
  }
}
