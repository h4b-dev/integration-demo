import { createContext, useContext } from 'react';

export interface ApiRequest {
  label: string;
  method: 'POST' | 'GET' | 'DELETE';
  baseUrl: string;
  endpoint: string;
  headers: Record<string, string>;
  body: unknown;
  response?: unknown;
}

export interface DevPanelContextType {
  request: ApiRequest | null;
  setRequest: (req: ApiRequest | null) => void;
}

export const DevPanelContext = createContext<DevPanelContextType | null>(null);

export function useDevPanel() {
  const ctx = useContext(DevPanelContext);
  if (!ctx) throw new Error('useDevPanel must be used within DevPanelProvider');
  return ctx;
}
