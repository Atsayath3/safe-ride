import React, { useState } from 'react';
import { Calendar, Clock, AlertCircle, CreditCard, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Booking } from '../../interfaces/booking';
import { BookingManagementService } from '../../services/bookingManagementService';

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
  const [selectedDays, setSelectedDays] = useState(7);
  const [extendPrice, setExtendPrice] = useState(0);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    // Calculate price for additional days
    const dailyRate = booking.totalPrice / (booking.recurringDays || 1);
    setExtendPrice(dailyRate * selectedDays);
  }, [selectedDays, booking]);

  const daysOptions = [3, 7, 14, 30];
  const currentEndDate = booking.endDate || booking.rideDate;
  const newEndDate = new Date(currentEndDate);
  newEndDate.setDate(currentEndDate.getDate() + selectedDays);

  const daysRemaining = BookingManagementService.getDaysRemaining(booking);
  const statusInfo = BookingManagementService.getBookingStatusInfo(booking);

  const handleExtendBooking = () => {
    setShowPaymentDetails(true);
  };

  const handlePaymentSuccess = async () => {
    setIsLoading(true);
    try {
      const success = await BookingManagementService.extendBooking(
        booking.id!,
        newEndDate,
        selectedDays,
        extendPrice
      );

      if (success) {
        onExtended();
        onClose();
        setShowPaymentDetails(false);
      } else {
        alert('Failed to extend booking. Please try again.');
      }
    } catch (error) {
      console.error('Error extending booking:', error);
      alert('Failed to extend booking. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900">Extend Booking</h2>
            <p className="text-sm text-gray-600 mt-1">Add more days to your current booking</p>
          </div>

          <div className="p-6 space-y-6">
            {/* Current Booking Status */}
            <div className={`p-4 rounded-lg border ${statusInfo.bgColor}`}>
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
            </div>

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
            <div className="space-y-3">
              <h3 className="font-semibold text-lg text-gray-900">Extend by</h3>
              <div className="grid grid-cols-2 gap-3">
                {daysOptions.map((days) => (
                  <button
                    key={days}
                    onClick={() => setSelectedDays(days)}
                    className={`p-4 rounded-lg border text-sm font-semibold transition-colors ${
                      selectedDays === days
                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg'
                        : 'bg-white border-gray-300 text-gray-800 hover:bg-blue-50 hover:border-blue-300'
                    }`}
                  >
                    {days} day{days !== 1 ? 's' : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* New End Date */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg text-gray-900">New End Date</h3>
              <div className="p-4 bg-green-100 border-2 border-green-300 rounded-lg">
                <div className="flex items-center gap-3 text-base font-semibold text-green-800">
                  <Calendar className="w-5 h-5 text-green-700" />
                  <span>{newEndDate.toLocaleDateString()}</span>
                </div>
                <p className="text-sm font-medium text-green-700 mt-2">
                  Total booking period: {(booking.recurringDays || 1) + selectedDays} days
                </p>
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg text-gray-900">Additional Cost</h3>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
                <div className="flex justify-between text-base font-medium text-gray-800">
                  <span>Additional {selectedDays} days</span>
                  <span className="text-blue-700">Rs. {extendPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-xl pt-2 border-t-2 border-blue-200 text-gray-900">
                  <span>Total to Pay</span>
                  <span className="text-blue-700">Rs. {extendPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-gray-100 flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-2 border-gray-400 text-gray-700 font-semibold hover:bg-gray-100"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleExtendBooking}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg"
              disabled={isLoading}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              {isLoading ? 'Processing...' : 'Proceed to Payment'}
            </Button>
          </div>
        </div>
      </div>

      {/* Simple Payment Confirmation */}
      {showPaymentDetails && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Confirm Payment</h3>
              <button
                onClick={() => setShowPaymentDetails(false)}
                className="text-gray-500 hover:text-gray-700 p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="text-center">
                <CreditCard className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                <h4 className="font-bold text-xl text-gray-900 mb-2">Extension Payment</h4>
                <p className="text-3xl font-bold text-blue-700">Rs. {extendPrice.toFixed(2)}</p>
                <p className="text-base font-semibold text-gray-700 mt-2">For {selectedDays} additional days</p>
              </div>
              
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
            </div>
            
            <div className="p-6 border-t border-gray-100 flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowPaymentDetails(false)}
                className="flex-1 border-2 border-gray-400 text-gray-700 font-semibold hover:bg-gray-100"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handlePaymentSuccess}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold shadow-lg"
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : 'Confirm Payment'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
