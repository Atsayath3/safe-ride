import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface PaymentRequest {
  bookingId: string;
  amount: number;
  currency: string;
  description: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  metadata?: Record<string, any>;
}

export interface PaymentResponse {
  success: boolean;
  transactionId: string;
  amount: number;
  currency: string;
  status: 'completed' | 'failed' | 'pending';
  message?: string;
}

export class PaymentService {
  /**
   * Process a payment (simulated for development)
   */
  static async processPayment(paymentRequest: PaymentRequest): Promise<PaymentResponse> {
    try {
      console.log('💳 Starting payment processing for:', paymentRequest);
      
      // Simulate payment processing delay
      console.log('⏳ Processing payment...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate a transaction ID
      const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log('🆔 Generated transaction ID:', transactionId);
      
      // Simulate successful payment (98% success rate for demo)
      const isSuccessful = Math.random() > 0.02;
      console.log('🎲 Payment simulation result:', isSuccessful ? 'SUCCESS' : 'FAILED');
      
      if (isSuccessful) {
        console.log('💾 Recording transaction in Firestore...');
        
        // Record the transaction in Firestore
        const docRef = await addDoc(collection(db, 'payment_transactions'), {
          transactionId,
          bookingId: paymentRequest.bookingId,
          amount: paymentRequest.amount,
          currency: paymentRequest.currency,
          description: paymentRequest.description,
          customerInfo: paymentRequest.customerInfo,
          metadata: paymentRequest.metadata || {},
          status: 'completed',
          paymentMethod: 'credit_card', // Simulated
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
        
        console.log('✅ Transaction recorded with ID:', docRef.id);
        
        return {
          success: true,
          transactionId,
          amount: paymentRequest.amount,
          currency: paymentRequest.currency,
          status: 'completed',
          message: 'Payment processed successfully'
        };
      } else {
        console.log('❌ Payment simulation failed');
        // Simulate payment failure
        return {
          success: false,
          transactionId: '',
          amount: paymentRequest.amount,
          currency: paymentRequest.currency,
          status: 'failed',
          message: 'Payment processing failed. Please try again.'
        };
      }
    } catch (error) {
      console.error('💥 Payment processing error:', error);
      return {
        success: false,
        transactionId: '',
        amount: paymentRequest.amount,
        currency: paymentRequest.currency,
        status: 'failed',
        message: 'Payment service unavailable. Please try again later.'
      };
    }
  }

  /**
   * Format price for display
   */
  static formatPrice(amount: number): string {
    return `Rs. ${amount.toFixed(2)}`;
  }

  /**
   * Validate payment amount
   */
  static validateAmount(amount: number): boolean {
    return amount > 0 && amount <= 100000; // Max 100,000 LKR
  }
}
