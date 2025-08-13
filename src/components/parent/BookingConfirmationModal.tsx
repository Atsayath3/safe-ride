import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MapPin, Users, Calendar, Clock } from 'lucide-react';
import { UserProfile, useAuth } from '@/contexts/AuthContext';
import { Child } from '@/pages/parent/ParentDashboard';
import { BookingService } from '@/services/bookingService';
import { toast } from '@/hooks/use-toast';

interface BookingConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  driver: UserProfile | null;
  child: Child;
  onBookingComplete: () => void;
}

const BookingConfirmationModal: React.FC<BookingConfirmationModalProps> = ({
  isOpen,
  onClose,
  driver,
  child,
  onBookingComplete
}) => {
  const { userProfile } = useAuth();
  const [rideDate, setRideDate] = useState('');
  const [rideTime, setRideTime] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirmBooking = async () => {
    if (!driver || !userProfile || !rideDate || !rideTime) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const rideDatetime = new Date(`${rideDate}T${rideTime}`);
      
      const bookingRequest = {
        parentId: userProfile.uid,
        driverId: driver.uid,
        childId: child.id,
        pickupLocation: child.tripStartLocation,
        dropoffLocation: child.schoolLocation,
        rideDate: rideDatetime,
        notes: notes.trim() || undefined
      };

      await BookingService.createBooking(bookingRequest);
      
      toast({
        title: "Booking Confirmed!",
        description: "Your ride has been booked. The driver will contact you soon.",
      });
      
      onBookingComplete();
      onClose();
    } catch (error) {
      console.error('Error creating booking:', error);
      toast({
        title: "Booking Failed",
        description: "Failed to create booking. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  if (!driver) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-lg font-semibold">
            Confirm Booking
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6">
          {/* Driver Info */}
          <Card className="border border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-12 h-12">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials(driver.firstName, driver.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-foreground">
                    {driver.firstName} {driver.lastName}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {driver.phone}
                  </p>
                  {driver.vehicle && (
                    <p className="text-sm text-muted-foreground">
                      {driver.vehicle.color} {driver.vehicle.model}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Child Info */}
          <Card className="border border-border">
            <CardContent className="p-4">
              <h4 className="font-medium text-foreground mb-2">Trip Details</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Child:</span> {child.fullName}
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <span className="font-medium">Pickup:</span><br />
                    {child.tripStartLocation.address}
                  </div>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <span className="font-medium">Drop-off:</span><br />
                    {child.schoolLocation.address}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Booking Details */}
          <Card className="border border-border">
            <CardContent className="p-4 space-y-4">
              <h4 className="font-medium text-foreground">Booking Details</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rideDate">Date</Label>
                  <Input
                    id="rideDate"
                    type="date"
                    value={rideDate}
                    onChange={(e) => setRideDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rideTime">Time</Label>
                  <Input
                    id="rideTime"
                    type="time"
                    value={rideTime}
                    onChange={(e) => setRideTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Special Instructions (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any special instructions for the driver..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmBooking}
              className="flex-1"
              disabled={loading || !rideDate || !rideTime}
            >
              {loading ? 'Booking...' : 'Confirm Booking'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default BookingConfirmationModal;