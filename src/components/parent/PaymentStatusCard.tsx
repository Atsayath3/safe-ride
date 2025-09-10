import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { PaymentService } from '../../services/paymentService';
import { PaymentReminderService } from '../../services/paymentReminderService';
import { PaymentRecord } from '../../interfaces/payment';
import { useAuth } from '../../contexts/AuthContext';
import PaymentModal from './PaymentModal';
import { 
  CreditCard, 
  AlertTriangle, 
  Clock, 
  CheckCircle,
  DollarSign 
} from 'lucide-react';

const PaymentStatusCard: React.FC = () => {
  const { userProfile } = useAuth();
  const [paymentSummary, setPaymentSummary] = useState({
    totalPending: 0,
    totalOverdue: 0,
    upcomingDue: [] as PaymentRecord[]
  });
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userProfile) {
      loadPaymentSummary();
    }
  }, [userProfile]);

  const loadPaymentSummary = async () => {
    if (!userProfile) return;
    
    try {
      setLoading(true);
      const summary = await PaymentReminderService.getPaymentStatusSummary(userProfile.uid);
      setPaymentSummary(summary);
    } catch (error) {
      console.error('Error loading payment summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = (payment: PaymentRecord) => {
    setSelectedPayment(payment);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    loadPaymentSummary(); // Refresh the summary
    setShowPaymentModal(false);
    setSelectedPayment(null);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasPaymentIssues = paymentSummary.totalOverdue > 0 || paymentSummary.upcomingDue.length > 0;

  if (!hasPaymentIssues && paymentSummary.totalPending === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Payment Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">All payments are up to date!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="w-5 h-5" />
            Payment Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Overdue Payments Alert */}
          {paymentSummary.totalOverdue > 0 && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <div className="flex items-center justify-between">
                  <span>
                    Overdue payments: {PaymentService.formatPrice(paymentSummary.totalOverdue)}
                  </span>
                  <Badge variant="destructive">Urgent</Badge>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Pending Payments */}
          {paymentSummary.totalPending > 0 && (
            <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  Pending: {PaymentService.formatPrice(paymentSummary.totalPending)}
                </span>
              </div>
              <Badge variant="secondary">Partial</Badge>
            </div>
          )}

          {/* Upcoming Due Payments */}
          {paymentSummary.upcomingDue.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-900">
                  Payments Due Soon
                </span>
              </div>
              
              {paymentSummary.upcomingDue.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-orange-900">
                      {PaymentService.formatPrice(payment.remainingAmount)} due
                    </div>
                    <div className="text-xs text-orange-700">
                      Due: {payment.finalPaymentDue.toLocaleDateString()}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handlePayNow(payment)}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    Pay Now
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Modal */}
      {showPaymentModal && selectedPayment && userProfile && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          bookingId={selectedPayment.bookingId}
          totalAmount={selectedPayment.totalAmount}
          tripEndDate={selectedPayment.finalPaymentDue}
          parentInfo={{
            id: userProfile.uid,
            name: `${userProfile.firstName} ${userProfile.lastName}`,
            email: userProfile.email || '',
            phone: userProfile.phone || ''
          }}
          driverId={selectedPayment.driverId}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </>
  );
};

export default PaymentStatusCard;
