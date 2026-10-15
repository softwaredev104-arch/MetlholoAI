import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from 'firebase/auth';
import { getFirebaseAuth } from '@/services/firebase/client';
import { getUserProfile } from '@/services/auth/userProfileService';
import { listFarms } from '@/services/farms/farmRepository';
import { driveJsonStore } from '@/services/drive/driveJsonStore';
import type { UserProfile } from '@/types/user';
import type {
  Farm,
  FarmRecord,
  FarmRecordType,
} from '@/services/farms/farmRepository';
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
  'animals',
  'crops',
  'healthRecords',
  'tasks',
  'feedingPlans',
  'marketplace',
];

function assertOwner(value: unknown, uid: string, label: string) {
  if (!value || typeof value !== 'object') {
    throw new Error(
      'Invalid ' + label + ' in Google Drive. Local data was not changed.',
    );
  }
  const item = value as Record<string, unknown>;
  const owner = item.ownerId ?? item.uid;
  if (owner !== uid) {
    throw new Error(
      label +
        ' belongs to a different MetlholoAI account. No data was imported or overwritten.',
    );
  }
}

function assertRecords(
  items: unknown,
  uid: string,
  farmId: string,
  label: string,
) {
  if (!Array.isArray(items)) throw new Error('Invalid ' + label + ' backup.');
  items.forEach(item => {
    assertOwner(item, uid, label);
    const record = item as Record<string, unknown>;
    if (record.farmId !== farmId || typeof record.id !== 'string') {
      throw new Error('Invalid farm record found in ' + label + '.');
    }
  });
}

function timestamp(value: unknown) {
  if (!value || typeof value !== 'object') return 0;
  const record = value as Record<string, unknown>;
  for (const key of ['updatedAt', 'createdAt']) {
    const raw = record[key];
    if (typeof raw === 'string') {
      const parsed = Date.parse(raw);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return 0;
}

function mergeById<T extends { id: string }>(remote: T[], local: T[]): T[] {
  const items = new Map<string, T>();
  remote.forEach(item => items.set(item.id, item));
  local.forEach(item => {
    const existing = items.get(item.id);
    if (!existing) {
      items.set(item.id, item);
      return;
    }
    const localTime = timestamp(item);
    const remoteTime = timestamp(existing);
    // Prefer the newest known record. If legacy records have no comparable
    // timestamp, preserve the local copy so unsynced edits are not discarded.
    if (!remoteTime || !localTime || localTime >= remoteTime) {
      items.set(item.id, item);
    }
  });
  return Array.from(items.values());
}

function mergeProfile(
  remote: UserProfile | null,
  local: UserProfile | null,
): UserProfile | null {
  if (!remote) return local;
  if (!local) return remote;
  if (remote.onboardingCompleted && !local.onboardingCompleted) return remote;
  if (local.onboardingCompleted && !remote.onboardingCompleted) return local;
  const remoteTime = timestamp(remote);
  const localTime = timestamp(local);
  if (remoteTime && localTime) return remoteTime > localTime ? remote : local;
  return local;
}

function parseLocal<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function readOwnerList<
  T extends { id: string; ownerId: string; farmId?: string },
>(
  uid: string,
  farmId: string,
  scopedName: string,
  legacyName: string,
  field: keyof OwnerList<T>,
): Promise<T[]> {
  const scoped = await driveJsonStore.readJson<OwnerList<T>>(scopedName);
  const legacy = scoped
    ? null
    : await driveJsonStore.readJson<OwnerList<T>>(legacyName);
  const snapshot = scoped ?? legacy;
  if (!snapshot) return [];

  assertOwner(snapshot, uid, scopedName);
  if (snapshot.farmId && snapshot.farmId !== farmId) return [];

  const data = snapshot[field];
  if (data === undefined) return [];
  assertRecords(data, uid, farmId, scopedName);
  return data as T[];
}

export type WorkspaceRecoveryResult = {
  profile: UserProfile | null;
  farms: Farm[];
  restored: boolean;
};

type RecoveryResult = {
  found: boolean;
  farms: number;
  records: number;
};

export async function restoreWorkspaceFromDrive(
  uid: string,
): Promise<WorkspaceRecoveryResult> {
  const user = getFirebaseAuth().currentUser;
  if (!user || user.uid !== uid) {
    throw new Error('Sign in to the matching MetlholoAI account first.');
  }

  const result = await safelyRestoreWorkspace(user);
  return {
    profile: await getUserProfile(uid),
    farms: await listFarms(uid),
    restored: result.found,
  };
}

/**
 * Reconcile every persisted MetlholoAI domain.
 *
 * Drive is read and validated first. Nothing local or remote is changed until
 * the complete remote workspace has passed owner/farm validation. Local and
 * remote records are merged by stable ID, then the merged workspace is written
 * back to both AsyncStorage and the canonical Drive files. This lets data
 * created while a Drive access token was expired catch up after reconnection.
 */
async function safelyRestoreWorkspace(user: User): Promise<RecoveryResult> {
  if (!driveJsonStore.isConnected()) {
    throw new Error(
      'Connect the same Google Drive account before restoring your workspace.',
    );
  }

  const uid = user.uid;
  const current = await AsyncStorage.multiGet([
    'metlholoai.profile.' + uid,
    'metlholoai.farms.' + uid,
    'metlholoai.marketplace.' + uid,
  ]);
  const local = new Map(current);
  const previousProfile = parseLocal<UserProfile>(
    local.get('metlholoai.profile.' + uid) ?? null,
  );
  const previousFarms =
    parseLocal<Farm[]>(local.get('metlholoai.farms.' + uid) ?? null) ?? [];
  const localMarketplace =
    parseLocal<MarketplaceListing[]>(
      local.get('metlholoai.marketplace.' + uid) ?? null,
    ) ?? [];

  const [remoteProfile, snapshot, marketplace] = await Promise.all([
    driveJsonStore.readJson<UserProfile>('profile.json'),
    driveJsonStore.readJson<FarmSnapshot>('farm-data.json'),
    driveJsonStore.readJson<OwnerList<MarketplaceListing>>('marketplace.json'),
  ]);

  if (remoteProfile) assertOwner(remoteProfile, uid, 'Profile');

  if (snapshot) {
    assertOwner(snapshot, uid, 'Farm backup');
    if (
      !Array.isArray(snapshot.farms) ||
      !snapshot.records ||
      typeof snapshot.records !== 'object'
    ) {
      throw new Error(
        'Farm backup is incomplete. Google Drive files were not modified.',
      );
    }

    snapshot.farms.forEach(farm => {
      assertOwner(farm, uid, 'Farm');
      if (!farm.id || typeof farm.id !== 'string') {
        throw new Error('Invalid farm ID in Google Drive backup.');
      }
      for (const type of recordTypes) {
        assertRecords(
          snapshot.records[farm.id]?.[type] ?? [],
          uid,
          farm.id,
          type,
        );
      }
    });
  }

  if (marketplace) {
    assertOwner(marketplace, uid, 'Marketplace');
    if (marketplace.listings && !Array.isArray(marketplace.listings)) {
      throw new Error('Invalid marketplace backup.');
    }
    marketplace.listings?.forEach(listing =>
      assertOwner(listing, uid, 'Marketplace listing'),
    );
  }

  const remoteFarms = snapshot?.farms ?? [];
  const farms = mergeById(remoteFarms, previousFarms);

  // Separate record files are per-farm and can exist even when farm-data.json
  // came from an older application version. Inspect the union of local and
  // remote farms so nothing is skipped.
  const auxiliary = await Promise.all(
    farms.map(async farm => ({
      farmId: farm.id,
      cases: await readOwnerList<FarmCase>(
        uid,
        farm.id,
        'cases-' + farm.id + '.json',
        'cases.json',
        'cases',
      ),
      treatments: await readOwnerList<TreatmentRecord>(
        uid,
        farm.id,
        'treatments-' + farm.id + '.json',
        'treatments.json',
        'treatments',
      ),
      diagnoses: await readOwnerList<DiagnosisRecord>(
        uid,
        farm.id,
        'diagnoses-' + farm.id + '.json',
        'diagnoses.json',
        'records',
      ),
    })),
  );

  const hasRemoteAuxiliary = auxiliary.some(
    item =>
      item.cases.length > 0 ||
      item.treatments.length > 0 ||
      item.diagnoses.length > 0,
  );
  const hasRemoteData = Boolean(
    remoteProfile ||
      snapshot ||
      marketplace ||
      hasRemoteAuxiliary,
  );
  const hasLocalWorkspace = Boolean(
    previousProfile || previousFarms.length > 0 || localMarketplace.length > 0,
  );

  if (!hasRemoteData && !hasLocalWorkspace) {
    return { found: false, farms: 0, records: 0 };
  }

  const fallbackProfile: UserProfile | null =
    farms.length > 0
      ? {
          uid,
          displayName:
            user.displayName || user.email?.split('@')[0] || 'Farmer',
          email: user.email ?? '',
          photoURL: user.photoURL,
          role: 'FARMER',
          status: 'active',
          subscriptionTier: 'FREE',
          onboardingCompleted: true,
        }
      : null;
  const profile = mergeProfile(
    remoteProfile ?? fallbackProfile,
    previousProfile,
  );

  const updates: Array<[string, string]> = [];
  if (profile) {
    updates.push([
      'metlholoai.profile.' + uid,
      JSON.stringify(profile),
    ]);
  }
  updates.push([
    'metlholoai.farms.' + uid,
    JSON.stringify(farms),
  ]);

  const farmRecords: Record<
    string,
    Partial<Record<FarmRecordType, FarmRecord[]>>
  > = {};
  const mergedCases = new Map<string, FarmCase[]>();
  const mergedTreatments = new Map<string, TreatmentRecord[]>();
  const mergedDiagnoses = new Map<string, DiagnosisRecord[]>();

  let count = 0;

  for (const farm of farms) {
    farmRecords[farm.id] = {};

    for (const type of recordTypes) {
      const storageKey =
        'metlholoai.farmRecords.' + uid + '.' + farm.id + '.' + type;
      const existing =
        parseLocal<FarmRecord[]>(
          await AsyncStorage.getItem(storageKey),
        ) ?? [];
      const fromDrive = snapshot?.records[farm.id]?.[type] ?? [];
      const merged = mergeById(fromDrive, existing);
      farmRecords[farm.id]![type] = merged;
      count += merged.length;
      updates.push([storageKey, JSON.stringify(merged)]);
    }

    const aux = auxiliary.find(item => item.farmId === farm.id);

    const localCases =
      parseLocal<FarmCase[]>(
        await AsyncStorage.getItem(
          'metlholoai.cases.' + uid + '.' + farm.id,
        ),
      ) ?? [];
    const cases = mergeById(aux?.cases ?? [], localCases);
    mergedCases.set(farm.id, cases);
    count += cases.length;
    updates.push([
      'metlholoai.cases.' + uid + '.' + farm.id,
      JSON.stringify(cases),
    ]);

    const localTreatments =
      parseLocal<TreatmentRecord[]>(
        await AsyncStorage.getItem(
          'metlholoai.treatments.' + uid + '.' + farm.id,
        ),
      ) ?? [];
    const treatments = mergeById(
      aux?.treatments ?? [],
      localTreatments,
    );
    mergedTreatments.set(farm.id, treatments);
    count += treatments.length;
    updates.push([
      'metlholoai.treatments.' + uid + '.' + farm.id,
      JSON.stringify(treatments),
    ]);

    const localDiagnoses =
      parseLocal<DiagnosisRecord[]>(
        await AsyncStorage.getItem(
          'metlholoai.diagnoses.' + uid + '.' + farm.id,
        ),
      ) ?? [];
    const diagnoses = mergeById(
      aux?.diagnoses ?? [],
      localDiagnoses,
    );
    mergedDiagnoses.set(farm.id, diagnoses);
    count += diagnoses.length;
    updates.push([
      'metlholoai.diagnoses.' + uid + '.' + farm.id,
      JSON.stringify(diagnoses),
    ]);
  }

  const mergedMarketplace = mergeById(
    marketplace?.listings ?? [],
    localMarketplace,
  );
  count += mergedMarketplace.length;
  updates.push([
    'metlholoai.marketplace.' + uid,
    JSON.stringify(mergedMarketplace),
  ]);

  // Only now, after every Drive file has been validated, mutate local state.
  await AsyncStorage.multiSet(updates);

  const syncedAt = new Date().toISOString();

  // Push the reconciled workspace back to Drive. This closes the gap where a
  // token expired, records were created locally, and the user later reconnects.
  const writes: Array<Promise<unknown>> = [];

  if (profile) {
    writes.push(driveJsonStore.writeJson('profile.json', profile));
  }

  writes.push(
    driveJsonStore.writeJson('farm-data.json', {
      ownerId: uid,
      farms,
      records: farmRecords,
      updatedAt: syncedAt,
    }),
  );

  for (const farm of farms) {
    writes.push(
      driveJsonStore.writeJson('cases-' + farm.id + '.json', {
        ownerId: uid,
        farmId: farm.id,
        cases: mergedCases.get(farm.id) ?? [],
        updatedAt: syncedAt,
      }),
      driveJsonStore.writeJson('treatments-' + farm.id + '.json', {
        ownerId: uid,
        farmId: farm.id,
        treatments: mergedTreatments.get(farm.id) ?? [],
        updatedAt: syncedAt,
      }),
      driveJsonStore.writeJson('diagnoses-' + farm.id + '.json', {
        ownerId: uid,
        farmId: farm.id,
        records: mergedDiagnoses.get(farm.id) ?? [],
        updatedAt: syncedAt,
      }),
    );
  }

  writes.push(
    driveJsonStore.writeJson('marketplace.json', {
      ownerId: uid,
      listings: mergedMarketplace,
      updatedAt: syncedAt,
    }),
  );

  await Promise.all(writes);

  return {
    found: hasRemoteData || hasLocalWorkspace,
    farms: farms.length,
    records: count,
  };
}
