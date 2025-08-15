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
      console.log('🔍 Searching for available drivers...');
      console.log('Child location:', childLocation);
      
      const driversRef = collection(db, 'drivers');
      const q = query(
        driversRef, 
        where('role', '==', 'driver'),
        where('status', '==', 'approved')
      );
      
      const snapshot = await getDocs(q);
      const drivers = snapshot.docs.map(doc => ({
        ...doc.data(),
        uid: doc.id,
        createdAt: doc.data().createdAt?.toDate(),
      })) as UserProfile[];

      console.log(`📊 Found ${drivers.length} potential drivers from query`);

      // Filter drivers with availability and basic requirements
      const availableDrivers = [];
      for (const driver of drivers) {
        console.log(`🚗 Checking driver: ${driver.firstName} ${driver.lastName} (${driver.uid})`);
        
        // Check if booking is open (skip if not set - default to available)
        if (driver.bookingOpen === false) {
          console.log(`❌ Driver ${driver.firstName} has booking closed`);
          continue;
        }
        console.log(`✅ Driver ${driver.firstName} booking status: ${driver.bookingOpen ? 'open' : 'closed or not set'}`);

        // Check availability (skip if no vehicle capacity set)
        if (driver.vehicle?.capacity) {
          const availability = await this.getDriverAvailability(driver.uid);
          console.log(`🪑 Driver ${driver.firstName} availability:`, availability);
          if (availability.availableSeats <= 0) {
            console.log(`❌ Driver ${driver.firstName} has no available seats`);
            continue;
          }
        } else {
          console.log(`⚠️ Driver ${driver.firstName} has no vehicle capacity set - assuming available`);
        }

        // If child location provided and driver has routes, check route compatibility
        if (childLocation && driver.routes?.startPoint && driver.routes?.endPoint) {
          const routeCompatible = this.isRouteCompatible(
            childLocation,
            { startPoint: driver.routes.startPoint, endPoint: driver.routes.endPoint }
          );
          console.log(`🗺️ Route compatibility for ${driver.firstName}:`, routeCompatible);
          if (!routeCompatible) {
            console.log(`❌ Driver ${driver.firstName} route not compatible`);
            continue;
          }
        } else if (driver.routes?.startPoint && driver.routes?.endPoint) {
          console.log(`✅ Driver ${driver.firstName} has routes set`);
        } else {
          console.log(`⚠️ Driver ${driver.firstName} has no routes set - still including as available`);
        }

        console.log(`✅ Driver ${driver.firstName} is available!`);
        availableDrivers.push(driver);
      }

      console.log(`🎯 Final available drivers: ${availableDrivers.length}`);
      
      // If no drivers found with route matching, try without location filtering
      if (availableDrivers.length === 0 && childLocation) {
        console.log('🔄 No route-compatible drivers found, searching without location filtering...');
        return await this.getAvailableDrivers(); // Call without childLocation
      }
      
      return availableDrivers;
    } catch (error) {
      console.error('❌ Error fetching available drivers:', error);
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
    
    console.log(`📏 Distance calculations:`);
    console.log(`  Pickup distance: ${pickupDistance.toFixed(2)}km (limit: 20km)`);
    console.log(`  School distance: ${schoolDistance.toFixed(2)}km (limit: 20km)`);
    
    // Consider compatible if both distances are within 20km (increased from 10km)
    const compatible = pickupDistance <= 20 && schoolDistance <= 20;
    console.log(`  Compatible: ${compatible}`);
    
    return compatible;
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
      const driversRef = collection(db, 'drivers');
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

      // Prepare data for Firestore with proper Timestamp conversion
      const firestoreData: any = {
        ...bookingData,
        bookingDate: Timestamp.fromDate(bookingData.bookingDate),
        rideDate: Timestamp.fromDate(bookingData.rideDate),
        createdAt: Timestamp.fromDate(bookingData.createdAt),
        updatedAt: Timestamp.fromDate(bookingData.updatedAt),
      };

      // Convert endDate if it exists (for period bookings)
      if (bookingData.endDate) {
        firestoreData.endDate = Timestamp.fromDate(bookingData.endDate);
      }

      const docRef = await addDoc(collection(db, 'bookings'), firestoreData);

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
      console.log('📋 Fetching bookings for driver:', driverId);
      
      const bookingsRef = collection(db, 'bookings');
      
      // First try with orderBy, fallback without it if there's an index error
      let q;
      try {
        q = query(
          bookingsRef,
          where('driverId', '==', driverId),
          orderBy('createdAt', 'desc')
        );
        
        const snapshot = await getDocs(q);
        console.log(`📋 Found ${snapshot.docs.length} bookings with orderBy`);
        
        return snapshot.docs.map(doc => {
          const data = doc.data() as any;
          return {
            id: doc.id,
            ...data,
            bookingDate: data.bookingDate?.toDate(),
            rideDate: data.rideDate?.toDate(),
            endDate: data.endDate?.toDate(), // Handle period booking end date
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
          };
        }) as Booking[];
      } catch (indexError) {
        console.warn('📋 OrderBy query failed, trying without orderBy:', indexError);
        
        // Fallback query without orderBy
        q = query(
          bookingsRef,
          where('driverId', '==', driverId)
        );
        
        const snapshot = await getDocs(q);
        console.log(`📋 Found ${snapshot.docs.length} bookings without orderBy`);
        
        const bookings = snapshot.docs.map(doc => {
          const data = doc.data() as any;
          return {
            id: doc.id,
            ...data,
            bookingDate: data.bookingDate?.toDate(),
            rideDate: data.rideDate?.toDate(),
            endDate: data.endDate?.toDate(), // Handle period booking end date
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
          };
        }) as Booking[];
        
        // Sort manually by createdAt in descending order
        return bookings.sort((a, b) => {
          if (!a.createdAt || !b.createdAt) return 0;
          return b.createdAt.getTime() - a.createdAt.getTime();
        });
      }
    } catch (error) {
      console.error('❌ Error fetching driver bookings:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        driverId
      });
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