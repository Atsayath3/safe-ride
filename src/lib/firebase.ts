import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDan4W32abqUIYsUMu-jABDRMOVD857Ews",
  authDomain: "saferide-c6549.firebaseapp.com",
  projectId: "saferide-c6549",
  storageBucket: "saferide-c6549.firebasestorage.app",
  messagingSenderId: "453494912924",
  appId: "1:453494912924:web:7702a0b7b8ddd184dcfa59",
  measurementId: "G-93R2G3Z6WN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;