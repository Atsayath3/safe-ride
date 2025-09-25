import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, RotateCcw } from 'lucide-react';

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

interface LocationPoint {
  lat: number;
  lng: number;
  address: string;
}

interface LocationPickerProps {
  onLocationSet: (location: LocationPoint) => void;
  initialLocation?: LocationPoint;
  apiKey: string;
  placeholder?: string;
  id?: string; // Unique identifier for this picker instance
}

const LocationPicker: React.FC<LocationPickerProps> = ({ 
  onLocationSet,
  initialLocation,
  apiKey,
  placeholder = "Search for locations in Sri Lanka...",
  id = `location-picker-${Math.random().toString(36).substr(2, 9)}`
}) => {
  console.log('🔥🔥🔥 LocationPicker props:', { onLocationSet: typeof onLocationSet, initialLocation, apiKey: !!apiKey, placeholder, id });
  const mapRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);
  const [selectedLocation, setSelectedLocation] = useState<LocationPoint | null>(initialLocation || null);
  const [searchValue, setSearchValue] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const autocompleteRef = useRef<any>(null);

  // Debug state changes
  useEffect(() => {
    console.log('🔥🔥🔥 LocationPicker selectedLocation changed:', selectedLocation);
  }, [selectedLocation]);

  useEffect(() => {
    if (!apiKey) {
      console.error('Google Maps API key is missing');
      return;
    }

    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      console.log('Google Maps API already loaded for instance:', id); // Debug log
      setIsLoaded(true);
      return;
    }

    // If not loaded, check if a script is already loading
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      // Script is already loading, wait for it
      console.log('Google Maps script already loading, waiting for instance:', id);
      const checkLoaded = setInterval(() => {
        if (window.google && window.google.maps) {
          console.log('Google Maps API loaded for instance:', id);
          setIsLoaded(true);
          clearInterval(checkLoaded);
        }
      }, 100);
      
      return () => clearInterval(checkLoaded);
    }

    // Load the script for the first time
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    
    script.onload = () => {
      console.log('Google Maps API loaded successfully for instance:', id);
      setIsLoaded(true);
    };
    
    script.onerror = () => {
      console.error('Failed to load Google Maps API');
    };
    
    document.head.appendChild(script);
  }, [apiKey, id]);

  useEffect(() => {
    if (isLoaded && mapRef.current && !map) {
      console.log('Initializing map for instance:', id);
      initializeMap();
    }
  }, [isLoaded, map]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (autocompleteRef.current) {
        window.google?.maps?.event?.clearInstanceListeners(autocompleteRef.current);
      }
      if (marker) {
        marker.setMap(null);
      }
    };
  }, []);

  const initializeMap = () => {
    console.log('🔥🔥🔥 LocationPicker initializeMap called for instance:', id);
    if (!window.google || !mapRef.current) {
      console.log('🔥🔥🔥 Cannot initialize map for instance:', id, 'Google maps:', !!window.google, 'mapRef.current:', !!mapRef.current);
      return;
    }
    
    console.log('🔥🔥🔥 Starting map initialization for instance:', id);

    // Default to Colombo, Sri Lanka
    const defaultCenter = { lat: 6.9271, lng: 79.8612 };
    const center = initialLocation || defaultCenter;

    console.log('🔥🔥🔥 LocationPicker creating map instance');
    const mapInstance = new window.google.maps.Map(mapRef.current, {
      center,
      zoom: initialLocation ? 15 : 12,
      mapTypeId: window.google.maps.MapTypeId.ROADMAP,
      streetViewControl: false,
      mapTypeControl: true,
      fullscreenControl: false,
    });

    console.log('🔥🔥🔥 LocationPicker map instance created:', mapInstance);
    setMap(mapInstance);

    // Add click listener to map
    console.log('🔥🔥🔥 LocationPicker adding click listener to map');
    const clickListener = mapInstance.addListener('click', (event: any) => {
      console.log('🔥🔥🔥 LocationPicker map clicked at:', event.latLng.lat(), event.latLng.lng());
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      
      // Reverse geocode to get address
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results: any[], status: string) => {
        console.log('🔥🔥🔥 LocationPicker geocoding result:', status, results);
        if (status === 'OK' && results[0]) {
          const address = results[0].formatted_address;
          const location = { lat, lng, address };
          console.log('🔥🔥🔥 LocationPicker calling handleLocationChange with:', location);
          handleLocationChange(location);
        } else {
          const location = { lat, lng, address: `${lat.toFixed(6)}, ${lng.toFixed(6)}` };
          console.log('🔥🔥🔥 LocationPicker calling handleLocationChange with fallback:', location);
          handleLocationChange(location);
        }
      });
    });
    console.log('🔥🔥🔥 LocationPicker click listener added:', clickListener);

    // Initialize autocomplete
    if (searchInputRef.current && window.google.maps.places) {
      console.log('Initializing autocomplete for instance:', id);
      
      // Clear any existing autocomplete
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
      
      autocompleteRef.current = new window.google.maps.places.Autocomplete(
        searchInputRef.current,
        {
          componentRestrictions: { country: 'LK' },
          fields: ['place_id', 'geometry', 'formatted_address'],
          types: ['establishment', 'geocode']
        }
      );

      autocompleteRef.current.addListener('place_changed', () => {
        console.log('🔥🔥🔥 LocationPicker autocomplete place_changed triggered');
        const place = autocompleteRef.current.getPlace();
        console.log('🔥🔥🔥 LocationPicker autocomplete place:', place);
        if (place.geometry && place.geometry.location) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          const address = place.formatted_address || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
          const location = { lat, lng, address };
          
          console.log('🔥🔥🔥 LocationPicker autocomplete calling handleLocationChange with:', location);
          mapInstance.setCenter({ lat, lng });
          mapInstance.setZoom(16);
          handleLocationChange(location);
        }
      });
    }

    // Set initial marker if location provided
    if (initialLocation) {
      handleLocationChange(initialLocation);
    }
  };

  const handleLocationChange = (location: LocationPoint) => {
    console.log('🔥🔥🔥 LocationPicker handleLocationChange called with:', location);
    setSelectedLocation(location);
    setSearchValue(location.address);
    console.log('🔥🔥🔥 LocationPicker set selectedLocation and searchValue');
    console.log('🔥🔥🔥 LocationPicker checking map state - map exists:', !!map, 'marker exists:', !!marker);
    
    // Update or create marker
    if (marker) {
      marker.setMap(null);
    }

    if (map) {
      console.log('🔥🔥🔥 LocationPicker inside map block - creating marker');
      const newMarker = new window.google.maps.Marker({
        position: { lat: location.lat, lng: location.lng },
        map: map,
        title: location.address,
        icon: {
          url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23dc2626'%3E%3Cpath d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z'/%3E%3C/svg%3E",
          scaledSize: new window.google.maps.Size(32, 32)
        }
      });

      setMarker(newMarker);
      
      // Center map on marker
      map.setCenter({ lat: location.lat, lng: location.lng });
      
      // Call the callback
      console.log('🔥🔥🔥 LocationPicker calling onLocationSet with:', location);
      if (onLocationSet && typeof onLocationSet === 'function') {
        onLocationSet(location);
        console.log('🔥🔥🔥 LocationPicker onLocationSet called successfully');
      } else {
        console.error('🔥🔥🔥 LocationPicker onLocationSet is not a function:', onLocationSet);
      }
    } else {
      console.error('🔥🔥🔥 LocationPicker map does not exist - but calling onLocationSet anyway');
    }
    
    // Always call the callback regardless of map state
    console.log('🔥🔥🔥 LocationPicker calling onLocationSet (outside map block) with:', location);
    if (onLocationSet && typeof onLocationSet === 'function') {
      onLocationSet(location);
      console.log('🔥🔥🔥 LocationPicker onLocationSet called successfully (outside map block)');
    } else {
      console.error('🔥🔥🔥 LocationPicker onLocationSet is not a function (outside map block):', onLocationSet);
    }
  };

  const handleReset = () => {
    if (marker) {
      marker.setMap(null);
      setMarker(null);
    }
    setSelectedLocation(null);
    setSearchValue('');
    
    if (map) {
      // Reset to default Sri Lanka view
      map.setCenter({ lat: 6.9271, lng: 79.8612 });
      map.setZoom(12);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            ref={searchInputRef}
            type="text"
            placeholder={placeholder}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-full"
            id={`${id}-search-input`}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          className="flex items-center space-x-2 px-4"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset</span>
        </Button>
      </div>

      {/* Current Selection Display */}
      {selectedLocation && (
        <div className="flex items-start space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <MapPin className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div>
            <div className="font-medium text-green-900">Selected Location:</div>
            <div className="text-sm text-green-700">{selectedLocation.address}</div>
            <div className="text-xs text-green-600 mt-1">
              Coordinates: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
            </div>
          </div>
        </div>
      )}

      {/* Map */}
      <div 
        ref={mapRef}
        className="w-full border-2 border-gray-200 rounded-lg"
        style={{ height: '400px' }}
        id={`${id}-map-container`}
      >
        {!isLoaded && (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <div className="text-gray-600">Loading map...</div>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <MapPin className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div>
            <h3 className="font-medium text-blue-900">How to select your location:</h3>
            <ul className="text-sm text-blue-700 mt-1 space-y-1">
              <li>• Search for your location in the search box above</li>
              <li>• Or click directly on the map to set the location</li>
              <li>• Use the Reset button to clear your selection</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationPicker;