import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MapPin, Users, Star, Phone, ChevronDown, ChevronUp } from 'lucide-react';
import { UserProfile } from '@/contexts/AuthContext';
import { Child } from '@/pages/parent/ParentDashboard';
import { BookingService } from '@/services/bookingService';
import { DriverAvailability } from '@/interfaces/booking';
import DriverFilter, { DriverFilterOptions } from './DriverFilter';

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
  const [allDrivers, setAllDrivers] = useState<UserProfile[]>([]);
  const [filteredDrivers, setFilteredDrivers] = useState<UserProfile[]>([]);
  const [driverAvailability, setDriverAvailability] = useState<Record<string, DriverAvailability>>({});
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<DriverFilterOptions>({
    gender: null,
    routeQuality: null,
    minAvailableSeats: null,
    vehicleType: null
  });

  useEffect(() => {
    if (isOpen) {
      loadAvailableDrivers();
    }
  }, [isOpen]);

  useEffect(() => {
    applyFilters();
  }, [allDrivers, filters, driverAvailability]);

  const applyFilters = () => {
    let filtered = [...allDrivers];

    // First, exclude drivers with Poor or Unknown routes
    filtered = filtered.filter(driver => {
      const compatibility = getRouteCompatibility(driver);
      return compatibility !== 'Poor' && compatibility !== 'Unknown';
    });

    // Gender filter
    if (filters.gender) {
      filtered = filtered.filter(driver => driver.gender === filters.gender);
    }

    // Route quality filter
    if (filters.routeQuality) {
      filtered = filtered.filter(driver => {
        const compatibility = getRouteCompatibility(driver);
        return compatibility.toLowerCase() === filters.routeQuality;
      });
    }

    // Available seats filter
    if (filters.minAvailableSeats) {
      filtered = filtered.filter(driver => {
        const availability = driverAvailability[driver.uid];
        return availability && availability.availableSeats >= (filters.minAvailableSeats || 0);
      });
    }

    // Vehicle type filter
    if (filters.vehicleType) {
      filtered = filtered.filter(driver => driver.vehicle?.type === filters.vehicleType);
    }

    setFilteredDrivers(filtered);
  };

  const clearFilters = () => {
    setFilters({
      gender: null,
      routeQuality: null,
      minAvailableSeats: null,
      vehicleType: null
    });
  };

  const loadAvailableDrivers = async () => {
    setLoading(true);
    try {
      const childLocation = {
        pickup: { lat: child.tripStartLocation.lat, lng: child.tripStartLocation.lng },
        school: { lat: child.schoolLocation.lat, lng: child.schoolLocation.lng }
      };
      
      const availableDrivers = await BookingService.getAvailableDrivers(childLocation);
      setAllDrivers(availableDrivers);

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
    // First check if driver has a manual route quality set
    if (driver.routes?.quality) {
      return driver.routes.quality.charAt(0).toUpperCase() + driver.routes.quality.slice(1);
    }

    // Fallback to distance-based calculation if no manual quality is set
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

        {/* Filter Toggle Button */}
        <div className="mb-4">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="w-full border-blue-300 text-blue-700 hover:bg-blue-50"
          >
            {showFilters ? <ChevronUp className="h-4 w-4 mr-2" /> : <ChevronDown className="h-4 w-4 mr-2" />}
            {showFilters ? 'Hide Filters' : 'Show Filters'}
            {Object.values(filters).some(v => v !== null) && (
              <Badge variant="secondary" className="ml-2">
                {Object.values(filters).filter(v => v !== null).length}
              </Badge>
            )}
          </Button>
        </div>

        {/* Filter Component */}
        {showFilters && (
          <div className="mb-4">
            <DriverFilter
              filters={filters}
              onFiltersChange={setFilters}
              onClearFilters={clearFilters}
            />
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading available drivers...</div>
          </div>
        ) : filteredDrivers.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <p className="text-muted-foreground">
                {allDrivers.length === 0 ? 'No drivers available' : 'No drivers match your filters'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {allDrivers.length === 0 ? 'Please try again later' : 'Try adjusting your filter criteria'}
              </p>
              {allDrivers.length > 0 && (
                <Button variant="outline" onClick={clearFilters} className="mt-2">
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Showing {filteredDrivers.length} of {allDrivers.length} drivers
            </div>
            {filteredDrivers.map((driver) => {
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
                            {driver.gender && (
                              <span className="ml-2 text-xs text-muted-foreground">
                                ({driver.gender})
                              </span>
                            )}
                          </h3>
                          <div className="flex gap-2">
                            <Badge variant={compatibility === 'Excellent' ? 'default' : 
                                           compatibility === 'Good' ? 'secondary' : 'outline'}>
                              {compatibility} Route
                            </Badge>
                            {driver.vehicle?.type && (
                              <Badge variant="outline" className="text-xs">
                                {driver.vehicle.type}
                              </Badge>
                            )}
                          </div>
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
                            <div className="space-y-1">
                              <div className="text-sm text-muted-foreground">
                                <strong>Vehicle:</strong> {driver.vehicle.color} {driver.vehicle.model} ({driver.vehicle.year})
                              </div>
                              <div className="text-sm text-muted-foreground">
                                <strong>Type:</strong> {driver.vehicle.type} | <strong>Capacity:</strong> {driver.vehicle.capacity}
                              </div>
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