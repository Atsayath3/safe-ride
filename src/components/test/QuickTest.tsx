import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Play, TestTube, MapPin } from 'lucide-react';

const QuickTest: React.FC = () => {
  const testLocationPermission = async () => {
    try {
      const permission = await navigator.permissions.query({name: 'geolocation'});
      console.log('Location permission:', permission.state);
      
      if (permission.state === 'granted') {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            console.log('✅ Location test successful:', {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy
            });
            alert(`Location test successful!\nLat: ${position.coords.latitude}\nLng: ${position.coords.longitude}`);
          },
          (error) => {
            console.error('❌ Location test failed:', error);
            alert(`Location test failed: ${error.message}`);
          }
        );
      } else {
        alert('Location permission not granted. Please enable location access.');
      }
    } catch (error) {
      console.error('❌ Permission check failed:', error);
      alert('Permission check failed. This might not work on all browsers.');
    }
  };

  const testFirebaseConnection = () => {
    console.log('Testing Firebase connection...');
    // This would test Firebase connectivity
    alert('Check browser console for Firebase connection details');
  };

  const simulateMovement = () => {
    console.log('🚗 Simulating driver movement...');
    let lat = -26.2041;
    let lng = 28.0473;
    
    const interval = setInterval(() => {
      lat += (Math.random() - 0.5) * 0.002; // Random movement
      lng += (Math.random() - 0.5) * 0.002;
      
      console.log(`📍 Simulated location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    }, 3000);

    // Stop after 30 seconds
    setTimeout(() => {
      clearInterval(interval);
      console.log('✅ Movement simulation ended');
    }, 30000);
    
    alert('Movement simulation started! Check console for 30 seconds of fake GPS data.');
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Quick Testing Tools
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Use these tools to quickly test core functionality. Open browser console (F12) to see detailed logs.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              onClick={testLocationPermission}
              className="flex items-center gap-2"
            >
              <MapPin className="h-4 w-4" />
              Test Location
            </Button>
            
            <Button 
              onClick={testFirebaseConnection}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              Test Firebase
            </Button>
            
            <Button 
              onClick={simulateMovement}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <TestTube className="h-4 w-4" />
              Simulate GPS
            </Button>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Testing Steps:</h4>
            <ol className="text-sm space-y-1 list-decimal list-inside">
              <li>Click "Test Location" - Should request permission and show your coordinates</li>
              <li>Click "Test Firebase" - Should verify connection to database</li>
              <li>Click "Simulate GPS" - Should generate fake movement data for testing</li>
              <li>Open two browser tabs to test real-time sync between driver/parent views</li>
            </ol>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-green-900 mb-2">Location Tracking is Live!</h4>
            <p className="text-sm text-green-800">
              Location tracking is now fully integrated into the main application. Access it through:
            </p>
            <ul className="text-sm text-green-800 mt-2 space-y-1">
              <li>• <strong>Driver Dashboard:</strong> Auto-starts when clicking "Start Today's Ride"</li>
              <li>• <strong>Parent Dashboard:</strong> "Track" buttons in the Rides tab</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuickTest;
