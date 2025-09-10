/**
 * Firebase Authentication Cleanup Helper
 * 
 * This provides instructions and utilities for cleaning Firebase Auth users.
 * Note: Due to Firebase security, client-side deletion of other users is limited.
 */

import { auth } from '@/lib/firebase';
import { deleteUser, signOut } from 'firebase/auth';

/**
 * Delete the currently signed-in user
 * This only works for the user who is currently authenticated
 */
export const deleteCurrentUser = async (): Promise<void> => {
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    throw new Error('No user is currently signed in');
  }
  
  try {
    console.log('🗑️ Deleting current user:', currentUser.email);
    await deleteUser(currentUser);
    console.log('✅ Current user deleted successfully');
  } catch (error: any) {
    console.error('❌ Error deleting current user:', error);
    
    // If user needs to re-authenticate, provide helpful message
    if (error.code === 'auth/requires-recent-login') {
      throw new Error('Please sign out and sign in again, then try deleting the account');
    }
    
    throw error;
  }
};

/**
 * Sign out current user (if any)
 */
export const signOutCurrentUser = async (): Promise<void> => {
  if (auth.currentUser) {
    console.log('🚪 Signing out current user:', auth.currentUser.email);
    await signOut(auth);
    console.log('✅ Signed out successfully');
  } else {
    console.log('ℹ️ No user currently signed in');
  }
};

/**
 * Get Firebase Console URLs for manual cleanup
 */
export const getFirebaseConsoleUrls = () => {
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'your-project-id';
  
  return {
    authentication: `https://console.firebase.google.com/project/${projectId}/authentication/users`,
    firestore: `https://console.firebase.google.com/project/${projectId}/firestore/data`,
    overview: `https://console.firebase.google.com/project/${projectId}/overview`
  };
};

/**
 * Instructions for manual cleanup
 */
export const getCleanupInstructions = () => {
  return {
    title: 'Manual Firebase Authentication Cleanup',
    steps: [
      '1. Go to Firebase Console (https://console.firebase.google.com)',
      '2. Select your project',
      '3. Click "Authentication" → "Users"',
      '4. Select all users or individual users',
      '5. Click the delete button (trash icon)',
      '6. Confirm deletion',
      '7. Verify users list is empty'
    ],
    note: 'This must be done manually due to Firebase security restrictions.'
  };
};

/**
 * Development helper to print cleanup instructions
 */
export const printCleanupInstructions = () => {
  const instructions = getCleanupInstructions();
  const urls = getFirebaseConsoleUrls();
  
  console.log('\n🧹 FIREBASE AUTHENTICATION CLEANUP INSTRUCTIONS');
  console.log('================================================');
  
  instructions.steps.forEach(step => {
    console.log(step);
  });
  
  console.log('\n🔗 Quick Links:');
  console.log('Authentication:', urls.authentication);
  console.log('Firestore:', urls.firestore);
  
  console.log('\n⚠️ Important:', instructions.note);
  console.log('================================================\n');
};

// Make functions available in browser console for development
if (process.env.NODE_ENV === 'development') {
  (window as any).deleteCurrentUser = deleteCurrentUser;
  (window as any).signOutCurrentUser = signOutCurrentUser;
  (window as any).printCleanupInstructions = printCleanupInstructions;
}
