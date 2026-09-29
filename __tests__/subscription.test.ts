import { canUseFeature } from '@/authorization/subscriptions';

describe('subscription access', () => {
  it('enforces feature minimum tiers', () => {
    expect(canUseFeature('FREE', 'disease_detection')).toBe(true);
    expect(canUseFeature('FREE', 'advanced_reports')).toBe(false);
    expect(canUseFeature('PRO', 'advanced_analytics')).toBe(true);
    expect(canUseFeature('PRO', 'priority_intelligence')).toBe(false);
    expect(canUseFeature('BUSINESS', 'priority_intelligence')).toBe(true);
  });
});