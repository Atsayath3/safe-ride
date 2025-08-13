import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Search } from 'lucide-react';

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
  const [map, setMap] = useState<any>(null);
  const [directionsService, setDirectionsService] = useState<any>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<any>(null);
  const [startMarker, setStartMarker] = useState<any>(null);
  const [endMarker, setEndMarker] = useState<any>(null);
  const [startPoint, setStartPoint] = useState<MapPoint | null>(initialStart || null);
  const [endPoint, setEndPoint] = useState<MapPoint | null>(initialEnd || null);
  const [isSettingStart, setIsSettingStart] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [autocompleteService, setAutocompleteService] = useState<any>(null);
  const [placesService, setPlacesService] = useState<any>(null);
  const [predictions, setPredictions] = useState<any[]>([]);

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

    // Initialize map centered on Sri Lanka
    const mapInstance = new window.google.maps.Map(mapRef.current, {
      center: { lat: 7.8731, lng: 80.7718 }, // Sri Lanka center
      zoom: 8,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    const directionsServiceInstance = new window.google.maps.DirectionsService();
    const directionsRendererInstance = new window.google.maps.DirectionsRenderer({
      draggable: true,
      suppressMarkers: true,
    });

    const autocompleteServiceInstance = new window.google.maps.places.AutocompleteService();
    const placesServiceInstance = new window.google.maps.places.PlacesService(mapInstance);

    directionsRendererInstance.setMap(mapInstance);
    
    setMap(mapInstance);
    setDirectionsService(directionsServiceInstance);
    setDirectionsRenderer(directionsRendererInstance);
    setAutocompleteService(autocompleteServiceInstance);
    setPlacesService(placesServiceInstance);

    // Add click listener for setting points
    mapInstance.addListener('click', (event: any) => {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      
      // Reverse geocode to get address
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results: any, status: any) => {
        if (status === 'OK' && results[0]) {
          const address = results[0].formatted_address;
          const point = { lat, lng, address };
          
          if (isSettingStart) {
            setStartPoint(point);
          } else {
            setEndPoint(point);
          }
        }
      });
    });

    // Initialize markers if initial points exist
    if (initialStart) {
      setStartPoint(initialStart);
    }
    if (initialEnd) {
      setEndPoint(initialEnd);
    }

  }, [isLoaded, initialStart, initialEnd]);

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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (value && autocompleteService) {
      autocompleteService.getPlacePredictions(
        {
          input: value,
          componentRestrictions: { country: 'lk' }, // Restrict to Sri Lanka
        },
        (predictions: any, status: any) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK) {
            setPredictions(predictions || []);
          } else {
            setPredictions([]);
          }
        }
      );
    } else {
      setPredictions([]);
    }
  };

  const handlePlaceSelect = (placeId: string, description: string) => {
    if (!placesService) return;
    
    placesService.getDetails(
      { placeId: placeId },
      (place: any, status: any) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          const point = { lat, lng, address: description };
          
          if (isSettingStart) {
            setStartPoint(point);
          } else {
            setEndPoint(point);
          }
          
          // Center map on selected location
          if (map) {
            map.setCenter({ lat, lng });
            map.setZoom(15);
          }
        }
      }
    );
    
    setSearchQuery('');
    setPredictions([]);
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
      {/* Search Input */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder={`Search for ${isSettingStart ? 'pickup' : 'drop-off'} location...`}
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-10"
          />
        </div>
        
        {/* Search Results */}
        {predictions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
            {predictions.map((prediction: any, index: number) => (
              <button
                key={prediction.place_id}
                className="w-full px-4 py-2 text-left hover:bg-muted flex items-center gap-2 border-b last:border-b-0"
                onClick={() => handlePlaceSelect(prediction.place_id, prediction.description)}
              >
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{prediction.description}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Control Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={isSettingStart ? "default" : "outline"}
          onClick={() => setIsSettingStart(true)}
        >
          Set Pickup Point
        </Button>
        <Button
          size="sm"
          variant={!isSettingStart ? "default" : "outline"}
          onClick={() => setIsSettingStart(false)}
        >
          Set Drop-off Point
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={resetPoints}
        >
          Reset
        </Button>
      </div>
      
      {/* Map */}
      <div ref={mapRef} className="h-64 w-full rounded-lg border" />
      
      {/* Current Instructions */}
      <div className="text-sm text-center p-2 bg-muted/50 rounded-lg">
        {!startPoint && !endPoint ? (
          <p>Search above or click on the map to set your {isSettingStart ? 'pickup' : 'drop-off'} point</p>
        ) : isSettingStart ? (
          <p>Setting pickup point - search above or click on the map</p>
        ) : (
          <p>Setting drop-off point - search above or click on the map</p>
        )}
      </div>
      
      {/* Selected Locations Display */}
      {startPoint && (
        <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <div className="flex-1">
            <p className="font-medium text-green-700 text-sm">Pickup Point</p>
            <p className="text-green-600 text-xs">{startPoint.address}</p>
          </div>
        </div>
      )}
      
      {endPoint && (
        <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="flex-1">
            <p className="font-medium text-red-700 text-sm">Drop-off Point</p>
            <p className="text-red-600 text-xs">{endPoint.address}</p>
          </div>
        </div>
      )}
      
      {/* Confirm Button */}
      {startPoint && endPoint && (
        <Button onClick={handleConfirmRoute} className="w-full">
          Confirm Route
        </Button>
      )}
    </div>
  );
};

export default GoogleMap;