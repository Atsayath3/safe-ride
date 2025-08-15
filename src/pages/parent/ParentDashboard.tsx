import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import MobileLayout from '@/components/mobile/MobileLayout';
import ChildCard from '@/components/parent/ChildCard';
import ChildOptionsModal from '@/components/parent/ChildOptionsModal';
import DeleteChildConfirmation from '@/components/parent/DeleteChildConfirmation';
import DriverSelectionModal from '@/components/parent/DriverSelectionModal';
import BookingConfirmationModal from '@/components/parent/BookingConfirmationModal';
import { useAuth, UserProfile } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { LogOut, User } from 'lucide-react';

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
    fetchChildren();
  }, [currentUser]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showDriverSelection, setShowDriverSelection] = useState(false);
  const [showBookingConfirmation, setShowBookingConfirmation] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<UserProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleBookRide = () => {
    handleCloseModal();
    setShowDriverSelection(true);
  };

  const handleViewPastRides = () => {
    // TODO: Navigate to past rides screen
    console.log('View past rides for:', selectedChild?.fullName);
    handleCloseModal();
  };

  const handleEditChild = () => {
    if (selectedChild) {
      navigate(`/parent/edit-child/${selectedChild.id}`);
    }
    handleCloseModal();
  };

  const handleDeleteChild = () => {
    handleCloseModal();
    setShowDeleteConfirmation(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedChild) return;

    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'children', selectedChild.id));
      
      toast({
        title: "Success!",
        description: "Child has been deleted successfully.",
      });
      
      // Remove child from local state
      setChildren(prev => prev.filter(child => child.id !== selectedChild.id));
      setShowDeleteConfirmation(false);
      setSelectedChild(null);
    } catch (error: any) {
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
  };

  const handleDriverSelect = (driver: UserProfile) => {
    setSelectedDriver(driver);
    setShowDriverSelection(false);
    setShowBookingConfirmation(true);
  };

  const handleCloseDriverSelection = () => {
    setShowDriverSelection(false);
    setSelectedDriver(null);
  };

  const handleCloseBookingConfirmation = () => {
    setShowBookingConfirmation(false);
    setSelectedDriver(null);
  };

  const handleBookingComplete = () => {
    toast({
      title: "Booking Successful!",
      description: "Your ride has been booked successfully.",
    });
    // Refresh the bookings or navigate to bookings page
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
        <Button
          onClick={handleLogout}
          variant="outline"
          size="sm"
          className="rounded-xl font-medium px-3 py-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
        >
          <LogOut className="h-4 w-4 mr-1" />
          Logout
        </Button>
      }
    >
      <div className="p-4 space-y-6 pb-20 min-h-screen">
        {/* Header with Add Child Button - Always visible */}
        <div className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-lg border border-blue-100">
          <div>
            <h2 className="font-nunito font-semibold text-xl text-blue-900">Your Children</h2>
            <p className="text-blue-600 text-sm">
              {children.length > 0 ? `${children.length} child${children.length > 1 ? 'ren' : ''} registered` : 'No children added yet'}
            </p>
          </div>
          <Button
            onClick={handleAddChild}
            size="default"
            className="rounded-xl font-medium px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Child
          </Button>
        </div>
        {children.length > 0 ? (
          <div className="space-y-4">
            {children.map((child) => (
              <ChildCard
                key={child.id}
                child={child}
                onClick={() => handleChildCardClick(child)}
              />
            ))}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <Card className="w-full max-w-sm mx-auto shadow-xl border-2 border-dashed border-blue-200 bg-white">
              <CardContent className="flex flex-col items-center justify-center p-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                  <Plus className="h-8 w-8 text-blue-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-nunito font-semibold text-lg text-blue-900">
                    No child added yet
                  </h3>
                  <p className="text-blue-600 text-sm">
                    Add your child's details to start booking safe rides
                  </p>
                </div>
                <Button 
                  onClick={handleAddChild}
                  className="w-full font-medium rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
                  size="lg"
                >
                  Add Child
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Bottom Navigation Tabs */}
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-3">
          <div className="flex justify-around max-w-md mx-auto">
            <Button variant="ghost" className="flex-1 text-primary font-medium">
              Home
            </Button>
            <Button variant="ghost" className="flex-1 text-muted-foreground" disabled>
              Rides
            </Button>
            <Button variant="ghost" className="flex-1 text-muted-foreground" disabled>
              Profile
            </Button>
          </div>
        </div>
      </div>

      {/* Child Options Modal */}
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

      {/* Driver Selection Modal */}
      {selectedChild && (
        <DriverSelectionModal
          isOpen={showDriverSelection}
          onClose={handleCloseDriverSelection}
          child={selectedChild}
          onDriverSelect={handleDriverSelect}
        />
      )}

      {/* Booking Confirmation Modal */}
      {selectedChild && selectedDriver && (
        <BookingConfirmationModal
          isOpen={showBookingConfirmation}
          onClose={handleCloseBookingConfirmation}
          driver={selectedDriver}
          child={selectedChild}
          onBookingComplete={handleBookingComplete}
        />
      )}

      {/* Delete Child Confirmation Modal */}
      {selectedChild && (
        <DeleteChildConfirmation
          isOpen={showDeleteConfirmation}
          onClose={handleCloseDeleteConfirmation}
          onConfirm={handleConfirmDelete}
          child={selectedChild}
          isDeleting={isDeleting}
        />
      )}
    </MobileLayout>
  );
};

export default ParentDashboard;