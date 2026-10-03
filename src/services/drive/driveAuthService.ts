import { Platform } from 'react-native';
import { googleDriveClientId, isGoogleDriveConfigured } from '@/config/env';

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

let accessToken = '';
let expiresAt = 0;
let loader: Promise<void> | null = null;

function loadGoogleIdentityServices() {
  if (Platform.OS !== 'web' || typeof document === 'undefined') {
    return Promise.reject(new Error('Google Drive connection is currently available in the web preview.'));
  }
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (loader) return loader;
  loader = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-metlholo-google-identity]');
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Google Identity Services failed to load.')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.dataset.metlholoGoogleIdentity = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Google Identity Services failed to load.'));
    document.head.appendChild(script);
  });
  return loader;
}

export const driveAuthService = {
  isConfigured() {
    return isGoogleDriveConfigured;
  },
  isConnected() {
    return Boolean(accessToken && Date.now() < expiresAt - 30_000);
  },
  getAccessToken() {
    return this.isConnected() ? accessToken : '';
  },
  async connect() {
    if (!isGoogleDriveConfigured) throw new Error('Google Drive client ID is missing.');
    await loadGoogleIdentityServices();
    return new Promise<string>((resolve, reject) => {
      const client = window.google!.accounts!.oauth2!.initTokenClient({
        client_id: googleDriveClientId,
        scope: 'https://www.googleapis.com/auth/drive.file',
        callback: response => {
          if (response.error || !response.access_token) {
            reject(new Error(response.error || 'Google Drive access was not granted.'));
            return;
          }
          accessToken = response.access_token;
          expiresAt = Date.now() + (response.expires_in ?? 3600) * 1000;
          resolve(accessToken);
        },
      });
      client.requestAccessToken({ prompt: 'consent' });
    });
  },
  disconnect() {
    accessToken = '';
    expiresAt = 0;
  },
};
