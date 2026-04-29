import { getConfig, getPaymentApiBaseUrl, isConfigured, subscribe } from './config';

interface TokenResponse {
  tokenType: string;
  accessToken: string;
  expiresIn: number;
}

// Module-level singleton — token persists for the lifetime of the app session
let storedToken: string | null = null;
let tokenExpiresAt: number | null = null;
let tokenIssuedFor: string | null = null; // environment + clientId fingerprint

// Whenever credentials/environment change, the cached token is no longer valid.
subscribe((cfg) => {
  const fingerprint = `${cfg.environment}::${cfg.clientId}`;
  if (fingerprint !== tokenIssuedFor) {
    storedToken = null;
    tokenExpiresAt = null;
    tokenIssuedFor = null;
  }
});

export function clearToken(): void {
  storedToken = null;
  tokenExpiresAt = null;
  tokenIssuedFor = null;
}

export async function authenticate(): Promise<string> {
  if (!isConfigured()) {
    throw new Error('API credentials not configured. Open Settings to add a clientId and clientSecret.');
  }

  const { clientId, clientSecret, environment } = getConfig();
  const baseUrl = getPaymentApiBaseUrl();

  const response = await fetch(`${baseUrl}/api/v3/Token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ clientId, clientSecret }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Auth failed [${response.status}]: ${errorText}`);
  }

  const data: TokenResponse = await response.json();

  console.log('[PaymentAuth] Full response:', data);
  console.log('[PaymentAuth] Token type:', data.tokenType);
  console.log('[PaymentAuth] Access token:', data.accessToken);
  console.log('[PaymentAuth] Expires in:', data.expiresIn, 'seconds');

  storedToken = data.accessToken;
  tokenExpiresAt = Date.now() + data.expiresIn * 1000;
  tokenIssuedFor = `${environment}::${clientId}`;

  console.log('[PaymentAuth] Token expires at:', new Date(tokenExpiresAt).toISOString());

  return storedToken;
}

export function getToken(): string | null {
  return storedToken;
}

export function isTokenValid(): boolean {
  if (!storedToken) return false;
  if (tokenExpiresAt === null) return true;
  return Date.now() < tokenExpiresAt;
}

// Returns a valid token, re-authenticating if needed
export async function getValidToken(): Promise<string> {
  if (isTokenValid()) return storedToken!;
  return authenticate();
}
