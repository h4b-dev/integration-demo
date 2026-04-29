import type { CartItem } from '../types';
import { getConfig, getPaymentLinkProxyPath } from './config';

export interface PaymentLinkResponse {
  orderCode: string;
  orderId: number;
  paymentLinkUrl: string;
}

export async function createPaymentLink(
  items: CartItem[],
  orderName = 'NexShop Order',
  orderDescription = 'Online store purchase'
): Promise<PaymentLinkResponse> {
  const { paymentLinkToken } = getConfig();
  if (!paymentLinkToken.trim()) {
    throw new Error('Payment Link API token not configured. Open Settings to add one.');
  }

  const successUrl = `${window.location.origin}${window.location.pathname}?checkout=success`;
  const cancelUrl = `${window.location.origin}${window.location.pathname}?checkout=cancelled`;

  const payload = {
    orderName,
    orderDescription,
    lineItems: items.map((item) => ({
      product: {
        sku: item.id,
        name: item.name,
        price: item.price,
      },
      quantity: item.quantity,
    })),
    successUrl,
    cancelUrl,
    metadata: [
      {
        name: 'clientId',
        value: 'nexshop-web',
      },
    ],
  };

  const response = await fetch(`${getPaymentLinkProxyPath()}/checkout`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${paymentLinkToken}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Payment link creation failed (${response.status}): ${errorText}`);
  }

  return response.json() as Promise<PaymentLinkResponse>;
}
