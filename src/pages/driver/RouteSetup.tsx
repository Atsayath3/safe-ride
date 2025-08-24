import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import MobileLayout from '@/components/mobile/MobileLayout';
import GoogleMap from '@/components/GoogleMap';
import { GOOGLE_MAPS_API_KEY } from '@/config/maps';



interface MapPoint {
  lat: number;
  lng: number;
  address: string;
}

const RouteSetup = () => {
  const navigate = useNavigate();
  const { updateUserProfile, userProfile } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState<string>(GOOGLE_MAPS_API_KEY);

  // Check for stored API key on component mount
  useEffect(() => {
    // API key is now hardcoded, no need to check localStorage
  }, []);
  const [startPoint, setStartPoint] = useState<MapPoint | null>(
    userProfile?.routes?.startPoint || null
  );
  const [endPoint, setEndPoint] = useState<MapPoint | null>(
    userProfile?.routes?.endPoint || null
  );
  const [routeQuality, setRouteQuality] = useState<'excellent' | 'good' | 'fair'>('good');

  const handleRouteSet = (start: MapPoint, end: MapPoint) => {
    setStartPoint(start);
    setEndPoint(end);
  };

  const handleSaveRoute = async () => {
    if (!startPoint || !endPoint) {
      toast({
        title: "Error",
        description: "Please set both pickup and drop-off points on the map",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const routes = {
        startPoint: startPoint,
        endPoint: endPoint,
        quality: routeQuality
      };

      await updateUserProfile({ routes });
      
      toast({
        title: "Success",
        description: "Route saved successfully"
      });
      
      navigate('/driver/dashboard');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save route",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileLayout 
      title="Set Your Route" 
      showBack={true}
      theme="driver"
    >
      <div className="p-4 space-y-6 min-h-screen">
        {/* Google Maps Integration */}
        <Card className="border-orange-200 shadow-lg bg-white">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-white rounded-t-lg">
            <CardTitle className="text-lg text-orange-900">Google Maps Setup</CardTitle>
            <p className="text-sm text-orange-600">
              Click on the map to set your pickup and drop-off points
            </p>
          </CardHeader>
          <CardContent>
            <GoogleMap
              apiKey={apiKey}
              onRouteSet={handleRouteSet}
              initialStart={startPoint}
              initialEnd={endPoint}
            />
          </CardContent>
        </Card>

        {/* Route Quality Selection */}
        <Card className="border-orange-200 shadow-lg bg-white">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-white rounded-t-lg">
            <CardTitle className="text-lg text-orange-900">Route Quality</CardTitle>
            <p className="text-sm text-orange-600">
              Rate your route's convenience and accessibility
            </p>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-2">
              <Label className="text-orange-800">Quality Rating</Label>
              <Select value={routeQuality} onValueChange={(value: 'excellent' | 'good' | 'fair') => 
                setRouteQuality(value)}>
                <SelectTrigger className="border-orange-200 focus:border-orange-400">
                  <SelectValue placeholder="Select route quality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">
                    <div className="flex flex-col">
                      <span className="font-medium">Excellent</span>
                      <span className="text-xs text-muted-foreground">Direct route, easy access, minimal traffic</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="good">
                    <div className="flex flex-col">
                      <span className="font-medium">Good</span>
                      <span className="text-xs text-muted-foreground">Mostly direct, some detours, moderate traffic</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="fair">
                    <div className="flex flex-col">
                      <span className="font-medium">Fair</span>
                      <span className="text-xs text-muted-foreground">Longer route, multiple detours, heavy traffic</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Button 
            onClick={handleSaveRoute}
            disabled={loading || !startPoint || !endPoint}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white shadow-md rounded-xl" 
          >
            {loading ? 'Saving Route...' : 'Save Route'}
          </Button>
          
          {userProfile?.status !== 'approved' && (
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <p className="text-sm text-orange-700 text-center">
                ⚠️ You can set your route, but you'll need admin approval before accepting ride requests
              </p>
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
};

export default RouteSetup;