import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MapPin, Users, Calendar, Clock, DollarSign } from 'lucide-react';
import { UserProfile, useAuth } from '@/contexts/AuthContext';
import { Child } from '@/pages/parent/ParentDashboard';
import { BookingService } from '@/services/bookingService';
import { PricingService, PricingCalculation } from '@/services/pricingService';
import { ComprehensivePaymentService } from '@/services/comprehensivePaymentService';
import { PaymentTransactionRecord, PaymentCalculation } from '@/interfaces/payment';
import { toast } from '@/hooks/use-toast';

interface BookingConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  driver: UserProfile | null;
  child: Child;
  onBookingComplete: () => void;
}

const BookingConfirmationModal: React.FC<BookingConfirmationModalProps> = ({
  isOpen,
  onClose,
  driver,
  child,
  onBookingComplete
}) => {
  const { userProfile } = useAuth();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [rideTime, setRideTime] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [pricingCalculation, setPricingCalculation] = useState<PricingCalculation | null>(null);
  const [paymentCalculation, setPaymentCalculation] = useState<PaymentCalculation | null>(null);

  // Calculate pricing when dates change
  useEffect(() => {
    if (startDate && endDate && driver && child) {
      calculatePricing();
    }
  }, [startDate, endDate, driver, child]);

  const calculatePricing = async () => {
    if (!startDate || !endDate || !driver || !child) return;

    try {
      // Calculate the number of school days
      const start = new Date(startDate);
      const end = new Date(endDate);
      let schoolDays = 0;
      
      for (let currentDate = new Date(start); currentDate <= end; currentDate.setDate(currentDate.getDate() + 1)) {
        // Count only weekdays (Monday to Friday)
        if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
          schoolDays++;
        }
      }

      if (schoolDays > 0) {
        // Get driver availability
        const driverAvailability = await BookingService.getDriverAvailability(driver.uid);
        const availabilityPercentage = PricingService.calculateDriverAvailability(
          driverAvailability.totalSeats,
          driverAvailability.bookedSeats
        );

        // Calculate pricing
        const pricing = PricingService.calculateRidePrice(
          child.tripStartLocation,
          child.schoolLocation,
          schoolDays,
          availabilityPercentage
        );

        setPricingCalculation(pricing);

        // Calculate payment breakdown with fees and commissions
        const paymentBreakdown = ComprehensivePaymentService.calculatePaymentBreakdown(
          pricing.totalPrice,
          end
        );
        setPaymentCalculation(paymentBreakdown);
      }
    } catch (error) {
      console.error('Error calculating pricing:', error);
      setPricingCalculation(null);
      setPaymentCalculation(null);
    }
  };

  const handleConfirmBooking = async () => {
    if (!driver || !userProfile || !startDate || !endDate || !rideTime || !paymentCalculation) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    // Validate that end date is not before start date
    if (new Date(endDate) < new Date(startDate)) {
      toast({
        title: "Invalid Date Range",
        description: "End date cannot be before start date",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      // Calculate the number of school days
      const start = new Date(startDate);
      const end = new Date(endDate);
      let schoolDays = 0;
      
      for (let currentDate = new Date(start); currentDate <= end; currentDate.setDate(currentDate.getDate() + 1)) {
        // Count only weekdays (Monday to Friday)
        if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
          schoolDays++;
        }
      }
      
      // Create the booking request
      const bookingRequest = {
        parentId: userProfile.uid,
        driverId: driver.uid,
        childId: child.id,
        pickupLocation: child.tripStartLocation,
        dropoffLocation: child.schoolLocation,
        rideDate: start, // Start date of the period
        endDate: end,    // End date of the period
        isRecurring: true,
        recurringDays: schoolDays,
        dailyTime: rideTime,
        notes: notes.trim() || undefined,
        // Include pricing information
        totalPrice: pricingCalculation?.totalPrice,
        distance: pricingCalculation?.totalDistance,
        pricePerKm: 25, // Rs.25 per km
        driverAvailability: pricingCalculation?.driverAvailability
      };

      // Create the booking first
      const bookingId = await BookingService.createConfirmedBooking(bookingRequest);
      
      // Create payment transaction record
      await ComprehensivePaymentService.createPaymentTransaction(
        bookingId,
        userProfile.uid,
        driver.uid,
        paymentCalculation.totalAmount,
        end
      );

      // Process upfront payment
      const paymentRequest = {
        bookingId,
        amount: paymentCalculation.upfrontAmount,
        paymentType: 'upfront' as const,
        customerInfo: {
          name: `${userProfile.firstName} ${userProfile.lastName}`,
          email: userProfile.email,
          phone: userProfile.phone || ''
        }
      };

      const paymentResponse = await ComprehensivePaymentService.processPayment(paymentRequest);
      
      if (paymentResponse.success) {
        // Get payment transaction record
        const paymentTransaction = await ComprehensivePaymentService.getPaymentByBookingId(bookingId);
        
        if (paymentTransaction) {
          // Process the upfront payment
          await ComprehensivePaymentService.processUpfrontPayment(
            paymentTransaction.id!,
            paymentCalculation.upfrontAmount,
            paymentResponse.transactionId!
          );
        }

        toast({
          title: "Booking Confirmed!",
          description: `${schoolDays} school day${schoolDays > 1 ? 's' : ''} booked successfully! Upfront payment of ${ComprehensivePaymentService.formatPrice(paymentCalculation.upfrontAmount)} completed.`,
        });

        // Show remaining balance info
        if (paymentCalculation.balanceAmount > 0) {
          toast({
            title: "Balance Payment Due",
            description: `Remaining balance of ${ComprehensivePaymentService.formatPrice(paymentCalculation.balanceAmount)} must be paid by ${paymentCalculation.balanceDueDate.toLocaleDateString()}`,
          });
        }
        
        // Close modal and refresh
        onBookingComplete();
        onClose();
      } else {
        // Payment failed, delete the created booking
        // await BookingService.deleteBooking(bookingId); // Implement this if needed
        
        toast({
          title: "Payment Failed",
          description: paymentResponse.message,
          variant: "destructive"
        });
      }
      
    } catch (error) {
      console.error('Error creating booking:', error);
      toast({
        title: "Booking Failed",
        description: "Failed to create booking. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  if (!driver) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-lg font-semibold">
            Confirm Booking
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6">
          {/* Driver Info */}
          <Card className="border border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-12 h-12">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials(driver.firstName, driver.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-foreground">
                    {driver.firstName} {driver.lastName}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {driver.phone}
                  </p>
                  {driver.vehicle && (
                    <p className="text-sm text-muted-foreground">
                      {driver.vehicle.color} {driver.vehicle.model}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Child Info */}
          <Card className="border border-border">
            <CardContent className="p-4">
              <h4 className="font-medium text-foreground mb-2">Trip Details</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Child:</span> {child.fullName}
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <span className="font-medium">Pickup:</span><br />
                    {child.tripStartLocation.address}
                  </div>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <span className="font-medium">Drop-off:</span><br />
                    {child.schoolLocation.address}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Booking Details */}
          <Card className="border border-border">
            <CardContent className="p-4 space-y-4">
              <h4 className="font-medium text-foreground">Booking Period</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rideTime">Daily Pickup Time</Label>
                <Input
                  id="rideTime"
                  type="time"
                  value={rideTime}
                  onChange={(e) => setRideTime(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  This will be the pickup time for all school days in the selected period
                </p>
              </div>

              {startDate && endDate && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <p className="text-sm font-medium text-blue-900">Booking Summary</p>
                  </div>
                  <p className="text-xs text-blue-700 mt-1">
                    {(() => {
                      const start = new Date(startDate);
                      const end = new Date(endDate);
                      let schoolDays = 0;
                      
                      for (let currentDate = new Date(start); currentDate <= end; currentDate.setDate(currentDate.getDate() + 1)) {
                        // Count only weekdays (Monday to Friday)
                        if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
                          schoolDays++;
                        }
                      }
                      
                      return `${schoolDays} school day${schoolDays !== 1 ? 's' : ''} will be booked (weekends excluded)`;
                    })()}
                  </p>
                </div>
              )}

              {/* Pricing Information */}
              {pricingCalculation && paymentCalculation && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <p className="text-sm font-medium text-green-900">Pricing Breakdown</p>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-green-700">Distance:</span>
                      <span className="font-medium text-green-900">{pricingCalculation.totalDistance} km</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-green-700">School days:</span>
                      <span className="font-medium text-green-900">{pricingCalculation.numberOfDays} days</span>
                    </div>
                    
                    <hr className="border-green-200" />
                    
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-green-900">Total Price:</span>
                      <span className="text-lg font-bold text-green-900">
                        {ComprehensivePaymentService.formatPrice(paymentCalculation.totalAmount)}
                      </span>
                    </div>

                    <hr className="border-green-200" />
                    
                    <div className="text-xs text-green-600 space-y-1">
                      <div className="flex justify-between">
                        <span>Upfront payment (25%):</span>
                        <span className="font-medium">{ComprehensivePaymentService.formatPrice(paymentCalculation.upfrontAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Balance payment:</span>
                        <span className="font-medium">{ComprehensivePaymentService.formatPrice(paymentCalculation.balanceAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Balance due by:</span>
                        <span className="font-medium">{paymentCalculation.balanceDueDate.toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">Special Instructions (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any special instructions for the driver..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              variant="destructive" 
              onClick={onClose}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmBooking}
              className="flex-1"
              disabled={loading || !startDate || !endDate || !rideTime || !paymentCalculation}
            >
              {loading 
                ? 'Processing...' 
                : paymentCalculation 
                  ? `Pay ${ComprehensivePaymentService.formatPrice(paymentCalculation.upfrontAmount)} & Confirm`
                  : 'Confirm Booking'
              }
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default BookingConfirmationModal;