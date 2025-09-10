import { 
  PaymentRecord, 
  PaymentTransaction, 
  PaymentRequest, 
  PaymentResponse, 
  PaymentGatewayConfig,
  PaymentReminder
} from '../interfaces/payment';
import { db } from '../lib/firebase';
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
  Timestamp 
} from 'firebase/firestore';

export class PaymentService {
  private static readonly MINIMUM_PAYMENT_PERCENTAGE = 0.25; // 25%
  private static readonly FINAL_PAYMENT_DAYS_BEFORE = 2; // 2 days before trip ends
  
  // Mock payment gateway configuration (replace with real gateway)
  private static readonly GATEWAY_CONFIG: PaymentGatewayConfig = {
    provider: 'mock',
    publicKey: 'pk_test_mock_key',
    currency: 'LKR',
    minimumAmount: 100,
    maximumAmount: 100000
  };

  /**
   * Calculate minimum payment amount (25% of total)
   */
  static calculateMinimumPayment(totalAmount: number): number {
    return Math.ceil(totalAmount * this.MINIMUM_PAYMENT_PERCENTAGE);
  }

  /**
   * Calculate final payment due date (2 days before trip ends)
   */
  static calculateFinalPaymentDue(tripEndDate: Date): Date {
    const dueDate = new Date(tripEndDate);
    dueDate.setDate(dueDate.getDate() - this.FINAL_PAYMENT_DAYS_BEFORE);
    return dueDate;
  }

  /**
   * Validate payment amount
   */
  static validatePaymentAmount(amount: number, totalAmount: number, alreadyPaid: number = 0): {
    isValid: boolean;
    message: string;
    minimumRequired: number;
  } {
    const remainingAmount = totalAmount - alreadyPaid;
    const minimumPayment = this.calculateMinimumPayment(totalAmount);
    const minimumForThisPayment = Math.min(minimumPayment - alreadyPaid, remainingAmount);

    if (amount < minimumForThisPayment) {
      return {
        isValid: false,
        message: `Minimum payment required: Rs.${minimumForThisPayment}`,
        minimumRequired: minimumForThisPayment
      };
    }

    if (amount > remainingAmount) {
      return {
        isValid: false,
        message: `Amount exceeds remaining balance: Rs.${remainingAmount}`,
        minimumRequired: minimumForThisPayment
      };
    }

    return {
      isValid: true,
      message: 'Payment amount is valid',
      minimumRequired: minimumForThisPayment
    };
  }

  /**
   * Create initial payment record
   */
  static async createPaymentRecord(
    bookingId: string,
    parentId: string,
    driverId: string,
    totalAmount: number,
    tripEndDate: Date
  ): Promise<string> {
    try {
      const finalPaymentDue = this.calculateFinalPaymentDue(tripEndDate);
      const now = new Date();

      const paymentRecord: Omit<PaymentRecord, 'id'> = {
        bookingId,
        parentId,
        driverId,
        amount: 0, // Will be updated when payments are made
        totalAmount,
        remainingAmount: totalAmount,
        paymentStatus: 'pending',
        paymentMethod: 'card', // Default, will be updated
        paymentDate: now,
        dueDate: now, // Initial payment due immediately
        finalPaymentDue,
        createdAt: now,
        updatedAt: now
      };

      const docRef = await addDoc(collection(db, 'payments'), {
        ...paymentRecord,
        paymentDate: Timestamp.fromDate(paymentRecord.paymentDate),
        dueDate: Timestamp.fromDate(paymentRecord.dueDate),
        finalPaymentDue: Timestamp.fromDate(paymentRecord.finalPaymentDue),
        createdAt: Timestamp.fromDate(paymentRecord.createdAt),
        updatedAt: Timestamp.fromDate(paymentRecord.updatedAt)
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating payment record:', error);
      throw new Error('Failed to create payment record');
    }
  }

  /**
   * Process payment through gateway (Mock implementation)
   */
  static async processPayment(paymentRequest: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Mock payment processing - replace with real gateway
      console.log('Processing payment:', paymentRequest);
      
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock successful payment (90% success rate)
      const isSuccess = Math.random() > 0.1;
      
      if (isSuccess) {
        const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        return {
          success: true,
          transactionId,
          amount: paymentRequest.amount,
          status: 'completed',
          message: 'Payment processed successfully',
          gatewayResponse: {
            id: transactionId,
            amount: paymentRequest.amount,
            currency: paymentRequest.currency,
            status: 'succeeded',
            created: Date.now()
          }
        };
      } else {
        return {
          success: false,
          status: 'failed',
          message: 'Payment failed. Please try again.',
          gatewayResponse: {
            error: 'card_declined',
            message: 'Your card was declined.'
          }
        };
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      return {
        success: false,
        status: 'failed',
        message: 'Payment processing error. Please try again.'
      };
    }
  }

  /**
   * Record payment transaction
   */
  static async recordPaymentTransaction(
    paymentId: string,
    amount: number,
    transactionType: PaymentTransaction['transactionType'],
    paymentResponse: PaymentResponse
  ): Promise<string> {
    try {
      const transaction: Omit<PaymentTransaction, 'id'> = {
        paymentId,
        amount,
        transactionType,
        status: paymentResponse.success ? 'completed' : 'failed',
        transactionId: paymentResponse.transactionId,
        gatewayResponse: paymentResponse.gatewayResponse,
        createdAt: new Date()
      };

      const docRef = await addDoc(collection(db, 'payment_transactions'), {
        ...transaction,
        createdAt: Timestamp.fromDate(transaction.createdAt)
      });

      // Update payment record
      if (paymentResponse.success) {
        await this.updatePaymentRecord(paymentId, amount);
      }

      return docRef.id;
    } catch (error) {
      console.error('Error recording payment transaction:', error);
      throw new Error('Failed to record payment transaction');
    }
  }

  /**
   * Update payment record after successful payment
   */
  private static async updatePaymentRecord(paymentId: string, paidAmount: number): Promise<void> {
    try {
      const paymentDoc = await getDoc(doc(db, 'payments', paymentId));
      if (!paymentDoc.exists()) {
        throw new Error('Payment record not found');
      }

      const currentData = paymentDoc.data();
      const newAmount = (currentData.amount || 0) + paidAmount;
      const remainingAmount = currentData.totalAmount - newAmount;
      
      let paymentStatus: PaymentRecord['paymentStatus'] = 'partial';
      if (remainingAmount <= 0) {
        paymentStatus = 'completed';
      } else if (newAmount >= this.calculateMinimumPayment(currentData.totalAmount)) {
        paymentStatus = 'partial';
      }

      await updateDoc(doc(db, 'payments', paymentId), {
        amount: newAmount,
        remainingAmount: Math.max(0, remainingAmount),
        paymentStatus,
        updatedAt: Timestamp.fromDate(new Date())
      });
    } catch (error) {
      console.error('Error updating payment record:', error);
      throw new Error('Failed to update payment record');
    }
  }

  /**
   * Get payment record by booking ID
   */
  static async getPaymentByBookingId(bookingId: string): Promise<PaymentRecord | null> {
    try {
      const q = query(
        collection(db, 'payments'),
        where('bookingId', '==', bookingId)
      );
      
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      const data = doc.data();
      
      return {
        id: doc.id,
        ...data,
        paymentDate: data.paymentDate?.toDate(),
        dueDate: data.dueDate?.toDate(),
        finalPaymentDue: data.finalPaymentDue?.toDate(),
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      } as PaymentRecord;
    } catch (error) {
      console.error('Error getting payment record:', error);
      return null;
    }
  }

  /**
   * Get payment transactions for a payment
   */
  static async getPaymentTransactions(paymentId: string): Promise<PaymentTransaction[]> {
    try {
      const q = query(
        collection(db, 'payment_transactions'),
        where('paymentId', '==', paymentId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      })) as PaymentTransaction[];
    } catch (error) {
      console.error('Error getting payment transactions:', error);
      return [];
    }
  }

  /**
   * Check for overdue payments and update status
   */
  static async checkOverduePayments(): Promise<void> {
    try {
      const now = new Date();
      const q = query(
        collection(db, 'payments'),
        where('paymentStatus', 'in', ['pending', 'partial']),
        where('finalPaymentDue', '<', Timestamp.fromDate(now))
      );
      
      const querySnapshot = await getDocs(q);
      
      for (const doc of querySnapshot.docs) {
        await updateDoc(doc.ref, {
          paymentStatus: 'overdue',
          updatedAt: Timestamp.fromDate(now)
        });
      }
    } catch (error) {
      console.error('Error checking overdue payments:', error);
    }
  }

  /**
   * Get payment record by ID
   */
  static async getPaymentRecord(paymentId: string): Promise<PaymentRecord | null> {
    try {
      const paymentRef = doc(db, 'payments', paymentId);
      const paymentSnap = await getDoc(paymentRef);
      
      if (paymentSnap.exists()) {
        return { id: paymentSnap.id, ...paymentSnap.data() } as PaymentRecord;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting payment record:', error);
      throw error;
    }
  }

  /**
   * Update payment record with booking ID
   */
  static async updatePaymentBookingId(paymentId: string, bookingId: string): Promise<void> {
    try {
      const paymentRef = doc(db, 'payments', paymentId);
      await updateDoc(paymentRef, {
        bookingId,
        updatedAt: Timestamp.fromDate(new Date())
      });
    } catch (error) {
      console.error('Error updating payment with booking ID:', error);
      throw error;
    }
  }

  /**
   * Format price for display
   */
  static formatPrice(amount: number): string {
    return `Rs.${amount.toLocaleString('en-LK', { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 0 
    })}`;
  }
}
