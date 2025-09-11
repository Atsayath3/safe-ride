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
import RouteQualityWarningModal from './RouteQualityWarningModal';

interface DriverSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  child: Child;
  onDriverSelect: (driver: UserProfile) => void;
}

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
  
  // Route quality warning modal state
  const [showRouteWarning, setShowRouteWarning] = useState(false);
  const [selectedDriverForWarning, setSelectedDriverForWarning] = useState<UserProfile | null>(null);

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
    console.log('🔍 Applying filters to', allDrivers.length, 'drivers');

    // Filter out drivers with Poor or Unknown routes
    filtered = filtered.filter(driver => {
      const compatibility = getRouteCompatibility(driver);
      console.log(`🗺️ ${driver.firstName} route compatibility: ${compatibility}`);
      return compatibility !== 'Poor' && compatibility !== 'Unknown';
    });
    console.log('📍 After route filter:', filtered.length, 'drivers remaining');

    // Gender filter
    if (filters.gender) {
      filtered = filtered.filter(driver => driver.gender === filters.gender);
      console.log('👤 After gender filter:', filtered.length, 'drivers remaining');
    }

    // Route quality filter
    if (filters.routeQuality) {
      filtered = filtered.filter(driver => {
        const compatibility = getRouteCompatibility(driver);
        return compatibility.toLowerCase() === filters.routeQuality;
      });
      console.log('🛣️ After route quality filter:', filtered.length, 'drivers remaining');
    }

    // Available seats filter
    if (filters.minAvailableSeats) {
      filtered = filtered.filter(driver => {
        const availability = driverAvailability[driver.uid];
        return availability && availability.availableSeats >= (filters.minAvailableSeats || 0);
      });
      console.log('🪑 After seats filter:', filtered.length, 'drivers remaining');
    }

    // Vehicle type filter
    if (filters.vehicleType) {
      filtered = filtered.filter(driver => driver.vehicle?.type === filters.vehicleType);
      console.log('🚗 After vehicle type filter:', filtered.length, 'drivers remaining');
    }

    console.log('✅ Final filtered drivers:', filtered.length);
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
      console.log('🔍 Loading drivers for child:', child.fullName);
      const childLocation = {
        pickup: { lat: child.tripStartLocation.lat, lng: child.tripStartLocation.lng },
        school: { lat: child.schoolLocation.lat, lng: child.schoolLocation.lng }
      };
      console.log('📍 Child locations:', childLocation);
      
      const availableDrivers = await BookingService.getAvailableDrivers(childLocation);
      console.log('✅ Available drivers from service:', availableDrivers.length);
      setAllDrivers(availableDrivers);

      // Load availability for each driver
      const availabilityData: Record<string, DriverAvailability> = {};
      for (const driver of availableDrivers) {
        console.log(`🪑 Loading availability for ${driver.firstName}...`);
        const availability = await BookingService.getDriverAvailability(driver.uid);
        console.log(`🪑 ${driver.firstName} availability:`, availability);
        availabilityData[driver.uid] = availability;
      }
      setDriverAvailability(availabilityData);
    } catch (error) {
      console.error('❌ Error loading drivers:', error);
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
    // Calculate route quality based on distance between routes
    if (!driver.routes?.startPoint || !driver.routes?.endPoint) return 'Unknown';
    
    const pickupDistance = calculateDistance(child.tripStartLocation, driver.routes.startPoint);
    const schoolDistance = calculateDistance(child.schoolLocation, driver.routes.endPoint);
    
    const totalDistance = pickupDistance + schoolDistance;
    
    if (totalDistance < 2) return 'Excellent';
    if (totalDistance < 5) return 'Good';
    if (totalDistance < 10) return 'Fair';
    return 'Poor';
  };

  const handleDriverSelection = (driver: UserProfile) => {
    const routeQuality = getRouteCompatibility(driver);
    
    // If route is excellent, proceed directly
    if (routeQuality.toLowerCase() === 'excellent') {
      onDriverSelect(driver);
      return;
    }
    
    // If route is good or fair, show warning modal
    if (routeQuality.toLowerCase() === 'good' || routeQuality.toLowerCase() === 'fair') {
      setSelectedDriverForWarning(driver);
      setShowRouteWarning(true);
      return;
    }
    
    // Poor or unknown routes should not reach here due to filtering, but handle just in case
    onDriverSelect(driver);
  };

  const handleRouteWarningContinue = () => {
    if (selectedDriverForWarning) {
      setShowRouteWarning(false);
      onDriverSelect(selectedDriverForWarning);
      setSelectedDriverForWarning(null);
    }
  };

  const handleRouteWarningClose = () => {
    setShowRouteWarning(false);
    setSelectedDriverForWarning(null);
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
                          <h3 className="font-semibold text-gray-900 text-lg">
                            {driver.firstName} {driver.lastName}
                            {driver.gender && (
                              <span className="ml-2 text-sm text-gray-600 font-normal">
                                ({driver.gender})
                              </span>
                            )}
                          </h3>
                          <div className="flex gap-2">
                            <Badge variant={compatibility === 'Excellent' ? 'default' : 
                                           compatibility === 'Good' ? 'secondary' : 'outline'}
                                   className={compatibility === 'Excellent' ? 'bg-green-600 text-white' :
                                             compatibility === 'Good' ? 'bg-blue-600 text-white' : 
                                             'bg-yellow-600 text-white'}>
                              {compatibility} Route
                            </Badge>
                            {driver.vehicle?.type && (
                              <Badge variant="outline" className="text-sm border-gray-400 text-gray-700">
                                {driver.vehicle.type}
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-800 font-medium">
                            <Phone className="w-4 h-4 text-blue-600" />
                            {driver.phone}
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-gray-800 font-medium">
                            <Users className="w-4 h-4 text-green-600" />
                            <span className="text-green-700 font-semibold">
                              {availability?.availableSeats || 0} available
                            </span>
                            <span className="text-gray-600">
                              of {availability?.totalSeats || 0} total seats
                            </span>
                          </div>
                          
                          {driver.vehicle && (
                            <div className="space-y-1">
                              <div className="text-sm text-gray-800">
                                <strong className="text-gray-900">Vehicle:</strong> 
                                <span className="ml-1 font-medium">{driver.vehicle.color} {driver.vehicle.model} ({driver.vehicle.year})</span>
                              </div>
                              <div className="text-sm text-gray-800">
                                <strong className="text-gray-900">Type:</strong> 
                                <span className="ml-1 font-medium">{driver.vehicle.type}</span>
                                <span className="mx-2 text-gray-500">|</span>
                                <strong className="text-gray-900">Capacity:</strong> 
                                <span className="ml-1 font-medium">{driver.vehicle.capacity}</span>
                              </div>
                            </div>
                          )}
                          
                          {driver.routes?.startPoint && driver.routes?.endPoint && (
                            <div className="space-y-1 bg-gray-50 p-2 rounded-md border">
                              <div className="flex items-center gap-2 text-sm text-gray-800">
                                <MapPin className="w-4 h-4 text-green-600" />
                                <strong className="text-gray-900">From:</strong>
                                <span className="font-medium">{driver.routes.startPoint.address}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-800">
                                <MapPin className="w-4 h-4 text-red-600" />
                                <strong className="text-gray-900">To:</strong>
                                <span className="font-medium">{driver.routes.endPoint.address}</span>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 pt-3">
                          <Button 
                            onClick={() => handleDriverSelection(driver)}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md"
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
      
      {/* Route Quality Warning Modal */}
      {selectedDriverForWarning && (
        <RouteQualityWarningModal
          isOpen={showRouteWarning}
          onClose={handleRouteWarningClose}
          onContinue={handleRouteWarningContinue}
          driver={selectedDriverForWarning}
          child={child}
          routeQuality={getRouteCompatibility(selectedDriverForWarning)}
        />
      )}
    </Sheet>
  );
};

export default DriverSelectionModal;