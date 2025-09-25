import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Users, Clock, TrendingUp, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ResponsiveLayout from '@/components/ResponsiveLayout';
import BookingRequestCard from '@/components/driver/BookingRequestCard';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { BookingService } from '@/services/bookingService';
import { Booking, DriverAvailability } from '@/interfaces/booking';
import { toast } from '@/hooks/use-toast';

const BookingManagement = () => {
  const { userProfile, logout } = useAuth();
  const navigate = useNavigate();
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
    if (!userProfile?.uid) {
      console.log('❌ No user profile UID available for loading bookings');
      return;
    }
    
    console.log('📋 Loading bookings for driver:', userProfile.uid);
    setLoading(true);
    try {
      const driverBookings = await BookingService.getDriverBookings(userProfile.uid);
      console.log('✅ Successfully loaded bookings:', driverBookings.length);
      setBookings(driverBookings);
    } catch (error: any) {
      console.error('❌ Error loading bookings:', error);
      
      // More specific error messages
      let errorMessage = "Failed to load bookings. Please try again.";
      if (error?.code === 'failed-precondition') {
        errorMessage = "Database index required. Please contact support.";
      } else if (error?.code === 'permission-denied') {
        errorMessage = "Access denied. Please check your permissions.";
      } else if (error?.code === 'unavailable') {
        errorMessage = "Service temporarily unavailable. Please try again later.";
      } else if (error?.message?.includes('index')) {
        errorMessage = "Database configuration issue. Please contact support.";
      }
      
      toast({
        title: "Error Loading Bookings",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAvailability = async () => {
    if (!userProfile?.uid) {
      console.log('❌ No user profile UID available for loading availability');
      return;
    }
    
    console.log('🪑 Loading availability for driver:', userProfile.uid);
    try {
      const driverAvailability = await BookingService.getDriverAvailability(userProfile.uid);
      console.log('✅ Successfully loaded availability:', driverAvailability);
      setAvailability(driverAvailability);
    } catch (error) {
      console.error('❌ Error loading availability:', error);
      // Don't show toast for availability errors as it's not critical
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

  const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
  const completedBookings = bookings.filter(b => b.status === 'completed');

  return (
    <ResponsiveLayout 
      title="Booking Management" 
      theme="driver"
      userProfile={userProfile}
      onLogout={logout}
      rightContent={
        <Button 
          variant="outline" 
          onClick={loadBookings}
          className="border-green-300 text-green-700 hover:bg-green-50"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white border border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-slate-900">
                    {bookings.length}
                  </div>
                  <div className="text-sm font-medium text-slate-600">Total Bookings</div>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-slate-900">{confirmedBookings.length}</div>
                  <div className="text-sm font-medium text-slate-600">Confirmed</div>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-slate-900">{completedBookings.length}</div>
                  <div className="text-sm font-medium text-slate-600">Completed</div>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Booking Management */}
        <Card className="bg-white border border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-200 bg-slate-50/50">
            <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-slate-600" />
              Booking Management
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Tabs defaultValue="confirmed" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 bg-slate-100">
                <TabsTrigger value="confirmed" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                  Confirmed ({confirmedBookings.length})
                </TabsTrigger>
                <TabsTrigger value="completed" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                  Completed ({completedBookings.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="confirmed" className="space-y-4">
                {loading ? (
                  <div className="text-center py-12 text-slate-600">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 mx-auto mb-4"></div>
                    <p className="font-medium">Loading bookings...</p>
                  </div>
                ) : confirmedBookings.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No confirmed bookings</h3>
                    <p className="text-slate-500">Confirmed bookings will appear here</p>
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
                  <div className="text-center py-12">
                    <TrendingUp className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No completed trips yet</h3>
                    <p className="text-slate-500">Completed bookings will appear here</p>
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
          </CardContent>
        </Card>
      </div>
    </ResponsiveLayout>
  );
};

export default BookingManagement;