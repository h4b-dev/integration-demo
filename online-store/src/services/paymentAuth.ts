const BASE_URL = import.meta.env.VITE_PAYMENT_BASE_URL as string;
const CLIENT_ID = import.meta.env.VITE_PAYMENT_CLIENT_ID as string;
const CLIENT_SECRET = import.meta.env.VITE_PAYMENT_CLIENT_SECRET as string;

interface TokenResponse {
  tokenType: string;
  accessToken: string;
  expiresIn: number;
}

// Module-level singleton — token persists for the lifetime of the app session
let storedToken: string | null = null;
let tokenExpiresAt: number | null = null;

export async function authenticate(): Promise<string> {
  const response = await fetch(`${BASE_URL}/api/v3/Token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
    }),
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
