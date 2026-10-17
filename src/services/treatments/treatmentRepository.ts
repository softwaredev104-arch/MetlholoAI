import AsyncStorage from '@react-native-async-storage/async-storage';
import { driveJsonStore } from '@/services/drive/driveJsonStore';
import { driveAuthService } from '@/services/drive/driveAuthService';
import type { StoredPhoto } from '@/services/drive/recordPhotoService';

export type TreatmentRecord = {
  id: string;
  ownerId: string;
  farmId: string;
  caseId?: string;
  subjectType?: 'animal' | 'crop' | 'general';
  subjectId?: string;
  subjectName?: string;
  animalId?: string;
  animalName?: string;
  cropId?: string;
  cropName?: string;
  treatmentName: string;
  dosage?: string;
  frequency?: string;
  method?: string;
  startDate?: string;
  endDate?: string;
  followUp?: boolean;
  notifyVet?: boolean;
  cost?: number;
  notes?: string;
  photos?: StoredPhoto[];
  status: 'planned' | 'active' | 'completed';
  createdAt: string;
  updatedAt: string;
};

const key = (ownerId: string, farmId: string) =>
  'metlholoai.treatments.' + ownerId + '.' + farmId;
const driveFile = (farmId: string) => `treatments-${farmId}.json`;

async function read(ownerId: string, farmId: string): Promise<TreatmentRecord[]> {
  const raw = await AsyncStorage.getItem(key(ownerId, farmId));
  if (!raw) return [];
  try {
    return JSON.parse(raw) as TreatmentRecord[];
  } catch {
    return [];
  }
}

async function persist(
  ownerId: string,
  farmId: string,
  treatments: TreatmentRecord[],
) {
  await AsyncStorage.setItem(key(ownerId, farmId), JSON.stringify(treatments));
  if (await driveAuthService.ensureConnected(ownerId)) {
    await driveJsonStore.writeJson(driveFile(farmId), {
      ownerId,
      farmId,
      treatments,
      updatedAt: new Date().toISOString(),
    });
  }
}

export async function listTreatments(ownerId: string, farmId: string) {
  return read(ownerId, farmId);
}

export async function restoreTreatmentsFromDrive(
  ownerId: string,
  farmId: string,
) {
  if (!driveJsonStore.isConnected()) return [] as TreatmentRecord[];

  let remote = await driveJsonStore.readJson<{
    ownerId?: string;
    farmId?: string;
    treatments?: TreatmentRecord[];
  }>(driveFile(farmId));

  if (!remote) {
    const legacy = await driveJsonStore.readJson<{
      ownerId?: string;
      farmId?: string;
      treatments?: TreatmentRecord[];
    }>('treatments.json');
    if (legacy?.farmId === farmId) remote = legacy;
  }

  if (
    !remote ||
    remote.ownerId !== ownerId ||
    remote.farmId !== farmId ||
    !Array.isArray(remote.treatments)
  ) {
    return [] as TreatmentRecord[];
  }

  const treatments = remote.treatments.filter(
    item => item.ownerId === ownerId && item.farmId === farmId,
  );
  await AsyncStorage.setItem(
    key(ownerId, farmId),
    JSON.stringify(treatments),
  );
  return treatments;
}

export async function createTreatment(
  ownerId: string,
  farmId: string,
  input: Omit<
    TreatmentRecord,
    'id' | 'ownerId' | 'farmId' | 'createdAt' | 'updatedAt'
  >,
) {
  const current = await read(ownerId, farmId);
  const now = new Date().toISOString();
  const record: TreatmentRecord = {
    ...input,
    id:
      'treatment_' +
      Date.now() +
      '_' +
      Math.random().toString(36).slice(2, 8),
    ownerId,
    farmId,
    createdAt: now,
    updatedAt: now,
  };
  await persist(ownerId, farmId, [record, ...current]);
  return record;
}

export async function updateTreatment(
  ownerId: string,
  farmId: string,
  treatmentId: string,
  patch: Partial<TreatmentRecord>,
) {
  const current = await read(ownerId, farmId);
  const next = current.map(item =>
    item.id === treatmentId
      ? { ...item, ...patch, updatedAt: new Date().toISOString() }
      : item,
  );
  await persist(ownerId, farmId, next);
  return next.find(item => item.id === treatmentId) ?? null;
}
