import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { googleDriveClientId, isGoogleDriveConfigured } from '@/config/env';
import { getFirebaseAuth } from '@/services/firebase/client';

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient(config: {
            client_id: string;
            scope: string;
            callback: (response: {
              access_token?: string;
              expires_in?: number;
              error?: string;
              error_description?: string;
            }) => void;
            error_callback?: (error: { type?: string }) => void;
          }): { requestAccessToken(options?: { prompt?: string }): void };
        };
      };
    };
  }
}

const SCOPE =
  'openid email profile https://www.googleapis.com/auth/drive.file';
const hintKey = (uid: string) => 'metlholoai.drive.previouslyAuthorized.' + uid;
let accessToken = '';
let expiresAt = 0;
let tokenOwnerUid = '';
let loader: Promise<void> | null = null;

function loadGoogleIdentityServices(): Promise<void> {
  if (Platform.OS !== 'web' || typeof document === 'undefined') {
    return Promise.reject(
      new Error('Google Drive authorization is currently supported on the web preview.'),
    );
  }
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (loader) return loader;
  loader = new Promise<void>((resolve, reject) => {
    const finish = () => {
      if (window.google?.accounts?.oauth2) resolve();
      else reject(new Error('Google Identity Services did not initialize.'));
    };
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-metlholo-google-identity]',
    );
    if (existing) {
      existing.addEventListener('load', finish, { once: true });
      existing.addEventListener('error', () => reject(new Error('Google Identity Services failed to load.')), { once: true });
      // A script inserted by the Firebase sign-in flow might already have fired load.
      if (window.google?.accounts?.oauth2) finish();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.dataset.metlholoGoogleIdentity = 'true';
    script.onload = finish;
    script.onerror = () => reject(new Error('Google Identity Services failed to load.'));
    document.head.appendChild(script);
  }).catch(error => {
    loader = null;
    throw error;
  });
  return loader;
}

function currentUid() {
  return getFirebaseAuth().currentUser?.uid ?? '';
}

export const driveAuthService = {
  isConfigured() {
    return isGoogleDriveConfigured;
  },
  isConnected() {
    return Boolean(
      accessToken &&
      tokenOwnerUid &&
      tokenOwnerUid === currentUid() &&
      Date.now() < expiresAt - 30_000,
    );
  },
  getAccessToken() {
    return this.isConnected() ? accessToken : '';
  },
  async wasPreviouslyConnected(uid: string) {
    return (await AsyncStorage.getItem(hintKey(uid))) === 'true';
  },
  async connect(options: { forceConsent?: boolean; preferExistingGrant?: boolean } = {}) {
    const user = getFirebaseAuth().currentUser;
    if (!user) throw new Error('Sign in before connecting Google Drive.');
    if (!isGoogleDriveConfigured) throw new Error('Google Drive client ID is missing.');
    if (this.isConnected()) return accessToken;
    await loadGoogleIdentityServices();

    const uid = user.uid;
    const remembered = await this.wasPreviouslyConnected(uid);
    const prompt =
      options.forceConsent ? 'consent' :
      remembered || options.preferExistingGrant ? '' : 'consent';

    return new Promise<string>((resolve, reject) => {
      let finished = false;
      const fail = (message: string) => {
        if (finished) return;
        finished = true;
        clearTimeout(timeout);
        reject(new Error(message));
      };
      const timeout = setTimeout(() => {
        fail('Google Drive authorization timed out. Please retry from the app.'),
      }, 60_000);
      try {
        const client = window.google!.accounts!.oauth2!.initTokenClient({
          client_id: googleDriveClientId,
          scope: SCOPE,
          callback: async response => {
            if (finished) return;
            if (response.error || !response.access_token) {
              fail(response.error_description || response.error || 'Google Drive authorization was not granted.');
              return;
            }
            try {
              // Never bind a second Google account to another Firebase user's files.
              const identityResponse = await fetch(
                'https://www.googleapis.com/oauth2/v3/userinfo',
                { headers: { Authorization: 'Bearer ' + response.access_token } },
              );
              if (!identityResponse.ok) throw new Error('Google account could not be verified.');
              const identity = (await identityResponse.json()) as { email?: string };
              const accountEmail = user.email?.toLowerCase();
              if (!identity.email || !accountEmail ||
                  identity.email.toLowerCase() !== accountEmail) {
                throw new Error(
                  'This Google Drive belongs to a different Google account. Choose the same email used for MetlholoAI sign-in.',
                );
              }
              if (currentUid() !== uid) {
                throw new Error('The signed-in MetlholoAI account changed. Please retry.');
              }
              accessToken = response.access_token;
              expiresAt = Date.now() + (response.expires_in ?? 3600) * 1000;
              tokenOwnerUid = uid;
              await AsyncStorage.setItem(hintKey(uid), 'true');
              finished = true;
              clearTimeout(timeout);
              resolve(accessToken);
            } catch (error) {
              fail(error instanceof Error ? error.message : 'Unable to verify Google Drive access.');
            }
          },
          error_callback: error => {
            fail('Google Drive account selection failed: ' + (error.type || 'unknown') + '.');
          },
        });
        client.requestAccessToken({ prompt });
      } catch (error) {
        fail(error instanceof Error ? error.message : 'Unable to open Google Drive authorization.');
      }
    });
  },
  clearSession() {
    accessToken = '';
    expiresAt = 0;
    tokenOwnerUid = '';
  },
  async disconnect() {
    const uid = currentUid();
    this.clearSession();
    if (uid) await AsyncStorage.removeItem(hintKey(uid));
  },
};
