import type { CSSProperties, FormEvent } from 'react';
import { useTheme } from '@/design/themes';
import { Radii } from '@/design/radii';
import { Spacing } from '@/design/spacing';
import type { CredentialFormProps } from './CredentialForm.types';

/**
 * Semantic HTML login forms are necessary for Safari and password managers to
 * recognize credentials. The browser controls its own Save Password prompt.
 * Never store passwords ourselves in app storage or Google Drive.
 */
export function CredentialForm({ mode, submitting, disabled = false, onSubmit }: CredentialFormProps) {
  const { colors } = useTheme();
  const create = mode === 'sign-up';

  const inputStyle: CSSProperties = {
    display: 'block', boxSizing: 'border-box', width: '100%', minHeight: 50,
    padding: Spacing.md, fontSize: 17, borderRadius: Radii.md,
    border: '1px solid ' + colors.border, background: colors.surface,
    color: colors.textPrimary, fontFamily: 'inherit',
  };
  const labelStyle: CSSProperties = {
    display: 'block', color: colors.textSecondary,
    fontSize: 16, fontWeight: 500, marginBottom: Spacing.sm,
  };
  const groupStyle: CSSProperties = { display: 'block', marginBottom: Spacing.lg };
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting || disabled) return;
    // Password managers can fill native inputs without firing React onChange.
    // The DOM is authoritative at submission, not any cached component state.
    const fields = new FormData(event.currentTarget);
    const email = String(fields.get('username') ?? '').trim();
    const password = String(fields.get('password') ?? '');
    const displayName = create ? String(fields.get('name') ?? '').trim() : undefined;
    void onSubmit({ email, password, displayName });
  };

  return (
    <form
      aria-label={create ? 'Create MetlholoAI account' : 'Sign in to MetlholoAI'}
      autoComplete="on"
      onSubmit={handleSubmit}
      style={{ display: 'block', width: '100%' }}
    >
      {create ? (
        <div style={groupStyle}>
          <label htmlFor="metlholo-account-name" style={labelStyle}>Name</label>
          <input
            id="metlholo-account-name" name="name" type="text"
            autoComplete="name" required minLength={2}
            style={inputStyle} disabled={submitting}
          />
        </div>
      ) : null}
      <div style={groupStyle}>
        <label htmlFor="metlholo-account-username" style={labelStyle}>Email</label>
        <input
          id="metlholo-account-username" name="username" type="email"
          autoComplete="username" autoCapitalize="none" autoCorrect="off"
          inputMode="email" required style={inputStyle} disabled={submitting}
        />
      </div>
      <div style={groupStyle}>
        <label htmlFor="metlholo-account-password" style={labelStyle}>Password</label>
        <input
          id="metlholo-account-password" name="password" type="password"
          autoComplete={create ? 'new-password' : 'current-password'}
          required minLength={6} style={inputStyle} disabled={submitting}
        />
      </div>
      <button
        type="submit"
        disabled={submitting || disabled}
        style={{
          width: '100%', minHeight: 55, padding: Spacing.md,
          border: 'none', borderRadius: Radii.md, background: colors.primary,
          color: colors.background, fontSize: 17, fontWeight: 700,
          fontFamily: 'inherit', cursor: submitting || disabled ? 'wait' : 'pointer',
          opacity: submitting || disabled ? 0.6 : 1,
        }}
      >
        {submitting ? 'Please wait…' : create ? 'Create Account' : 'Sign In'}
      </button>
    </form>
  );
}
