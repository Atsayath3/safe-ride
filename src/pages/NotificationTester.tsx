import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle, Phone, Calendar, UserCheck, Car, Bell, Smartphone } from 'lucide-react';
import { notificationService, type Notification as AppNotification } from '@/services/notificationService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import PushNotificationSettings from '@/components/PushNotificationSettings';
import PushNotificationService from '@/services/pushNotificationService';

const NotificationTester = () => {
  const { userProfile } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [testUserId, setTestUserId] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Test data for different notification types
  const [testData, setTestData] = useState({
    parentId: '',
    driverId: '',
    childId: 'test-child-123',
    childName: 'Test Child',
    rideId: 'test-ride-456',
    routeName: 'Home to School Route',
    driverName: 'John Driver',
    driverEmail: 'john@driver.com',
    bookingId: 'test-booking-789'
  });

  useEffect(() => {
    if (userProfile) {
      setTestData(prev => ({
        ...prev,
        parentId: userProfile.uid,
        driverId: userProfile.uid
      }));
      setTestUserId(userProfile.uid);
    }
  }, [userProfile]);

  const loadNotifications = async () => {
    if (!testUserId) return;
    
    setRefreshing(true);
    try {
      const userNotifications = await notificationService.getNotifications(testUserId);
      setNotifications(userNotifications);
      toast({
        title: "Notifications Loaded",
        description: `Found ${userNotifications.length} notifications`
      });
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast({
        title: "Error",
        description: "Failed to load notifications",
        variant: "destructive"
      });
    } finally {
      setRefreshing(false);
    }
  };

  const sendTestNotification = async (type: string) => {
    if (!userProfile) {
      toast({
        title: "Error",
        description: "Please log in to test notifications",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      switch (type) {
        case 'attendance':
          await notificationService.sendAttendanceNotification(
            testData.parentId,
            testData.driverId,
            testData.childId,
            testData.childName,
            'present'
          );
          break;

        case 'attendance_absent':
          await notificationService.sendAttendanceNotification(
            testData.parentId,
            testData.driverId,
            testData.childId,
            testData.childName,
            'absent'
          );
          break;

        case 'trip_end':
          await notificationService.sendTripEndNotification(
            testData.parentId,
            testData.driverId,
            testData.rideId,
            testData.routeName,
            testData.childName
          );
          break;

        case 'emergency_sos':
          await notificationService.sendEmergencySOSAlert(
            testData.rideId,
            testData.driverId,
            [testData.parentId],
            testData.driverName,
            { lat: 6.9271, lng: 79.8612, address: 'Colombo, Sri Lanka' }
          );
          break;

        case 'driver_verification':
          await notificationService.sendDriverVerificationNotification(
            testData.driverId,
            testData.driverName,
            testData.driverEmail
          );
          break;

        case 'push_test':
          // Test push notification directly
          await PushNotificationService.sendPushNotification(
            testData.parentId,
            {
              title: '🧪 Push Notification Test',
              body: 'This is a test push notification to verify the system is working!',
              icon: '/favicon.png',
              data: {
                type: 'test',
                timestamp: new Date().toISOString()
              },
              requireInteraction: true
            }
          );
          
          // Also show browser notification for immediate feedback
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('🧪 Direct Browser Test', {
              body: 'This notification was sent directly through the browser API',
              icon: '/favicon.png'
            });
          }
          break;

        default:
          throw new Error('Unknown notification type');
      }

      toast({
        title: "Test Notification Sent!",
        description: `${type} notification sent successfully`
      });

      // Auto-refresh notifications after sending
      setTimeout(() => {
        loadNotifications();
      }, 1000);

    } catch (error: any) {
      console.error('Error sending test notification:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send notification",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      toast({
        title: "Marked as Read",
        description: "Notification marked as read"
      });
      loadNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark as read",
        variant: "destructive"
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'attendance':
        return <UserCheck className="h-4 w-4" />;
      case 'trip_end':
        return <CheckCircle className="h-4 w-4" />;
      case 'emergency_sos':
        return <Phone className="h-4 w-4" />;
      case 'driver_verification':
        return <Car className="h-4 w-4" />;
      case 'booking':
        return <Calendar className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'attendance':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'trip_end':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'emergency_sos':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'driver_verification':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'booking':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Push Notification Settings */}
      <PushNotificationSettings />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification System Tester
          </CardTitle>
          <p className="text-sm text-gray-600">
            Test all notification types and verify they're working correctly
          </p>
        </CardHeader>
      </Card>

      {/* Test Data Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Test Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="userId">Test User ID (Recipient)</Label>
              <Input
                id="userId"
                value={testUserId}
                onChange={(e) => setTestUserId(e.target.value)}
                placeholder="Enter user ID to receive notifications"
              />
            </div>
            <div>
              <Label htmlFor="driverName">Driver Name</Label>
              <Input
                id="driverName"
                value={testData.driverName}
                onChange={(e) => setTestData(prev => ({...prev, driverName: e.target.value}))}
                placeholder="Driver name for tests"
              />
            </div>
            <div>
              <Label htmlFor="childName">Child Name</Label>
              <Input
                id="childName"
                value={testData.childName}
                onChange={(e) => setTestData(prev => ({...prev, childName: e.target.value}))}
                placeholder="Child name for tests"
              />
            </div>
            <div>
              <Label htmlFor="routeName">Route Name</Label>
              <Input
                id="routeName"
                value={testData.routeName}
                onChange={(e) => setTestData(prev => ({...prev, routeName: e.target.value}))}
                placeholder="Route name for tests"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Send Test Notifications</CardTitle>
          <p className="text-sm text-gray-600">
            Click each button to test different notification types
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Button
              onClick={() => sendTestNotification('attendance')}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              <UserCheck className="h-4 w-4 mr-2" />
              Attendance (Present)
            </Button>

            <Button
              onClick={() => sendTestNotification('attendance_absent')}
              disabled={loading}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Attendance (Absent)
            </Button>

            <Button
              onClick={() => sendTestNotification('trip_end')}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Trip Completed
            </Button>

            <Button
              onClick={() => sendTestNotification('emergency_sos')}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              <Phone className="h-4 w-4 mr-2" />
              Emergency SOS
            </Button>

            <Button
              onClick={() => sendTestNotification('driver_verification')}
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Car className="h-4 w-4 mr-2" />
              Driver Verification
            </Button>

            <Button
              onClick={() => sendTestNotification('push_test')}
              disabled={loading}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <Smartphone className="h-4 w-4 mr-2" />
              Test Push Notification
            </Button>

            <Button
              onClick={loadNotifications}
              disabled={refreshing}
              variant="outline"
            >
              <Bell className="h-4 w-4 mr-2" />
              {refreshing ? 'Loading...' : 'Refresh Notifications'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Display Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Received Notifications ({notifications.length})</CardTitle>
          <p className="text-sm text-gray-600">
            All notifications for user: {testUserId}
          </p>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No notifications found</p>
              <p className="text-sm">Send a test notification to see it here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`border rounded-lg p-4 ${
                    notification.read ? 'bg-gray-50' : 'bg-white border-l-4 border-l-blue-500'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full ${getNotificationColor(notification.type)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{notification.title}</h4>
                          <Badge variant="outline" className="text-xs">
                            {notification.type.replace('_', ' ')}
                          </Badge>
                          {!notification.read && (
                            <Badge className="bg-blue-100 text-blue-800 text-xs">NEW</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{notification.message}</p>
                        <div className="text-xs text-gray-500">
                          {format(notification.createdAt, 'PPp')}
                        </div>
                        {notification.data && (
                          <details className="mt-2">
                            <summary className="text-xs text-blue-600 cursor-pointer">
                              View Details
                            </summary>
                            <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                              {JSON.stringify(notification.data, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                    {!notification.read && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markAsRead(notification.id)}
                      >
                        Mark Read
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationTester;
