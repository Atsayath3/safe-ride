import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

// Test users for storage rules testing
const testUsers = [
  {
    email: 'driver1@test.com',
    password: 'testpass123',
    role: 'driver',
    name: 'Test Driver 1'
  },
  {
    email: 'driver2@test.com', 
    password: 'testpass123',
    role: 'driver',
    name: 'Test Driver 2'
  },
  {
    email: 'parent1@test.com',
    password: 'testpass123', 
    role: 'parent',
    name: 'Test Parent 1'
  }
];

export const createTestUsers = async () => {
  console.log('🧪 Creating test users for storage rules testing...');
  
  for (const userData of testUsers) {
    try {
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        userData.email, 
        userData.password
      );
      
      const uid = userCredential.user.uid;
      console.log(`✅ Created user: ${userData.email} (UID: ${uid})`);
      
      // Add user to appropriate collection
      const collectionName = userData.role === 'driver' ? 'drivers' : 'parents';
      await setDoc(doc(db, collectionName, uid), {
        email: userData.email,
        name: userData.name,
        role: userData.role,
        createdAt: new Date().toISOString(),
        isTestUser: true // Flag for easy cleanup
      });
      
      console.log(`✅ Added ${userData.role} profile for ${userData.email}`);
      
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        console.log(`ℹ️ User ${userData.email} already exists`);
      } else {
        console.error(`❌ Error creating ${userData.email}:`, error.message);
      }
    }
  }
  
  console.log('🎉 Test users setup complete!');
  console.log('\n📋 Test Users Created:');
  testUsers.forEach(user => {
    console.log(`- ${user.email} (${user.role})`);
  });
};

export const loginAsTestUser = async (email: string, password: string = 'testpass123') => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log(`✅ Logged in as: ${email} (UID: ${userCredential.user.uid})`);
    return userCredential.user;
  } catch (error: any) {
    console.error(`❌ Login failed for ${email}:`, error.message);
    throw error;
  }
};

// Cleanup function to remove test users
export const cleanupTestUsers = async () => {
  console.log('🧹 Cleaning up test users...');
  // Note: You'll need to manually delete from Firebase Auth console
  // This just logs the users to delete
  testUsers.forEach(user => {
    console.log(`Delete: ${user.email}`);
  });
};
