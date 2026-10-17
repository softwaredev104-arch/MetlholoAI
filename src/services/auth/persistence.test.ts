import { requirePersistentBrowserSignIn } from '@/services/auth/persistence';
import { setPersistence, browserLocalPersistence, indexedDBLocalPersistence } from 'firebase/auth';

jest.mock('react-native', () => ({ Platform: { OS: 'web' } }));
jest.mock('@/services/firebase/client', () => ({ getFirebaseAuth: () => ({ test: true }) }));
jest.mock('firebase/auth', () => ({
  browserLocalPersistence: { type: 'LOCAL' },
  indexedDBLocalPersistence: { type: 'INDEXED_DB' },
  setPersistence: jest.fn(),
}));

const persist = setPersistence as jest.Mock;

describe('web Firebase sign-in persistence', () => {
  beforeEach(() => persist.mockReset());

  it('requires local persistence before a sign-in completes', async () => {
    persist.mockResolvedValue(undefined);
    await expect(requirePersistentBrowserSignIn()).resolves.toBeUndefined();
    expect(persist).toHaveBeenCalledWith(expect.anything(), browserLocalPersistence);
  });

  it('tries IndexedDB when localStorage is restricted', async () => {
    persist.mockRejectedValueOnce(new Error('localStorage blocked'));
    persist.mockResolvedValueOnce(undefined);
    await expect(requirePersistentBrowserSignIn()).resolves.toBeUndefined();
    expect(persist).toHaveBeenNthCalledWith(2, expect.anything(), indexedDBLocalPersistence);
  });

  it('never silently falls back to temporary session or in-memory persistence', async () => {
    persist.mockRejectedValue(new Error('storage blocked'));
    await expect(requirePersistentBrowserSignIn()).rejects.toThrow('blocking saved sign-in sessions');
    expect(persist).toHaveBeenCalledTimes(2);
  });
});
