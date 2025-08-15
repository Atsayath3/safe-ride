import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MapPin, Calendar, Clock, User, Phone } from 'lucide-react';
import { Booking } from '@/interfaces/booking';
import { format } from 'date-fns';

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
              {format(booking.rideDate, 'MMM dd, yyyy')}
            </div>
          </div>

          {/* Trip Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-orange-600" />
              <span className="font-medium text-orange-900">Booking #{booking.id.slice(-6)}</span>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-orange-600" />
              <span className="text-sm text-orange-800">
                {format(booking.rideDate, 'EEEE, MMMM dd, yyyy')}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-600" />
              <span className="text-sm text-orange-800">
                {format(booking.rideDate, 'hh:mm a')}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-orange-900">Pickup</div>
                  <div className="text-sm text-orange-600">
                    {booking.pickupLocation.address}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-orange-900">Drop-off</div>
                  <div className="text-sm text-orange-600">
                    {booking.dropoffLocation.address}
                  </div>
                </div>
              </div>
            </div>

            {booking.notes && (
              <div className="bg-orange-50 rounded-lg p-3 border border-orange-100">
                <div className="text-sm font-medium mb-1 text-orange-900">Special Instructions</div>
                <div className="text-sm text-orange-700">{booking.notes}</div>
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