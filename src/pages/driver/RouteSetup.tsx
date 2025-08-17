import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
        endPoint: endPoint
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