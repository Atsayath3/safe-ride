
import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

interface MapPoint {
  lat: number;
  lng: number;
  address: string;
}

interface GoogleMapProps {
  onRouteSet: (startPoint: MapPoint, endPoint: MapPoint) => void;
  initialStart?: MapPoint;
  initialEnd?: MapPoint;
  apiKey: string;
}

const GoogleMap: React.FC<GoogleMapProps> = ({ 
  onRouteSet, 
  initialStart, 
  initialEnd, 
  apiKey 
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [map, setMap] = useState<any>(null);
  const [directionsService, setDirectionsService] = useState<any>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<any>(null);
  const [startMarker, setStartMarker] = useState<any>(null);
  const [endMarker, setEndMarker] = useState<any>(null);
  const [startPoint, setStartPoint] = useState<MapPoint | null>(initialStart || null);
  const [endPoint, setEndPoint] = useState<MapPoint | null>(initialEnd || null);
  const [isSettingStart, setIsSettingStart] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadGoogleMaps = () => {
      if (window.google) {
        setIsLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => setIsLoaded(true);
      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, [apiKey]);

  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;
    
    // Prevent duplicate map initialization
    if (mapRef.current.querySelector('.gm-style')) {
      console.log('Map already initialized, skipping...');
      return;
    }

    try {
      const google = (window as any).google;
      if (!google || !google.maps) {
        console.error('Google Maps not loaded');
        return;
      }

      // Initialize map with Sri Lankan center
      const mapInstance = new google.maps.Map(mapRef.current, {
        center: { lat: 7.8731, lng: 80.7718 },
        zoom: 8,
        disableDefaultUI: false,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
      });

      mapInstance.addListener('click', (event: any) => {
        const location: MapPoint = {
          lat: event.latLng.lat(),
          lng: event.latLng.lng(),
          address: `${event.latLng.lat()}, ${event.latLng.lng()}`
        };

        if (isSettingStart) {
          setStartPoint(location);
          if (startMarker) {
            startMarker.setMap(null);
          }
          const newMarker = new google.maps.Marker({
            position: { lat: location.lat, lng: location.lng },
            map: mapInstance,
            title: 'Start Location',
            icon: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
          });
          setStartMarker(newMarker);
        } else {
          setEndPoint(location);
          if (endMarker) {
            endMarker.setMap(null);
          }
          const newMarker = new google.maps.Marker({
            position: { lat: location.lat, lng: location.lng },
            map: mapInstance,
            title: 'End Location',
            icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
          });
          setEndMarker(newMarker);
        }
      });

      setMap(mapInstance);

      const directionsService = new google.maps.DirectionsService();
      const directionsRenderer = new google.maps.DirectionsRenderer();
      directionsRenderer.setMap(mapInstance);
      setDirectionsService(directionsService);
      setDirectionsRenderer(directionsRenderer);

      // Initialize autocomplete for search
      const searchInput = document.getElementById('location-search') as HTMLInputElement;
      if (searchInput) {
        const autocomplete = new google.maps.places.Autocomplete(searchInput, {
          componentRestrictions: { country: 'lk' },
          fields: ['place_id', 'geometry', 'name', 'formatted_address'],
        });

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (place.geometry && place.geometry.location) {
            const location: MapPoint = {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
              address: place.formatted_address || place.name || ''
            };
            
            if (isSettingStart) {
              setStartPoint(location);
              if (startMarker) {
                startMarker.setMap(null);
              }
              const newMarker = new google.maps.Marker({
                position: { lat: location.lat, lng: location.lng },
                map: mapInstance,
                title: 'Start Location',
                icon: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
              });
              setStartMarker(newMarker);
            } else {
              setEndPoint(location);
              if (endMarker) {
                endMarker.setMap(null);
              }
              const newMarker = new google.maps.Marker({
                position: { lat: location.lat, lng: location.lng },
                map: mapInstance,
                title: 'End Location',
                icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
              });
              setEndMarker(newMarker);
            }
            
            mapInstance.setCenter(location);
            mapInstance.setZoom(15);
            
            // Update search input with selected place
            searchInput.value = location.address;
          }
        });
      }

    } catch (error) {
      console.error('Error initializing Google Map:', error);
    }
  }, [isLoaded, isSettingStart]);

  // Update markers when points change
  useEffect(() => {
    if (!map) return;

    // Remove existing markers
    if (startMarker) startMarker.setMap(null);
    if (endMarker) endMarker.setMap(null);

    // Add start marker
    if (startPoint) {
      const marker = new window.google.maps.Marker({
        position: { lat: startPoint.lat, lng: startPoint.lng },
        map: map,
        title: 'Pickup Point',
        icon: {
          url: 'data:image/svg+xml;base64,' + btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="green" width="24" height="24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(32, 32),
        },
      });
      setStartMarker(marker);
    }

    // Add end marker
    if (endPoint) {
      const marker = new window.google.maps.Marker({
        position: { lat: endPoint.lat, lng: endPoint.lng },
        map: map,
        title: 'Drop-off Point',
        icon: {
          url: 'data:image/svg+xml;base64,' + btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="red" width="24" height="24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(32, 32),
        },
      });
      setEndMarker(marker);
    }

    // Draw route if both points exist
    if (startPoint && endPoint && directionsService && directionsRenderer) {
      directionsService.route({
        origin: { lat: startPoint.lat, lng: startPoint.lng },
        destination: { lat: endPoint.lat, lng: endPoint.lng },
        travelMode: window.google.maps.TravelMode.DRIVING,
      }, (result: any, status: any) => {
        if (status === 'OK') {
          directionsRenderer.setDirections(result);
        }
      });
    }
  }, [map, startPoint, endPoint, directionsService, directionsRenderer]);

  const handleConfirmRoute = () => {
    if (startPoint && endPoint) {
      onRouteSet(startPoint, endPoint);
    }
  };

  const resetPoints = () => {
    setStartPoint(null);
    setEndPoint(null);
    setIsSettingStart(true);
    if (directionsRenderer) {
      directionsRenderer.setDirections({ routes: [] });
    }
  };

  if (!isLoaded) {
    return (
      <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground">Loading Google Maps...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative mb-6">
        <Input
          id="location-search"
          ref={searchInputRef}
          type="text"
          placeholder="Search for locations in Sri Lanka..."
          className="w-full pl-12 pr-4 py-3 border-2 border-blue-200 rounded-xl text-sm font-medium bg-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 text-gray-900 placeholder:text-gray-500"
        />
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <div className="flex gap-3 my-6">
        <button
          onClick={() => setIsSettingStart(true)}
          className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg border-2 transition-all duration-200 ${
            isSettingStart 
              ? 'bg-blue-600 text-white border-blue-600 shadow-lg hover:bg-blue-700 transform hover:scale-[1.02]' 
              : 'bg-white text-blue-700 border-blue-300 hover:bg-blue-50 hover:border-blue-400 shadow-sm'
          }`}
        >
          Pickup Point
        </button>
        <button
          onClick={() => setIsSettingStart(false)}
          className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg border-2 transition-all duration-200 ${
            !isSettingStart 
              ? 'bg-blue-600 text-white border-blue-600 shadow-lg hover:bg-blue-700 transform hover:scale-[1.02]' 
              : 'bg-white text-blue-700 border-blue-300 hover:bg-blue-50 hover:border-blue-400 shadow-sm'
          }`}
        >
          Drop-off Point
        </button>
        <button
          onClick={resetPoints}
          className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg border-2 bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400 shadow-sm transition-all duration-200 hover:scale-[1.02]"
        >
          Reset
        </button>
      </div>
      
      <div ref={mapRef} className="h-80 w-full rounded-xl border-2 border-blue-200 shadow-lg bg-white overflow-hidden" style={{minHeight: '320px'}} />
      
      {/* Location Status Display */}
      <div className="mt-4 space-y-2">
        {startPoint && (
          <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800">Pickup Location</p>
              <p className="text-xs text-green-600 truncate">{startPoint.address}</p>
            </div>
          </div>
        )}
        
        {endPoint && (
          <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">Drop-off Location</p>
              <p className="text-xs text-red-600 truncate">{endPoint.address}</p>
            </div>
          </div>
        )}
      </div>
      
      {startPoint && endPoint && (
        <div className="mt-6">
          <Button 
            onClick={handleConfirmRoute} 
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
          >
            Confirm Route
          </Button>
        </div>
      )}
    </div>
  );
};

export default GoogleMap;