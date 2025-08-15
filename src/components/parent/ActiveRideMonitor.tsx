import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Car, 
  User, 
  MapPin, 
  Navigation,
  CheckCircle
} from 'lucide-react';
import LiveLocationViewer from './LiveLocationViewer';
import LiveRideMap from './LiveRideMap';
import { ActiveRide } from '@/interfaces/ride';

interface ActiveRideMonitorProps {
  ride: ActiveRide;
  onRideUpdate?: (ride: ActiveRide) => void;
}

const ActiveRideMonitor: React.FC<ActiveRideMonitorProps> = ({
  ride,
  onRideUpdate
}) => {
  const [showTrackingView, setShowTrackingView] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  const handleTrackChild = (childId: string) => {
    setSelectedChildId(childId);
    setShowTrackingView(true);
  };

  const handleCloseTracking = () => {
    setShowTrackingView(false);
    setSelectedChildId(null);
  };

  if (showTrackingView && selectedChildId) {
    const selectedChild = ride.children.find(child => child.childId === selectedChildId);
    
    return (
      <div className="fixed inset-0 bg-white z-50">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseTracking}
                className="text-white hover:bg-blue-700 p-2"
              >
                ←
              </Button>
              <div>
                <h2 className="font-semibold">Tracking {selectedChild?.fullName}</h2>
                <p className="text-blue-100 text-sm">Live Location</p>
              </div>
            </div>
            <MapPin className="h-6 w-6" />
          </div>

          {/* Live Tracking Content */}
          <div className="flex-1">
            <Tabs defaultValue="map" className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="map">Live Map</TabsTrigger>
                <TabsTrigger value="details">Location Details</TabsTrigger>
              </TabsList>
              
              <TabsContent value="map" className="flex-1 m-0">
                <LiveRideMap 
                  rideId={ride.id}
                  childName={selectedChild?.fullName || 'Child'}
                  driverName="Driver"
                  pickupLocation={selectedChild?.pickupLocation}
                  schoolLocation={selectedChild?.dropoffLocation}
                />
              </TabsContent>
              
              <TabsContent value="details" className="flex-1 m-0 p-4">
                <LiveLocationViewer 
                  rideId={ride.id}
                  childName={selectedChild?.fullName || 'Child'}
                  driverName="Driver"
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    );
  }

  // Main ride card view
  return (
    <Card className="bg-white rounded-2xl shadow-lg border border-blue-100">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Car className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-blue-900 text-lg">Active Ride</CardTitle>
              <p className="text-blue-600 text-sm">
                Started: {ride.startedAt && new Date(ride.startedAt).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="h-3 w-3 mr-1" />
            In Progress
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Children in this ride */}
        <div className="space-y-3">
          <h4 className="font-medium text-blue-900 text-sm">Your Children</h4>
          {ride.children.map((child, index) => (
            <div key={`${ride.id}-${child.id || child.childId}-${index}`} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-blue-900 text-sm">{child.fullName}</p>
                  <p className="text-blue-600 text-xs">
                    {child.status === 'picked_up' && '✓ Picked up'}
                    {child.status === 'dropped_off' && '✓ Dropped off'}
                    {child.status === 'pending' && 'Waiting for pickup'}
                    {child.status === 'absent' && 'Absent'}
                  </p>
                </div>
              </div>
              
              {/* Track Button */}
              {child.status === 'picked_up' && (
                <Button
                  onClick={() => handleTrackChild(child.childId)}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-xs"
                >
                  <Navigation className="h-3 w-3 mr-1" />
                  Track
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Ride Summary */}
        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-blue-100">
          <div className="text-center">
            <p className="text-xs text-blue-600">Total</p>
            <p className="font-semibold text-blue-900">{ride.totalChildren}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-blue-600">Picked Up</p>
            <p className="font-semibold text-green-600">{ride.pickedUpCount}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-blue-600">Dropped Off</p>
            <p className="font-semibold text-purple-600">{ride.droppedOffCount}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActiveRideMonitor;
