const mockStorage = new Map<string, string>();

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async (key: string) => mockStorage.get(key) ?? null),
    setItem: jest.fn(async (key: string, value: string) => {
      mockStorage.set(key, value);
    }),
    removeItem: jest.fn(async (key: string) => {
      mockStorage.delete(key);
    }),
  },
}));

jest.mock('@/services/drive/driveJsonStore', () => ({
  driveJsonStore: {
    isConnected: jest.fn(() => true),
    readJson: jest.fn(),
    writeJson: jest.fn(),
  },
}));

import { driveJsonStore } from '@/services/drive/driveJsonStore';
import {
  getUserProfile,
  restoreUserProfileFromDrive,
} from '@/services/auth/userProfileService';
import {
  listFarmRecords,
  listFarms,
  restoreFarmDataFromDrive,
  type Farm,
  type FarmRecord,
} from '@/services/farms/farmRepository';

const mockReadJson = driveJsonStore.readJson as jest.Mock;

describe('Google Drive workspace recovery', () => {
  beforeEach(() => {
    mockStorage.clear();
    mockReadJson.mockReset();
  });

  it('restores a returning user profile from Drive using the same Firebase uid', async () => {
    mockReadJson.mockResolvedValueOnce({
      uid: 'user-123',
      displayName: 'Returning Farmer',
      email: 'farmer@example.com',
      role: 'FARMER',
      subscriptionTier: 'FREE',
      status: 'active',
      onboardingCompleted: true,
      farmName: 'Recovered Farm',
    });

    const restored = await restoreUserProfileFromDrive('user-123');

    expect(restored?.onboardingCompleted).toBe(true);
    expect((await getUserProfile('user-123'))?.farmName).toBe('Recovered Farm');
  });

  it('refuses to hydrate another Firebase users Drive profile', async () => {
    mockReadJson.mockResolvedValueOnce({
      uid: 'different-user',
      displayName: 'Other User',
      email: 'other@example.com',
      role: 'FARMER',
      subscriptionTier: 'FREE',
      status: 'active',
      onboardingCompleted: true,
    });

    await expect(restoreUserProfileFromDrive('user-123')).resolves.toBeNull();
    await expect(getUserProfile('user-123')).resolves.toBeNull();
  });

  it('restores farms and typed farm records from farm-data.json', async () => {
    const farm: Farm = {
      id: 'farm-1',
      ownerId: 'user-123',
      name: 'Drive Farm',
      farmType: 'MIXED',
      createdAt: '2026-10-01T00:00:00.000Z',
    };

    const animal: FarmRecord = {
      id: 'animal-1',
      ownerId: 'user-123',
      farmId: 'farm-1',
      type: 'animals',
      name: 'Bontle',
      createdAt: '2026-10-01T00:00:00.000Z',
    };

    mockReadJson.mockResolvedValueOnce({
      ownerId: 'user-123',
      farms: [farm],
      records: {
        'farm-1': {
          animals: [animal],
          crops: [],
          healthRecords: [],
          tasks: [],
          feedingPlans: [],
          marketplace: [],
        },
      },
    });

    const restoredFarms = await restoreFarmDataFromDrive('user-123');

    expect(restoredFarms).toHaveLength(1);
    expect((await listFarms('user-123'))[0]?.name).toBe('Drive Farm');
    expect(
      (await listFarmRecords('user-123', 'farm-1', 'animals'))[0]?.name,
    ).toBe('Bontle');
  });
});
