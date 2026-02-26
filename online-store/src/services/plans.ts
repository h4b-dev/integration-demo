import { getValidToken } from './paymentAuth';

const BASE_URL = import.meta.env.VITE_PAYMENT_BASE_URL as string;

export interface PlanPayload {
  name: string;
  description: string;
  amount: number;
  successUrl: string;
  cancelUrl: string;
  billingCycleType: string;
  billingCyclesNumber: number;
  trialCycleType: string;
  trialCyclesNumber: number;
  cyclesToBillBeforeAllowCancelation: number | null;
  subscriberLimit: number | null;
  enrollmentEndDate: string | null;
  subscriptionEndDate: string | null;
  billingDay: number | null;
  locationId: number;
}

export async function createPlan(payload: PlanPayload): Promise<number> {
  const token = await getValidToken();

  console.log('[Plans] Creating plan:', JSON.stringify(payload, null, 2));

  const response = await fetch(`${BASE_URL}/api/v2/Plans`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const body = await response.text();

  if (!response.ok) {
    console.error('[Plans] HTTP error:', response.status, body);
    throw new Error(`Plan creation failed [${response.status}]: ${body}`);
  }

  const planId = parseInt(body, 10);
  console.log('[Plans] Created plan ID:', planId);
  return planId;
}
