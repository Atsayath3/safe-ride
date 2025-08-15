import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import MobileLayout from '@/components/mobile/MobileLayout';
import { toast } from '@/hooks/use-toast';
import { UserProfile } from '@/contexts/AuthContext';
import { CheckCircle, XCircle, Clock, User, Car, FileText, Eye } from 'lucide-react';

const AdminDashboard = () => {
  const { userProfile, logout, currentUser } = useAuth();
  const navigate = useNavigate();
  const [pendingDrivers, setPendingDrivers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirect to login if not authenticated or not admin
  useEffect(() => {
    if (!currentUser) {
      navigate('/admin/login');
      return;
    }

    if (userProfile && userProfile.role !== 'admin') {
      toast({
        title: "Access Denied",
        description: "You don't have admin privileges",
        variant: "destructive"
      });
      navigate('/admin/login');
      return;
    }

    if (userProfile?.role === 'admin') {
      fetchPendingDrivers();
    }
  }, [currentUser, userProfile, navigate]);

  const fetchPendingDrivers = async () => {
    try {
      const driversQuery = query(
        collection(db, 'users'),
        where('role', '==', 'driver'),
        where('status', '==', 'pending')
      );
      
      const querySnapshot = await getDocs(driversQuery);
      const drivers = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as UserProfile[];
      
      setPendingDrivers(drivers);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      toast({
        title: "Error",
        description: "Failed to load pending drivers",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDriverAction = async (driverUid: string, action: 'approve' | 'reject') => {
    try {
      await updateDoc(doc(db, 'users', driverUid), {
        status: action === 'approve' ? 'approved' : 'rejected'
      });

      toast({
        title: "Success",
        description: `Driver ${action}d successfully`
      });

      // Refresh the list
      await fetchPendingDrivers();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${action} driver`,
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const hasAllDocuments = (driver: UserProfile) => {
    return driver.documents?.nic && 
           driver.documents?.vehicleInsurance && 
           driver.documents?.vehicleLicense && 
           driver.documents?.profilePicture;
  };

  if (loading) {
    return (
      <MobileLayout title="Admin Dashboard">
        <div className="p-4 flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </MobileLayout>
    );
  }

  // Show loading while checking authentication
  if (!userProfile) {
    return (
      <MobileLayout title="Admin Dashboard">
        <div className="p-4 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading...</p>
          </div>
        </div>
      </MobileLayout>
    );
  }

  // Ensure user is admin
  if (userProfile.role !== 'admin') {
    return null; // Will be redirected by useEffect
  }

  return (
    <MobileLayout title="Admin Dashboard" theme="admin">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-red-900">Welcome Admin</h2>
            <p className="text-sm text-red-600">
              {pendingDrivers.length} drivers awaiting approval
            </p>
          </div>
          <Button variant="ghost" onClick={logout} size="sm" className="text-red-700 hover:bg-red-50">
            Logout
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{pendingDrivers.length}</div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-500">0</div>
              <div className="text-sm text-muted-foreground">Approved Today</div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Drivers */}
        <div className="space-y-4">
          <h3 className="font-medium">Pending Driver Applications</h3>
          
          {pendingDrivers.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No pending applications</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            pendingDrivers.map((driver) => (
              <Card key={driver.uid} className="border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <CardTitle className="text-base">
                        {driver.firstName} {driver.lastName}
                      </CardTitle>
                    </div>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      {getStatusIcon(driver.status || 'pending')}
                      {driver.status || 'pending'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Contact Info */}
                  <div className="space-y-1">
                    <p className="text-sm"><strong>Email:</strong> {driver.email}</p>
                    <p className="text-sm"><strong>Phone:</strong> {driver.phone}</p>
                    <p className="text-sm"><strong>City:</strong> {driver.city}</p>
                  </div>

                  {/* Vehicle Info */}
                  {driver.vehicle && (
                    <div className="bg-muted p-3 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Car className="h-4 w-4" />
                        <span className="font-medium text-sm">Vehicle Details</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-xs">
                        <p><strong>Type:</strong> {driver.vehicle.type}</p>
                        <p><strong>Capacity:</strong> {driver.vehicle.capacity}</p>
                        <p><strong>Model:</strong> {driver.vehicle.model}</p>
                        <p><strong>Year:</strong> {driver.vehicle.year}</p>
                        <p><strong>Color:</strong> {driver.vehicle.color}</p>
                        <p><strong>Plate:</strong> {driver.vehicle.plateNumber}</p>
                      </div>
                    </div>
                  )}

                   {/* Documents Status */}
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4" />
                      <span className="font-medium text-sm">Documents</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {[
                        { key: 'nic', label: 'NIC', doc: driver.documents?.nic },
                        { key: 'vehicleInsurance', label: 'Insurance', doc: driver.documents?.vehicleInsurance },
                        { key: 'vehicleLicense', label: 'License', doc: driver.documents?.vehicleLicense },
                        { key: 'profilePicture', label: 'Photo', doc: driver.documents?.profilePicture }
                      ].map(({ key, label, doc }) => (
                        <div key={key} className="flex items-center gap-1">
                          {doc ? (
                            <div className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-primary hover:underline">
                                    {label}
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md">
                                  <DialogHeader>
                                    <DialogTitle>{label} - {driver.firstName} {driver.lastName}</DialogTitle>
                                  </DialogHeader>
                                  <div className="mt-4">
                                    <img 
                                      src={doc} 
                                      alt={`${label} document`}
                                      className="w-full h-auto rounded-lg border"
                                    />
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 text-red-500" />
                              <span className="text-muted-foreground">{label}</span>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button 
                      onClick={() => handleDriverAction(driver.uid, 'approve')}
                      className="flex-1"
                      disabled={!hasAllDocuments(driver)}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button 
                      onClick={() => handleDriverAction(driver.uid, 'reject')}
                      variant="destructive"
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                  
                  {!hasAllDocuments(driver) && (
                    <p className="text-xs text-muted-foreground text-center">
                      Missing documents - cannot approve yet
                    </p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </MobileLayout>
  );
};

export default AdminDashboard;