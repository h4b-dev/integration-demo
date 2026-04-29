import { ENVIRONMENTS } from '../config/environments';
import type { Environment, EnvironmentUrls } from '../config/environments';

export interface RuntimeConfig {
  environment: Environment;
  clientId: string;
  clientSecret: string;
  paymentLinkToken: string;
}

let current: RuntimeConfig = {
  environment: 'sandbox',
  clientId: '',
  clientSecret: '',
  paymentLinkToken: '',
};

type Listener = (cfg: RuntimeConfig) => void;
const listeners = new Set<Listener>();

export function setConfig(next: Partial<RuntimeConfig>): void {
  current = { ...current, ...next };
  listeners.forEach((l) => l(current));
}

export function getConfig(): RuntimeConfig {
  return current;
}

export function getEnvironmentUrls(): EnvironmentUrls {
  return ENVIRONMENTS[current.environment];
}

export function getPaymentApiBaseUrl(): string {
  return ENVIRONMENTS[current.environment].paymentApi;
}

export function getPaymentLinkProxyPath(): string {
  return ENVIRONMENTS[current.environment].paymentLinkProxyPath;
}

export function isConfigured(): boolean {
  return current.clientId.trim().length > 0 && current.clientSecret.trim().length > 0;
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
