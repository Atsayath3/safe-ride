import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MapPin, Calendar, Clock, User, Phone, CalendarDays, DollarSign } from 'lucide-react';
import { Booking } from '@/interfaces/booking';
import { PricingService } from '@/services/pricingService';
import { format, differenceInDays } from 'date-fns';

interface BookingRequestCardProps {
  booking: Booking;
  onAccept: (bookingId: string) => void;
  onReject: (bookingId: string) => void;
  onComplete: (bookingId: string) => void;
  loading?: boolean;
}

const BookingRequestCard: React.FC<BookingRequestCardProps> = ({
  booking,
  onAccept,
  onReject,
  onComplete,
  loading = false
}) => {
  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="border border-orange-200 hover:shadow-lg transition-shadow bg-white">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header with Status */}
          <div className="flex items-center justify-between">
            <Badge className={getStatusColor(booking.status)}>
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </Badge>
            <div className="text-sm text-orange-600">
              {booking.isRecurring && booking.endDate ? (
                <div className="text-center">
                  <div>{format(booking.rideDate, 'MMM dd')} - {format(booking.endDate, 'MMM dd, yyyy')}</div>
                  <div className="text-xs text-orange-500">{booking.recurringDays} school days</div>
                </div>
              ) : (
                format(booking.rideDate, 'MMM dd, yyyy')
              )}
            </div>
          </div>

          {/* Trip Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-orange-600" />
              <span className="font-semibold text-gray-900">Booking #{booking.id.slice(-6)}</span>
            </div>

            {booking.isRecurring && booking.endDate ? (
              <>
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-orange-600" />
                  <span className="text-sm text-gray-800 font-medium">
                    Period Booking: {format(booking.rideDate, 'EEEE, MMMM dd, yyyy')} - {format(booking.endDate, 'EEEE, MMMM dd, yyyy')}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-600" />
                  <span className="text-sm text-gray-800 font-medium">
                    Daily pickup at {booking.dailyTime || format(booking.rideDate, 'hh:mm a')}
                  </span>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="text-sm font-medium text-blue-900 mb-1">Period Summary</div>
                  <div className="text-sm text-blue-700">
                    {booking.recurringDays} school day{booking.recurringDays !== 1 ? 's' : ''} 
                    {booking.recurringDays && (
                      <span className="ml-1">(weekends excluded)</span>
                    )}
                  </div>
                  {booking.totalPrice && (
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-blue-200">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-blue-600" />
                        <span className="text-xs text-blue-600">Total Price:</span>
                      </div>
                      <span className="text-sm font-semibold text-blue-900">
                        {PricingService.formatPrice(booking.totalPrice)}
                      </span>
                    </div>
                  )}
                  {booking.distance && (
                    <div className="text-xs text-blue-600 mt-1">
                      Distance: {booking.distance} km @ Rs.{booking.pricePerKm || 25}/km
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-orange-600" />
                  <span className="text-sm text-gray-800 font-medium">
                    {format(booking.rideDate, 'EEEE, MMMM dd, yyyy')}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-600" />
                  <span className="text-sm text-gray-800 font-medium">
                    {format(booking.rideDate, 'hh:mm a')}
                  </span>
                </div>
              </>
            )}

            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-900">Pickup</div>
                  <div className="text-sm text-gray-800 font-medium">
                    {booking.pickupLocation.address}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-900">Drop-off</div>
                  <div className="text-sm text-gray-800 font-medium">
                    {booking.dropoffLocation.address}
                  </div>
                </div>
              </div>
            </div>

            {booking.notes && (
              <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                <div className="text-sm font-semibold mb-1 text-gray-900">Special Instructions</div>
                <div className="text-sm text-gray-800 font-medium">{booking.notes}</div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            {booking.status === 'pending' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onReject(booking.id)}
                  disabled={loading}
                  className="flex-1 border-orange-200 text-orange-700 hover:bg-orange-50"
                >
                  Decline
                </Button>
                <Button
                  size="sm"
                  onClick={() => onAccept(booking.id)}
                  disabled={loading}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                >
                  Accept
                </Button>
              </>
            )}

            {booking.status === 'confirmed' && (
              <Button
                size="sm"
                onClick={() => onComplete(booking.id)}
                disabled={loading}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
              >
                Mark as Completed
              </Button>
            )}

            {(booking.status === 'cancelled' || booking.status === 'completed') && (
              <div className="w-full text-center text-sm text-orange-600 py-2">
                {booking.status === 'completed' ? 'Trip Completed' : 'Booking Cancelled'}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BookingRequestCard;