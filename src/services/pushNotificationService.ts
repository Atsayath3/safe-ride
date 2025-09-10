import { getToken, onMessage, deleteToken } from 'firebase/messaging';
import { messaging } from '@/lib/firebase';
import { db } from '@/lib/firebase';
import { doc, setDoc, deleteDoc, collection, addDoc } from 'firebase/firestore';

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: Record<string, any>;
  requireInteraction?: boolean;
  silent?: boolean;
}

export class PushNotificationService {
  // TODO: Replace with your actual VAPID key from Firebase Console
  // Go to: Firebase Console > Project Settings > Cloud Messaging > Web configuration
  private static vapidKey = 'YOUR_VAPID_KEY_HERE'; // Generate this in Firebase Console

  // Request notification permission and get FCM token
  static async requestPermission(userId: string): Promise<string | null> {
    try {
      if (!messaging) {
        console.warn('Firebase Messaging not supported');
        return null;
      }

      // Request notification permission
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        console.log('Notification permission granted.');
        
        // Get registration token
        const token = await getToken(messaging, {
          vapidKey: this.vapidKey
        });

        if (token) {
          console.log('FCM Registration Token:', token);
          
          // Store token in Firestore for this user
          await this.saveTokenToDatabase(userId, token);
          
          return token;
        } else {
          console.log('No registration token available.');
          return null;
        }
      } else {
        console.log('Unable to get permission to notify.');
        return null;
      }
    } catch (error) {
      console.error('Error getting notification permission:', error);
      return null;
    }
  }

  // Save FCM token to Firestore
  private static async saveTokenToDatabase(userId: string, token: string): Promise<void> {
    try {
      await setDoc(doc(db, 'fcm_tokens', userId), {
        token,
        userId,
        createdAt: new Date(),
        lastUpdated: new Date(),
        active: true
      });
      console.log('FCM token saved to database');
    } catch (error) {
      console.error('Error saving FCM token:', error);
    }
  }

  // Remove FCM token from database
  static async removeTokenFromDatabase(userId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'fcm_tokens', userId));
      console.log('FCM token removed from database');
    } catch (error) {
      console.error('Error removing FCM token:', error);
    }
  }

  // Delete FCM token (when user logs out or disables notifications)
  static async deleteToken(): Promise<void> {
    try {
      if (!messaging) return;
      
      await deleteToken(messaging);
      console.log('FCM token deleted');
    } catch (error) {
      console.error('Error deleting FCM token:', error);
    }
  }

  // Listen for foreground messages
  static onForegroundMessage(callback: (payload: any) => void): () => void {
    if (!messaging) {
      return () => {};
    }

    return onMessage(messaging, (payload) => {
      console.log('Message received in foreground:', payload);
      
      // Show custom notification in foreground
      this.showCustomNotification(payload);
      
      // Call callback with payload
      callback(payload);
    });
  }

  // Show custom notification when app is in foreground
  private static showCustomNotification(payload: any): void {
    const { notification, data } = payload;
    
    if (!notification) return;

    const notificationOptions: NotificationOptions = {
      body: notification.body,
      icon: notification.icon || '/favicon.png',
      badge: notification.badge || '/favicon.png',
      data: data,
      requireInteraction: data?.requireInteraction === 'true',
      silent: data?.silent === 'true',
      tag: data?.notificationId || 'default'
    };

    // Show notification
    if ('serviceWorker' in navigator && 'Notification' in window) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(notification.title, notificationOptions);
      });
    } else {
      // Fallback for browsers without service worker
      new Notification(notification.title, notificationOptions);
    }
  }

  // Send push notification via backend (you'll need to implement this in your backend)
  static async sendPushNotification(
    recipientId: string,
    payload: PushNotificationPayload
  ): Promise<void> {
    try {
      // In a real implementation, this would call your backend API
      // which would use the Firebase Admin SDK to send the notification
      
      // For now, we'll store the push notification request
      await addDoc(collection(db, 'push_notification_requests'), {
        recipientId,
        payload,
        createdAt: new Date(),
        status: 'pending'
      });

      console.log('Push notification request created:', { recipientId, payload });
      
      // TODO: Implement backend endpoint to process these requests
      console.warn('Backend implementation needed to actually send push notifications');
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }

  // Check if push notifications are supported
  static isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator && !!messaging;
  }

  // Get current notification permission status
  static getPermissionStatus(): NotificationPermission {
    return Notification.permission;
  }

  // Check if user has granted notification permission
  static hasPermission(): boolean {
    return this.getPermissionStatus() === 'granted';
  }
}

export default PushNotificationService;
