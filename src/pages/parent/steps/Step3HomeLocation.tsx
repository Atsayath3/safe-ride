import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, AlertTriangle, Home } from 'lucide-react';
import { useOnboarding } from '@/contexts/ParentOnboardingContext';
import LocationPicker from '@/components/LocationPicker';

interface MapPoint {
  lat: number;
  lng: number;
  address: string;
}

const Step3HomeLocation: React.FC = () => {
  const { data, updateData, nextStep } = useOnboarding();
  const [error, setError] = useState('');

  useEffect(() => {
    console.log('🔥🔥🔥 Step3 data.homeLocation changed:', data.homeLocation);
    console.log('🔥🔥🔥 Step3 full data object:', data);
  }, [data.homeLocation, data]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    console.log('🔥🔥🔥 Step3 handleSubmit - current data.homeLocation:', data.homeLocation);
    if (!data.homeLocation) {
      setError('Please select your home location on the map');
      return;
    }

    nextStep();
  };

  const handleLocationSelect = (location: MapPoint) => {
    console.log('🔥🔥🔥 Step3 handleLocationSelect received:', location);
    const newHomeLocation = {
      lat: location.lat,
      lng: location.lng,
      address: location.address
    };
    
    console.log('🔥🔥🔥 Step3 calling updateData with:', { homeLocation: newHomeLocation });
    updateData({ homeLocation: newHomeLocation });
    setError('');
    console.log('🔥🔥🔥 Step3 updateData completed, current data.homeLocation:', data.homeLocation);
  };

  console.log('🔥🔥🔥 Step3 component render - handleLocationSelect type:', typeof handleLocationSelect);



  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Set Your Home Location</h2>
        <p className="text-gray-600">
          This helps us match you with nearby drivers and calculate accurate pickup times
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Location Picker */}
        <div className="space-y-2">
          <Label className="text-gray-700 font-medium">Select Your Home Location</Label>
          <LocationPicker
            id="home-location-picker"
            onLocationSet={handleLocationSelect}
            initialLocation={data.homeLocation}
            apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}
            placeholder="Search for your home location in Sri Lanka..."
          />
        </div>

        <div className="pt-4">
          <Button
            type="submit"
            disabled={!data.homeLocation}
            className="w-full h-12 text-lg font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
            onClick={() => console.log('🔥🔥🔥 Step3 button clicked - data.homeLocation:', data.homeLocation)}
          >
            {data.homeLocation ? `Continue to Children Setup (${data.homeLocation.address.substring(0, 30)}...)` : 'Please Select Location First'}
          </Button>
          <div className="mt-2 text-sm text-gray-500">
            🔥🔥🔥 DEBUG: data.homeLocation = {data.homeLocation ? JSON.stringify(data.homeLocation) : 'null'}
          </div>
        </div>
      </form>
    </div>
  );
};

export default Step3HomeLocation;