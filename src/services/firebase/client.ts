import { Platform } from 'react-native';
import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import {
  browserLocalPersistence,
  getAuth,
  initializeAuth,
  type Auth,
} from 'firebase/auth';
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics';
import { getFirebaseConfig, isFirebaseConfigured } from '@/config/env';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let analytics: Analytics | null = null;

export function getFirebaseApp() {
  if (!isFirebaseConfigured) throw new Error('Firebase configuration is missing.');
  if (!app) app = getApps()[0] ?? initializeApp(getFirebaseConfig());
  return app;
}

export function getFirebaseAuth() {
  if (!auth) {
    const firebaseApp = getFirebaseApp();

    if (Platform.OS === 'web') {
      try {
        auth = initializeAuth(firebaseApp, {
          persistence: browserLocalPersistence,
        });
      } catch {
        auth = getAuth(firebaseApp);
      }
    } else {
      auth = getAuth(firebaseApp);
    }
  }

  return auth;
}

export async function getFirebaseAnalytics() {
  if (Platform.OS !== 'web') return null;
  if (!(await isSupported())) return null;
  if (!analytics) analytics = getAnalytics(getFirebaseApp());
  return analytics;
}
