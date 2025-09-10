import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs, 
  addDoc,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  PaymentTransactionRecord, 
  PaymentCalculation, 
  PaymentRequest, 
  PaymentResponse,
  DriverWallet,
  WalletTransaction,
  PayoutBatch
} from '../interfaces/payment';

export class ComprehensivePaymentService {
  // Payment calculation constants
  private static readonly PAYHERE_FEE_PERCENTAGE = 3.30; // 3.30%
  private static readonly SYSTEM_COMMISSION_PERCENTAGE = 15; // 15%
  private static readonly MINIMUM_UPFRONT_PERCENTAGE = 25; // 25%

  /**
   * Calculate payment breakdown including fees and commissions
   */
  static calculatePaymentBreakdown(totalAmount: number, bookingEndDate: Date): PaymentCalculation {
    const upfrontAmount = Math.ceil(totalAmount * (this.MINIMUM_UPFRONT_PERCENTAGE / 100));
    const balanceAmount = totalAmount - upfrontAmount;
    
    // Calculate total fees on the full amount
    const payhereFee = Math.ceil(totalAmount * (this.PAYHERE_FEE_PERCENTAGE / 100));
    const systemCommission = Math.ceil(totalAmount * (this.SYSTEM_COMMISSION_PERCENTAGE / 100));
    const driverEarning = totalAmount - payhereFee - systemCommission;
    
    // Balance due date is 2 days before booking end
    const balanceDueDate = new Date(bookingEndDate);
    balanceDueDate.setDate(balanceDueDate.getDate() - 2);
    
    return {
      totalAmount,
      upfrontAmount,
      balanceAmount,
      payhereFee,
      systemCommission,
      driverEarning,
      balanceDueDate
    };
  }

  /**
   * Create initial payment transaction record
   */
  static async createPaymentTransaction(
    bookingId: string,
    parentId: string,
    driverId: string,
    totalAmount: number,
    bookingEndDate: Date
  ): Promise<string> {
    try {
      const calculation = this.calculatePaymentBreakdown(totalAmount, bookingEndDate);
      
      const paymentTransaction: PaymentTransactionRecord = {
        bookingId,
        parentId,
        driverId,
        totalAmount,
        upfrontPaid: 0,
        balancePaid: 0,
        systemCommission: calculation.systemCommission,
        payhereFee: calculation.payhereFee,
        driverEarning: calculation.driverEarning,
        status: 'pending_upfront',
        balanceDueDate: calculation.balanceDueDate,
        remindersSent: {
          threeDays: false,
          oneDay: false
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await addDoc(collection(db, 'payment_transactions'), paymentTransaction);
      return docRef.id;
    } catch (error) {
      console.error('Error creating payment transaction:', error);
      throw new Error('Failed to create payment transaction');
    }
  }

  /**
   * Process upfront payment
   */
  static async processUpfrontPayment(
    paymentTransactionId: string,
    amount: number,
    gatewayTransactionId: string
  ): Promise<boolean> {
    try {
      const docRef = doc(db, 'payment_transactions', paymentTransactionId);
      const paymentDoc = await getDoc(docRef);
      
      if (!paymentDoc.exists()) {
        throw new Error('Payment transaction not found');
      }
      
      const transaction = paymentDoc.data() as PaymentTransactionRecord;
      const calculation = this.calculatePaymentBreakdown(transaction.totalAmount, transaction.balanceDueDate);
      
      // Validate upfront amount
      if (amount < calculation.upfrontAmount) {
        throw new Error(`Minimum upfront payment is ${calculation.upfrontAmount}`);
      }
      
      // Update payment transaction
      await updateDoc(docRef, {
        upfrontPaid: amount,
        upfrontPaymentDate: new Date(),
        status: amount >= transaction.totalAmount ? 'fully_paid' : 'upfront_paid',
        updatedAt: new Date()
      });

      // Update driver wallet with upfront earning
      const upfrontEarning = Math.floor(amount * (transaction.driverEarning / transaction.totalAmount));
      await this.updateDriverWallet(transaction.driverId, transaction.bookingId, transaction.parentId, upfrontEarning, 'upfront_earning');
      
      return true;
    } catch (error) {
      console.error('Error processing upfront payment:', error);
      throw error;
    }
  }

  /**
   * Process balance payment
   */
  static async processBalancePayment(
    paymentTransactionId: string,
    amount: number,
    gatewayTransactionId: string
  ): Promise<boolean> {
    try {
      const docRef = doc(db, 'payment_transactions', paymentTransactionId);
      const paymentDoc = await getDoc(docRef);
      
      if (!paymentDoc.exists()) {
        throw new Error('Payment transaction not found');
      }
      
      const transaction = paymentDoc.data() as PaymentTransactionRecord;
      const remainingAmount = transaction.totalAmount - transaction.upfrontPaid;
      
      // Validate balance amount
      if (amount !== remainingAmount) {
        throw new Error(`Balance payment must be exactly ${remainingAmount}`);
      }
      
      // Update payment transaction
      await updateDoc(docRef, {
        balancePaid: amount,
        balancePaymentDate: new Date(),
        status: 'fully_paid',
        updatedAt: new Date()
      });

      // Update driver wallet with balance earning
      const balanceEarning = transaction.driverEarning - Math.floor(transaction.upfrontPaid * (transaction.driverEarning / transaction.totalAmount));
      await this.updateDriverWallet(transaction.driverId, transaction.bookingId, transaction.parentId, balanceEarning, 'balance_earning');
      
      return true;
    } catch (error) {
      console.error('Error processing balance payment:', error);
      throw error;
    }
  }

  /**
   * Update driver wallet
   */
  private static async updateDriverWallet(
    driverId: string,
    bookingId: string,
    parentId: string,
    amount: number,
    type: 'upfront_earning' | 'balance_earning' | 'payout'
  ): Promise<void> {
    try {
      const walletRef = doc(db, 'driver_wallets', driverId);
      const walletDoc = await getDoc(walletRef);
      
      const walletTransaction: WalletTransaction = {
        id: `${bookingId}_${type}_${Date.now()}`,
        bookingId,
        parentId,
        amount,
        type,
        date: new Date(),
        status: 'completed'
      };
      
      if (walletDoc.exists()) {
        // Update existing wallet
        await updateDoc(walletRef, {
          totalEarnings: increment(amount),
          pendingPayouts: increment(amount),
          transactions: [...(walletDoc.data().transactions || []), walletTransaction],
          updatedAt: new Date()
        });
      } else {
        // Create new wallet
        const newWallet: DriverWallet = {
          driverId,
          totalEarnings: amount,
          pendingPayouts: amount,
          transactions: [walletTransaction],
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await setDoc(walletRef, newWallet);
      }
    } catch (error) {
      console.error('Error updating driver wallet:', error);
      throw error;
    }
  }

  /**
   * Get payment transaction by booking ID
   */
  static async getPaymentByBookingId(bookingId: string): Promise<PaymentTransactionRecord | null> {
    try {
      const q = query(
        collection(db, 'payment_transactions'),
        where('bookingId', '==', bookingId)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }
      
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as PaymentTransactionRecord;
    } catch (error) {
      console.error('Error getting payment by booking ID:', error);
      return null;
    }
  }

  /**
   * Get overdue payments for reminder system
   */
  static async getOverduePayments(): Promise<PaymentTransactionRecord[]> {
    try {
      const now = new Date();
      const threeDaysFromNow = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));
      
      const q = query(
        collection(db, 'payment_transactions'),
        where('status', '==', 'upfront_paid'),
        where('balanceDueDate', '<=', threeDaysFromNow)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PaymentTransactionRecord));
    } catch (error) {
      console.error('Error getting overdue payments:', error);
      return [];
    }
  }

  /**
   * Mark reminder as sent
   */
  static async markReminderSent(paymentTransactionId: string, reminderType: 'threeDays' | 'oneDay'): Promise<void> {
    try {
      const docRef = doc(db, 'payment_transactions', paymentTransactionId);
      await updateDoc(docRef, {
        [`remindersSent.${reminderType}`]: true,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error marking reminder as sent:', error);
      throw error;
    }
  }

  /**
   * Suspend overdue bookings
   */
  static async suspendOverdueBookings(): Promise<void> {
    try {
      const now = new Date();
      
      const q = query(
        collection(db, 'payment_transactions'),
        where('status', '==', 'upfront_paid'),
        where('balanceDueDate', '<', now)
      );
      
      const querySnapshot = await getDocs(q);
      
      for (const docSnapshot of querySnapshot.docs) {
        await updateDoc(docSnapshot.ref, {
          status: 'suspended',
          updatedAt: new Date()
        });
        
        // Also update booking status
        const bookingRef = doc(db, 'bookings', docSnapshot.data().bookingId);
        await updateDoc(bookingRef, {
          status: 'suspended_payment',
          updatedAt: new Date()
        });
      }
    } catch (error) {
      console.error('Error suspending overdue bookings:', error);
      throw error;
    }
  }

  /**
   * Get driver wallet
   */
  static async getDriverWallet(driverId: string): Promise<DriverWallet | null> {
    try {
      const walletRef = doc(db, 'driver_wallets', driverId);
      const walletDoc = await getDoc(walletRef);
      
      if (walletDoc.exists()) {
        return { id: walletDoc.id, ...walletDoc.data() } as DriverWallet;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting driver wallet:', error);
      return null;
    }
  }

  /**
   * Process weekly payouts
   */
  static async processWeeklyPayouts(): Promise<PayoutBatch> {
    try {
      // Get all drivers with pending payouts
      const walletsQuery = query(
        collection(db, 'driver_wallets'),
        where('pendingPayouts', '>', 0)
      );
      
      const walletsSnapshot = await getDocs(walletsQuery);
      const driverIds: string[] = [];
      let totalAmount = 0;
      
      const payoutTransactions = walletsSnapshot.docs.map(doc => {
        const wallet = doc.data() as DriverWallet;
        driverIds.push(wallet.driverId);
        totalAmount += wallet.pendingPayouts;
        
        return {
          driverId: wallet.driverId,
          amount: wallet.pendingPayouts,
          status: 'pending' as const
        };
      });
      
      // Create payout batch
      const payoutBatch: PayoutBatch = {
        driverIds,
        totalAmount,
        status: 'pending',
        createdAt: new Date(),
        transactions: payoutTransactions
      };
      
      const batchRef = await addDoc(collection(db, 'payout_batches'), payoutBatch);
      
      // Update driver wallets to mark payouts as processed
      for (const docSnapshot of walletsSnapshot.docs) {
        await updateDoc(docSnapshot.ref, {
          pendingPayouts: 0,
          lastPayoutDate: new Date(),
          updatedAt: new Date()
        });
      }
      
      return { id: batchRef.id, ...payoutBatch };
    } catch (error) {
      console.error('Error processing weekly payouts:', error);
      throw error;
    }
  }

  /**
   * Mock payment gateway integration
   */
  static async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // This is a mock implementation
      // In production, integrate with PayHere API
      
      console.log('Processing payment:', request);
      
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock successful payment
      const success = Math.random() > 0.1; // 90% success rate
      
      if (success) {
        return {
          success: true,
          transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          message: 'Payment processed successfully'
        };
      } else {
        return {
          success: false,
          message: 'Payment failed. Please try again.'
        };
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      return {
        success: false,
        message: 'Payment processing error'
      };
    }
  }

  /**
   * Format price in LKR
   */
  static formatPrice(amount: number): string {
    return `Rs.${amount.toLocaleString()}`;
  }
}
