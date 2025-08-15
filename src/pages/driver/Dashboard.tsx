import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import MobileLayout from '@/components/mobile/MobileLayout';
import { MapPin, Clock, Users, Settings, Calendar } from 'lucide-react';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
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
    if (!userProfile?.uid) {
      console.log('No user profile UID - cannot load booking status');
      return;
    }
    
    console.log('Loading booking status for user:', userProfile.uid);
    
    try {
      const userDoc = await getDoc(doc(db, 'drivers', userProfile.uid));
      if (userDoc.exists()) {
        const docData = userDoc.data();
        const bookingStatus = docData.bookingOpen || false;
        console.log('Found booking status in database:', bookingStatus);
        setIsBookingOpen(bookingStatus);
      } else {
        console.log('Driver document does not exist in database - creating with default false');
        // Create the document with default bookingOpen: false
        await setDoc(doc(db, 'drivers', userProfile.uid), {
          ...userProfile,
          bookingOpen: false,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        setIsBookingOpen(false);
      }
    } catch (error) {
      console.error('Error loading booking status:', error);
      setIsBookingOpen(false);
    }
  };

  const toggleBookingAvailability = async () => {
    console.log('Toggle clicked! Current state:', isBookingOpen);
    console.log('User profile UID:', userProfile?.uid);
    
    if (!userProfile?.uid) {
      console.log('No user profile UID - cannot toggle');
      return;
    }
    
    setLoading(true);
    try {
      const newStatus = !isBookingOpen;
      console.log('Attempting to set new status:', newStatus);
      
      const driverDocRef = doc(db, 'drivers', userProfile.uid);
      
      // Check if document exists first
      const driverDoc = await getDoc(driverDocRef);
      
      if (!driverDoc.exists()) {
        console.log('Driver document does not exist, creating it...');
        // Create the document with the current user profile data
        await setDoc(driverDocRef, {
          ...userProfile,
          bookingOpen: newStatus,
          updatedAt: new Date()
        });
      } else {
        // Update existing document
        await updateDoc(driverDocRef, {
          bookingOpen: newStatus,
          updatedAt: new Date()
        });
      }
      
      console.log('Successfully updated database');
      setIsBookingOpen(newStatus);
      console.log('Updated local state to:', newStatus);
      
      toast({
        title: newStatus ? "Bookings Opened" : "Bookings Closed",
        description: newStatus 
          ? "You are now accepting new bookings" 
          : "You are no longer accepting new bookings"
      });
    } catch (error) {
      console.error('Error updating booking status:', error);
      console.error('Error details:', error.message, error.code);
      toast({
        title: "Error",
        description: `Failed to update booking status: ${error.message || 'Please try again.'}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/driver/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Error",
        description: "Failed to logout. Please try again.",
        variant: "destructive"
      });
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
        {/* Quick Booking Toggle - Prominent at top */}
        {userProfile?.status === 'approved' && userProfile?.routes && (
          <Card className="border-2 border-orange-300 shadow-xl bg-gradient-to-r from-orange-50 to-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full ${isBookingOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                  <div>
                    <h3 className="font-bold text-orange-900">
                      {isBookingOpen ? 'ONLINE - Accepting Bookings' : 'OFFLINE - Not Accepting Bookings'}
                    </h3>
                    <p className="text-sm text-orange-600">
                      {isBookingOpen ? 'Parents can book rides with you' : 'Toggle ON to start receiving bookings'}
                    </p>
                    {/* Route and vehicle info */}
                    <div className="mt-2 text-xs text-gray-600">
                      <p><strong>Route:</strong> {userProfile.routes.startPoint?.address} → {userProfile.routes.endPoint?.address}</p>
                      {userProfile.vehicle && (
                        <p><strong>Vehicle:</strong> {userProfile.vehicle.model} ({userProfile.vehicle.year}) - {userProfile.vehicle.capacity} capacity</p>
                      )}
                    </div>
                  </div>
                </div>
                <Switch
                  checked={isBookingOpen}
                  onCheckedChange={toggleBookingAvailability}
                  disabled={loading}
                  className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-red-500 scale-150 mr-2"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Warning messages for non-approved or no routes */}
        {userProfile?.status !== 'approved' && (
          <Card className="border-yellow-300 bg-yellow-50 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                <div>
                  <h3 className="font-bold text-yellow-800">Account Pending Approval</h3>
                  <p className="text-sm text-yellow-600">You need admin approval before accepting bookings</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {userProfile?.status === 'approved' && !userProfile?.routes && (
          <Card className="border-blue-300 bg-blue-50 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                  <div>
                    <h3 className="font-bold text-blue-800">Routes Not Set</h3>
                    <p className="text-sm text-blue-600">Please set your pickup and drop-off routes first</p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => navigate('/driver/routes')}
                >
                  Set Routes
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

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
          onClick={handleLogout}
          className="w-full border-orange-200 text-orange-700 hover:bg-orange-50"
        >
          Logout
        </Button>
      </div>
    </MobileLayout>
  );
};

export default DriverDashboard;