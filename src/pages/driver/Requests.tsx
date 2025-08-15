import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import MobileLayout from '@/components/mobile/MobileLayout';
import { Clock, MapPin, User, CheckCircle, XCircle } from 'lucide-react';

const DriverRequests = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  // Mock data - in real app this would come from database
  const requests = [
    {
      id: '1',
      parentName: 'Sarah Johnson',
      childName: 'Emma Johnson',
      pickupAddress: '123 Main Street, Colombo',
      requestedTime: '07:30 AM',
      status: 'pending'
    },
    {
      id: '2',
      parentName: 'Michael Chen',
      childName: 'Alex Chen',
      pickupAddress: '456 Oak Avenue, Colombo',
      requestedTime: '07:35 AM',
      status: 'pending'
    }
  ];

  const handleAcceptRequest = (requestId: string) => {
    // In real app, update database
    console.log('Accepting request:', requestId);
  };

  const handleRejectRequest = (requestId: string) => {
    // In real app, update database
    console.log('Rejecting request:', requestId);
  };

  if (userProfile?.status !== 'approved') {
    return (
      <MobileLayout 
        title="Ride Requests" 
        showBack={true} 
        onBack={() => navigate('/driver/dashboard')}
      >
        <div className="p-4">
          <Card className="border-border">
            <CardContent className="p-8 text-center">
              <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Pending Approval</h3>
              <p className="text-muted-foreground">
                You need admin approval before you can receive ride requests.
              </p>
            </CardContent>
          </Card>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout 
      title="Ride Requests" 
      showBack={true}
    >
      <div className="p-4 space-y-4">
        {requests.length === 0 ? (
          <Card className="border-border">
            <CardContent className="p-8 text-center">
              <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No New Requests</h3>
              <p className="text-muted-foreground">
                New ride requests from parents will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          requests.map((request) => (
            <Card key={request.id} className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">New Request</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{request.parentName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Child:</span>
                    <span className="text-sm">{request.childName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{request.pickupAddress}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Requested time: {request.requestedTime}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button 
                    onClick={() => handleAcceptRequest(request.id)}
                    className="flex-1"
                    variant="default"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Accept
                  </Button>
                  <Button 
                    onClick={() => handleRejectRequest(request.id)}
                    variant="outline"
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Decline
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </MobileLayout>
  );
};

export default DriverRequests;