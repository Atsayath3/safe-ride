export interface Booking {
  id: string;
  parentId: string;
  driverId: string;
  childId: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
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
  bookingDate: Date;
  rideDate: Date;
  createdAt: Date;
  updatedAt: Date;
  notes?: string;
}

export interface DriverAvailability {
  driverId: string;
  totalSeats: number;
  bookedSeats: number;
  availableSeats: number;
  isActive: boolean;
}

export interface BookingRequest {
  parentId: string;
  driverId: string;
  childId: string;
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
  rideDate: Date;
  notes?: string;
}