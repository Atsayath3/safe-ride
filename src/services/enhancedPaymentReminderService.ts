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
  Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { EnhancedPaymentReminder, EnhancedPaymentTransaction } from '../interfaces/payment';
import { NotificationService } from './notificationService';

export class EnhancedPaymentReminderService {
  
  // Send payment reminder
  static async sendPaymentReminder(
    paymentTransaction: EnhancedPaymentTransaction,
    reminderType: '3days' | '1day' | 'overdue'
  ): Promise<boolean> {
    try {
      const reminder: EnhancedPaymentReminder = {
        bookingId: paymentTransaction.bookingId,
        parentId: paymentTransaction.parentId,
        driverId: paymentTransaction.driverId,
        reminderType,
        sentAt: new Date(),
        status: 'sent',
        notificationChannels: ['email', 'push']
      };

      // Create reminder record
      await addDoc(collection(db, 'payment_reminders'), {
        ...reminder,
        sentAt: serverTimestamp()
      });

      // Send notifications
      await this.sendReminderNotifications(paymentTransaction, reminderType);

      // Update payment transaction reminder status
      const updateField = reminderType === '3days' ? 'remindersSent.threeDays' : 'remindersSent.oneDay';
      if (reminderType !== 'overdue') {
        await updateDoc(doc(db, 'payment_transactions', paymentTransaction.id!), {
          [updateField]: true,
          updatedAt: serverTimestamp()
        });
      }

      return true;
    } catch (error) {
      console.error('Error sending payment reminder:', error);
      return false;
    }
  }

  // Send reminder notifications
  private static async sendReminderNotifications(
    paymentTransaction: EnhancedPaymentTransaction,
    reminderType: '3days' | '1day' | 'overdue'
  ): Promise<void> {
    const remainingAmount = paymentTransaction.totalAmount - paymentTransaction.upfrontPaid - paymentTransaction.balancePaid;
    const daysText = reminderType === '3days' ? '3 days' : reminderType === '1day' ? '1 day' : '0 days (overdue)';
    
    let title: string;
    let message: string;

    switch (reminderType) {
      case '3days':
        title = 'Payment Reminder - 3 Days Left';
        message = `Your balance payment of Rs.${remainingAmount.toFixed(2)} is due in 3 days. Please complete your payment to avoid booking suspension.`;
        break;
      case '1day':
        title = 'Urgent: Payment Due Tomorrow';
        message = `Your balance payment of Rs.${remainingAmount.toFixed(2)} is due tomorrow! Please complete your payment immediately to avoid booking suspension.`;
        break;
      case 'overdue':
        title = 'Payment Overdue - Booking Suspended';
        message = `Your payment of Rs.${remainingAmount.toFixed(2)} is overdue. Your booking has been suspended. Please contact support.`;
        break;
    }

    // Send push notification to parent
    try {
      // Send in-app notification (we'll need to create a public method or use existing methods)
      console.log(`Payment reminder sent: ${title} - ${message}`);
      
      // You would integrate with your notification system here
      // For now, we'll log the notification
    } catch (error) {
      console.error('Error sending push notification:', error);
    }

    // Send email notification (if email service is available)
    try {
      // This would integrate with your email service
      console.log(`Email reminder sent: ${title} - ${message}`);
    } catch (error) {
      console.error('Error sending email notification:', error);
    }
  }

  // Check for due payments and send reminders
  static async checkAndSendReminders(): Promise<void> {
    try {
      const now = new Date();
      const threeDaysFromNow = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));
      const oneDayFromNow = new Date(now.getTime() + (1 * 24 * 60 * 60 * 1000));

      // Get all partial payments
      const q = query(
        collection(db, 'payment_transactions'),
        where('status', '==', 'partial')
      );
      
      const querySnapshot = await getDocs(q);
      
      for (const docSnap of querySnapshot.docs) {
        const transaction = {
          id: docSnap.id,
          ...docSnap.data(),
          transactionDate: docSnap.data().transactionDate?.toDate() || new Date(),
          balanceDueDate: docSnap.data().balanceDueDate?.toDate() || new Date(),
          createdAt: docSnap.data().createdAt?.toDate() || new Date(),
          updatedAt: docSnap.data().updatedAt?.toDate() || new Date()
        } as EnhancedPaymentTransaction;

        const dueDate = transaction.balanceDueDate;
        
        // Check if payment is overdue
        if (now > dueDate && transaction.status !== 'suspended') {
          await this.sendPaymentReminder(transaction, 'overdue');
          // Suspend the booking
          await import('./enhancedPaymentService').then(module => 
            module.EnhancedPaymentService.suspendBookingForNonPayment(transaction.bookingId)
          );
        }
        // Check if 1 day reminder needed
        else if (!transaction.remindersSent.oneDay && this.isSameDay(oneDayFromNow, dueDate)) {
          await this.sendPaymentReminder(transaction, '1day');
        }
        // Check if 3 day reminder needed
        else if (!transaction.remindersSent.threeDays && this.isSameDay(threeDaysFromNow, dueDate)) {
          await this.sendPaymentReminder(transaction, '3days');
        }
      }
    } catch (error) {
      console.error('Error checking and sending reminders:', error);
    }
  }

  // Check if two dates are the same day
  private static isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  // Get reminders for a booking
  static async getRemindersForBooking(bookingId: string): Promise<EnhancedPaymentReminder[]> {
    try {
      const q = query(
        collection(db, 'payment_reminders'),
        where('bookingId', '==', bookingId),
        orderBy('sentAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        sentAt: doc.data().sentAt?.toDate() || new Date()
      })) as EnhancedPaymentReminder[];
    } catch (error) {
      console.error('Error getting reminders for booking:', error);
      return [];
    }
  }

  // Schedule reminder check (this would be called by a cron job or cloud function)
  static async scheduleReminderCheck(): Promise<void> {
    // This would typically be implemented as a cloud function that runs daily
    console.log('Scheduling payment reminder check...');
    
    // For development, you could set up a periodic check
    setInterval(() => {
      this.checkAndSendReminders().catch(console.error);
    }, 24 * 60 * 60 * 1000); // Check daily
  }
}
