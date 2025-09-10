import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  CreditCard, 
  DollarSign, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  Calculator,
  TrendingDown
} from 'lucide-react';
import { EnhancedPaymentService } from '@/services/enhancedPaymentService';
import { EnhancedPaymentTransaction, PaymentSplit } from '@/interfaces/payment';
import { toast } from '@/hooks/use-toast';

interface EnhancedPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  totalAmount: number;
  onPaymentSuccess: (transaction: EnhancedPaymentTransaction) => void;
}

const EnhancedPaymentModal: React.FC<EnhancedPaymentModalProps> = ({
  isOpen,
  onClose,
  bookingId,
  totalAmount,
  onPaymentSuccess
}) => {
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentTransaction, setPaymentTransaction] = useState<EnhancedPaymentTransaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [paymentSplit, setPaymentSplit] = useState<PaymentSplit | null>(null);

  const minimumUpfront = totalAmount * 0.25; // 25% minimum
  const remainingAmount = paymentTransaction ? 
    (totalAmount - paymentTransaction.upfrontPaid - paymentTransaction.balancePaid) : totalAmount;

  useEffect(() => {
    if (isOpen && bookingId) {
      loadPaymentTransaction();
    }
  }, [isOpen, bookingId]);

  useEffect(() => {
    if (paymentAmount) {
      const amount = parseFloat(paymentAmount);
      if (!isNaN(amount)) {
        const split = EnhancedPaymentService.calculatePaymentSplit(amount);
        setPaymentSplit(split);
      } else {
        setPaymentSplit(null);
      }
    } else {
      setPaymentSplit(null);
    }
  }, [paymentAmount]);

  const loadPaymentTransaction = async () => {
    try {
      setLoading(true);
      const transaction = await EnhancedPaymentService.getPaymentByBookingId(bookingId);
      setPaymentTransaction(transaction);
    } catch (error) {
      console.error('Error loading payment transaction:', error);
      toast({
        title: "Error",
        description: "Failed to load payment information",
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

    if (!paymentTransaction) {
      setValidationError('Payment transaction not loaded');
      return false;
    }

    const totalPaid = paymentTransaction.upfrontPaid + paymentTransaction.balancePaid;
    const remaining = totalAmount - totalPaid;

    if (numAmount > remaining) {
      setValidationError(`Amount exceeds remaining balance: Rs.${remaining.toFixed(2)}`);
      return false;
    }

    // Check minimum payment for first payment
    if (paymentTransaction.upfrontPaid === 0 && numAmount < minimumUpfront) {
      setValidationError(`Minimum upfront payment required: Rs.${minimumUpfront.toFixed(2)}`);
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
    if (!validateAmount(paymentAmount) || !paymentTransaction) {
      return;
    }

    const amount = parseFloat(paymentAmount);
    
    try {
      setProcessingPayment(true);

      // Simulate PayHere integration
      const payhereTransactionId = `payhere_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Process payment based on type
      let success = false;
      if (paymentTransaction.upfrontPaid === 0) {
        // This is the upfront payment
        success = await EnhancedPaymentService.processUpfrontPayment(
          paymentTransaction.id!,
          amount,
          payhereTransactionId
        );
      } else {
        // This is a balance payment
        success = await EnhancedPaymentService.processBalancePayment(
          paymentTransaction.id!,
          amount,
          payhereTransactionId
        );
      }

      if (success) {
        // Reload transaction data
        const updatedTransaction = await EnhancedPaymentService.getPaymentByBookingId(bookingId);
        if (updatedTransaction) {
          setPaymentTransaction(updatedTransaction);
          onPaymentSuccess(updatedTransaction);
        }

        const split = EnhancedPaymentService.calculatePaymentSplit(amount);
        
        toast({
          title: "Payment Successful!",
          description: `Rs.${amount.toFixed(2)} paid successfully. Driver receives Rs.${split.driverEarning.toFixed(2)} after fees.`,
        });

        setPaymentAmount('');
        
        // If fully paid, close modal after delay
        if (updatedTransaction?.status === 'completed') {
          setTimeout(() => onClose(), 2000);
        }
      } else {
        toast({
          title: "Payment Failed",
          description: "Payment processing failed. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : "Failed to process payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  const getPaymentStatusBadge = (status: EnhancedPaymentTransaction['status']) => {
    const variants = {
      pending: 'destructive',
      partial: 'secondary',
      completed: 'default',
      suspended: 'destructive',
      failed: 'destructive'
    } as const;

    const labels = {
      pending: 'Payment Pending',
      partial: 'Partially Paid',
      completed: 'Fully Paid',
      suspended: 'Suspended',
      failed: 'Payment Failed'
    };

    return (
      <Badge variant={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="sm:max-w-lg h-full flex flex-col">
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
            Secure Payment
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-6">
          {/* Payment Status */}
          {paymentTransaction && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Payment Status</CardTitle>
                  {getPaymentStatusBadge(paymentTransaction.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Amount:</span>
                  <span className="font-medium">Rs.{totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Upfront Paid:</span>
                  <span className="font-medium text-green-600">
                    Rs.{paymentTransaction.upfrontPaid.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Balance Paid:</span>
                  <span className="font-medium text-green-600">
                    Rs.{paymentTransaction.balancePaid.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Remaining:</span>
                  <span className="font-medium text-orange-600">
                    Rs.{remainingAmount.toFixed(2)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Balance Due Date:</span>
                  <span className="font-medium text-red-600">
                    {paymentTransaction.balanceDueDate.toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Rules */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p>• Minimum upfront payment: 25% (Rs.{minimumUpfront.toFixed(2)})</p>
                <p>• You can pay any amount above the minimum</p>
                <p>• Remaining balance must be paid 2 days before trip ends</p>
                <p>• System commission: 15% | PayHere fee: 3.30%</p>
                <p>• Driver receives approximately 81.7% of each payment</p>
              </div>
            </AlertDescription>
          </Alert>

          {/* Payment Form */}
          {paymentTransaction && paymentTransaction.status !== 'completed' && remainingAmount > 0 && (
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
                    min={paymentTransaction.upfrontPaid === 0 ? minimumUpfront : 1}
                    max={remainingAmount}
                  />
                  {validationError && (
                    <p className="text-sm text-red-600">{validationError}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>
                      {paymentTransaction.upfrontPaid === 0 ? 'Minimum upfront:' : 'Minimum payment:'}
                    </span>
                    <span>
                      Rs.{(paymentTransaction.upfrontPaid === 0 ? minimumUpfront : 1).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Maximum for this payment:</span>
                    <span>Rs.{remainingAmount.toFixed(2)}</span>
                  </div>
                </div>

                {/* Payment Split Preview */}
                {paymentSplit && (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Calculator className="w-4 h-4" />
                        Payment Breakdown
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span>Your Payment:</span>
                        <span className="font-medium">Rs.{paymentSplit.totalAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-red-600">
                        <span>System Commission (15%):</span>
                        <span>-Rs.{paymentSplit.systemCommission.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-red-600">
                        <span>PayHere Fee (3.30%):</span>
                        <span>-Rs.{paymentSplit.payhereFee.toFixed(2)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-green-600 font-medium">
                        <span>Driver Receives:</span>
                        <span>Rs.{paymentSplit.driverEarning.toFixed(2)}</span>
                      </div>
                    </CardContent>
                  </Card>
                )}

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
                      Pay Rs.{paymentAmount ? parseFloat(paymentAmount).toFixed(2) : '0.00'}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Success Message */}
          {paymentTransaction && paymentTransaction.status === 'completed' && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Payment completed successfully! Your booking is fully paid and confirmed.
              </AlertDescription>
            </Alert>
          )}

          {/* Quick Payment Options */}
          {paymentTransaction && paymentTransaction.status !== 'completed' && remainingAmount > 0 && (
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
                    onClick={() => setPaymentAmount((paymentTransaction.upfrontPaid === 0 ? minimumUpfront : Math.min(1000, remainingAmount)).toFixed(0))}
                  >
                    {paymentTransaction.upfrontPaid === 0 ? 'Minimum' : 'Rs.1,000'}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="bg-green-100 hover:bg-green-200 text-green-900 border border-green-300"
                    onClick={() => setPaymentAmount((remainingAmount * 0.5).toFixed(0))}
                  >
                    50%
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="bg-orange-100 hover:bg-orange-200 text-orange-900 border border-orange-300"
                    onClick={() => setPaymentAmount((remainingAmount * 0.75).toFixed(0))}
                  >
                    75%
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="bg-purple-100 hover:bg-purple-200 text-purple-900 border border-purple-300"
                    onClick={() => setPaymentAmount(remainingAmount.toFixed(0))}
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

export default EnhancedPaymentModal;
