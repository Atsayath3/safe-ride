import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  TrendingUp, 
  Clock, 
  AlertCircle,
  Users,
  CreditCard,
  Calendar,
  Wallet
} from 'lucide-react';
import { WeeklyPayoutService } from '@/services/weeklyPayoutService';
import { EnhancedPaymentService } from '@/services/enhancedPaymentService';
import { EnhancedPaymentReminderService } from '@/services/enhancedPaymentReminderService';

interface PaymentStats {
  totalRevenue: number;
  systemCommission: number;
  driverEarnings: number;
  payhereFees: number;
  pendingPayments: number;
  completedPayments: number;
  suspendedBookings: number;
}

const PaymentDashboard: React.FC = () => {
  const [stats, setStats] = useState<PaymentStats>({
    totalRevenue: 0,
    systemCommission: 0,
    driverEarnings: 0,
    payhereFees: 0,
    pendingPayments: 0,
    completedPayments: 0,
    suspendedBookings: 0
  });
  const [payoutStats, setPayoutStats] = useState({
    totalPaidThisWeek: 0,
    totalPaidThisMonth: 0,
    pendingPayouts: 0,
    failedPayouts: 0
  });
  const [loading, setLoading] = useState(true);
  const [processingPayouts, setProcessingPayouts] = useState(false);
  const [checkingReminders, setCheckingReminders] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load payout statistics
      const payoutData = await WeeklyPayoutService.getPayoutStatistics();
      setPayoutStats(payoutData);
      
      // Here you would load other payment statistics from your payment transactions
      // For now, we'll use mock data
      setStats({
        totalRevenue: 125000,
        systemCommission: 18750,
        driverEarnings: 102125,
        payhereFees: 4125,
        pendingPayments: 15,
        completedPayments: 234,
        suspendedBookings: 3
      });
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerPayouts = async () => {
    try {
      setProcessingPayouts(true);
      await WeeklyPayoutService.triggerManualPayout();
      await loadDashboardData(); // Reload data
    } catch (error) {
      console.error('Error triggering payouts:', error);
    } finally {
      setProcessingPayouts(false);
    }
  };

  const handleCheckReminders = async () => {
    try {
      setCheckingReminders(true);
      await EnhancedPaymentReminderService.checkAndSendReminders();
    } catch (error) {
      console.error('Error checking reminders:', error);
    } finally {
      setCheckingReminders(false);
    }
  };

  const formatCurrency = (amount: number) => `Rs.${amount.toLocaleString()}`;

  if (loading) {
    return <div className="p-6">Loading dashboard...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Payment Dashboard</h1>
        <div className="flex gap-2">
          <Button 
            onClick={handleCheckReminders}
            disabled={checkingReminders}
            variant="outline"
          >
            {checkingReminders ? 'Checking...' : 'Check Payment Reminders'}
          </Button>
          <Button 
            onClick={handleTriggerPayouts}
            disabled={processingPayouts}
          >
            {processingPayouts ? 'Processing...' : 'Trigger Manual Payouts'}
          </Button>
        </div>
      </div>

      {/* Revenue Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              From all completed payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Commission</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.systemCommission)}</div>
            <p className="text-xs text-muted-foreground">
              15% of total revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Driver Earnings</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(stats.driverEarnings)}</div>
            <p className="text-xs text-muted-foreground">
              ~81.7% of total revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PayHere Fees</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(stats.payhereFees)}</div>
            <p className="text-xs text-muted-foreground">
              3.30% transaction fees
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Payments</CardTitle>
            <Badge variant="default">{stats.completedPayments}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold text-green-600">
              {stats.completedPayments} bookings
            </div>
            <p className="text-xs text-muted-foreground">
              Fully paid bookings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <Badge variant="secondary">{stats.pendingPayments}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold text-orange-600">
              {stats.pendingPayments} bookings
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting balance payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspended Bookings</CardTitle>
            <Badge variant="destructive">{stats.suspendedBookings}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold text-red-600">
              {stats.suspendedBookings} bookings
            </div>
            <p className="text-xs text-muted-foreground">
              Due to non-payment
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payout Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Driver Payout Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Paid This Week</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(payoutStats.totalPaidThisWeek)}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Paid This Month</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(payoutStats.totalPaidThisMonth)}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Pending Payouts</p>
              <p className="text-2xl font-bold text-orange-600">
                {formatCurrency(payoutStats.pendingPayouts)}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Failed Payouts</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(payoutStats.failedPayouts)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Rules Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Payment System Rules
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-semibold">Payment Split:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• System Commission: 15%</li>
                <li>• PayHere Transaction Fee: 3.30%</li>
                <li>• Driver Earnings: ~81.7%</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Payment Schedule:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Minimum upfront: 25%</li>
                <li>• Balance due: 2 days before trip ends</li>
                <li>• Reminders: 3 days & 1 day before due date</li>
                <li>• Auto-suspension if payment not made</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentDashboard;
