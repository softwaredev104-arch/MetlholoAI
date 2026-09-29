import { doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { getFirestoreDb } from '@/services/firebase/client';
import type { UserProfile } from '@/types/user';

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snapshot = await getDoc(doc(getFirestoreDb(), 'users', uid));
  if (!snapshot.exists()) return null;
  return snapshot.data() as UserProfile;
}

export async function updateUserProfile(uid: string, patch: Partial<UserProfile>) {
  const definedPatch = Object.fromEntries(
    Object.entries(patch).filter(([, value]) => value !== undefined),
  );

  await updateDoc(doc(getFirestoreDb(), 'users', uid), {
    ...definedPatch,
    updatedAt: serverTimestamp(),
  });
}

export async function completeOnboarding(uid: string) {
  await updateUserProfile(uid, {
    onboardingCompleted: true,
    onboardingStep: 5,
    subscriptionTier: 'PREMIUM',
    subscriptionProvider: 'test',
    subscribedAt: serverTimestamp(),
  });
}