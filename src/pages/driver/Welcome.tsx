import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import MobileLayout from '@/components/mobile/MobileLayout';
import { Camera, FileText, CreditCard, User, MessageSquare } from 'lucide-react';

const DriverWelcome = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  const documents = [
    { id: 'nic', label: 'National ID Card', icon: FileText, required: true },
    { id: 'insurance', label: 'Vehicle Insurance', icon: CreditCard, required: true },
    { id: 'license', label: 'Vehicle License', icon: FileText, required: true },
    { id: 'profile', label: 'Profile Picture', icon: Camera, required: true }
  ];

  return (
    <MobileLayout title="Welcome Driver">
      <div className="p-4 space-y-6">
        {/* Welcome Message */}
        <Card className="border-border gradient-card">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-primary-foreground font-bold text-xl">🎉</span>
            </div>
            <CardTitle className="text-xl">
              Welcome, {userProfile?.firstName}!
            </CardTitle>
            <p className="text-muted-foreground text-sm">
              You're almost ready to start driving with Safe Ride
            </p>
          </CardHeader>
        </Card>

        {/* Document Upload Section */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Complete Your Profile</CardTitle>
            <p className="text-sm text-muted-foreground">
              Upload the required documents to get verified
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {documents.map((doc) => {
              const Icon = doc.icon;
              return (
                <div
                  key={doc.id}
                  onClick={() => navigate(`/driver/upload/${doc.id}`)}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:border-primary/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{doc.label}</span>
                    {doc.required && (
                      <span className="text-destructive text-xs">*</span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">Upload</span>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Status Info */}
        <Card className="border-border bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
              <div>
                <p className="font-medium text-sm">Verification Pending</p>
                <p className="text-xs text-muted-foreground">
                  Upload all documents to start the verification process
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button 
            onClick={() => navigate('/driver/dashboard')}
            className="w-full" 
            variant="hero"
          >
            Go to Dashboard
          </Button>
          
          <Button 
            onClick={() => navigate('/driver/profile')}
            variant="outline" 
            className="w-full"
          >
            View Profile
          </Button>
        </div>
      </div>
    </MobileLayout>
  );
};

export default DriverWelcome;