import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { googleDriveClientId, isGoogleDriveConfigured } from '@/config/env';
import { getFirebaseAuth } from '@/services/firebase/client';
import { isGoogleIdentityReady, prepareGoogleIdentity } from '@/services/auth/googleIdentity';

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

function requestToken(options: ConnectOptions = {}): Promise<string> {
  if (!isGoogleDriveConfigured) {
    throw new Error('Google Drive client ID is missing.');
  }

  // Never await loading the SDK before initiating a popup on iOS Safari.
  // The script must be preloaded, and this call must originate from a tap.
  if (!isGoogleIdentityReady()) {
    return Promise.reject(new Error(
      'Google authorization is still loading. Wait a moment and try again.',
    ));
  }

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
  prepare() {
    return Platform.OS === 'web' ? prepareGoogleIdentity() : Promise.resolve();
  },
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

    // A Google access token is intentionally never persisted to browser storage.
    // On a fresh page, a remembered grant is *not* an active token. Silent
    // tokenClient prompts outside user gestures are blocked by Safari and must
    // not hold up Firebase authentication or disrupt the returning workspace.
    return false;
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
