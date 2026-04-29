import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { Environment } from '../config/environments';
import { setConfig } from '../services/config';

const STORAGE_KEY = 'nexshop_api_credentials';

export interface Credentials {
  environment: Environment;
  clientId: string;
  clientSecret: string;
  paymentLinkToken: string;
}

const DEFAULT_CREDS: Credentials = {
  environment: 'sandbox',
  clientId: '',
  clientSecret: '',
  paymentLinkToken: '',
};

function load(): Credentials {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CREDS;
    const parsed = JSON.parse(raw) as Partial<Credentials>;
    return {
      environment: parsed.environment === 'live' ? 'live' : 'sandbox',
      clientId: parsed.clientId ?? '',
      clientSecret: parsed.clientSecret ?? '',
      paymentLinkToken: parsed.paymentLinkToken ?? '',
    };
  } catch {
    return DEFAULT_CREDS;
  }
}

interface CredentialsContextValue {
  credentials: Credentials;
  isConfigured: boolean;
  updateCredentials: (next: Partial<Credentials>) => void;
}

const CredentialsContext = createContext<CredentialsContextValue | null>(null);

export function CredentialsProvider({ children }: { children: ReactNode }) {
  const [credentials, setCredentials] = useState<Credentials>(load);

  // Push initial state into the module-level config so services can read it synchronously.
  useEffect(() => {
    setConfig(credentials);
  }, [credentials]);

  // Persist to localStorage on every change.
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(credentials));
  }, [credentials]);

  const updateCredentials = (next: Partial<Credentials>) => {
    setCredentials((prev) => ({ ...prev, ...next }));
  };

  const isConfigured =
    credentials.clientId.trim().length > 0 && credentials.clientSecret.trim().length > 0;

  return (
    <CredentialsContext.Provider value={{ credentials, isConfigured, updateCredentials }}>
      {children}
    </CredentialsContext.Provider>
  );
}

export function useCredentials() {
  const ctx = useContext(CredentialsContext);
  if (!ctx) throw new Error('useCredentials must be used within CredentialsProvider');
  return ctx;
}
