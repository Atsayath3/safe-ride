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
  gender?: 'male' | 'female' | 'other';
  role: 'parent' | 'driver' | 'admin';
  status?: 'pending' | 'approved' | 'rejected';
  profileComplete: boolean;
  createdAt: Date;
  city?: string;
  vehicle?: {
    type: 'van' | 'mini van' | 'school bus';
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
    quality?: 'excellent' | 'good' | 'fair';
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
  loginWithRole: (email: string, password: string, expectedRole: 'parent' | 'driver' | 'admin') => Promise<void>;
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

  const loginWithRole = async (email: string, password: string, expectedRole: 'parent' | 'driver' | 'admin') => {
    try {
      console.log(`🔐 Attempting ${expectedRole} login for:`, email);
      
      // First, sign in with email and password
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('✅ Firebase Auth login successful:', user.uid);

      // Determine the collection to check based on expected role
      const collectionName = expectedRole === 'driver' ? 'drivers' : 
                            expectedRole === 'parent' ? 'parents' : 'users';

      console.log(`🔍 Checking for user in ${collectionName} collection...`);
      
      // Check if user exists in the expected role collection
      const userDoc = await getDoc(doc(db, collectionName, user.uid));
      
      if (!userDoc.exists()) {
        console.log(`❌ User not found in ${collectionName} collection`);
        
        // If not found in expected collection, check if user exists in other collections
        const collections = ['drivers', 'parents', 'users'];
        let foundInCollection = null;
        let userData = null;

        console.log('🔍 Searching in other collections...');
        for (const collection of collections) {
          if (collection !== collectionName) {
            const docRef = doc(db, collection, user.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              foundInCollection = collection;
              userData = docSnap.data();
              console.log(`🔍 Found user in ${collection} collection with role:`, userData?.role);
              break;
            }
          }
        }

        // Sign out the user since they don't have the right role
        await auth.signOut();

        if (foundInCollection) {
          const userRole = userData?.role || foundInCollection.slice(0, -1); // Remove 's' from collection name
          console.log(`🔍 Found user in ${foundInCollection} collection with role:`, userData?.role);
          console.log(`🔍 Expected role was:`, expectedRole);
          
          // For admin users in the users collection, don't throw an error if the role matches
          if (foundInCollection === 'users' && userData?.role && 
              userData.role.toString().trim().toLowerCase() === expectedRole.toLowerCase()) {
            console.log(`✅ Admin user found in users collection with correct role`);
            return; // Allow the login to continue
          }
          
          throw new Error(`Access denied. This account is registered as a ${userRole}. Please use the correct login page.`);
        } else {
          // No user document found in any collection - this means the database was cleared
          // but the Firebase Auth user still exists. We should allow re-registration.
          console.log('❌ No user document found in any collection');
          throw new Error(`No ${expectedRole} account found. Please sign up first or use a different email.`);
        }
      }

      // Verify the role in the document matches expected role
      const userData = userDoc.data();
      console.log(`✅ Found user in ${collectionName} with role:`, userData.role);
      console.log(`🔍 Expected role:`, expectedRole);
      console.log(`🔍 Role comparison:`, userData.role, '!==', expectedRole, '=', userData.role !== expectedRole);
      
      // Normalize roles for comparison (handle case sensitivity and whitespace)
      const actualRole = (userData.role || '').toString().trim().toLowerCase();
      const expectedRoleNormalized = expectedRole.trim().toLowerCase();
      
      console.log(`🔍 Normalized comparison:`, actualRole, '!==', expectedRoleNormalized, '=', actualRole !== expectedRoleNormalized);
      
      if (actualRole !== expectedRoleNormalized) {
        await auth.signOut();
        throw new Error(`Access denied. This account is registered as a ${userData.role}. Please use the correct login page.`);
      }

      console.log(`🎉 ${expectedRole} login successful`);
      // If we get here, the user has the correct role and is logged in
    } catch (error: any) {
      console.error(`❌ Login error for ${expectedRole}:`, error);
      // Re-throw the error to be handled by the calling component
      throw error;
    }
  };

  const signup = async (email: string, password: string, role: 'parent' | 'driver') => {
    try {
      console.log(`🔐 Creating ${role} account for:`, email);
      
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      console.log('✅ Firebase Auth user created:', user.uid);
      
      const profile: UserProfile = {
        uid: user.uid,
        email: user.email || undefined,
        role,
        profileComplete: false,
        createdAt: new Date()
      };

      // Only add status field for drivers (avoid undefined values)
      if (role === 'driver') {
        profile.status = 'pending';
      }

      console.log(`📝 Creating ${role} profile in Firestore:`, profile);

      if (role === 'driver') {
        await setDoc(doc(db, 'drivers', user.uid), profile);
        console.log('✅ Driver profile created in drivers collection');
      } else if (role === 'parent') {
        await setDoc(doc(db, 'parents', user.uid), profile);
        console.log('✅ Parent profile created in parents collection');
      } else if (role === 'admin') {
        await setDoc(doc(db, 'admins', user.uid), profile);
        console.log('✅ Admin profile created in admins collection');
      }
      
      console.log(`🎉 ${role} signup completed successfully`);
    } catch (error) {
      console.error(`❌ Error during ${role} signup:`, error);
      throw error;
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
      
      // Handle different createdAt formats safely
      let createdAt = new Date();
      if (data.createdAt) {
        if (typeof data.createdAt.toDate === 'function') {
          // Firestore Timestamp
          createdAt = data.createdAt.toDate();
        } else if (data.createdAt instanceof Date) {
          // Regular Date object
          createdAt = data.createdAt;
        } else if (typeof data.createdAt === 'string') {
          // String date
          createdAt = new Date(data.createdAt);
        }
      }
      
      return {
        ...data,
        createdAt
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
        
        // Handle different createdAt formats safely
        let createdAt = new Date();
        if (data.createdAt) {
          if (typeof data.createdAt.toDate === 'function') {
            // Firestore Timestamp
            createdAt = data.createdAt.toDate();
          } else if (data.createdAt instanceof Date) {
            // Regular Date object
            createdAt = data.createdAt;
          } else if (typeof data.createdAt === 'string') {
            // String date
            createdAt = new Date(data.createdAt);
          }
        }
        
        setUserProfile({
          ...data,
          createdAt
        } as UserProfile);
        return;
      }
    }
    
    // If no profile exists, set userProfile to null
    // The signup process should handle profile creation
    console.log('No user profile found for UID:', uid);
    setUserProfile(null);
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
    loginWithRole,
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