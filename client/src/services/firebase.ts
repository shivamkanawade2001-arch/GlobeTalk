import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, Auth } from 'firebase/auth';

const DEFAULT_FIREBASE_CONFIG: Record<string, string> = {
  VITE_FIREBASE_API_KEY: 'AIzaSyDm13zGCqJP2Ntn3nJ3r4nxwOMYpVM-TIc',
  VITE_FIREBASE_AUTH_DOMAIN: 'globetalk-f83d4.firebaseapp.com',
  VITE_FIREBASE_PROJECT_ID: 'globetalk-f83d4',
  VITE_FIREBASE_STORAGE_BUCKET: 'globetalk-f83d4.firebasestorage.app',
  VITE_FIREBASE_MESSAGING_SENDER_ID: '327271905813',
  VITE_FIREBASE_APP_ID: '1:327271905813:web:f30c9d843a5d17c9d16c1c',
};

function getEnv(key: string): string {
  if (typeof window !== 'undefined') {
    // 1. Check runtime window.__GLOBETALK_ENV__ from server
    const serverEnv = (window as any).__GLOBETALK_ENV__;
    if (serverEnv && serverEnv[key]) {
      return serverEnv[key];
    }
    // 2. Check localStorage override
    const localVal = localStorage.getItem(`GLOBETALK_${key}`);
    if (localVal) {
      return localVal;
    }
  }
  // 3. Fallback to Vite build-time env or configured defaults
  return (import.meta as any).env?.[key] || DEFAULT_FIREBASE_CONFIG[key] || '';
}

export function isFirebaseConfigured(): boolean {
  const apiKey = getEnv('VITE_FIREBASE_API_KEY');
  const projectId = getEnv('VITE_FIREBASE_PROJECT_ID');
  return Boolean(apiKey && projectId && !apiKey.includes('Dummy') && apiKey.length > 10);
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
const googleProvider = new GoogleAuthProvider();

export function getFirebaseAuth(): Auth | null {
  const apiKey = getEnv('VITE_FIREBASE_API_KEY');
  const authDomain = getEnv('VITE_FIREBASE_AUTH_DOMAIN') || `${getEnv('VITE_FIREBASE_PROJECT_ID')}.firebaseapp.com`;
  const projectId = getEnv('VITE_FIREBASE_PROJECT_ID');
  const storageBucket = getEnv('VITE_FIREBASE_STORAGE_BUCKET') || `${projectId}.appspot.com`;
  const messagingSenderId = getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID') || '1234567890';
  const appId = getEnv('VITE_FIREBASE_APP_ID') || '1:1234567890:web:abcdef';

  if (!apiKey || !projectId || apiKey.includes('Dummy')) {
    return null;
  }

  try {
    if (getApps().length === 0) {
      app = initializeApp({
        apiKey,
        authDomain,
        projectId,
        storageBucket,
        messagingSenderId,
        appId,
      });
    } else {
      app = getApps()[0];
    }
    auth = getAuth(app);
    return auth;
  } catch (err) {
    console.error('Failed to initialize Firebase Auth:', err);
    return null;
  }
}

export { app, auth, googleProvider };

export async function loginWithGoogle() {
  const firebaseAuth = getFirebaseAuth();
  if (!firebaseAuth || !isFirebaseConfigured()) {
    throw new Error('FIREBASE_NOT_CONFIGURED');
  }
  return signInWithPopup(firebaseAuth, googleProvider);
}
