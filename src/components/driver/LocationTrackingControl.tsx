import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Users, Clock, Navigation, AlertCircle, CheckCircle } from 'lucide-react';
import { locationTrackingService, TrackingSession } from '@/services/locationTrackingService';
import { toast } from '@/hooks/use-toast';

interface LocationTrackingControlProps {
  rideId: string;
  driverId: string;
  isRideActive: boolean;
  childrenCount: number;
  onTrackingStatusChange?: (isTracking: boolean) => void;
}

const LocationTrackingControl: React.FC<LocationTrackingControlProps> = ({
  rideId,
  driverId,
  isRideActive,
  childrenCount,
  onTrackingStatusChange
}) => {
  const [isTracking, setIsTracking] = useState(false);
  const [trackingSession, setTrackingSession] = useState<TrackingSession | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check current tracking status
    const currentSession = locationTrackingService.getCurrentSession();
    setIsTracking(locationTrackingService.isTracking());
    setTrackingSession(currentSession);

    // Check location permission status
    checkLocationPermission();
  }, []);

  useEffect(() => {
    // Stop tracking if ride is no longer active
    if (!isRideActive && isTracking) {
      handleStopTracking();
    }
  }, [isRideActive, isTracking]);

  const checkLocationPermission = async () => {
    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      setPermissionStatus(permission.state as 'granted' | 'denied');
      
      permission.addEventListener('change', () => {
        setPermissionStatus(permission.state as 'granted' | 'denied');
      });
    } catch (error) {
      console.log('Permission API not supported');
    }
  };

  const handleStartTracking = async () => {
    setIsLoading(true);
    try {
      // Get parent IDs for the ride
      const parentIds = await locationTrackingService.getParentIdsForRide(rideId);
      
      if (parentIds.length === 0) {
        toast({
          title: "No Parents to Notify",
          description: "No parent accounts found for this ride",
          variant: "destructive"
        });
        return;
      }

      const success = await locationTrackingService.startTracking(rideId, driverId, parentIds);
      
      if (success) {
        setIsTracking(true);
        setTrackingSession(locationTrackingService.getCurrentSession());
        onTrackingStatusChange?.(true);
        
        toast({
          title: "Location Sharing Started",
          description: `Parents of ${childrenCount} children will now see your location`,
        });
      } else {
        toast({
          title: "Failed to Start Tracking",
          description: "Please check your location permissions and try again",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Error starting tracking:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to start location tracking",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopTracking = async () => {
    setIsLoading(true);
    try {
      // Stop location tracking
      await locationTrackingService.stopTracking();
      setIsTracking(false);
      setTrackingSession(null);
      onTrackingStatusChange?.(false);
      
      toast({
        title: "Location Sharing Stopped",
        description: "Parents will no longer see your location",
      });
    } catch (error: any) {
      console.error('Error stopping tracking:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to stop location tracking",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const requestLocationPermission = () => {
    navigator.geolocation.getCurrentPosition(
      () => {
        setPermissionStatus('granted');
        toast({
          title: "Location Access Granted",
          description: "You can now start sharing your location",
        });
      },
      () => {
        setPermissionStatus('denied');
        toast({
          title: "Location Access Denied",
          description: "Please enable location access in your browser settings",
          variant: "destructive"
        });
      }
    );
  };

  const getStatusColor = () => {
    if (!isRideActive) return 'bg-gray-100 text-gray-800';
    if (isTracking) return 'bg-green-100 text-green-800 border-green-200';
    return 'bg-orange-100 text-orange-800 border-orange-200';
  };

  const getStatusText = () => {
    if (!isRideActive) return 'Ride Not Active';
    if (isTracking) return 'Sharing Location';
    return 'Not Sharing';
  };

  return (
    <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-blue-900 text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Live Location Sharing
          </CardTitle>
          <Badge className={`${getStatusColor()} flex items-center gap-1`}>
            {isTracking ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
            {getStatusText()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Status Information */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-blue-800">
                {childrenCount} children on ride
              </span>
            </div>
            {trackingSession && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-blue-800">
                  Started: {trackingSession.startedAt.toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>

          {/* Permission Status */}
          {permissionStatus === 'denied' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                <div>
                  <p className="text-red-800 text-sm font-medium">Location Access Required</p>
                  <p className="text-red-700 text-xs mt-1">
                    Please enable location access to share your location with parents
                  </p>
                  <Button
                    onClick={requestLocationPermission}
                    size="sm"
                    className="mt-2 bg-red-600 hover:bg-red-700 text-white"
                  >
                    Enable Location Access
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Information Box */}
          <div className="bg-blue-100 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Navigation className="h-4 w-4 text-blue-600 mt-0.5" />
              <div>
                <p className="text-blue-800 text-sm font-medium">How it works</p>
                <p className="text-blue-700 text-xs mt-1">
                  When enabled, parents will see your real-time location on their dashboard. 
                  Location sharing automatically stops when you complete the ride.
                </p>
              </div>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex gap-3">
            {!isTracking ? (
              <Button
                onClick={handleStartTracking}
                disabled={!isRideActive || permissionStatus === 'denied' || isLoading}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                {isLoading ? (
                  "Starting..."
                ) : (
                  <>
                    <MapPin className="h-4 w-4 mr-2" />
                    Start Sharing Location
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleStopTracking}
                disabled={isLoading}
                variant="outline"
                className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
              >
                {isLoading ? (
                  "Stopping..."
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Stop Sharing Location
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Privacy Note */}
          <p className="text-xs text-gray-600 text-center">
            🔒 Your location is only shared with parents of children on this ride
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default LocationTrackingControl;
