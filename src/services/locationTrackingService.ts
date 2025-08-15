import { doc, setDoc, onSnapshot, collection, query, where, getDocs, updateDoc, deleteDoc, Timestamp, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface LocationData {
  id: string;
  driverId: string;
  rideId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: Date;
  speed?: number;
  heading?: number;
  isActive: boolean;
  parentIds: string[]; // List of parent IDs who should see this location
}

export interface TrackingSession {
  id: string;
  rideId: string;
  driverId: string;
  parentIds: string[];
  startedAt: Date;
  lastUpdateAt: Date;
  isActive: boolean;
  totalDistance?: number;
  estimatedArrival?: Date;
}

class LocationTrackingService {
  private watchId: number | null = null;
  private currentSession: TrackingSession | null = null;
  private updateInterval: NodeJS.Timeout | null = null;
  private lastKnownPosition: GeolocationPosition | null = null;

  /**
   * Start location tracking for a ride
   */
  async startTracking(rideId: string, driverId: string, parentIds: string[]): Promise<boolean> {
    try {
      console.log('Starting location tracking for ride:', rideId);

      // Check if geolocation is supported
      if (!navigator.geolocation) {
        console.error('Geolocation is not supported by this browser');
        return false;
      }

      // Create tracking session
      const sessionId = `${rideId}_${Date.now()}`;
      this.currentSession = {
        id: sessionId,
        rideId,
        driverId,
        parentIds,
        startedAt: new Date(),
        lastUpdateAt: new Date(),
        isActive: true
      };

      // Save session to Firestore
      await setDoc(doc(db, 'trackingSessions', sessionId), {
        ...this.currentSession,
        startedAt: Timestamp.fromDate(this.currentSession.startedAt),
        lastUpdateAt: Timestamp.fromDate(this.currentSession.lastUpdateAt)
      });

      // Start watching position
      this.watchId = navigator.geolocation.watchPosition(
        (position) => this.handlePositionUpdate(position),
        (error) => this.handlePositionError(error),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000 // Cache position for 5 seconds max
        }
      );

      // Set up interval for regular updates (backup)
      this.updateInterval = setInterval(() => {
        if (this.lastKnownPosition) {
          this.handlePositionUpdate(this.lastKnownPosition);
        }
      }, 30000); // Update every 30 seconds as backup

      console.log('Location tracking started successfully');
      return true;

    } catch (error) {
      console.error('Failed to start location tracking:', error);
      return false;
    }
  }

  /**
   * Stop location tracking
   */
  async stopTracking(): Promise<void> {
    try {
      console.log('Stopping location tracking');

      // Clear watch and interval
      if (this.watchId !== null) {
        navigator.geolocation.clearWatch(this.watchId);
        this.watchId = null;
      }

      if (this.updateInterval) {
        clearInterval(this.updateInterval);
        this.updateInterval = null;
      }

      // Update session as inactive
      if (this.currentSession) {
        await updateDoc(doc(db, 'trackingSessions', this.currentSession.id), {
          isActive: false,
          lastUpdateAt: Timestamp.fromDate(new Date())
        });

        // Mark final location as inactive
        const locationId = `${this.currentSession.driverId}_${Date.now()}`;
        if (this.lastKnownPosition) {
          await this.saveLocationUpdate(locationId, this.lastKnownPosition, false);
        }

        this.currentSession = null;
      }

      this.lastKnownPosition = null;
      console.log('Location tracking stopped');

    } catch (error) {
      console.error('Error stopping location tracking:', error);
    }
  }

  /**
   * Handle position updates from geolocation
   */
  private async handlePositionUpdate(position: GeolocationPosition): Promise<void> {
    try {
      if (!this.currentSession?.isActive) return;

      this.lastKnownPosition = position;
      const locationId = `${this.currentSession.driverId}_${Date.now()}`;

      // Save location to Firestore
      await this.saveLocationUpdate(locationId, position, true);

      // Update session last update time
      await updateDoc(doc(db, 'trackingSessions', this.currentSession.id), {
        lastUpdateAt: Timestamp.fromDate(new Date())
      });

      console.log('Location updated:', {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy
      });

    } catch (error) {
      console.error('Error updating location:', error);
    }
  }

  /**
   * Handle geolocation errors
   */
  private handlePositionError(error: GeolocationPositionError): void {
    console.error('Geolocation error:', error.message);
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        console.error('Location access denied by user');
        break;
      case error.POSITION_UNAVAILABLE:
        console.error('Location information unavailable');
        break;
      case error.TIMEOUT:
        console.error('Location request timed out');
        break;
    }
  }

  /**
   * Save location update to Firestore
   */
  private async saveLocationUpdate(
    locationId: string, 
    position: GeolocationPosition, 
    isActive: boolean
  ): Promise<void> {
    if (!this.currentSession) return;

    const locationData: LocationData = {
      id: locationId,
      driverId: this.currentSession.driverId,
      rideId: this.currentSession.rideId,
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: new Date(),
      speed: position.coords.speed ?? undefined,
      heading: position.coords.heading ?? undefined,
      isActive,
      parentIds: this.currentSession.parentIds
    };

    // Remove undefined fields before saving to Firestore
    const firestoreData: any = {
      id: locationData.id,
      driverId: locationData.driverId,
      rideId: locationData.rideId,
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      accuracy: locationData.accuracy,
      timestamp: Timestamp.fromDate(locationData.timestamp),
      isActive: locationData.isActive,
      parentIds: locationData.parentIds
    };

    // Only add speed and heading if they are not undefined/null
    if (locationData.speed !== undefined && locationData.speed !== null) {
      firestoreData.speed = locationData.speed;
    }
    if (locationData.heading !== undefined && locationData.heading !== null) {
      firestoreData.heading = locationData.heading;
    }

    await setDoc(doc(db, 'driverLocations', locationId), firestoreData);
  }

  /**
   * Get current tracking session
   */
  getCurrentSession(): TrackingSession | null {
    return this.currentSession;
  }

  /**
   * Check if tracking is active
   */
  isTracking(): boolean {
    return this.currentSession?.isActive || false;
  }

  /**
   * Subscribe to driver location updates (for parents)
   */
  subscribeToDriverLocation(
    rideId: string, 
    callback: (location: LocationData | null) => void
  ): () => void {
    const q = query(
      collection(db, 'driverLocations'),
      where('rideId', '==', rideId),
      where('isActive', '==', true)
    );

    return onSnapshot(q, (snapshot) => {
      const locations = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          timestamp: data.timestamp?.toDate() || new Date()
        } as LocationData;
      });

      // Get the most recent location
      const latestLocation = locations.sort((a, b) => 
        b.timestamp.getTime() - a.timestamp.getTime()
      )[0] || null;

      callback(latestLocation);
    });
  }

  /**
   * Get parent IDs for a specific ride
   */
  async getParentIdsForRide(rideId: string): Promise<string[]> {
    try {
      console.log('Getting parent IDs for ride:', rideId);
      
      // Get the active ride document directly by document ID
      const rideDocRef = doc(db, 'activeRides', rideId);
      const rideDocSnapshot = await getDoc(rideDocRef);
      
      if (!rideDocSnapshot.exists()) {
        console.log('No active ride found with ID:', rideId);
        return [];
      }

      const rideData = rideDocSnapshot.data();
      const children = rideData.children || [];
      console.log('Found ride with', children.length, 'children');

      // Get parent IDs from bookings
      const parentIds: string[] = [];
      for (const child of children) {
        if (child.bookingId) {
          console.log('Looking up booking document with ID:', child.bookingId);
          // Get booking document directly by document ID
          const bookingDocRef = doc(db, 'bookings', child.bookingId);
          const bookingDocSnapshot = await getDoc(bookingDocRef);
          
          if (bookingDocSnapshot.exists()) {
            const booking = bookingDocSnapshot.data();
            console.log('Found booking with parentId:', booking.parentId);
            if (booking.parentId && !parentIds.includes(booking.parentId)) {
              parentIds.push(booking.parentId);
            }
          } else {
            console.log('No booking document found with ID:', child.bookingId);
          }
        } else {
          console.log('Child has no bookingId:', child);
        }
      }

      console.log('Final parent IDs found:', parentIds);
      return parentIds;
    } catch (error) {
      console.error('Error getting parent IDs for ride:', error);
      return [];
    }
  }

  /**
   * Clean up old location data (call periodically)
   */
  async cleanupOldLocations(olderThanHours: number = 24): Promise<void> {
    try {
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - olderThanHours);

      const oldLocations = await getDocs(
        query(
          collection(db, 'driverLocations'),
          where('timestamp', '<', Timestamp.fromDate(cutoffTime))
        )
      );

      const batch = oldLocations.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(batch);

      console.log(`Cleaned up ${oldLocations.size} old location records`);
    } catch (error) {
      console.error('Error cleaning up old locations:', error);
    }
  }
}

export const locationTrackingService = new LocationTrackingService();
