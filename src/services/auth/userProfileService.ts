import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Role, UserProfile } from '@/types/user';
import { driveJsonStore } from '@/services/drive/driveJsonStore';
import { driveAuthService } from '@/services/drive/driveAuthService';

const key = (uid: string) => `metlholoai.profile.${uid}`;

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const raw = await AsyncStorage.getItem(key(uid));
  if (!raw) return null;

  try {
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export async function createInitialUserProfile(input: {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string | null;
  role: Role;
}) {
  const now = new Date().toISOString();
  const profile: UserProfile = {
    uid: input.uid,
    displayName: input.displayName,
    email: input.email,
    photoURL: input.photoURL ?? null,
    role: input.role,
    subscriptionTier: 'FREE',
    status: 'active',
    onboardingCompleted: false,
    createdAt: now,
    updatedAt: now,
  };

  await AsyncStorage.setItem(key(input.uid), JSON.stringify(profile));
  return profile;
}

export async function updateUserProfile(
  uid: string,
  patch: Partial<UserProfile>,
) {
  const current = await getUserProfile(uid);
  if (!current) throw new Error('User profile is not initialized.');

  const next: UserProfile = {
    ...current,
    ...patch,
    uid: current.uid,
    updatedAt: new Date().toISOString(),
  };

  await AsyncStorage.setItem(key(uid), JSON.stringify(next));

  if (await driveAuthService.ensureConnected(uid)) {
    await driveJsonStore.writeJson('profile.json', next);
  }

  return next;
}

export async function syncUserProfileToDrive(uid: string) {
  const profile = await getUserProfile(uid);
  if (!profile) throw new Error('User profile is not initialized.');
  if (!(await driveAuthService.ensureConnected(uid))) {
    throw new Error('Google Drive could not be reconnected.');
  }
  await driveJsonStore.writeJson('profile.json', profile);
}

export async function restoreUserProfileFromDrive(
  uid: string,
): Promise<UserProfile | null> {
  if (!driveJsonStore.isConnected()) return null;

  const remote = await driveJsonStore.readJson<UserProfile>('profile.json');
  if (!remote || remote.uid !== uid) return null;

  await AsyncStorage.setItem(key(uid), JSON.stringify(remote));
  return remote;
}
