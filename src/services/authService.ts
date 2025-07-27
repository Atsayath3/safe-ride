import { auth, db } from "@/lib/firebase";
import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  ConfirmationResult,
  PhoneAuthProvider,
  signInWithCredential
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
  }
}

export const initializeRecaptcha = () => {
  if (!window.recaptchaVerifier) {
    try {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          console.log('reCAPTCHA solved');
        },
        'expired-callback': () => {
          console.log('reCAPTCHA expired');
          // Reset the reCAPTCHA
          window.recaptchaVerifier?.clear();
          window.recaptchaVerifier = undefined as any;
        }
      });
    } catch (error) {
      console.error('Error initializing reCAPTCHA:', error);
      throw new Error('Failed to initialize reCAPTCHA');
    }
  }
};

export const cleanupRecaptcha = () => {
  if (window.recaptchaVerifier) {
    window.recaptchaVerifier.clear();
    window.recaptchaVerifier = undefined as any;
  }
};

export const formatPhoneNumber = (phoneNumber: string): string => {
  // Remove all non-digit characters
  let cleaned = phoneNumber.replace(/\D/g, '');
  
  // If it starts with country code, keep it
  // If it doesn't start with +, add it
  if (!phoneNumber.startsWith('+')) {
    // If it starts with 94 (Sri Lanka), add +
    if (cleaned.startsWith('94')) {
      return '+' + cleaned;
    }
    // If it starts with 0, replace with +94
    if (cleaned.startsWith('0')) {
      return '+94' + cleaned.substring(1);
    }
    // If it's just the number without country code, add +94
    if (cleaned.length === 9) {
      return '+94' + cleaned;
    }
  }
  
  return phoneNumber;
};

export const sendVerificationCode = async (phoneNumber: string): Promise<ConfirmationResult> => {
  try {
    // Clean up any existing reCAPTCHA
    cleanupRecaptcha();
    
    // Format phone number properly
    const formattedPhone = formatPhoneNumber(phoneNumber);
    console.log('Sending verification to:', formattedPhone);
    
    // Initialize reCAPTCHA
    initializeRecaptcha();
    const appVerifier = window.recaptchaVerifier;
    
    if (!appVerifier) {
      throw new Error('reCAPTCHA verifier not initialized');
    }
    
    const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
    console.log('Verification code sent successfully');
    return confirmationResult;
  } catch (error: any) {
    console.error('Error sending verification code:', error);
    
    // Clean up on error
    cleanupRecaptcha();
    
    // Provide specific error messages
    if (error.code === 'auth/configuration-not-found') {
      throw new Error('Phone authentication is not enabled in Firebase Console. Please enable Phone sign-in method in Firebase Authentication settings.');
    } else if (error.code === 'auth/invalid-phone-number') {
      throw new Error('Please enter a valid phone number');
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many requests. Please try again later');
    } else if (error.code === 'auth/captcha-check-failed') {
      throw new Error('Verification failed. Please try again');
    } else if (error.code === 'auth/web-storage-unsupported') {
      throw new Error('Your browser doesn\'t support this feature');
    } else if (error.code === 'unavailable') {
      throw new Error('Connection to Firebase failed. Please check your internet connection.');
    } else {
      throw new Error(error.message || 'Failed to send verification code. Please try again');
    }
  }
};

export const verifyCode = async (confirmationResult: ConfirmationResult, code: string) => {
  try {
    const result = await confirmationResult.confirm(code);
    return result;
  } catch (error) {
    console.error('Error verifying code:', error);
    throw error;
  }
};

export const checkDriverExists = async (phoneNumber: string) => {
  try {
    const driverDoc = await getDoc(doc(db, 'drivers', phoneNumber));
    return driverDoc.exists();
  } catch (error) {
    console.error('Error checking driver existence:', error);
    return false;
  }
};

export const createDriverProfile = async (driverData: any) => {
  try {
    await setDoc(doc(db, 'drivers', driverData.phoneNumber), {
      ...driverData,
      createdAt: new Date(),
      updatedAt: new Date(),
      approvalStatus: 'pending',
      whatsappConnected: false
    });
  } catch (error) {
    console.error('Error creating driver profile:', error);
    throw error;
  }
};