import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import MobileLayout from '@/components/mobile/MobileLayout';
import { MapPin, Clock, Users, Settings, Calendar } from 'lucide-react';

const DriverDashboard = () => {
  const navigate = useNavigate();
  const { userProfile, logout } = useAuth();

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'approved': return 'text-green-600';
      case 'rejected': return 'text-red-600';
      default: return 'text-yellow-600';
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'approved': return 'Approved - You can start hosting rides';
      case 'rejected': return 'Rejected - Please contact admin';
      default: return 'Pending - Waiting for admin approval';
    }
  };

  return (
    <MobileLayout 
      title="Driver Dashboard" 
      showMenu={true}
      onMenu={() => navigate('/driver/profile')}
    >
  <div className="p-4 space-y-6 rounded-2xl shadow-xl border border-border/60 bg-background/95">
        {/* Status Card */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Account Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${
                userProfile?.status === 'approved' ? 'bg-green-500' : 
                userProfile?.status === 'rejected' ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'
              }`}></div>
              <div>
                <p className={`font-medium ${getStatusColor(userProfile?.status)}`}>
                  {userProfile?.status?.toUpperCase() || 'PENDING'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {getStatusText(userProfile?.status)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Card 
            className="border-border hover:border-primary/50 cursor-pointer transition-colors"
            onClick={() => navigate('/driver/routes')}
          >
            <CardContent className="p-4 text-center">
              <MapPin className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="font-medium text-sm">Set Routes</p>
            </CardContent>
          </Card>

          <Card 
            className="border-border hover:border-primary/50 cursor-pointer transition-colors"
            onClick={() => navigate('/driver/bookings')}
          >
            <CardContent className="p-4 text-center">
              <Calendar className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="font-medium text-sm">Bookings</p>
            </CardContent>
          </Card>

          <Card 
            className="border-border hover:border-primary/50 cursor-pointer transition-colors"
            onClick={() => navigate('/driver/rides')}
          >
            <CardContent className="p-4 text-center">
              <Clock className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="font-medium text-sm">My Rides</p>
            </CardContent>
          </Card>

          <Card 
            className="border-border hover:border-primary/50 cursor-pointer transition-colors"
            onClick={() => navigate('/driver/profile')}
          >
            <CardContent className="p-4 text-center">
              <Settings className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="font-medium text-sm">Profile</p>
            </CardContent>
          </Card>
        </div>

        {/* Logout */}
        <Button 
          variant="outline" 
          onClick={logout}
          className="w-full"
        >
          Logout
        </Button>
      </div>
    </MobileLayout>
  );
};

export default DriverDashboard;