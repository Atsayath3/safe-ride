import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { collection, query, getDocs, deleteDoc, doc, where, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import MobileLayout from '@/components/mobile/MobileLayout';
import { toast } from '@/hooks/use-toast';
import { UserProfile } from '@/contexts/AuthContext';
import { Trash2, User, Car, Baby, Search, AlertTriangle, ArrowLeft, Users, Database } from 'lucide-react';

interface ChildData {
  id: string;
  parentId: string;
  firstName: string;
  lastName: string;
  age: number;
  school?: string;
  createdAt?: any;
  parentEmail?: string;
}

const DatabaseManagement = () => {
  const { userProfile, currentUser } = useAuth();
  const navigate = useNavigate();
  
  // State for different entity types
  const [drivers, setDrivers] = useState<UserProfile[]>([]);
  const [parents, setParents] = useState<UserProfile[]>([]);
  const [children, setChildren] = useState<ChildData[]>([]);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntityType, setSelectedEntityType] = useState<'drivers' | 'parents' | 'children'>('drivers');
  
  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [deleteReason, setDeleteReason] = useState('');

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
      fetchAllData();
    }
  }, [currentUser, userProfile, navigate]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchDrivers(),
        fetchParents(),
        fetchChildren()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load database information",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDrivers = async () => {
    try {
      const driversQuery = query(
        collection(db, 'users'),
        where('role', '==', 'driver')
      );
      const driversSnapshot = await getDocs(driversQuery);
      const driversList = driversSnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as UserProfile[];
      setDrivers(driversList);
    } catch (error) {
      console.error('Error fetching drivers:', error);
    }
  };

  const fetchParents = async () => {
    try {
      const parentsQuery = query(
        collection(db, 'users'),
        where('role', '==', 'parent')
      );
      const parentsSnapshot = await getDocs(parentsQuery);
      const parentsList = parentsSnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as UserProfile[];
      setParents(parentsList);
    } catch (error) {
      console.error('Error fetching parents:', error);
    }
  };

  const fetchChildren = async () => {
    try {
      const childrenSnapshot = await getDocs(collection(db, 'children'));
      const childrenList: ChildData[] = [];
      
      for (const childDoc of childrenSnapshot.docs) {
        const childData = { id: childDoc.id, ...childDoc.data() } as ChildData;
        
        // Try to get parent email for display
        if (childData.parentId) {
          try {
            const parentQuery = query(
              collection(db, 'users'),
              where('uid', '==', childData.parentId)
            );
            const parentSnapshot = await getDocs(parentQuery);
            if (!parentSnapshot.empty) {
              childData.parentEmail = parentSnapshot.docs[0].data().email;
            }
          } catch (error) {
            console.error('Error fetching parent for child:', error);
          }
        }
        
        childrenList.push(childData);
      }
      
      setChildren(childrenList);
    } catch (error) {
      console.error('Error fetching children:', error);
    }
  };

  const handleDeleteClick = (entity: any, type: 'drivers' | 'parents' | 'children') => {
    setSelectedEntity({ ...entity, entityType: type });
    setDeleteDialogOpen(true);
    setDeleteReason('');
  };

  const handleDeleteConfirm = async () => {
    if (!selectedEntity || !deleteReason.trim()) return;

    setDeleting(selectedEntity.uid || selectedEntity.id);
    
    try {
      const batch = writeBatch(db);

      if (selectedEntity.entityType === 'drivers') {
        // Delete driver and related data
        batch.delete(doc(db, 'users', selectedEntity.uid));
        
        // Delete related vehicle data, rides, etc. if needed
        // Add more related data cleanup here as needed
        
      } else if (selectedEntity.entityType === 'parents') {
        // Delete parent and their children
        batch.delete(doc(db, 'users', selectedEntity.uid));
        
        // Find and delete all children belonging to this parent
        const parentChildren = children.filter(child => child.parentId === selectedEntity.uid);
        parentChildren.forEach(child => {
          batch.delete(doc(db, 'children', child.id));
        });
        
      } else if (selectedEntity.entityType === 'children') {
        // Delete child
        batch.delete(doc(db, 'children', selectedEntity.id));
      }

      await batch.commit();

      toast({
        title: "Success",
        description: `${selectedEntity.entityType === 'children' ? 'Child' : selectedEntity.entityType === 'drivers' ? 'Driver' : 'Parent'} deleted successfully`,
      });

      // Refresh data
      await fetchAllData();
      setDeleteDialogOpen(false);
      setSelectedEntity(null);

    } catch (error) {
      console.error('Error deleting entity:', error);
      toast({
        title: "Error",
        description: "Failed to delete entity",
        variant: "destructive"
      });
    } finally {
      setDeleting(null);
    }
  };

  // Filter entities based on search query
  const getFilteredData = () => {
    let data = [];
    if (selectedEntityType === 'drivers') {
      data = drivers;
    } else if (selectedEntityType === 'parents') {
      data = parents;
    } else {
      data = children;
    }

    if (!searchQuery.trim()) return data;

    return data.filter(entity => {
      const searchLower = searchQuery.toLowerCase();
      if (selectedEntityType === 'children') {
        const child = entity as ChildData;
        return (
          child.firstName?.toLowerCase().includes(searchLower) ||
          child.lastName?.toLowerCase().includes(searchLower) ||
          child.school?.toLowerCase().includes(searchLower) ||
          child.parentEmail?.toLowerCase().includes(searchLower)
        );
      } else {
        const user = entity as UserProfile;
        return (
          user.firstName?.toLowerCase().includes(searchLower) ||
          user.lastName?.toLowerCase().includes(searchLower) ||
          user.email?.toLowerCase().includes(searchLower) ||
          user.phone?.toLowerCase().includes(searchLower) ||
          user.city?.toLowerCase().includes(searchLower)
        );
      }
    });
  };

  if (loading) {
    return (
      <MobileLayout title="Database Management">
        <div className="p-4 flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-muted-foreground">Loading database...</p>
          </div>
        </div>
      </MobileLayout>
    );
  }

  // Show loading while checking authentication
  if (!userProfile) {
    return (
      <MobileLayout title="Database Management">
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

  const filteredData = getFilteredData();

  return (
    <MobileLayout title="Database Management" theme="admin">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/admin/dashboard')}
                className="text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
            
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                <div className="bg-red-100 p-2 rounded-lg">
                  <Database className="h-6 w-6 text-red-600" />
                </div>
                Database Management
              </h1>
              <p className="text-slate-600">
                Manage users and data in the SafeRide system
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Drivers</p>
                    <p className="text-3xl font-bold">{drivers.length}</p>
                  </div>
                  <Car className="h-8 w-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Parents</p>
                    <p className="text-3xl font-bold">{parents.length}</p>
                  </div>
                  <Users className="h-8 w-8 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Children</p>
                    <p className="text-3xl font-bold">{children.length}</p>
                  </div>
                  <Baby className="h-8 w-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter Controls */}
          <Card className="bg-white border border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Label htmlFor="search" className="text-sm font-medium text-slate-700 mb-2 block">
                    Search
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="search"
                      placeholder="Search by name, email, phone..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="md:w-48">
                  <Label className="text-sm font-medium text-slate-700 mb-2 block">
                    Entity Type
                  </Label>
                  <Select value={selectedEntityType} onValueChange={(value: 'drivers' | 'parents' | 'children') => setSelectedEntityType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="drivers">Drivers ({drivers.length})</SelectItem>
                      <SelectItem value="parents">Parents ({parents.length})</SelectItem>
                      <SelectItem value="children">Children ({children.length})</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Table */}
          <Card className="bg-white border border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                <div className="bg-slate-100 p-2 rounded-lg">
                  {selectedEntityType === 'drivers' && <Car className="h-5 w-5 text-slate-600" />}
                  {selectedEntityType === 'parents' && <User className="h-5 w-5 text-slate-600" />}
                  {selectedEntityType === 'children' && <Baby className="h-5 w-5 text-slate-600" />}
                </div>
                {selectedEntityType === 'drivers' && 'Drivers'}
                {selectedEntityType === 'parents' && 'Parents'}
                {selectedEntityType === 'children' && 'Children'}
                <Badge variant="secondary" className="ml-auto">
                  {filteredData.length} {filteredData.length === 1 ? 'record' : 'records'}
                </Badge>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="p-0">
              {filteredData.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="h-10 w-10 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No records found</h3>
                  <p className="text-slate-600">
                    {searchQuery ? 'Try adjusting your search criteria' : `No ${selectedEntityType} in the database`}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredData.map((entity, index) => (
                    <div key={entity.uid || entity.id} className="p-6 hover:bg-slate-50 transition-colors">
                      {selectedEntityType === 'children' ? (
                        // Child row
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="bg-purple-100 p-2 rounded-full">
                              <Baby className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-slate-900">
                                {(entity as ChildData).firstName} {(entity as ChildData).lastName}
                              </h3>
                              <div className="text-sm text-slate-600 space-y-1">
                                <p>Age: {(entity as ChildData).age}</p>
                                {(entity as ChildData).school && <p>School: {(entity as ChildData).school}</p>}
                                {(entity as ChildData).parentEmail && <p>Parent: {(entity as ChildData).parentEmail}</p>}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteClick(entity, 'children')}
                            disabled={deleting === (entity as ChildData).id}
                          >
                            {deleting === (entity as ChildData).id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                            ) : (
                              <>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </>
                            )}
                          </Button>
                        </div>
                      ) : (
                        // Driver/Parent row
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-full ${
                              selectedEntityType === 'drivers' ? 'bg-blue-100' : 'bg-green-100'
                            }`}>
                              {selectedEntityType === 'drivers' ? (
                                <Car className={`h-5 w-5 ${selectedEntityType === 'drivers' ? 'text-blue-600' : 'text-green-600'}`} />
                              ) : (
                                <User className="h-5 w-5 text-green-600" />
                              )}
                            </div>
                            <div>
                              <h3 className="font-semibold text-slate-900">
                                {(entity as UserProfile).firstName} {(entity as UserProfile).lastName}
                              </h3>
                              <div className="text-sm text-slate-600 space-y-1">
                                <p>{(entity as UserProfile).email}</p>
                                <p>{(entity as UserProfile).phone}</p>
                                {(entity as UserProfile).city && <p>{(entity as UserProfile).city}</p>}
                                <div className="flex items-center gap-2">
                                  <Badge variant={
                                    (entity as UserProfile).status === 'approved' ? 'default' : 
                                    (entity as UserProfile).status === 'pending' ? 'secondary' : 'destructive'
                                  }>
                                    {(entity as UserProfile).status || 'Unknown'}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteClick(entity, selectedEntityType)}
                            disabled={deleting === (entity as UserProfile).uid}
                          >
                            {deleting === (entity as UserProfile).uid ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                            ) : (
                              <>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-lg bg-white">
          <DialogHeader className="border-b border-slate-200 pb-4">
            <DialogTitle className="text-xl font-semibold text-slate-900 flex items-center gap-3">
              <div className="bg-red-100 p-2 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              Confirm Deletion
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-6">
            {selectedEntity && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-red-100 p-2 rounded-full">
                    {selectedEntity.entityType === 'drivers' && <Car className="h-5 w-5 text-red-600" />}
                    {selectedEntity.entityType === 'parents' && <User className="h-5 w-5 text-red-600" />}
                    {selectedEntity.entityType === 'children' && <Baby className="h-5 w-5 text-red-600" />}
                  </div>
                  <div>
                    <p className="font-semibold text-red-900">
                      {selectedEntity.firstName} {selectedEntity.lastName}
                    </p>
                    <p className="text-sm text-red-700">
                      {selectedEntity.email || (selectedEntity.parentEmail && `Parent: ${selectedEntity.parentEmail}`)}
                    </p>
                  </div>
                </div>
                
                <div className="bg-red-100 border border-red-300 rounded-md p-3">
                  <p className="text-sm font-medium text-red-800 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Warning: This action cannot be undone!
                  </p>
                  {selectedEntity.entityType === 'parents' && (
                    <p className="text-sm text-red-700 mt-1">
                      Deleting this parent will also delete all their children.
                    </p>
                  )}
                </div>
              </div>
            )}
            
            <div className="space-y-3">
              <Label htmlFor="deletion-reason" className="text-sm font-semibold text-slate-900">
                Reason for Deletion <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="deletion-reason"
                placeholder="Please provide a reason for this deletion (for audit purposes)..."
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                className="min-h-[100px] resize-none border-slate-300 focus:border-red-500 focus:ring-red-500"
                maxLength={300}
              />
              <div className="flex justify-between items-center">
                <p className="text-xs text-slate-500">
                  This reason will be logged for audit purposes
                </p>
                <p className="text-xs text-slate-500">
                  {deleteReason.length}/300 characters
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-3 border-t border-slate-200 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
              disabled={!!deleting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteConfirm}
              disabled={!deleteReason.trim() || !!deleting}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Permanently
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
};

export default DatabaseManagement;