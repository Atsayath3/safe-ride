import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Clock, 
  User, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Navigation
} from 'lucide-react';
import { ActiveRide, RideChild } from '@/interfaces/ride';
import { RideService } from '@/services/rideService';
import { toast } from '@/hooks/use-toast';

interface ActiveRideTrackerProps {
  ride: ActiveRide;
  onRideUpdate: (updatedRide: ActiveRide) => void;
}

const ActiveRideTracker: React.FC<ActiveRideTrackerProps> = ({ ride, onRideUpdate }) => {
  const [updatingChild, setUpdatingChild] = useState<string | null>(null);

  // Helper function to convert Firestore Timestamp or Date to Date object
  const toDate = (timestamp: any): Date => {
    if (!timestamp) return new Date();
    if (timestamp instanceof Date) return timestamp;
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    }
    return new Date(timestamp);
  };

  // Safety check for ride data
  if (!ride || !Array.isArray(ride.children)) {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-4 text-center">
          <h3 className="text-red-800 font-medium">Invalid Ride Data</h3>
          <p className="text-red-600 text-sm">Please try starting a new ride.</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: RideChild['status']) => {
    switch (status) {
      case 'picked_up':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'dropped_off':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'absent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: RideChild['status']) => {
    switch (status) {
      case 'picked_up':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'dropped_off':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'absent':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const handleStatusUpdate = async (childId: string, status: 'picked_up' | 'absent' | 'dropped_off') => {
    setUpdatingChild(childId);
    
    try {
      await RideService.updateChildStatus(ride.id, childId, status);
      
      // Update local state
      const updatedChildren = ride.children.map(child => {
        if (child.childId === childId) {
          return {
            ...child,
            status,
            pickedUpAt: status === 'picked_up' ? new Date() : child.pickedUpAt,
            droppedOffAt: status === 'dropped_off' ? new Date() : child.droppedOffAt
          };
        }
        return child;
      });

      const pickedUpCount = updatedChildren.filter(child => child.status === 'picked_up').length;
      const absentCount = updatedChildren.filter(child => child.status === 'absent').length;
      const droppedOffCount = updatedChildren.filter(child => child.status === 'dropped_off').length;
      const allProcessed = updatedChildren.every(child => 
        child.status === 'dropped_off' || child.status === 'absent'
      );

      const updatedRide: ActiveRide = {
        ...ride,
        children: updatedChildren,
        pickedUpCount,
        absentCount,
        droppedOffCount,
        status: allProcessed ? 'completed' : ride.status,
        completedAt: allProcessed ? new Date() : ride.completedAt,
        updatedAt: new Date()
      };

      onRideUpdate(updatedRide);

      const statusText = status === 'picked_up' ? 'picked up' : 
                       status === 'dropped_off' ? 'dropped off' : 'absent';
      
      toast({
        title: "Status Updated",
        description: `Child marked as ${statusText}`,
      });

      if (allProcessed) {
        toast({
          title: "Ride Completed!",
          description: `All ${updatedChildren.length} children processed. Great job!`,
        });
      }

    } catch (error: any) {
      console.error('Error updating child status:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive"
      });
    } finally {
      setUpdatingChild(null);
    }
  };

  const handleCompleteRide = async () => {
    try {
      await RideService.completeRide(ride.id);
      
      const updatedRide: ActiveRide = {
        ...ride,
        status: 'completed',
        completedAt: new Date(),
        updatedAt: new Date()
      };

      onRideUpdate(updatedRide);

      toast({
        title: "Ride Completed",
        description: "Your ride has been marked as completed",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to complete ride",
        variant: "destructive"
      });
    }
  };

  const openNavigation = (address: string) => {
    try {
      const url = `https://maps.google.com/maps?q=${encodeURIComponent(address)}`;
      window.open(url, '_blank');
    } catch (error) {
      toast({
        title: "Navigation Error",
        description: "Could not open navigation",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Ride Status Header */}
      <Card className="bg-orange-50 border-orange-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-orange-900 text-lg">
              {ride.status === 'completed' ? '🎉 Ride Completed!' : '🚐 Active Ride'}
            </CardTitle>
            <Badge className="bg-orange-100 text-orange-800 border-orange-300">
              {ride.status === 'completed' ? 'Completed' : 'In Progress'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-3 text-center">
            <div>
              <div className="text-2xl font-bold text-orange-900">{ride.totalChildren}</div>
              <div className="text-sm text-orange-700">Total</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{ride.pickedUpCount}</div>
              <div className="text-sm text-green-700">Picked Up</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{ride.droppedOffCount || 0}</div>
              <div className="text-sm text-blue-700">Dropped Off</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{ride.absentCount}</div>
              <div className="text-sm text-red-700">Absent</div>
            </div>
          </div>
          
          {ride.status !== 'completed' && (
            <div className="mt-4 flex justify-center">
              <Button
                onClick={handleCompleteRide}
                className="bg-orange-600 hover:bg-orange-700"
                size="sm"
              >
                Complete Ride Early
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Children List */}
      <div className="space-y-3">
        <h3 className="font-semibold text-orange-900 text-lg">Children List</h3>
        
        {ride.children.map((child, index) => (
          <Card key={child.id} className="border border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <User className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-orange-900">{child.fullName}</h4>
                    <p className="text-sm text-orange-700">Stop #{index + 1}</p>
                  </div>
                </div>
                
                <Badge className={`${getStatusColor(child.status)} flex items-center gap-1`}>
                  {getStatusIcon(child.status)}
                  {child.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>

              {/* Pickup Details */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-orange-600" />
                  <span className="text-sm text-orange-800 flex-1">
                    Pickup: {child.pickupLocation.address}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openNavigation(child.pickupLocation.address)}
                    className="h-7 px-2 border-orange-300"
                  >
                    <Navigation className="h-3 w-3" />
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-blue-800 flex-1">
                    Drop-off: {child.dropoffLocation.address}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openNavigation(child.dropoffLocation.address)}
                    className="h-7 px-2 border-blue-300"
                  >
                    <Navigation className="h-3 w-3" />
                  </Button>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <span className="text-sm text-orange-800">
                    Scheduled: {child.scheduledPickupTime}
                  </span>
                </div>
                
                {child.pickedUpAt && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-700">
                      Picked up: {toDate(child.pickedUpAt).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                )}

                {child.droppedOffAt && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-blue-700">
                      Dropped off: {toDate(child.droppedOffAt).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {child.status === 'pending' && ride.status !== 'completed' && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleStatusUpdate(child.childId, 'picked_up')}
                    disabled={updatingChild === child.childId}
                    className="flex-1 bg-green-600 hover:bg-green-700 h-9"
                    size="sm"
                  >
                    {updatingChild === child.childId ? (
                      "Updating..."
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Mark Present
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={() => handleStatusUpdate(child.childId, 'absent')}
                    disabled={updatingChild === child.childId}
                    variant="outline"
                    className="flex-1 border-red-300 text-red-600 hover:bg-red-50 h-9"
                    size="sm"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Mark Absent
                  </Button>
                </div>
              )}

              {child.status === 'picked_up' && ride.status !== 'completed' && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleStatusUpdate(child.childId, 'dropped_off')}
                    disabled={updatingChild === child.childId}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 h-9"
                    size="sm"
                  >
                    {updatingChild === child.childId ? (
                      "Updating..."
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Mark Dropped Off
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ActiveRideTracker;