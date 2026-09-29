import { doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { getFirestoreDb } from '@/services/firebase/client';
import type { UserProfile } from '@/types/user';

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snapshot = await getDoc(doc(getFirestoreDb(), 'users', uid));
  if (!snapshot.exists()) return null;
  return snapshot.data() as UserProfile;
}

export async function updateUserProfile(uid: string, patch: Partial<UserProfile>) {
  await updateDoc(doc(getFirestoreDb(), 'users', uid), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}