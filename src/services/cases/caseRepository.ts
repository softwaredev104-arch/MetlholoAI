import AsyncStorage from '@react-native-async-storage/async-storage';
import { driveJsonStore } from '@/services/drive/driveJsonStore';

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
  severity: 'Mild' | 'Moderate' | 'Severe' | 'Critical';
  district?: string;
  village?: string;
  location?: string;
  notes?: string;
  photos?: string[];
  status: 'open' | 'monitoring' | 'resolved';
  createdAt: string;
  updatedAt: string;
};

const key = (ownerId: string, farmId: string) =>
  'metlholoai.cases.' + ownerId + '.' + farmId;

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
  if (driveJsonStore.isConnected()) {
    await driveJsonStore.writeJson('cases.json', {
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
