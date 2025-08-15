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
    <MobileLayout title="Welcome Driver" theme="driver">
      <div className="p-4 space-y-6">
        {/* Welcome Message */}
        <Card className="border-orange-200 shadow-lg">
          <CardHeader className="text-center bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-t-lg">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-xl">🎉</span>
            </div>
            <CardTitle className="text-xl text-white">
              Welcome, {userProfile?.firstName}!
            </CardTitle>
            <p className="text-orange-100 text-sm">
              You're almost ready to start driving with Safe Ride
            </p>
          </CardHeader>
        </Card>

        {/* Document Upload Section */}
        <Card className="border-orange-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg text-orange-800">Complete Your Profile</CardTitle>
            <p className="text-sm text-orange-600">
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
                  className="flex items-center justify-between p-4 border border-orange-200 rounded-lg hover:border-orange-400 cursor-pointer transition-colors bg-orange-50/50"
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="h-5 w-5 text-orange-600" />
                    <span className="font-medium">{doc.label}</span>
                    {doc.required && (
                      <span className="text-red-600 text-xs">*</span>
                    )}
                  </div>
                  <span className="text-xs text-orange-600">Upload</span>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Status Info */}
        <Card className="border-orange-200 bg-orange-50/50 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
              <div>
                <p className="font-medium text-sm text-orange-800">Verification Pending</p>
                <p className="text-xs text-orange-600">
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
            className="w-full bg-orange-600 hover:bg-orange-700 text-white" 
          >
            Go to Dashboard
          </Button>
          
          <Button 
            onClick={() => navigate('/driver/profile')}
            variant="outline" 
            className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
          >
            View Profile
          </Button>
        </div>
      </div>
    </MobileLayout>
  );
};

export default DriverWelcome;