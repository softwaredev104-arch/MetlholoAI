import AsyncStorage from '@react-native-async-storage/async-storage';
import { driveJsonStore } from '@/services/drive/driveJsonStore';
import { driveAuthService } from '@/services/drive/driveAuthService';
import type { StoredPhoto } from '@/services/drive/recordPhotoService';
import type { PredictionResult } from '@/services/intelligence/client';
import type { IntelligenceModel } from '@/services/intelligence/catalog';

export type DiagnosisRecord = {
  id: string;
  ownerId: string;
  farmId: string;
  sourceRecordType: 'animals' | 'crops';
  sourceRecordId: string;
  sourceName: string;
  modelId: string;
  modelName: string;
  subject: string;
  outcome: string;
  confidence: number;
  report?: unknown;
  updatedAt?: string;
  candidates?: Array<{ label: string; confidence: number }>;
  provider?: string;
  modelVersion?: string;
  validatedForBotswana?: boolean;
  reviewStatus?: 'ai_suggestion' | 'pending_expert_review' | 'expert_reviewed';
  imageUri?: string; // legacy local URI; not portable across devices
  image?: StoredPhoto;
  createdAt: string;
};

const key = (ownerId: string, farmId: string) =>
  'metlholoai.diagnoses.' + ownerId + '.' + farmId;
const driveFile = (farmId: string) => `diagnoses-${farmId}.json`;

async function read(ownerId: string, farmId: string) {
  const raw = await AsyncStorage.getItem(key(ownerId, farmId));
  if (!raw) return [] as DiagnosisRecord[];
  try {
    return JSON.parse(raw) as DiagnosisRecord[];
  } catch {
    return [] as DiagnosisRecord[];
  }
}

async function persist(
  ownerId: string,
  farmId: string,
  records: DiagnosisRecord[],
) {
  await AsyncStorage.setItem(key(ownerId, farmId), JSON.stringify(records));
  if (await driveAuthService.ensureConnected(ownerId)) {
    await driveJsonStore.writeJson(driveFile(farmId), {
      ownerId,
      farmId,
      records,
      updatedAt: new Date().toISOString(),
    });
  }
}

export async function createDiagnosis(
  input: Omit<DiagnosisRecord, 'id' | 'createdAt'>,
) {
  const records = await read(input.ownerId, input.farmId);
  const record: DiagnosisRecord = {
    ...input,
    id:
      'diagnosis_' +
      Date.now() +
      '_' +
      Math.random().toString(36).slice(2, 8),
    createdAt: new Date().toISOString(),
  };
  await persist(input.ownerId, input.farmId, [record, ...records]);
  return record;
}

export async function attachDiagnosisReport(
  ownerId: string,
  farmId: string,
  diagnosisId: string,
  report: unknown,
): Promise<DiagnosisRecord> {
  const records = await read(ownerId, farmId);
  const index = records.findIndex(
    item => item.id === diagnosisId && item.ownerId === ownerId && item.farmId === farmId,
  );
  if (index < 0) throw new Error('Saved diagnosis not found; report was not attached.');
  const updated = { ...records[index]!, report, updatedAt: new Date().toISOString() };
  records[index] = updated;
  await persist(ownerId, farmId, records);
  return updated;
}

export async function listDiagnoses(ownerId: string, farmId: string) {
  return read(ownerId, farmId);
}

export async function restoreDiagnosesFromDrive(
  ownerId: string,
  farmId: string,
) {
  if (!driveJsonStore.isConnected()) return [] as DiagnosisRecord[];

  let remote = await driveJsonStore.readJson<{
    ownerId?: string;
    farmId?: string;
    records?: DiagnosisRecord[];
  }>(driveFile(farmId));

  if (!remote) {
    const legacy = await driveJsonStore.readJson<{
      ownerId?: string;
      farmId?: string;
      records?: DiagnosisRecord[];
    }>('diagnoses.json');
    if (legacy?.farmId === farmId) remote = legacy;
  }

  if (
    !remote ||
    remote.ownerId !== ownerId ||
    remote.farmId !== farmId ||
    !Array.isArray(remote.records)
  ) {
    return [] as DiagnosisRecord[];
  }

  const records = remote.records.filter(
    item => item.ownerId === ownerId && item.farmId === farmId,
  );
  await AsyncStorage.setItem(key(ownerId, farmId), JSON.stringify(records));
  return records;
}

export function predictionOutcome(
  prediction: PredictionResult,
  _model: IntelligenceModel,
) {
  return String(
    prediction.disease ??
      prediction.prediction ??
      prediction.class ??
      prediction.label ??
      'Unknown',
  ).trim();
}
