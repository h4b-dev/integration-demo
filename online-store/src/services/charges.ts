import { getValidToken } from './paymentAuth';
import { getPaymentApiBaseUrl } from './config';

// ── Types ──────────────────────────────────────────────────────────────────

export interface BillingInfo {
  CountryCode: string;
  StateCode: string;
  ZipCode: string;
}

export interface ChargeOrder {
  amount: number;
  description: string;
  id: string;
  name: string;
}

export interface ChargePayload {
  customerId: string;
  cardId: string;
  authenticationId: string | null;
  BillingInfo: BillingInfo;
  order: ChargeOrder;
}

export interface ChargeAuthentication {
  id: string;
  [key: string]: unknown; // redirectUrl or similar — logged at runtime
}

export interface ChargeResponse {
  status: 'SUCCESS' | 'FAILED' | string;
  message: string;
  error: {
    code: string;
    message: string;
    title: string | null;
    detail: string | null;
  } | null;
  authentication: ChargeAuthentication | null;
  order: Record<string, unknown> | null;
  createdAt: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

export function generateOrderId(): string {
  return `order-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ── API call ───────────────────────────────────────────────────────────────

export async function processCharge(payload: ChargePayload): Promise<ChargeResponse> {
  const token = await getValidToken();

  console.log('[Charges] Sending charge:', JSON.stringify(payload, null, 2));

  const response = await fetch(`${getPaymentApiBaseUrl()}/api/v3/Charges`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const body = await response.text();

  if (!response.ok) {
    console.error('[Charges] HTTP error:', response.status, body);
    throw new Error(`Charge request failed [${response.status}]: ${body}`);
  }

  const data: ChargeResponse = JSON.parse(body);
  console.log('[Charges] Response:', JSON.stringify(data, null, 2));
  return data;
}
