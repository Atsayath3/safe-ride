import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, RefreshCw, Maximize2, Minimize2, Car, AlertTriangle } from 'lucide-react';
import { locationTrackingService, LocationData } from '@/services/locationTrackingService';
import { useToast } from '@/hooks/use-toast';

interface SimpleLiveMapProps {
  rideId: string;
  childName: string;
  driverName?: string;
  pickupLocation?: { lat: number; lng: number; address?: string };
  schoolLocation?: { lat: number; lng: number; address?: string };
  className?: string;
}

const SimpleLiveMap: React.FC<SimpleLiveMapProps> = ({
  rideId,
  childName,
  driverName = 'Driver',
  pickupLocation,
  schoolLocation,
  className = ''
}) => {
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
  const { toast } = useToast();

  // Subscribe to location updates
  useEffect(() => {
    const unsubscribe = locationTrackingService.subscribeToDriverLocation(
      rideId,
      (location) => {
        setCurrentLocation(location);
        setConnectionStatus(location ? 'connected' : 'disconnected');
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [rideId]);

  const getEstimatedArrival = (): string => {
    if (!currentLocation || !schoolLocation) return 'Calculating...';
    
    // Simple distance calculation (not accurate, just for demo)
    const distance = Math.sqrt(
      Math.pow(currentLocation.latitude - schoolLocation.lat, 2) +
      Math.pow(currentLocation.longitude - schoolLocation.lng, 2)
    ) * 111000; // Rough conversion to meters
    
    const estimatedMinutes = Math.ceil(distance / 500); // Assume 30 km/h average speed
    const arrivalTime = new Date(Date.now() + estimatedMinutes * 60000);
    
    return `~${estimatedMinutes} min (${arrivalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;
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

  const openInMaps = () => {
    if (currentLocation) {
      const url = `https://maps.google.com/maps?q=${currentLocation.latitude},${currentLocation.longitude}`;
      window.open(url, '_blank');
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <Card className={`border-blue-200 ${className} ${isFullscreen ? 'fixed inset-4 z-50' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-blue-900 text-lg flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            {childName}'s Ride
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={`${getConnectionStatusColor()} flex items-center gap-1 text-xs`}>
              <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'}`} />
              {connectionStatus === 'connected' ? 'Live' : 'Offline'}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFullscreen}
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        {/* Route Info */}
        {currentLocation && schoolLocation && (
          <div className="bg-blue-50 rounded-lg p-3 mt-2">
            <div className="flex items-center justify-between text-sm">
              <div>
                <span className="text-blue-700">Estimated Distance: </span>
                <span className="font-medium text-blue-900">
                  {Math.round(Math.sqrt(
                    Math.pow(currentLocation.latitude - schoolLocation.lat, 2) +
                    Math.pow(currentLocation.longitude - schoolLocation.lng, 2)
                  ) * 111)} km
                </span>
              </div>
              <div>
                <span className="text-blue-700">ETA: </span>
                <span className="font-medium text-blue-900">{getEstimatedArrival()}</span>
              </div>
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="relative bg-gradient-to-br from-blue-100 to-green-100 rounded-lg mx-4 mb-4" 
             style={{ height: isFullscreen ? 'calc(100vh - 250px)' : '400px' }}>
          
          {/* Simple Map Visualization */}
          {currentLocation ? (
            <div className="absolute inset-0 flex items-center justify-center p-6">
              <div className="text-center space-y-4 bg-white rounded-lg p-6 shadow-lg max-w-sm">
                <div className="flex items-center justify-center w-16 h-16 mx-auto bg-blue-600 rounded-full">
                  <Car className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{driverName}</h3>
                  <p className="text-sm text-gray-600">Currently at:</p>
                  <p className="text-xs font-mono text-blue-900">
                    {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Updated: {new Date(currentLocation.timestamp).toLocaleTimeString()}
                  </p>
                </div>

                {/* Location Points */}
                <div className="space-y-2 text-left">
                  {pickupLocation && (
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-green-700">Pickup: {pickupLocation.address?.substring(0, 30)}...</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-blue-700">Driver: Live Location</span>
                  </div>
                  {schoolLocation && (
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span className="text-orange-700">School: {schoolLocation.address?.substring(0, 30)}...</span>
                    </div>
                  )}
                </div>

                <Button
                  onClick={openInMaps}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  size="sm"
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  Open in Google Maps
                </Button>
              </div>
            </div>
          ) : (
            /* No Location Available */
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-3">
                <div className="flex items-center justify-center w-16 h-16 mx-auto bg-gray-300 rounded-full">
                  <MapPin className="h-8 w-8 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Waiting for Driver Location</h3>
                  <p className="text-sm text-gray-600">Location sharing will start when the ride begins</p>
                </div>
                {connectionStatus === 'reconnecting' && (
                  <div className="flex items-center justify-center gap-2 text-blue-600">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Connecting...</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Map Placeholder Notice */}
          <div className="absolute top-4 left-4 bg-white rounded-lg px-3 py-2 shadow-md">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <span>Simplified Map View (Demo Mode)</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SimpleLiveMap;
