import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useNavigate } from 'react-router-dom';
import { Plus, Home, Car, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MobileLayout from '@/components/mobile/MobileLayout';
import ChildCard from '@/components/parent/ChildCard';
import EnhancedChildCard from '@/components/parent/EnhancedChildCard';
import { BookingManagementService } from '@/services/bookingManagementService';
import ChildOptionsModal from '@/components/parent/ChildOptionsModal';
import DeleteChildConfirmation from '@/components/parent/DeleteChildConfirmation';
import DriverSelectionModal from '@/components/parent/DriverSelectionModal';
import BookingConfirmationModal from '@/components/parent/BookingConfirmationModal';
import ActiveRideMonitor from '@/components/parent/ActiveRideMonitor';
import NotificationBell from '@/components/NotificationBell';
import { useAuth, UserProfile } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { LogOut } from 'lucide-react';
import { RideService } from '@/services/rideService';
import { ActiveRide } from '@/interfaces/ride';

export interface Child {
  id: string;
  fullName: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  schoolName: string;
  schoolLocation: { lat: number; lng: number; address: string };
  tripStartLocation: { lat: number; lng: number; address: string };
  studentId: string;
  avatar?: string;
}

const ParentDashboard = () => {
  const navigate = useNavigate();
  const { userProfile, currentUser, logout } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [activeRides, setActiveRides] = useState<ActiveRide[]>([]);
  const [currentTab, setCurrentTab] = useState('home');
  
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showDriverSelection, setShowDriverSelection] = useState(false);
  const [showBookingConfirmation, setShowBookingConfirmation] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<UserProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchChildren = async () => {
      if (!currentUser) return;
      const q = query(collection(db, 'children'), where('parentId', '==', currentUser.uid));
      const querySnapshot = await getDocs(q);
      const childrenList: Child[] = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          fullName: data.fullName,
          dateOfBirth: data.dateOfBirth?.toDate ? data.dateOfBirth.toDate() : data.dateOfBirth,
          gender: data.gender,
          schoolName: data.schoolName,
          schoolLocation: data.schoolLocation,
          tripStartLocation: data.pickupLocation || data.tripStartLocation,
          studentId: data.studentId,
          avatar: data.avatar || undefined,
        };
      });
      setChildren(childrenList);
    };

    const fetchActiveRides = async () => {
      if (!currentUser) return;
      try {
        const rides = await RideService.getActiveRidesForParent(currentUser.uid);
        setActiveRides(rides);
      } catch (error) {
        console.error('Error fetching active rides:', error);
      }
    };

    fetchChildren();
    fetchActiveRides();
    
    // Refresh active rides every 30 seconds
    const interval = setInterval(fetchActiveRides, 30000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const handleAddChild = () => {
    navigate('/parent/add-child');
  };

  const handleChildCardClick = (child: Child) => {
    setSelectedChild(child);
    setShowOptionsModal(true);
  };

  const handleCloseModal = () => {
    setShowOptionsModal(false);
    setSelectedChild(null);
  };

  const handleBookRide = async () => {
    if (!selectedChild) return;
    
    // Check if child already has an active booking
    const hasActiveBooking = await BookingManagementService.hasActiveBooking(selectedChild.id);
    
    if (hasActiveBooking) {
      toast({
        title: "Active Booking Found",
        description: `${selectedChild.fullName} already has an active booking. You can extend it instead of creating a new one.`,
        variant: "destructive",
      });
      setShowOptionsModal(false);
      return;
    }
    
    setShowDriverSelection(true);
    setShowOptionsModal(false);
  };

  const handleBookNewRide = async (child: Child) => {
    // Check if child already has an active booking
    const hasActiveBooking = await BookingManagementService.hasActiveBooking(child.id);
    
    if (hasActiveBooking) {
      toast({
        title: "Active Booking Found",
        description: `${child.fullName} already has an active booking. You can extend it instead of creating a new one.`,
        variant: "destructive",
      });
      return;
    }
    
    setSelectedChild(child);
    setShowDriverSelection(true);
  };

  const handleViewPastRides = () => {
    if (!selectedChild) return;
    console.log('View past rides for:', selectedChild.fullName);
    // Navigate to past rides view
  };

  const handleEditChild = () => {
    if (!selectedChild) return;
    navigate(`/parent/edit-child/${selectedChild.id}`);
  };

  const handleDeleteChild = () => {
    if (!selectedChild) return;
    setShowDeleteConfirmation(true);
    setShowOptionsModal(false);
  };

  const handleCloseDriverSelection = () => {
    setShowDriverSelection(false);
    setSelectedChild(null);
  };

  const handleDriverSelect = (driver: UserProfile) => {
    setSelectedDriver(driver);
    setShowDriverSelection(false);
    setShowBookingConfirmation(true);
  };

  const handleCloseBookingConfirmation = () => {
    setShowBookingConfirmation(false);
    setSelectedDriver(null);
    setSelectedChild(null);
  };

  const handleConfirmDelete = async () => {
    if (!selectedChild) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'children', selectedChild.id));
      setChildren(prev => prev.filter(child => child.id !== selectedChild.id));
      toast({
        title: "Child Deleted",
        description: `${selectedChild.fullName} has been removed from your account.`,
      });
      setShowDeleteConfirmation(false);
      setSelectedChild(null);
    } catch (error) {
      console.error('Error deleting child:', error);
      toast({
        title: "Error",
        description: "Failed to delete child. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCloseDeleteConfirmation = () => {
    setShowDeleteConfirmation(false);
    setSelectedChild(null);
  };

  const handleBookingComplete = () => {
    setShowBookingConfirmation(false);
    setSelectedChild(null);
    setSelectedDriver(null);
    toast({
      title: "Booking Successful!",
      description: "Your ride has been confirmed with the driver. No further approval needed.",
    });
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      navigate('/parent/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Error",
        description: "Failed to logout. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <MobileLayout
      title={`Welcome, ${userProfile?.firstName || 'Parent'}!`}
      theme="parent"
      rightContent={
        <div className="flex items-center gap-2">
          <NotificationBell />
          <Button
            onClick={handleLogout}
            variant="outline"
            size="sm"
            className="rounded-xl font-medium px-3 py-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
          >
            <LogOut className="h-4 w-4 mr-1" />
            Logout
          </Button>
        </div>
      }
    >
      <div className="flex flex-col h-screen">
        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="h-full flex flex-col">
            {/* Tab Content */}
            <div className="flex-1 overflow-auto">
              <TabsContent value="home" className="h-full m-0 p-4 space-y-6">
                {/* Header with Add Child Button */}
                <div className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-lg border border-blue-100">
                  <div>
                    <h2 className="font-nunito font-semibold text-xl text-blue-900">Your Children</h2>
                    <p className="text-blue-600 text-sm">
                      {children.length > 0 ? `${children.length} child${children.length > 1 ? 'ren' : ''} registered` : 'No children added yet'}
                    </p>
                  </div>
                  <Button 
                    onClick={handleAddChild}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-medium px-4 py-2 shadow-lg"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Child
                  </Button>
                </div>

                {/* Children Cards */}
                {children.length > 0 ? (
                  <div className="grid gap-4">
                    {children.map((child) => (
                      <EnhancedChildCard 
                        key={child.id} 
                        child={child} 
                        onBookNewRide={() => handleBookNewRide(child)}
                        onRefresh={() => {
                          // Refresh function for real-time updates
                          const fetchChildren = async () => {
                            if (!currentUser) return;
                            const q = query(collection(db, 'children'), where('parentId', '==', currentUser.uid));
                            const querySnapshot = await getDocs(q);
                            const childrenList: Child[] = querySnapshot.docs.map(docSnap => {
                              const data = docSnap.data();
                              return {
                                id: docSnap.id,
                                fullName: data.fullName,
                                dateOfBirth: data.dateOfBirth?.toDate ? data.dateOfBirth.toDate() : data.dateOfBirth,
                                gender: data.gender,
                                schoolName: data.schoolName,
                                schoolLocation: data.schoolLocation,
                                tripStartLocation: data.pickupLocation || data.tripStartLocation,
                                studentId: data.studentId,
                                avatar: data.avatar || undefined,
                              };
                            });
                            setChildren(childrenList);
                          };
                          fetchChildren();
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <Card className="border-2 border-dashed border-blue-200 bg-blue-50">
                    <CardContent className="p-8 text-center">
                      <div className="text-blue-400 mb-4">
                        <User className="h-12 w-12 mx-auto" />
                      </div>
                      <h3 className="font-semibold text-blue-900 mb-2">No Children Added</h3>
                      <p className="text-blue-600 mb-4">Start by adding your first child to begin booking rides.</p>
                      <Button 
                        onClick={handleAddChild}
                        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Child
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="rides" className="h-full m-0 p-4 space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="font-nunito font-semibold text-xl text-blue-900">Active Rides</h2>
                    <p className="text-blue-600 text-sm">
                      {activeRides.length > 0 ? `${activeRides.length} active ride${activeRides.length > 1 ? 's' : ''}` : 'No active rides'}
                    </p>
                  </div>
                </div>

                {/* Active Rides */}
                {activeRides.length > 0 ? (
                  <div className="grid gap-4">
                    {activeRides.map((ride) => (
                      <ActiveRideMonitor
                        key={ride.id}
                        ride={ride}
                        onRideUpdate={(updatedRide) => {
                          setActiveRides(prev => 
                            prev.map(r => r.id === updatedRide.id ? updatedRide : r)
                          );
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <Card className="border-2 border-dashed border-blue-200 bg-blue-50">
                    <CardContent className="p-8 text-center">
                      <div className="text-blue-400 mb-4">
                        <Car className="h-12 w-12 mx-auto" />
                      </div>
                      <h3 className="font-semibold text-blue-900 mb-2">No Active Rides</h3>
                      <p className="text-blue-600 mb-4">
                        When your children have active rides, they will appear here with tracking options.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="profile" className="h-full m-0 p-4 space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="font-nunito font-semibold text-xl text-blue-900">Profile</h2>
                    <p className="text-blue-600 text-sm">Manage your account settings</p>
                  </div>
                </div>

                {/* Profile Content */}
                <Card className="bg-white rounded-2xl shadow-lg border border-blue-100">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4 mb-6">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-8 w-8 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-blue-900 text-lg">
                          {userProfile?.firstName} {userProfile?.lastName}
                        </h3>
                        <p className="text-blue-600">{userProfile?.email}</p>
                        <p className="text-blue-600">{userProfile?.phone}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-3 border-b border-blue-100">
                        <span className="text-blue-900">Children Registered</span>
                        <span className="text-blue-600 font-medium">{children.length}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-blue-100">
                        <span className="text-blue-900">Active Rides</span>
                        <span className="text-blue-600 font-medium">{activeRides.length}</span>
                      </div>
                    </div>
                    
                    <Button
                      onClick={handleLogout}
                      variant="outline"
                      className="w-full mt-6 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>

            {/* Bottom Navigation Tabs */}
            <TabsList className="grid w-full grid-cols-3 bg-white border-t border-border p-2 rounded-none h-16">
              <TabsTrigger 
                value="home" 
                className="flex flex-col items-center gap-1 py-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600"
              >
                <Home className="h-5 w-5" />
                <span className="text-xs">Home</span>
              </TabsTrigger>
              <TabsTrigger 
                value="rides" 
                className="flex flex-col items-center gap-1 py-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 relative"
              >
                <Car className="h-5 w-5" />
                <span className="text-xs">Rides</span>
                {activeRides.length > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {activeRides.length}
                  </div>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="profile" 
                className="flex flex-col items-center gap-1 py-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600"
              >
                <User className="h-5 w-5" />
                <span className="text-xs">Profile</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Modals */}
      {selectedChild && (
        <ChildOptionsModal
          isOpen={showOptionsModal}
          onClose={handleCloseModal}
          child={selectedChild}
          onBookRide={handleBookRide}
          onViewPastRides={handleViewPastRides}
          onEditChild={handleEditChild}
          onDeleteChild={handleDeleteChild}
        />
      )}

      {selectedChild && (
        <DriverSelectionModal
          isOpen={showDriverSelection}
          onClose={handleCloseDriverSelection}
          child={selectedChild}
          onDriverSelect={handleDriverSelect}
        />
      )}

      {selectedChild && selectedDriver && (
        <BookingConfirmationModal
          isOpen={showBookingConfirmation}
          onClose={handleCloseBookingConfirmation}
          child={selectedChild}
          driver={selectedDriver}
          onBookingComplete={handleBookingComplete}
        />
      )}

      {selectedChild && (
        <DeleteChildConfirmation
          isOpen={showDeleteConfirmation}
          onClose={handleCloseDeleteConfirmation}
          child={selectedChild}
          onConfirm={handleConfirmDelete}
          isDeleting={isDeleting}
        />
      )}
    </MobileLayout>
  );
};

export default ParentDashboard;