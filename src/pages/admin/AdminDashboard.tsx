import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [selectedDriverForRejection, setSelectedDriverForRejection] = useState<UserProfile | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submittingRejection, setSubmittingRejection] = useState(false);
  const [documentsDialogOpen, setDocumentsDialogOpen] = useState(false);
  const [selectedDriverForDocuments, setSelectedDriverForDocuments] = useState<UserProfile | null>(null);

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
        collection(db, 'drivers'),
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

  const handleDriverAction = async (driverUid: string, action: 'approve' | 'reject', rejectionReason?: string) => {
    try {
      const updateData: any = {
        status: action === 'approve' ? 'approved' : 'rejected'
      };

      // Add rejection reason and timestamp if rejecting
      if (action === 'reject' && rejectionReason) {
        updateData.rejectionReason = rejectionReason;
        updateData.rejectedAt = new Date();
      }

      await updateDoc(doc(db, 'drivers', driverUid), updateData);

      toast({
        title: "Success",
        description: `Driver ${action}d successfully${action === 'reject' ? ' with reason provided' : ''}`
      });

      // Refresh the pending drivers list
      await fetchPendingDrivers();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${action} driver`,
        variant: "destructive"
      });
    }
  };

  const handleRejectClick = (driver: UserProfile) => {
    setSelectedDriverForRejection(driver);
    setRejectionReason('');
    setRejectionDialogOpen(true);
  };

  const handleViewDocuments = (driver: UserProfile) => {
    setSelectedDriverForDocuments(driver);
    setDocumentsDialogOpen(true);
  };

  const handleRejectSubmit = async () => {
    if (!selectedDriverForRejection || !rejectionReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for rejection",
        variant: "destructive"
      });
      return;
    }

    setSubmittingRejection(true);
    try {
      await handleDriverAction(selectedDriverForRejection.uid, 'reject', rejectionReason.trim());
      setRejectionDialogOpen(false);
      setSelectedDriverForRejection(null);
      setRejectionReason('');
    } catch (error) {
      console.error('Rejection error:', error);
    } finally {
      setSubmittingRejection(false);
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
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{pendingDrivers.length}</div>
            <div className="text-sm text-muted-foreground">Pending Applications</div>
          </CardContent>
        </Card>

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
                  <div className="space-y-2">
                    {/* View Documents Button */}
                    <Button 
                      onClick={() => handleViewDocuments(driver)}
                      variant="outline"
                      className="w-full border-blue-300 text-blue-700 hover:bg-blue-50"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View All Documents
                    </Button>
                    
                    {/* Approve/Reject Buttons */}
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => handleDriverAction(driver.uid, 'approve')}
                        className="flex-1"
                        disabled={!hasAllDocuments(driver)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button 
                        onClick={() => handleRejectClick(driver)}
                        variant="destructive"
                        className="flex-1"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
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

      {/* Rejection Reason Dialog */}
      <Dialog open={rejectionDialogOpen} onOpenChange={setRejectionDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-900">
              Reject Driver Application
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {selectedDriverForRejection && (
              <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                <p className="text-sm font-medium text-red-900">
                  {selectedDriverForRejection.firstName} {selectedDriverForRejection.lastName}
                </p>
                <p className="text-xs text-red-700">
                  {selectedDriverForRejection.email}
                </p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="rejection-reason" className="text-sm font-medium">
                Reason for Rejection *
              </Label>
              <Textarea
                id="rejection-reason"
                placeholder="Please provide a clear reason for rejecting this application (e.g., incomplete documents, invalid license, etc.)"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="min-h-[100px] resize-none"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">
                {rejectionReason.length}/500 characters
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setRejectionDialogOpen(false)}
              disabled={submittingRejection}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleRejectSubmit}
              disabled={!rejectionReason.trim() || submittingRejection}
            >
              {submittingRejection ? 'Rejecting...' : 'Reject Driver'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Documents Viewing Dialog */}
      <Dialog open={documentsDialogOpen} onOpenChange={setDocumentsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-blue-900 flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Document Review - {selectedDriverForDocuments?.firstName} {selectedDriverForDocuments?.lastName}
            </DialogTitle>
          </DialogHeader>
          
          {selectedDriverForDocuments && (
            <div className="space-y-6 py-4">
              {/* Driver Info Summary */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><strong>Name:</strong> {selectedDriverForDocuments.firstName} {selectedDriverForDocuments.lastName}</p>
                      <p><strong>Email:</strong> {selectedDriverForDocuments.email}</p>
                      <p><strong>Phone:</strong> {selectedDriverForDocuments.phone}</p>
                    </div>
                    <div>
                      <p><strong>City:</strong> {selectedDriverForDocuments.city}</p>
                      <p><strong>Applied:</strong> {selectedDriverForDocuments.createdAt?.toLocaleDateString()}</p>
                      <p><strong>Status:</strong> 
                        <Badge variant="secondary" className="ml-2">
                          {selectedDriverForDocuments.status || 'pending'}
                        </Badge>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Documents Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { key: 'nic', label: 'National ID Card', doc: selectedDriverForDocuments.documents?.nic },
                  { key: 'vehicleInsurance', label: 'Vehicle Insurance', doc: selectedDriverForDocuments.documents?.vehicleInsurance },
                  { key: 'vehicleLicense', label: 'Vehicle License', doc: selectedDriverForDocuments.documents?.vehicleLicense },
                  { key: 'profilePicture', label: 'Profile Picture', doc: selectedDriverForDocuments.documents?.profilePicture }
                ].map(({ key, label, doc }) => (
                  <Card key={key} className={`${doc ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                    <CardHeader className="pb-3">
                      <CardTitle className={`text-base flex items-center gap-2 ${
                        doc ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {doc ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                        {label}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {doc ? (
                        <div className="space-y-3">
                          <div className="relative">
                            <img 
                              src={doc} 
                              alt={`${label} document`}
                              className="w-full h-48 object-cover rounded-lg border border-gray-300 cursor-pointer hover:shadow-lg transition-shadow"
                              onClick={() => window.open(doc, '_blank')}
                            />
                            <div className="absolute top-2 right-2">
                              <Button 
                                size="sm" 
                                variant="secondary"
                                onClick={() => window.open(doc, '_blank')}
                                className="bg-black/70 text-white hover:bg-black/90"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-xs text-green-700 font-medium">✓ Document uploaded</p>
                        </div>
                      ) : (
                        <div className="h-48 border-2 border-dashed border-red-300 rounded-lg flex items-center justify-center">
                          <div className="text-center text-red-600">
                            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p className="text-sm font-medium">Document not uploaded</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Vehicle Information */}
              {selectedDriverForDocuments.vehicle && (
                <Card className="bg-gray-50 border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-gray-800 flex items-center gap-2">
                      <Car className="h-5 w-5" />
                      Vehicle Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div><strong>Type:</strong> {selectedDriverForDocuments.vehicle.type}</div>
                      <div><strong>Capacity:</strong> {selectedDriverForDocuments.vehicle.capacity}</div>
                      <div><strong>Model:</strong> {selectedDriverForDocuments.vehicle.model}</div>
                      <div><strong>Year:</strong> {selectedDriverForDocuments.vehicle.year}</div>
                      <div><strong>Color:</strong> {selectedDriverForDocuments.vehicle.color}</div>
                      <div><strong>Plate:</strong> {selectedDriverForDocuments.vehicle.plateNumber}</div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <Button 
                  onClick={() => {
                    setDocumentsDialogOpen(false);
                    handleDriverAction(selectedDriverForDocuments.uid, 'approve');
                  }}
                  className="flex-1"
                  disabled={!hasAllDocuments(selectedDriverForDocuments)}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve Driver
                </Button>
                <Button 
                  onClick={() => {
                    setDocumentsDialogOpen(false);
                    handleRejectClick(selectedDriverForDocuments);
                  }}
                  variant="destructive"
                  className="flex-1"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Driver
                </Button>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDocumentsDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
};

export default AdminDashboard;