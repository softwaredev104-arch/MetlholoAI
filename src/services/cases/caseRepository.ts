import AsyncStorage from '@react-native-async-storage/async-storage';
import { driveJsonStore } from '@/services/drive/driveJsonStore';
import { driveAuthService } from '@/services/drive/driveAuthService';
import type { StoredPhoto } from '@/services/drive/recordPhotoService';

export type FarmCase = {
  id: string;
  ownerId: string;
  farmId: string;
  subjectType?: 'animal' | 'crop' | 'general';
  subjectId?: string;
  subjectName?: string;
  animalId?: string;
  animalName?: string;
  cropId?: string;
  cropName?: string;
  disease: string;
  sourceDiagnosisId?: string;
  verificationStatus?: 'farmer_reported' | 'expert_reviewed' | 'officially_confirmed';
  regionalContribution?: {
    status: 'draft_not_shared';
    preparedAt: string;
  };
  severity: 'Mild' | 'Moderate' | 'Severe' | 'Critical';
  district?: string;
  village?: string;
  location?: string;
  notes?: string;
  photos?: Array<string | StoredPhoto>; // string is legacy local-only URI
  status: 'open' | 'monitoring' | 'resolved';
  createdAt: string;
  updatedAt: string;
};

const key = (ownerId: string, farmId: string) =>
  'metlholoai.cases.' + ownerId + '.' + farmId;
const driveFile = (farmId: string) => `cases-${farmId}.json`;

async function read(ownerId: string, farmId: string): Promise<FarmCase[]> {
  const raw = await AsyncStorage.getItem(key(ownerId, farmId));
  if (!raw) return [];
  try {
    return JSON.parse(raw) as FarmCase[];
  } catch {
    return [];
  }
}

async function persist(ownerId: string, farmId: string, cases: FarmCase[]) {
  await AsyncStorage.setItem(key(ownerId, farmId), JSON.stringify(cases));
  if (await driveAuthService.ensureConnected(ownerId)) {
    await driveJsonStore.writeJson(driveFile(farmId), {
      ownerId,
      farmId,
      cases,
      updatedAt: new Date().toISOString(),
    });
  }
}

export async function listCases(ownerId: string, farmId: string) {
  return read(ownerId, farmId);
}

export async function restoreCasesFromDrive(ownerId: string, farmId: string) {
  if (!driveJsonStore.isConnected()) return [] as FarmCase[];

  let remote = await driveJsonStore.readJson<{
    ownerId?: string;
    farmId?: string;
    cases?: FarmCase[];
  }>(driveFile(farmId));

  if (!remote) {
    const legacy = await driveJsonStore.readJson<{
      ownerId?: string;
      farmId?: string;
      cases?: FarmCase[];
    }>('cases.json');
    if (legacy?.farmId === farmId) remote = legacy;
  }

  if (
    !remote ||
    remote.ownerId !== ownerId ||
    remote.farmId !== farmId ||
    !Array.isArray(remote.cases)
  ) {
    return [] as FarmCase[];
  }

  const cases = remote.cases.filter(
    item => item.ownerId === ownerId && item.farmId === farmId,
  );
  await AsyncStorage.setItem(key(ownerId, farmId), JSON.stringify(cases));
  return cases;
}

export async function createCase(
  ownerId: string,
  farmId: string,
  input: Omit<FarmCase, 'id' | 'ownerId' | 'farmId' | 'createdAt' | 'updatedAt'>,
) {
  const current = await read(ownerId, farmId);
  const now = new Date().toISOString();
  const record: FarmCase = {
    ...input,
    id: 'case_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
    ownerId,
    farmId,
    createdAt: now,
    updatedAt: now,
  };
  await persist(ownerId, farmId, [record, ...current]);
  return record;
}

export async function updateCase(
  ownerId: string,
  farmId: string,
  caseId: string,
  patch: Partial<FarmCase>,
) {
  const current = await read(ownerId, farmId);
  const next = current.map(item =>
    item.id === caseId
      ? { ...item, ...patch, updatedAt: new Date().toISOString() }
      : item,
  );
  await persist(ownerId, farmId, next);
  return next.find(item => item.id === caseId) ?? null;
}
