import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AuthUser } from '@/services/auth/authService';
import type { UserProfile } from '@/types/user';

const KEY_PREFIX = 'metlholoai.profile.';

function key(userId: string) {
  return KEY_PREFIX + userId;
}

export async function getUserProfile(user: AuthUser): Promise<UserProfile | null> {
  const raw = await AsyncStorage.getItem(key(user.id));
  if (!raw) return null;

  try {
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export async function createInitialUserProfile(user: AuthUser): Promise<UserProfile> {
  const existing = await getUserProfile(user);
  if (existing) return existing;

  const profile: UserProfile = {
    uid: user.id,
    displayName: user.displayName || user.email.split('@')[0] || 'Farmer',
    email: user.email,
    photoURL: user.photoURL ?? null,
    role: 'FARMER',
    subscriptionTier: 'FREE',
    status: 'active',
    onboardingCompleted: false,
  };
  await AsyncStorage.setItem(key(user.id), JSON.stringify(profile));
  return profile;
}

export async function updateUserProfile(userId: string, patch: Partial<UserProfile>) {
  const raw = await AsyncStorage.getItem(key(userId));
  if (!raw) throw new Error('MetlholoAI profile has not been initialized.');
  const current = JSON.parse(raw) as UserProfile;
  const next = { ...current, ...patch };
  await AsyncStorage.setItem(key(userId), JSON.stringify(next));
  return next;
}
