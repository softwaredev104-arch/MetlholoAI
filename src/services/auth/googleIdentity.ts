/** Shared Google SDK preload. Popup requests must occur inside a user tap on iOS. */
export type GoogleTokenResponse = {
  access_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
};
declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient(config: {
            client_id: string;
            scope: string;
            callback: (response: GoogleTokenResponse) => void;
            error_callback?: (error: { type?: string }) => void;
          }): { requestAccessToken(options?: { prompt?: string }): void };
        };
      };
    };
  }
}
let loading: Promise<void> | null = null;
export function isGoogleIdentityReady() {
  return typeof window !== 'undefined' && Boolean(window.google?.accounts?.oauth2);
}
export function prepareGoogleIdentity(): Promise<void> {
  if (typeof document === 'undefined') {
    return Promise.reject(new Error('Google sign-in requires a web browser.'));
  }
  if (isGoogleIdentityReady()) return Promise.resolve();
  if (loading) return loading;
  loading = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-metlholo-google-identity]',
    );
    const script = existing ?? document.createElement('script');
    script.addEventListener('load', () => {
      if (isGoogleIdentityReady()) resolve();
      else reject(new Error('Google Identity Services did not initialize.'));
    }, { once: true });
    script.addEventListener('error', () =>
      reject(new Error('Google Identity Services failed to load.')), { once: true });
    if (!existing) {
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.dataset.metlholoGoogleIdentity = 'true';
      document.head.appendChild(script);
    }
  }).catch(error => {
    loading = null;
    throw error;
  });
  return loading;
}
