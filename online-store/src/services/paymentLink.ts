import type { CartItem } from '../types';

const ENDPOINT = '/api/paymentlink/checkout';
const TOKEN =
  import.meta.env.VITE_PAYMENT_LINK_TOKEN ||
  'sk_5b62f376887a64dfecd8fcd642f067bf5a305595402a39d5d9946170311c8fd5';

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

  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
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
