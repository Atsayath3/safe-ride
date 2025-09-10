import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
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
        endPoint: endPoint,
        createdAt: new Date().toISOString()
      };

      await updateUserProfile({ routes });
      
      toast({
        title: "Success",
        description: "Route setup completed! Your driver profile is now complete."
      });
      
      navigate('/driver/welcome');
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
      onBack={() => navigate('/driver/vehicle-setup')}
      theme="driver"
    >
      <div className="p-4 space-y-6 min-h-screen">
        {/* Google Maps Integration */}
        <Card className="border-orange-200 shadow-lg bg-white">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-white rounded-t-lg">
            <CardTitle className="text-lg text-orange-900">Define Your Primary Route</CardTitle>
            <p className="text-sm text-orange-600">
              Click on the map to set your pickup and drop-off points for your main driving route
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

        {/* Helpful information for new drivers */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2">� How Route Matching Works:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Set your regular driving route (start and end points)</li>
            <li>• System automatically matches you with children whose pickup/school locations align with your route</li>
            <li>• <strong>Excellent:</strong> Child's locations are very close to your route (&lt;2km)</li>
            <li>• <strong>Good:</strong> Child's locations are reasonably close to your route (2-5km)</li>
            <li>• <strong>Fair:</strong> Child's locations require some detour (5-10km)</li>
            <li>• Routes that don't match well (&gt;10km) won't be shown to parents</li>
          </ul>
        </div>

        <div className="space-y-3">
          {/* Comprehensive helpful information for new drivers */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">� How Route Matching Works:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Set your regular driving route (start and end points)</li>
              <li>• System automatically matches you with children whose pickup/school locations align with your route</li>
              <li>• <strong>Excellent:</strong> Child's locations are very close to your route (&lt;2km)</li>
              <li>• <strong>Good:</strong> Child's locations are reasonably close to your route (2-5km)</li>
              <li>• <strong>Fair:</strong> Child's locations require some detour (5-10km)</li>
              <li>• Routes that don't match well (&gt;10km) won't be shown to parents</li>
              <li>• You can add multiple routes later from your dashboard for better coverage</li>
            </ul>
          </div>
          
          <Button 
            onClick={handleSaveRoute}
            disabled={loading || !startPoint || !endPoint}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white shadow-md rounded-xl" 
          >
            {loading ? 'Completing Setup...' : 'Complete Profile Setup'}
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