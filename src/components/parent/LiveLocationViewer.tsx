import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, Clock, Car, User, AlertCircle, RefreshCw } from 'lucide-react';
import { locationTrackingService, LocationData } from '@/services/locationTrackingService';
import { toast } from '@/hooks/use-toast';

interface LiveLocationViewerProps {
  rideId: string;
  childName: string;
  driverName?: string;
  onLocationUpdate?: (location: LocationData | null) => void;
}

const LiveLocationViewer: React.FC<LiveLocationViewerProps> = ({
  rideId,
  childName,
  driverName = 'Driver',
  onLocationUpdate
}) => {
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const setupLocationSubscription = () => {
      setConnectionStatus('reconnecting');
      
      unsubscribe = locationTrackingService.subscribeToDriverLocation(
        rideId,
        (location) => {
          setCurrentLocation(location);
          setLastUpdateTime(new Date());
          setIsLoading(false);
          setConnectionStatus(location ? 'connected' : 'disconnected');
          onLocationUpdate?.(location);

          if (location) {
            console.log('Location update received:', {
              lat: location.latitude,
              lng: location.longitude,
              accuracy: location.accuracy
            });
          }
        }
      );
    };

    // Initial setup
    setupLocationSubscription();

    // Set up reconnection logic
    const checkConnection = () => {
      if (connectionStatus === 'disconnected') {
        console.log('Reconnecting to location updates...');
        if (unsubscribe) unsubscribe();
        setupLocationSubscription();
      }
    };

    const connectionInterval = setInterval(checkConnection, 30000); // Check every 30 seconds

    return () => {
      if (unsubscribe) unsubscribe();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      clearInterval(connectionInterval);
    };
  }, [rideId, onLocationUpdate]);

  const formatDistanceFromLocation = (location: LocationData): string => {
    // This would typically calculate distance from child's pickup location
    // For now, we'll show accuracy as a proxy for reliability
    if (location.accuracy <= 10) return 'Very accurate';
    if (location.accuracy <= 50) return 'Good accuracy';
    if (location.accuracy <= 100) return 'Fair accuracy';
    return 'Low accuracy';
  };

  const getTimeSinceLastUpdate = (): string => {
    if (!lastUpdateTime) return 'No updates yet';
    
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - lastUpdateTime.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    return `${Math.floor(diffInSeconds / 3600)}h ago`;
  };

  const openInMaps = () => {
    if (!currentLocation) return;
    
    const url = `https://maps.google.com/maps?q=${currentLocation.latitude},${currentLocation.longitude}`;
    window.open(url, '_blank');
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'reconnecting':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Live';
      case 'reconnecting':
        return 'Connecting...';
      default:
        return 'Offline';
    }
  };

  if (isLoading) {
    return (
      <Card className="border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-5 w-5 animate-spin text-blue-600 mr-2" />
            <span className="text-blue-800">Connecting to live location...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-blue-900 text-lg flex items-center gap-2">
            <Car className="h-5 w-5" />
            Live Location
          </CardTitle>
          <Badge className={`${getConnectionStatusColor()} flex items-center gap-1`}>
            <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500' : connectionStatus === 'reconnecting' ? 'bg-yellow-500' : 'bg-red-500'}`} />
            {getConnectionStatusText()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Driver and Child Info */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-blue-600" />
              <span className="text-blue-800">{driverName}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-green-600" />
              <span className="text-green-800">{childName}</span>
            </div>
          </div>

          {currentLocation ? (
            <>
              {/* Location Details */}
              <div className="bg-white rounded-lg p-3 border border-blue-100">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600">Coordinates</p>
                    <p className="font-mono text-xs text-blue-900">
                      {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Accuracy</p>
                    <p className="text-blue-900">{formatDistanceFromLocation(currentLocation)}</p>
                  </div>
                  {currentLocation.speed && (
                    <div>
                      <p className="text-gray-600">Speed</p>
                      <p className="text-blue-900">{Math.round(currentLocation.speed * 3.6)} km/h</p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-600">Last Update</p>
                    <p className="text-blue-900">{getTimeSinceLastUpdate()}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={openInMaps}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  size="sm"
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  View on Map
                </Button>
              </div>

              {/* Status Indicators */}
              <div className="flex items-center justify-between text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Updated: {currentLocation.timestamp.toLocaleTimeString()}
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  ±{Math.round(currentLocation.accuracy)}m
                </div>
              </div>
            </>
          ) : (
            /* No Location Available */
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-yellow-800 font-medium text-sm">Location Not Available</h4>
                  <p className="text-yellow-700 text-xs mt-1">
                    The driver hasn't started location sharing yet, or the ride may not be active.
                  </p>
                  <div className="mt-3 space-y-1 text-xs text-yellow-600">
                    <p>• Location sharing starts when the driver begins the ride</p>
                    <p>• Updates every few seconds while driving</p>
                    <p>• Automatically stops when ride is completed</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Privacy Notice */}
          <div className="text-xs text-gray-500 text-center bg-gray-50 rounded p-2">
            🔒 Location data is encrypted and only visible during active rides
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveLocationViewer;
