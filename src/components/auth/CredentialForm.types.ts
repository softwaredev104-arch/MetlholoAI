export type CredentialFields = {
  email: string;
  password: string;
  displayName?: string;
};
export type CredentialFormProps = {
  mode: 'sign-in' | 'sign-up';
  submitting: boolean;
  disabled?: boolean;
  onSubmit: (credentials: CredentialFields) => void | Promise<void>;
};
