import React, { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Child } from '@/pages/parent/ParentDashboard';
import { BookingCleanupService } from '@/services/bookingCleanupService';

interface DeleteChildConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  child: Child;
  isDeleting: boolean;
}

interface BookingPreview {
  totalBookings: number;
  activeBookings: number;
  affectedDrivers: string[];
  upcomingRides: any[];
}

const DeleteChildConfirmation: React.FC<DeleteChildConfirmationProps> = ({
  isOpen,
  onClose,
  onConfirm,
  child,
  isDeleting
}) => {
  const [bookingPreview, setBookingPreview] = useState<BookingPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    if (isOpen && child) {
      loadBookingPreview();
    }
  }, [isOpen, child]);

  const loadBookingPreview = async () => {
    if (!child) return;
    
    setLoadingPreview(true);
    try {
      const preview = await BookingCleanupService.getChildBookingsPreview(child.id);
      setBookingPreview(preview);
    } catch (error) {
      console.error('Error loading booking preview:', error);
      setBookingPreview(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  const renderBookingWarning = () => {
    if (loadingPreview) {
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
          <p className="text-blue-700 text-sm">Checking for active bookings...</p>
        </div>
      );
    }

    if (!bookingPreview) return null;

    if (bookingPreview.activeBookings > 0) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
          <p className="text-red-800 font-medium text-sm mb-2">⚠️ Warning: Active Bookings Found</p>
          <ul className="text-red-700 text-sm space-y-1">
            <li>• {bookingPreview.activeBookings} active booking{bookingPreview.activeBookings > 1 ? 's' : ''} will be cancelled</li>
            <li>• {bookingPreview.affectedDrivers.length} driver{bookingPreview.affectedDrivers.length > 1 ? 's' : ''} will be notified</li>
            {bookingPreview.upcomingRides.length > 0 && (
              <li>• {bookingPreview.upcomingRides.length} upcoming ride{bookingPreview.upcomingRides.length > 1 ? 's' : ''} will be lost</li>
            )}
          </ul>
        </div>
      );
    }

    if (bookingPreview.totalBookings > 0) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3">
          <p className="text-yellow-800 text-sm">
            📋 {bookingPreview.totalBookings} historical booking{bookingPreview.totalBookings > 1 ? 's' : ''} will be permanently deleted.
          </p>
        </div>
      );
    }

    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
        <p className="text-green-800 text-sm">✅ No active bookings found. Safe to delete.</p>
      </div>
    );
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Child Profile</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{child?.fullName}</strong>'s profile? 
            This action cannot be undone and will remove all associated data including ride history.
            
            {renderBookingWarning()}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteChildConfirmation;
