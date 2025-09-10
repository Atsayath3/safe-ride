import { ComprehensivePaymentService } from './comprehensivePaymentService';
import { PaymentTransactionRecord } from '../interfaces/payment';

export class PaymentSchedulerService {
  /**
   * Send payment reminder notifications
   */
  static async sendPaymentReminders(): Promise<void> {
    try {
      const overduePayments = await ComprehensivePaymentService.getOverduePayments();
      const now = new Date();
      
      for (const payment of overduePayments) {
        const daysUntilDue = Math.ceil((payment.balanceDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        // Send 3-day reminder
        if (daysUntilDue <= 3 && daysUntilDue > 1 && !payment.remindersSent.threeDays) {
          await this.sendThreeDayReminder(payment);
          await ComprehensivePaymentService.markReminderSent(payment.id!, 'threeDays');
        }
        
        // Send 1-day reminder
        if (daysUntilDue <= 1 && daysUntilDue > 0 && !payment.remindersSent.oneDay) {
          await this.sendOneDayReminder(payment);
          await ComprehensivePaymentService.markReminderSent(payment.id!, 'oneDay');
        }
      }
    } catch (error) {
      console.error('Error sending payment reminders:', error);
    }
  }

  /**
   * Send 3-day reminder notification
   */
  private static async sendThreeDayReminder(payment: PaymentTransactionRecord): Promise<void> {
    try {
      const remainingAmount = payment.totalAmount - payment.upfrontPaid;
      
      // Mock notification service - replace with actual implementation
      console.log(`Sending 3-day reminder to parent ${payment.parentId}:`);
      console.log(`Balance payment of Rs.${remainingAmount} is due in 3 days for booking ${payment.bookingId}`);
      
      // In production, integrate with notification service:
      // - Send email
      // - Send push notification
      // - Send SMS
      
    } catch (error) {
      console.error('Error sending 3-day reminder:', error);
    }
  }

  /**
   * Send 1-day reminder notification
   */
  private static async sendOneDayReminder(payment: PaymentTransactionRecord): Promise<void> {
    try {
      const remainingAmount = payment.totalAmount - payment.upfrontPaid;
      
      // Mock notification service - replace with actual implementation
      console.log(`Sending 1-day reminder to parent ${payment.parentId}:`);
      console.log(`URGENT: Balance payment of Rs.${remainingAmount} is due tomorrow for booking ${payment.bookingId}`);
      
      // In production, integrate with notification service:
      // - Send urgent email
      // - Send push notification
      // - Send SMS
      
    } catch (error) {
      console.error('Error sending 1-day reminder:', error);
    }
  }

  /**
   * Process daily scheduler tasks
   */
  static async runDailyTasks(): Promise<void> {
    try {
      console.log('Running daily payment scheduler tasks...');
      
      // Send payment reminders
      await this.sendPaymentReminders();
      
      // Suspend overdue bookings
      await ComprehensivePaymentService.suspendOverdueBookings();
      
      console.log('Daily payment scheduler tasks completed');
    } catch (error) {
      console.error('Error running daily scheduler tasks:', error);
    }
  }

  /**
   * Process weekly scheduler tasks
   */
  static async runWeeklyTasks(): Promise<void> {
    try {
      console.log('Running weekly payment scheduler tasks...');
      
      // Process weekly payouts to drivers
      const payoutBatch = await ComprehensivePaymentService.processWeeklyPayouts();
      
      console.log(`Weekly payout batch created: ${payoutBatch.id}`);
      console.log(`Total payout amount: Rs.${payoutBatch.totalAmount}`);
      console.log(`Drivers receiving payouts: ${payoutBatch.driverIds.length}`);
      
      console.log('Weekly payment scheduler tasks completed');
    } catch (error) {
      console.error('Error running weekly scheduler tasks:', error);
    }
  }

  /**
   * Initialize scheduler (in production, use a proper cron job service)
   */
  static initializeScheduler(): void {
    // Run daily tasks every day at 9 AM
    setInterval(async () => {
      const now = new Date();
      if (now.getHours() === 9 && now.getMinutes() === 0) {
        await this.runDailyTasks();
      }
    }, 60000); // Check every minute

    // Run weekly tasks every Monday at 10 AM
    setInterval(async () => {
      const now = new Date();
      if (now.getDay() === 1 && now.getHours() === 10 && now.getMinutes() === 0) {
        await this.runWeeklyTasks();
      }
    }, 60000); // Check every minute
  }
}
