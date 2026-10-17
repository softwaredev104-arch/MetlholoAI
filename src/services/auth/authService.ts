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
import { createInitialUserProfile } from '@/services/auth/userProfileService';
import { driveAuthService } from '@/services/drive/driveAuthService';
import { googleDriveClientId } from '@/config/env';
import { isGoogleIdentityReady, prepareGoogleIdentity } from './googleIdentity';
import { requirePersistentBrowserSignIn } from './persistence';
import type { Role } from '@/types/user';

const GOOGLE_SIGN_IN_SCOPE = 'openid email profile https://www.googleapis.com/auth/drive.file';

// Firebase may announce sign-in before the Drive token has been adopted.
// The auth provider waits for this handoff before inspecting cloud backups.
let pendingGoogleDriveAdoption: Promise<void> | null = null;


function getGoogleAccessToken() {
  // Do not await a script or another operation before the Google popup call:
  // iOS Safari requires the request to originate from the actual tap.
  if (!isGoogleIdentityReady()) {
    return Promise.reject(new Error(
      'Google sign-in is still loading. Wait a moment and try again.',
    ));
  }

  return new Promise<{ accessToken: string; expiresIn: number }>(
    (resolve, reject) => {
      let settled = false;

      const finishError = (message: string) => {
        if (settled) return;
        settled = true;
        reject(new Error(message));
      };

      const client = window.google!.accounts!.oauth2!.initTokenClient({
        client_id: googleDriveClientId,
        scope: GOOGLE_SIGN_IN_SCOPE,
        callback: response => {
          if (settled) return;

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
          resolve({
            accessToken: response.access_token,
            expiresIn: response.expires_in ?? 3600,
          });
        },
        error_callback: error => {
          if (error.type === 'popup_closed' || error.type === 'popup_failed_to_open') {
            finishError(
              'Google sign-in was closed or blocked. On iPhone, open MetlholoAI directly in Safari, not an in-app browser, and try again. Email sign-in is also available.',
            );
          } else {
            finishError('Google sign-in could not open (' + (error.type ?? 'unknown') + ').');
          }
        },
      });

      client.requestAccessToken({ prompt: 'select_account' });
    },
  );
}

export const authService = {
  prepareGoogleSignIn() {
    return Platform.OS === 'web' ? prepareGoogleIdentity() : Promise.resolve();
  },
  subscribe(listener: (user: User | null) => void) {
    return onAuthStateChanged(getFirebaseAuth(), listener);
  },

  async signIn(email: string, password: string) {
    await requirePersistentBrowserSignIn();
    return (
      await signInWithEmailAndPassword(
        getFirebaseAuth(),
        email.trim(),
        password,
      )
    ).user;
  },

  async signInWithGoogle() {
    if (Platform.OS !== 'web') {
      throw new Error(
        'Google sign-in is currently available in the web preview. Native Google sign-in will use the same Firebase account.',
      );
    }

    const googleToken = await getGoogleAccessToken();
    await requirePersistentBrowserSignIn();

    const firebaseCredential = GoogleAuthProvider.credential(
      null,
      googleToken.accessToken,
    );

    // Register the handoff before Firebase emits its auth-state callback.
    // Otherwise returning users may be sent to Drive recovery unnecessarily.
    let releaseAdoption: (() => void) | undefined;
    pendingGoogleDriveAdoption = new Promise<void>(resolve => {
      releaseAdoption = resolve;
    });

    try {
      const credential = await signInWithCredential(
        getFirebaseAuth(),
        firebaseCredential,
      );

      // Google sign-in already requested drive.file. Reuse that same token,
      // instead of requiring a second consent popup after Firebase signs in.
      try {
        await driveAuthService.adoptAccessToken(
          googleToken.accessToken,
          googleToken.expiresIn,
          { ownerId: credential.user.uid, expectedEmail: credential.user.email },
        );
      } catch {
        // Drive errors must not invalidate an otherwise successful login.
        // The signed-in user can choose to reconnect Drive later.
      }

      return credential.user;
    } finally {
      releaseAdoption?.();
      pendingGoogleDriveAdoption = null;
    }
  },

  async waitForGoogleDriveAdoption() {
    await pendingGoogleDriveAdoption;
  },

  async signUp(
    email: string,
    password: string,
    displayName: string,
    role: Role,
  ) {
    await requirePersistentBrowserSignIn();
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
    await driveAuthService.disconnect();
    await signOut(getFirebaseAuth());
  },
};
