import { createContext, useContext, useState, type ReactNode } from 'react';

export interface ApiRequest {
  label: string;
  method: 'POST' | 'GET' | 'DELETE';
  baseUrl: string;
  endpoint: string;
  headers: Record<string, string>;
  body: unknown;
  response?: unknown;
}

interface DevPanelContextType {
  request: ApiRequest | null;
  setRequest: (req: ApiRequest | null) => void;
}

const DevPanelContext = createContext<DevPanelContextType | null>(null);

export function DevPanelProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<ApiRequest | null>(null);
  return (
    <DevPanelContext.Provider value={{ request, setRequest }}>
      {children}
    </DevPanelContext.Provider>
  );
}

export function useDevPanel() {
  const ctx = useContext(DevPanelContext);
  if (!ctx) throw new Error('useDevPanel must be used within DevPanelProvider');
  return ctx;
}
