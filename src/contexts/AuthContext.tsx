import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export interface UserProfile {
  uid: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  gender?: 'male' | 'female' | 'other';
  role: 'parent' | 'driver' | 'admin';
  status?: 'pending' | 'approved' | 'rejected';
  profileComplete: boolean;
  createdAt: Date;
  city?: string;
  vehicle?: {
    type: string;
    capacity: string;
    model: string;
    year: string;
    color: string;
    plateNumber: string;
  };
  documents?: {
    nic?: string;
    vehicleInsurance?: string;
    vehicleLicense?: string;
    profilePicture?: string;
  };
  routes?: {
    startPoint?: { lat: number; lng: number; address: string };
    endPoint?: { lat: number; lng: number; address: string };
  };
  whatsappConnected?: boolean;
  rejectionReason?: string;
  rejectedAt?: Date;
  approvedAt?: Date;
  bookingOpen?: boolean;
}

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, role: 'parent' | 'driver' | 'admin') => Promise<User>;
  logout: () => Promise<void>;
  sendPhoneOTP: (phoneNumber: string) => Promise<ConfirmationResult>;
  verifyOTP: (confirmationResult: ConfirmationResult, otp: string) => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  checkExistingDriver: (phoneNumber: string) => Promise<UserProfile | null>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signup = async (email: string, password: string, role: 'parent' | 'driver' | 'admin') => {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    
    // Only create profile documents for drivers and admins immediately
    // Parents will have their profile created after completing full onboarding
    if (role === 'driver') {
      const profile: any = {
        uid: user.uid,
        email: user.email || undefined,
        role,
        status: 'pending',
        profileComplete: false,
        createdAt: new Date()
      };

      // Remove any undefined fields to prevent Firestore errors
      Object.keys(profile).forEach(key => {
        if (profile[key] === undefined) {
          delete profile[key];
        }
      });

      await setDoc(doc(db, 'drivers', user.uid), profile);
    } else if (role === 'admin') {
      const profile: any = {
        uid: user.uid,
        email: user.email || undefined,
        role,
        profileComplete: false,
        createdAt: new Date()
      };

      // Remove any undefined fields to prevent Firestore errors
      Object.keys(profile).forEach(key => {
        if (profile[key] === undefined) {
          delete profile[key];
        }
      });

      await setDoc(doc(db, 'admins', user.uid), profile);
    }
    // Note: Parent profiles are created only after completing full onboarding in Step 6
    
    return user; // Return the created user for further processing
  };

  const logout = async () => {
    await signOut(auth);
    setUserProfile(null);
  };

  const sendPhoneOTP = async (phoneNumber: string): Promise<ConfirmationResult> => {
    // Ensure the recaptcha container exists
    const recaptchaContainer = document.getElementById('recaptcha-container');
    if (!recaptchaContainer) {
      throw new Error('Recaptcha container not found');
    }

    const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
      callback: () => {
        console.log('Recaptcha resolved');
      }
    });

    return signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
  };

  const verifyOTP = async (confirmationResult: ConfirmationResult, otp: string) => {
    const { user } = await confirmationResult.confirm(otp);
    
    // Check if this is a new user or existing user
    const existingProfile = await fetchUserProfile(user.uid);
    if (!existingProfile) {
      // Create a new profile for phone-verified user
      const profile: UserProfile = {
        uid: user.uid,
        phone: user.phoneNumber || undefined,
        role: 'driver', // Default for phone signup
        status: 'pending',
        profileComplete: false,
        createdAt: new Date()
      };
      await setDoc(doc(db, 'drivers', user.uid), profile);
    }
  };

  const checkExistingDriver = async (phoneNumber: string): Promise<UserProfile | null> => {
    const driversQuery = query(
      collection(db, 'drivers'),
      where('phone', '==', phoneNumber)
    );
    
    const snapshot = await getDocs(driversQuery);
    if (!snapshot.empty) {
      const driverDoc = snapshot.docs[0];
      return {
        ...driverDoc.data(),
        createdAt: driverDoc.data().createdAt?.toDate() || new Date()
      } as UserProfile;
    }
    
    return null;
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!currentUser || !userProfile) return;
    
    const collection = userProfile.role === 'driver' ? 'drivers' : 
                     userProfile.role === 'parent' ? 'parents' : 
                     userProfile.role === 'admin' ? 'admins' : 'users';
    
    const docRef = doc(db, collection, currentUser.uid);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date()
    });
    
    // Update local state
    setUserProfile(prev => prev ? { ...prev, ...data } : null);
  };

  const fetchUserProfile = async (uid: string) => {
    // Try different collections based on user role
    const collections = ['drivers', 'parents', 'users', 'admins'];
    
    for (const collectionName of collections) {
      const docRef = doc(db, collectionName, uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log('🔥🔥🔥 AuthContext fetchUserProfile - raw data:', data);
        
        // Helper function to safely convert Firestore timestamps
        const safeToDate = (timestamp: any) => {
          if (!timestamp) return null;
          if (typeof timestamp?.toDate === 'function') {
            return timestamp.toDate();
          }
          if (timestamp instanceof Date) {
            return timestamp;
          }
          if (typeof timestamp === 'string') {
            return new Date(timestamp);
          }
          return null;
        };

        const userProfile = {
          ...data,
          createdAt: safeToDate(data.createdAt) || new Date(),
          rejectedAt: safeToDate(data.rejectedAt),
          approvedAt: safeToDate(data.approvedAt)
        } as UserProfile;
        
        console.log('🔥🔥🔥 AuthContext fetchUserProfile - processed profile:', userProfile);
        return userProfile;
      }
    }
    return null;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        const profile = await fetchUserProfile(user.uid);
        setUserProfile(profile);
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    loading,
    login,
    signup,
    logout,
    sendPhoneOTP,
    verifyOTP,
    updateUserProfile,
    checkExistingDriver
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
      <div id="recaptcha-container"></div>
    </AuthContext.Provider>
  );
};