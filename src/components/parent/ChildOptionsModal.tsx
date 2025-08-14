import React from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Car, History, Edit, Trash2, X } from 'lucide-react';
import { Child } from '@/pages/parent/ParentDashboard';

interface ChildOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  child: Child;
  onBookRide: () => void;
  onViewPastRides: () => void;
  onEditChild: () => void;
  onDeleteChild: () => void;
}

const ChildOptionsModal: React.FC<ChildOptionsModalProps> = ({
  isOpen,
  onClose,
  child,
  onBookRide,
  onViewPastRides,
  onEditChild,
  onDeleteChild
}) => {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="rounded-t-3xl p-0">
        <SheetHeader className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="font-nunito text-xl">
              {child.fullName}
            </SheetTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <div className="px-6 pb-8 space-y-3">
          <Button
            onClick={onBookRide}
            className="w-full justify-start text-left h-14 rounded-xl font-medium text-base"
            size="lg"
          >
            <Car className="h-5 w-5 mr-3" />
            Book a Ride
          </Button>

          <Button
            variant="outline"
            onClick={onViewPastRides}
            className="w-full justify-start text-left h-12 rounded-xl font-medium"
          >
            <History className="h-5 w-5 mr-3" />
            View Past Rides
          </Button>

          <Button
            variant="outline"
            onClick={onEditChild}
            className="w-full justify-start text-left h-12 rounded-xl font-medium"
          >
            <Edit className="h-5 w-5 mr-3" />
            Edit Child Info
          </Button>

          <Button
            variant="destructive"
            onClick={onDeleteChild}
            className="w-full justify-start text-left h-12 rounded-xl font-medium"
          >
            <Trash2 className="h-5 w-5 mr-3" />
            Delete Child
          </Button>

          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full h-12 rounded-xl font-medium text-muted-foreground mt-4"
          >
            Cancel
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ChildOptionsModal;