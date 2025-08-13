import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';


import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import MobileLayout from '@/components/mobile/MobileLayout';
import GoogleMap from '@/components/GoogleMap';
import GoogleMapsKeyInput from '@/components/GoogleMapsKeyInput';



interface MapPoint {
  lat: number;
  lng: number;
  address: string;
}

const RouteSetup = () => {
  const navigate = useNavigate();
  const { updateUserProfile, userProfile } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
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
      onBack={() => navigate('/driver/dashboard')}
    >
      <div className="p-4 space-y-6">
        {/* Google Maps Integration */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Set Route on Map</CardTitle>
            <p className="text-sm text-muted-foreground">
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
            className="w-full" 
            variant="hero"
          >
            {loading ? 'Saving Route...' : 'Save Route'}
          </Button>
          
          {userProfile?.status !== 'approved' && (
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground text-center">
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