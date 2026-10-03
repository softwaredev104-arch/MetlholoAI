import AsyncStorage from '@react-native-async-storage/async-storage';
import { driveJsonStore } from '@/services/drive/driveJsonStore';

export type TreatmentRecord = {
  id: string;
  ownerId: string;
  farmId: string;
  caseId?: string;
  animalId?: string;
  animalName?: string;
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
  status: 'planned' | 'active' | 'completed';
  createdAt: string;
  updatedAt: string;
};

const key = (ownerId: string, farmId: string) =>
  'metlholoai.treatments.' + ownerId + '.' + farmId;

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
  if (driveJsonStore.isConnected()) {
    await driveJsonStore.writeJson('treatments.json', {
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
