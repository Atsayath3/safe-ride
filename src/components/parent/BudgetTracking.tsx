import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { toast } from '../../hooks/use-toast';
import { 
  DollarSign, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle,
  Edit,
  BarChart3
} from 'lucide-react';
import { BudgetLimit, MonthlyExpense } from '../../interfaces/personalization';
import { BudgetTrackingService } from '../../services/budgetTrackingService';

interface BudgetTrackingProps {
  parentId: string;
  children: { id: string; name: string; school: string }[];
}

export const BudgetTracking: React.FC<BudgetTrackingProps> = ({ parentId, children }) => {
  const [budgetLimits, setBudgetLimits] = useState<BudgetLimit[]>([]);
  const [monthlyExpenses, setMonthlyExpenses] = useState<MonthlyExpense[]>([]);
  const [budgetSummary, setBudgetSummary] = useState<any>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  // Form states
  const [selectedChildId, setSelectedChildId] = useState('');
  const [monthlyLimit, setMonthlyLimit] = useState<number>(5000);
  const [warningThreshold, setWarningThreshold] = useState<number>(80);
  const [notifications, setNotifications] = useState({
    warningEnabled: true,
    limitReachedEnabled: true,
    weeklyReportEnabled: true
  });

  useEffect(() => {
    loadData();
  }, [parentId, selectedMonth]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [limits, expenses, summary] = await Promise.all([
        BudgetTrackingService.getBudgetLimits(parentId),
        BudgetTrackingService.getAllMonthlyExpenses(parentId, selectedMonth),
        BudgetTrackingService.getBudgetSummary(parentId)
      ]);
      setBudgetLimits(limits);
      setMonthlyExpenses(expenses);
      setBudgetSummary(summary);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load budget data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createBudgetLimit = async () => {
    if (!selectedChildId || monthlyLimit <= 0) {
      toast({
        title: "Validation Error",
        description: "Please select a child and enter a valid monthly limit",
        variant: "destructive"
      });
      return;
    }

    try {
      await BudgetTrackingService.createBudgetLimit({
        childId: selectedChildId,
        parentId,
        monthlyLimit,
        currentSpent: 0,
        warningThreshold,
        isActive: true,
        notifications
      });

      toast({
        title: "Success",
        description: "Budget limit created successfully"
      });

      // Reset form
      setSelectedChildId('');
      setMonthlyLimit(5000);
      setWarningThreshold(80);
      setIsCreateModalOpen(false);
      
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create budget limit",
        variant: "destructive"
      });
    }
  };

  const getChildName = (childId: string) => {
    return children.find(child => child.id === childId)?.name || 'Unknown';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'safe': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'exceeded': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default: return <CheckCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'safe': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'exceeded': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const formatCurrency = (amount: number) => {
    return `LKR ${amount.toLocaleString()}`;
  };

  if (loading) {
    return <div className="p-4">Loading budget tracking...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-green-600" />
          <h2 className="text-2xl font-bold">Budget Tracking</h2>
        </div>
        <div className="flex gap-2">
          <Input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-40"
          />
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Set Budget Limit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Set Budget Limit</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Select Child</Label>
                  <select
                    value={selectedChildId}
                    onChange={(e) => setSelectedChildId(e.target.value)}
                    className="w-full mt-1 p-2 border rounded-md"
                  >
                    <option value="">Choose a child</option>
                    {children.map(child => (
                      <option key={child.id} value={child.id}>
                        {child.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="monthlyLimit">Monthly Limit (LKR)</Label>
                  <Input
                    id="monthlyLimit"
                    type="number"
                    value={monthlyLimit}
                    onChange={(e) => setMonthlyLimit(Number(e.target.value))}
                    min="0"
                    step="100"
                  />
                </div>

                <div>
                  <Label htmlFor="warningThreshold">Warning Threshold (%)</Label>
                  <Input
                    id="warningThreshold"
                    type="number"
                    value={warningThreshold}
                    onChange={(e) => setWarningThreshold(Number(e.target.value))}
                    min="1"
                    max="100"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Get notified when {warningThreshold}% of budget is used
                  </p>
                </div>

                <div>
                  <Label>Notifications</Label>
                  <div className="space-y-2 mt-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={notifications.warningEnabled}
                        onChange={(e) => setNotifications({
                          ...notifications,
                          warningEnabled: e.target.checked
                        })}
                      />
                      <span className="text-sm">Warning notifications</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={notifications.limitReachedEnabled}
                        onChange={(e) => setNotifications({
                          ...notifications,
                          limitReachedEnabled: e.target.checked
                        })}
                      />
                      <span className="text-sm">Limit reached notifications</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={notifications.weeklyReportEnabled}
                        onChange={(e) => setNotifications({
                          ...notifications,
                          weeklyReportEnabled: e.target.checked
                        })}
                      />
                      <span className="text-sm">Weekly reports</span>
                    </label>
                  </div>
                </div>

                <Button onClick={createBudgetLimit} className="w-full">
                  Set Budget Limit
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Budget Summary */}
      {budgetSummary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <DollarSign className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Monthly Budget</p>
                  <p className="text-2xl font-bold">{formatCurrency(budgetSummary.totalMonthlyLimit)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Current Spending</p>
                  <p className="text-2xl font-bold">{formatCurrency(budgetSummary.totalCurrentSpent)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Remaining Budget</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(budgetSummary.totalMonthlyLimit - budgetSummary.totalCurrentSpent)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Individual Child Budgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {budgetSummary?.childrenBudgets.map((budget: any) => (
          <Card key={budget.childId} className="border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{budget.childName}</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(budget.status)}
                  <Badge variant={budget.status === 'exceeded' ? 'destructive' : 'secondary'}>
                    {budget.percentageUsed}%
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Monthly Budget</span>
                    <span>{formatCurrency(budget.monthlyLimit)}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Current Spending</span>
                    <span className={getStatusColor(budget.status)}>
                      {formatCurrency(budget.currentSpent)}
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(budget.percentageUsed, 100)} 
                    className="h-2"
                  />
                </div>
                
                <div className="text-sm">
                  <p className={getStatusColor(budget.status)}>
                    {budget.status === 'safe' && 'Budget is on track'}
                    {budget.status === 'warning' && 'Approaching budget limit'}
                    {budget.status === 'exceeded' && `Exceeded by ${formatCurrency(budget.currentSpent - budget.monthlyLimit)}`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {budgetLimits.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Budget Limits Set</h3>
            <p className="text-gray-600 mb-4">Set monthly spending limits for your children's transportation</p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Set Your First Budget Limit
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Monthly Expenses Detail */}
      {monthlyExpenses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Expenses Detail</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {monthlyExpenses.map(expense => (
                <div key={expense.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium">{getChildName(expense.childId)}</h4>
                      <p className="text-sm text-gray-600">
                        {expense.rideCount} rides this month
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{formatCurrency(expense.totalAmount)}</p>
                      <p className="text-sm text-gray-600">
                        Avg: {formatCurrency(expense.averageCostPerRide)}/ride
                      </p>
                    </div>
                  </div>
                  
                  {expense.expenses.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Recent Rides:</p>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {expense.expenses.slice(0, 5).map((ride, index) => (
                          <div key={index} className="flex justify-between text-xs bg-gray-50 p-2 rounded">
                            <div>
                              <p>{ride.date.toLocaleDateString()}</p>
                              <p className="text-gray-600">{ride.route}</p>
                            </div>
                            <div className="text-right">
                              <p>{formatCurrency(ride.amount)}</p>
                              <p className="text-gray-600">{ride.driverName}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};