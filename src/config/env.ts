import { z } from 'zod';

const FirebaseSchema = z.object({
  EXPO_PUBLIC_FIREBASE_API_KEY: z.string().min(1),
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1),
  EXPO_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1),
  EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().min(1),
  EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1),
  EXPO_PUBLIC_FIREBASE_APP_ID: z.string().min(1),
  EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID: z.string().optional(),
});

const firebaseDefaults = {
  EXPO_PUBLIC_FIREBASE_API_KEY: 'AIzaSyDsVbzVYDor_lr6OCSm2v5h9V9O5UF-D_s',
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: 'metlholoai.firebaseapp.com',
  EXPO_PUBLIC_FIREBASE_PROJECT_ID: 'metlholoai',
  EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: 'metlholoai.firebasestorage.app',
  EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '826731247115',
  EXPO_PUBLIC_FIREBASE_APP_ID: '1:826731247115:web:9b20ae6e8d25302ef2b90e',
  EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID: 'G-Z3H6W5DMV8',
} as const;

const firebase = FirebaseSchema.safeParse({
  EXPO_PUBLIC_FIREBASE_API_KEY:
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? firebaseDefaults.EXPO_PUBLIC_FIREBASE_API_KEY,
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN:
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? firebaseDefaults.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  EXPO_PUBLIC_FIREBASE_PROJECT_ID:
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? firebaseDefaults.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET:
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? firebaseDefaults.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ??
    firebaseDefaults.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  EXPO_PUBLIC_FIREBASE_APP_ID:
    process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? firebaseDefaults.EXPO_PUBLIC_FIREBASE_APP_ID,
  EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID:
    process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID ??
    firebaseDefaults.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
});

export const isFirebaseConfigured = firebase.success;
export const googleDriveClientId = process.env.EXPO_PUBLIC_GOOGLE_DRIVE_CLIENT_ID ?? '826731247115-vresv379tvero1muggu3lcctj26fnts8.apps.googleusercontent.com';
export const isGoogleDriveConfigured = googleDriveClientId.length > 0;

export function getFirebaseConfig() {
  if (!firebase.success) throw new Error('Firebase configuration is invalid.');
  return {
    apiKey: firebase.data.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: firebase.data.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: firebase.data.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: firebase.data.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: firebase.data.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: firebase.data.EXPO_PUBLIC_FIREBASE_APP_ID,
    measurementId: firebase.data.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };
}
