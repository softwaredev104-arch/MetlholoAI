const mockStorage = new Map<string, string>();

import { driveAuthService } from './driveAuthService';
import { isGoogleIdentityReady, prepareGoogleIdentity } from '@/services/auth/googleIdentity';

jest.mock('react-native', () => ({ Platform: { OS: 'web' } }));
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async (key: string) => mockStorage.get(key) ?? null),
    setItem: jest.fn(async (key: string, value: string) => { mockStorage.set(key, value); }),
    removeItem: jest.fn(async (key: string) => { mockStorage.delete(key); }),
  },
}));
jest.mock('@/config/env', () => ({
  googleDriveClientId: 'test-client-id',
  isGoogleDriveConfigured: true,
}));
jest.mock('@/services/firebase/client', () => ({
  getFirebaseAuth: () => ({ currentUser: null }),
}));
jest.mock('@/services/auth/googleIdentity', () => ({
  isGoogleIdentityReady: jest.fn(() => false),
  prepareGoogleIdentity: jest.fn(async () => {}),
}));

describe('Google Drive consent is separate from returning Firebase authentication', () => {
  beforeEach(() => {
    mockStorage.clear();
    (isGoogleIdentityReady as jest.Mock).mockReturnValue(false);
    jest.clearAllMocks();
  });

  it('uses a previously saved grant instead of forcing consent again', async () => {
    const ownerId = 'uid-with-prior-grant';
    mockStorage.set('metlholoai.driveGrant.' + ownerId, JSON.stringify({
      ownerId, accountEmail: 'farmer@example.com',
      grantedAt: '2026-10-01T00:00:00Z', lastConnectedAt: '2026-10-01T00:00:00Z',
    }));
    await expect(driveAuthService.hasRememberedGrant(ownerId)).resolves.toBe(true);
    (isGoogleIdentityReady as jest.Mock).mockReturnValue(true);

    let callback: ((response: { error: string }) => void) | undefined;
    const requestAccessToken = jest.fn();
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: { google: { accounts: { oauth2: {
        initTokenClient: jest.fn((config: { callback: typeof callback }) => {
          callback = config.callback;
          return { requestAccessToken };
        }),
      } } } },
    });

    const attempt = driveAuthService.connect({ ownerId });
    expect(requestAccessToken).toHaveBeenCalledWith({ prompt: '' });
    callback?.({ error: 'access_denied' });
    await expect(attempt).rejects.toThrow('access_denied');
  });

  it('does not launch OAuth on an automatic returning-user restore', async () => {
    await expect(driveAuthService.restore({ ownerId: 'uid-1', force: true })).resolves.toBe(false);
    expect(isGoogleIdentityReady).not.toHaveBeenCalled();
    expect(prepareGoogleIdentity).not.toHaveBeenCalled();
  });

  it('never prompts for Google permission if the SDK is still loading', async () => {
    await expect(driveAuthService.connect({ ownerId: 'uid-1' }))
      .rejects.toThrow('authorization is still loading');
    expect(isGoogleIdentityReady).toHaveBeenCalled();
  });
});
