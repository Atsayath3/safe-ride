import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AlertTriangle, CalendarIcon, Send, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface RideCancellationModalProps {
  isOpen: boolean;
  onClose: () => void;
  driverId?: string;
  driverName?: string;
}

const RideCancellationModal: React.FC<RideCancellationModalProps> = ({
  isOpen,
  onClose,
  driverId,
  driverName
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [reason, setReason] = useState('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!selectedDate) {
      toast({
        title: "Date Required",
        description: "Please select a date for ride cancellation",
        variant: "destructive"
      });
      return;
    }

    if (!reason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for cancellation",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      // Here you would implement the actual ride cancellation logic
      // For now, we'll simulate the API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: "Ride Cancelled",
        description: `Ride for ${format(selectedDate, 'PPP')} has been cancelled. Parents will be notified.`,
        variant: "default"
      });

      // Reset form and close modal
      setSelectedDate(undefined);
      setReason('');
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel ride. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setSelectedDate(undefined);
    setReason('');
    onClose();
  };

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader className="border-b border-slate-200 pb-4">
          <DialogTitle className="text-xl font-semibold text-slate-900 flex items-center gap-3">
            <div className="bg-red-100 p-2 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            Cancel Ride for Day
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Warning Card */}
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-orange-900">Important Notice</h4>
                  <p className="text-sm text-orange-800 mt-1">
                    Cancelling a ride will notify all parents whose children are scheduled for that day. 
                    This action cannot be undone.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Date Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">
              Select Date to Cancel
            </Label>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                  disabled={loading}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    setIsCalendarOpen(false);
                  }}
                  disabled={(date) => date < tomorrow}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Reason Input */}
          <div className="space-y-2">
            <Label htmlFor="cancellation-reason" className="text-sm font-medium text-slate-700">
              Reason for Cancellation
            </Label>
            <Textarea
              id="cancellation-reason"
              placeholder="Please provide a clear reason for the cancellation (e.g., vehicle maintenance, personal emergency, weather conditions, etc.)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[100px] border-slate-300 focus:border-red-500 focus:ring-red-500"
              disabled={loading}
              maxLength={500}
            />
            <div className="text-xs text-slate-500 text-right">
              {reason.length}/500 characters
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-3 pt-4 border-t border-slate-200">
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={loading}
            className="flex-1"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!selectedDate || !reason.trim() || loading}
            className="flex-1 bg-red-600 hover:bg-red-700"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Cancelling...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Cancel Ride
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RideCancellationModal;
