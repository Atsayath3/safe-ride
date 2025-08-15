import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Users, Clock, TrendingUp } from 'lucide-react';
import MobileLayout from '@/components/mobile/MobileLayout';
import BookingRequestCard from '@/components/driver/BookingRequestCard';
import { useAuth } from '@/contexts/AuthContext';
import { BookingService } from '@/services/bookingService';
import { Booking, DriverAvailability } from '@/interfaces/booking';
import { toast } from '@/hooks/use-toast';

const BookingManagement = () => {
  const { userProfile } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [availability, setAvailability] = useState<DriverAvailability | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (userProfile?.uid) {
      loadBookings();
      loadAvailability();
    }
  }, [userProfile]);

  const loadBookings = async () => {
    if (!userProfile?.uid) return;
    
    setLoading(true);
    try {
      const driverBookings = await BookingService.getDriverBookings(userProfile.uid);
      setBookings(driverBookings);
    } catch (error) {
      console.error('Error loading bookings:', error);
      toast({
        title: "Error",
        description: "Failed to load bookings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAvailability = async () => {
    if (!userProfile?.uid) return;
    
    try {
      const driverAvailability = await BookingService.getDriverAvailability(userProfile.uid);
      setAvailability(driverAvailability);
    } catch (error) {
      console.error('Error loading availability:', error);
    }
  };

  const handleAcceptBooking = async (bookingId: string) => {
    setActionLoading(bookingId);
    try {
      await BookingService.updateBookingStatus(bookingId, 'confirmed');
      await loadBookings();
      await loadAvailability();
      toast({
        title: "Booking Accepted",
        description: "You have successfully accepted the booking.",
      });
    } catch (error) {
      console.error('Error accepting booking:', error);
      toast({
        title: "Error",
        description: "Failed to accept booking. Please try again.",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectBooking = async (bookingId: string) => {
    setActionLoading(bookingId);
    try {
      await BookingService.updateBookingStatus(bookingId, 'cancelled');
      await loadBookings();
      await loadAvailability();
      toast({
        title: "Booking Declined",
        description: "You have declined the booking.",
      });
    } catch (error) {
      console.error('Error rejecting booking:', error);
      toast({
        title: "Error",
        description: "Failed to decline booking. Please try again.",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompleteBooking = async (bookingId: string) => {
    setActionLoading(bookingId);
    try {
      await BookingService.updateBookingStatus(bookingId, 'completed');
      await loadBookings();
      await loadAvailability();
      toast({
        title: "Trip Completed",
        description: "You have marked the trip as completed.",
      });
    } catch (error) {
      console.error('Error completing booking:', error);
      toast({
        title: "Error",
        description: "Failed to complete booking. Please try again.",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
  const completedBookings = bookings.filter(b => b.status === 'completed');

  return (
    <MobileLayout title="Booking Management" showBack theme="driver">
      <div className="p-4 space-y-6 min-h-screen">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-orange-200 shadow-md bg-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-600" />
                <div>
                  <div className="text-2xl font-bold text-orange-900">
                    {availability?.availableSeats || 0}
                  </div>
                  <div className="text-sm text-orange-600">Available Seats</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200 shadow-md bg-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-orange-900">{pendingBookings.length}</div>
                  <div className="text-sm text-orange-600">Pending Requests</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Booking Tabs */}
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 bg-orange-100">
            <TabsTrigger value="pending" className="relative data-[state=active]:bg-orange-600 data-[state=active]:text-white">
              Pending
              {pendingBookings.length > 0 && (
                <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs">
                  {pendingBookings.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="confirmed" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">
              Confirmed ({confirmedBookings.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">
              Completed ({completedBookings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {loading ? (
              <div className="text-center py-8 text-orange-600">
                Loading bookings...
              </div>
            ) : pendingBookings.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-orange-400 mx-auto mb-4" />
                <p className="text-orange-600">No pending booking requests</p>
              </div>
            ) : (
              pendingBookings.map((booking) => (
                <BookingRequestCard
                  key={booking.id}
                  booking={booking}
                  onAccept={handleAcceptBooking}
                  onReject={handleRejectBooking}
                  onComplete={handleCompleteBooking}
                  loading={actionLoading === booking.id}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="confirmed" className="space-y-4">
            {confirmedBookings.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-orange-400 mx-auto mb-4" />
                <p className="text-orange-600">No confirmed bookings</p>
              </div>
            ) : (
              confirmedBookings.map((booking) => (
                <BookingRequestCard
                  key={booking.id}
                  booking={booking}
                  onAccept={handleAcceptBooking}
                  onReject={handleRejectBooking}
                  onComplete={handleCompleteBooking}
                  loading={actionLoading === booking.id}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedBookings.length === 0 ? (
              <div className="text-center py-8">
                <TrendingUp className="w-12 h-12 text-orange-400 mx-auto mb-4" />
                <p className="text-orange-600">No completed trips yet</p>
              </div>
            ) : (
              completedBookings.map((booking) => (
                <BookingRequestCard
                  key={booking.id}
                  booking={booking}
                  onAccept={handleAcceptBooking}
                  onReject={handleRejectBooking}
                  onComplete={handleCompleteBooking}
                  loading={actionLoading === booking.id}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MobileLayout>
  );
};

export default BookingManagement;