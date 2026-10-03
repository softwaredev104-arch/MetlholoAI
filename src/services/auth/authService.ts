import { Platform } from 'react-native';
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { getFirebaseAuth } from '@/services/firebase/client';
import { createInitialUserProfile, getUserProfile } from '@/services/auth/userProfileService';
import { googleDriveClientId } from '@/config/env';
import type { Role } from '@/types/user';

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient(config: {
            client_id: string;
            scope: string;
            callback: (response: {
              access_token?: string;
              expires_in?: number;
              error?: string;
              error_description?: string;
            }) => void;
            error_callback?: (error: { type?: string }) => void;
          }): {
            requestAccessToken(options?: { prompt?: string }): void;
          };
        };
      };
    };
  }
}

let googleIdentityLoader: Promise<void> | null = null;

async function ensureGoogleUserProfile(user: User) {
  const existing = await getUserProfile(user.uid);
  if (existing) return existing;

  return createInitialUserProfile({
    uid: user.uid,
    displayName: user.displayName?.trim() || user.email?.split('@')[0] || 'Farmer',
    email: user.email ?? '',
    photoURL: user.photoURL,
    role: 'FARMER',
  });
}

function loadGoogleIdentityServices() {
  if (Platform.OS !== 'web' || typeof document === 'undefined') {
    return Promise.reject(
      new Error('Google sign-in is currently available in the web preview.'),
    );
  }

  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (googleIdentityLoader) return googleIdentityLoader;

  googleIdentityLoader = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-metlholo-google-identity]',
    );

    if (existing) {
      if (window.google?.accounts?.oauth2) {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener(
        'error',
        () => reject(new Error('Google Identity Services failed to load.')),
        { once: true },
      );
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.dataset.metlholoGoogleIdentity = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Google Identity Services failed to load.'));
    document.head.appendChild(script);
  });

  return googleIdentityLoader;
}

async function getGoogleAccessToken() {
  await loadGoogleIdentityServices();

  return new Promise<string>((resolve, reject) => {
    let settled = false;

    const finishError = (message: string) => {
      if (settled) return;
      settled = true;
      reject(new Error(message));
    };

    const timeout = setTimeout(() => {
      finishError(
        'Google sign-in did not finish. Please try again and keep the Google account window open until it closes.',
      );
    }, 20_000);

    const client = window.google!.accounts!.oauth2!.initTokenClient({
      client_id: googleDriveClientId,
      scope: 'openid email profile',
      callback: response => {
        if (settled) return;
        clearTimeout(timeout);

        if (response.error || !response.access_token) {
          settled = true;
          reject(
            new Error(
              response.error_description ??
                response.error ??
                'Google sign-in did not return an access token.',
            ),
          );
          return;
        }

        settled = true;
        resolve(response.access_token);
      },
      error_callback: error => {
        clearTimeout(timeout);
        finishError(
          `Google sign-in popup error: ${error.type ?? 'unknown_error'}.`,
        );
      },
    });

    client.requestAccessToken({ prompt: 'select_account' });
  });
}

export const authService = {
  subscribe(listener: (user: User | null) => void) {
    return onAuthStateChanged(getFirebaseAuth(), listener);
  },

  async signIn(email: string, password: string) {
    return (await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password)).user;
  },

  async signInWithGoogle() {
    if (Platform.OS !== 'web') {
      throw new Error(
        'Google sign-in is currently available in the web preview. Native Google sign-in will use the same Firebase account.',
      );
    }

    const accessToken = await getGoogleAccessToken();
    const firebaseCredential = GoogleAuthProvider.credential(null, accessToken);
    const credential = await Promise.race([
      signInWithCredential(getFirebaseAuth(), firebaseCredential),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('Firebase sign-in timed out. Please try again.')),
          15_000,
        ),
      ),
    ]);

    await ensureGoogleUserProfile(credential.user);
    return credential.user;
  },

  async signUp(email: string, password: string, displayName: string, role: Role) {
    const credential = await createUserWithEmailAndPassword(
      getFirebaseAuth(),
      email.trim(),
      password,
    );
    await updateProfile(credential.user, { displayName: displayName.trim() });
    await createInitialUserProfile({
      uid: credential.user.uid,
      displayName: displayName.trim(),
      email: email.trim(),
      photoURL: credential.user.photoURL,
      role,
    });
    await sendEmailVerification(credential.user);
    return credential.user;
  },

  async resetPassword(email: string) {
    await sendPasswordResetEmail(getFirebaseAuth(), email.trim());
  },

  async logout() {
    await signOut(getFirebaseAuth());
  },
};
