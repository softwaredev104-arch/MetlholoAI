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

type GoogleSigninModule = typeof import('@react-native-google-signin/google-signin');

let googleConfigured = false;

function getGoogleSignin(): GoogleSigninModule['GoogleSignin'] {
  try {
    return require('@react-native-google-signin/google-signin').GoogleSignin as GoogleSigninModule['GoogleSignin'];
  } catch {
    throw new Error(
      'Google Sign-In is unavailable in this app binary. For native Google Sign-In, rebuild MetlholoAI with `npx expo run:android` or `npx expo run:ios`; Expo Go does not include the Google Sign-In native module.',
    );
  }
}

function configureGoogle() {
  const GoogleSignin = getGoogleSignin();
  if (googleConfigured) return GoogleSignin;

  GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  });
  googleConfigured = true;
  return GoogleSignin;
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
    const GoogleSignin = configureGoogle();
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();
    if (response.type !== 'success' || !response.data.idToken) {
      throw new Error('Google sign-in did not return an ID token.');
    }
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
    try {
      const GoogleSignin = getGoogleSignin();
      await GoogleSignin.signOut();
    } catch {
      // Google Sign-In may not be available in Expo Go or a non-Google session.
    }
    await signOut(getFirebaseAuth());
  },
};