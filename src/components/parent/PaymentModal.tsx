import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Alert, AlertDescription } from '../ui/alert';
import { PaymentService } from '../../services/paymentService';
import { PaymentRecord, PaymentRequest, PaymentResponse } from '../../interfaces/payment';
import { useToast } from '../../hooks/use-toast';
import { 
  CreditCard, 
  DollarSign, 
  Calendar, 
  AlertCircle, 
  CheckCircle,
  Loader2 
} from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId?: string; // Made optional since booking will be created after payment
  totalAmount: number;
  tripEndDate: Date;
  parentInfo: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  driverId: string;
  onPaymentSuccess: (paymentRecord: PaymentRecord) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  bookingId,
  totalAmount,
  tripEndDate,
  parentInfo,
  driverId,
  onPaymentSuccess
}) => {
  const { toast } = useToast();
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentRecord, setPaymentRecord] = useState<PaymentRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [validationError, setValidationError] = useState<string>('');

  const minimumPayment = PaymentService.calculateMinimumPayment(totalAmount);
  const finalPaymentDue = PaymentService.calculateFinalPaymentDue(tripEndDate);

  useEffect(() => {
    if (isOpen && !paymentRecord) {
      loadPaymentRecord();
    }
  }, [isOpen, bookingId]);

  useEffect(() => {
    if (paymentRecord && !paymentAmount) {
      // Set default to minimum payment if no payment made yet
      const alreadyPaid = paymentRecord.amount || 0;
      if (alreadyPaid === 0) {
        setPaymentAmount(minimumPayment.toString());
      }
    }
  }, [paymentRecord, minimumPayment]);

  const loadPaymentRecord = async () => {
    try {
      setLoading(true);
      
      if (bookingId) {
        // If booking exists, load existing payment record
        let record = await PaymentService.getPaymentByBookingId(bookingId);
        
        if (!record) {
          // Create new payment record for existing booking
          const paymentId = await PaymentService.createPaymentRecord(
            bookingId,
            parentInfo.id,
            driverId,
            totalAmount,
            tripEndDate
          );
          
          record = await PaymentService.getPaymentByBookingId(bookingId);
        }
        
        setPaymentRecord(record);
      } else {
        // No booking yet - create a temporary payment record without booking ID
        const paymentId = await PaymentService.createPaymentRecord(
          '', // Empty booking ID for now
          parentInfo.id,
          driverId,
          totalAmount,
          tripEndDate
        );
        
        // Get the created payment record
        const record = await PaymentService.getPaymentRecord(paymentId);
        setPaymentRecord(record);
      }
    } catch (error) {
      console.error('Error loading payment record:', error);
      toast({
        title: "Error",
        description: "Failed to load payment information. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const validateAmount = (amount: string): boolean => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setValidationError('Please enter a valid amount');
      return false;
    }

    if (!paymentRecord) {
      setValidationError('Payment record not loaded');
      return false;
    }

    const validation = PaymentService.validatePaymentAmount(
      numAmount,
      totalAmount,
      paymentRecord.amount || 0
    );

    if (!validation.isValid) {
      setValidationError(validation.message);
      return false;
    }

    setValidationError('');
    return true;
  };

  const handleAmountChange = (value: string) => {
    setPaymentAmount(value);
    if (value) {
      validateAmount(value);
    } else {
      setValidationError('');
    }
  };

  const handlePayNow = async () => {
    if (!validateAmount(paymentAmount) || !paymentRecord) {
      return;
    }

    const amount = parseFloat(paymentAmount);
    
    try {
      setProcessingPayment(true);

      // Create payment request
      const paymentRequest: PaymentRequest = {
        bookingId,
        amount,
        currency: 'LKR',
        description: `SafeWeb Ride Booking - ${bookingId}`,
        customerInfo: {
          name: parentInfo.name,
          email: parentInfo.email,
          phone: parentInfo.phone
        },
        metadata: {
          bookingId,
          driverId,
          totalAmount,
          isPartialPayment: amount < paymentRecord.remainingAmount
        }
      };

      // Process payment
      const paymentResponse: PaymentResponse = await PaymentService.processPayment(paymentRequest);

      // Record transaction
      const transactionType = (paymentRecord.amount || 0) === 0 ? 'initial' : 'partial';
      await PaymentService.recordPaymentTransaction(
        paymentRecord.id,
        amount,
        transactionType,
        paymentResponse
      );

      if (paymentResponse.success) {
        // Reload payment record to get updated data
        const updatedRecord = await PaymentService.getPaymentByBookingId(bookingId);
        if (updatedRecord) {
          setPaymentRecord(updatedRecord);
          onPaymentSuccess(updatedRecord);
        }

        toast({
          title: "Payment Successful!",
          description: `${PaymentService.formatPrice(amount)} paid successfully. ${
            updatedRecord?.remainingAmount && updatedRecord.remainingAmount > 0
              ? `Remaining balance: ${PaymentService.formatPrice(updatedRecord.remainingAmount)}`
              : 'Booking fully paid!'
          }`,
        });

        // Clear amount for next payment
        setPaymentAmount('');
        
        // If fully paid, close modal
        if (updatedRecord?.paymentStatus === 'completed') {
          setTimeout(() => onClose(), 2000);
        }
      } else {
        toast({
          title: "Payment Failed",
          description: paymentResponse.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      toast({
        title: "Payment Error",
        description: "Failed to process payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  const getPaymentStatusBadge = (status: PaymentRecord['paymentStatus']) => {
    const variants = {
      pending: 'destructive',
      partial: 'secondary',
      completed: 'success',
      failed: 'destructive',
      overdue: 'destructive'
    } as const;

    const labels = {
      pending: 'Payment Pending',
      partial: 'Partially Paid',
      completed: 'Fully Paid',
      failed: 'Payment Failed',
      overdue: 'Overdue'
    };

    return (
      <Badge variant={variants[status] as any}>
        {labels[status]}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="sm:max-w-lg">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-lg h-full flex flex-col">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment for Booking
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-6">
          {/* Payment Status */}
          {paymentRecord && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Payment Status</CardTitle>
                  {getPaymentStatusBadge(paymentRecord.paymentStatus)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Amount:</span>
                  <span className="font-medium">{PaymentService.formatPrice(totalAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Paid Amount:</span>
                  <span className="font-medium text-green-600">
                    {PaymentService.formatPrice(paymentRecord.amount || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Remaining:</span>
                  <span className="font-medium text-orange-600">
                    {PaymentService.formatPrice(paymentRecord.remainingAmount || 0)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Minimum Required:</span>
                  <span className="font-medium">{PaymentService.formatPrice(minimumPayment)}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Rules */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p>• Minimum payment: 25% of total amount</p>
                <p>• You can pay any amount above the minimum</p>
                <p>• Remaining balance must be paid 2 days before trip ends</p>
                <p>• Final payment due: {finalPaymentDue.toLocaleDateString()}</p>
              </div>
            </AlertDescription>
          </Alert>

          {/* Payment Form */}
          {paymentRecord && paymentRecord.paymentStatus !== 'completed' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Make Payment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Payment Amount (LKR)</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder="Enter amount"
                    min={PaymentService.calculateMinimumPayment(totalAmount) - (paymentRecord.amount || 0)}
                    max={paymentRecord.remainingAmount}
                  />
                  {validationError && (
                    <p className="text-sm text-red-600">{validationError}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Minimum for this payment:</span>
                    <span>
                      {PaymentService.formatPrice(
                        Math.max(0, minimumPayment - (paymentRecord.amount || 0))
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Maximum for this payment:</span>
                    <span>{PaymentService.formatPrice(paymentRecord.remainingAmount)}</span>
                  </div>
                </div>

                <Button
                  onClick={handlePayNow}
                  disabled={!paymentAmount || !!validationError || processingPayment}
                  className="w-full"
                >
                  {processingPayment ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing Payment...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Pay {paymentAmount ? PaymentService.formatPrice(parseFloat(paymentAmount)) : 'Now'}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Success Message */}
          {paymentRecord && paymentRecord.paymentStatus === 'completed' && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Payment completed successfully! Your booking is fully paid.
              </AlertDescription>
            </Alert>
          )}

          {/* Quick Payment Options */}
          {paymentRecord && paymentRecord.paymentStatus !== 'completed' && paymentRecord.remainingAmount > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Payment Options</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="bg-blue-100 hover:bg-blue-200 text-blue-900 border border-blue-300"
                    onClick={() => setPaymentAmount(Math.max(0, minimumPayment - (paymentRecord.amount || 0)).toString())}
                  >
                    Minimum
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="bg-green-100 hover:bg-green-200 text-green-900 border border-green-300"
                    onClick={() => setPaymentAmount((paymentRecord.remainingAmount / 2).toFixed(0))}
                  >
                    50%
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="bg-orange-100 hover:bg-orange-200 text-orange-900 border border-orange-300"
                    onClick={() => setPaymentAmount((paymentRecord.remainingAmount * 0.75).toFixed(0))}
                  >
                    75%
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="bg-purple-100 hover:bg-purple-200 text-purple-900 border border-purple-300"
                    onClick={() => setPaymentAmount(paymentRecord.remainingAmount.toString())}
                  >
                    Full Amount
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex-shrink-0 border-t pt-4">
          <Button
            variant="secondary"
            onClick={onClose}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300 font-medium"
          >
            Close
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PaymentModal;
