import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
    // Firebase JS SDK 12.x automatically uses its React Native persistence
    // adapter when AsyncStorage is installed. The explicit
    // getReactNativePersistence helper is no longer exported by this SDK.
    // Keep the import referenced so bundlers retain the native storage
    // dependency in the React Native build.
    void AsyncStorage;
    auth = getAuth(getFirebaseApp());
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
