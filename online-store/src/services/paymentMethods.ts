import { getValidToken } from './paymentAuth';
import { getPaymentApiBaseUrl } from './config';

// ── Types ──────────────────────────────────────────────────────────────────

export interface CardInput {
  number: string;
  cardHolder: string;
  expirationMonth: string;
  expirationYear: string;
  cvv: string;
  singleUse: boolean;
}

export interface CustomerData {
  id: string;
  email: string;
  name: string;
  phoneNumber: string;
}

export interface TokenizeResponse {
  id: string;
  type: string;
  success: boolean;
  message: string;
  bin: {
    brand: string;       // "Visa", "Mastercard", etc.
    issuerName: string;
    countryCode: string;
  };
}

// Stored card — only non-sensitive data kept after tokenization
export interface SavedCard {
  id: string;          // card token ID returned by API — used in payment
  last4: string;
  cardHolder: string;
  expirationMonth: string;
  expirationYear: string;
  brand: string;
}

// ── Card brand detection ───────────────────────────────────────────────────

export function detectBrand(number: string): string {
  const n = number.replace(/\s/g, '');
  if (/^4/.test(n)) return 'Visa';
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return 'Mastercard';
  if (/^3[47]/.test(n)) return 'Amex';
  if (/^6(?:011|5)/.test(n)) return 'Discover';
  return 'Card';
}

// ── API calls ──────────────────────────────────────────────────────────────

export async function tokenizeCard(
  card: CardInput,
  customer: CustomerData
): Promise<TokenizeResponse> {
  const token = await getValidToken();

  console.log('[PaymentMethods] Tokenizing card for customer:', customer.id);

  const response = await fetch(`${getPaymentApiBaseUrl()}/api/v2/PaymentMethods`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ customer, card }),
  });

  const body = await response.text();

  if (!response.ok) {
    console.error('[PaymentMethods] Tokenize failed:', response.status, body);
    throw new Error(`Tokenize failed [${response.status}]: ${body}`);
  }

  const data: TokenizeResponse = JSON.parse(body);
  console.log('[PaymentMethods] Tokenize response:', data);
  return data;
}

export async function deletePaymentMethod(cardId: string): Promise<void> {
  const token = await getValidToken();

  console.log('[PaymentMethods] Deleting card:', cardId);

  const response = await fetch(`${getPaymentApiBaseUrl()}/api/v2/PaymentMethods/${cardId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    console.error('[PaymentMethods] Delete failed:', response.status, body);
    throw new Error(`Delete failed [${response.status}]: ${body}`);
  }

  console.log('[PaymentMethods] Card deleted:', cardId);
}
