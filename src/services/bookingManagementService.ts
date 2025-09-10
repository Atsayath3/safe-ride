import { 
  collection, 
  query, 
  where, 
  getDocs,
  doc,
  updateDoc,
  addDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Booking } from '../interfaces/booking';

export class BookingManagementService {
  /**
   * Get active bookings for a specific child
   */
  static async getActiveBookingsForChild(childId: string): Promise<Booking[]> {
    try {
      const now = new Date();
      
      const q = query(
        collection(db, 'bookings'),
        where('childId', '==', childId),
        where('status', 'in', ['confirmed', 'pending'])
      );
      
      const querySnapshot = await getDocs(q);
      const bookings: Booking[] = [];
      
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
      const now = new Date();
      
      const q = query(
        collection(db, 'bookings'),
        where('parentId', '==', parentId),
        where('status', 'in', ['confirmed', 'pending'])
      );
      
      const querySnapshot = await getDocs(q);
      const bookings: Booking[] = [];
      
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
    const activeBookings = await this.getActiveBookingsForChild(childId);
    return activeBookings.length > 0;
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
      const bookingRef = doc(db, 'bookings', bookingId);
      
      await updateDoc(bookingRef, {
        endDate: newEndDate,
        recurringDays: (await this.getBookingById(bookingId))?.recurringDays || 0 + additionalDays,
        totalPrice: (await this.getBookingById(bookingId))?.totalPrice || 0 + additionalPrice,
        updatedAt: new Date()
      });
      
      return true;
    } catch (error) {
      console.error('Error extending booking:', error);
      return false;
    }
  }

  /**
   * Get booking by ID
   */
  private static async getBookingById(bookingId: string): Promise<Booking | null> {
    try {
      const bookingRef = doc(db, 'bookings', bookingId);
      const bookingDoc = await getDocs(query(collection(db, 'bookings'), where('__name__', '==', bookingId)));
      
      if (!bookingDoc.empty) {
        const data = bookingDoc.docs[0].data();
        return {
          id: bookingDoc.docs[0].id,
          ...data,
          bookingDate: data.bookingDate?.toDate() || new Date(),
          rideDate: data.rideDate?.toDate() || new Date(),
          endDate: data.endDate?.toDate(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Booking;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting booking by ID:', error);
      return null;
    }
  }

  /**
   * Format booking period for display
   */
  static formatBookingPeriod(booking: Booking): string {
    if (booking.isRecurring && booking.endDate) {
      return `${booking.rideDate.toLocaleDateString()} - ${booking.endDate.toLocaleDateString()}`;
    }
    return booking.rideDate.toLocaleDateString();
  }

  /**
   * Calculate days remaining in booking
   */
  static getDaysRemaining(booking: Booking): number {
    const now = new Date();
    const endDate = booking.endDate || booking.rideDate;
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  /**
   * Get booking status with color coding
   */
  static getBookingStatusInfo(booking: Booking): { 
    status: string; 
    color: string; 
    bgColor: string;
    description: string;
  } {
    const daysRemaining = this.getDaysRemaining(booking);
    
    if (booking.status === 'pending') {
      return {
        status: 'Pending',
        color: 'text-orange-700',
        bgColor: 'bg-orange-50 border-orange-200',
        description: 'Waiting for driver confirmation'
      };
    }
    
    if (booking.status === 'confirmed') {
      if (daysRemaining <= 2) {
        return {
          status: 'Ending Soon',
          color: 'text-red-700',
          bgColor: 'bg-red-50 border-red-200',
          description: `Ends in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`
        };
      } else if (daysRemaining <= 7) {
        return {
          status: 'Active',
          color: 'text-yellow-700',
          bgColor: 'bg-yellow-50 border-yellow-200',
          description: `${daysRemaining} days remaining`
        };
      } else {
        return {
          status: 'Active',
          color: 'text-green-700',
          bgColor: 'bg-green-50 border-green-200',
          description: `${daysRemaining} days remaining`
        };
      }
    }
    
    return {
      status: 'Unknown',
      color: 'text-gray-700',
      bgColor: 'bg-gray-50 border-gray-200',
      description: 'Status unknown'
    };
  }
}
