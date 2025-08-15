import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import MobileLayout from '@/components/mobile/MobileLayout';
import { Clock, MapPin, Users } from 'lucide-react';

const DriverRides = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  // Mock data - in real app this would come from database
  const rides = [
    {
      id: '1',
      date: '2024-02-01',
      time: '07:30 AM',
      passengers: 3,
      route: 'Colombo to School',
      status: 'completed'
    },
    {
      id: '2', 
      date: '2024-02-02',
      time: '07:30 AM',
      passengers: 2,
      route: 'Colombo to School',
      status: 'completed'
    }
  ];

  if (userProfile?.status !== 'approved') {
    return (
      <MobileLayout 
        title="My Rides" 
        showBack={true}
      >
        <div className="p-4">
          <Card className="border-border">
            <CardContent className="p-8 text-center">
              <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Pending Approval</h3>
              <p className="text-muted-foreground">
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
    >
      <div className="p-4 space-y-4">
        {rides.length === 0 ? (
          <Card className="border-border">
            <CardContent className="p-8 text-center">
              <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No Rides Yet</h3>
              <p className="text-muted-foreground">
                Your completed rides will appear here once you start offering rides.
              </p>
            </CardContent>
          </Card>
        ) : (
          rides.map((ride) => (
            <Card key={ride.id} className="border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{ride.date}</CardTitle>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    ride.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {ride.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{ride.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{ride.route}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{ride.passengers} passengers</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </MobileLayout>
  );
};

export default DriverRides;