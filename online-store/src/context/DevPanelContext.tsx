import { useState, type ReactNode } from 'react';
import { DevPanelContext, type ApiRequest } from './useDevPanel';

export function DevPanelProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<ApiRequest | null>(null);
  return (
    <DevPanelContext.Provider value={{ request, setRequest }}>
      {children}
    </DevPanelContext.Provider>
  );
}
