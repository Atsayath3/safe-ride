import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Booking, BookingRequest, DriverAvailability } from '@/interfaces/booking';
import { UserProfile } from '@/contexts/AuthContext';

export class BookingService {
  static async getAvailableDrivers(childLocation?: { pickup: { lat: number; lng: number }, school: { lat: number; lng: number } }): Promise<UserProfile[]> {
    try {
      const driversRef = collection(db, 'users');
      const q = query(
        driversRef, 
        where('role', '==', 'driver'),
        where('status', '==', 'approved'),
        where('profileComplete', '==', true),
        where('bookingOpen', '==', true)
      );
      
      const snapshot = await getDocs(q);
      const drivers = snapshot.docs.map(doc => ({
        ...doc.data(),
        uid: doc.id,
        createdAt: doc.data().createdAt?.toDate(),
      })) as UserProfile[];

      // Filter drivers with availability, routes, and booking open
      const availableDrivers = [];
      for (const driver of drivers) {
        // Check if driver has routes set
        if (!driver.routes?.startPoint || !driver.routes?.endPoint) {
          continue;
        }

        // Check availability
        const availability = await this.getDriverAvailability(driver.uid);
        if (availability.availableSeats <= 0) {
          continue;
        }

        // If child location provided, check route compatibility
        if (childLocation) {
          const routeCompatible = this.isRouteCompatible(
            childLocation,
            { startPoint: driver.routes.startPoint, endPoint: driver.routes.endPoint }
          );
          if (!routeCompatible) {
            continue;
          }
        }

        availableDrivers.push(driver);
      }

      return availableDrivers;
    } catch (error) {
      console.error('Error fetching available drivers:', error);
      throw error;
    }
  }

  static isRouteCompatible(
    childLocation: { pickup: { lat: number; lng: number }, school: { lat: number; lng: number } },
    driverRoute: { startPoint: { lat: number; lng: number }, endPoint: { lat: number; lng: number } }
  ): boolean {
    // Calculate distance between child pickup and driver start (should be close)
    const pickupDistance = this.calculateDistance(childLocation.pickup, driverRoute.startPoint);
    
    // Calculate distance between child school and driver end (should be close)
    const schoolDistance = this.calculateDistance(childLocation.school, driverRoute.endPoint);
    
    // Consider compatible if both distances are within 10km
    return pickupDistance <= 10 && schoolDistance <= 10;
  }

  static calculateDistance(point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLon = (point2.lng - point1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  static async getDriverAvailability(driverId: string): Promise<DriverAvailability> {
    try {
      // Get driver profile to get vehicle capacity
      const driversRef = collection(db, 'users');
      const driverQuery = query(driversRef, where('uid', '==', driverId));
      const driverSnapshot = await getDocs(driverQuery);
      
      if (driverSnapshot.empty) {
        throw new Error('Driver not found');
      }

      const driverData = driverSnapshot.docs[0].data() as UserProfile;
      const totalSeats = parseInt(driverData.vehicle?.capacity || '0');

      // Get current bookings for this driver
      const bookingsRef = collection(db, 'bookings');
      const bookingsQuery = query(
        bookingsRef,
        where('driverId', '==', driverId),
        where('status', 'in', ['pending', 'confirmed'])
      );
      
      const bookingsSnapshot = await getDocs(bookingsQuery);
      const bookedSeats = bookingsSnapshot.size;

      return {
        driverId,
        totalSeats,
        bookedSeats,
        availableSeats: totalSeats - bookedSeats,
        isActive: driverData.status === 'approved'
      };
    } catch (error) {
      console.error('Error getting driver availability:', error);
      throw error;
    }
  }

  static async createBooking(bookingRequest: BookingRequest): Promise<string> {
    try {
      const bookingData: Omit<Booking, 'id'> = {
        ...bookingRequest,
        status: 'pending',
        bookingDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await addDoc(collection(db, 'bookings'), {
        ...bookingData,
        bookingDate: Timestamp.fromDate(bookingData.bookingDate),
        rideDate: Timestamp.fromDate(bookingData.rideDate),
        createdAt: Timestamp.fromDate(bookingData.createdAt),
        updatedAt: Timestamp.fromDate(bookingData.updatedAt),
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  }

  static async getParentBookings(parentId: string): Promise<Booking[]> {
    try {
      const bookingsRef = collection(db, 'bookings');
      const q = query(
        bookingsRef,
        where('parentId', '==', parentId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        bookingDate: doc.data().bookingDate?.toDate(),
        rideDate: doc.data().rideDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Booking[];
    } catch (error) {
      console.error('Error fetching parent bookings:', error);
      throw error;
    }
  }

  static async getDriverBookings(driverId: string): Promise<Booking[]> {
    try {
      const bookingsRef = collection(db, 'bookings');
      const q = query(
        bookingsRef,
        where('driverId', '==', driverId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        bookingDate: doc.data().bookingDate?.toDate(),
        rideDate: doc.data().rideDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Booking[];
    } catch (error) {
      console.error('Error fetching driver bookings:', error);
      throw error;
    }
  }

  static async updateBookingStatus(bookingId: string, status: Booking['status']): Promise<void> {
    try {
      const bookingRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingRef, {
        status,
        updatedAt: Timestamp.fromDate(new Date())
      });
    } catch (error) {
      console.error('Error updating booking status:', error);
      throw error;
    }
  }
}