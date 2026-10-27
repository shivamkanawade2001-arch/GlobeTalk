import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDemoDummyApiKeyForGlobeTalkDev0123',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'globetalk-demo.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'globetalk-demo',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'globetalk-demo.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1234567890',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1234567890:web:abcdef123456',
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
const googleProvider = new GoogleAuthProvider();

export const isFirebaseConfigured = Boolean(
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_PROJECT_ID
);

try {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  auth = getAuth(app);
} catch (err) {
  console.warn('Firebase initialized in fallback demo mode:', err);
}

export { app, auth, googleProvider };

export async function loginWithGoogle() {
  if (!auth || !isFirebaseConfigured) {
    throw new Error('FIREBASE_NOT_CONFIGURED');
  }
  return signInWithPopup(auth, googleProvider);
}
