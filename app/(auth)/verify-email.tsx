import { Redirect } from 'expo-router';

export default function LegacyVerifyEmail() {
  return <Redirect href="/(auth)/sign-in" />;
}
