import React, { useState, useEffect } from 'react';
import { Calendar, Clock, AlertCircle, CreditCard, X, Plus, Minus, CheckCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Booking } from '../../interfaces/booking';
import { BookingManagementService } from '../../services/bookingManagementService';
import { PaymentService, PaymentRequest } from '../../services/paymentService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface ExtendBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking;
  onExtended: () => void;
}

export const ExtendBookingModal: React.FC<ExtendBookingModalProps> = ({
  isOpen,
  onClose,
  booking,
  onExtended
}) => {
  const { userProfile } = useAuth();
  const [selectedDays, setSelectedDays] = useState(7);
  const [extendPrice, setExtendPrice] = useState(0);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const daysOptions = [3, 7, 14, 30];
  const currentEndDate = booking.endDate || booking.rideDate;
  const newEndDate = new Date(currentEndDate);
  newEndDate.setDate(currentEndDate.getDate() + selectedDays);

  const daysRemaining = BookingManagementService.getDaysRemaining(booking);
  const statusInfo = BookingManagementService.getBookingStatusInfo(booking);

  // Debug logging
  useEffect(() => {
    if (isOpen && booking) {
      console.log('ExtendBookingModal opened for booking:', booking.id);
    }
  }, [isOpen, booking]);

  // Calculate price for additional days
  useEffect(() => {
    if (booking.totalPrice && booking.recurringDays) {
      // Use existing booking pricing
      const dailyRate = booking.totalPrice / booking.recurringDays;
      setExtendPrice(dailyRate * selectedDays);
    } else {
      // Fallback pricing calculation
      const defaultDailyRate = 500; // Rs. 500 per day default
      const estimatedRate = booking.distance ? booking.distance * (booking.pricePerKm || 25) : defaultDailyRate;
      setExtendPrice(estimatedRate * selectedDays);
    }
  }, [selectedDays, booking]);

  const handleExtendBooking = () => {
    setShowPaymentDetails(true);
  };

  const handlePaymentSuccess = async () => {
    setIsLoading(true);
    
    try {
      // Validate basic requirements
      if (!booking || !booking.id) {
        throw new Error('Invalid booking data');
      }

      if (!userProfile) {
        throw new Error('User profile not found');
      }

      if (extendPrice <= 0) {
        throw new Error('Invalid pricing calculation');
      }

      // Create payment request
      const paymentRequest: PaymentRequest = {
        bookingId: booking.id!,
        amount: extendPrice,
        currency: 'LKR',
        description: `Booking Extension - ${selectedDays} additional days`,
        customerInfo: {
          name: userProfile.firstName + ' ' + userProfile.lastName,
          email: userProfile.email || '',
          phone: userProfile.phone || ''
        },
        metadata: {
          bookingId: booking.id,
          extensionDays: selectedDays,
          newEndDate: newEndDate.toISOString(),
          originalEndDate: currentEndDate.toISOString()
        }
      };

      // Process the payment
      const paymentResponse = await PaymentService.processPayment(paymentRequest);

      if (!paymentResponse.success) {
        throw new Error(paymentResponse.message || 'Payment failed');
      }

      // Extend the booking
      const success = await BookingManagementService.extendBooking(
        booking.id!,
        newEndDate,
        selectedDays,
        extendPrice
      );

      if (success) {
        toast({
          title: "Booking Extended Successfully!",
          description: `Your booking has been extended by ${selectedDays} days until ${newEndDate.toLocaleDateString()}. Payment of ${PaymentService.formatPrice(extendPrice)} completed.`,
        });
        
        onExtended();
        onClose();
        setShowPaymentDetails(false);
      } else {
        throw new Error('Failed to extend booking');
      }
    } catch (error: any) {
      toast({
        title: "Extension Failed",
        description: error.message || "Failed to extend booking. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Simple modal overlay - testing if Sheet is the issue */}
      <div className="fixed inset-0 z-50 bg-black/50 flex items-end">
        <div className="w-full bg-white rounded-t-3xl max-h-[90vh] overflow-y-auto">
          <div className="p-6 pb-4 bg-gradient-to-r from-blue-50 to-white rounded-t-3xl">
            <div className="flex items-center justify-between">
              <h2 className="font-nunito text-xl text-blue-900">
                Extend Booking
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 rounded-full hover:bg-blue-100 text-blue-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-blue-600 mt-1">Add more days to your current booking</p>
          </div>

          <div className="px-6 pb-8 space-y-6">
            {/* Current Booking Status */}
            <Card className={`border-2 ${statusInfo.bgColor}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${statusInfo.color.replace('text-', 'bg-')}`}></div>
                      <span className={`font-semibold text-base ${statusInfo.color}`}>{statusInfo.status}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-700 mt-1">{statusInfo.description}</p>
                  </div>
                  <AlertCircle className={`w-6 h-6 ${statusInfo.color}`} />
                </div>
              </CardContent>
            </Card>

            {/* Current Booking Period */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg text-gray-900">Current Booking Period</h3>
              <div className="flex items-center gap-3 text-sm font-medium text-gray-700">
                <Calendar className="w-5 h-5 text-blue-600" />
                <span>{BookingManagementService.formatBookingPeriod(booking)}</span>
              </div>
              <div className="flex items-center gap-3 text-sm font-medium text-gray-700">
                <Clock className="w-5 h-5 text-orange-600" />
                <span>{daysRemaining} days remaining</span>
              </div>
            </div>

            {/* Extension Options */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-gray-900">How many days to extend?</h3>
              
              {/* Custom Days Selector */}
              <div className="flex items-center justify-center gap-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDays(Math.max(1, selectedDays - 1))}
                  className="w-10 h-10 rounded-full border-blue-300 text-blue-600 hover:bg-blue-100"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-700">{selectedDays}</div>
                  <div className="text-sm font-medium text-blue-600">days</div>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDays(selectedDays + 1)}
                  className="w-10 h-10 rounded-full border-blue-300 text-blue-600 hover:bg-blue-100"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {/* Quick Selection Options */}
              <div className="grid grid-cols-4 gap-2">
                {daysOptions.map((days) => (
                  <Button
                    key={days}
                    variant={selectedDays === days ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedDays(days)}
                    className={`h-12 font-semibold ${
                      selectedDays === days 
                        ? "bg-blue-600 text-white border-blue-600" 
                        : "border-blue-300 text-blue-600 hover:bg-blue-50"
                    }`}
                  >
                    {days} days
                  </Button>
                ))}
              </div>
            </div>

            {/* New End Date Display */}
            <Card className="border-2 border-green-200 bg-green-50">
              <CardContent className="p-4">
                <h4 className="font-semibold text-green-800 mb-2">New Booking End Date</h4>
                <div className="flex items-center gap-3 text-base font-semibold text-green-800">
                  <Calendar className="w-5 h-5 text-green-700" />
                  <span>{newEndDate.toLocaleDateString()}</span>
                </div>
                <p className="text-sm font-medium text-green-700 mt-2">
                  Total booking period: {(booking.recurringDays || 1) + selectedDays} days
                </p>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold text-lg text-gray-900">Additional Cost</h3>
                <div className="flex justify-between text-base font-medium text-gray-800">
                  <span>Additional {selectedDays} days</span>
                  <span className="text-blue-700">Rs. {extendPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-xl pt-2 border-t-2 border-blue-200 text-gray-900">
                  <span>Total to Pay</span>
                  <span className="text-blue-700">Rs. {extendPrice.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1 border-2 border-gray-400 text-gray-700 font-semibold hover:bg-gray-100 h-14"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleExtendBooking}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg h-14"
                disabled={isLoading}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                {isLoading ? 'Processing...' : 'Proceed to Payment'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Payment Confirmation */}
      {showPaymentDetails && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Confirm Payment</h3>
              <button
                onClick={() => setShowPaymentDetails(false)}
                className="text-gray-500 hover:text-gray-700 p-1"
                disabled={isLoading}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="text-center">
                {isLoading ? (
                  <div className="space-y-4">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
                    <h4 className="font-bold text-xl text-gray-900">Processing Payment...</h4>
                    <p className="text-sm text-gray-600">Please wait while we process your payment</p>
                  </div>
                ) : (
                  <>
                    <CreditCard className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                    <h4 className="font-bold text-xl text-gray-900 mb-2">Extension Payment</h4>
                    <p className="text-3xl font-bold text-blue-700">{PaymentService.formatPrice(extendPrice)}</p>
                    <p className="text-base font-semibold text-gray-700 mt-2">For {selectedDays} additional days</p>
                  </>
                )}
              </div>
              
              {!isLoading && (
                <div className="bg-gray-100 rounded-lg p-4 text-base space-y-2">
                  <div className="flex justify-between font-medium text-gray-800">
                    <span>Current end date:</span>
                    <span>{currentEndDate.toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-gray-900">
                    <span>New end date:</span>
                    <span className="text-green-700">{newEndDate.toLocaleDateString()}</span>
                  </div>
                </div>
              )}
            </div>
            
            {!isLoading && (
              <div className="p-6 border-t border-gray-100 flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowPaymentDetails(false)}
                  className="flex-1 border-2 border-gray-400 text-gray-700 font-semibold hover:bg-gray-100"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handlePaymentSuccess}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold shadow-lg"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Confirm Payment
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ExtendBookingModal;
