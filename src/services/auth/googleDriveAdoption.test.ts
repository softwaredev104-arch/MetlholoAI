import { authService } from './authService';
import { driveAuthService } from '@/services/drive/driveAuthService';
import { signInWithCredential } from 'firebase/auth';

jest.mock('react-native', () => ({ Platform: { OS: 'web' } }));
jest.mock('@/config/env', () => ({ googleDriveClientId: 'test-client-id' }));
jest.mock('@/services/firebase/client', () => ({
  getFirebaseAuth: jest.fn(() => ({ currentUser: { uid: 'uid-1' } })),
}));
jest.mock('@/services/auth/userProfileService', () => ({
  createInitialUserProfile: jest.fn(),
}));
jest.mock('./persistence', () => ({
  requirePersistentBrowserSignIn: jest.fn(async () => {}),
}));
jest.mock('./googleIdentity', () => ({
  isGoogleIdentityReady: jest.fn(() => true),
  prepareGoogleIdentity: jest.fn(async () => {}),
}));
jest.mock('@/services/drive/driveAuthService', () => ({
  driveAuthService: { adoptAccessToken: jest.fn() },
}));
jest.mock('firebase/auth', () => ({
  GoogleAuthProvider: { credential: jest.fn(() => ({ type: 'google-credential' })) },
  signInWithCredential: jest.fn(async () => ({
    user: { uid: 'uid-1', email: 'farmer@example.com' },
  })),
  onAuthStateChanged: jest.fn(() => jest.fn()),
}));

describe('Google login reuses its Drive authorization', () => {
  it('holds the workspace bootstrap until Drive token adoption finishes', async () => {
    let completeDrive: (() => void) | undefined;
    (driveAuthService.adoptAccessToken as jest.Mock).mockImplementation(
      () => new Promise<void>(resolve => { completeDrive = resolve; }),
    );

    let receiveToken:
      | ((response: { access_token: string; expires_in: number }) => void)
      | undefined;
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: { google: { accounts: { oauth2: {
        initTokenClient: jest.fn((config: { callback: typeof receiveToken }) => {
          receiveToken = config.callback;
          return { requestAccessToken: jest.fn() };
        }),
      } } } },
    });

    const login = authService.signInWithGoogle();
    receiveToken?.({ access_token: 'google-token', expires_in: 3600 });

    for (let i = 0; i < 12 && !completeDrive; i++) {
      await Promise.resolve();
    }
    expect(signInWithCredential).toHaveBeenCalledTimes(1);
    expect(driveAuthService.adoptAccessToken).toHaveBeenCalledWith(
      'google-token', 3600, { ownerId: 'uid-1', expectedEmail: 'farmer@example.com' },
    );

    let bootstrapReleased = false;
    const pending = authService.waitForGoogleDriveAdoption().then(() => {
      bootstrapReleased = true;
    });
    await Promise.resolve();
    expect(bootstrapReleased).toBe(false);

    completeDrive?.();
    await Promise.all([login, pending]);
    expect(bootstrapReleased).toBe(true);
  });
});
