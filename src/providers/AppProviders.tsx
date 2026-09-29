import { PropsWithChildren } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { DesignProvider } from '@/design/DesignProvider';
import { AuthProvider } from '@/auth/AuthProvider';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <DesignProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    </DesignProvider>
  );
}