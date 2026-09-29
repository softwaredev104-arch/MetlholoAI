import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { doc, serverTimestamp, setDoc, getDoc } from 'firebase/firestore';
import { getFirebaseAuth, getFirestoreDb } from '@/services/firebase/client';
import type { Role, UserProfile } from '@/types/user';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

let googleConfigured = false;

function configureGoogle() {
  if (googleConfigured) return;
  GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  });
  googleConfigured = true;
}

export const authService = {
  subscribe(listener: (user: User | null) => void) {
    return onAuthStateChanged(getFirebaseAuth(), listener);
  },
  async signIn(email: string, password: string) {
    return (await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password)).user;
  },
  async signUp(email: string, password: string, displayName: string, role: Role) {
    const credential = await createUserWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
    await updateProfile(credential.user, { displayName: displayName.trim() });
    await sendEmailVerification(credential.user);
    const profile: UserProfile = {
      uid: credential.user.uid,
      displayName: displayName.trim(),
      email: email.trim(),
      photoURL: credential.user.photoURL,
      role,
      subscriptionTier: 'FREE',
      status: 'active',
      onboardingCompleted: false,
      onboardingStep: 1,
    };
    await setDoc(doc(getFirestoreDb(), 'users', credential.user.uid), {
      ...profile,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return credential.user;
  },
  async signInWithGoogle() {
    configureGoogle();
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();
    if (response.type !== 'success' || !response.data.idToken) throw new Error('Google sign-in did not return an ID token.');
    const credential = GoogleAuthProvider.credential(response.data.idToken);
    const user = (await signInWithCredential(getFirebaseAuth(), credential)).user;
    const profileRef = doc(getFirestoreDb(), 'users', user.uid);
    const existing = await getDoc(profileRef);
    if (!existing.exists()) {
      const profile: UserProfile = {
        uid: user.uid,
        displayName: user.displayName ?? response.data.user.name ?? 'MetlholoAI user',
        email: user.email ?? response.data.user.email ?? '',
        photoURL: user.photoURL ?? response.data.user.photo ?? null,
        role: 'FARMER',
        subscriptionTier: 'FREE',
        status: 'active',
        onboardingCompleted: false,
        onboardingStep: 1,
      };
      await setDoc(profileRef, { ...profile, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    }
    return user;
  },
  async resetPassword(email: string) {
    await sendPasswordResetEmail(getFirebaseAuth(), email.trim());
  },
  async logout() {
    try { await GoogleSignin.signOut(); } catch {}
    await signOut(getFirebaseAuth());
  },
};
