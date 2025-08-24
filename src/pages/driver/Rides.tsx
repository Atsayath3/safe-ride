import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import MobileLayout from '@/components/mobile/MobileLayout';
import { Clock, MapPin, Users, Loader2 } from 'lucide-react';
import { RideService } from '@/services/rideService';
import { ActiveRide } from '@/interfaces/ride';

const DriverRides = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [rides, setRides] = useState<ActiveRide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRides = async () => {
      if (!userProfile?.uid) return;
      
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching rides for driver:', userProfile.uid);
        const rideHistory = await RideService.getDriverRideHistory(userProfile.uid);
        console.log('Fetched ride history:', rideHistory);
        setRides(rideHistory);
      } catch (err) {
        console.error('Failed to load ride history:', err);
        setError(err instanceof Error ? err.message : 'Failed to load ride history');
      } finally {
        setLoading(false);
      }
    };

    fetchRides();
  }, [userProfile?.uid]);

  if (userProfile?.status !== 'approved') {
    return (
      <MobileLayout 
        title="My Rides" 
        showBack={true}
        theme="driver"
      >
        <div className="p-4 space-y-6 min-h-screen">
          <Card className="border-2 border-yellow-300 shadow-xl bg-gradient-to-r from-yellow-50 to-white">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="text-lg font-bold text-yellow-900 mb-2">Pending Approval</h3>
              <p className="text-yellow-700">
                You need admin approval before you can view and manage rides.
              </p>
            </CardContent>
          </Card>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout 
      title="My Rides" 
      showBack={true}
      theme="driver"
    >
      <div className="p-4 space-y-6 min-h-screen">
        {loading ? (
          <Card className="border-2 border-orange-300 shadow-xl bg-gradient-to-r from-orange-50 to-white">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
                <Loader2 className="h-8 w-8 text-orange-600 animate-spin" />
              </div>
              <h3 className="text-lg font-bold text-orange-900 mb-2">Loading Rides</h3>
              <p className="text-orange-700">
                Fetching your ride history...
              </p>
            </CardContent>
          </Card>
        ) : error ? (
          <Card className="border-2 border-red-300 shadow-xl bg-gradient-to-r from-red-50 to-white">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-red-900 mb-2">Error Loading Rides</h3>
              <p className="text-red-700">
                {error}
              </p>
            </CardContent>
          </Card>
        ) : rides.length === 0 ? (
          <Card className="border-2 border-blue-300 shadow-xl bg-gradient-to-r from-blue-50 to-white">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-blue-900 mb-2">No Rides Yet</h3>
              <p className="text-blue-700">
                Your completed rides will appear here once you start offering rides.
              </p>
            </CardContent>
          </Card>
        ) : (
          rides.map((ride) => {
            // Calculate route from pickup to dropoff locations
            const firstChild = ride.children[0];
            const lastChild = ride.children[ride.children.length - 1];
            
            const routeDisplay = firstChild && lastChild 
              ? `${firstChild.pickupLocation.address} → ${lastChild.dropoffLocation.address}`
              : 'Multiple locations';

            const formattedDate = ride.date.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            });

            const formattedTime = ride.startedAt 
              ? ride.startedAt.toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit', 
                  hour12: true 
                })
              : 'N/A';

            return (
              <Card key={ride.id} className="border-2 border-green-300 shadow-xl bg-gradient-to-r from-green-50 to-white">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold text-green-900">{formattedDate}</CardTitle>
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                      ride.status === 'completed' ? 'bg-green-200 text-green-800' : 
                      ride.status === 'in_progress' ? 'bg-blue-200 text-blue-800' :
                      'bg-yellow-200 text-yellow-800'
                    }`}>
                      {ride.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-green-900">Start Time</p>
                      <p className="text-sm text-green-700">{formattedTime}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-green-900">Route</p>
                      <p className="text-sm text-green-700 break-words">{routeDisplay}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-green-900">Children</p>
                      <p className="text-sm text-green-700">
                        {ride.totalChildren} {ride.totalChildren === 1 ? 'child' : 'children'}
                        {ride.status === 'completed' && (
                          <span className="block text-xs text-green-600 mt-1">
                            ✓ {ride.droppedOffCount} completed • ✗ {ride.absentCount} absent
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </MobileLayout>
  );
};

export default DriverRides;