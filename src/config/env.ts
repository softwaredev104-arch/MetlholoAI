import { z } from 'zod';

const Schema = z.object({
  EXPO_PUBLIC_FIREBASE_API_KEY: z.string().min(1),
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1),
  EXPO_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1),
  EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().min(1),
  EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1),
  EXPO_PUBLIC_FIREBASE_APP_ID: z.string().min(1),
  EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID: z.string().optional(),
});

// MetlholoAI's Firebase client configuration is intentionally embedded here.
// These values identify the Firebase client application; they are not Admin SDK
// credentials or service-account secrets. Environment variables can still
// override them for alternate development/staging projects.
const defaults = {
  EXPO_PUBLIC_FIREBASE_API_KEY: 'AIzaSyDsVbzVYDor_lr6OCSm2v5h9V9O5UF-D_s',
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: 'metlholoai.firebaseapp.com',
  EXPO_PUBLIC_FIREBASE_PROJECT_ID: 'metlholoai',
  EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: 'metlholoai.firebasestorage.app',
  EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '826731247115',
  EXPO_PUBLIC_FIREBASE_APP_ID: '1:826731247115:web:9b20ae6e8d25302ef2b90e',
  EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID: 'G-Z3H6W5DMV8',
} as const;

const parsed = Schema.safeParse({
  EXPO_PUBLIC_FIREBASE_API_KEY:
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? defaults.EXPO_PUBLIC_FIREBASE_API_KEY,
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN:
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? defaults.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  EXPO_PUBLIC_FIREBASE_PROJECT_ID:
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? defaults.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET:
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? defaults.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ??
    defaults.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  EXPO_PUBLIC_FIREBASE_APP_ID:
    process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? defaults.EXPO_PUBLIC_FIREBASE_APP_ID,
  EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID:
    process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID ?? defaults.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
});

export const isFirebaseConfigured = parsed.success;

export function getFirebaseConfig() {
  if (!parsed.success) {
    throw new Error('Firebase configuration is invalid.');
  }

  return {
    apiKey: parsed.data.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: parsed.data.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: parsed.data.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: parsed.data.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: parsed.data.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: parsed.data.EXPO_PUBLIC_FIREBASE_APP_ID,
    measurementId: parsed.data.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };
}
