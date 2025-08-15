/**
 * Admin User Setup Script
 * 
 * This script helps create the first admin user in your Firebase project.
 * 
 * To use this script:
 * 1. Create a user manually in Firebase Authentication console with email/password
 * 2. Copy the user's UID
 * 3. Add a document in the 'users' collection with the following structure:
 * 
 * Collection: users
 * Document ID: [USER_UID]
 * Data:
 * {
 *   email: "admin@yourproject.com",
 *   role: "admin",
 *   firstName: "Admin",
 *   lastName: "User",
 *   createdAt: [Firestore Timestamp],
 *   profileComplete: true,
 *   status: "approved"
 * }
 * 
 * Alternative: Use Firebase Functions to create admin user programmatically
 */

import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export const createAdminUser = async (email: string, password: string, firstName: string, lastName: string) => {
  try {
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create admin user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      email: email,
      role: 'admin',
      firstName: firstName,
      lastName: lastName,
      createdAt: serverTimestamp(),
      profileComplete: true,
      status: 'approved'
    });

    console.log('Admin user created successfully:', user.uid);
    return user.uid;
  } catch (error) {
    console.error('Error creating admin user:', error);
    throw error;
  }
};

/**
 * Manual Setup Instructions:
 * 
 * 1. Go to Firebase Console > Authentication > Users
 * 2. Click "Add user"
 * 3. Enter email: admin@saferweb.com (or your preferred admin email)
 * 4. Enter a secure password
 * 5. Click "Add user"
 * 6. Copy the generated UID
 * 
 * 7. Go to Firebase Console > Firestore Database > users collection
 * 8. Click "Add document"
 * 9. Document ID: [paste the UID from step 6]
 * 10. Add fields:
 *     - email (string): admin@saferweb.com
 *     - role (string): admin
 *     - firstName (string): Admin
 *     - lastName (string): User
 *     - createdAt (timestamp): [current time]
 *     - profileComplete (boolean): true
 *     - status (string): approved
 * 11. Click "Save"
 * 
 * Now you can login with the admin credentials!
 */
