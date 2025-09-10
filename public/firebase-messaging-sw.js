// Firebase messaging service worker
import { initializeApp } from 'firebase/app';
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw';

const firebaseConfig = {
  apiKey: "AIzaSyCA4f6-PLWdvqPe0neE2f0T-JxTnpGUtsA",
  authDomain: "saferide-web.firebaseapp.com",
  projectId: "saferide-web",
  storageBucket: "saferide-web.firebasestorage.app",
  messagingSenderId: "558009930480",
  appId: "1:558009930480:web:b274294298871c4a8d2835",
  measurementId: "G-TTLKQGX5PX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging and get a reference to the service
const messaging = getMessaging(app);

// Handle background messages
onBackgroundMessage(messaging, (payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const { notification, data } = payload;
  
  if (!notification) return;

  const notificationTitle = notification.title || 'SafeWeb Notification';
  const notificationOptions = {
    body: notification.body,
    icon: notification.icon || '/favicon.png',
    badge: '/favicon.png',
    data: {
      ...data,
      url: data?.url || '/',
      notificationId: data?.notificationId || Date.now().toString()
    },
    tag: data?.notificationId || 'default',
    requireInteraction: data?.requireInteraction === 'true',
    silent: data?.silent === 'true'
  };

  // Show notification
  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received.');

  event.notification.close();

  const data = event.notification.data;
  const url = data?.url || '/';

  // Handle different notification actions
  if (event.action === 'view') {
    // Open the app and navigate to specific page
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            client.postMessage({
              type: 'NOTIFICATION_CLICK',
              data: data,
              url: url
            });
            return;
          }
        }
        
        // If app is not open, open it
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
    );
  } else if (event.action === 'dismiss') {
    // Just close the notification
    return;
  } else {
    // Default action - open app
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            client.postMessage({
              type: 'NOTIFICATION_CLICK',
              data: data,
              url: url
            });
            return;
          }
        }
        
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
    );
  }
});

// Handle push event
self.addEventListener('push', (event) => {
  console.log('[firebase-messaging-sw.js] Push event received:', event);
  
  if (!event.data) return;
  
  try {
    const payload = event.data.json();
    const { notification, data } = payload;
    
    if (notification) {
      const notificationTitle = notification.title || 'SafeWeb Notification';
      const notificationOptions = {
        body: notification.body,
        icon: notification.icon || '/favicon.png',
        badge: '/favicon.png',
        data: data,
        tag: data?.notificationId || 'default'
      };
      
      event.waitUntil(
        self.registration.showNotification(notificationTitle, notificationOptions)
      );
    }
  } catch (error) {
    console.error('[firebase-messaging-sw.js] Error handling push event:', error);
  }
});
