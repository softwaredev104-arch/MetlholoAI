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

type DriveGrant = {
  ownerId: string;
  accountEmail?: string;
  grantedAt: string;
  lastConnectedAt: string;
};

type ConnectOptions = {
  ownerId?: string;
  expectedEmail?: string | null;
  prompt?: 'consent' | 'select_account' | '';
};

const DRIVE_SCOPE =
  'openid email profile https://www.googleapis.com/auth/drive.file';
const grantKey = (ownerId: string) => `metlholoai.driveGrant.${ownerId}`;

let accessToken = '';
let expiresAt = 0;
let connectedEmail = '';
let connectedOwnerUid = '';
let loader: Promise<void> | null = null;

function loadGoogleIdentityServices() {
  if (Platform.OS !== 'web' || typeof document === 'undefined') {
    return Promise.reject(
      new Error('Google Drive connection is currently available in the web preview.'),
    );
  }
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (loader) return loader;

  loader = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-metlholo-google-identity]',
    );
    if (existing) {
      if (window.google?.accounts?.oauth2) {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener(
        'error',
        () => reject(new Error('Google Identity Services failed to load.')),
        { once: true },
      );
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.dataset.metlholoGoogleIdentity = 'true';
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error('Google Identity Services failed to load.'));
    document.head.appendChild(script);
  });

  return loader;
}

async function getGoogleIdentity(token: string) {
  try {
    const response = await fetch(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    if (!response.ok) return null;
    return (await response.json()) as { email?: string };
  } catch {
    return null;
  }
}

async function rememberGrant(
  ownerId: string | undefined,
  email: string | undefined,
) {
  if (!ownerId) return;
  const now = new Date().toISOString();
  const previousRaw = await AsyncStorage.getItem(grantKey(ownerId));
  let previous: DriveGrant | null = null;
  if (previousRaw) {
    try {
      previous = JSON.parse(previousRaw) as DriveGrant;
    } catch {
      previous = null;
    }
  }

  const grant: DriveGrant = {
    ownerId,
    accountEmail: email ?? previous?.accountEmail,
    grantedAt: previous?.grantedAt ?? now,
    lastConnectedAt: now,
  };
  await AsyncStorage.setItem(grantKey(ownerId), JSON.stringify(grant));
}

async function readGrant(ownerId: string) {
  const raw = await AsyncStorage.getItem(grantKey(ownerId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DriveGrant;
  } catch {
    return null;
  }
}

function clearToken() {
  accessToken = '';
  expiresAt = 0;
  connectedEmail = '';
  connectedOwnerUid = '';
}

async function acceptToken(
  token: string,
  expiresIn: number,
  options: ConnectOptions = {},
) {
  const identity = await getGoogleIdentity(token);
  const actualEmail = identity?.email?.trim().toLowerCase() ?? '';
  const expectedEmail = options.expectedEmail?.trim().toLowerCase() ?? '';
  const firebaseUid = getFirebaseAuth().currentUser?.uid;
  if (options.ownerId && firebaseUid !== options.ownerId) {
    clearToken();
    throw new Error('The Firebase account has changed. Reconnect the matching account.');
  }

  if (expectedEmail && expectedEmail !== actualEmail) {
    clearToken();
    throw new Error(
      `Google Drive is connected to ${identity?.email}, but this MetlholoAI account uses ${options.expectedEmail}. Choose the matching Google account.`,
    );
  }

  accessToken = token;
  expiresAt = Date.now() + expiresIn * 1000;
  connectedEmail = identity?.email ?? '';
  connectedOwnerUid = options.ownerId ?? '';
  await rememberGrant(options.ownerId, identity?.email);
  return token;
}

async function requestToken(options: ConnectOptions = {}) {
  if (!isGoogleDriveConfigured) {
    throw new Error('Google Drive client ID is missing.');
  }

  await loadGoogleIdentityServices();

  return new Promise<string>((resolve, reject) => {
    let settled = false;

    const fail = (message: string) => {
      if (settled) return;
      settled = true;
      reject(new Error(message));
    };

    const client = window.google!.accounts!.oauth2!.initTokenClient({
      client_id: googleDriveClientId,
      scope: DRIVE_SCOPE,
      callback: async response => {
        if (settled) return;

        if (response.error || !response.access_token) {
          fail(
            response.error_description ??
              response.error ??
              'Google Drive access was not granted.',
          );
          return;
        }

        settled = true;
        try {
          resolve(
            await acceptToken(
              response.access_token,
              response.expires_in ?? 3600,
              options,
            ),
          );
        } catch (error) {
          reject(error);
        }
      },
      error_callback: error => {
        fail(`Google Drive authorization failed: ${error.type ?? 'unknown_error'}.`);
      },
    });

    client.requestAccessToken({ prompt: options.prompt ?? 'consent' });
  });
}

export const driveAuthService = {
  isConfigured() {
    return isGoogleDriveConfigured;
  },

  isConnected() {
    return Boolean(accessToken &&
      connectedOwnerUid &&
      connectedOwnerUid === getFirebaseAuth().currentUser?.uid &&
      Date.now() < expiresAt - 30_000);
  },

  getAccessToken() {
    return this.isConnected() ? accessToken : '';
  },

  getConnectedEmail() {
    return this.isConnected() ? connectedEmail : '';
  },

  async hasRememberedGrant(ownerId: string) {
    return Boolean(await readGrant(ownerId));
  },

  async connect(options: ConnectOptions = {}) {
    return requestToken({ ...options, prompt: options.prompt ?? 'consent' });
  },

  async restore(options: Omit<ConnectOptions, 'prompt'> & { force?: boolean }) {
    if (Platform.OS !== 'web' || !isGoogleDriveConfigured) return false;
    if (this.isConnected()) return true;
    if (accessToken && Date.now() < expiresAt - 30_000 && options.ownerId) {
      try {
        await acceptToken(accessToken, Math.max(60, (expiresAt - Date.now()) / 1000), {
          ownerId: options.ownerId,
          expectedEmail: options.expectedEmail,
        });
        return true;
      } catch {
        clearToken();
      }
    }

    const remembered = options.ownerId
      ? await readGrant(options.ownerId)
      : null;

    if (!remembered && !options.force) return false;

    try {
      await requestToken({
        ownerId: options.ownerId,
        expectedEmail: options.expectedEmail ?? remembered?.accountEmail,
        prompt: '',
      });
      return true;
    } catch {
      clearToken();
      return false;
    }
  },

  async adoptAccessToken(
    token: string,
    expiresIn: number,
    options: Omit<ConnectOptions, 'prompt'> = {},
  ) {
    return acceptToken(token, expiresIn, options);
  },

  async ensureConnected(_ownerId: string) {
    // Farm repositories may save locally while a token is expired. Do not
    // silently renew here and overwrite an older cloud snapshot before the
    // returning-user reconciliation has run. Reauthorization and restore
    // happen in AuthProvider or from the explicit Profile/Recovery action.
    return this.isConnected();
  },

  async disconnect(ownerId?: string) {
    clearToken();
    if (ownerId) {
      await AsyncStorage.removeItem(grantKey(ownerId));
    }
  },
};
