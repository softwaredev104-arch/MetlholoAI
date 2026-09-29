import { can, PERMISSIONS } from '@/authorization/permissions';

describe('permission system', () => {
  it('keeps authorization centralized by role', () => {
    expect(can('FARMER', PERMISSIONS.FARM_CREATE)).toBe(true);
    expect(can('BUSINESS', PERMISSIONS.ADMIN_SYSTEM)).toBe(false);
    expect(can('ADMIN', PERMISSIONS.ADMIN_SYSTEM)).toBe(true);
  });
});