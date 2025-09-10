import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  EnhancedPaymentTransaction, 
  DriverWallet, 
  PaymentSplit, 
  PaymentSchedule,
  EnhancedPaymentReminder,
  WeeklyPayout,
  WalletTransaction
} from '../interfaces/payment';

export class EnhancedPaymentService {
  private static readonly SYSTEM_COMMISSION_RATE = 0.15; // 15%
  private static readonly PAYHERE_FEE_RATE = 0.033; // 3.30%
  private static readonly UPFRONT_PERCENTAGE = 0.25; // 25%

  // Calculate payment split
  static calculatePaymentSplit(totalAmount: number): PaymentSplit {
    const systemCommission = totalAmount * this.SYSTEM_COMMISSION_RATE;
    const payhereFee = totalAmount * this.PAYHERE_FEE_RATE;
    const driverEarning = totalAmount - systemCommission - payhereFee;

    return {
      totalAmount,
      systemCommission: Math.round(systemCommission * 100) / 100,
      payhereFee: Math.round(payhereFee * 100) / 100,
      driverEarning: Math.round(driverEarning * 100) / 100
    };
  }

  // Create payment schedule for a booking
  static createPaymentSchedule(
    bookingId: string, 
    totalAmount: number, 
    bookingEndDate: Date
  ): PaymentSchedule {
    const upfrontRequired = totalAmount * this.UPFRONT_PERCENTAGE;
    const balanceRequired = totalAmount - upfrontRequired;
    
    // Balance due 2 days before booking ends
    const balanceDueDate = new Date(bookingEndDate);
    balanceDueDate.setDate(balanceDueDate.getDate() - 2);
    
    // Reminder dates
    const threeDaysReminder = new Date(balanceDueDate);
    threeDaysReminder.setDate(threeDaysReminder.getDate() - 3);
    
    const oneDayReminder = new Date(balanceDueDate);
    oneDayReminder.setDate(oneDayReminder.getDate() - 1);

    return {
      bookingId,
      totalAmount,
      upfrontRequired: Math.round(upfrontRequired * 100) / 100,
      balanceRequired: Math.round(balanceRequired * 100) / 100,
      balanceDueDate,
      reminderDates: {
        threeDays: threeDaysReminder,
        oneDay: oneDayReminder
      }
    };
  }

  // Create initial payment transaction
  static async createPaymentTransaction(
    bookingId: string,
    parentId: string,
    driverId: string,
    totalAmount: number,
    bookingEndDate: Date
  ): Promise<string> {
    const schedule = this.createPaymentSchedule(bookingId, totalAmount, bookingEndDate);
    
    const paymentTransaction: EnhancedPaymentTransaction = {
      bookingId,
      parentId,
      driverId,
      totalAmount,
      upfrontPaid: 0,
      balancePaid: 0,
      systemCommission: 0,
      payhereFee: 0,
      driverEarning: 0,
      status: 'pending',
      paymentType: 'upfront',
      transactionDate: new Date(),
      balanceDueDate: schedule.balanceDueDate,
      remindersSent: {
        threeDays: false,
        oneDay: false
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    try {
      const docRef = await addDoc(collection(db, 'payment_transactions'), {
        ...paymentTransaction,
        transactionDate: serverTimestamp(),
        balanceDueDate: Timestamp.fromDate(schedule.balanceDueDate),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating payment transaction:', error);
      throw new Error('Failed to create payment transaction');
    }
  }

  // Process upfront payment
  static async processUpfrontPayment(
    transactionId: string,
    amount: number,
    payhereTransactionId: string
  ): Promise<boolean> {
    try {
      const docRef = doc(db, 'payment_transactions', transactionId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Payment transaction not found');
      }

      const transaction = docSnap.data() as EnhancedPaymentTransaction;
      const requiredUpfront = transaction.totalAmount * this.UPFRONT_PERCENTAGE;

      if (amount < requiredUpfront) {
        throw new Error(`Minimum upfront payment required: ${requiredUpfront}`);
      }

      const split = this.calculatePaymentSplit(amount);
      
      await updateDoc(docRef, {
        upfrontPaid: amount,
        systemCommission: split.systemCommission,
        payhereFee: split.payhereFee,
        driverEarning: split.driverEarning,
        status: amount >= transaction.totalAmount ? 'completed' : 'partial',
        paymentType: 'upfront',
        'metadata.payhereTransactionId': payhereTransactionId,
        updatedAt: serverTimestamp()
      });

      // Update driver wallet
      await this.updateDriverWallet(transaction.driverId, split.driverEarning, transactionId, transaction);

      return true;
    } catch (error) {
      console.error('Error processing upfront payment:', error);
      throw error;
    }
  }

  // Process balance payment
  static async processBalancePayment(
    transactionId: string,
    amount: number,
    payhereTransactionId: string
  ): Promise<boolean> {
    try {
      const docRef = doc(db, 'payment_transactions', transactionId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Payment transaction not found');
      }

      const transaction = docSnap.data() as EnhancedPaymentTransaction;
      const remainingBalance = transaction.totalAmount - transaction.upfrontPaid;

      if (amount > remainingBalance) {
        throw new Error(`Payment amount exceeds remaining balance: ${remainingBalance}`);
      }

      const split = this.calculatePaymentSplit(amount);
      const newBalancePaid = transaction.balancePaid + amount;
      const totalPaid = transaction.upfrontPaid + newBalancePaid;
      
      await updateDoc(docRef, {
        balancePaid: newBalancePaid,
        systemCommission: transaction.systemCommission + split.systemCommission,
        payhereFee: transaction.payhereFee + split.payhereFee,
        driverEarning: transaction.driverEarning + split.driverEarning,
        status: totalPaid >= transaction.totalAmount ? 'completed' : 'partial',
        paymentType: 'balance',
        'metadata.payhereTransactionId': payhereTransactionId,
        updatedAt: serverTimestamp()
      });

      // Update driver wallet
      await this.updateDriverWallet(transaction.driverId, split.driverEarning, transactionId, transaction);

      return true;
    } catch (error) {
      console.error('Error processing balance payment:', error);
      throw error;
    }
  }

  // Update driver wallet
  private static async updateDriverWallet(
    driverId: string, 
    earning: number, 
    transactionId: string,
    paymentTransaction: EnhancedPaymentTransaction
  ): Promise<void> {
    try {
      const walletRef = doc(db, 'driver_wallets', driverId);
      const walletSnap = await getDoc(walletRef);

      const walletTransaction: WalletTransaction = {
        id: `${transactionId}_${Date.now()}`,
        bookingId: paymentTransaction.bookingId,
        parentId: paymentTransaction.parentId,
        amount: earning,
        type: 'earning',
        status: 'pending',
        paymentTransactionId: transactionId,
        transactionDate: new Date()
      };

      if (walletSnap.exists()) {
        const wallet = walletSnap.data() as DriverWallet;
        const updatedTransactions = [...(wallet.transactions || []), walletTransaction];
        
        await updateDoc(walletRef, {
          totalEarnings: wallet.totalEarnings + earning,
          pendingAmount: wallet.pendingAmount + earning,
          transactions: updatedTransactions,
          updatedAt: serverTimestamp()
        });
      } else {
        const newWallet: DriverWallet = {
          driverId,
          totalEarnings: earning,
          pendingAmount: earning,
          paidAmount: 0,
          transactions: [walletTransaction],
          createdAt: new Date(),
          updatedAt: new Date()
        };

        await updateDoc(walletRef, {
          ...newWallet,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error updating driver wallet:', error);
      throw error;
    }
  }

  // Get payment transaction by booking ID
  static async getPaymentByBookingId(bookingId: string): Promise<EnhancedPaymentTransaction | null> {
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
      return {
        id: doc.id,
        ...doc.data(),
        transactionDate: doc.data().transactionDate?.toDate() || new Date(),
        balanceDueDate: doc.data().balanceDueDate?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      } as EnhancedPaymentTransaction;
    } catch (error) {
      console.error('Error getting payment by booking ID:', error);
      return null;
    }
  }

  // Get driver wallet
  static async getDriverWallet(driverId: string): Promise<DriverWallet | null> {
    try {
      const docRef = doc(db, 'driver_wallets', driverId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }

      return {
        id: docSnap.id,
        ...docSnap.data(),
        lastPayoutDate: docSnap.data().lastPayoutDate?.toDate(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date(),
        updatedAt: docSnap.data().updatedAt?.toDate() || new Date()
      } as DriverWallet;
    } catch (error) {
      console.error('Error getting driver wallet:', error);
      return null;
    }
  }

  // Mark booking as suspended for non-payment
  static async suspendBookingForNonPayment(bookingId: string): Promise<void> {
    try {
      const batch = writeBatch(db);

      // Update payment transaction
      const paymentQuery = query(
        collection(db, 'payment_transactions'),
        where('bookingId', '==', bookingId)
      );
      const paymentSnapshot = await getDocs(paymentQuery);
      
      paymentSnapshot.forEach((doc) => {
        batch.update(doc.ref, {
          status: 'suspended',
          updatedAt: serverTimestamp()
        });
      });

      // Update booking status
      const bookingRef = doc(db, 'bookings', bookingId);
      batch.update(bookingRef, {
        status: 'suspended',
        suspendedReason: 'Payment not completed before due date',
        updatedAt: serverTimestamp()
      });

      await batch.commit();
    } catch (error) {
      console.error('Error suspending booking:', error);
      throw error;
    }
  }

  // Format price for display
  static formatPrice(amount: number): string {
    return `Rs.${amount.toFixed(2)}`;
  }
}
