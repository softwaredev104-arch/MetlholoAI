import { addDoc, collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { getFirestoreDb } from '@/services/firebase/client';
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

export async function createDiagnosis(input: Omit<DiagnosisRecord, 'id' | 'createdAt'>) {
  const createdAt = new Date().toISOString();
  const ref = await addDoc(collection(getFirestoreDb(), 'farms', input.farmId, 'diagnostics'), {
    ...input,
    createdAt,
  });
  return { ...input, id: ref.id, createdAt } as DiagnosisRecord;
}

export async function listDiagnoses(ownerId: string, farmId: string) {
  const snapshot = await getDocs(query(
    collection(getFirestoreDb(), 'farms', farmId, 'diagnostics'),
    where('ownerId', '==', ownerId),
    orderBy('createdAt', 'desc'),
  ));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as DiagnosisRecord[];
}

export function predictionOutcome(prediction: PredictionResult, model: IntelligenceModel) {
  const raw = String(prediction.disease ?? prediction.prediction ?? prediction.class ?? prediction.label ?? 'Unknown').trim();
  if (model.id === 'cattle-health-classifier') {
    const normalized = raw.toLowerCase().replace(/[_-]+/g, ' ');
    if (normalized.includes('lumpy')) return 'Lumpy Skin Disease';
    if (normalized.includes('foot') && normalized.includes('mouth')) return 'Foot and Mouth Disease';
    if (normalized === 'healthy' || normalized.includes('normal')) return 'Healthy';
  }
  return raw;
}
