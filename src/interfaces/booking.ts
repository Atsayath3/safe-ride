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
  rideDate: Date; // For single rides, this is the ride date. For period bookings, this is the start date
  endDate?: Date; // For period bookings, this is the end date
  isRecurring?: boolean; // True if this is a period booking
  recurringDays?: number; // Number of school days in the period
  dailyTime?: string; // Time for daily pickup (HH:MM format)
  cancelledDates?: string[]; // Array of cancelled dates in YYYY-MM-DD format for period bookings
  createdAt: Date;
  updatedAt: Date;
  notes?: string;
  // Pricing information
  totalPrice?: number; // Total price in Sri Lankan Rupees
  distance?: number; // Distance in kilometers
  pricePerKm?: number; // Rate per kilometer (default Rs.25)
  driverAvailability?: number; // Driver availability percentage when booked
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
  endDate?: Date; // For period bookings
  isRecurring?: boolean;
  recurringDays?: number;
  dailyTime?: string;
  notes?: string;
  // Pricing information
  totalPrice?: number;
  distance?: number;
  pricePerKm?: number;
  driverAvailability?: number;
}