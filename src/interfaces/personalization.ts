export interface SiblingGroup {
  id: string;
  name: string;
  childIds: string[];
  defaultPickupLocation: string;
  defaultDropoffLocation: string; // Primary/most common destination
  allowMultipleDestinations: boolean; // Enable different schools
  childDestinations?: {
    childId: string;
    schoolName: string;
    schoolAddress: string;
    usualArrivalTime?: string;
  }[];
  preferredTime: string;
  costSplitMethod: 'equal' | 'weighted' | 'distance_based' | 'custom';
  customSplitRatios?: { [childId: string]: number };
  routeType: 'single_destination' | 'multiple_destinations' | 'flexible';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BudgetLimit {
  id: string;
  childId: string;
  parentId: string;
  monthlyLimit: number;
  currentSpent: number;
  warningThreshold: number; // percentage (e.g., 80 for 80%)
  isActive: boolean;
  notifications: {
    warningEnabled: boolean;
    limitReachedEnabled: boolean;
    weeklyReportEnabled: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface MonthlyExpense {
  id: string;
  childId: string;
  parentId: string;
  month: string; // format: "2025-09"
  totalAmount: number;
  rideCount: number;
  averageCostPerRide: number;
  expenses: {
    rideId: string;
    amount: number;
    date: Date;
    driverName: string;
    route: string;
  }[];
}



export interface GroupRideRequest {
  id: string;
  siblingGroupId: string;
  parentId: string;
  scheduledDate: Date;
  pickupLocation: string;
  dropoffLocation: string; // Primary destination
  isMultiDestination: boolean; // Flag for multiple schools
  destinations?: {
    childId: string;
    location: string;
    schoolName: string;
    arrivalTime?: string;
    specialInstructions?: string;
  }[];
  children: {
    childId: string;
    childName: string;
    schoolName?: string;
    dropoffLocation?: string; // Individual dropoff if different
    specialInstructions?: string;
  }[];
  preferredDriverId?: string;
  routeOptimized?: boolean; // Whether route has been optimized for multiple stops
  estimatedDuration?: number; // Total trip duration in minutes
  costSplit: {
    childId: string;
    amount: number;
    percentage: number;
    distanceShare?: number; // Based on individual distance traveled
  }[];
  totalCost?: number;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  assignedDriverId?: string;
  createdAt: Date;
}