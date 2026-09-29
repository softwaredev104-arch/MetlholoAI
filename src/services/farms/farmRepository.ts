import { addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { getFirestoreDb } from '@/services/firebase/client';

export type FarmRecordType = 'animals' | 'crops' | 'healthRecords' | 'tasks' | 'feedingPlans' | 'marketplace';

export type Farm = { id: string; ownerId: string; name: string; location?: string; latitude?: number; longitude?: number; description?: string; size?: number; sizeUnit?: string; farmType?: string; createdAt: string; updatedAt?: string; };
export type FarmRecord = { id: string; ownerId: string; farmId: string; type: FarmRecordType; name: string; notes?: string; status?: string; quantity?: number; unit?: string; createdAt: string; [key: string]: unknown; };

export function stripUndefined<T extends Record<string, unknown>>(value: T): Partial<T> {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as Partial<T>;
}

const db = () => getFirestoreDb();

export async function listFarms(ownerId: string): Promise<Farm[]> {
  const snapshot = await getDocs(query(collection(db(), 'farms'), where('ownerId', '==', ownerId)));
  return snapshot.docs.map(item => {
    const data = item.data();
    if (
      typeof data.ownerId !== 'string' ||
      typeof data.name !== 'string' ||
      typeof data.createdAt !== 'string'
    ) {
      throw new Error(`Invalid farm record: ${item.id}`);
    }

    return {
      id: item.id,
      ownerId: data.ownerId,
      name: data.name,
      location: typeof data.location === 'string' ? data.location : undefined,
      latitude: typeof data.latitude === 'number' ? data.latitude : undefined,
      longitude: typeof data.longitude === 'number' ? data.longitude : undefined,
      description: typeof data.description === 'string' ? data.description : undefined,
      size: typeof data.size === 'number' ? data.size : undefined,
      sizeUnit: typeof data.sizeUnit === 'string' ? data.sizeUnit : undefined,
      farmType: typeof data.farmType === 'string' ? data.farmType : undefined,
      createdAt: data.createdAt,
      updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : undefined,
    };
  });
}

export async function createFarm(ownerId: string, input: Omit<Partial<Farm>, 'id' | 'ownerId' | 'createdAt'> & Pick<Farm, 'name'>) {
  const createdAt = new Date().toISOString();
  const definedInput = stripUndefined(input);
  const ref = await addDoc(collection(db(), 'farms'), { ...definedInput, ownerId, createdAt });
  return { id: ref.id, ownerId, ...definedInput, createdAt } as Farm;
}

export async function updateFarm(ownerId: string, farmId: string, input: Partial<Omit<Farm, 'id' | 'ownerId' | 'createdAt'>>) {
  const snapshot = await getDocs(query(collection(db(), 'farms'), where('ownerId', '==', ownerId)));
  if (!snapshot.docs.some(item => item.id === farmId)) throw new Error('Farm not found.');
  const definedInput = stripUndefined(input);
  await updateDoc(doc(db(), 'farms', farmId), { ...definedInput, updatedAt: new Date().toISOString() });
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
  const definedInput = Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  );
  const ref = await addDoc(collection(db(), 'farms', farmId, type), { ...definedInput, ownerId, farmId, type, createdAt });
  return { id: ref.id, ...definedInput, ownerId, farmId, type, createdAt } as FarmRecord;
}

export async function updateFarmRecord(farmId: string, type: FarmRecordType, id: string, input: Partial<FarmRecord>) {
  const definedInput = Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  );
  await updateDoc(doc(db(), 'farms', farmId, type, id), { ...definedInput, updatedAt: new Date().toISOString() });
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
        )),
      ),
    );
    const diagnosisSnapshot = await getDocs(query(
      collection(db(), 'farms', farmId, 'diagnostics'),
      where('sourceRecordId', '==', id),
    ));

    const hasLinkedHistory = linked.some(snapshot =>
      snapshot.docs.some(item => item.data().relatedRecordType === type),
    );
    const hasDiagnoses = diagnosisSnapshot.docs.some(item =>
      item.data().sourceRecordType === type,
    );

    if (hasLinkedHistory || hasDiagnoses) {
      throw new Error('This asset has linked history. Remove or reassign its health, feeding, task, and diagnosis records before deleting it.');
    }
  }

  await deleteDoc(doc(db(), 'farms', farmId, type, id));
}
