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
  username?: string;
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
  signup: (email: string, password: string, role: 'parent' | 'driver') => Promise<void>;
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

  const signup = async (email: string, password: string, role: 'parent' | 'driver') => {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    
    const profile: UserProfile = {
      uid: user.uid,
      email: user.email || undefined,
      role,
      status: role === 'driver' ? 'pending' : 'approved', // Parents are auto-approved
      profileComplete: false,
      createdAt: new Date()
    };

      if (role === 'driver') {
        await setDoc(doc(db, 'drivers', user.uid), profile);
      } else if (role === 'parent') {
        await setDoc(doc(db, 'parents', user.uid), profile);
      } else if (role === 'admin') {
        await setDoc(doc(db, 'admins', user.uid), profile);
      }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      // Clear user profile state
      setUserProfile(null);
      setCurrentUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const checkExistingDriver = async (phoneNumber: string): Promise<UserProfile | null> => {
    const usersRef = collection(db, 'drivers');
    const q = query(usersRef, where('phone', '==', phoneNumber));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate() || new Date()
      } as UserProfile;
    }
    
    return null;
  };

  const sendPhoneOTP = async (phoneNumber: string): Promise<ConfirmationResult> => {
    try {
      // Clear any existing reCAPTCHA
      const container = document.getElementById('recaptcha-container');
      if (container) {
        container.innerHTML = '';
      }

      const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved
        },
        'expired-callback': () => {
          // Response expired. Ask user to solve reCAPTCHA again.
        }
      });

      await recaptchaVerifier.render();
      return await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
    } catch (error: any) {
      console.error('Phone OTP Error:', error);
      throw new Error(error.message || 'Failed to send OTP');
    }
  };

  const verifyOTP = async (confirmationResult: ConfirmationResult, otp: string) => {
    const result = await confirmationResult.confirm(otp);
    
    // Check if user profile exists for this phone number
    const existingProfile = await checkExistingDriver(result.user.phoneNumber || '');
    
    if (existingProfile) {
      // Update the existing profile with the new Firebase UID
      await updateDoc(doc(db, 'drivers', existingProfile.uid), {
        uid: result.user.uid
      });
      
      // Update the document ID to match the new UID
      await setDoc(doc(db, 'drivers', result.user.uid), {
        ...existingProfile,
        uid: result.user.uid
      });
    }
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!currentUser) throw new Error('No current user');
    if (!userProfile) throw new Error('No user profile loaded');
    
    // Determine the correct collection based on user role
    const collection = userProfile.role === 'driver' ? 'drivers' : 
                      userProfile.role === 'parent' ? 'parents' : 'users';
    
    const docRef = doc(db, collection, currentUser.uid);
    await updateDoc(docRef, data);
    
    // Update local state
    setUserProfile(prev => prev ? { ...prev, ...data } : null);
  };  const fetchUserProfile = async (uid: string) => {
    // Try different collections based on user role
    const collections = ['drivers', 'parents', 'users', 'admins'];
    
    for (const collectionName of collections) {
      const docRef = doc(db, collectionName, uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserProfile({
          ...data,
          createdAt: data.createdAt?.toDate() || new Date()
        } as UserProfile);
        return;
      }
    }
    
    // If no profile exists in any collection, create a basic one in users
    const basicProfile: UserProfile = {
      uid,
      role: 'driver',
      profileComplete: false,
      createdAt: new Date()
    };
    const docRef = doc(db, 'users', uid);
    await setDoc(docRef, basicProfile);
    setUserProfile(basicProfile);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        await fetchUserProfile(user.uid);
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
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