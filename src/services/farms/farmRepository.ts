import { addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { getFirestoreDb } from '@/services/firebase/client';

export type FarmRecordType = 'animals' | 'crops' | 'healthRecords' | 'tasks' | 'feedingPlans' | 'marketplace';

export type Farm = { id: string; ownerId: string; name: string; location?: string; latitude?: number; longitude?: number; createdAt: string; };
export type FarmRecord = { id: string; ownerId: string; farmId: string; type: FarmRecordType; name: string; notes?: string; status?: string; quantity?: number; unit?: string; createdAt: string; [key: string]: unknown; };

const db = () => getFirestoreDb();

export async function listFarms(ownerId: string): Promise<Farm[]> {
  const snapshot = await getDocs(query(collection(db(), 'farms'), where('ownerId', '==', ownerId)));
  return snapshot.docs.map(item => ({ id: item.id, ...item.data() } as Farm));
}

export async function createFarm(ownerId: string, input: Pick<Farm, 'name' | 'location' | 'latitude' | 'longitude'>) {
  const createdAt = new Date().toISOString();
  const ref = await addDoc(collection(db(), 'farms'), { ...input, ownerId, createdAt });
  return { id: ref.id, ownerId, ...input, createdAt } as Farm;
}

export async function listFarmRecords(ownerId: string, farmId: string, type: FarmRecordType): Promise<FarmRecord[]> {
  const snapshot = await getDocs(query(collection(db(), 'farms', farmId, type), where('ownerId', '==', ownerId)));
  return snapshot.docs.map(item => ({ id: item.id, ...item.data() } as FarmRecord));
}

export async function createFarmRecord(ownerId: string, farmId: string, type: FarmRecordType, input: Omit<FarmRecord, 'id' | 'ownerId' | 'farmId' | 'type' | 'createdAt'>) {
  const createdAt = new Date().toISOString();
  const ref = await addDoc(collection(db(), 'farms', farmId, type), { ...input, ownerId, farmId, type, createdAt });
  return { id: ref.id, ...input, ownerId, farmId, type, createdAt } as FarmRecord;
}

export async function updateFarmRecord(farmId: string, type: FarmRecordType, id: string, input: Partial<FarmRecord>) {
  await updateDoc(doc(db(), 'farms', farmId, type, id), { ...input, updatedAt: new Date().toISOString() });
}

export async function deleteFarmRecord(farmId: string, type: FarmRecordType, id: string) {
  await deleteDoc(doc(db(), 'farms', farmId, type, id));
}
