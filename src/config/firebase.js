import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
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

// Development debugging
if (typeof window !== 'undefined') {
  console.log('🔥 Firebase initialized successfully');
  console.log('📊 Project ID:', firebaseConfig.projectId);
  console.log('🔐 Auth Domain:', firebaseConfig.authDomain);
  console.log('📦 Storage Bucket:', firebaseConfig.storageBucket);
  
  // Global debugging helpers
  window.firebase = { auth, db, storage };
}

export default app;