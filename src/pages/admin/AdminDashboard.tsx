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
      const drivers = querySnapshot.docs.map(doc => {
        const data = doc.data();
        
        // Handle different createdAt formats safely
        let createdAt = new Date();
        if (data.createdAt) {
          if (typeof data.createdAt.toDate === 'function') {
            // Firestore Timestamp
            createdAt = data.createdAt.toDate();
          } else if (data.createdAt instanceof Date) {
            // Regular Date object
            createdAt = data.createdAt;
          } else if (typeof data.createdAt === 'string') {
            // String date
            createdAt = new Date(data.createdAt);
          }
        }
        
        return {
          ...data,
          createdAt
        };
      }) as UserProfile[];
      
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Professional Header */}
        <div className="bg-white border-b border-slate-200 shadow-sm">
          <div className="p-6">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
                <p className="text-slate-600">
                  SafeRide Driver Management System
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={logout} 
                className="border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Stats Overview - Pending Applications Only */}
          <div className="grid grid-cols-1 max-w-md mx-auto">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Pending Applications</p>
                    <p className="text-3xl font-bold">{pendingDrivers.length}</p>
                    <p className="text-blue-200 text-xs mt-1">Applications awaiting review</p>
                  </div>
                  <div className="bg-blue-400/20 p-3 rounded-lg">
                    <Clock className="h-6 w-6 text-blue-100" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pending Driver Applications */}
          <Card className="bg-white border border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  Pending Driver Applications
                </CardTitle>
                {pendingDrivers.length > 0 && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                    {pendingDrivers.length} awaiting review
                  </Badge>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="p-6">
              {pendingDrivers.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-green-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-10 w-10 text-green-500" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 mb-2">All caught up!</h3>
                  <p className="text-slate-600">No pending driver applications at the moment.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {pendingDrivers.map((driver, index) => (
                    <Card key={driver.uid} className="border border-slate-200 hover:shadow-md transition-shadow">
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="bg-blue-50 p-2 rounded-full">
                              <User className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <CardTitle className="text-lg font-semibold text-slate-900">
                                {driver.username 
                                  ? `@${driver.username}` 
                                  : driver.firstName && driver.lastName 
                                    ? `${driver.firstName} ${driver.lastName}` 
                                    : driver.email || 'Unknown Driver'
                                }
                              </CardTitle>
                              <p className="text-sm text-slate-500">
                                {driver.username && driver.firstName && driver.lastName && (
                                  <>
                                    {driver.firstName} {driver.lastName} • 
                                  </>
                                )}
                                Application #{index + 1} • {driver.email || 'No email'}
                              </p>
                            </div>
                          </div>
                          <Badge 
                            variant="outline" 
                            className="border-amber-200 bg-amber-50 text-amber-700 flex items-center gap-1"
                          >
                            <Clock className="h-3 w-3" />
                            Pending Review
                          </Badge>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        {/* Contact Information */}
                        <div className="bg-slate-50 p-4 rounded-lg">
                          <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            Contact Information
                          </h4>
                          <div className="space-y-3 text-sm">
                            {driver.username && (
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                <span className="font-medium text-slate-700 min-w-[70px]">Username:</span>
                                <span className="text-slate-600 font-mono">@{driver.username}</span>
                              </div>
                            )}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                              <span className="font-medium text-slate-700 min-w-[70px]">Name:</span>
                              <span className="text-slate-600">
                                {driver.firstName && driver.lastName 
                                  ? `${driver.firstName} ${driver.lastName}` 
                                  : 'Not provided'
                                }
                              </span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                              <span className="font-medium text-slate-700 min-w-[70px]">Email:</span>
                              <span className="text-slate-600 break-all">{driver.email}</span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                              <span className="font-medium text-slate-700 min-w-[70px]">Phone:</span>
                              <span className="text-slate-600">{driver.phone}</span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                              <span className="font-medium text-slate-700 min-w-[70px]">City:</span>
                              <span className="text-slate-600">{driver.city}</span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                              <span className="font-medium text-slate-700 min-w-[70px]">Applied:</span>
                              <span className="text-slate-600">{driver.createdAt?.toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>

                        {/* Vehicle Information */}
                        {driver.vehicle && (
                          <div className="bg-slate-50 p-4 rounded-lg">
                            <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <Car className="h-4 w-4" />
                              Vehicle Details
                            </h4>
                            <div className="space-y-3 text-sm">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                <span className="font-medium text-slate-700 min-w-[60px]">Type:</span>
                                <span className="text-slate-600">{driver.vehicle.type}</span>
                              </div>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                <span className="font-medium text-slate-700 min-w-[60px]">Capacity:</span>
                                <span className="text-slate-600">{driver.vehicle.capacity}</span>
                              </div>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                <span className="font-medium text-slate-700 min-w-[60px]">Model:</span>
                                <span className="text-slate-600">{driver.vehicle.model}</span>
                              </div>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                <span className="font-medium text-slate-700 min-w-[60px]">Year:</span>
                                <span className="text-slate-600">{driver.vehicle.year}</span>
                              </div>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                <span className="font-medium text-slate-700 min-w-[60px]">Color:</span>
                                <span className="text-slate-600">{driver.vehicle.color}</span>
                              </div>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                <span className="font-medium text-slate-700 min-w-[60px]">Plate:</span>
                                <span className="text-slate-600">{driver.vehicle.plateNumber}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Documents Status */}
                        <div className="bg-slate-50 p-4 rounded-lg">
                          <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            <FileText className="h-4 w-4" />
                            Document Status
                          </h4>
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              { key: 'nic', label: 'National ID', doc: driver.documents?.nic },
                              { key: 'vehicleInsurance', label: 'Insurance', doc: driver.documents?.vehicleInsurance },
                              { key: 'vehicleLicense', label: 'License', doc: driver.documents?.vehicleLicense },
                              { key: 'profilePicture', label: 'Photo', doc: driver.documents?.profilePicture }
                            ].map(({ key, label, doc }) => (
                              <div key={key} className="flex items-center gap-2 text-sm">
                                {doc ? (
                                  <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    <span className="text-slate-700">{label}</span>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700"
                                      onClick={() => window.open(doc, '_blank')}
                                    >
                                      View
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <XCircle className="h-4 w-4 text-red-500" />
                                    <span className="text-slate-500">{label}</span>
                                    <span className="text-xs text-red-600">Missing</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-4 border-t border-slate-200 space-y-3">
                          <div className="w-full">
                            <Button 
                              onClick={() => handleViewDocuments(driver)}
                              variant="outline"
                              className="w-full border-blue-200 text-blue-700 hover:bg-blue-50 h-11"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Review Documents
                            </Button>
                          </div>
                          
                          <div className="flex flex-col sm:flex-row gap-3">
                            <Button 
                              onClick={() => handleDriverAction(driver.uid, 'approve')}
                              className="w-full sm:flex-1 bg-green-600 hover:bg-green-700 h-11"
                              disabled={!hasAllDocuments(driver)}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve
                            </Button>
                            
                            <Button 
                              onClick={() => handleRejectClick(driver)}
                              variant="destructive"
                              className="w-full sm:flex-1 h-11"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                          </div>
                        </div>
                        
                        {!hasAllDocuments(driver) && (
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                            <p className="text-sm text-amber-800 font-medium flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              Missing required documents - approval blocked
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Professional Rejection Dialog */}
      <Dialog open={rejectionDialogOpen} onOpenChange={setRejectionDialogOpen}>
        <DialogContent className="max-w-lg bg-white">
          <DialogHeader className="border-b border-slate-200 pb-4">
            <DialogTitle className="text-xl font-semibold text-slate-900 flex items-center gap-3">
              <div className="bg-red-100 p-2 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              Reject Driver Application
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-6">
            {selectedDriverForRejection && (
              <Card className="bg-red-50 border-red-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-red-100 p-2 rounded-full">
                      <User className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-red-900">
                        {selectedDriverForRejection.username 
                          ? `@${selectedDriverForRejection.username}` 
                          : selectedDriverForRejection.firstName && selectedDriverForRejection.lastName
                            ? `${selectedDriverForRejection.firstName} ${selectedDriverForRejection.lastName}`
                            : selectedDriverForRejection.email || 'Unknown Driver'
                        }
                      </p>
                      <p className="text-sm text-red-700">
                        {selectedDriverForRejection.username && selectedDriverForRejection.firstName && selectedDriverForRejection.lastName && (
                          <>{selectedDriverForRejection.firstName} {selectedDriverForRejection.lastName} • </>
                        )}
                        {selectedDriverForRejection.email}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <div className="space-y-3">
              <Label htmlFor="rejection-reason" className="text-sm font-semibold text-slate-900">
                Reason for Rejection <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="rejection-reason"
                placeholder="Please provide a clear and professional reason for rejecting this application. This message will be visible to the applicant."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="min-h-[120px] resize-none border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                maxLength={500}
              />
              <div className="flex justify-between items-center">
                <p className="text-xs text-slate-500">
                  Be specific and constructive in your feedback
                </p>
                <p className="text-xs text-slate-500">
                  {rejectionReason.length}/500 characters
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-3 border-t border-slate-200 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setRejectionDialogOpen(false)}
              disabled={submittingRejection}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleRejectSubmit}
              disabled={!rejectionReason.trim() || submittingRejection}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              {submittingRejection ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Application
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Professional Documents Review Dialog */}
      <Dialog open={documentsDialogOpen} onOpenChange={setDocumentsDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[95vh] bg-white overflow-hidden flex flex-col">
          <DialogHeader className="border-b border-slate-200 pb-4">
            <DialogTitle className="text-xl font-semibold text-slate-900 flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              Document Review Center
            </DialogTitle>
          </DialogHeader>
          
          <div className="overflow-y-auto flex-1">
            {selectedDriverForDocuments && (
              <div className="space-y-8 py-6">
              {/* Driver Profile Summary */}
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="bg-blue-200 p-3 rounded-full">
                      <User className="h-6 w-6 text-blue-700" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-blue-900">
                        {selectedDriverForDocuments.username 
                          ? `@${selectedDriverForDocuments.username}` 
                          : selectedDriverForDocuments.firstName && selectedDriverForDocuments.lastName
                            ? `${selectedDriverForDocuments.firstName} ${selectedDriverForDocuments.lastName}`
                            : selectedDriverForDocuments.email || 'Unknown Driver'
                        }
                      </h3>
                      <p className="text-blue-700">
                        {selectedDriverForDocuments.username && selectedDriverForDocuments.firstName && selectedDriverForDocuments.lastName
                          ? `${selectedDriverForDocuments.firstName} ${selectedDriverForDocuments.lastName} • Driver Application Review`
                          : 'Driver Application Review'
                        }
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {selectedDriverForDocuments.username && (
                      <div className="bg-white/50 p-3 rounded-lg">
                        <p className="font-semibold text-blue-900">Username</p>
                        <p className="text-blue-700 font-mono">@{selectedDriverForDocuments.username}</p>
                      </div>
                    )}
                    <div className="bg-white/50 p-3 rounded-lg">
                      <p className="font-semibold text-blue-900">Full Name</p>
                      <p className="text-blue-700">
                        {selectedDriverForDocuments.firstName && selectedDriverForDocuments.lastName 
                          ? `${selectedDriverForDocuments.firstName} ${selectedDriverForDocuments.lastName}` 
                          : 'Not provided'
                        }
                      </p>
                    </div>
                    <div className="bg-white/50 p-3 rounded-lg">
                      <p className="font-semibold text-blue-900">Email</p>
                      <p className="text-blue-700">{selectedDriverForDocuments.email}</p>
                    </div>
                    <div className="bg-white/50 p-3 rounded-lg">
                      <p className="font-semibold text-blue-900">Phone</p>
                      <p className="text-blue-700">{selectedDriverForDocuments.phone}</p>
                    </div>
                    <div className="bg-white/50 p-3 rounded-lg">
                      <p className="font-semibold text-blue-900">Location</p>
                      <p className="text-blue-700">{selectedDriverForDocuments.city}</p>
                    </div>
                    <div className="bg-white/50 p-3 rounded-lg">
                      <p className="font-semibold text-blue-900">Applied</p>
                      <p className="text-blue-700">{selectedDriverForDocuments.createdAt?.toLocaleDateString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Document Review Grid */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  Required Documents
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { key: 'nic', label: 'National ID Card', doc: selectedDriverForDocuments.documents?.nic, color: 'blue' },
                    { key: 'vehicleInsurance', label: 'Vehicle Insurance', doc: selectedDriverForDocuments.documents?.vehicleInsurance, color: 'green' },
                    { key: 'vehicleLicense', label: 'Vehicle Registration', doc: selectedDriverForDocuments.documents?.vehicleLicense, color: 'purple' },
                    { key: 'profilePicture', label: 'Profile Picture', doc: selectedDriverForDocuments.documents?.profilePicture, color: 'orange' }
                  ].map(({ key, label, doc, color }) => (
                    <Card key={key} className={`${
                      doc 
                        ? `border-${color}-200 bg-${color}-50` 
                        : 'border-red-200 bg-red-50'
                    } transition-all hover:shadow-md`}>
                      <CardHeader className="pb-3">
                        <CardTitle className={`text-lg flex items-center gap-3 ${
                          doc ? `text-${color}-800` : 'text-red-800'
                        }`}>
                          <div className={`p-2 rounded-lg ${
                            doc ? `bg-${color}-100` : 'bg-red-100'
                          }`}>
                            {doc ? (
                              <CheckCircle className={`h-5 w-5 text-${color}-600`} />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-600" />
                            )}
                          </div>
                          {label}
                          <Badge 
                            variant={doc ? "default" : "destructive"} 
                            className="ml-auto"
                          >
                            {doc ? 'Uploaded' : 'Missing'}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      
                      <CardContent>
                        {doc ? (
                          <div className="space-y-4">
                            <div className="relative group">
                              <img 
                                src={doc} 
                                alt={`${label} document`}
                                className="w-full h-56 object-cover rounded-lg border border-slate-300 cursor-pointer hover:shadow-lg transition-all"
                                onClick={() => window.open(doc, '_blank')}
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all rounded-lg flex items-center justify-center">
                                <Button 
                                  size="sm" 
                                  className="opacity-0 group-hover:opacity-100 transition-opacity bg-white text-slate-900 hover:bg-slate-100"
                                  onClick={() => window.open(doc, '_blank')}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Full Size
                                </Button>
                              </div>
                            </div>
                            <div className={`bg-${color}-100 p-3 rounded-lg border border-${color}-200`}>
                              <p className={`text-sm font-medium text-${color}-800 flex items-center gap-2`}>
                                <CheckCircle className={`h-4 w-4 text-${color}-600`} />
                                Document verified and accessible
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="h-56 border-2 border-dashed border-red-300 rounded-lg flex items-center justify-center bg-red-25">
                            <div className="text-center text-red-600">
                              <XCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                              <p className="font-medium">Document Not Uploaded</p>
                              <p className="text-sm mt-1">Required for approval</p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Vehicle Information */}
              {selectedDriverForDocuments.vehicle && (
                <Card className="bg-slate-50 border-slate-200">
                  <CardHeader>
                    <CardTitle className="text-slate-900 flex items-center gap-3">
                      <div className="bg-slate-200 p-2 rounded-lg">
                        <Car className="h-5 w-5 text-slate-700" />
                      </div>
                      Vehicle Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {[
                        { label: 'Vehicle Type', value: selectedDriverForDocuments.vehicle.type },
                        { label: 'Passenger Capacity', value: selectedDriverForDocuments.vehicle.capacity },
                        { label: 'Make & Model', value: selectedDriverForDocuments.vehicle.model },
                        { label: 'Manufacturing Year', value: selectedDriverForDocuments.vehicle.year },
                        { label: 'Color', value: selectedDriverForDocuments.vehicle.color },
                        { label: 'License Plate', value: selectedDriverForDocuments.vehicle.plateNumber }
                      ].map(({ label, value }) => (
                        <div key={label} className="bg-white p-3 rounded-lg border border-slate-200">
                          <p className="text-sm font-medium text-slate-700">{label}</p>
                          <p className="text-slate-900 font-semibold">{value}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Decision Panel */}
              <Card className="border-slate-300 bg-slate-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-900">Review Decision</h3>
                    <Badge 
                      variant={hasAllDocuments(selectedDriverForDocuments) ? "default" : "destructive"}
                      className="text-sm"
                    >
                      {hasAllDocuments(selectedDriverForDocuments) 
                        ? 'Ready for Approval' 
                        : 'Incomplete Application'
                      }
                    </Badge>
                  </div>
                  
                  <div className="flex gap-4">
                    <Button 
                      onClick={() => {
                        setDocumentsDialogOpen(false);
                        handleDriverAction(selectedDriverForDocuments.uid, 'approve');
                      }}
                      className="flex-1 bg-green-600 hover:bg-green-700 h-12"
                      disabled={!hasAllDocuments(selectedDriverForDocuments)}
                    >
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Approve Application
                    </Button>
                    <Button 
                      onClick={() => {
                        setDocumentsDialogOpen(false);
                        handleRejectClick(selectedDriverForDocuments);
                      }}
                      variant="destructive"
                      className="flex-1 h-12"
                    >
                      <XCircle className="h-5 w-5 mr-2" />
                      Reject Application
                    </Button>
                  </div>
                  
                  {!hasAllDocuments(selectedDriverForDocuments) && (
                    <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <p className="text-amber-800 font-medium flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Cannot approve: Missing required documents
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
              )}
            </div>
          
          <DialogFooter className="border-t border-slate-200 pt-4 flex-shrink-0">
            <Button 
              className="px-8 bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-400"
              onClick={() => setDocumentsDialogOpen(false)}
            >
              Close Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
};

export default AdminDashboard;