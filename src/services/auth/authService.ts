import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { getFirebaseAuth } from '@/services/firebase/client';
import { createInitialUserProfile } from '@/services/auth/userProfileService';
import type { Role } from '@/types/user';

export const authService = {
  subscribe(listener: (user: User | null) => void) {
    return onAuthStateChanged(getFirebaseAuth(), listener);
  },

  async signIn(email: string, password: string) {
    return (await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password)).user;
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
