import type { FarmRecord } from '@/services/farms/farmRepository';

export function countOpenTasks(records: FarmRecord[]): number {
  return records.filter(record => !['done', 'completed', 'complete'].includes((record.status ?? '').toLowerCase())).length;
}

export function countActiveListings(records: FarmRecord[]): number {
  return records.filter(record => (record.status ?? '').toLowerCase() !== 'sold').length;
}

export function sumNumericQuantities(records: FarmRecord[]): number {
  return records.reduce(
    (sum, record) => sum + (typeof record.quantity === 'number' && Number.isFinite(record.quantity) ? record.quantity : 0),
    0,
  );
}
