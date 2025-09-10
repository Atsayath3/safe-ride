import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { ComprehensivePaymentService } from '@/services/comprehensivePaymentService';
import { PaymentRequest, PaymentResponse } from '@/interfaces/payment';
import { toast } from '@/hooks/use-toast';

interface PaymentGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (transactionId: string) => void;
  onPaymentFailure: (error: string) => void;
  paymentAmount: number;
  paymentType: 'upfront' | 'balance';
  bookingId: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
}

const PaymentGatewayModal: React.FC<PaymentGatewayModalProps> = ({
  isOpen,
  onClose,
  onPaymentSuccess,
  onPaymentFailure,
  paymentAmount,
  paymentType,
  bookingId,
  customerInfo
}) => {
  const [processing, setProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'form' | 'processing' | 'success' | 'failed'>('form');
  const [transactionId, setTransactionId] = useState<string>('');
  
  // Mock payment form state
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState(customerInfo.name);

  const handlePayment = async () => {
    if (!cardNumber || !expiryDate || !cvv || !cardholderName) {
      toast({
        title: "Missing Information",
        description: "Please fill in all payment details",
        variant: "destructive"
      });
      return;
    }

    setProcessing(true);
    setPaymentStep('processing');

    try {
      // Create payment request
      const paymentRequest: PaymentRequest = {
        bookingId,
        amount: paymentAmount,
        paymentType,
        customerInfo: {
          name: cardholderName,
          email: customerInfo.email,
          phone: customerInfo.phone
        }
      };

      // Process payment through the service
      const paymentResponse: PaymentResponse = await ComprehensivePaymentService.processPayment(paymentRequest);
      
      if (paymentResponse.success && paymentResponse.transactionId) {
        setTransactionId(paymentResponse.transactionId);
        setPaymentStep('success');
        
        // Notify parent component
        setTimeout(() => {
          onPaymentSuccess(paymentResponse.transactionId!);
        }, 2000);
        
      } else {
        setPaymentStep('failed');
        onPaymentFailure(paymentResponse.message);
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      setPaymentStep('failed');
      onPaymentFailure('Payment processing failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const resetForm = () => {
    setPaymentStep('form');
    setCardNumber('');
    setExpiryDate('');
    setCvv('');
    setCardholderName(customerInfo.name);
    setTransactionId('');
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  if (paymentStep === 'processing') {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="sm:max-w-lg">
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
            <div className="text-center">
              <h3 className="text-lg font-semibold">Processing Payment</h3>
              <p className="text-muted-foreground">Please wait while we process your payment...</p>
              <p className="text-sm text-muted-foreground mt-2">
                Amount: {ComprehensivePaymentService.formatPrice(paymentAmount)}
              </p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  if (paymentStep === 'success') {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="sm:max-w-lg">
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
            <div className="text-center">
              <h3 className="text-lg font-semibold text-green-900">Payment Successful!</h3>
              <p className="text-muted-foreground">Your payment has been processed successfully.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Amount: {ComprehensivePaymentService.formatPrice(paymentAmount)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Transaction ID: {transactionId}
              </p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  if (paymentStep === 'failed') {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="sm:max-w-lg">
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <AlertCircle className="w-12 h-12 text-red-600" />
            <div className="text-center">
              <h3 className="text-lg font-semibold text-red-900">Payment Failed</h3>
              <p className="text-muted-foreground">There was an issue processing your payment.</p>
            </div>
            <div className="space-y-2">
              <Button onClick={resetForm} className="w-full">
                Try Again
              </Button>
              <Button variant="outline" onClick={onClose} className="w-full">
                Cancel
              </Button>
            </div>
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
            PayHere Payment Gateway
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-6">
          {/* Payment Summary */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Payment Summary</CardTitle>
                <Badge variant={paymentType === 'upfront' ? 'default' : 'secondary'}>
                  {paymentType === 'upfront' ? 'Initial Payment' : 'Final Payment'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center text-lg">
                <span className="font-medium">Amount to Pay:</span>
                <span className="font-bold text-blue-600">
                  {ComprehensivePaymentService.formatPrice(paymentAmount)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cardNumber">Card Number</Label>
                <Input
                  id="cardNumber"
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  maxLength={19}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Expiry Date</Label>
                  <Input
                    id="expiryDate"
                    type="text"
                    placeholder="MM/YY"
                    value={expiryDate}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, '');
                      if (value.length >= 2) {
                        value = value.substring(0, 2) + '/' + value.substring(2, 4);
                      }
                      setExpiryDate(value);
                    }}
                    maxLength={5}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    type="text"
                    placeholder="123"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').substring(0, 3))}
                    maxLength={3}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cardholderName">Cardholder Name</Label>
                <Input
                  id="cardholderName"
                  type="text"
                  placeholder="John Doe"
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Security Notice */}
          <div className="text-xs text-center text-muted-foreground bg-gray-50 p-3 rounded-lg">
            🔒 Your payment is secured by PayHere SSL encryption
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex-shrink-0 border-t pt-4 space-y-3">
          <Button
            onClick={handlePayment}
            disabled={processing || !cardNumber || !expiryDate || !cvv || !cardholderName}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            size="lg"
          >
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                Pay {ComprehensivePaymentService.formatPrice(paymentAmount)}
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={onClose}
            disabled={processing}
            className="w-full"
          >
            Cancel Payment
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PaymentGatewayModal;
