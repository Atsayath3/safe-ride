import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  updateDoc, 
  doc, 
  onSnapshot, 
  Timestamp,
  getDoc 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import PushNotificationService from './pushNotificationService';

export interface Notification {
  id: string;
  recipientId: string;
  senderId: string;
  type: 'attendance' | 'trip_end' | 'booking' | 'approval' | 'emergency_sos' | 'driver_verification';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: Date;
}

export class NotificationService {
  // Helper method to send both in-app and push notifications
  private static async sendNotification(
    recipientId: string,
    senderId: string,
    type: Notification['type'],
    title: string,
    message: string,
    data?: any
  ): Promise<void> {
    try {
      // Create in-app notification
      const notification = {
        recipientId,
        senderId,
        type,
        title,
        message,
        data,
        read: false,
        createdAt: new Date()
      };

      const docRef = await addDoc(collection(db, 'notifications'), notification);
      console.log('✅ In-app notification created:', docRef.id);

      // Send push notification
      await PushNotificationService.sendPushNotification(recipientId, {
        title,
        body: message,
        icon: '/favicon.png',
        data: {
          type,
          notificationId: docRef.id,
          senderId,
          ...data
        },
        requireInteraction: type === 'emergency_sos' // Make emergency notifications persistent
      });

      console.log('📱 Push notification sent to:', recipientId);
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  // Send emergency SOS alert to all parents in a ride
  static async sendEmergencySOSAlert(
    rideId: string,
    driverId: string,
    parentIds: string[],
    driverName: string,
    location?: { lat: number; lng: number; address?: string }
  ): Promise<void> {
    try {
      console.log('🚨 Sending emergency SOS alerts...');
      
      // Contact emergency service (developer's number)
      const emergencyNumber = '+94740464232';
      const emergencyMessage = `EMERGENCY SOS ALERT! Driver ${driverName} (ID: ${driverId}) has triggered an emergency alert during ride ${rideId}. ${location ? `Location: ${location.address || `${location.lat}, ${location.lng}`}` : 'Location not available'}. Please respond immediately.`;
      
      // Try to initiate emergency call/SMS (this would need proper SMS service integration)
      console.log(`📞 Emergency contact: ${emergencyNumber}`);
      console.log(`📱 Emergency message: ${emergencyMessage}`);
      
      // For now, we'll use browser's tel: protocol to initiate call
      if (typeof window !== 'undefined') {
        // Open phone app with emergency number
        window.open(`tel:${emergencyNumber}`, '_blank');
      }

      // Send notifications to all parents in the ride
      const notificationPromises = parentIds.map(parentId => 
        this.sendNotification(
          parentId,
          driverId,
          'emergency_sos',
          '🚨 EMERGENCY SOS ALERT',
          `Driver ${driverName} has triggered an emergency alert during your child's ride. Emergency services have been contacted. We will update you as soon as possible.`,
          {
            rideId,
            driverId,
            location,
            timestamp: new Date().toISOString(),
            emergencyContactNumber: emergencyNumber
          }
        )
      );

      await Promise.all(notificationPromises);
      
      console.log(`✅ Emergency SOS alerts sent to ${parentIds.length} parents`);
      
      // Also log the emergency event for tracking
      await addDoc(collection(db, 'emergency_alerts'), {
        rideId,
        driverId,
        driverName,
        parentIds,
        location,
        emergencyContactNumber: emergencyNumber,
        message: emergencyMessage,
        createdAt: Timestamp.fromDate(new Date()),
        status: 'active'
      });

    } catch (error) {
      console.error('Error sending emergency SOS alerts:', error);
      throw error;
    }
  }

  // Send attendance notification
  static async sendAttendanceNotification(
    parentId: string,
    driverId: string,
    childId: string,
    childName: string,
    status: 'present' | 'absent'
  ): Promise<void> {
    try {
      const title = status === 'present' ? '✅ Child Picked Up' : '❌ Child Absent';
      const message = status === 'present' 
        ? `${childName} has been safely picked up by the driver.`
        : `${childName} was marked as absent and not picked up.`;

      await this.sendNotification(
        parentId,
        driverId,
        'attendance',
        title,
        message,
        {
          childId,
          childName,
          status,
          timestamp: new Date().toISOString()
        }
      );
    } catch (error) {
      console.error('Error sending attendance notification:', error);
      throw error;
    }
  }

  // Send trip completion notification
  static async sendTripEndNotification(
    parentId: string,
    driverId: string,
    rideId: string,
    routeName: string,
    childName: string
  ): Promise<void> {
    try {
      await this.sendNotification(
        parentId,
        driverId,
        'trip_end',
        '🏁 Trip Completed',
        `${childName}'s trip on ${routeName} has been completed successfully.`,
        {
          rideId,
          routeName,
          childName,
          timestamp: new Date().toISOString()
        }
      );
    } catch (error) {
      console.error('Error sending trip end notification:', error);
      throw error;
    }
  }

  // Send driver verification notification to all admins
  static async sendDriverVerificationNotification(
    driverId: string,
    driverName: string,
    driverEmail: string
  ): Promise<void> {
    try {
      console.log('📋 Sending driver verification notifications to admins...');
      
      // Get all admin users
      const adminsQuery = query(
        collection(db, 'admins'),
        where('role', '==', 'admin')
      );
      
      const adminSnapshot = await getDocs(adminsQuery);
      const adminIds = adminSnapshot.docs.map(doc => doc.id);
      
      if (adminIds.length === 0) {
        console.warn('No admin users found to notify');
        return;
      }

      // Send notification to all admins
      const notificationPromises = adminIds.map(adminId => 
        this.sendNotification(
          adminId,
          driverId,
          'driver_verification',
          '🚗 New Driver Verification Required',
          `Driver ${driverName} (${driverEmail}) has completed their registration and uploaded all required documents. Please review and verify their application.`,
          {
            driverId,
            driverName,
            driverEmail,
            timestamp: new Date().toISOString(),
            verificationStatus: 'pending'
          }
        )
      );

      await Promise.all(notificationPromises);
      
      console.log(`✅ Driver verification notifications sent to ${adminIds.length} admin(s)`);

    } catch (error) {
      console.error('Error sending driver verification notifications:', error);
      throw error;
    }
  }

  // Create a notification document
  private static async createNotification(notification: Omit<Notification, 'id' | 'read' | 'createdAt'>): Promise<void> {
    try {
      await addDoc(collection(db, 'notifications'), {
        ...notification,
        read: false,
        createdAt: Timestamp.fromDate(new Date())
      });
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Get notifications for a user
  static async getNotifications(userId: string): Promise<Notification[]> {
    try {
      // Temporary fallback while index is building
      const q = query(
        collection(db, 'notifications'),
        where('recipientId', '==', userId)
      );

      const snapshot = await getDocs(q);
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as Notification[];

      // Sort manually in JavaScript while index is building
      return notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error('Error getting notifications:', error);
      throw error;
    }
  }

  // Get driver verification notifications for admins
  static async getDriverVerificationNotifications(): Promise<Notification[]> {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('type', '==', 'driver_verification'),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as Notification[];
    } catch (error) {
      console.error('Error getting driver verification notifications:', error);
      throw error;
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Subscribe to real-time notifications
  static subscribeToNotifications(
    userId: string, 
    callback: (notifications: Notification[]) => void
  ): () => void {
    // Temporary fallback while index is building
    const q = query(
      collection(db, 'notifications'),
      where('recipientId', '==', userId)
    );

    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as Notification[];

      // Sort manually in JavaScript while index is building
      const sortedNotifications = notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      callback(sortedNotifications);
    }, (error) => {
      console.error('Error in notifications subscription:', error);
    });
  }
}

export const notificationService = NotificationService;
