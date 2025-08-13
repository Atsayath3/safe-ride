import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import MobileLayout from '@/components/mobile/MobileLayout';
import { User, Car, MapPin, FileText, Phone, Mail } from 'lucide-react';

const DriverProfile = () => {
  const navigate = useNavigate();
  const { userProfile, logout } = useAuth();

  const documentTypes = [
    { key: 'nic', label: 'National ID', path: 'nic' },
    { key: 'vehicleInsurance', label: 'Vehicle Insurance', path: 'insurance' },
    { key: 'vehicleLicense', label: 'Vehicle License', path: 'license' },
    { key: 'profilePicture', label: 'Profile Picture', path: 'profile' }
  ];

  return (
    <MobileLayout 
      title="Profile" 
      showBack={true} 
      onBack={() => navigate('/driver/dashboard')}
    >
      <div className="p-4 space-y-6">
        {/* Profile Info */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <User className="mr-2 h-5 w-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">First Name</p>
                <p className="font-medium">{userProfile?.firstName || 'Not set'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Last Name</p>
                <p className="font-medium">{userProfile?.lastName || 'Not set'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Phone</p>
                <p className="font-medium flex items-center">
                  <Phone className="h-4 w-4 mr-1" />
                  {userProfile?.phone || 'Not set'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Email</p>
                <p className="font-medium flex items-center">
                  <Mail className="h-4 w-4 mr-1" />
                  {userProfile?.email || 'Not set'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">City</p>
                <p className="font-medium">{userProfile?.city || 'Not set'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <p className={`font-medium ${
                  userProfile?.status === 'approved' ? 'text-green-600' : 
                  userProfile?.status === 'rejected' ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  {userProfile?.status?.toUpperCase() || 'PENDING'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Info */}
        {userProfile?.vehicle && (
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Car className="mr-2 h-5 w-5" />
                Vehicle Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Type</p>
                  <p className="font-medium">{userProfile.vehicle.type}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Capacity</p>
                  <p className="font-medium">{userProfile.vehicle.capacity}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Model</p>
                  <p className="font-medium">{userProfile.vehicle.model}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Year</p>
                  <p className="font-medium">{userProfile.vehicle.year}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Color</p>
                  <p className="font-medium">{userProfile.vehicle.color}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Plate Number</p>
                  <p className="font-medium">{userProfile.vehicle.plateNumber}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Documents */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <FileText className="mr-2 h-5 w-5" />
              Documents
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {documentTypes.map(({ key, label, path }) => {
              const hasDocument = userProfile?.documents?.[key as keyof typeof userProfile.documents];
              return (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm">{label}</span>
                  <div className="flex items-center gap-2">
                    {hasDocument ? (
                      <span className="text-green-600 text-sm">✓ Uploaded</span>
                    ) : (
                      <span className="text-red-600 text-sm">✗ Missing</span>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/driver/upload/${path}`)}
                    >
                      {hasDocument ? 'Update' : 'Upload'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Routes */}
        {userProfile?.routes && (
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <MapPin className="mr-2 h-5 w-5" />
                Route Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-muted-foreground text-sm">Starting Point</p>
                <p className="font-medium">{userProfile.routes.startPoint?.address || 'Not set'}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Ending Point</p>
                <p className="font-medium">{userProfile.routes.endPoint?.address || 'Not set'}</p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => navigate('/driver/routes')}
                className="w-full"
              >
                Update Route
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button 
            variant="outline" 
            onClick={() => navigate('/driver/profile-setup')}
            className="w-full"
          >
            Edit Profile
          </Button>
          
          <Button 
            variant="destructive" 
            onClick={logout}
            className="w-full"
          >
            Logout
          </Button>
        </div>
      </div>
    </MobileLayout>
  );
};

export default DriverProfile;