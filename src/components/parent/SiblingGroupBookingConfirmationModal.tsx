import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MapPin, Users, Calendar, Clock, DollarSign } from 'lucide-react';
import { UserProfile, useAuth } from '@/contexts/AuthContext';
import { SiblingGroup } from '@/interfaces/personalization';
import { SiblingCoordinationService } from '@/services/siblingCoordinationService';
import { toast } from '@/hooks/use-toast';

interface SiblingGroupBookingConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  driver: UserProfile | null;
  siblingGroup: SiblingGroup;
  children: { id: string; name: string; school: string }[];
  onBookingComplete: () => void;
}

const SiblingGroupBookingConfirmationModal: React.FC<SiblingGroupBookingConfirmationModalProps> = ({
  isOpen,
  onClose,
  driver,
  siblingGroup,
  children,
  onBookingComplete
}) => {
  const { userProfile } = useAuth();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [rideTime, setRideTime] = useState(siblingGroup.preferredTime || '');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const getChildName = (childId: string) => {
    return children.find(child => child.id === childId)?.name || 'Unknown';
  };

  const groupChildren = children.filter(child => siblingGroup.childIds.includes(child.id));

  const handleConfirmBooking = async () => {
    if (!driver || !userProfile || !startDate || !endDate || !rideTime) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    // Validate that end date is not before start date
    if (new Date(endDate) < new Date(startDate)) {
      toast({
        title: "Invalid Date Range",
        description: "End date cannot be before start date",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      if (siblingGroup.allowMultipleDestinations && siblingGroup.childDestinations) {
        // Handle multiple schools
        const childrenWithSchools = groupChildren.map(child => {
          const schoolInfo = siblingGroup.childDestinations?.find(dest => dest.childId === child.id);
          return {
            childId: child.id,
            childName: child.name,
            schoolName: schoolInfo?.schoolName || child.school,
            schoolAddress: schoolInfo?.schoolAddress || `${child.school} Address`
          };
        });

        await SiblingCoordinationService.createMultiDestinationGroupRide(
          siblingGroup.id,
          userProfile.uid,
          new Date(startDate),
          siblingGroup.defaultPickupLocation,
          childrenWithSchools
        );
      } else {
        // Handle single destination - use regular booking flow with driver selection
        const estimatedCost = 1500;
        const costSplit = SiblingCoordinationService.calculateCostSplit(
          estimatedCost,
          groupChildren.map(child => ({ childId: child.id, childName: child.name })),
          siblingGroup.costSplitMethod === 'distance_based' ? 'equal' : siblingGroup.costSplitMethod
        );

        await SiblingCoordinationService.createGroupRideRequest({
          siblingGroupId: siblingGroup.id,
          parentId: userProfile.uid,
          scheduledDate: new Date(startDate),
          pickupLocation: siblingGroup.defaultPickupLocation,
          dropoffLocation: siblingGroup.defaultDropoffLocation,
          isMultiDestination: false,
          children: groupChildren.map(child => ({
            childId: child.id,
            childName: child.name
          })),
          costSplit,
          status: 'confirmed',
          preferredDriverId: driver.uid,
          assignedDriverId: driver.uid
        });
      }

      toast({
        title: "Success",
        description: siblingGroup.allowMultipleDestinations ? 
          "Multi-school sibling group ride booked successfully" : 
          "Sibling group ride booked successfully"
      });

      onBookingComplete();
      onClose();
    } catch (error) {
      console.error('Error booking sibling group ride:', error);
      toast({
        title: "Error",
        description: "Failed to book sibling group ride",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!driver) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
        <SheetHeader className="pb-6">
          <SheetTitle className="text-xl font-semibold">
            Confirm Sibling Group Ride Booking
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 px-6 pb-8">
          {/* Sibling Group Info */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Users className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-blue-900">{siblingGroup.name}</h3>
                  <p className="text-sm text-blue-600">{groupChildren.length} children</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1">
                  {siblingGroup.childIds.map(childId => (
                    <Badge key={childId} variant="secondary" className="bg-blue-100 text-blue-800">
                      {getChildName(childId)}
                    </Badge>
                  ))}
                </div>
                
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <MapPin className="w-4 h-4" />
                  <span>
                    {siblingGroup.defaultPickupLocation} → {' '}
                    {siblingGroup.allowMultipleDestinations ? 'Multiple Schools' : siblingGroup.defaultDropoffLocation}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <DollarSign className="w-4 h-4" />
                  <span>Cost split: {siblingGroup.costSplitMethod}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Driver Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="w-12 h-12">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials(driver.firstName, driver.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">
                    {driver.firstName} {driver.lastName}
                  </h3>
                  <p className="text-sm text-gray-600">{driver.phone}</p>
                </div>
              </div>
              
              {driver.vehicle && (
                <div className="text-sm text-gray-600">
                  <strong>Vehicle:</strong> {driver.vehicle.color} {driver.vehicle.model} ({driver.vehicle.year})
                </div>
              )}
            </CardContent>
          </Card>

          {/* Booking Details Form */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate" className="text-sm font-medium">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="endDate" className="text-sm font-medium">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || new Date().toISOString().split('T')[0]}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="rideTime" className="text-sm font-medium">Preferred Ride Time</Label>
                <Input
                  id="rideTime"
                  type="time"
                  value={rideTime}
                  onChange={(e) => setRideTime(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="notes" className="text-sm font-medium">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any special instructions or notes for the driver..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
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
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? "Booking..." : "Confirm Booking"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SiblingGroupBookingConfirmationModal;