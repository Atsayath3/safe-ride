import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MapPin, Users, Star, Phone } from 'lucide-react';
import { UserProfile } from '@/contexts/AuthContext';
import { Child } from '@/pages/parent/ParentDashboard';
import { BookingService } from '@/services/bookingService';
import { DriverAvailability } from '@/interfaces/booking';

interface DriverSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  child: Child;
  onDriverSelect: (driver: UserProfile) => void;
}

const DriverSelectionModal: React.FC<DriverSelectionModalProps> = ({
  isOpen,
  onClose,
  child,
  onDriverSelect
}) => {
  const [drivers, setDrivers] = useState<UserProfile[]>([]);
  const [driverAvailability, setDriverAvailability] = useState<Record<string, DriverAvailability>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadAvailableDrivers();
    }
  }, [isOpen]);

  const loadAvailableDrivers = async () => {
    setLoading(true);
    try {
      const childLocation = {
        pickup: { lat: child.tripStartLocation.lat, lng: child.tripStartLocation.lng },
        school: { lat: child.schoolLocation.lat, lng: child.schoolLocation.lng }
      };
      
      const availableDrivers = await BookingService.getAvailableDrivers(childLocation);
      setDrivers(availableDrivers);

      // Load availability for each driver
      const availabilityData: Record<string, DriverAvailability> = {};
      for (const driver of availableDrivers) {
        const availability = await BookingService.getDriverAvailability(driver.uid);
        availabilityData[driver.uid] = availability;
      }
      setDriverAvailability(availabilityData);
    } catch (error) {
      console.error('Error loading drivers:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const calculateDistance = (start: { lat: number; lng: number }, end: { lat: number; lng: number }) => {
    // Simple distance calculation (you might want to use Google Maps Distance Matrix API)
    const R = 6371; // Earth's radius in kilometers
    const dLat = (end.lat - start.lat) * Math.PI / 180;
    const dLon = (end.lng - start.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(start.lat * Math.PI / 180) * Math.cos(end.lat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const getRouteCompatibility = (driver: UserProfile) => {
    if (!driver.routes?.startPoint || !driver.routes?.endPoint) return 'Unknown';
    
    const pickupDistance = calculateDistance(child.tripStartLocation, driver.routes.startPoint);
    const schoolDistance = calculateDistance(child.schoolLocation, driver.routes.endPoint);
    
    const totalDistance = pickupDistance + schoolDistance;
    
    if (totalDistance < 2) return 'Excellent';
    if (totalDistance < 5) return 'Good';
    if (totalDistance < 10) return 'Fair';
    return 'Poor';
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-lg font-semibold">
            Select Driver for {child.fullName}
          </SheetTitle>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading available drivers...</div>
          </div>
        ) : drivers.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <p className="text-muted-foreground">No drivers available</p>
              <p className="text-sm text-muted-foreground mt-1">
                Please try again later
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {drivers.map((driver) => {
              const availability = driverAvailability[driver.uid];
              const compatibility = getRouteCompatibility(driver);
              
              return (
                <Card key={driver.uid} className="border border-border hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {getInitials(driver.firstName, driver.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-foreground">
                            {driver.firstName} {driver.lastName}
                          </h3>
                          <Badge variant={compatibility === 'Excellent' ? 'default' : 
                                         compatibility === 'Good' ? 'secondary' : 'outline'}>
                            {compatibility} Route
                          </Badge>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="w-4 h-4" />
                            {driver.phone}
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="w-4 h-4" />
                            {availability?.availableSeats || 0} of {availability?.totalSeats || 0} seats available
                          </div>
                          
                          {driver.vehicle && (
                            <div className="text-sm text-muted-foreground">
                              {driver.vehicle.color} {driver.vehicle.model} ({driver.vehicle.year})
                            </div>
                          )}
                          
                          {driver.routes?.startPoint && driver.routes?.endPoint && (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin className="w-4 h-4" />
                                From: {driver.routes.startPoint.address}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin className="w-4 h-4" />
                                To: {driver.routes.endPoint.address}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 pt-2">
                          <Button 
                            onClick={() => onDriverSelect(driver)}
                            className="flex-1"
                            disabled={!availability || availability.availableSeats === 0}
                          >
                            {availability && availability.availableSeats > 0 ? 'Select Driver' : 'No Seats Available'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default DriverSelectionModal;