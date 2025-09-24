import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy,
  limit,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { TrustedDriver, DriverRating } from '../interfaces/personalization';

export class TrustedDriverService {
  
  // Add driver to trusted network
  static async addTrustedDriver(parentId: string, driverData: Omit<TrustedDriver, 'id' | 'createdAt' | 'lastRideDate' | 'totalRides' | 'rating'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'trustedDrivers'), {
        ...driverData,
        parentId,
        totalRides: 0,
        rating: 0,
        createdAt: Timestamp.now(),
        lastRideDate: Timestamp.now()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding trusted driver:', error);
      throw error;
    }
  }

  // Get trusted drivers for parent
  static async getTrustedDrivers(parentId: string, filters?: {
    isPreferred?: boolean;
    isPriority?: boolean;
    minRating?: number;
    available?: boolean;
  }): Promise<TrustedDriver[]> {
    try {
      let q = query(
        collection(db, 'trustedDrivers'),
        where('parentId', '==', parentId),
        orderBy('rating', 'desc')
      );
      
      const snapshot = await getDocs(q);
      let drivers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        lastRideDate: doc.data().lastRideDate.toDate()
      } as TrustedDriver));
      
      // Apply filters
      if (filters) {
        if (filters.isPreferred !== undefined) {
          drivers = drivers.filter(d => d.isPreferred === filters.isPreferred);
        }
        if (filters.isPriority !== undefined) {
          drivers = drivers.filter(d => d.isPriority === filters.isPriority);
        }
        if (filters.minRating !== undefined) {
          drivers = drivers.filter(d => d.rating >= filters.minRating);
        }
        if (filters.available !== undefined) {
          // Check if driver is available today
          const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
          drivers = drivers.filter(d => {
            const todaySchedule = d.availability[today as keyof typeof d.availability];
            return todaySchedule && todaySchedule.length > 0;
          });
        }
      }
      
      return drivers;
    } catch (error) {
      console.error('Error fetching trusted drivers:', error);
      throw error;
    }
  }

  // Get specific trusted driver
  static async getTrustedDriver(parentId: string, driverId: string): Promise<TrustedDriver | null> {
    try {
      const q = query(
        collection(db, 'trustedDrivers'),
        where('parentId', '==', parentId),
        where('driverId', '==', driverId)
      );
      
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      
      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        lastRideDate: doc.data().lastRideDate.toDate()
      } as TrustedDriver;
    } catch (error) {
      console.error('Error fetching trusted driver:', error);
      return null;
    }
  }

  // Update trusted driver
  static async updateTrustedDriver(trustedDriverId: string, updates: Partial<TrustedDriver>): Promise<void> {
    try {
      const driverRef = doc(db, 'trustedDrivers', trustedDriverId);
      await updateDoc(driverRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating trusted driver:', error);
      throw error;
    }
  }

  // Remove trusted driver
  static async removeTrustedDriver(trustedDriverId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'trustedDrivers', trustedDriverId));
    } catch (error) {
      console.error('Error removing trusted driver:', error);
      throw error;
    }
  }

  // Rate a driver after ride
  static async rateDriver(ratingData: Omit<DriverRating, 'id' | 'createdAt'>): Promise<string> {
    try {
      // Add the rating
      const docRef = await addDoc(collection(db, 'driverRatings'), {
        ...ratingData,
        createdAt: Timestamp.now()
      });

      // Update trusted driver's rating and ride count
      await this.updateDriverRatingStats(ratingData.parentId, ratingData.driverId);
      
      return docRef.id;
    } catch (error) {
      console.error('Error rating driver:', error);
      throw error;
    }
  }

  // Update driver's overall rating and stats
  private static async updateDriverRatingStats(parentId: string, driverId: string): Promise<void> {
    try {
      // Get all ratings for this driver from this parent
      const ratingsQuery = query(
        collection(db, 'driverRatings'),
        where('parentId', '==', parentId),
        where('driverId', '==', driverId)
      );
      
      const ratingsSnapshot = await getDocs(ratingsQuery);
      const ratings = ratingsSnapshot.docs.map(doc => doc.data() as DriverRating);
      
      if (ratings.length === 0) return;
      
      // Calculate average rating
      const averageRating = ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratings.length;
      
      // Get trusted driver record
      const trustedDriver = await this.getTrustedDriver(parentId, driverId);
      if (trustedDriver) {
        await this.updateTrustedDriver(trustedDriver.id, {
          rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
          totalRides: ratings.length,
          lastRideDate: new Date()
        });
      }
    } catch (error) {
      console.error('Error updating driver rating stats:', error);
    }
  }

  // Get driver ratings
  static async getDriverRatings(parentId: string, driverId: string): Promise<DriverRating[]> {
    try {
      const q = query(
        collection(db, 'driverRatings'),
        where('parentId', '==', parentId),
        where('driverId', '==', driverId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate()
      } as DriverRating));
    } catch (error) {
      console.error('Error fetching driver ratings:', error);
      throw error;
    }
  }

  // Get recommended drivers based on ratings and preferences
  static async getRecommendedDrivers(parentId: string, criteria?: {
    timeSlot?: string;
    route?: string;
    specialty?: string;
  }): Promise<TrustedDriver[]> {
    try {
      const trustedDrivers = await this.getTrustedDrivers(parentId, {
        minRating: 4.0
      });
      
      let recommended = trustedDrivers.filter(driver => driver.rating >= 4.0);
      
      // Apply criteria filters
      if (criteria) {
        if (criteria.timeSlot) {
          const day = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
          recommended = recommended.filter(driver => {
            const daySchedule = driver.availability[day as keyof typeof driver.availability];
            return daySchedule?.some(slot => slot.includes(criteria.timeSlot!));
          });
        }
        
        if (criteria.specialty) {
          recommended = recommended.filter(driver => 
            driver.specialties.some(specialty => 
              specialty.toLowerCase().includes(criteria.specialty!.toLowerCase())
            )
          );
        }
      }
      
      // Sort by rating, then by total rides, then by recency
      return recommended.sort((a, b) => {
        if (b.rating !== a.rating) return b.rating - a.rating;
        if (b.totalRides !== a.totalRides) return b.totalRides - a.totalRides;
        return b.lastRideDate.getTime() - a.lastRideDate.getTime();
      });
    } catch (error) {
      console.error('Error getting recommended drivers:', error);
      throw error;
    }
  }

  // Set driver preference
  static async setDriverPreference(parentId: string, driverId: string, isPreferred: boolean): Promise<void> {
    try {
      const trustedDriver = await this.getTrustedDriver(parentId, driverId);
      if (trustedDriver) {
        await this.updateTrustedDriver(trustedDriver.id, { isPreferred });
      }
    } catch (error) {
      console.error('Error setting driver preference:', error);
      throw error;
    }
  }

  // Set driver priority (for emergencies)
  static async setDriverPriority(parentId: string, driverId: string, isPriority: boolean): Promise<void> {
    try {
      const trustedDriver = await this.getTrustedDriver(parentId, driverId);
      if (trustedDriver) {
        await this.updateTrustedDriver(trustedDriver.id, { isPriority });
      }
    } catch (error) {
      console.error('Error setting driver priority:', error);
      throw error;
    }
  }

  // Get driver statistics for parent dashboard
  static async getDriverNetworkStats(parentId: string): Promise<{
    totalTrustedDrivers: number;
    preferredDrivers: number;
    priorityDrivers: number;
    averageRating: number;
    topRatedDrivers: TrustedDriver[];
    recentlyUsedDrivers: TrustedDriver[];
  }> {
    try {
      const trustedDrivers = await this.getTrustedDrivers(parentId);
      
      const totalTrustedDrivers = trustedDrivers.length;
      const preferredDrivers = trustedDrivers.filter(d => d.isPreferred).length;
      const priorityDrivers = trustedDrivers.filter(d => d.isPriority).length;
      
      const averageRating = trustedDrivers.length > 0 
        ? trustedDrivers.reduce((sum, driver) => sum + driver.rating, 0) / trustedDrivers.length
        : 0;
      
      const topRatedDrivers = trustedDrivers
        .filter(d => d.rating >= 4.5)
        .slice(0, 5);
      
      const recentlyUsedDrivers = trustedDrivers
        .sort((a, b) => b.lastRideDate.getTime() - a.lastRideDate.getTime())
        .slice(0, 5);
      
      return {
        totalTrustedDrivers,
        preferredDrivers,
        priorityDrivers,
        averageRating: Math.round(averageRating * 10) / 10,
        topRatedDrivers,
        recentlyUsedDrivers
      };
    } catch (error) {
      console.error('Error getting driver network stats:', error);
      throw error;
    }
  }

  // Check if driver is available at specific time
  static checkDriverAvailability(driver: TrustedDriver, dateTime: Date): boolean {
    const dayOfWeek = dateTime.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const timeSlot = dateTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    
    const daySchedule = driver.availability[dayOfWeek as keyof typeof driver.availability];
    if (!daySchedule || daySchedule.length === 0) return false;
    
    // Check if the time slot overlaps with any available slots
    return daySchedule.some(slot => {
      const [start, end] = slot.split('-');
      const requestTime = dateTime.getHours() * 60 + dateTime.getMinutes();
      const startTime = this.parseTimeToMinutes(start);
      const endTime = this.parseTimeToMinutes(end);
      
      return requestTime >= startTime && requestTime <= endTime;
    });
  }

  private static parseTimeToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }
}