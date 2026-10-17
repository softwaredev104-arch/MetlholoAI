import { driveAuthService } from './driveAuthService';
import { isGoogleIdentityReady, prepareGoogleIdentity } from '@/services/auth/googleIdentity';

jest.mock('react-native', () => ({ Platform: { OS: 'web' } }));
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: { getItem: jest.fn(async () => null), setItem: jest.fn(async () => {}), removeItem: jest.fn(async () => {}) },
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
