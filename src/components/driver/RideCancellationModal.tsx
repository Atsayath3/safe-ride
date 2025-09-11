import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, AlertTriangle, Users, Clock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { BookingService } from '@/services/bookingService';
import { NotificationService } from '@/services/notificationService';
import { useAuth } from '@/contexts/AuthContext';
import { Booking } from '@/interfaces/booking';

/**
 * RideCancellationModal - Allows drivers to cancel all rides for a specific day
 * 
 * Features:
 * - Select a future date to cancel rides
 * - Automatically fetches all confirmed bookings for that date
 * - Shows count of affected bookings and parents
 * - Allows optional reason for cancellation
 * - Cancels all bookings and notifies all affected parents
 * - Handles both single rides and period bookings
 */

interface RideCancellationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RideCancellationModal: React.FC<RideCancellationModalProps> = ({
  isOpen,
  onClose
}) => {
  const { userProfile } = useAuth();
  const [selectedDate, setSelectedDate] = useState('');
  const [reason, setReason] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [hasCheckedDate, setHasCheckedDate] = useState(false);

  const handleDateChange = async (date: string) => {
    setSelectedDate(date);
    setHasCheckedDate(false);
    
    if (!date || !userProfile?.uid) {
      console.log('❌ Missing date or user profile:', { date, uid: userProfile?.uid });
      return;
    }
    
    setChecking(true);
    try {
      console.log('📅 Checking bookings for date:', date, 'Driver:', userProfile.uid);
      const targetDate = new Date(date);
      console.log('📅 Target date object:', targetDate);
      
      const bookingsForDate = await BookingService.getDriverBookingsForDate(userProfile.uid, targetDate);
      console.log('📅 Bookings found:', bookingsForDate);
      
      setBookings(bookingsForDate);
      setHasCheckedDate(true);
    } catch (error) {
      console.error('❌ Error fetching bookings for date:', error);
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      
      // More specific error message
      let errorMessage = "Failed to load bookings for the selected date.";
      if (error.code === 'permission-denied') {
        errorMessage = "Permission denied. Please check your account status.";
      } else if (error.code === 'failed-precondition') {
        errorMessage = "Database configuration issue. Please contact support.";
      } else if (error.message?.includes('index')) {
        errorMessage = "Database index error. Please try again later.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setChecking(false);
    }
  };

  const handleCancelRides = async () => {
    if (!selectedDate || !userProfile?.uid || bookings.length === 0) return;
    
    setLoading(true);
    try {
      const targetDate = new Date(selectedDate);
      
      // Get unique parent IDs from bookings
      const parentIds = [...new Set(bookings.map(booking => booking.parentId))];
      
      console.log('📅 Cancelling rides for:', {
        date: targetDate,
        bookingsCount: bookings.length,
        parentIds: parentIds.length
      });
      
      // Cancel each booking for the specific date
      const updatePromises = bookings.map(booking => 
        BookingService.cancelBookingForDate(booking.id, targetDate)
      );
      
      await Promise.all(updatePromises);
      
      // Send notifications to all affected parents
      const driverName = `${userProfile.firstName} ${userProfile.lastName}`;
      await NotificationService.sendRideCancellationNotification(
        parentIds,
        userProfile.uid,
        driverName,
        targetDate,
        reason.trim() || undefined
      );
      
      toast({
        title: "Rides Cancelled",
        description: `Successfully cancelled ${bookings.length} ride(s) and notified ${parentIds.length} parent(s).`,
      });
      
      // Reset form
      setSelectedDate('');
      setReason('');
      setBookings([]);
      setHasCheckedDate(false);
      onClose();
      
    } catch (error) {
      console.error('Error cancelling rides:', error);
      toast({
        title: "Error",
        description: "Failed to cancel rides. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-5 h-5" />
            Cancel Rides for a Day
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">Important Notice:</p>
                <p>This will cancel ALL confirmed rides for the selected date and notify all affected parents immediately.</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date" className="text-gray-800 font-medium">Select Date</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                min={getTomorrowDate()}
                className="pl-10"
                disabled={loading}
              />
            </div>
          </div>

          {checking && (
            <div className="flex items-center gap-2 text-blue-600 text-sm">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              Checking bookings for selected date...
            </div>
          )}

          {hasCheckedDate && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-gray-600" />
                <span className="font-medium text-gray-800">
                  Bookings for {selectedDate && formatDate(new Date(selectedDate))}
                </span>
              </div>
              
              {bookings.length === 0 ? (
                <p className="text-gray-600 text-sm">No confirmed bookings found for this date.</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">{bookings.length}</span> ride(s) will be cancelled
                  </p>
                  <div className="text-xs text-gray-600">
                    <div>• {[...new Set(bookings.map(b => b.parentId))].length} parent(s) will be notified</div>
                    <div>• All affected bookings will be marked as cancelled</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {hasCheckedDate && bookings.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-gray-800 font-medium">
                Reason for Cancellation <span className="text-gray-500">(Optional)</span>
              </Label>
              <Textarea
                id="reason"
                placeholder="e.g., Vehicle breakdown, personal emergency, etc."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                disabled={loading}
                className="resize-none"
              />
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            
            {hasCheckedDate && bookings.length > 0 && (
              <Button
                onClick={handleCancelRides}
                disabled={loading || !selectedDate}
                className="flex-1 bg-red-700 hover:bg-red-800 text-white"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Cancelling...
                  </div>
                ) : (
                  `Cancel ${bookings.length} Ride(s)`
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RideCancellationModal;
