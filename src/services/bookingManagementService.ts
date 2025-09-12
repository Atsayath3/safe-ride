import { 
  collection, 
  doc, 
  getDocs, 
  updateDoc, 
  query, 
  where, 
  getDoc,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Booking } from '@/interfaces/booking';

export class BookingManagementService {
  /**
   * Get active bookings for a specific child
   */
  static async getActiveBookingsForChild(childId: string): Promise<Booking[]> {
    try {
      const bookingsRef = collection(db, 'bookings');
      const q = query(
        bookingsRef,
        where('childId', '==', childId),
        where('status', 'in', ['confirmed', 'pending'])
      );
      
      const querySnapshot = await getDocs(q);
      const bookings: Booking[] = [];
      const now = new Date();
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const booking: Booking = {
          ...data,
          id: doc.id,
          bookingDate: data.bookingDate?.toDate() || new Date(),
          rideDate: data.rideDate?.toDate() || new Date(),
          endDate: data.endDate?.toDate(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Booking;
        
        // Only include bookings that haven't ended yet
        if (booking.endDate && booking.endDate > now) {
          bookings.push(booking);
        } else if (!booking.endDate && booking.rideDate > now) {
          bookings.push(booking);
        }
      });
      
      return bookings.sort((a, b) => a.rideDate.getTime() - b.rideDate.getTime());
    } catch (error) {
      console.error('Error getting active bookings for child:', error);
      return [];
    }
  }

  /**
   * Get all active bookings for a parent
   */
  static async getActiveBookingsForParent(parentId: string): Promise<Booking[]> {
    try {
      const bookingsRef = collection(db, 'bookings');
      const q = query(
        bookingsRef,
        where('parentId', '==', parentId),
        where('status', 'in', ['confirmed', 'pending'])
      );
      
      const querySnapshot = await getDocs(q);
      const bookings: Booking[] = [];
      const now = new Date();
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const booking: Booking = {
          ...data,
          id: doc.id,
          bookingDate: data.bookingDate?.toDate() || new Date(),
          rideDate: data.rideDate?.toDate() || new Date(),
          endDate: data.endDate?.toDate(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Booking;
        
        // Only include bookings that haven't ended yet
        if (booking.endDate && booking.endDate > now) {
          bookings.push(booking);
        } else if (!booking.endDate && booking.rideDate > now) {
          bookings.push(booking);
        }
      });
      
      return bookings.sort((a, b) => a.rideDate.getTime() - b.rideDate.getTime());
    } catch (error) {
      console.error('Error getting active bookings for parent:', error);
      return [];
    }
  }

  /**
   * Check if a child has any active bookings
   */
  static async hasActiveBooking(childId: string): Promise<boolean> {
    const bookings = await this.getActiveBookingsForChild(childId);
    return bookings.length > 0;
  }

  /**
   * Extend an existing booking
   */
  static async extendBooking(
    bookingId: string, 
    newEndDate: Date,
    additionalDays: number,
    additionalPrice: number
  ): Promise<boolean> {
    try {
      console.log('📅 Extending booking:', { bookingId, newEndDate, additionalDays, additionalPrice });
      
      const bookingRef = doc(db, 'bookings', bookingId);
      console.log('📄 Fetching booking document...');
      
      const bookingDoc = await getDoc(bookingRef);
      
      if (!bookingDoc.exists()) {
        console.error('❌ Booking not found:', bookingId);
        throw new Error('Booking not found');
      }
      
      const currentBooking = bookingDoc.data();
      console.log('📊 Current booking data:', currentBooking);
      
      const currentRecurringDays = currentBooking.recurringDays || 0;
      const currentTotalPrice = currentBooking.totalPrice || 0;
      
      const updateData = {
        endDate: Timestamp.fromDate(newEndDate),
        recurringDays: currentRecurringDays + additionalDays,
        totalPrice: currentTotalPrice + additionalPrice,
        updatedAt: Timestamp.now()
      };
      
      console.log('📝 Updating booking with:', updateData);
      
      await updateDoc(bookingRef, updateData);
      
      console.log('✅ Booking extended successfully');
      return true;
    } catch (error) {
      console.error('❌ Error extending booking:', error);
      return false;
    }
  }

  /**
   * Get booking by ID
   */
  static async getBookingById(bookingId: string): Promise<Booking | null> {
    try {
      const bookingRef = doc(db, 'bookings', bookingId);
      const bookingDoc = await getDoc(bookingRef);
      
      if (!bookingDoc.exists()) {
        return null;
      }
      
      const data = bookingDoc.data();
      return {
        ...data,
        id: bookingDoc.id,
        bookingDate: data.bookingDate?.toDate() || new Date(),
        rideDate: data.rideDate?.toDate() || new Date(),
        endDate: data.endDate?.toDate(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Booking;
    } catch (error) {
      console.error('Error getting booking by ID:', error);
      return null;
    }
  }

  /**
   * Format booking period for display
   */
  static formatBookingPeriod(booking: Booking): string {
    if (booking.endDate) {
      return `${booking.rideDate.toLocaleDateString()} - ${booking.endDate.toLocaleDateString()}`;
    }
    return booking.rideDate.toLocaleDateString();
  }

  /**
   * Get days remaining in booking
   */
  static getDaysRemaining(booking: Booking): number {
    const now = new Date();
    const endDate = booking.endDate || booking.rideDate;
    const diffTime = endDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  /**
   * Get booking status information for display
   */
  static getBookingStatusInfo(booking: Booking): {
    status: string;
    description: string;
    color: string;
    bgColor: string;
  } {
    const daysRemaining = this.getDaysRemaining(booking);
    
    if (booking.status === 'pending') {
      return {
        status: 'Pending Confirmation',
        description: 'Waiting for driver to accept the booking',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50 border-yellow-200'
      };
    }
    
    if (booking.status === 'confirmed') {
      if (daysRemaining <= 3) {
        return {
          status: 'Ending Soon',
          description: `Only ${daysRemaining} days remaining`,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50 border-orange-200'
        };
      }
      return {
        status: 'Active',
        description: `${daysRemaining} days remaining`,
        color: 'text-green-600',
        bgColor: 'bg-green-50 border-green-200'
      };
    }
    
    return {
      status: booking.status,
      description: 'Booking status',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50 border-gray-200'
    };
  }
}
