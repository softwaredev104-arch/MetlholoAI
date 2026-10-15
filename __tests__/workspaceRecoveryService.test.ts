const storage = new Map<string, string>();
const remote = new Map<string, unknown>();

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async (key: string) => storage.get(key) ?? null),
    setItem: jest.fn(async (key: string, value: string) => {
      storage.set(key, value);
    }),
    multiGet: jest.fn(async (keys: string[]) =>
      keys.map(key => [key, storage.get(key) ?? null]),
    ),
    multiSet: jest.fn(async (pairs: Array<[string, string]>) => {
      pairs.forEach(([key, value]) => storage.set(key, value));
    }),
    removeItem: jest.fn(async (key: string) => storage.delete(key)),
  },
}));

jest.mock('@/services/firebase/client', () => ({
  getFirebaseAuth: () => ({
    currentUser: {
      uid: 'user-1',
      email: 'farmer@example.com',
      displayName: 'Returning Farmer',
      photoURL: null,
    },
  }),
}));

jest.mock('@/services/drive/driveJsonStore', () => ({
  driveJsonStore: {
    isConnected: jest.fn(() => true),
    readJson: jest.fn(async (name: string) => remote.get(name) ?? null),
    writeJson: jest.fn(async (name: string, value: unknown) => {
      remote.set(name, value);
      return { id: name };
    }),
  },
}));

import { restoreWorkspaceFromDrive } from '@/services/drive/workspaceRecoveryService';

const farm = {
  id: 'farm-1',
  ownerId: 'user-1',
  name: 'Tlokweng Farm',
  createdAt: '2026-10-01T08:00:00.000Z',
};

function farmRecord(
  id: string,
  type:
    | 'animals'
    | 'crops'
    | 'healthRecords'
    | 'tasks'
    | 'feedingPlans'
    | 'marketplace',
  name: string,
) {
  return {
    id,
    ownerId: 'user-1',
    farmId: 'farm-1',
    type,
    name,
    createdAt: '2026-10-01T08:00:00.000Z',
  };
}

beforeEach(() => {
  storage.clear();
  remote.clear();
  jest.clearAllMocks();

  remote.set('profile.json', {
    uid: 'user-1',
    displayName: 'Returning Farmer',
    email: 'farmer@example.com',
    role: 'FARMER',
    subscriptionTier: 'FREE',
    status: 'active',
    onboardingCompleted: true,
    updatedAt: '2026-10-10T08:00:00.000Z',
  });

  remote.set('farm-data.json', {
    ownerId: 'user-1',
    farms: [farm],
    records: {
      'farm-1': {
        animals: [farmRecord('animal-1', 'animals', 'Bontle')],
        crops: [farmRecord('crop-1', 'crops', 'Spinach Field')],
        healthRecords: [
          farmRecord('health-1', 'healthRecords', 'Vaccination'),
        ],
        tasks: [farmRecord('task-1', 'tasks', 'Inspect irrigation')],
        feedingPlans: [
          farmRecord('feed-1', 'feedingPlans', 'Cattle morning feed'),
        ],
        marketplace: [
          farmRecord('farm-market-1', 'marketplace', 'Farm produce'),
        ],
      },
    },
    updatedAt: '2026-10-10T08:00:00.000Z',
  });

  remote.set('cases-farm-1.json', {
    ownerId: 'user-1',
    farmId: 'farm-1',
    cases: [
      {
        id: 'case-1',
        ownerId: 'user-1',
        farmId: 'farm-1',
        disease: 'Skin concern',
        severity: 'Mild',
        status: 'open',
        createdAt: '2026-10-02T08:00:00.000Z',
        updatedAt: '2026-10-02T08:00:00.000Z',
      },
    ],
  });

  remote.set('treatments-farm-1.json', {
    ownerId: 'user-1',
    farmId: 'farm-1',
    treatments: [
      {
        id: 'treatment-1',
        ownerId: 'user-1',
        farmId: 'farm-1',
        treatmentName: 'Topical care',
        status: 'active',
        createdAt: '2026-10-02T08:00:00.000Z',
        updatedAt: '2026-10-02T08:00:00.000Z',
      },
    ],
  });

  remote.set('diagnoses-farm-1.json', {
    ownerId: 'user-1',
    farmId: 'farm-1',
    records: [
      {
        id: 'diagnosis-1',
        ownerId: 'user-1',
        farmId: 'farm-1',
        sourceRecordType: 'crops',
        sourceRecordId: 'crop-1',
        sourceName: 'Spinach Field',
        modelId: 'spinach',
        modelName: 'Spinach model',
        subject: 'spinach',
        outcome: 'Healthy',
        confidence: 0.98,
        createdAt: '2026-10-03T08:00:00.000Z',
      },
    ],
  });

  remote.set('marketplace.json', {
    ownerId: 'user-1',
    listings: [
      {
        id: 'listing-1',
        ownerId: 'user-1',
        farmId: 'farm-1',
        title: 'Spinach',
        listingType: 'crop',
        currency: 'BWP',
        status: 'draft',
        createdAt: '2026-10-04T08:00:00.000Z',
      },
    ],
  });
});

describe('complete MetlholoAI workspace recovery', () => {
  it('hydrates every persisted farm domain before analytics reads local data', async () => {
    const result = await restoreWorkspaceFromDrive('user-1');

    expect(result.restored).toBe(true);
    expect(result.farms).toHaveLength(1);

    const expected = [
      ['animals', 'animal-1'],
      ['crops', 'crop-1'],
      ['healthRecords', 'health-1'],
      ['tasks', 'task-1'],
      ['feedingPlans', 'feed-1'],
      ['marketplace', 'farm-market-1'],
    ] as const;

    for (const [type, id] of expected) {
      const records = JSON.parse(
        storage.get(
          'metlholoai.farmRecords.user-1.farm-1.' + type,
        ) ?? '[]',
      ) as Array<{ id: string }>;
      expect(records.some(item => item.id === id)).toBe(true);
    }

    for (const [domain, id] of [
      ['cases', 'case-1'],
      ['treatments', 'treatment-1'],
      ['diagnoses', 'diagnosis-1'],
    ]) {
      const records = JSON.parse(
        storage.get(
          'metlholoai.' + domain + '.user-1.farm-1',
        ) ?? '[]',
      ) as Array<{ id: string }>;
      expect(records.some(item => item.id === id)).toBe(true);
    }

    const listings = JSON.parse(
      storage.get('metlholoai.marketplace.user-1') ?? '[]',
    ) as Array<{ id: string }>;
    expect(listings.some(item => item.id === 'listing-1')).toBe(true);
  });

  it('keeps unsynced local records and backfills them to Google Drive after reconnect', async () => {
    storage.set(
      'metlholoai.farmRecords.user-1.farm-1.tasks',
      JSON.stringify([
        {
          ...farmRecord('task-local', 'tasks', 'Local unsynced task'),
          createdAt: '2026-10-14T08:00:00.000Z',
        },
      ]),
    );

    await restoreWorkspaceFromDrive('user-1');

    const farmData = remote.get('farm-data.json') as {
      records: Record<string, { tasks: Array<{ id: string }> }>;
    };
    expect(
      farmData.records['farm-1'].tasks.map(item => item.id).sort(),
    ).toEqual(['task-1', 'task-local']);
  });

  it('does not silently mix a foreign owner into the signed-in workspace', async () => {
    remote.set('profile.json', {
      uid: 'different-user',
      onboardingCompleted: true,
    });

    await expect(
      restoreWorkspaceFromDrive('user-1'),
    ).rejects.toThrow('different MetlholoAI account');

    expect(storage.size).toBe(0);
  });
});
