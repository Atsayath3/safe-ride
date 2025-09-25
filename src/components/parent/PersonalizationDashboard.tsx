import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Users, 
  DollarSign, 
  Star, 
  TrendingUp,
  Calendar,
  Shield,
  Heart,
  AlertTriangle
} from 'lucide-react';
import { SiblingCoordination } from './SiblingCoordination';
import { BudgetTracking } from './BudgetTracking';


interface PersonalizationDashboardProps {
  parentId: string;
  children: { id: string; name: string; school: string }[];
}

export const PersonalizationDashboard: React.FC<PersonalizationDashboardProps> = ({ 
  parentId, 
  children 
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data for overview - in real app, this would come from API
  const overviewStats = {
    siblingGroups: 2,
    totalBudget: 15000,
    currentSpending: 8500,

    averageRating: 4.7,
    recentAlerts: [
      { type: 'budget', message: 'Emma is approaching her monthly budget limit (85%)', severity: 'warning' },
      { type: 'driver', message: 'New driver available in your area - highly rated', severity: 'info' }
    ]
  };

  const formatCurrency = (amount: number) => {
    return `LKR ${amount.toLocaleString()}`;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'info': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'error': return <AlertTriangle className="w-4 h-4" />;
      case 'info': return <Star className="w-4 h-4" />;
      default: return <Star className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Personalization Dashboard</h1>
          <p className="text-gray-600">Manage your family's transportation preferences and settings</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="siblings" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Sibling Groups
            </TabsTrigger>
            <TabsTrigger value="budget" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Budget Tracking
            </TabsTrigger>

          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <Users className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Sibling Groups</p>
                      <p className="text-2xl font-bold">{overviewStats.siblingGroups}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-8 h-8 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600">Monthly Budget</p>
                      <p className="text-2xl font-bold">{formatCurrency(overviewStats.totalBudget)}</p>
                      <p className="text-xs text-gray-500">
                        {formatCurrency(overviewStats.currentSpending)} spent
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>



              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <Star className="w-8 h-8 text-yellow-600" />
                    <div>
                      <p className="text-sm text-gray-600">Average Rating</p>
                      <p className="text-2xl font-bold">{overviewStats.averageRating}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Alerts */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Alerts & Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {overviewStats.recentAlerts.map((alert, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className={`p-1 rounded ${getSeverityColor(alert.severity)}`}>
                        {getSeverityIcon(alert.severity)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">{alert.message}</p>
                        <p className="text-xs text-gray-500 mt-1">Just now</p>
                      </div>
                      <Badge className={getSeverityColor(alert.severity)}>
                        {alert.severity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    onClick={() => setActiveTab('siblings')}
                    className="flex items-center gap-2 h-auto p-4"
                    variant="outline"
                  >
                    <Users className="w-5 h-5" />
                    <div className="text-left">
                      <p className="font-medium">Create Sibling Group</p>
                      <p className="text-xs text-gray-600">Coordinate rides for multiple children</p>
                    </div>
                  </Button>

                  <Button 
                    onClick={() => setActiveTab('budget')}
                    className="flex items-center gap-2 h-auto p-4"
                    variant="outline"
                  >
                    <DollarSign className="w-5 h-5" />
                    <div className="text-left">
                      <p className="font-medium">Set Budget Limit</p>
                      <p className="text-xs text-gray-600">Control monthly spending per child</p>
                    </div>
                  </Button>


                </div>
              </CardContent>
            </Card>

            {/* Children Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Children Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {children.map(child => (
                    <div key={child.id} className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2">{child.name}</h4>
                      <p className="text-sm text-gray-600 mb-3">{child.school}</p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Sibling Groups:</span>
                          <Badge variant="secondary">1</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Budget Status:</span>
                          <Badge variant="secondary" className="bg-green-100 text-green-800">Safe</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Rides This Month:</span>
                          <Badge variant="secondary">12</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="siblings">
            <SiblingCoordination parentId={parentId} children={children} />
          </TabsContent>

          <TabsContent value="budget">
            <BudgetTracking parentId={parentId} children={children} />
          </TabsContent>


        </Tabs>
      </div>
    </div>
  );
};