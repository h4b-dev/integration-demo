import { getValidToken } from './paymentAuth';
import { getPaymentApiBaseUrl } from './config';

// ── Types ──────────────────────────────────────────────────────────────────

export interface SubscriptionCustomer {
  name: string;
  email: string;
  phoneNumber: string;
}

export interface SubscriptionPayload {
  subscriptionLinkId: number;
  customer: SubscriptionCustomer;
  paymentMethod: { id: string };
  locationCode: string;
  authenticationId?: string | null;
}

export interface SubscriptionAuthentication {
  id: string;
  [key: string]: unknown;
}

export interface SubscriptionResponse {
  status: 'SUCCESS' | 'FAILED' | 'AUTHENTICATION_REQUIRED' | string;
  message: string;
  error: {
    code: string;
    message: string;
    title: string | null;
    detail: string | null;
  } | null;
  authentication: SubscriptionAuthentication | null;
  subscription: Record<string, unknown> | null;
  createdAt: string;
}

// ── API call ───────────────────────────────────────────────────────────────

export async function processSubscription(payload: SubscriptionPayload): Promise<SubscriptionResponse> {
  const token = await getValidToken();

  console.log('[Subscriptions] Sending subscription:', JSON.stringify(payload, null, 2));

  const response = await fetch(`${getPaymentApiBaseUrl()}/api/v2/Subscriptions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const body = await response.text();

  if (!response.ok) {
    console.error('[Subscriptions] HTTP error:', response.status, body);
    throw new Error(`Subscription request failed [${response.status}]: ${body}`);
  }

  const data: SubscriptionResponse = JSON.parse(body);
  console.log('[Subscriptions] Response:', JSON.stringify(data, null, 2));
  return data;
}
