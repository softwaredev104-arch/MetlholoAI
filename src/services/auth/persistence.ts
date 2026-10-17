import { Platform } from 'react-native';
import { browserLocalPersistence, indexedDBLocalPersistence, setPersistence } from 'firebase/auth';
import { getFirebaseAuth } from '@/services/firebase/client';

/** Refuse silent session/in-memory fallback for web sign-ins. */
export async function requirePersistentBrowserSignIn() {
  if (Platform.OS !== 'web') return;
  const auth = getFirebaseAuth();
  try {
    await setPersistence(auth, browserLocalPersistence);
  } catch {
    try {
      await setPersistence(auth, indexedDBLocalPersistence);
    } catch {
      throw new Error(
        'This browser is blocking saved sign-in sessions. Open MetlholoAI in regular Safari (not Private Browsing or an in-app browser), enable website storage, then try again.',
      );
    }
  }
}
