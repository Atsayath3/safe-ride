import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, School, Clock, Plus, Calendar, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { Child } from '@/pages/parent/ParentDashboard';
import { Booking } from '../../interfaces/booking';
import { BookingManagementService } from '../../services/bookingManagementService';
import { ExtendBookingModal } from './ExtendBookingModal';

interface EnhancedChildCardProps {
  child: Child;
  onBookNewRide: () => void;
  onRefresh?: () => void;
  onEditChild?: (child: Child) => void;
  onDeleteChild?: (child: Child) => void;
}

const EnhancedChildCard: React.FC<EnhancedChildCardProps> = ({ 
  child, 
  onBookNewRide,
  onRefresh,
  onEditChild,
  onDeleteChild
}) => {
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const loadActiveBooking = async () => {
    setIsLoading(true);
    try {
      const bookings = await BookingManagementService.getActiveBookingsForChild(child.id);
      setActiveBooking(bookings.length > 0 ? bookings[0] : null);
    } catch (error) {
      console.error('Error loading active booking:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadActiveBooking();
  }, [child.id]);

  const handleExtendSuccess = () => {
    loadActiveBooking();
    onRefresh?.();
  };

  const statusInfo = activeBooking 
    ? BookingManagementService.getBookingStatusInfo(activeBooking)
    : null;

  const daysRemaining = activeBooking 
    ? BookingManagementService.getDaysRemaining(activeBooking)
    : 0;

  return (
    <>
      <Card className="rounded-2xl border border-blue-100 bg-white shadow-md transition-all duration-300 hover:shadow-lg">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Child Info Header */}
            <div className="flex items-center space-x-4">
              <Avatar className="h-14 w-14 ring-2 ring-blue-100">
                <AvatarImage src={child.avatar} alt={child.fullName} />
                <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold text-lg">
                  {getInitials(child.fullName)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-nunito font-semibold text-lg text-blue-900">
                    {child.fullName}
                  </h3>
                  <div className="flex items-center gap-2">
                    {statusInfo && (
                      <Badge className={`text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color} border-0`}>
                        {statusInfo.status}
                      </Badge>
                    )}
                    <div className="relative">
                      <button
                        onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                      
                      {/* Options Dropdown Menu */}
                      {showOptionsMenu && (
                        <>
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setShowOptionsMenu(false)}
                          ></div>
                          <div className="absolute right-0 top-8 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[140px]">
                            <button
                              onClick={() => {
                                onEditChild?.(child);
                                setShowOptionsMenu(false);
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            >
                              <Edit className="w-3 h-3" />
                              Edit Child
                            </button>
                            <button
                              onClick={() => {
                                onDeleteChild?.(child);
                                setShowOptionsMenu(false);
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete Child
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-1 text-sm text-blue-600">
                  <School className="h-4 w-4" />
                  <span className="font-medium">{child.schoolName}</span>
                </div>
                
                <div className="flex items-center space-x-1 text-xs text-blue-500">
                  <MapPin className="h-3 w-3" />
                  <span>{child.tripStartLocation.address}</span>
                </div>
              </div>
            </div>

            {/* Booking Status Section */}
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : activeBooking ? (
              <div className={`p-4 rounded-lg border ${statusInfo?.bgColor}`}>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-900">Current Booking</span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Period:</span>
                      <span className="font-medium">
                        {BookingManagementService.formatBookingPeriod(activeBooking)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`font-medium ${statusInfo?.color}`}>
                        {statusInfo?.description}
                      </span>
                    </div>
                    {daysRemaining > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Remaining:</span>
                        <span className="font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {daysRemaining} days
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="pt-2">
                    <Button
                      onClick={() => setShowExtendModal(true)}
                      size="sm"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Extend Booking
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-lg border border-dashed border-gray-300 bg-gray-50">
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                    <Plus className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">No Active Booking</h4>
                    <p className="text-sm text-gray-600">Book a ride for {child.fullName}</p>
                  </div>
                  <Button
                    onClick={onBookNewRide}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Book New Ride
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Extend Booking Modal */}
      {activeBooking && (
        <ExtendBookingModal
          isOpen={showExtendModal}
          onClose={() => setShowExtendModal(false)}
          booking={activeBooking}
          onExtended={handleExtendSuccess}
        />
      )}
    </>
  );
};

export default EnhancedChildCard;
