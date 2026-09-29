import { countActiveListings, countOpenTasks, sumNumericQuantities } from '@/services/dashboard/dashboardMetrics';
import type { FarmRecord } from '@/services/farms/farmRepository';

const record = (values: Partial<FarmRecord>): FarmRecord => ({
  id: '1',
  ownerId: 'owner',
  farmId: 'farm',
  type: 'tasks',
  name: 'Record',
  createdAt: new Date().toISOString(),
  ...values,
});

describe('farm dashboard metrics', () => {
  it('counts only genuinely open tasks', () => {
    expect(countOpenTasks([
      record({ status: 'done' }),
      record({ status: 'Completed' }),
      record({ status: 'complete' }),
      record({ status: 'in progress' }),
      record({ status: undefined }),
    ])).toBe(2);
  });

  it('counts listings other than sold as active', () => {
    expect(countActiveListings([
      record({ status: 'published' }),
      record({ status: 'sold' }),
      record({ status: 'Sold' }),
      record({ status: 'draft' }),
    ])).toBe(2);
  });

  it('sums finite numeric quantities and ignores malformed values', () => {
    expect(sumNumericQuantities([
      record({ quantity: 10 }),
      record({ quantity: 2.5 }),
      record({ quantity: Number.NaN }),
      record({ quantity: undefined }),
      record({ quantity: '5' as unknown as number }),
    ])).toBe(12.5);
  });
});
