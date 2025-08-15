import React, { useState, useEffect, useRef } from 'react';
import { GoogleMap, useLoadScript, Marker, InfoWindow, DirectionsRenderer } from '@react-google-maps/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, RefreshCw, Maximize2, Minimize2 } from 'lucide-react';
import { locationTrackingService, LocationData } from '@/services/locationTrackingService';
import { useToast } from '@/hooks/use-toast';

interface LiveRideMapProps {
  rideId: string;
  childName: string;
  driverName?: string;
  pickupLocation?: { lat: number; lng: number; address?: string };
  schoolLocation?: { lat: number; lng: number; address?: string };
  className?: string;
}

const mapContainerStyle = {
  width: '100%',
  height: '400px'
};

const defaultCenter = {
  lat: -26.2041,
  lng: 28.0473
};

const libraries: ("places" | "geometry" | "drawing" | "visualization")[] = ["places"];

const LiveRideMap: React.FC<LiveRideMapProps> = ({
  rideId,
  childName,
  driverName = 'Driver',
  pickupLocation,
  schoolLocation,
  className = ''
}) => {
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<'driver' | 'pickup' | 'school' | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
  const [directionsAttempted, setDirectionsAttempted] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);
  const { toast } = useToast();

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: 'AIzaSyCA4f6-PLWdvqPe0neE2f0T-JxTnpGUtsA',
    libraries
  });

  // Subscribe to location updates
  useEffect(() => {
    const unsubscribe = locationTrackingService.subscribeToDriverLocation(
      rideId,
      (location) => {
        setCurrentLocation(location);
        setConnectionStatus(location ? 'connected' : 'disconnected');
        
        if (location && mapRef.current) {
          // Center map on driver location when first connected
          if (connectionStatus !== 'connected') {
            mapRef.current.panTo({ lat: location.latitude, lng: location.longitude });
          }
        }
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [rideId, connectionStatus]);

  // Calculate route when locations are available (try only once to avoid billing spam)
  useEffect(() => {
    if (!isLoaded || !currentLocation || !schoolLocation || directionsAttempted) return;

    setDirectionsAttempted(true);
    const directionsService = new google.maps.DirectionsService();
    
    const origin = { lat: currentLocation.latitude, lng: currentLocation.longitude };
    const destination = schoolLocation;

    directionsService.route(
      {
        origin,
        destination,
        travelMode: google.maps.TravelMode.DRIVING,
        optimizeWaypoints: true
      },
      (result, status) => {
        if (status === 'OK' && result) {
          setDirections(result);
        } else {
          console.warn('Directions request failed (will not retry):', status);
        }
      }
    );
  }, [isLoaded, currentLocation, schoolLocation, directionsAttempted]);

  const onMapLoad = (map: google.maps.Map) => {
    mapRef.current = map;
    
    // Fit map to show all relevant locations
    if (currentLocation || pickupLocation || schoolLocation) {
      const bounds = new google.maps.LatLngBounds();
      
      if (currentLocation) {
        bounds.extend({ lat: currentLocation.latitude, lng: currentLocation.longitude });
      }
      if (pickupLocation) {
        bounds.extend(pickupLocation);
      }
      if (schoolLocation) {
        bounds.extend(schoolLocation);
      }
      
      map.fitBounds(bounds);
    }
  };

  const centerOnDriver = () => {
    if (currentLocation && mapRef.current) {
      mapRef.current.panTo({ lat: currentLocation.latitude, lng: currentLocation.longitude });
      mapRef.current.setZoom(16);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const getEstimatedArrival = (): string => {
    if (!directions?.routes[0]?.legs[0]?.duration) return 'Calculating...';
    
    const durationMinutes = Math.ceil(directions.routes[0].legs[0].duration.value / 60);
    const arrivalTime = new Date(Date.now() + durationMinutes * 60000);
    
    return `~${durationMinutes} min (${arrivalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;
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

  if (loadError) {
    return (
      <Card className={`border-orange-200 ${className}`}>
        <CardContent className="p-6">
          <div className="text-center">
            <MapPin className="h-8 w-8 mx-auto mb-4 text-orange-500" />
            <h3 className="font-semibold text-orange-800 mb-2">Map Unavailable</h3>
            <p className="text-orange-600 text-sm mb-4">
              Google Maps is temporarily unavailable. Switch to "Location Details" tab for coordinates.
            </p>
            {currentLocation && (
              <div className="bg-orange-50 rounded-lg p-4 text-left">
                <h4 className="font-medium text-orange-800 mb-2">Current Driver Location:</h4>
                <div className="space-y-1 text-sm text-orange-700">
                  <p>📍 Latitude: {currentLocation.latitude.toFixed(6)}</p>
                  <p>📍 Longitude: {currentLocation.longitude.toFixed(6)}</p>
                  <p>🎯 Accuracy: {currentLocation.accuracy.toFixed(0)}m</p>
                  <p>🕒 Last Updated: {new Date(currentLocation.timestamp).toLocaleTimeString()}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isLoaded) {
    return (
      <Card className={`border-blue-200 ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-5 w-5 animate-spin text-blue-600 mr-2" />
            <span className="text-blue-800">Loading map...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

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
        {directions && currentLocation && (
          <div className="bg-blue-50 rounded-lg p-3 mt-2">
            <div className="flex items-center justify-between text-sm">
              <div>
                <span className="text-blue-700">Distance: </span>
                <span className="font-medium text-blue-900">
                  {directions.routes[0]?.legs[0]?.distance?.text || 'Calculating...'}
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
        <div className="relative">
          <GoogleMap
            mapContainerStyle={{
              ...mapContainerStyle,
              height: isFullscreen ? 'calc(100vh - 200px)' : '400px'
            }}
            center={currentLocation ? { lat: currentLocation.latitude, lng: currentLocation.longitude } : defaultCenter}
            zoom={14}
            onLoad={onMapLoad}
            options={{
              zoomControl: true,
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
              styles: [
                {
                  featureType: 'poi',
                  elementType: 'labels',
                  stylers: [{ visibility: 'off' }]
                }
              ]
            }}
          >
            {/* Driver Location Marker */}
            {currentLocation && (
              <Marker
                position={{ lat: currentLocation.latitude, lng: currentLocation.longitude }}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 10,
                  fillColor: '#3B82F6',
                  fillOpacity: 1,
                  strokeColor: 'white',
                  strokeWeight: 3
                }}
                title={`${driverName} - Live Location`}
                onClick={() => setSelectedMarker('driver')}
              />
            )}

            {/* Pickup Location Marker */}
            {pickupLocation && (
              <Marker
                position={pickupLocation}
                icon={{
                  path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
                  scale: 6,
                  fillColor: '#F59E0B',
                  fillOpacity: 1,
                  strokeColor: 'white',
                  strokeWeight: 2
                }}
                title="Pickup Location"
                onClick={() => setSelectedMarker('pickup')}
              />
            )}

            {/* School Location Marker */}
            {schoolLocation && (
              <Marker
                position={schoolLocation}
                icon={{
                  path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
                  scale: 6,
                  fillColor: '#10B981',
                  fillOpacity: 1,
                  strokeColor: 'white',
                  strokeWeight: 2
                }}
                title="School"
                onClick={() => setSelectedMarker('school')}
              />
            )}

            {/* Route Directions */}
            {directions && (
              <DirectionsRenderer
                directions={directions}
                options={{
                  suppressMarkers: true,
                  polylineOptions: {
                    strokeColor: '#3B82F6',
                    strokeWeight: 4,
                    strokeOpacity: 0.8
                  }
                }}
              />
            )}

            {/* Info Windows */}
            {selectedMarker === 'driver' && currentLocation && (
              <InfoWindow
                position={{ lat: currentLocation.latitude, lng: currentLocation.longitude }}
                onCloseClick={() => setSelectedMarker(null)}
              >
                <div className="p-2 max-w-48">
                  <h3 className="font-medium text-blue-900">{driverName}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Live location • Updated {new Date(currentLocation.timestamp).toLocaleTimeString()}
                  </p>
                  {currentLocation.speed && (
                    <p className="text-xs text-gray-500 mt-1">
                      Speed: {Math.round(currentLocation.speed * 3.6)} km/h
                    </p>
                  )}
                </div>
              </InfoWindow>
            )}

            {selectedMarker === 'pickup' && pickupLocation && (
              <InfoWindow
                position={pickupLocation}
                onCloseClick={() => setSelectedMarker(null)}
              >
                <div className="p-2">
                  <h3 className="font-medium text-green-900">Pickup Location</h3>
                  <p className="text-sm text-gray-600 mt-1">{childName}'s pickup point</p>
                </div>
              </InfoWindow>
            )}

            {selectedMarker === 'school' && schoolLocation && (
              <InfoWindow
                position={schoolLocation}
                onCloseClick={() => setSelectedMarker(null)}
              >
                <div className="p-2">
                  <h3 className="font-medium text-yellow-900">Destination</h3>
                  <p className="text-sm text-gray-600 mt-1">School drop-off</p>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>

          {/* Map Controls */}
          <div className="absolute top-4 right-4 space-y-2">
            {currentLocation && (
              <Button
                size="sm"
                onClick={centerOnDriver}
                className="bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 shadow-lg"
              >
                <Navigation className="h-4 w-4 mr-1" />
                Follow
              </Button>
            )}
          </div>

          {/* Status Overlay */}
          {!currentLocation && (
            <div className="absolute inset-0 bg-gray-100 bg-opacity-75 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-gray-600">Waiting for driver location...</p>
                <p className="text-sm text-gray-500 mt-1">Location sharing will start when the ride begins</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveRideMap;
