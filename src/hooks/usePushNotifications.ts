import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import PushNotificationService from '@/services/pushNotificationService';

export interface PushNotificationStatus {
  isSupported: boolean;
  permission: NotificationPermission;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

export const usePushNotifications = () => {
  const { currentUser } = useAuth();
  const [status, setStatus] = useState<PushNotificationStatus>({
    isSupported: false,
    permission: 'default',
    token: null,
    isLoading: true,
    error: null
  });

  useEffect(() => {
    const initializePushNotifications = async () => {
      try {
        // Check if push notifications are supported
        const isSupported = PushNotificationService.isSupported();
        const permission = PushNotificationService.getPermissionStatus();

        setStatus(prev => ({
          ...prev,
          isSupported,
          permission,
          isLoading: false
        }));

        // If user is logged in and notifications are supported, set up messaging
        if (currentUser && isSupported) {
          // Listen for foreground messages
          const unsubscribe = PushNotificationService.onForegroundMessage((payload) => {
            console.log('Foreground message received:', payload);
            // Handle foreground message (you can add custom logic here)
          });

          // Listen for service worker messages (notification clicks)
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', (event) => {
              if (event.data?.type === 'NOTIFICATION_CLICK') {
                console.log('Notification clicked:', event.data);
                // Handle notification click (e.g., navigate to specific page)
                const url = event.data.url || '/';
                if (url !== window.location.pathname) {
                  window.location.href = url;
                }
              }
            });
          }

          return () => {
            unsubscribe();
          };
        }
      } catch (error) {
        console.error('Error initializing push notifications:', error);
        setStatus(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Unknown error',
          isLoading: false
        }));
      }
    };

    initializePushNotifications();
  }, [currentUser]);

  const requestPermission = async (): Promise<boolean> => {
    if (!currentUser) {
      setStatus(prev => ({ ...prev, error: 'User not logged in' }));
      return false;
    }

    try {
      setStatus(prev => ({ ...prev, isLoading: true, error: null }));

      const token = await PushNotificationService.requestPermission(currentUser.uid);
      
      if (token) {
        setStatus(prev => ({
          ...prev,
          permission: 'granted',
          token,
          isLoading: false
        }));
        return true;
      } else {
        setStatus(prev => ({
          ...prev,
          permission: PushNotificationService.getPermissionStatus(),
          isLoading: false,
          error: 'Failed to get FCM token'
        }));
        return false;
      }
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false
      }));
      return false;
    }
  };

  const disableNotifications = async (): Promise<void> => {
    if (!currentUser) return;

    try {
      await PushNotificationService.deleteToken();
      await PushNotificationService.removeTokenFromDatabase(currentUser.uid);
      
      setStatus(prev => ({
        ...prev,
        permission: 'denied',
        token: null
      }));
    } catch (error) {
      console.error('Error disabling notifications:', error);
      setStatus(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  };

  return {
    ...status,
    requestPermission,
    disableNotifications,
    hasPermission: status.permission === 'granted'
  };
};

export default usePushNotifications;
