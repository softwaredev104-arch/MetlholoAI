import { z } from 'zod';

const Schema = z.object({
  EXPO_PUBLIC_AUTH_BASE_URL: z.string().url(),
  EXPO_PUBLIC_APP_URL: z.string().url().optional(),
});

const parsed = Schema.safeParse({
  EXPO_PUBLIC_AUTH_BASE_URL: process.env.EXPO_PUBLIC_AUTH_BASE_URL,
  EXPO_PUBLIC_APP_URL: process.env.EXPO_PUBLIC_APP_URL,
});

export const isAuthConfigured = parsed.success;

export function getAuthConfig() {
  if (!parsed.success) {
    throw new Error(
      'Google OAuth is not configured. Set EXPO_PUBLIC_AUTH_BASE_URL before starting MetlholoAI.',
    );
  }

  return {
    authBaseUrl: parsed.data.EXPO_PUBLIC_AUTH_BASE_URL.replace(/\/$/, ''),
    appUrl: parsed.data.EXPO_PUBLIC_APP_URL,
  };
}
