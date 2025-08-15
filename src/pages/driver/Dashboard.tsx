import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import MobileLayout from '@/components/mobile/MobileLayout';
import { MapPin, Clock, Users, Settings, Calendar } from 'lucide-react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from '@/hooks/use-toast';

const DriverDashboard = () => {
  const navigate = useNavigate();
  const { userProfile, logout } = useAuth();
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userProfile?.uid) {
      loadBookingStatus();
    }
  }, [userProfile]);

  const loadBookingStatus = async () => {
    if (!userProfile?.uid) return;
    
    try {
      const userDoc = await getDoc(doc(db, 'users', userProfile.uid));
      if (userDoc.exists()) {
        setIsBookingOpen(userDoc.data().bookingOpen || false);
      }
    } catch (error) {
      console.error('Error loading booking status:', error);
    }
  };

  const toggleBookingAvailability = async () => {
    if (!userProfile?.uid) return;
    
    setLoading(true);
    try {
      const newStatus = !isBookingOpen;
      await updateDoc(doc(db, 'users', userProfile.uid), {
        bookingOpen: newStatus,
        updatedAt: new Date()
      });
      
      setIsBookingOpen(newStatus);
      toast({
        title: newStatus ? "Bookings Opened" : "Bookings Closed",
        description: newStatus 
          ? "You are now accepting new bookings" 
          : "You are no longer accepting new bookings"
      });
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast({
        title: "Error",
        description: "Failed to update booking status. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'approved': return 'text-green-600';
      case 'rejected': return 'text-red-600';
      default: return 'text-yellow-600';
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'approved': return 'Approved - You can start hosting rides';
      case 'rejected': return 'Rejected - Please contact admin';
      default: return 'Pending - Waiting for admin approval';
    }
  };

  return (
    <MobileLayout 
      title="Driver Dashboard" 
      showMenu={true}
      onMenu={() => navigate('/driver/profile')}
      theme="driver"
    >
      <div className="p-4 space-y-6 min-h-screen">
        {/* Status Card */}
        <Card className="border-orange-200 shadow-lg bg-white">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-white rounded-t-lg">
            <CardTitle className="text-lg text-orange-900">Account Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${
                userProfile?.status === 'approved' ? 'bg-green-500' : 
                userProfile?.status === 'rejected' ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'
              }`}></div>
              <div>
                <p className={`font-medium ${getStatusColor(userProfile?.status)}`}>
                  {userProfile?.status?.toUpperCase() || 'PENDING'}
                </p>
                <p className="text-sm text-orange-600">
                  {getStatusText(userProfile?.status)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Booking Availability Card - Only show if approved and has routes */}
        {userProfile?.status === 'approved' && userProfile?.routes && (
          <Card className="border-orange-200 shadow-lg bg-white">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-white rounded-t-lg">
              <CardTitle className="text-lg flex items-center justify-between text-orange-900">
                Booking Availability
                <Switch
                  checked={isBookingOpen}
                  onCheckedChange={toggleBookingAvailability}
                  disabled={loading}
                />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-orange-600">
                  {isBookingOpen 
                    ? "🟢 You are accepting new booking requests" 
                    : "🔴 You are not accepting new bookings"
                  }
                </p>
                <div className="text-xs text-orange-500">
                  <p><strong>Route:</strong> {userProfile.routes.startPoint?.address} → {userProfile.routes.endPoint?.address}</p>
                  <p><strong>Vehicle:</strong> {userProfile.vehicle?.model} ({userProfile.vehicle?.year}) - {userProfile.vehicle?.capacity} capacity</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Card 
            className="border-orange-200 hover:border-orange-400 cursor-pointer transition-colors shadow-md bg-white hover:shadow-lg"
            onClick={() => navigate('/driver/routes')}
          >
            <CardContent className="p-4 text-center">
              <MapPin className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <p className="font-medium text-sm text-orange-800">Set Routes</p>
            </CardContent>
          </Card>

          <Card 
            className="border-orange-200 hover:border-orange-400 cursor-pointer transition-colors shadow-md bg-white hover:shadow-lg"
            onClick={() => navigate('/driver/bookings')}
          >
            <CardContent className="p-4 text-center">
              <Calendar className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <p className="font-medium text-sm text-orange-800">Bookings</p>
            </CardContent>
          </Card>

          <Card 
            className="border-orange-200 hover:border-orange-400 cursor-pointer transition-colors shadow-md bg-white hover:shadow-lg"
            onClick={() => navigate('/driver/rides')}
          >
            <CardContent className="p-4 text-center">
              <Clock className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <p className="font-medium text-sm text-orange-800">My Rides</p>
            </CardContent>
          </Card>

          <Card 
            className="border-orange-200 hover:border-orange-400 cursor-pointer transition-colors shadow-md bg-white hover:shadow-lg"
            onClick={() => navigate('/driver/profile')}
          >
            <CardContent className="p-4 text-center">
              <Settings className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <p className="font-medium text-sm text-orange-800">Profile</p>
            </CardContent>
          </Card>
        </div>

        {/* Logout */}
        <Button 
          variant="outline" 
          onClick={logout}
          className="w-full border-orange-200 text-orange-700 hover:bg-orange-50"
        >
          Logout
        </Button>
      </div>
    </MobileLayout>
  );
};

export default DriverDashboard;