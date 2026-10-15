import AsyncStorage from '@react-native-async-storage/async-storage';
import { driveJsonStore } from '@/services/drive/driveJsonStore';
import { restoreWorkspaceFromDrive } from './workspaceRecoveryService';

const mockItems = new Map<string, string>();
const mockDriveFiles = new Map<string, unknown>();

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async (key: string) => mockItems.get(key) ?? null),
    multiGet: jest.fn(async (keys: string[]) =>
      keys.map(key => [key, mockItems.get(key) ?? null])),
    multiSet: jest.fn(async (pairs: Array<[string, string]>) => {
      pairs.forEach(([key, value]) => mockItems.set(key, value));
    }),
  },
}));

jest.mock('@/services/firebase/client', () => ({
  getFirebaseAuth: () => ({ currentUser: user }),
}));
jest.mock('@/services/drive/driveAuthService', () => ({
  driveAuthService: { isConnected: () => true },
}));
jest.mock('@/services/drive/driveJsonStore', () => ({
  driveJsonStore: {
    isConnected: jest.fn(() => true),
    readJson: jest.fn(async (name: string) => mockDriveFiles.get(name) ?? null),
    writeJson: jest.fn(),
  },
}));

const user = {
  uid: 'uid-123', email: 'farmer@example.com', displayName: 'Farmer',
};

beforeEach(() => {
  mockItems.clear();
  mockDriveFiles.clear();
  jest.clearAllMocks();
});

describe('returning user recovery', () => {
  it('does not create a blank profile or write to Drive if no backup exists', async () => {
    const result = await restoreWorkspaceFromDrive(user.uid);
    expect(result.restored).toBe(false);
    expect(AsyncStorage.multiSet).not.toHaveBeenCalled();
    expect(driveJsonStore.writeJson).not.toHaveBeenCalled();
  });

  it('restores a matching profile, farms, animals, and legacy cases without deleting local changes', async () => {
    mockDriveFiles.set('profile.json', {
      uid: user.uid,
      email: user.email,
      role: 'FARMER',
      subscriptionTier: 'FREE',
      status: 'active',
      displayName: 'Farmer',
      onboardingCompleted: true,
    });
    mockDriveFiles.set('farm-data.json', {
      ownerId: user.uid,
      farms: [{ id: 'farm-1', ownerId: user.uid, name: 'My Farm' }],
      records: {
        'farm-1': {
          animals: [{
            id: 'animal-drive', ownerId: user.uid, farmId: 'farm-1',
            type: 'animals', name: 'Kgomo', createdAt: '2026-01-01',
          }],
        },
      },
    });
    mockDriveFiles.set('cases.json', {
      ownerId: user.uid,
      farmId: 'farm-1',
      cases: [{
        id: 'case-drive', ownerId: user.uid, farmId: 'farm-1',
        disease: 'Follow-up', severity: 'Mild', status: 'open',
      }],
    });
    mockItems.set('metlholoai.farmRecords.uid-123.farm-1.animals', JSON.stringify([
      {
        id: 'animal-local', ownerId: user.uid, farmId: 'farm-1',
        type: 'animals', name: 'Local', createdAt: '2026-04-01',
      },
    ]));

    const result = await restoreWorkspaceFromDrive(user.uid);
    expect(result.restored).toBe(true);
    expect(result.farms).toHaveLength(1);
    const restored = JSON.parse(
      mockItems.get('metlholoai.farmRecords.uid-123.farm-1.animals') ?? '[]',
    ) as Array<{ id: string }>;
    expect(restored.map(item => item.id).sort()).toEqual([
      'animal-drive', 'animal-local',
    ]);
    const cases = JSON.parse(
      mockItems.get('metlholoai.cases.uid-123.farm-1') ?? '[]',
    ) as Array<{ id: string }>;
    expect(cases[0]?.id).toBe('case-drive');
    const profile = JSON.parse(mockItems.get('metlholoai.profile.uid-123') ?? '{}');
    expect(profile.onboardingCompleted).toBe(true);
    expect(driveJsonStore.writeJson).not.toHaveBeenCalled();
  });

  it('rejects another Firebase UID without writing any local data', async () => {
    mockDriveFiles.set('profile.json', {
      uid: 'foreign-account',
      onboardingCompleted: true,
    });
    mockItems.set('metlholoai.farms.uid-123', JSON.stringify([{ id: 'keep-me' }]));

    await expect(restoreWorkspaceFromDrive(user.uid)).rejects.toThrow(
      'different MetlholoAI account',
    );
    expect(mockItems.get('metlholoai.farms.uid-123')).toContain('keep-me');
    expect(AsyncStorage.multiSet).not.toHaveBeenCalled();
  });
});
