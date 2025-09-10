import { 
  PaymentRecord, 
  PaymentReminder 
} from '../interfaces/payment';
import { PaymentService } from './paymentService';
import { db } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  addDoc,
  updateDoc,
  doc,
  Timestamp 
} from 'firebase/firestore';

export class PaymentReminderService {
  
  /**
   * Schedule payment reminders for a payment record
   */
  static async schedulePaymentReminders(paymentRecord: PaymentRecord): Promise<void> {
    try {
      const now = new Date();
      const reminderDate = new Date(paymentRecord.finalPaymentDue);
      reminderDate.setDate(reminderDate.getDate() - 1); // 1 day before final payment due

      // Only schedule if the reminder date is in the future
      if (reminderDate > now && paymentRecord.paymentStatus !== 'completed') {
        await this.createReminder({
          paymentId: paymentRecord.id,
          reminderType: 'final_payment_due',
          scheduledFor: reminderDate,
          status: 'scheduled',
          method: 'push_notification'
        });

        console.log(`Payment reminder scheduled for ${reminderDate.toLocaleDateString()}`);
      }
    } catch (error) {
      console.error('Error scheduling payment reminders:', error);
    }
  }

  /**
   * Create a payment reminder
   */
  private static async createReminder(reminderData: Omit<PaymentReminder, 'id' | 'sentAt'>): Promise<string> {
    const reminder: Omit<PaymentReminder, 'id'> = {
      ...reminderData,
      sentAt: new Date() // Will be updated when actually sent
    };

    const docRef = await addDoc(collection(db, 'payment_reminders'), {
      ...reminder,
      sentAt: Timestamp.fromDate(reminder.sentAt),
      scheduledFor: Timestamp.fromDate(reminder.scheduledFor)
    });

    return docRef.id;
  }

  /**
   * Check for due payment reminders and send them
   */
  static async processDueReminders(): Promise<void> {
    try {
      const now = new Date();
      const q = query(
        collection(db, 'payment_reminders'),
        where('status', '==', 'scheduled'),
        where('scheduledFor', '<=', Timestamp.fromDate(now))
      );

      const querySnapshot = await getDocs(q);
      
      for (const doc of querySnapshot.docs) {
        const reminder = doc.data() as PaymentReminder;
        
        // Send the reminder (mock implementation)
        const success = await this.sendReminder(reminder);
        
        // Update reminder status
        await updateDoc(doc.ref, {
          status: success ? 'sent' : 'failed',
          sentAt: Timestamp.fromDate(new Date())
        });
      }
    } catch (error) {
      console.error('Error processing due reminders:', error);
    }
  }

  /**
   * Send a payment reminder (mock implementation)
   */
  private static async sendReminder(reminder: PaymentReminder): Promise<boolean> {
    try {
      // Get the payment record to get user info
      const payment = await PaymentService.getPaymentByBookingId(reminder.paymentId);
      if (!payment) {
        console.error('Payment record not found for reminder:', reminder.id);
        return false;
      }

      // Mock notification sending
      console.log(`📱 Sending payment reminder:`, {
        paymentId: payment.id,
        remainingAmount: PaymentService.formatPrice(payment.remainingAmount),
        dueDate: payment.finalPaymentDue.toLocaleDateString(),
        reminderType: reminder.reminderType
      });

      // In a real implementation, you would:
      // 1. Send push notification using FCM
      // 2. Send SMS using Twilio
      // 3. Send email using SendGrid
      // 4. Create in-app notification

      return true; // Mock success
    } catch (error) {
      console.error('Error sending reminder:', error);
      return false;
    }
  }

  /**
   * Get payment status summary for dashboard
   */
  static async getPaymentStatusSummary(parentId: string): Promise<{
    totalPending: number;
    totalOverdue: number;
    upcomingDue: PaymentRecord[];
  }> {
    try {
      const q = query(
        collection(db, 'payments'),
        where('parentId', '==', parentId),
        where('paymentStatus', 'in', ['pending', 'partial', 'overdue'])
      );

      const querySnapshot = await getDocs(q);
      
      let totalPending = 0;
      let totalOverdue = 0;
      const upcomingDue: PaymentRecord[] = [];
      const now = new Date();
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(now.getDate() + 3);

      querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        const payment: PaymentRecord = {
          id: doc.id,
          ...data,
          paymentDate: data.paymentDate?.toDate(),
          dueDate: data.dueDate?.toDate(),
          finalPaymentDue: data.finalPaymentDue?.toDate(),
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        } as PaymentRecord;

        if (payment.paymentStatus === 'overdue') {
          totalOverdue += payment.remainingAmount;
        } else {
          totalPending += payment.remainingAmount;
        }

        // Check if payment is due within 3 days
        if (payment.finalPaymentDue && payment.finalPaymentDue <= threeDaysFromNow) {
          upcomingDue.push(payment);
        }
      });

      return {
        totalPending,
        totalOverdue,
        upcomingDue
      };
    } catch (error) {
      console.error('Error getting payment status summary:', error);
      return {
        totalPending: 0,
        totalOverdue: 0,
        upcomingDue: []
      };
    }
  }

  /**
   * Mark overdue payments
   */
  static async markOverduePayments(): Promise<void> {
    try {
      const now = new Date();
      const q = query(
        collection(db, 'payments'),
        where('paymentStatus', 'in', ['pending', 'partial']),
        where('finalPaymentDue', '<', Timestamp.fromDate(now))
      );

      const querySnapshot = await getDocs(q);
      
      for (const docRef of querySnapshot.docs) {
        await updateDoc(docRef.ref, {
          paymentStatus: 'overdue',
          updatedAt: Timestamp.fromDate(now)
        });

        // Create overdue notification
        const payment = docRef.data();
        await this.createReminder({
          paymentId: docRef.id,
          reminderType: 'overdue_payment',
          scheduledFor: now,
          status: 'scheduled',
          method: 'push_notification'
        });
      }
    } catch (error) {
      console.error('Error marking overdue payments:', error);
    }
  }
}
