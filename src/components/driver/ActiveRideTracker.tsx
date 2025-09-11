import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Clock, 
  User, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Navigation,
  Phone
} from 'lucide-react';
import { ActiveRide, RideChild } from '@/interfaces/ride';
import { RideService } from '@/services/rideService';
import { BookingService } from '@/services/bookingService';
import { notificationService } from '@/services/notificationService';
import { toast } from '@/hooks/use-toast';
import LocationTrackingControl from './LocationTrackingControl';

interface ActiveRideTrackerProps {
  ride: ActiveRide;
  onRideUpdate: (updatedRide: ActiveRide) => void;
}

const ActiveRideTracker: React.FC<ActiveRideTrackerProps> = ({ ride, onRideUpdate }) => {
  const [updatingChild, setUpdatingChild] = useState<string | null>(null);
  const [sosLoading, setSosLoading] = useState(false);
  const [showEmergencyMenu, setShowEmergencyMenu] = useState(false);

  // Emergency contact numbers
  const emergencyContacts = [
    {
      name: 'Police',
      number: '+94740464232',
      icon: '🚔',
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      name: 'Ambulance',
      number: '+94761145043',
      icon: '🚑',
      color: 'bg-red-600 hover:bg-red-700'
    },
    {
      name: 'Safety Team',
      number: '+94766942026',
      icon: '🛡️',
      color: 'bg-green-600 hover:bg-green-700'
    }
  ];

  // Handle emergency contact selection
  const handleEmergencyContact = (contact: { name: string; number: string; icon: string }) => {
    try {
      // Open phone dialer with the emergency number
      window.location.href = `tel:${contact.number}`;
      
      // Show confirmation toast
      toast({
        title: `${contact.icon} Calling ${contact.name}`,
        description: `Opening dialer for ${contact.number}`,
      });
      
      // Close the menu
      setShowEmergencyMenu(false);
      
      // Optional: Also send notification to parents about emergency call
      handleEmergencySOS(contact.name);
    } catch (error) {
      console.error('Error opening dialer:', error);
      toast({
        title: "Error",
        description: "Failed to open phone dialer",
        variant: "destructive"
      });
    }
  };

  // Helper function to convert Firestore Timestamp or Date to Date object
  const toDate = (timestamp: any): Date => {
    if (!timestamp) return new Date();
    if (timestamp instanceof Date) return timestamp;
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    }
    return new Date(timestamp);
  };

  // Safety check for ride data
  if (!ride || !Array.isArray(ride.children)) {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-4 text-center">
          <h3 className="text-red-800 font-medium">Invalid Ride Data</h3>
          <p className="text-red-600 text-sm">Please try starting a new ride.</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: RideChild['status']) => {
    switch (status) {
      case 'picked_up':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'dropped_off':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'absent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: RideChild['status']) => {
    switch (status) {
      case 'picked_up':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'dropped_off':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'absent':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const handleEmergencySOS = async (emergencyType?: string | React.MouseEvent) => {
    setSosLoading(true);
    
    // If emergencyType is a string, it's called from emergency contact selection
    const alertType = typeof emergencyType === 'string' ? emergencyType : 'General Emergency';
    
    try {
      // Get current location if available
      let currentLocation: { lat: number; lng: number; address?: string } | undefined;
      
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 5000,
              enableHighAccuracy: true
            });
          });
          
          currentLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            address: `${position.coords.latitude}, ${position.coords.longitude}`
          };
        } catch (geoError) {
          console.warn('Could not get current location:', geoError);
        }
      }

      // Get all parent IDs from the ride bookings
      const parentIds: string[] = [];
      const driverName = 'Driver'; // This should be fetched from driver profile
      
      for (const child of ride.children) {
        try {
          const booking = await BookingService.getBookingById(child.bookingId);
          if (booking && !parentIds.includes(booking.parentId)) {
            parentIds.push(booking.parentId);
          }
        } catch (error) {
          console.error(`Error fetching booking for child ${child.childId}:`, error);
        }
      }

      if (parentIds.length === 0) {
        throw new Error('No parent contacts found for emergency alert');
      }

      // Send emergency SOS alerts
      await notificationService.sendEmergencySOSAlert(
        ride.id,
        ride.driverId,
        parentIds,
        driverName,
        currentLocation
      );

      toast({
        title: "🚨 Emergency SOS Sent",
        description: `Emergency alert sent to ${parentIds.length} parent(s) and emergency services.`,
        variant: "destructive"
      });

    } catch (error: any) {
      console.error('Error sending emergency SOS:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send emergency alert",
        variant: "destructive"
      });
    } finally {
      setSosLoading(false);
    }
  };

  const handleStatusUpdate = async (childId: string, status: 'picked_up' | 'absent' | 'dropped_off') => {
    setUpdatingChild(childId);
    
    try {
      await RideService.updateChildStatus(ride.id, childId, status);
      
      // Update local state
      const updatedChildren = ride.children.map(child => {
        if (child.childId === childId) {
          return {
            ...child,
            status,
            pickedUpAt: status === 'picked_up' ? new Date() : child.pickedUpAt,
            droppedOffAt: status === 'dropped_off' ? new Date() : child.droppedOffAt
          };
        }
        return child;
      });

      const pickedUpCount = updatedChildren.filter(child => child.status === 'picked_up').length;
      const absentCount = updatedChildren.filter(child => child.status === 'absent').length;
      const droppedOffCount = updatedChildren.filter(child => child.status === 'dropped_off').length;
      const allProcessed = updatedChildren.every(child => 
        child.status === 'dropped_off' || child.status === 'absent'
      );

      const updatedRide: ActiveRide = {
        ...ride,
        children: updatedChildren,
        pickedUpCount,
        absentCount,
        droppedOffCount,
        status: allProcessed ? 'completed' : ride.status,
        completedAt: allProcessed ? new Date() : ride.completedAt,
        updatedAt: new Date()
      };

      onRideUpdate(updatedRide);

      // Send attendance notification to parent
      try {
        const child = updatedChildren.find(c => c.childId === childId);
        if (child && (status === 'picked_up' || status === 'absent')) {
          // Get parent ID from booking
          const booking = await BookingService.getBookingById(child.bookingId);
          if (booking) {
            await notificationService.sendAttendanceNotification(
              booking.parentId,
              ride.driverId,
              child.childId,
              child.fullName,
              status === 'picked_up' ? 'present' : 'absent'
            );
          }
        }
      } catch (notificationError) {
        console.error('Error sending attendance notification:', notificationError);
        // Don't fail the status update if notification fails
      }

      const statusText = status === 'picked_up' ? 'picked up' : 
                       status === 'dropped_off' ? 'dropped off' : 'absent';
      
      toast({
        title: "Status Updated",
        description: `Child marked as ${statusText}`,
      });

      if (allProcessed) {
        // Send trip end notifications to all parents
        try {
          const parentNotifications = [];
          for (const child of updatedChildren) {
            try {
              const booking = await BookingService.getBookingById(child.bookingId);
              if (booking) {
                parentNotifications.push(
                  notificationService.sendTripEndNotification(
                    booking.parentId,
                    ride.driverId,
                    ride.id,
                    'School Route', // You might want to get actual route name
                    child.fullName
                  )
                );
              }
            } catch (error) {
              console.error(`Error getting booking for child ${child.childId}:`, error);
            }
          }
          
          await Promise.all(parentNotifications);
        } catch (notificationError) {
          console.error('Error sending trip completion notifications:', notificationError);
        }

        toast({
          title: "Ride Completed!",
          description: `All ${updatedChildren.length} children processed. Parents have been notified!`,
        });
      }

    } catch (error: any) {
      console.error('Error updating child status:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive"
      });
    } finally {
      setUpdatingChild(null);
    }
  };

  const handleCompleteRide = async () => {
    try {
      await RideService.completeRide(ride.id);
      
      const updatedRide: ActiveRide = {
        ...ride,
        status: 'completed',
        completedAt: new Date(),
        updatedAt: new Date()
      };

      onRideUpdate(updatedRide);

      toast({
        title: "Ride Completed",
        description: "Your ride has been marked as completed",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to complete ride",
        variant: "destructive"
      });
    }
  };

  const openNavigation = (address: string) => {
    try {
      const url = `https://maps.google.com/maps?q=${encodeURIComponent(address)}`;
      window.open(url, '_blank');
    } catch (error) {
      toast({
        title: "Navigation Error",
        description: "Could not open navigation",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Ride Status Header */}
      <Card className="bg-orange-50 border-orange-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-orange-900 text-lg">
              {ride.status === 'completed' ? '🎉 Ride Completed!' : '🚐 Active Ride'}
            </CardTitle>
            <div className="flex items-center gap-2">
              {ride.status === 'in_progress' && (
                <div className="relative">
                  <Button
                    onClick={() => setShowEmergencyMenu(!showEmergencyMenu)}
                    disabled={sosLoading}
                    className="bg-red-600 hover:bg-red-700 text-white font-semibold"
                    size="sm"
                  >
                    <Phone className="h-4 w-4 mr-1" />
                    {sosLoading ? 'Calling...' : 'Emergency SOS'}
                  </Button>
                  
                  {/* Emergency Menu Dropdown */}
                  {showEmergencyMenu && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setShowEmergencyMenu(false)}
                      ></div>
                      <div className="absolute right-0 top-12 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-[180px]">
                        <div className="px-3 py-2 text-sm font-semibold text-gray-900 border-b border-gray-100">
                          Select Emergency Contact
                        </div>
                        {emergencyContacts.map((contact) => (
                          <button
                            key={contact.name}
                            onClick={() => handleEmergencyContact(contact)}
                            className={`w-full px-3 py-3 text-left text-sm hover:bg-gray-50 flex items-center gap-3 transition-colors ${
                              sosLoading ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            disabled={sosLoading}
                          >
                            <span className="text-lg">{contact.icon}</span>
                            <div>
                              <div className="font-medium text-gray-900">{contact.name}</div>
                              <div className="text-xs text-gray-500">{contact.number}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
              <Badge className="bg-orange-100 text-orange-800 border-orange-300">
                {ride.status === 'completed' ? 'Completed' : 'In Progress'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-3 text-center">
            <div>
              <div className="text-2xl font-bold text-orange-900">{ride.totalChildren}</div>
              <div className="text-sm text-orange-700">Total</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{ride.pickedUpCount}</div>
              <div className="text-sm text-green-700">Picked Up</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{ride.droppedOffCount || 0}</div>
              <div className="text-sm text-blue-700">Dropped Off</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{ride.absentCount}</div>
              <div className="text-sm text-red-700">Absent</div>
            </div>
          </div>
          
          {ride.status !== 'completed' && (
            <div className="mt-4 flex justify-center">
              <Button
                onClick={handleCompleteRide}
                className="bg-orange-600 hover:bg-orange-700"
                size="sm"
              >
                Complete Ride Early
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Location Tracking Control */}
      {ride.status !== 'completed' && (
        <LocationTrackingControl 
          rideId={ride.id}
          driverId={ride.driverId}
          isRideActive={ride.status === 'in_progress'}
          childrenCount={ride.totalChildren}
        />
      )}

      {/* Children List */}
      <div className="space-y-3">
        <h3 className="font-semibold text-orange-900 text-lg">Children List</h3>
        
        {ride.children.map((child, index) => (
          <Card key={child.id} className="border border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <User className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-orange-900">{child.fullName}</h4>
                    <p className="text-sm text-orange-700">Stop #{index + 1}</p>
                  </div>
                </div>
                
                <Badge className={`${getStatusColor(child.status)} flex items-center gap-1`}>
                  {getStatusIcon(child.status)}
                  {child.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>

              {/* Pickup Details */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-orange-600" />
                  <span className="text-sm text-orange-800 flex-1">
                    Pickup: {child.pickupLocation.address}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openNavigation(child.pickupLocation.address)}
                    className="h-7 px-2 border-orange-300"
                  >
                    <Navigation className="h-3 w-3" />
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-blue-800 flex-1">
                    Drop-off: {child.dropoffLocation.address}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openNavigation(child.dropoffLocation.address)}
                    className="h-7 px-2 border-blue-300"
                  >
                    <Navigation className="h-3 w-3" />
                  </Button>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <span className="text-sm text-orange-800">
                    Scheduled: {child.scheduledPickupTime}
                  </span>
                </div>
                
                {child.pickedUpAt && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-700">
                      Picked up: {toDate(child.pickedUpAt).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                )}

                {child.droppedOffAt && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-blue-700">
                      Dropped off: {toDate(child.droppedOffAt).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {child.status === 'pending' && ride.status !== 'completed' && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleStatusUpdate(child.childId, 'picked_up')}
                    disabled={updatingChild === child.childId}
                    className="flex-1 bg-green-600 hover:bg-green-700 h-9"
                    size="sm"
                  >
                    {updatingChild === child.childId ? (
                      "Updating..."
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Mark Present
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={() => handleStatusUpdate(child.childId, 'absent')}
                    disabled={updatingChild === child.childId}
                    variant="outline"
                    className="flex-1 border-red-300 text-red-600 hover:bg-red-50 h-9"
                    size="sm"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Mark Absent
                  </Button>
                </div>
              )}

              {child.status === 'picked_up' && ride.status !== 'completed' && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleStatusUpdate(child.childId, 'dropped_off')}
                    disabled={updatingChild === child.childId}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 h-9"
                    size="sm"
                  >
                    {updatingChild === child.childId ? (
                      "Updating..."
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Mark Dropped Off
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ActiveRideTracker;