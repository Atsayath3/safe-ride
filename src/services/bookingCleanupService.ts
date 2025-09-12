import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  deleteDoc, 
  updateDoc,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Booking } from '@/interfaces/booking';
import { NotificationService } from './notificationService';

export class BookingCleanupService {
  /**
   * Delete all bookings associated with a child and handle cleanup
   */
  static async deleteChildBookings(childId: string, childName: string): Promise<{
    deletedBookings: number;
    affectedDrivers: string[];
  }> {
    try {
      console.log(`🗑️ Starting booking cleanup for child: ${childId} (${childName})`);

      // Get all bookings for this child
      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('childId', '==', childId)
      );

      const bookingsSnapshot = await getDocs(bookingsQuery);
      const bookings: Booking[] = [];
      const affectedDrivers = new Set<string>();

      // Collect booking data and affected drivers
      bookingsSnapshot.forEach((doc) => {
        const data = doc.data();
        const booking: Booking = {
          id: doc.id,
          ...data,
          bookingDate: data.bookingDate?.toDate() || new Date(),
          rideDate: data.rideDate?.toDate() || new Date(),
          endDate: data.endDate?.toDate(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Booking;
        
        bookings.push(booking);
        affectedDrivers.add(booking.driverId);
      });

      console.log(`📋 Found ${bookings.length} bookings to clean up`);
      console.log(`👨‍💼 ${affectedDrivers.size} drivers will be affected`);

      // Notify affected drivers about booking cancellation
      for (const driverId of affectedDrivers) {
        try {
          await NotificationService.sendBookingCancellationNotification(
            driverId,
            childId,
            {
              childName,
              reason: 'Child profile deleted',
              cancelledBy: 'parent'
            }
          );
          console.log(`📧 Notified driver ${driverId} about booking cancellation`);
        } catch (notificationError) {
          console.warn(`⚠️ Failed to notify driver ${driverId}:`, notificationError);
          // Continue with cleanup even if notification fails
        }
      }

      // Handle payment records for cancelled bookings
      for (const booking of bookings) {
        try {
          await this.handlePaymentRecordCancellation(booking.id);
        } catch (paymentError) {
          console.warn(`⚠️ Failed to handle payment record for booking ${booking.id}:`, paymentError);
          // Continue with cleanup even if payment handling fails
        }
      }

      // Delete all bookings
      let deletedCount = 0;
      for (const booking of bookings) {
        try {
          await deleteDoc(doc(db, 'bookings', booking.id));
          deletedCount++;
          console.log(`✅ Deleted booking ${booking.id}`);
        } catch (deleteError) {
          console.error(`❌ Failed to delete booking ${booking.id}:`, deleteError);
        }
      }

      console.log(`🗑️ Cleanup completed: ${deletedCount}/${bookings.length} bookings deleted`);

      return {
        deletedBookings: deletedCount,
        affectedDrivers: Array.from(affectedDrivers)
      };

    } catch (error) {
      console.error('❌ Error during booking cleanup:', error);
      throw new Error(`Failed to clean up bookings for child: ${error.message}`);
    }
  }

  /**
   * Handle payment records when a booking is cancelled due to child deletion
   */
  private static async handlePaymentRecordCancellation(bookingId: string): Promise<void> {
    try {
      // Check for payment records associated with this booking
      const paymentQuery = query(
        collection(db, 'payments'),
        where('bookingId', '==', bookingId)
      );

      const paymentSnapshot = await getDocs(paymentQuery);

      for (const paymentDoc of paymentSnapshot.docs) {
        const paymentData = paymentDoc.data();
        
        // Update payment status to cancelled and add cancellation reason
        await updateDoc(doc(db, 'payments', paymentDoc.id), {
          paymentStatus: 'cancelled',
          cancellationReason: 'Child profile deleted',
          cancelledAt: Timestamp.fromDate(new Date()),
          updatedAt: Timestamp.fromDate(new Date())
        });

        console.log(`💳 Marked payment record ${paymentDoc.id} as cancelled`);
      }

      // Check for payment transactions
      const transactionQuery = query(
        collection(db, 'payment_transactions'),
        where('bookingId', '==', bookingId)
      );

      const transactionSnapshot = await getDocs(transactionQuery);

      for (const transactionDoc of transactionSnapshot.docs) {
        // Update transaction status to indicate cancellation
        await updateDoc(doc(db, 'payment_transactions', transactionDoc.id), {
          status: 'cancelled_by_deletion',
          cancellationReason: 'Child profile deleted',
          cancelledAt: Timestamp.fromDate(new Date()),
          updatedAt: Timestamp.fromDate(new Date())
        });

        console.log(`💰 Updated payment transaction ${transactionDoc.id} for cancellation`);
      }

    } catch (error) {
      console.error(`❌ Error handling payment cancellation for booking ${bookingId}:`, error);
      throw error;
    }
  }

  /**
   * Get all active bookings for a child (for preview before deletion)
   */
  static async getChildBookingsPreview(childId: string): Promise<{
    totalBookings: number;
    activeBookings: number;
    affectedDrivers: string[];
    upcomingRides: Booking[];
  }> {
    try {
      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('childId', '==', childId)
      );

      const bookingsSnapshot = await getDocs(bookingsQuery);
      const allBookings: Booking[] = [];
      const affectedDrivers = new Set<string>();
      const now = new Date();

      bookingsSnapshot.forEach((doc) => {
        const data = doc.data();
        const booking: Booking = {
          id: doc.id,
          ...data,
          bookingDate: data.bookingDate?.toDate() || new Date(),
          rideDate: data.rideDate?.toDate() || new Date(),
          endDate: data.endDate?.toDate(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Booking;
        
        allBookings.push(booking);
        affectedDrivers.add(booking.driverId);
      });

      // Filter active bookings (not completed or cancelled)
      const activeBookings = allBookings.filter(booking => 
        booking.status !== 'completed' && booking.status !== 'cancelled'
      );

      // Filter upcoming rides (future dates)
      const upcomingRides = activeBookings.filter(booking => {
        if (booking.endDate) {
          return booking.endDate > now;
        }
        return booking.rideDate > now;
      });

      return {
        totalBookings: allBookings.length,
        activeBookings: activeBookings.length,
        affectedDrivers: Array.from(affectedDrivers),
        upcomingRides
      };

    } catch (error) {
      console.error('❌ Error getting booking preview for child:', error);
      return {
        totalBookings: 0,
        activeBookings: 0,
        affectedDrivers: [],
        upcomingRides: []
      };
    }
  }
}