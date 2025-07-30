import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY?.trim(),
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN?.trim(),
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID?.trim(),
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET?.trim(),
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID?.trim(),
  appId: process.env.REACT_APP_FIREBASE_APP_ID?.trim()
};

// Validate required config
const requiredConfig = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
const missingConfig = requiredConfig.filter(key => !firebaseConfig[key]);

if (missingConfig.length > 0) {
  console.error('❌ Firebase configuration missing:', missingConfig);
  throw new Error(`Firebase configuration incomplete. Missing: ${missingConfig.join(', ')}`);
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Enable network in case it's offline
if (typeof window !== 'undefined') {
  import('firebase/firestore').then(({ enableNetwork }) => {
    enableNetwork(db).catch((error) => {
      console.warn('⚠️ Could not enable Firestore network:', error);
    });
  });
}

// Development debugging
if (typeof window !== 'undefined') {
  console.log('🔥 Firebase initialized successfully');
  console.log('📊 Project ID:', JSON.stringify(firebaseConfig.projectId));
  console.log('🔐 Auth Domain:', JSON.stringify(firebaseConfig.authDomain));
  console.log('📦 Storage Bucket:', JSON.stringify(firebaseConfig.storageBucket));
  console.log('🔧 Environment Variables Check:');
  console.log('  - PROJECT_ID env var:', JSON.stringify(process.env.REACT_APP_FIREBASE_PROJECT_ID));
  console.log('  - AUTH_DOMAIN env var:', JSON.stringify(process.env.REACT_APP_FIREBASE_AUTH_DOMAIN));
  
  // Global debugging helpers
  window.firebase = { auth, db, storage, functions };
}

export default app;