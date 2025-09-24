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
import { SiblingGroup, GroupRideRequest } from '../interfaces/personalization';

export class SiblingCoordinationService {
  
  // Create a new sibling group
  static async createSiblingGroup(parentId: string, groupData: Omit<SiblingGroup, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'siblingGroups'), {
        ...groupData,
        parentId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating sibling group:', error);
      throw error;
    }
  }

  // Get all sibling groups for a parent
  static async getSiblingGroups(parentId: string): Promise<SiblingGroup[]> {
    try {
      const q = query(
        collection(db, 'siblingGroups'),
        where('parentId', '==', parentId),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate()
      } as SiblingGroup));
    } catch (error) {
      console.error('Error fetching sibling groups:', error);
      throw error;
    }
  }

  // Update sibling group
  static async updateSiblingGroup(groupId: string, updates: Partial<SiblingGroup>): Promise<void> {
    try {
      const groupRef = doc(db, 'siblingGroups', groupId);
      await updateDoc(groupRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating sibling group:', error);
      throw error;
    }
  }

  // Delete sibling group (soft delete)
  static async deleteSiblingGroup(groupId: string): Promise<void> {
    try {
      const groupRef = doc(db, 'siblingGroups', groupId);
      await updateDoc(groupRef, {
        isActive: false,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error deleting sibling group:', error);
      throw error;
    }
  }

  // Create group ride request
  static async createGroupRideRequest(requestData: Omit<GroupRideRequest, 'id' | 'createdAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'groupRideRequests'), {
        ...requestData,
        scheduledDate: Timestamp.fromDate(requestData.scheduledDate),
        createdAt: Timestamp.now()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating group ride request:', error);
      throw error;
    }
  }

  // Get group ride requests
  static async getGroupRideRequests(parentId: string, status?: string): Promise<GroupRideRequest[]> {
    try {
      let q = query(
        collection(db, 'groupRideRequests'),
        where('parentId', '==', parentId),
        orderBy('scheduledDate', 'desc')
      );

      if (status) {
        q = query(q, where('status', '==', status));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        scheduledDate: doc.data().scheduledDate.toDate(),
        createdAt: doc.data().createdAt.toDate()
      } as GroupRideRequest));
    } catch (error) {
      console.error('Error fetching group ride requests:', error);
      throw error;
    }
  }

  // Calculate cost split for group ride
  static calculateCostSplit(
    totalCost: number, 
    children: { childId: string; childName: string }[],
    splitMethod: 'equal' | 'weighted' | 'custom',
    customRatios?: { [childId: string]: number }
  ): { childId: string; amount: number; percentage: number }[] {
    
    switch (splitMethod) {
      case 'equal':
        const equalAmount = totalCost / children.length;
        const equalPercentage = 100 / children.length;
        return children.map(child => ({
          childId: child.childId,
          amount: Math.round(equalAmount * 100) / 100,
          percentage: Math.round(equalPercentage * 100) / 100
        }));

      case 'weighted':
        // Weight based on age or other factors (for now, equal split)
        return this.calculateCostSplit(totalCost, children, 'equal');

      case 'custom':
        if (!customRatios) {
          return this.calculateCostSplit(totalCost, children, 'equal');
        }
        
        const totalRatio = Object.values(customRatios).reduce((sum, ratio) => sum + ratio, 0);
        return children.map(child => {
          const ratio = customRatios[child.childId] || 1;
          const percentage = (ratio / totalRatio) * 100;
          const amount = (totalCost * ratio) / totalRatio;
          return {
            childId: child.childId,
            amount: Math.round(amount * 100) / 100,
            percentage: Math.round(percentage * 100) / 100
          };
        });

      default:
        return this.calculateCostSplit(totalCost, children, 'equal');
    }
  }

  // Update group ride status
  static async updateGroupRideStatus(requestId: string, status: GroupRideRequest['status'], driverId?: string): Promise<void> {
    try {
      const updateData: any = {
        status,
        updatedAt: Timestamp.now()
      };
      
      if (driverId) {
        updateData.assignedDriverId = driverId;
      }

      const requestRef = doc(db, 'groupRideRequests', requestId);
      await updateDoc(requestRef, updateData);
    } catch (error) {
      console.error('Error updating group ride status:', error);
      throw error;
    }
  }

  // Enhanced cost split calculation with distance-based option
  static calculateEnhancedCostSplit(
    totalCost: number, 
    children: { childId: string; childName: string; distance?: number }[], 
    method: 'equal' | 'weighted' | 'distance_based' | 'custom',
    customRatios?: { [childId: string]: number }
  ): { childId: string; amount: number; percentage: number; distanceShare?: number }[] {
    
    switch (method) {
      case 'distance_based':
        if (!children.every(child => child.distance)) {
          // Fallback to equal split if distances not available
          return this.calculateCostSplit(totalCost, children, 'equal');
        }
        
        const totalDistance = children.reduce((sum, child) => sum + (child.distance || 0), 0);
        return children.map(child => {
          const distanceShare = (child.distance || 0) / totalDistance;
          const amount = totalCost * distanceShare;
          return {
            childId: child.childId,
            amount: Math.round(amount * 100) / 100,
            percentage: Math.round(distanceShare * 10000) / 100,
            distanceShare: Math.round(distanceShare * 10000) / 100
          };
        });

      default:
        // Use existing method for other split types
        return this.calculateCostSplit(totalCost, children, method as any, customRatios);
    }
  }

  // Optimize route for multiple destinations
  static async optimizeMultiDestinationRoute(
    pickupLocation: string,
    destinations: { childId: string; location: string; schoolName: string }[]
  ): Promise<{
    optimizedOrder: { childId: string; location: string; schoolName: string; estimatedArrival: string }[];
    totalDistance: number;
    estimatedDuration: number;
    individualDistances: { childId: string; distance: number }[];
  }> {
    try {
      // This would integrate with a routing service like Google Directions API
      // For now, we'll provide a simplified optimization

      // Sort destinations by proximity (simplified - in real implementation, use actual mapping service)
      const optimizedDestinations = destinations.map((dest, index) => ({
        ...dest,
        estimatedArrival: this.calculateEstimatedArrival(index, destinations.length)
      }));

      // Calculate individual distances (simplified - would use actual mapping service)
      const individualDistances = destinations.map((dest, index) => ({
        childId: dest.childId,
        distance: 3 + (index * 2) + Math.random() * 2 // Mock distance in km (3-9km range)
      }));

      const totalDistance = individualDistances.reduce((sum, item) => sum + item.distance, 0);

      return {
        optimizedOrder: optimizedDestinations,
        totalDistance: Math.round(totalDistance * 100) / 100,
        estimatedDuration: destinations.length * 10 + 20, // 10 min per stop + base time
        individualDistances
      };
    } catch (error) {
      console.error('Error optimizing route:', error);
      throw error;
    }
  }

  // Helper method to calculate estimated arrival times
  private static calculateEstimatedArrival(stopIndex: number, totalStops: number): string {
    const baseTime = new Date();
    baseTime.setHours(7, 30, 0, 0); // Start at 7:30 AM
    baseTime.setMinutes(baseTime.getMinutes() + (stopIndex * 10)); // 10 minutes per stop
    
    return baseTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  // Create multi-destination group ride
  static async createMultiDestinationGroupRide(
    siblingGroupId: string,
    parentId: string,
    scheduledDate: Date,
    pickupLocation: string,
    children: { childId: string; childName: string; schoolName: string; schoolAddress: string }[]
  ): Promise<string> {
    try {
      // Optimize the route
      const destinations = children.map(child => ({
        childId: child.childId,
        location: child.schoolAddress,
        schoolName: child.schoolName
      }));

      const routeOptimization = await this.optimizeMultiDestinationRoute(pickupLocation, destinations);
      
      // Calculate distance-based cost split
      const baseCost = 800; // Base cost
      const distanceCost = routeOptimization.totalDistance * 60; // ₹60 per km
      const estimatedTotalCost = baseCost + distanceCost;
      
      const costSplit = this.calculateEnhancedCostSplit(
        estimatedTotalCost,
        children.map(child => {
          const distanceInfo = routeOptimization.individualDistances.find(d => d.childId === child.childId);
          return {
            childId: child.childId,
            childName: child.childName,
            distance: distanceInfo?.distance
          };
        }),
        'distance_based'
      );

      // Create the group ride request
      const groupRideData: Omit<GroupRideRequest, 'id' | 'createdAt'> = {
        siblingGroupId,
        parentId,
        scheduledDate,
        pickupLocation,
        dropoffLocation: 'Multiple Schools',
        isMultiDestination: true,
        destinations: routeOptimization.optimizedOrder.map(dest => ({
          childId: dest.childId,
          location: dest.location,
          schoolName: dest.schoolName,
          arrivalTime: dest.estimatedArrival
        })),
        children: children.map(child => ({
          childId: child.childId,
          childName: child.childName,
          schoolName: child.schoolName,
          dropoffLocation: child.schoolAddress
        })),
        routeOptimized: true,
        estimatedDuration: routeOptimization.estimatedDuration,
        costSplit,
        totalCost: estimatedTotalCost,
        status: 'pending'
      };

      return await this.createGroupRideRequest(groupRideData);
    } catch (error) {
      console.error('Error creating multi-destination group ride:', error);
      throw error;
    }
  }
}