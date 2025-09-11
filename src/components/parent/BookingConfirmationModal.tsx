import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MapPin, Users, Calendar, Clock, DollarSign, Phone } from 'lucide-react';
import { UserProfile, useAuth } from '@/contexts/AuthContext';
import { Child } from '@/pages/parent/ParentDashboard';
import { BookingService } from '@/services/bookingService';
import { PricingService, PricingCalculation } from '@/services/pricingService';
import { ComprehensivePaymentService } from '@/services/comprehensivePaymentService';
import { NotificationService } from '@/services/notificationService';
import { PaymentCalculation } from '@/interfaces/payment';
import PaymentDetailsModal from './PaymentDetailsModal';
import PaymentGatewayModal from './PaymentGatewayModal';
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
  
  // Modal states for the new flow
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [showPaymentGateway, setShowPaymentGateway] = useState(false);
  const [pendingBookingData, setPendingBookingData] = useState<any>(null);

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
    
    // Prepare booking data
    const bookingData = {
      parentId: userProfile.uid,
      driverId: driver.uid,
      childId: child.id,
      pickupLocation: child.tripStartLocation,
      dropoffLocation: child.schoolLocation,
      rideDate: start,
      endDate: end,
      isRecurring: true,
      recurringDays: schoolDays,
      dailyTime: rideTime,
      ...(notes.trim() && { notes: notes.trim() }), // Only include notes if it's not empty
      totalPrice: pricingCalculation?.totalPrice,
      distance: pricingCalculation?.totalDistance,
      pricePerKm: 25,
      driverAvailability: pricingCalculation?.driverAvailability
    };

    setPendingBookingData(bookingData);
    
    // Show payment details modal first
    setShowPaymentDetails(true);
  };

  const handleContinueToPayment = (paymentType: 'upfront' | 'balance') => {
    setShowPaymentDetails(false);
    setShowPaymentGateway(true);
  };

  const handlePaymentSuccess = async (transactionId: string) => {
    if (!pendingBookingData || !paymentCalculation) {
      toast({
        title: "Error",
        description: "Missing booking data",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      console.log('🚀 Starting booking creation process with data:', pendingBookingData);

      // Create the booking
      console.log('📝 Creating confirmed booking...');
      const bookingId = await BookingService.createConfirmedBooking(pendingBookingData);
      console.log('✅ Booking created successfully with ID:', bookingId);
      
      // Send notification to driver about new booking request
      try {
        console.log('📧 Sending driver notification...');
        await NotificationService.sendBookingRequestNotification(
          pendingBookingData.driverId,
          pendingBookingData.parentId,
          {
            bookingId,
            parentName: `${userProfile?.firstName || ''} ${userProfile?.lastName || ''}`.trim() || 'Parent',
            childName: child?.fullName || 'Child',
            pickupLocation: child?.tripStartLocation.address || 'Pickup Location',
            schoolName: child?.schoolName || 'School',
            rideDate: new Date(pendingBookingData.rideDate),
            totalPrice: paymentCalculation.totalAmount,
            recurringDays: pendingBookingData.recurringDays
          }
        );
        console.log('✅ Driver notification sent successfully');
      } catch (notificationError) {
        console.error('❌ Failed to send driver notification:', notificationError);
        // Don't fail the booking if notification fails
      }
      
      // Create payment transaction record
      try {
        console.log('💳 Creating payment transaction record...');
        await ComprehensivePaymentService.createPaymentTransaction(
          bookingId,
          pendingBookingData.parentId,
          pendingBookingData.driverId,
          paymentCalculation.totalAmount,
          pendingBookingData.endDate
        );
        console.log('✅ Payment transaction record created');
      } catch (paymentTransactionError) {
        console.error('❌ Failed to create payment transaction:', paymentTransactionError);
        throw new Error(`Payment transaction creation failed: ${paymentTransactionError.message}`);
      }

      // Process the upfront payment
      try {
        console.log('💰 Processing upfront payment...');
        const paymentTransaction = await ComprehensivePaymentService.getPaymentByBookingId(bookingId);
        if (paymentTransaction) {
          await ComprehensivePaymentService.processUpfrontPayment(
            paymentTransaction.id!,
            paymentCalculation.upfrontAmount,
            transactionId
          );
          console.log('✅ Upfront payment processed successfully');
        } else {
          throw new Error('Payment transaction not found after creation');
        }
      } catch (paymentProcessError) {
        console.error('❌ Failed to process upfront payment:', paymentProcessError);
        throw new Error(`Payment processing failed: ${paymentProcessError.message}`);
      }

      console.log('✅ Booking process completed successfully');

      toast({
        title: "Booking Confirmed!",
        description: `${pendingBookingData.recurringDays} school day${pendingBookingData.recurringDays > 1 ? 's' : ''} booked successfully! Initial payment of ${ComprehensivePaymentService.formatPrice(paymentCalculation.upfrontAmount)} completed.`,
      });

      if (paymentCalculation.balanceAmount > 0) {
        toast({
          title: "Balance Payment Reminder",
          description: `Remaining balance of ${ComprehensivePaymentService.formatPrice(paymentCalculation.balanceAmount)} must be paid by ${paymentCalculation.balanceDueDate.toLocaleDateString()}`,
        });
      }

      // Close modals and refresh
      setShowPaymentGateway(false);
      onBookingComplete();
      onClose();
      
    } catch (error: any) {
      console.error('❌ Booking creation failed:', error);
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to create booking after payment. Please contact support.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentFailure = (error: string) => {
    setShowPaymentGateway(false);
    toast({
      title: "Payment Failed",
      description: error,
      variant: "destructive"
    });
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
          <Card className="border border-gray-300 bg-white shadow-sm">
            <CardContent className="p-4">
              <h4 className="font-medium text-gray-900 mb-3">Selected Driver</h4>
              <div className="flex items-center gap-4">
                <Avatar className="w-14 h-14">
                  <AvatarFallback className="bg-blue-600 text-white text-lg font-semibold">
                    {getInitials(driver.firstName, driver.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-lg">
                    {driver.firstName} {driver.lastName}
                  </h3>
                  <p className="text-sm text-gray-800 font-medium flex items-center gap-2 mt-1">
                    <Phone className="w-4 h-4 text-blue-600" />
                    {driver.phone}
                  </p>
                  {driver.vehicle && (
                    <p className="text-sm text-gray-800 font-medium mt-1">
                      <span className="text-gray-900 font-semibold">Vehicle:</span> {driver.vehicle.color} {driver.vehicle.model}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Child Info */}
          <Card className="border border-gray-300 bg-white shadow-sm">
            <CardContent className="p-4">
              <h4 className="font-medium text-gray-900 mb-3">Trip Details</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-gray-900">Child:</span> 
                  <span className="font-medium text-gray-800">{child.fullName}</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-green-600 mt-0.5" />
                  <div>
                    <span className="font-semibold text-gray-900">Pickup:</span><br />
                    <span className="text-gray-800 font-medium">{child.tripStartLocation.address}</span>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-red-600 mt-0.5" />
                  <div>
                    <span className="font-semibold text-gray-900">Drop-off:</span><br />
                    <span className="text-gray-800 font-medium">{child.schoolLocation.address}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Booking Details */}
          <Card className="border border-gray-300 bg-white shadow-sm">
            <CardContent className="p-4 space-y-4">
              <h4 className="font-medium text-gray-900">Booking Period</h4>
              
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
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md"
              disabled={loading || !startDate || !endDate || !rideTime || !paymentCalculation}
            >
              {loading 
                ? 'Processing...' 
                : 'Proceed to Payment'
              }
            </Button>
          </div>
        </div>
      </SheetContent>

      {/* Payment Details Modal */}
      {showPaymentDetails && paymentCalculation && pricingCalculation && (
        <PaymentDetailsModal
          isOpen={showPaymentDetails}
          onClose={() => setShowPaymentDetails(false)}
          onContinuePayment={handleContinueToPayment}
          totalAmount={paymentCalculation.totalAmount}
          bookingEndDate={new Date(endDate)}
          bookingDetails={{
            driverName: `${driver?.firstName} ${driver?.lastName}`,
            childName: child.fullName,
            schoolDays: pricingCalculation.numberOfDays,
            distance: pricingCalculation.totalDistance,
            startDate: startDate,
            endDate: endDate
          }}
          paymentType="upfront"
        />
      )}

      {/* Payment Gateway Modal */}
      {showPaymentGateway && paymentCalculation && userProfile && pendingBookingData && (
        <PaymentGatewayModal
          isOpen={showPaymentGateway}
          onClose={() => setShowPaymentGateway(false)}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentFailure={handlePaymentFailure}
          paymentAmount={paymentCalculation.upfrontAmount}
          paymentType="upfront"
          bookingId="temp-booking-id" // This will be updated after booking creation
          customerInfo={{
            name: `${userProfile.firstName} ${userProfile.lastName}`,
            email: userProfile.email,
            phone: userProfile.phone || ''
          }}
        />
      )}
    </Sheet>
  );
};

export default BookingConfirmationModal;