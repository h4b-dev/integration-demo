import { createContext, useContext } from 'react';
import type { Environment } from '../config/environments';

export interface Credentials {
  environment: Environment;
  clientId: string;
  clientSecret: string;
  paymentLinkToken: string;
}

export interface CredentialsContextValue {
  credentials: Credentials;
  isConfigured: boolean;
  updateCredentials: (next: Partial<Credentials>) => void;
}

export const CredentialsContext = createContext<CredentialsContextValue | null>(null);

export function useCredentials() {
  const ctx = useContext(CredentialsContext);
  if (!ctx) throw new Error('useCredentials must be used within CredentialsProvider');
  return ctx;
}
