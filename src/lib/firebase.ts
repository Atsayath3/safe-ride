import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging, isSupported } from 'firebase/messaging';

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

// Initialize Firebase services
export const auth = getAuth(app);
auth.languageCode = 'it';
// To apply the default browser preference instead of explicitly setting it.
// auth.useDeviceLanguage();

export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize Firebase Cloud Messaging
let messaging: any = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      messaging = getMessaging(app);
    }
  });
}

export { messaging };

export default app;