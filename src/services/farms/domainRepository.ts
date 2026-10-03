import type { FarmRecord } from '@/services/farms/farmRepository';
import {
  createFarmRecord,
  deleteFarmRecord,
  listFarmRecords,
  updateFarmRecord,
} from '@/services/farms/farmRepository';

export type AnimalRecord = FarmRecord & {
  species?: string;
  breed?: string;
  tag?: string;
  age?: string;
  weightKg?: number;
  sex?: string;
  purpose?: string;
  healthStatus?: string;
  vaccinations?: string[];
  lastCheckup?: string;
};

export type CropFieldRecord = FarmRecord & {
  cropType?: string;
  variety?: string;
  areaHectares?: number;
  location?: string;
  growthStage?: string;
  healthStatus?: string;
  irrigationType?: string;
  soilType?: string;
  plantedDate?: string;
  harvestDate?: string;
  lastInspection?: string;
};

export type HealthRecord = FarmRecord & {
  recordType?: string;
  relatedName?: string;
  relatedId?: string;
  description?: string;
  date?: string;
  dueDate?: string;
  officer?: string;
  cost?: number;
};

export type FarmTask = FarmRecord & {
  category?: string;
  priority?: string;
  dueDate?: string;
  relatedTo?: string;
};

export type FeedingPlan = FarmRecord & {
  animalName?: string;
  species?: string;
  feedType?: string;
  amount?: string;
  frequency?: string;
  supplement?: string;
  costPerDay?: number;
};

type CreateInput = Record<string, unknown> & { name: string };

const list = <T extends FarmRecord>(
  ownerId: string,
  farmId: string,
  type: Parameters<typeof listFarmRecords>[2],
) => listFarmRecords(ownerId, farmId, type) as Promise<T[]>;

export const farmDomain = {
  animals: {
    list: (ownerId: string, farmId: string) =>
      list<AnimalRecord>(ownerId, farmId, 'animals'),
    create: (ownerId: string, farmId: string, input: CreateInput) =>
      createFarmRecord(ownerId, farmId, 'animals', input) as Promise<AnimalRecord>,
    update: (
      ownerId: string,
      farmId: string,
      recordId: string,
      input: Partial<AnimalRecord>,
    ) => updateFarmRecord(ownerId, farmId, 'animals', recordId, input),
    remove: (ownerId: string, farmId: string, recordId: string) =>
      deleteFarmRecord(ownerId, farmId, 'animals', recordId),
  },
  crops: {
    list: (ownerId: string, farmId: string) =>
      list<CropFieldRecord>(ownerId, farmId, 'crops'),
    create: (ownerId: string, farmId: string, input: CreateInput) =>
      createFarmRecord(ownerId, farmId, 'crops', input) as Promise<CropFieldRecord>,
    update: (
      ownerId: string,
      farmId: string,
      recordId: string,
      input: Partial<CropFieldRecord>,
    ) => updateFarmRecord(ownerId, farmId, 'crops', recordId, input),
    remove: (ownerId: string, farmId: string, recordId: string) =>
      deleteFarmRecord(ownerId, farmId, 'crops', recordId),
  },
  health: {
    list: (ownerId: string, farmId: string) =>
      list<HealthRecord>(ownerId, farmId, 'healthRecords'),
    create: (ownerId: string, farmId: string, input: CreateInput) =>
      createFarmRecord(ownerId, farmId, 'healthRecords', input) as Promise<HealthRecord>,
    update: (
      ownerId: string,
      farmId: string,
      recordId: string,
      input: Partial<HealthRecord>,
    ) => updateFarmRecord(ownerId, farmId, 'healthRecords', recordId, input),
  },
  tasks: {
    list: (ownerId: string, farmId: string) =>
      list<FarmTask>(ownerId, farmId, 'tasks'),
    create: (ownerId: string, farmId: string, input: CreateInput) =>
      createFarmRecord(ownerId, farmId, 'tasks', input) as Promise<FarmTask>,
    update: (
      ownerId: string,
      farmId: string,
      recordId: string,
      input: Partial<FarmTask>,
    ) => updateFarmRecord(ownerId, farmId, 'tasks', recordId, input),
  },
  feeding: {
    list: (ownerId: string, farmId: string) =>
      list<FeedingPlan>(ownerId, farmId, 'feedingPlans'),
    create: (ownerId: string, farmId: string, input: CreateInput) =>
      createFarmRecord(ownerId, farmId, 'feedingPlans', input) as Promise<FeedingPlan>,
    update: (
      ownerId: string,
      farmId: string,
      recordId: string,
      input: Partial<FeedingPlan>,
    ) => updateFarmRecord(ownerId, farmId, 'feedingPlans', recordId, input),
  },
};

export async function getRecordById<T extends FarmRecord>(
  records: Promise<T[]>,
  id: string,
) {
  return (await records).find(item => item.id === id) ?? null;
}
