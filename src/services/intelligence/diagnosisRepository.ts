import { addDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { getFirestoreDb } from '@/services/firebase/client';
import { stripUndefined } from '@/utils/firestore';

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

export type CreateDiagnosisInput = Omit<DiagnosisRecord, 'id' | 'createdAt'>;

export async function createDiagnosis(input: CreateDiagnosisInput): Promise<DiagnosisRecord> {
  const createdAt = new Date().toISOString();
  const ref = await addDoc(
    collection(getFirestoreDb(), 'farms', input.farmId, 'diagnostics'),
    { ...stripUndefined(input), createdAt },
  );

  return { ...input, id: ref.id, createdAt };
}

export async function listDiagnoses(ownerId: string, farmId: string): Promise<DiagnosisRecord[]> {
  const snapshot = await getDocs(
    query(
      collection(getFirestoreDb(), 'farms', farmId, 'diagnostics'),
      where('ownerId', '==', ownerId),
    ),
  );

  return snapshot.docs
    .map(item => ({ id: item.id, ...item.data() }) as DiagnosisRecord)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
