import { 
  collection, 
  doc, 
  getDoc,
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ActiveRide, RideChild } from '@/interfaces/ride';
import { Booking } from '@/interfaces/booking';
import { Child } from '@/pages/parent/ParentDashboard';

export class RideService {
  
  /**
   * Start a new ride for today and get assigned children
   */
  static async startRide(driverId: string): Promise<ActiveRide> {
    try {
      console.log('Starting ride for driver:', driverId);
      
      // Get today's date in YYYY-MM-DD format
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Get all confirmed bookings for this driver for today
      // Use simple query to avoid composite index requirements
      console.log('Querying bookings by driverId only...');
      
      const simplifiedQuery = query(
        collection(db, 'bookings'),
        where('driverId', '==', driverId)
      );
      
      const allBookingsSnapshot = await getDocs(simplifiedQuery);
      console.log('Found', allBookingsSnapshot.size, 'total bookings for driver');
      
      // Filter by status and date in memory
      const todayConfirmedBookings = allBookingsSnapshot.docs.filter(doc => {
        const data = doc.data();
        
        // Check status first
        if (data.status !== 'confirmed') {
          return false;
        }
        
        // Check date
        let rideDate;
        
        if (data.rideDate?.toDate) {
          rideDate = data.rideDate.toDate();
        } else if (typeof data.rideDate === 'string') {
          rideDate = new Date(data.rideDate);
        } else if (data.rideDate instanceof Date) {
          rideDate = data.rideDate;
        } else {
          console.warn('Invalid rideDate format for booking:', doc.id, data.rideDate);
          return false;
        }
        
        // Check if ride date is today
        const rideDateStart = new Date(rideDate);
        rideDateStart.setHours(0, 0, 0, 0);
        
        const isToday = rideDateStart.getTime() === today.getTime();
        
        if (isToday) {
          console.log('Found confirmed booking for today:', doc.id, 'childId:', data.childId);
        }
        
        return isToday;
      });
      
      // Create a snapshot-like object for consistent handling
      const bookingsSnapshot = {
        docs: todayConfirmedBookings,
        size: todayConfirmedBookings.length,
        empty: todayConfirmedBookings.length === 0
      };
      
      console.log('Found', bookingsSnapshot.size, 'confirmed bookings for today');
      
      if (bookingsSnapshot.empty) {
        throw new Error('No confirmed bookings found for today');
      }
      
      // Get children details for each booking
      const rideChildren: RideChild[] = [];
      
      for (const bookingDoc of bookingsSnapshot.docs) {
        const bookingData = bookingDoc.data();
        const booking = { id: bookingDoc.id, ...bookingData } as any;
        
        // Convert Firestore timestamp to Date if necessary
        if (booking.rideDate && typeof booking.rideDate.toDate === 'function') {
          booking.rideDate = booking.rideDate.toDate();
        } else if (typeof booking.rideDate === 'string') {
          booking.rideDate = new Date(booking.rideDate);
        }
        
        console.log('Processing booking:', booking.id, 'for child:', booking.childId);
        
        try {
          // Get child details
          const childDoc = await getDoc(doc(db, 'children', booking.childId));
          if (childDoc.exists()) {
            const childData = childDoc.data() as Child;
            
            const rideChild: RideChild = {
              id: `${booking.id}_${booking.childId}`,
              childId: booking.childId,
              bookingId: booking.id,
              fullName: childData.fullName,
              pickupLocation: booking.pickupLocation,
              dropoffLocation: booking.dropoffLocation,
              scheduledPickupTime: booking.dailyTime || (
                booking.rideDate instanceof Date 
                  ? booking.rideDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
                  : new Date(booking.rideDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
              ),
              status: 'pending'
            };
            
            rideChildren.push(rideChild);
            console.log('Added child to ride:', childData.fullName);
          } else {
            console.warn('Child document not found:', booking.childId);
          }
        } catch (childError) {
          console.error('Error processing child:', booking.childId, childError);
        }
      }
      
      if (rideChildren.length === 0) {
        console.log('No valid children found. Bookings processed:', bookingsSnapshot.size);
        throw new Error('No valid children found for today\'s bookings. Please check if child records exist.');
      }
      
      // Create active ride document
      const rideId = `${driverId}_${today.toISOString().split('T')[0]}`;
      console.log('Creating active ride with ID:', rideId);
      
      const activeRide: ActiveRide = {
        id: rideId,
        driverId,
        date: today,
        status: 'in_progress',
        startedAt: new Date(),
        children: rideChildren,
        createdAt: new Date(),
        updatedAt: new Date(),
        totalChildren: rideChildren.length,
        pickedUpCount: 0,
        absentCount: 0,
        droppedOffCount: 0
      };
      
      // Save to Firestore
      try {
        await setDoc(doc(db, 'activeRides', rideId), {
          ...activeRide,
          date: Timestamp.fromDate(activeRide.date),
          startedAt: Timestamp.fromDate(activeRide.startedAt!),
          createdAt: Timestamp.fromDate(activeRide.createdAt),
          updatedAt: Timestamp.fromDate(activeRide.updatedAt)
        });
        
        console.log('Successfully created active ride:', rideId, 'with', rideChildren.length, 'children');
        return activeRide;
      } catch (saveError) {
        console.error('Error saving active ride:', saveError);
        throw new Error(`Failed to save ride data: ${saveError.message}`);
      }
      
    } catch (error) {
      console.error('Error starting ride:', error);
      throw error;
    }
  }
  
  /**
   * Get current active ride for driver
   */
  static async getActiveRide(driverId: string): Promise<ActiveRide | null> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const rideId = `${driverId}_${today.toISOString().split('T')[0]}`;
      
      console.log('Looking for active ride with ID:', rideId);
      
      const rideDoc = await getDoc(doc(db, 'activeRides', rideId));
      
      if (rideDoc.exists()) {
        const data = rideDoc.data();
        const activeRide = {
          ...data,
          id: rideDoc.id,
          date: data.date?.toDate ? data.date.toDate() : new Date(data.date),
          startedAt: data.startedAt?.toDate ? data.startedAt.toDate() : (data.startedAt ? new Date(data.startedAt) : undefined),
          completedAt: data.completedAt?.toDate ? data.completedAt.toDate() : (data.completedAt ? new Date(data.completedAt) : undefined),
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt)
        } as ActiveRide;
        
        console.log('Found active ride:', rideId, 'with status:', activeRide.status);
        return activeRide;
      }
      
      console.log('No active ride found for today');
      return null;
    } catch (error) {
      console.error('Error getting active ride:', error);
      return null; // Return null instead of throwing to allow graceful handling
    }
  }
  
  /**
   * Update child pickup status
   */
  static async updateChildStatus(
    rideId: string, 
    childId: string, 
    status: 'picked_up' | 'absent' | 'dropped_off',
    notes?: string
  ): Promise<void> {
    try {
      console.log('Updating child status:', { rideId, childId, status });
      
      const rideDoc = await getDoc(doc(db, 'activeRides', rideId));
      
      if (!rideDoc.exists()) {
        console.error('Active ride document not found:', rideId);
        throw new Error('Active ride not found');
      }
      
      const rideData = rideDoc.data();
      const children = rideData.children as RideChild[];
      
      if (!Array.isArray(children)) {
        throw new Error('Invalid children data in ride');
      }
      
      // Find the specific child
      const childIndex = children.findIndex(child => child.childId === childId);
      if (childIndex === -1) {
        throw new Error(`Child not found in ride: ${childId}`);
      }
      
      // Update the specific child's status
      const updatedChildren = [...children];
      const currentChild = updatedChildren[childIndex];
      
      console.log('Updating child:', currentChild.fullName, 'from', currentChild.status, 'to', status);
      
      updatedChildren[childIndex] = {
        ...currentChild,
        status,
        notes,
        ...(status === 'picked_up' ? { pickedUpAt: new Date() } : {}),
        ...(status === 'dropped_off' ? { droppedOffAt: new Date() } : {})
      };
      
      // Calculate updated counts
      const pickedUpCount = updatedChildren.filter(child => child.status === 'picked_up').length;
      const absentCount = updatedChildren.filter(child => child.status === 'absent').length;
      const droppedOffCount = updatedChildren.filter(child => child.status === 'dropped_off').length;
      
      // Check if ride is completed (all children either dropped off or absent)
      const allProcessed = updatedChildren.every(child => 
        child.status === 'dropped_off' || child.status === 'absent'
      );
      
      const updates: any = {
        children: updatedChildren.map(child => {
          // Clean up the child object to ensure no undefined values
          const cleanChild: any = {
            id: child.id,
            childId: child.childId,
            bookingId: child.bookingId,
            fullName: child.fullName,
            pickupLocation: child.pickupLocation,
            dropoffLocation: child.dropoffLocation,
            scheduledPickupTime: child.scheduledPickupTime,
            status: child.status
          };
          
          // Handle timestamp fields - they could be Date objects or Firestore Timestamps
          if (child.pickedUpAt) {
            if (child.pickedUpAt instanceof Date) {
              cleanChild.pickedUpAt = Timestamp.fromDate(child.pickedUpAt);
            } else if (typeof child.pickedUpAt === 'object' && 'toDate' in child.pickedUpAt) {
              // It's already a Firestore Timestamp
              cleanChild.pickedUpAt = child.pickedUpAt;
            } else {
              // Try to create a new Date from it
              cleanChild.pickedUpAt = Timestamp.fromDate(new Date(child.pickedUpAt as any));
            }
          }
          
          if (child.droppedOffAt) {
            if (child.droppedOffAt instanceof Date) {
              cleanChild.droppedOffAt = Timestamp.fromDate(child.droppedOffAt);
            } else if (typeof child.droppedOffAt === 'object' && 'toDate' in child.droppedOffAt) {
              // It's already a Firestore Timestamp
              cleanChild.droppedOffAt = child.droppedOffAt;
            } else {
              // Try to create a new Date from it
              cleanChild.droppedOffAt = Timestamp.fromDate(new Date(child.droppedOffAt as any));
            }
          }
          
          if (child.notes) {
            cleanChild.notes = child.notes;
          }
          
          return cleanChild;
        }),
        pickedUpCount,
        absentCount,
        droppedOffCount,
        updatedAt: Timestamp.fromDate(new Date())
      };
      
      if (allProcessed) {
        updates.status = 'completed';
        updates.completedAt = Timestamp.fromDate(new Date());
        console.log('Ride completed - all children processed');
      }

      console.log('About to update Firestore document');
      await updateDoc(doc(db, 'activeRides', rideId), updates);
      console.log('Successfully updated child status in Firestore');
      
    } catch (error) {
      console.error('Error updating child status:', error);
      console.error('Error details:', error.message, error.code);
      throw error;
    }
  }
  
  /**
   * Complete the ride manually
   */
  static async completeRide(rideId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'activeRides', rideId), {
        status: 'completed',
        completedAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date())
      });
    } catch (error) {
      console.error('Error completing ride:', error);
      throw error;
    }
  }

  /**
   * Get active rides for a parent based on their children
   */
  static async getActiveRidesForParent(parentId: string): Promise<ActiveRide[]> {
    try {
      console.log('Getting active rides for parent:', parentId);
      
      // First, get all children for this parent
      const childrenQuery = query(
        collection(db, 'children'),
        where('parentId', '==', parentId)
      );
      const childrenSnapshot = await getDocs(childrenQuery);
      
      if (childrenSnapshot.empty) {
        console.log('No children found for parent');
        return [];
      }
      
      const childIds = childrenSnapshot.docs.map(doc => doc.id);
      console.log('Found children:', childIds);
      
      // Get all active rides
      const ridesQuery = query(
        collection(db, 'activeRides'),
        where('status', '==', 'in_progress')
      );
      const ridesSnapshot = await getDocs(ridesQuery);
      
      if (ridesSnapshot.empty) {
        console.log('No active rides found');
        return [];
      }
      
      // Filter rides that contain this parent's children
      const activeRides: ActiveRide[] = [];
      
      for (const rideDoc of ridesSnapshot.docs) {
        const rideData = rideDoc.data();
        const ride: ActiveRide = {
          id: rideDoc.id,
          driverId: rideData.driverId,
          date: rideData.date?.toDate ? rideData.date.toDate() : rideData.date,
          status: rideData.status,
          startedAt: rideData.startedAt?.toDate ? rideData.startedAt.toDate() : rideData.startedAt,
          children: rideData.children || [],
          createdAt: rideData.createdAt?.toDate ? rideData.createdAt.toDate() : rideData.createdAt,
          updatedAt: rideData.updatedAt?.toDate ? rideData.updatedAt.toDate() : rideData.updatedAt,
          totalChildren: rideData.totalChildren,
          pickedUpCount: rideData.pickedUpCount,
          absentCount: rideData.absentCount,
          droppedOffCount: rideData.droppedOffCount
        };
        
        // Check if any of the ride's children belong to this parent
        const hasParentChildren = ride.children.some((rideChild: RideChild) => 
          childIds.includes(rideChild.childId)
        );
        
        if (hasParentChildren) {
          // Filter children to only include this parent's children
          const parentChildren = ride.children.filter((rideChild: RideChild) => 
            childIds.includes(rideChild.childId)
          );
          
          activeRides.push({
            ...ride,
            children: parentChildren,
            totalChildren: parentChildren.length
          });
        }
      }
      
      console.log('Found active rides for parent:', activeRides.length);
      return activeRides;
      
    } catch (error) {
      console.error('Error getting active rides for parent:', error);
      throw error;
    }
  }

  /**
   * Get completed rides for a driver
   */
  static async getDriverRideHistory(driverId: string, limit: number = 50): Promise<ActiveRide[]> {
    try {
      console.log('Getting ride history for driver:', driverId);
      
      // Query all rides for this driver (simplified to avoid index requirements)
      const ridesQuery = query(
        collection(db, 'activeRides'),
        where('driverId', '==', driverId)
      );
      
      const ridesSnapshot = await getDocs(ridesQuery);
      console.log('Found', ridesSnapshot.size, 'total rides for driver');
      
      const rides: ActiveRide[] = [];
      
      ridesSnapshot.docs.forEach(doc => {
        const data = doc.data();
        
        // Convert Firestore timestamps to Date objects
        const ride: ActiveRide = {
          id: doc.id,
          driverId: data.driverId,
          date: data.date?.toDate ? data.date.toDate() : new Date(data.date),
          status: data.status,
          startedAt: data.startedAt?.toDate ? data.startedAt.toDate() : (data.startedAt ? new Date(data.startedAt) : undefined),
          completedAt: data.completedAt?.toDate ? data.completedAt.toDate() : (data.completedAt ? new Date(data.completedAt) : undefined),
          children: data.children || [],
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
          totalChildren: data.totalChildren || 0,
          pickedUpCount: data.pickedUpCount || 0,
          absentCount: data.absentCount || 0,
          droppedOffCount: data.droppedOffCount || 0
        };
        
        rides.push(ride);
      });
      
      // Filter completed rides and sort by date (client-side)
      const completedRides = rides
        .filter(ride => ride.status === 'completed')
        .sort((a, b) => {
          const dateA = a.completedAt || a.updatedAt;
          const dateB = b.completedAt || b.updatedAt;
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, limit);
      
      console.log('Processed', completedRides.length, 'completed rides out of', rides.length, 'total rides');
      return completedRides;
      
    } catch (error) {
      console.error('Error getting driver ride history:', error);
      throw error;
    }
  }
}
