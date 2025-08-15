export interface RideChild {
  id: string;
  childId: string;
  bookingId: string;
  fullName: string;
  pickupLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  dropoffLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  scheduledPickupTime: string;
  status: 'pending' | 'picked_up' | 'absent' | 'dropped_off';
  pickedUpAt?: Date;
  droppedOffAt?: Date;
  notes?: string;
}

export interface ActiveRide {
  id: string;
  driverId: string;
  date: Date;
  status: 'not_started' | 'in_progress' | 'completed' | 'cancelled';
  startedAt?: Date;
  completedAt?: Date;
  children: RideChild[];
  createdAt: Date;
  updatedAt: Date;
  totalChildren: number;
  pickedUpCount: number;
  absentCount: number;
  droppedOffCount: number;
}

export interface RideStats {
  totalRides: number;
  completedRides: number;
  totalChildren: number;
  averagePickupTime: string;
  onTimeRate: number;
}
