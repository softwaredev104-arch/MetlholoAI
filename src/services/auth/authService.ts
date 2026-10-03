import { Platform } from 'react-native';
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { getFirebaseAuth } from '@/services/firebase/client';
import { createInitialUserProfile, getUserProfile } from '@/services/auth/userProfileService';
import type { Role } from '@/types/user';

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

export const authService = {
  subscribe(listener: (user: User | null) => void) {
    return onAuthStateChanged(getFirebaseAuth(), listener);
  },

  async signIn(email: string, password: string) {
    return (await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password)).user;
  },

  async signInWithGoogle() {
    if (Platform.OS !== 'web') {
      throw new Error('Google sign-in is currently available in the web preview. Native Google sign-in will use the same Firebase account.');
    }

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    const credential = await signInWithPopup(getFirebaseAuth(), provider);
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
