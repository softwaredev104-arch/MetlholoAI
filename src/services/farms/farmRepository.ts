import { addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { getFirestoreDb } from '@/services/firebase/client';

export type FarmRecordType = 'animals' | 'crops' | 'healthRecords' | 'tasks' | 'feedingPlans' | 'marketplace';

export type Farm = { id: string; ownerId: string; name: string; location?: string; latitude?: number; longitude?: number; description?: string; size?: number; sizeUnit?: string; farmType?: string; createdAt: string; updatedAt?: string; };
export type FarmRecord = { id: string; ownerId: string; farmId: string; type: FarmRecordType; name: string; notes?: string; status?: string; quantity?: number; unit?: string; createdAt: string; [key: string]: unknown; };

const db = () => getFirestoreDb();

export async function listFarms(ownerId: string): Promise<Farm[]> {
  const snapshot = await getDocs(query(collection(db(), 'farms'), where('ownerId', '==', ownerId)));
  return snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
}

export async function createFarm(ownerId: string, input: Omit<Partial<Farm>, 'id' | 'ownerId' | 'createdAt'> & Pick<Farm, 'name'>) {
  const createdAt = new Date().toISOString();
  const ref = await addDoc(collection(db(), 'farms'), { ...input, ownerId, createdAt });
  return { id: ref.id, ownerId, ...input, createdAt } as Farm;
}

export async function updateFarm(ownerId: string, farmId: string, input: Partial<Omit<Farm, 'id' | 'ownerId' | 'createdAt'>>) {
  const snapshot = await getDocs(query(collection(db(), 'farms'), where('ownerId', '==', ownerId)));
  if (!snapshot.docs.some(item => item.id === farmId)) throw new Error('Farm not found.');
  await updateDoc(doc(db(), 'farms', farmId), { ...input, updatedAt: new Date().toISOString() });
}

const FARM_RECORD_TYPES: FarmRecordType[] = ['animals', 'crops', 'healthRecords', 'tasks', 'feedingPlans', 'marketplace'];

export async function deleteFarm(ownerId: string, farmId: string) {
  const snapshot = await getDocs(query(collection(db(), 'farms'), where('ownerId', '==', ownerId)));
  if (!snapshot.docs.some(item => item.id === farmId)) throw new Error('Farm not found.');

  const childSnapshots = await Promise.all([
    ...FARM_RECORD_TYPES.map(type => getDocs(collection(db(), 'farms', farmId, type))),
    getDocs(collection(db(), 'farms', farmId, 'diagnostics')),
  ]);
  if (childSnapshots.some(child => !child.empty)) {
    throw new Error('This farm still has records or diagnosis history. Delete or archive those records first.');
  }
  await deleteDoc(doc(db(), 'farms', farmId));
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
  if (type === 'animals' || type === 'crops') {
    const relatedCollections: FarmRecordType[] = type === 'animals'
      ? ['healthRecords', 'tasks', 'feedingPlans']
      : ['healthRecords', 'tasks'];

    const linked = await Promise.all(
      relatedCollections.map(collectionName =>
        getDocs(query(
          collection(db(), 'farms', farmId, collectionName),
          where('relatedRecordId', '==', id),
          where('relatedRecordType', '==', type),
        )),
      ),
    );
    const diagnosisSnapshot = await getDocs(query(
      collection(db(), 'farms', farmId, 'diagnostics'),
      where('sourceRecordId', '==', id),
      where('sourceRecordType', '==', type),
    ));

    if (linked.some(snapshot => !snapshot.empty) || !diagnosisSnapshot.empty) {
      throw new Error('This asset has linked history. Remove or reassign its health, feeding, task, and diagnosis records before deleting it.');
    }
  }

  await deleteDoc(doc(db(), 'farms', farmId, type, id));
}
