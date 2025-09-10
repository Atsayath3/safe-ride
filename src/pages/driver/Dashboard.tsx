import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import MobileLayout from '@/components/mobile/MobileLayout';
import ActiveRideTracker from '@/components/driver/ActiveRideTracker';
import NotificationBell from '@/components/NotificationBell';
import { MapPin, Clock, Users, Settings, Calendar, Play, Route } from 'lucide-react';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from '@/hooks/use-toast';
import { RideService } from '@/services/rideService';
import { ActiveRide } from '@/interfaces/ride';
import { locationTrackingService } from '@/services/locationTrackingService';

const DriverDashboard = () => {
  const navigate = useNavigate();
  const { userProfile, logout } = useAuth();
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeRide, setActiveRide] = useState<ActiveRide | null>(null);
  const [startingRide, setStartingRide] = useState(false);

  useEffect(() => {
    if (userProfile?.uid) {
      loadBookingStatus();
      loadActiveRide();
    }
  }, [userProfile]);

  const loadActiveRide = async () => {
    if (!userProfile?.uid) return;
    
    try {
      const ride = await RideService.getActiveRide(userProfile.uid);
      
      // Only set active ride if it's actually in progress
      if (ride && ride.status === 'in_progress') {
        setActiveRide(ride);
      } else {
        setActiveRide(null);
      }
    } catch (error) {
      console.error('Error loading active ride:', error);
      setActiveRide(null);
    }
  };

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

  const handleStartRide = async () => {
    if (!userProfile?.uid) return;
    
    setStartingRide(true);
    
    try {
      const ride = await RideService.startRide(userProfile.uid);
      setActiveRide(ride);
      
      // Automatically start location tracking when ride starts
      try {
        const parentIds = await locationTrackingService.getParentIdsForRide(ride.id);
        if (parentIds.length > 0) {
          const trackingStarted = await locationTrackingService.startTracking(
            ride.id, 
            userProfile.uid, 
            parentIds
          );
          
          if (trackingStarted) {
            toast({
              title: "Ride Started!",
              description: `Found ${ride.totalChildren} children. Location sharing started automatically.`,
            });
          } else {
            toast({
              title: "Ride Started!",
              description: `Found ${ride.totalChildren} children. Location sharing failed - check permissions.`,
            });
          }
        } else {
          toast({
            title: "Ride Started!",
            description: `Found ${ride.totalChildren} children. No parents to notify for location tracking.`,
          });
        }
      } catch (locationError) {
        console.error('Error starting location tracking:', locationError);
        toast({
          title: "Ride Started!",
          description: `Found ${ride.totalChildren} children. Location sharing will need to be started manually.`,
        });
      }
    } catch (error: any) {
      console.error('Error starting ride:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to start ride",
        variant: "destructive"
      });
    } finally {
      setStartingRide(false);
    }
  };

  const handleRideUpdate = (updatedRide: ActiveRide) => {
    setActiveRide(updatedRide);
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

  // Add safety check for userProfile
  if (!userProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <h1 className="text-xl font-bold text-orange-600 mb-4">Loading...</h1>
          <p className="text-gray-600 mb-4">Please wait while we load your dashboard.</p>
          <button 
            onClick={() => navigate('/driver/login')}
            className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="error-boundary">
      <MobileLayout 
        title="Driver Dashboard" 
        showMenu={true}
        onMenu={() => navigate('/driver/profile')}
        theme="driver"
        rightContent={<NotificationBell />}
      >
      <div className="p-4 space-y-6 min-h-screen">
        {/* Active Ride Section */}
        {activeRide && activeRide.status === 'in_progress' ? (
          <ActiveRideTracker 
            ride={activeRide} 
            onRideUpdate={handleRideUpdate}
          />
        ) : (
          <>
            {/* Start Ride Button - Show when no active ride */}
            {userProfile?.status === 'approved' && userProfile?.routes && (
              <Card className="border-2 border-green-300 shadow-xl bg-gradient-to-r from-green-50 to-white">
                <CardContent className="p-6 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                      <Play className="h-8 w-8 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-green-900 text-lg mb-2">Ready to Start Today's Ride?</h3>
                      <p className="text-sm text-green-700 mb-4">
                        Click below to get today's children list and start tracking pickups
                      </p>
                      <Button
                        onClick={handleStartRide}
                        disabled={startingRide}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 text-lg"
                        size="lg"
                      >
                        {startingRide ? (
                          <>
                            <Clock className="h-5 w-5 mr-2 animate-spin" />
                            Starting Ride...
                          </>
                        ) : (
                          <>
                            <Route className="h-5 w-5 mr-2" />
                            Start Today's Ride
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

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
          </>
        )}
      </div>
    </MobileLayout>
    </div>
  );
};

export default DriverDashboard;