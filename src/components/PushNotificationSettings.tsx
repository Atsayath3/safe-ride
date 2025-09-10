import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bell, BellOff, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import usePushNotifications from '@/hooks/usePushNotifications';

const PushNotificationSettings = () => {
  const {
    isSupported,
    permission,
    token,
    isLoading,
    error,
    hasPermission,
    requestPermission,
    disableNotifications
  } = usePushNotifications();

  const [actionLoading, setActionLoading] = useState(false);

  const handleEnableNotifications = async () => {
    setActionLoading(true);
    const success = await requestPermission();
    if (success) {
      console.log('✅ Push notifications enabled successfully');
    }
    setActionLoading(false);
  };

  const handleDisableNotifications = async () => {
    setActionLoading(true);
    await disableNotifications();
    console.log('❌ Push notifications disabled');
    setActionLoading(false);
  };

  const getPermissionBadge = () => {
    switch (permission) {
      case 'granted':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Enabled</Badge>;
      case 'denied':
        return <Badge variant="destructive"><BellOff className="w-3 h-3 mr-1" />Disabled</Badge>;
      default:
        return <Badge variant="secondary"><AlertTriangle className="w-3 h-3 mr-1" />Not Set</Badge>;
    }
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="w-5 h-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Receive real-time notifications about your child's rides
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>
              Push notifications are not supported in your browser. Please use a modern browser like Chrome, Firefox, or Safari.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Push Notifications
        </CardTitle>
        <CardDescription>
          Receive real-time notifications about your child's rides, attendance, and emergency alerts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Section */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Status</p>
            <p className="text-sm text-gray-600">Current notification permission</p>
          </div>
          {getPermissionBadge()}
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Token Status (for debugging) */}
        {token && (
          <div className="text-xs text-gray-500">
            <p>FCM Token: {token.substring(0, 20)}...</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          {!hasPermission ? (
            <Button 
              onClick={handleEnableNotifications}
              disabled={isLoading || actionLoading}
              className="w-full"
            >
              {(isLoading || actionLoading) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Bell className="w-4 h-4 mr-2" />
              Enable Push Notifications
            </Button>
          ) : (
            <Button 
              variant="outline"
              onClick={handleDisableNotifications}
              disabled={isLoading || actionLoading}
              className="w-full"
            >
              {(isLoading || actionLoading) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <BellOff className="w-4 h-4 mr-2" />
              Disable Push Notifications
            </Button>
          )}
        </div>

        {/* Information Section */}
        <div className="space-y-2 text-sm text-gray-600">
          <p className="font-medium">You will receive notifications for:</p>
          <ul className="space-y-1 ml-4">
            <li>• 👶 Child attendance updates (picked up/absent)</li>
            <li>• 🏁 Trip completion notifications</li>
            <li>• 🚨 Emergency SOS alerts</li>
            <li>• 📋 Important safety updates</li>
          </ul>
        </div>

        {/* Test Notification Button (for testing) */}
        {hasPermission && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              if ('Notification' in window) {
                new Notification('SafeWeb Test', {
                  body: 'Push notifications are working correctly!',
                  icon: '/favicon.png'
                });
              }
            }}
            className="w-full"
          >
            Send Test Notification
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default PushNotificationSettings;
