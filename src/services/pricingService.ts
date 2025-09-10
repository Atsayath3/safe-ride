export interface PricingCalculation {
  basePrice: number;        // Rs.25 per km per day
  totalDistance: number;    // Total distance in km
  numberOfDays: number;     // Number of school days
  driverAvailability: number; // Percentage (0-100)
  availabilityBonus: number;  // Additional cost based on availability
  totalPrice: number;       // Final calculated price
  priceBreakdown: {
    baseCalculation: string;
    availabilityAdjustment: string;
    finalTotal: string;
  };
}

export class PricingService {
  private static readonly BASE_RATE_PER_KM = 25; // Rs.25 per kilometer
  private static readonly AVAILABILITY_MULTIPLIER = 0.20; // 20% adjustment based on availability

  /**
   * Calculate the total distance for a ride (pickup to dropoff)
   * @param pickupLocation - Starting location coordinates
   * @param dropoffLocation - Destination location coordinates
   * @returns Distance in kilometers
   */
  static calculateDistance(
    pickupLocation: { lat: number; lng: number },
    dropoffLocation: { lat: number; lng: number }
  ): number {
    // Haversine formula to calculate distance between two points
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.degToRad(dropoffLocation.lat - pickupLocation.lat);
    const dLng = this.degToRad(dropoffLocation.lng - pickupLocation.lng);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degToRad(pickupLocation.lat)) * 
      Math.cos(this.degToRad(dropoffLocation.lat)) * 
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    // Round to 2 decimal places
    return Math.round(distance * 100) / 100;
  }

  /**
   * Calculate driver availability percentage based on current bookings
   * @param totalSeats - Total vehicle capacity
   * @param bookedSeats - Currently booked seats
   * @returns Availability percentage (0-100)
   */
  static calculateDriverAvailability(totalSeats: number, bookedSeats: number): number {
    if (totalSeats <= 0) return 0;
    const availability = ((totalSeats - bookedSeats) / totalSeats) * 100;
    return Math.max(0, Math.min(100, Math.round(availability)));
  }

  /**
   * Calculate the total price for a ride booking
   * @param pickupLocation - Starting location
   * @param dropoffLocation - Destination location  
   * @param numberOfDays - Number of school days
   * @param driverAvailability - Driver availability percentage (0-100)
   * @returns Complete pricing calculation
   */
  static calculateRidePrice(
    pickupLocation: { lat: number; lng: number },
    dropoffLocation: { lat: number; lng: number },
    numberOfDays: number,
    driverAvailability: number
  ): PricingCalculation {
    // Calculate distance
    const totalDistance = this.calculateDistance(pickupLocation, dropoffLocation);
    
    // Calculate base price (Rs.25 per km * number of days)
    const basePrice = this.BASE_RATE_PER_KM * totalDistance * numberOfDays;
    
    // Calculate availability adjustment
    // Higher availability (more seats available) = lower price
    // Lower availability (fewer seats available) = higher price
    const availabilityFactor = (100 - driverAvailability) / 100; // Invert availability
    const availabilityBonus = basePrice * this.AVAILABILITY_MULTIPLIER * availabilityFactor;
    
    // Calculate total price
    const totalPrice = basePrice + availabilityBonus;
    
    return {
      basePrice: Math.round(basePrice),
      totalDistance,
      numberOfDays,
      driverAvailability,
      availabilityBonus: Math.round(availabilityBonus),
      totalPrice: Math.round(totalPrice),
      priceBreakdown: {
        baseCalculation: `Rs.${this.BASE_RATE_PER_KM} × ${totalDistance}km × ${numberOfDays} days = Rs.${Math.round(basePrice)}`,
        availabilityAdjustment: `Availability adjustment (${Math.round(availabilityFactor * 100)}%): Rs.${Math.round(availabilityBonus)}`,
        finalTotal: `Total: Rs.${Math.round(totalPrice)}`
      }
    };
  }

  /**
   * Format price for display in Sri Lankan Rupees
   * @param amount - Amount in rupees
   * @returns Formatted price string
   */
  static formatPrice(amount: number): string {
    return `Rs.${amount.toLocaleString('en-LK')}`;
  }

  /**
   * Convert degrees to radians for distance calculation
   */
  private static degToRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Calculate estimated fuel cost (optional additional info)
   * @param distance - Distance in kilometers
   * @param fuelEfficiency - Vehicle fuel efficiency in km/l (default 12)
   * @param fuelPrice - Current fuel price per liter (default Rs.350)
   * @returns Estimated fuel cost
   */
  static calculateFuelCost(
    distance: number, 
    fuelEfficiency: number = 12, 
    fuelPrice: number = 350
  ): number {
    const fuelNeeded = distance / fuelEfficiency;
    return Math.round(fuelNeeded * fuelPrice);
  }
}
