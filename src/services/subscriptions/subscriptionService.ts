import { serverTimestamp } from 'firebase/firestore';
import { doc, updateDoc } from 'firebase/firestore';
import { getFirestoreDb } from '@/services/firebase/client';

export const PAYPAL_SUBSCRIPTION_ENABLED = false;

export async function getPayPalSubscriptionUrl(): Promise<string | null> {
  if (!PAYPAL_SUBSCRIPTION_ENABLED) return null;
  return process.env.EXPO_PUBLIC_PAYPAL_SUBSCRIPTION_URL ?? null;
}

export async function activateTestSubscription(uid: string) {
  await updateDoc(doc(getFirestoreDb(), 'users', uid), {
    subscriptionTier: 'PREMIUM',
    subscriptionProvider: 'test',
    subscribedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function activatePayPalSubscription(uid: string, providerReference: string) {
  await updateDoc(doc(getFirestoreDb(), 'users', uid), {
    subscriptionTier: 'PREMIUM',
    subscriptionProvider: 'paypal',
    paypalSubscriptionId: providerReference,
    subscribedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
