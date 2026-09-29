import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, initializeAuth, type Auth } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getFirebaseConfig, isFirebaseConfigured } from '@/config/env';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

export function getFirebaseApp() {
  if (!isFirebaseConfigured) throw new Error('Firebase configuration is missing.');
  if (!app) app = getApps()[0] ?? initializeApp(getFirebaseConfig());
  return app;
}

export function getFirebaseAuth() {
  if (!auth) {
    const firebaseApp = getFirebaseApp();
    try {
      // Firebase 12.19.0 exposes the React Native persistence helper at runtime,
      // while its TypeScript declarations do not export it. Resolve it dynamically
      // so auth state persists with the installed AsyncStorage v2.
      const getReactNativePersistence = (require('firebase/auth') as typeof import('firebase/auth') & {
        getReactNativePersistence?: (storage: typeof ReactNativeAsyncStorage) => unknown;
      }).getReactNativePersistence;

      if (getReactNativePersistence) {
        auth = initializeAuth(firebaseApp, {
          persistence: getReactNativePersistence(ReactNativeAsyncStorage) as Parameters<typeof initializeAuth>[1]['persistence'],
        });
      } else {
        auth = getAuth(firebaseApp);
      }
    } catch {
      // Hot reload can leave an Auth instance registered already.
      auth = getAuth(firebaseApp);
    }
  }

  return auth;
}

export function getFirestoreDb() {
  if (!db) db = getFirestore(getFirebaseApp());
  return db;
}

export function getFirebaseStorage() {
  if (!storage) storage = getStorage(getFirebaseApp());
  return storage;
}
