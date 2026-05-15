import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const FALLBACK_CONFIG = {
  apiKey: "AIzaSyBnILMRQYvxTneBoXPilKPrmz7qknNRl_4",
  authDomain: "kedinasan-e5317.firebaseapp.com",
  projectId: "kedinasan-e5317",
  storageBucket: "kedinasan-e5317.firebasestorage.app",
  messagingSenderId: "1028966349554",
  appId: "1:1028966349554:web:391329f2c8da2ca1802e6b",
};

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const hasEnvConfig = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId &&
  firebaseConfig.apiKey !== 'your_api_key' &&
  firebaseConfig.projectId !== 'your_project_id'
);

const resolvedConfig = hasEnvConfig ? firebaseConfig : FALLBACK_CONFIG;

const isFirebaseConfigured = true;

let firestoreInstance: ReturnType<typeof initializeFirestore> | null = null;

const app = getApps().length === 0
  ? initializeApp(resolvedConfig)
  : getApp();

if (typeof window !== 'undefined') {
  try {
    firestoreInstance = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
  } catch {
    firestoreInstance = getFirestore(app);
  }
} else {
  firestoreInstance = getFirestore(app);
}

export const auth = getAuth(app);
export const db = firestoreInstance;
export const storage = getStorage(app);
