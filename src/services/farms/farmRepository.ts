import AsyncStorage from '@react-native-async-storage/async-storage';

export type FarmRecordType = 'animals' | 'crops' | 'healthRecords' | 'tasks' | 'feedingPlans' | 'marketplace';

export type Farm = { id: string; ownerId: string; name: string; location?: string; latitude?: number; longitude?: number; createdAt: string; };
export type FarmRecord = { id: string; ownerId: string; farmId: string; type: FarmRecordType; name: string; notes?: string; status?: string; quantity?: number; unit?: string; createdAt: string; [key: string]: unknown; };

const farmsKey = (ownerId: string) => `metlholoai.farms.${ownerId}`;
const recordsKey = (ownerId: string, farmId: string, type: FarmRecordType) =>
  `metlholoai.farmRecords.${ownerId}.${farmId}.${type}`;

function id(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

async function readList<T>(key: string): Promise<T[]> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return [];
  try { return JSON.parse(raw) as T[]; } catch { return []; }
}

async function writeList<T>(key: string, value: T[]) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function listFarms(ownerId: string): Promise<Farm[]> {
  return readList<Farm>(farmsKey(ownerId));
}

export async function createFarm(ownerId: string, input: Pick<Farm, 'name' | 'location' | 'latitude' | 'longitude'>) {
  const farms = await listFarms(ownerId);
  const farm: Farm = { id: id('farm'), ownerId, ...input, createdAt: new Date().toISOString() };
  await writeList(farmsKey(ownerId), [...farms, farm]);
  return farm;
}

export async function listFarmRecords(ownerId: string, farmId: string, type: FarmRecordType): Promise<FarmRecord[]> {
  return readList<FarmRecord>(recordsKey(ownerId, farmId, type));
}

export async function createFarmRecord(ownerId: string, farmId: string, type: FarmRecordType, input: Omit<FarmRecord, 'id' | 'ownerId' | 'farmId' | 'type' | 'createdAt'>) {
  const records = await listFarmRecords(ownerId, farmId, type);
  const record: FarmRecord = { id: id('record'), ...input, ownerId, farmId, type, createdAt: new Date().toISOString() };
  await writeList(recordsKey(ownerId, farmId, type), [...records, record]);
  return record;
}

export async function updateFarmRecord(ownerId: string, farmId: string, type: FarmRecordType, recordId: string, input: Partial<FarmRecord>) {
  const records = await listFarmRecords(ownerId, farmId, type);
  await writeList(recordsKey(ownerId, farmId, type), records.map(item => item.id === recordId ? { ...item, ...input } : item));
}

export async function deleteFarmRecord(ownerId: string, farmId: string, type: FarmRecordType, recordId: string) {
  const records = await listFarmRecords(ownerId, farmId, type);
  await writeList(recordsKey(ownerId, farmId, type), records.filter(item => item.id !== recordId));
}
