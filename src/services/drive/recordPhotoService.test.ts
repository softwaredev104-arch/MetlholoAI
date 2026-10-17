const mockGetToken = jest.fn(() => 'test-token');
const mockRootFolder = jest.fn(async () => 'metlholoai-folder');
let mockConnected = true;

jest.mock('react-native', () => ({
  Platform: { OS: 'web' },
}));

jest.mock('@/services/drive/driveAuthService', () => ({
  driveAuthService: {
    isConnected: () => mockConnected,
    getAccessToken: () => mockGetToken(),
  },
}));

jest.mock('@/services/drive/driveJsonStore', () => ({
  driveJsonStore: { ensureRootFolder: () => mockRootFolder() },
}));

import {
  recordPhotoService,
  uploadRecordPhotos,
} from '@/services/drive/recordPhotoService';

const context = {
  ownerId: 'user-1',
  farmId: 'farm-1',
  recordType: 'animals' as const,
};

const pending = {
  uri: 'blob:photo-picked-in-browser',
  name: 'Cattle.jpg',
  mimeType: 'image/jpeg',
};

beforeEach(() => {
  mockConnected = true;
  mockGetToken.mockClear();
  mockRootFolder.mockClear();
  jest.restoreAllMocks();
});

describe('private user-owned Drive image storage', () => {
  it('uploads a real multipart binary with scoped owner/farm metadata', async () => {
    const requests: Array<{ url: string; init?: RequestInit }> = [];
    const originalFetch = globalThis.fetch;
    globalThis.fetch = jest.fn(async (url, init) => {
      requests.push({ url: String(url), init });
      if (String(url).startsWith('blob:')) {
        return {
          ok: true,
          blob: async () => new Blob(['image-binary'], { type: 'image/jpeg' }),
        } as unknown as Response;
      }
      return {
        ok: true,
        json: async () => ({
          id: 'drive-file-1',
          name: 'saved-cattle.jpg',
          mimeType: 'image/jpeg',
        }),
      } as Response;
    }) as typeof fetch;

    try {
      const result = await recordPhotoService.upload(context, pending);
      expect(result.id).toBe('drive-file-1');
      expect(result.mimeType).toBe('image/jpeg');
      const upload = requests.find(item => item.url.includes('uploadType=multipart'));
      expect(upload).toBeTruthy();
      expect(upload?.init?.method).toBe('POST');
      const requestBody = upload?.init?.body as Blob;
      expect(requestBody.type).toContain('multipart/related');
      const binary = await requestBody.text();
      expect(binary).toContain('image-binary');
      expect(binary).toContain('"ownerId":"user-1"');
      expect(binary).toContain('"farmId":"farm-1"');
      expect(binary).toContain('"recordType":"animals"');
      expect(binary).toContain('metlholoai-folder');
      expect(upload?.init?.headers).toBeTruthy();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('refuses to treat an expired Drive session as a completed image save', async () => {
    mockConnected = false;
    await expect(uploadRecordPhotos(context, [pending])).rejects.toThrow(
      'Reconnect Google Drive',
    );
  });

  it('rejects unsupported photo types before storing private files', async () => {
    await expect(recordPhotoService.upload(context, {
      ...pending,
      mimeType: 'image/svg+xml',
    })).rejects.toThrow('JPEG, PNG or WebP');
  });

  it('does not fetch a photo belonging to another farm', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({
        mimeType: 'image/jpeg',
        appProperties: {
          ownerId: 'user-1',
          farmId: 'foreign-farm',
          recordType: 'animals',
        },
      }),
    })) as unknown as typeof fetch;
    try {
      await expect(recordPhotoService.viewUrl(context, {
        id: 'drive-file-1',
        name: 'Cattle.jpg',
        mimeType: 'image/jpeg',
        size: 10,
        createdAt: '2026-10-17T10:00:00.000Z',
      })).rejects.toThrow('not part of the signed-in farm');
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
