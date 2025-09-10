import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, MapPin, Users } from 'lucide-react';
import { UserProfile } from '@/contexts/AuthContext';
import { Child } from '@/pages/parent/ParentDashboard';

interface RouteQualityWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  driver: UserProfile;
  child: Child;
  routeQuality: string;
}

const RouteQualityWarningModal: React.FC<RouteQualityWarningModalProps> = ({
  isOpen,
  onClose,
  onContinue,
  driver,
  child,
  routeQuality
}) => {
  const getQualityColor = (quality: string) => {
    switch (quality.toLowerCase()) {
      case 'excellent': return 'bg-green-100 text-green-800 border-green-300';
      case 'good': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'fair': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'poor': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getWarningMessage = (quality: string) => {
    switch (quality.toLowerCase()) {
      case 'good':
        return {
          title: 'Route Quality: Good',
          message: 'This driver\'s route is a good match for your child, but may require a small detour.',
          recommendation: 'The pickup and drop-off points are reasonably close to the driver\'s regular route.'
        };
      case 'fair':
        return {
          title: 'Route Quality: Fair',
          message: 'This driver\'s route is a fair match for your child, which may involve a moderate detour.',
          recommendation: 'The pickup and drop-off points are somewhat distant from the driver\'s regular route. Consider if this works for your schedule.'
        };
      default:
        return {
          title: 'Route Quality Notice',
          message: 'Please review the route compatibility before proceeding.',
          recommendation: 'Make sure the pickup and drop-off locations work for your needs.'
        };
    }
  };

  const warningInfo = getWarningMessage(routeQuality);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[80vh] overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Route Quality Warning
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6">
          {/* Warning Card */}
          <Card className="border-orange-300 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-6 w-6 text-orange-600 mt-1 flex-shrink-0" />
                <div className="space-y-2">
                  <h3 className="font-semibold text-orange-900">{warningInfo.title}</h3>
                  <p className="text-sm text-orange-800">{warningInfo.message}</p>
                  <p className="text-sm text-orange-700 font-medium">{warningInfo.recommendation}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Driver & Route Information */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Driver & Route Details</h3>
              
              <div className="space-y-4">
                {/* Driver Info */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{driver.firstName} {driver.lastName}</p>
                    <p className="text-sm text-muted-foreground">{driver.phone}</p>
                  </div>
                  <Badge className={`${getQualityColor(routeQuality)} border`}>
                    {routeQuality} Route
                  </Badge>
                </div>

                {/* Vehicle Info */}
                {driver.vehicle && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>{driver.vehicle.color} {driver.vehicle.model} ({driver.vehicle.year}) - {driver.vehicle.capacity} capacity</span>
                  </div>
                )}

                {/* Route Details */}
                {driver.routes?.startPoint && driver.routes?.endPoint && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-green-600" />
                      <span><strong>Driver's Route Start:</strong> {driver.routes.startPoint.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-red-600" />
                      <span><strong>Driver's Route End:</strong> {driver.routes.endPoint.address}</span>
                    </div>
                  </div>
                )}

                <hr className="my-3" />

                {/* Child's Required Route */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span><strong>Child's Pickup:</strong> {child.tripStartLocation.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-purple-600" />
                    <span><strong>Child's School:</strong> {child.schoolLocation.address}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
            >
              Choose Different Driver
            </Button>
            <Button 
              onClick={onContinue}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
            >
              Continue Anyway
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default RouteQualityWarningModal;
