import { Linking, Platform } from 'react-native';
import { getAuthConfig } from '@/config/env';

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
};

type SessionResponse = {
  authenticated: boolean;
  user?: AuthUser;
};

function getReturnTo() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.location.origin + '/';
  }
  return 'metlholoai://auth/callback';
}

export const authService = {
  async getSession(): Promise<AuthUser | null> {
    const { authBaseUrl } = getAuthConfig();
    const response = await fetch(`${authBaseUrl}/auth/session`, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });

    if (response.status === 401) return null;
    if (!response.ok) throw new Error('Unable to check your MetlholoAI session.');

    const body = (await response.json()) as SessionResponse;
    return body.authenticated && body.user ? body.user : null;
  },

  async signInWithGoogle() {
    const { authBaseUrl } = getAuthConfig();
    const url = `${authBaseUrl}/auth/google/start?return_to=${encodeURIComponent(getReturnTo())}`;

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.location.assign(url);
      return;
    }

    await Linking.openURL(url);
  },

  async logout() {
    const { authBaseUrl } = getAuthConfig();
    await fetch(`${authBaseUrl}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
  },
};
