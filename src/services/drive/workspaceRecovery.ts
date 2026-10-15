import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from 'firebase/auth';
import { driveJsonStore } from '@/services/drive/driveJsonStore';
import type { UserProfile } from '@/types/user';
import type { Farm, FarmRecord, FarmRecordType } from '@/services/farms/farmRepository';
import type { FarmCase } from '@/services/cases/caseRepository';
import type { TreatmentRecord } from '@/services/treatments/treatmentRepository';
import type { DiagnosisRecord } from '@/services/intelligence/diagnosisRepository';
import type { MarketplaceListing } from '@/services/marketplace/marketplaceRepository';

type FarmSnapshot = {
  ownerId: string;
  farms: Farm[];
  records: Record<string, Partial<Record<FarmRecordType, FarmRecord[]>>>;
  updatedAt?: string;
};
type OwnerList<T> = {
  ownerId: string;
  farmId?: string;
  cases?: T[];
  treatments?: T[];
  records?: T[];
  listings?: T[];
};
const recordTypes: FarmRecordType[] = [
  'animals', 'crops', 'healthRecords', 'tasks', 'feedingPlans', 'marketplace',
];

function assertOwner(value: unknown, uid: string, label: string) {
  if (!value || typeof value !== 'object') {
    throw new Error('Invalid ' + label + ' in Drive. Local data was not changed.');
  }
  const item = value as Record<string, unknown>;
  const owner = item.ownerId ?? item.uid;
  if (owner !== uid) {
    throw new Error(label + ' belongs to a different MetlholoAI account. No data was imported.');
  }
}

function assertRecords(items: unknown, uid: string, farmId: string, label: string) {
  if (!Array.isArray(items)) throw new Error('Invalid ' + label + ' backup.');
  items.forEach(item => {
    assertOwner(item, uid, label);
    if (item.farmId !== farmId || typeof item.id !== 'string') {
      throw new Error('Invalid farm record found in ' + label + '.');
    }
  });
}

function mergeById<T extends { id: string }>(remote: T[], local: T[]): T[] {
  const items = new Map<string, T>();
  // Merge by stable record IDs; local unsynced data always survives a restore.
  remote.forEach(item => items.set(item.id, item));
  local.forEach(item => items.set(item.id, item));
  return Array.from(items.values());
}

function parseLocal<T>(raw: string | null): T | null {
  if (!raw) return null;
  try { return JSON.parse(raw) as T; } catch { return null; }
}

async function readOwnerList<T extends { id: string; ownerId: string; farmId?: string }>(
  uid: string,
  farmId: string,
  scopedName: string,
  legacyName: string,
  field: keyof OwnerList<T>,
): Promise<T[]> {
  const scoped = await driveJsonStore.readJson<OwnerList<T>>(scopedName);
  const legacy = scoped ? null : await driveJsonStore.readJson<OwnerList<T>>(legacyName);
  const snapshot = scoped ?? legacy;
  if (!snapshot) return [];
  assertOwner(snapshot, uid, scopedName);
  // Legacy files contained only one farm. Do not import it into any other farm.
  if (snapshot.farmId && snapshot.farmId !== farmId) return [];
  const data = snapshot[field];
  if (data === undefined) return [];
  assertRecords(data, uid, farmId, scopedName);
  return data as T[];
}

export type RecoveryResult = {
  found: boolean;
  farms: number;
  records: number;
};

/**
 * Restore existing user-owned data only after the signed-in Firebase UID and
 * the Google account have both been checked. Never upload empty local state
 * while attempting recovery. No cloud files are modified by this function.
 */
export async function restoreWorkspaceFromDrive(user: User): Promise<RecoveryResult> {
  if (!driveJsonStore.isConnected()) {
    throw new Error('Connect the same Google Drive account before restoring.');
  }
  const uid = user.uid;
  const [remoteProfile, snapshot] = await Promise.all([
    driveJsonStore.readJson<UserProfile>('profile.json'),
    driveJsonStore.readJson<FarmSnapshot>('farm-data.json'),
  ]);
  if (remoteProfile) assertOwner(remoteProfile, uid, 'Profile');
  if (snapshot) {
    assertOwner(snapshot, uid, 'Farm backup');
    if (!Array.isArray(snapshot.farms) || !snapshot.records ||
        typeof snapshot.records !== 'object') {
      throw new Error('Farm backup is incomplete. Drive files were not modified.');
    }
    snapshot.farms.forEach(farm => {
      assertOwner(farm, uid, 'Farm');
      if (!farm.id || typeof farm.id !== 'string') throw new Error('Invalid farm ID in backup.');
      for (const type of recordTypes) {
        const entries = snapshot.records[farm.id]?.[type] ?? [];
        assertRecords(entries, uid, farm.id, type);
      }
    });
  }
  if (!remoteProfile && !snapshot) {
    return { found: false, farms: 0, records: 0 };
  }

  const remoteFarms = snapshot?.farms ?? [];
  const auxiliary = await Promise.all(remoteFarms.map(async farm => ({
    farmId: farm.id,
    cases: await readOwnerList<FarmCase>(uid, farm.id, 'cases.' + farm.id + '.json', 'cases.json', 'cases'),
    treatments: await readOwnerList<TreatmentRecord>(uid, farm.id, 'treatments.' + farm.id + '.json', 'treatments.json', 'treatments'),
    diagnoses: await readOwnerList<DiagnosisRecord>(uid, farm.id, 'diagnoses.' + farm.id + '.json', 'diagnoses.json', 'records'),
  })));
  const marketplace = await driveJsonStore.readJson<OwnerList<MarketplaceListing>>('marketplace.json');
  if (marketplace) {
    assertOwner(marketplace, uid, 'Marketplace');
    if (marketplace.listings && !Array.isArray(marketplace.listings)) {
      throw new Error('Invalid marketplace backup.');
    }
    marketplace.listings?.forEach(listing => assertOwner(listing, uid, 'Marketplace listing'));
  }

  // Read all existing local snapshots before replacing any key.
  const current = await AsyncStorage.multiGet([
    'metlholoai.profile.' + uid,
    'metlholoai.farms.' + uid,
    'metlholoai.marketplace.' + uid,
  ]);
  const local = new Map(current);
  const previousProfile = parseLocal<UserProfile>(local.get('metlholoai.profile.' + uid) ?? null);
  const previousFarms = parseLocal<Farm[]>(local.get('metlholoai.farms.' + uid) ?? null) ?? [];
  const farms = mergeById(remoteFarms, previousFarms);
  const restoredProfile = remoteProfile ??
    (remoteFarms.length > 0 ? {
      uid, displayName: user.displayName || user.email?.split('@')[0] || 'Farmer',
      email: user.email ?? '', role: 'FARMER' as const, status: 'active' as const,
      subscriptionTier: 'FREE' as const, onboardingCompleted: true,
    } : null);
  const profile = previousProfile?.onboardingCompleted
    ? previousProfile
    : restoredProfile?.onboardingCompleted ? restoredProfile : previousProfile ?? restoredProfile;
  const updates: Array<[string, string]> = [];
  if (profile) updates.push(['metlholoai.profile.' + uid, JSON.stringify(profile)]);
  updates.push(['metlholoai.farms.' + uid, JSON.stringify(farms)]);

  let count = 0;
  for (const farm of farms) {
    for (const type of recordTypes) {
      const key = 'metlholoai.farmRecords.' + uid + '.' + farm.id + '.' + type;
      const raw = await AsyncStorage.getItem(key);
      const existing = parseLocal<FarmRecord[]>(raw) ?? [];
      const fromDrive = snapshot?.records[farm.id]?.[type] ?? [];
      const merged = mergeById(fromDrive, existing);
      count += merged.length;
      if (fromDrive.length || existing.length) updates.push([key, JSON.stringify(merged)]);
    }
    const aux = auxiliary.find(item => item.farmId === farm.id);
    for (const entry of [
      { name: 'cases', records: aux?.cases ?? [] },
      { name: 'treatments', records: aux?.treatments ?? [] },
      { name: 'diagnoses', records: aux?.diagnoses ?? [] },
    ]) {
      const key = 'metlholoai.' + entry.name + '.' + uid + '.' + farm.id;
      const existing = parseLocal<Array<{ id: string }>>(await AsyncStorage.getItem(key)) ?? [];
      const merged = mergeById(entry.records, existing);
      count += merged.length;
      if (merged.length) updates.push([key, JSON.stringify(merged)]);
    }
  }
  const localMarketplace = parseLocal<MarketplaceListing[]>(
    local.get('metlholoai.marketplace.' + uid) ?? null,
  ) ?? [];
  const mergedMarketplace = mergeById(marketplace?.listings ?? [], localMarketplace);
  if (mergedMarketplace.length) {
    updates.push(['metlholoai.marketplace.' + uid, JSON.stringify(mergedMarketplace)]);
  }
  // Apply only after every Drive file, owner and record has passed validation.
  await AsyncStorage.multiSet(updates);
  return { found: true, farms: farms.length, records: count + mergedMarketplace.length };
}
