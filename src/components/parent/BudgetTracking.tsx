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
  BarChart3,
  Trash2
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
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState<BudgetLimit | null>(null);
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

  const handleDeleteBudget = (budget: BudgetLimit) => {
    setBudgetToDelete(budget);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteBudget = async () => {
    if (!budgetToDelete) return;

    try {
      await BudgetTrackingService.deleteBudgetLimit(budgetToDelete.id);
      
      toast({
        title: "Success",
        description: "Budget limit deleted successfully"
      });

      setIsDeleteModalOpen(false);
      setBudgetToDelete(null);
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete budget limit",
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
      <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <DollarSign className="w-7 h-7 text-green-600" />
          <h2 className="text-2xl font-bold text-gray-900">Budget Tracking</h2>
        </div>
        <div className="flex gap-3">
          <Input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-40 border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 font-medium"
          />
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
                <Plus className="w-4 h-4" />
                Set Budget Limit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-white border border-gray-200 shadow-lg">
              <DialogHeader className="border-b border-gray-100 pb-4">
                <DialogTitle className="text-xl font-bold text-gray-900">Set Budget Limit</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 pt-4">
                <div>
                  <Label className="text-sm font-semibold text-gray-800 mb-2 block">Select Child</Label>
                  <select
                    value={selectedChildId}
                    onChange={(e) => setSelectedChildId(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-white border-2 border-gray-300 rounded-lg text-gray-900 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors"
                  >
                    <option value="" className="text-gray-600">Choose a child</option>
                    {children.map(child => (
                      <option key={child.id} value={child.id} className="text-gray-900 font-medium">
                        {child.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="monthlyLimit" className="text-sm font-semibold text-gray-800 mb-2 block">
                    Monthly Limit (LKR)
                  </Label>
                  <Input
                    id="monthlyLimit"
                    type="number"
                    value={monthlyLimit}
                    onChange={(e) => setMonthlyLimit(Number(e.target.value))}
                    min="0"
                    step="100"
                    className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 font-medium"
                  />
                </div>

                <div>
                  <Label htmlFor="warningThreshold" className="text-sm font-semibold text-gray-800 mb-2 block">
                    Warning Threshold (%)
                  </Label>
                  <Input
                    id="warningThreshold"
                    type="number"
                    value={warningThreshold}
                    onChange={(e) => setWarningThreshold(Number(e.target.value))}
                    min="1"
                    max="100"
                    className="border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 font-medium"
                  />
                  <p className="text-sm text-gray-700 mt-2 bg-blue-50 p-2 rounded-md border-l-4 border-blue-400">
                    Get notified when {warningThreshold}% of budget is used
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-semibold text-gray-800 mb-3 block">Notification Settings</Label>
                  <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={notifications.warningEnabled}
                        onChange={(e) => setNotifications({
                          ...notifications,
                          warningEnabled: e.target.checked
                        })}
                        className="w-4 h-4 text-blue-600 bg-white border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="text-sm font-medium text-gray-800 group-hover:text-blue-600 transition-colors">
                        Warning notifications
                      </span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={notifications.limitReachedEnabled}
                        onChange={(e) => setNotifications({
                          ...notifications,
                          limitReachedEnabled: e.target.checked
                        })}
                        className="w-4 h-4 text-blue-600 bg-white border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="text-sm font-medium text-gray-800 group-hover:text-blue-600 transition-colors">
                        Limit reached notifications
                      </span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={notifications.weeklyReportEnabled}
                        onChange={(e) => setNotifications({
                          ...notifications,
                          weeklyReportEnabled: e.target.checked
                        })}
                        className="w-4 h-4 text-blue-600 bg-white border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="text-sm font-medium text-gray-800 group-hover:text-blue-600 transition-colors">
                        Weekly reports
                      </span>
                    </label>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <Button 
                    onClick={createBudgetLimit} 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    Set Budget Limit
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Budget Summary */}
      {budgetSummary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <DollarSign className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Total Monthly Budget</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(budgetSummary.totalMonthlyLimit)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Current Spending</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(budgetSummary.totalCurrentSpent)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <BarChart3 className="w-8 h-8 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Remaining Budget</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(budgetSummary.totalMonthlyLimit - budgetSummary.totalCurrentSpent)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Individual Child Budgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {budgetSummary?.childrenBudgets.map((budget: any) => (
          <Card key={budget.childId} className="border-2 border-blue-200 shadow-sm hover:shadow-md transition-shadow bg-white">
            <CardHeader className="bg-blue-50 border-b border-blue-100">
              <CardTitle className="flex items-center justify-between">
                <span className="text-lg font-bold text-gray-900">{budget.childName}</span>
                <div className="flex items-center gap-3">
                  {getStatusIcon(budget.status)}
                  <Badge 
                    variant={budget.status === 'exceeded' ? 'destructive' : 'secondary'}
                    className="font-semibold px-3 py-1"
                  >
                    {budget.percentageUsed}%
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const budgetLimit = budgetLimits.find(bl => bl.childId === budget.childId);
                      if (budgetLimit) handleDeleteBudget(budgetLimit);
                    }}
                    className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 hover:text-red-700 ml-2"
                    title="Delete budget limit"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm font-semibold mb-2">
                    <span className="text-gray-800">Monthly Budget</span>
                    <span className="text-gray-900">{formatCurrency(budget.monthlyLimit)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold mb-3">
                    <span className="text-gray-800">Current Spending</span>
                    <span className={`font-bold ${getStatusColor(budget.status)}`}>
                      {formatCurrency(budget.currentSpent)}
                    </span>
                  </div>
                  <div className="bg-gray-100 rounded-full p-1">
                    <Progress 
                      value={Math.min(budget.percentageUsed, 100)} 
                      className="h-3"
                    />
                  </div>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg border-l-4 border-blue-400">
                  <p className={`text-sm font-semibold ${getStatusColor(budget.status)}`}>
                    {budget.status === 'safe' && '✓ Budget is on track'}
                    {budget.status === 'warning' && '⚠ Approaching budget limit'}
                    {budget.status === 'exceeded' && `⚠ Exceeded by ${formatCurrency(budget.currentSpent - budget.monthlyLimit)}`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {budgetLimits.length === 0 && (
        <Card className="border-2 border-dashed border-blue-200 bg-blue-50">
          <CardContent className="text-center py-12">
            <div className="p-4 bg-blue-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <DollarSign className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">No Budget Limits Set</h3>
            <p className="text-gray-700 font-medium mb-6 max-w-md mx-auto">
              Set monthly spending limits for your children's transportation to keep track of expenses
            </p>
            <Button 
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
            >
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Delete Budget Limit
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700 mb-4">
              Are you sure you want to delete the budget limit for{' '}
              <span className="font-semibold">{budgetToDelete ? getChildName(budgetToDelete.childId) : ''}</span>?
            </p>
            <p className="text-sm text-gray-500">
              This action cannot be undone. All budget history and expense tracking for this child will be permanently removed.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteBudget}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Budget
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};