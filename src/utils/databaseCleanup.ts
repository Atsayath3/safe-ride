/**
 * Database Cleanup Script
 * 
 * WARNING: This will delete ALL users and data from your Firebase project!
 * Use this only for development/testing purposes.
 * 
 * To run this script:
 * 1. Make sure you're in development environment
 * 2. Run: npm run cleanup-db
 * 
 * This script will:
 * - Delete all documents from drivers, parents, admins collections
 * - Optionally delete children and bookings collections
 */

import { 
  collection, 
  getDocs, 
  deleteDoc, 
  doc, 
  writeBatch 
} from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';
import { db, auth } from '../lib/firebase';

const COLLECTIONS_TO_CLEAR = [
  'drivers',
  'parents', 
  'admins',
  'users', // Legacy collection if it exists
  'children', // Child profiles
  'bookings', // Booking history
  'rides',    // Ride records
  'driver location', // Driver location tracking (with space)
  'driverLocations', // Driver location tracking (camelCase)
  'driverLocation'   // Driver location tracking (singular)
];

export const clearAllCollections = async () => {
  console.log('🚨 WARNING: This will delete ALL user data!');
  console.log('Collections to be cleared:', COLLECTIONS_TO_CLEAR);
  
  // Confirmation check
  const isProduction = window.location.hostname === 'your-production-domain.com';
  if (isProduction) {
    throw new Error('❌ Cannot run cleanup script in production environment!');
  }
  
  try {
    // First, clear all Firestore collections
    for (const collectionName of COLLECTIONS_TO_CLEAR) {
      console.log(`🗑️ Clearing collection: ${collectionName}`);
      await clearCollection(collectionName);
      console.log(`✅ Cleared collection: ${collectionName}`);
    }
    
    // Sign out current user if any
    if (auth.currentUser) {
      console.log('🚪 Signing out current user...');
      await auth.signOut();
      console.log('✅ Signed out current user');
    }
    
    console.log('🎉 All collections cleared successfully!');
    console.log('📝 You can now create fresh user accounts.');
    console.log('⚠️  Note: Firebase Auth users still exist. Use different emails or manually delete from Firebase Console.');
    
  } catch (error) {
    console.error('❌ Error clearing collections:', error);
    throw error;
  }
};

const clearCollection = async (collectionName: string) => {
  const collectionRef = collection(db, collectionName);
  const snapshot = await getDocs(collectionRef);
  
  if (snapshot.empty) {
    console.log(`📂 Collection ${collectionName} is already empty`);
    return;
  }
  
  console.log(`📊 Found ${snapshot.docs.length} documents in ${collectionName}`);
  
  // Use batch operations for better performance
  const batch = writeBatch(db);
  let batchCount = 0;
  
  for (const docSnapshot of snapshot.docs) {
    batch.delete(doc(db, collectionName, docSnapshot.id));
    batchCount++;
    
    // Firestore batch limit is 500 operations
    if (batchCount === 500) {
      await batch.commit();
      console.log(`📦 Committed batch of ${batchCount} deletions for ${collectionName}`);
      batchCount = 0;
    }
  }
  
  // Commit remaining batch
  if (batchCount > 0) {
    await batch.commit();
    console.log(`📦 Committed final batch of ${batchCount} deletions for ${collectionName}`);
  }
};

// Additional utility to clear specific collection
export const clearSpecificCollection = async (collectionName: string) => {
  console.log(`🗑️ Clearing specific collection: ${collectionName}`);
  await clearCollection(collectionName);
  console.log(`✅ Cleared collection: ${collectionName}`);
};

// Export for use in development tools
if (process.env.NODE_ENV === 'development') {
  // Make functions available in browser console for manual testing
  (window as any).clearAllCollections = clearAllCollections;
  (window as any).clearSpecificCollection = clearSpecificCollection;
}
