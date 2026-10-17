import { useState } from 'react';
import { View } from 'react-native';
import { AppTextField } from '@/components/ui/AppTextField';
import { AppButton } from '@/components/ui/AppButton';
import { Spacing } from '@/design/spacing';
import type { CredentialFormProps } from './CredentialForm.types';

export function CredentialForm({ mode, submitting, disabled, onSubmit }: CredentialFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const create = mode === 'sign-up';
  const submit = () => {
    if (!submitting && !disabled) {
      void onSubmit({ email, password, displayName: create ? displayName : undefined });
    }
  };
  return (
    <View style={{ gap: Spacing.lg }}>
      {create ? (
        <AppTextField
          label="Name" value={displayName} onChangeText={setDisplayName}
          autoComplete="name" textContentType="name"
        />
      ) : null}
      <AppTextField
        label="Email" value={email} onChangeText={setEmail}
        autoCapitalize="none" keyboardType="email-address"
        autoComplete="username" textContentType="username"
      />
      <AppTextField
        label="Password" value={password} onChangeText={setPassword}
        secureTextEntry autoComplete={create ? 'new-password' : 'current-password'}
        textContentType={create ? 'newPassword' : 'password'}
        onSubmitEditing={submit}
      />
      <AppButton
        title={create ? 'Create Account' : 'Sign In'}
        loading={submitting} disabled={disabled} onPress={submit}
      />
    </View>
  );
}
