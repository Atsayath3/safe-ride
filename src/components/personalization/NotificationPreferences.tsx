import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Bell, Clock, MapPin, MessageSquare, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface NotificationSettings {
  rideReminders: boolean;
  rideReminderTime: number; // minutes before
  locationSharing: boolean;
  emergencyAlerts: boolean;
  driverUpdates: boolean;
  parentUpdates: boolean;
  bookingConfirmations: boolean;
  routeChanges: boolean;
  weatherAlerts: boolean;
  trafficAlerts: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  communicationMethod: 'push' | 'sms' | 'email' | 'whatsapp';
}

const NotificationPreferences: React.FC = () => {
  const { userProfile, updateUserProfile } = useAuth();
  const [settings, setSettings] = useState<NotificationSettings>({
    rideReminders: true,
    rideReminderTime: 15,
    locationSharing: true,
    emergencyAlerts: true,
    driverUpdates: true,
    parentUpdates: true,
    bookingConfirmations: true,
    routeChanges: true,
    weatherAlerts: false,
    trafficAlerts: false,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '07:00'
    },
    communicationMethod: 'push'
  });

  useEffect(() => {
    if (userProfile?.notificationSettings) {
      setSettings(userProfile.notificationSettings);
    }
  }, [userProfile]);

  const handleSave = async () => {
    try {
      await updateUserProfile({ notificationSettings: settings });
      toast({
        title: "Preferences Saved",
        description: "Your notification preferences have been updated",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save preferences",
        variant: "destructive"
      });
    }
  };

  const updateSetting = (key: keyof NotificationSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const getNotificationOptions = () => {
    if (userProfile?.role === 'parent') {
      return [
        { key: 'rideReminders', label: 'Ride Reminders', icon: Clock, description: 'Get notified before scheduled rides' },
        { key: 'locationSharing', label: 'Live Location Updates', icon: MapPin, description: 'Receive real-time location of your child' },
        { key: 'emergencyAlerts', label: 'Emergency Alerts', icon: Shield, description: 'Immediate alerts for emergency situations' },
        { key: 'driverUpdates', label: 'Driver Communications', icon: MessageSquare, description: 'Messages from your assigned driver' },
        { key: 'bookingConfirmations', label: 'Booking Confirmations', icon: Bell, description: 'Confirmations for new bookings' },
        { key: 'routeChanges', label: 'Route Changes', icon: MapPin, description: 'Notifications when routes are modified' },
        { key: 'weatherAlerts', label: 'Weather Alerts', icon: Bell, description: 'Weather-related ride notifications' },
        { key: 'trafficAlerts', label: 'Traffic Updates', icon: MapPin, description: 'Traffic delays and alternate routes' }
      ];
    } else {
      return [
        { key: 'parentUpdates', label: 'Parent Communications', icon: MessageSquare, description: 'Messages from parents' },
        { key: 'bookingConfirmations', label: 'New Booking Alerts', icon: Bell, description: 'Notifications for new ride requests' },
        { key: 'routeChanges', label: 'Route Updates', icon: MapPin, description: 'Changes to your assigned routes' },
        { key: 'emergencyAlerts', label: 'Emergency Situations', icon: Shield, description: 'Critical safety alerts' },
        { key: 'trafficAlerts', label: 'Traffic Updates', icon: MapPin, description: 'Real-time traffic conditions' },
        { key: 'weatherAlerts', label: 'Weather Conditions', icon: Bell, description: 'Weather affecting driving conditions' }
      ];
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Notification Types */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Notification Types</h3>
            {getNotificationOptions().map((option) => {
              const IconComponent = option.icon;
              return (
                <div key={option.key} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <IconComponent className="w-5 h-5 text-blue-600" />
                    <div>
                      <Label className="font-medium">{option.label}</Label>
                      <p className="text-sm text-gray-600">{option.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings[option.key as keyof NotificationSettings] as boolean}
                    onCheckedChange={(checked) => updateSetting(option.key as keyof NotificationSettings, checked)}
                  />
                </div>
              );
            })}
          </div>

          {/* Ride Reminder Timing */}
          {userProfile?.role === 'parent' && settings.rideReminders && (
            <div className="space-y-2">
              <Label className="font-medium">Ride Reminder Timing</Label>
              <Select
                value={settings.rideReminderTime.toString()}
                onValueChange={(value) => updateSetting('rideReminderTime', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 minutes before</SelectItem>
                  <SelectItem value="10">10 minutes before</SelectItem>
                  <SelectItem value="15">15 minutes before</SelectItem>
                  <SelectItem value="30">30 minutes before</SelectItem>
                  <SelectItem value="60">1 hour before</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Communication Method */}
          <div className="space-y-2">
            <Label className="font-medium">Preferred Communication Method</Label>
            <Select
              value={settings.communicationMethod}
              onValueChange={(value) => updateSetting('communicationMethod', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="push">Push Notifications</SelectItem>
                <SelectItem value="sms">SMS Messages</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quiet Hours */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="font-medium">Do Not Disturb Hours</Label>
              <Switch
                checked={settings.quietHours.enabled}
                onCheckedChange={(checked) => 
                  updateSetting('quietHours', { ...settings.quietHours, enabled: checked })
                }
              />
            </div>
            {settings.quietHours.enabled && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Start Time</Label>
                  <input
                    type="time"
                    value={settings.quietHours.start}
                    onChange={(e) => 
                      updateSetting('quietHours', { ...settings.quietHours, start: e.target.value })
                    }
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <Label className="text-sm">End Time</Label>
                  <input
                    type="time"
                    value={settings.quietHours.end}
                    onChange={(e) => 
                      updateSetting('quietHours', { ...settings.quietHours, end: e.target.value })
                    }
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
            )}
          </div>

          <Button onClick={handleSave} className="w-full">
            Save Preferences
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationPreferences;