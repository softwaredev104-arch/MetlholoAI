import AsyncStorage from '@react-native-async-storage/async-storage';
import { driveJsonStore } from '@/services/drive/driveJsonStore';
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
  imageUri?: string;
  createdAt: string;
};

const key = (ownerId: string, farmId: string) =>
  'metlholoai.diagnoses.' + ownerId + '.' + farmId;

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
  if (driveJsonStore.isConnected()) {
    await driveJsonStore.writeJson('diagnoses.json', {
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

export async function listDiagnoses(ownerId: string, farmId: string) {
  return read(ownerId, farmId);
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
