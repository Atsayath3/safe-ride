import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CreditCard, DollarSign, AlertCircle, Calendar, Clock } from 'lucide-react';
import { ComprehensivePaymentService } from '@/services/comprehensivePaymentService';
import { PaymentCalculation } from '@/interfaces/payment';

interface PaymentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinuePayment: (paymentType: 'upfront' | 'balance') => void;
  totalAmount: number;
  bookingEndDate: Date;
  bookingDetails: {
    driverName: string;
    childName: string;
    schoolDays: number;
    distance: number;
    startDate: string;
    endDate: string;
  };
  paymentType: 'upfront' | 'balance';
  balanceAlreadyPaid?: number;
}

const PaymentDetailsModal: React.FC<PaymentDetailsModalProps> = ({
  isOpen,
  onClose,
  onContinuePayment,
  totalAmount,
  bookingEndDate,
  bookingDetails,
  paymentType,
  balanceAlreadyPaid = 0
}) => {
  const [paymentCalculation, setPaymentCalculation] = useState<PaymentCalculation | null>(null);

  React.useEffect(() => {
    if (totalAmount && bookingEndDate) {
      const calculation = ComprehensivePaymentService.calculatePaymentBreakdown(totalAmount, bookingEndDate);
      setPaymentCalculation(calculation);
    }
  }, [totalAmount, bookingEndDate]);

  if (!paymentCalculation) return null;

  const currentPaymentAmount = paymentType === 'upfront' 
    ? paymentCalculation.upfrontAmount 
    : paymentCalculation.balanceAmount;

  const remainingBalance = paymentType === 'upfront' 
    ? paymentCalculation.balanceAmount 
    : 0;

  // Calculate fee breakdown for current payment
  const currentPaymentFees = {
    payhereFee: Math.ceil(currentPaymentAmount * 0.033), // 3.3%
    systemCommission: Math.ceil(currentPaymentAmount * 0.15), // 15%
    driverEarning: 0
  };
  currentPaymentFees.driverEarning = currentPaymentAmount - currentPaymentFees.payhereFee - currentPaymentFees.systemCommission;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-lg h-full flex flex-col">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Payment Details
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-6">
          {/* Booking Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Driver:</span>
                <span className="font-medium">{bookingDetails.driverName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Child:</span>
                <span className="font-medium">{bookingDetails.childName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Period:</span>
                <span className="font-medium">{bookingDetails.startDate} - {bookingDetails.endDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">School Days:</span>
                <span className="font-medium">{bookingDetails.schoolDays} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Distance:</span>
                <span className="font-medium">{bookingDetails.distance} km</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Type Badge */}
          <div className="flex justify-center">
            <Badge variant={paymentType === 'upfront' ? 'default' : 'secondary'} className="px-4 py-2">
              {paymentType === 'upfront' ? 'Initial Payment (25%)' : 'Final Payment (75%)'}
            </Badge>
          </div>

          {/* Amount to Pay */}
          <Card>
            <CardContent className="pt-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-blue-700 font-medium">Amount to Pay Now:</span>
                  <span className="text-2xl font-bold text-blue-900">
                    {ComprehensivePaymentService.formatPrice(currentPaymentAmount)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Booking Cost */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Total Booking Cost</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total booking amount:</span>
                <span className="font-bold">{ComprehensivePaymentService.formatPrice(totalAmount)}</span>
              </div>
              
              {paymentType === 'upfront' && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Paying now (25%):</span>
                    <span className="font-medium text-blue-600">
                      {ComprehensivePaymentService.formatPrice(currentPaymentAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Remaining balance (75%):</span>
                    <span className="font-medium text-orange-600">
                      {ComprehensivePaymentService.formatPrice(remainingBalance)}
                    </span>
                  </div>
                </>
              )}
              
              {paymentType === 'balance' && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Already paid:</span>
                    <span className="font-medium text-green-600">
                      {ComprehensivePaymentService.formatPrice(balanceAlreadyPaid)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Paying now (final payment):</span>
                    <span className="font-medium text-blue-600">
                      {ComprehensivePaymentService.formatPrice(currentPaymentAmount)}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Payment Due Information */}
          {paymentType === 'upfront' && (
            <Alert>
              <Calendar className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">Balance Payment Due:</p>
                  <p>Remaining {ComprehensivePaymentService.formatPrice(remainingBalance)} must be paid by <strong>{paymentCalculation.balanceDueDate.toLocaleDateString()}</strong></p>
                  <p className="text-xs text-muted-foreground">
                    (2 days before your booking period ends)
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {paymentType === 'balance' && (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium">Final Payment</p>
                <p>This completes your booking payment. Your ride is guaranteed once this payment is processed.</p>
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex-shrink-0 border-t pt-4 space-y-3">
          <Button
            onClick={() => onContinuePayment(paymentType)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            size="lg"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Continue to Pay
          </Button>
          
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
          >
            Back to Booking Details
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PaymentDetailsModal;
