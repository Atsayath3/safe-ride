import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { collection, query, getDocs, deleteDoc, doc, where, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from '@/hooks/use-toast';
import { UserProfile } from '@/contexts/AuthContext';
import { 
  Database, 
  Users, 
  UserX, 
  Search, 
  Filter, 
  Trash2, 
  AlertTriangle, 
  ArrowLeft,
  Download,
  RefreshCw 
} from 'lucide-react';

interface UserData extends UserProfile {
  id: string;
}

const DatabaseManagement = () => {
  const { userProfile, currentUser } = useAuth();
  const navigate = useNavigate();
  
  // State management
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  // Redirect if not authenticated or not admin
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
      fetchUsers();
    }
  }, [currentUser, userProfile, navigate]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersQuery = query(collection(db, 'users'));
      const querySnapshot = await getDocs(usersQuery);
      
      const usersData: UserData[] = [];
      querySnapshot.forEach((doc) => {
        usersData.push({
          id: doc.id,
          ...doc.data()
        } as UserData);
      });

      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = (user: UserData) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
    setDeleteReason('');
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser || !deleteReason.trim()) return;
    
    try {
      setDeleting(selectedUser.id);
      
      // Delete user document
      await deleteDoc(doc(db, 'users', selectedUser.id));
      
      // Remove from local state
      setUsers(prev => prev.filter(user => user.id !== selectedUser.id));
      
      toast({
        title: "User Deleted",
        description: `User ${selectedUser.firstName ? `${selectedUser.firstName} ${selectedUser.lastName}` : selectedUser.email} has been removed`,
        variant: "default"
      });
      
      setDeleteDialogOpen(false);
      setSelectedUser(null);
      setDeleteReason('');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive"
      });
    } finally {
      setDeleting(null);
    }
  };

  const getFilteredData = () => {
    return users.filter(user => {
      const matchesSearch = !searchTerm || 
        user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.includes(searchTerm);

      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  };

  // Show loading or redirect if not admin
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!userProfile || userProfile.role !== 'admin') {
    return null;
  }

  const filteredData = getFilteredData();

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-md">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                <Database className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Database Management</h1>
                <p className="text-slate-600 text-sm font-medium">
                  SafeRide User Administration
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                onClick={() => navigate('/admin/dashboard')}
                className="border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 space-y-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-white border border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">Total Users</p>
                  <p className="text-2xl font-bold text-slate-900">{users.length}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">Parents</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {users.filter(u => u.role === 'parent').length}
                  </p>
                </div>
                <Users className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">Drivers</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {users.filter(u => u.role === 'driver').length}
                  </p>
                </div>
                <Users className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">Admins</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {users.filter(u => u.role === 'admin').length}
                  </p>
                </div>
                <Users className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="bg-white border border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-200 bg-slate-50/50">
            <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Search className="h-5 w-5 text-slate-600" />
              Search & Filter Users
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-slate-300 focus:border-red-500 focus:ring-red-500"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full md:w-48 border-slate-300">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="parent">Parents</SelectItem>
                  <SelectItem value="driver">Drivers</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48 border-slate-300">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                onClick={fetchUsers}
                className="border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="bg-white border border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-200 bg-slate-50/50">
            <CardTitle className="text-lg font-semibold text-slate-900 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Database className="h-5 w-5 text-slate-600" />
                User Database ({filteredData.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {filteredData.length === 0 ? (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-slate-400" />
                <h3 className="mt-2 text-sm font-medium text-slate-900">No users found</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {searchTerm || roleFilter !== 'all' || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filters' 
                    : 'No users in the database'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-full divide-y divide-slate-200">
                  {/* Table Header */}
                  <div className="bg-slate-50 px-6 py-3">
                    <div className="grid grid-cols-6 gap-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
                      <div>User</div>
                      <div>Contact</div>
                      <div>Role</div>
                      <div>Status</div>
                      <div>Joined</div>
                      <div>Actions</div>
                    </div>
                  </div>
                  
                  {/* Table Rows */}
                  <div className="bg-white divide-y divide-slate-200">
                    {filteredData.map((user) => (
                      <div key={user.id} className="px-6 py-4 hover:bg-slate-50">
                        <div className="grid grid-cols-6 gap-4 items-center">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                              {user.firstName?.charAt(0) || user.lastName?.charAt(0) || user.email?.charAt(0) || '?'}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-slate-900">
                                {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName || user.lastName || 'No name'}
                              </div>
                              <div className="text-xs text-slate-500">
                                ID: {user.id.substring(0, 8)}...
                              </div>
                            </div>
                          </div>

                          <div className="text-sm text-slate-900">
                            <div>{user.email}</div>
                            {user.phone && (
                              <div className="text-xs text-slate-500">{user.phone}</div>
                            )}
                          </div>

                          <div>
                            <Badge 
                              variant={user.role === 'admin' ? 'destructive' : 
                                     user.role === 'driver' ? 'default' : 'secondary'}
                              className="text-xs font-medium"
                            >
                              {user.role}
                            </Badge>
                          </div>

                          <div>
                            <Badge 
                              variant={user.status === 'approved' ? 'default' : 
                                     user.status === 'pending' ? 'secondary' : 'destructive'}
                              className="text-xs font-medium"
                            >
                              {user.status || 'unknown'}
                            </Badge>
                          </div>

                          <div className="text-sm text-slate-500">
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                          </div>

                          <div className="flex items-center space-x-2">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteUser(user)}
                              disabled={!!deleting}
                              className="bg-red-600 hover:bg-red-700 text-white"
                            >
                              {deleting === user.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
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
          
          <div className="space-y-4 py-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">
                <strong>Warning:</strong> This action cannot be undone. The user and all their data will be permanently removed.
              </p>
            </div>
            
            {selectedUser && (
              <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                <h4 className="font-medium text-slate-900">User to be deleted:</h4>
                <p className="text-sm text-slate-600">
                  <strong>Name:</strong> {selectedUser.firstName && selectedUser.lastName ? `${selectedUser.firstName} ${selectedUser.lastName}` : selectedUser.firstName || selectedUser.lastName || 'No name'}
                </p>
                <p className="text-sm text-slate-600">
                  <strong>Email:</strong> {selectedUser.email}
                </p>
                <p className="text-sm text-slate-600">
                  <strong>Role:</strong> {selectedUser.role}
                </p>
              </div>
            )}
            
            <div>
              <Label htmlFor="deleteReason" className="text-sm font-medium text-slate-900">
                Reason for deletion (required)
              </Label>
              <Textarea
                id="deleteReason"
                placeholder="Please provide a reason for deleting this user..."
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                className="mt-2 border-slate-300 focus:border-red-500 focus:ring-red-500"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter className="flex gap-3 pt-4 border-t border-slate-200">
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
    </>
  );
};

export default DatabaseManagement;