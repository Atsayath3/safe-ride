import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import MobileLayout from '@/components/mobile/MobileLayout';
import { Camera, FileText, CreditCard, User, MessageSquare, CheckCircle, XCircle } from 'lucide-react';

const DriverWelcome = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  const documents = [
    { id: 'nic', label: 'National ID Card', icon: FileText, required: true, field: 'nic' },
    { id: 'insurance', label: 'Vehicle Insurance', icon: CreditCard, required: true, field: 'vehicleInsurance' },
    { id: 'license', label: 'Vehicle License', icon: FileText, required: true, field: 'vehicleLicense' },
    { id: 'profile', label: 'Profile Picture', icon: Camera, required: true, field: 'profilePicture' }
  ];

  const getDocumentStatus = (field: string) => {
    return userProfile?.documents?.[field as keyof typeof userProfile.documents];
  };

  const getStatusColor = (field: string) => {
    return getDocumentStatus(field) ? 'text-green-500' : 'text-red-500';
  };

  const getStatusIcon = (field: string) => {
    return getDocumentStatus(field) ? CheckCircle : XCircle;
  };

  const uploadedCount = documents.filter(doc => getDocumentStatus(doc.field)).length;
  const allUploaded = uploadedCount === documents.length;

  return (
    <MobileLayout title="Welcome Driver" theme="driver">
      <div className="p-4 space-y-6">
        {/* Welcome Message */}
        <Card className="border-orange-300 shadow-xl bg-white">
          <CardHeader className="text-center bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-t-lg">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-xl">🎉</span>
            </div>
            <CardTitle className="text-xl font-bold text-white">
              Welcome, {userProfile?.firstName}!
            </CardTitle>
            <p className="text-orange-100 text-sm mt-2">
              You're almost ready to start driving with Safe Ride
            </p>
          </CardHeader>
        </Card>

        {/* Document Upload Section */}
        <Card className="border-orange-300 shadow-xl bg-white">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100">
            <CardTitle className="text-lg font-bold text-orange-900 flex items-center justify-between">
              Complete Your Profile
              <div className="text-sm font-semibold bg-orange-200 text-orange-800 px-3 py-1 rounded-full">
                {uploadedCount}/{documents.length} uploaded
              </div>
            </CardTitle>
            <p className="text-sm text-orange-700 font-medium">
              Upload the required documents to get verified
            </p>
          </CardHeader>
          <CardContent className="space-y-3 p-6">
            {documents.map((doc) => {
              const Icon = doc.icon;
              const StatusIcon = getStatusIcon(doc.field);
              const isUploaded = getDocumentStatus(doc.field);
              
              return (
                <div
                  key={doc.id}
                  onClick={() => navigate(`/driver/upload/${doc.id}`)}
                  className={`flex items-center justify-between p-4 border-2 rounded-xl hover:shadow-md cursor-pointer transition-all ${
                    isUploaded 
                      ? 'border-green-300 bg-green-50 hover:bg-green-100 hover:border-green-400' 
                      : 'border-red-300 bg-red-50 hover:bg-red-100 hover:border-red-400'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <Icon className={`h-6 w-6 ${
                      isUploaded ? 'text-green-700' : 'text-red-700'
                    }`} />
                    <div>
                      <span className={`font-semibold text-base ${
                        isUploaded ? 'text-green-900' : 'text-red-900'
                      }`}>
                        {doc.label}
                      </span>
                      {doc.required && (
                        <span className="text-red-600 text-sm ml-1">*</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      isUploaded ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <StatusIcon className={`h-5 w-5 ${
                      isUploaded ? 'text-green-600' : 'text-red-600'
                    }`} />
                    <span className={`text-sm font-bold ${
                      isUploaded ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {isUploaded ? 'Uploaded' : 'Required'}
                    </span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Status Info */}
        <Card className={`shadow-xl border-2 ${
          allUploaded 
            ? 'border-green-300 bg-green-50' 
            : 'border-orange-300 bg-orange-50'
        }`}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className={`w-4 h-4 rounded-full ${
                allUploaded 
                  ? 'bg-green-500' 
                  : uploadedCount > 0 
                    ? 'bg-yellow-500 animate-pulse' 
                    : 'bg-red-500'
              }`}></div>
              <div className="flex-1">
                <p className={`font-bold text-base ${
                  allUploaded ? 'text-green-900' : 'text-orange-900'
                }`}>
                  {allUploaded 
                    ? 'Documents Complete - Ready for Verification' 
                    : uploadedCount > 0 
                      ? `Documents In Progress (${uploadedCount}/${documents.length})`
                      : 'Documents Required'
                  }
                </p>
                <p className={`text-sm font-medium mt-1 ${
                  allUploaded ? 'text-green-700' : 'text-orange-700'
                }`}>
                  {allUploaded 
                    ? 'All required documents have been uploaded. Admin review in progress.'
                    : 'Upload all documents to start the verification process'
                  }
                </p>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-4">
              <div className="w-full bg-gray-300 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-500 ${
                    allUploaded ? 'bg-green-500' : 'bg-orange-500'
                  }`}
                  style={{ width: `${(uploadedCount / documents.length) * 100}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm font-semibold text-gray-700 mt-2">
                <span>Progress</span>
                <span>{Math.round((uploadedCount / documents.length) * 100)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button 
            onClick={() => navigate('/driver/dashboard')}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 text-base shadow-lg hover:shadow-xl transition-all" 
          >
            Go to Dashboard
          </Button>
          
          <Button 
            onClick={() => navigate('/driver/profile')}
            variant="outline" 
            className="w-full border-2 border-orange-400 text-orange-800 hover:bg-orange-100 font-semibold py-3 text-base shadow-md hover:shadow-lg transition-all"
          >
            View Profile
          </Button>
        </div>
      </div>
    </MobileLayout>
  );
};

export default DriverWelcome;