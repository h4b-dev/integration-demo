export type Environment = 'sandbox' | 'live';

export interface EnvironmentUrls {
  paymentApi: string;       // base host for the epay API (Token, Charges, PaymentMethods, Plans, Subscriptions)
  paymentLinkApi: string;   // base host for the checkoutLink API (PaymentLink)
  // Vite dev proxy path used to call the paymentLink API without CORS issues.
  paymentLinkProxyPath: string;
}

export const ENVIRONMENTS: Record<Environment, EnvironmentUrls> = {
  sandbox: {
    paymentApi: 'https://api-sandbox.n1co.shop',
    paymentLinkApi: 'https://api-pay-sandbox.n1co.shop',
    paymentLinkProxyPath: '/api/paymentlink-sandbox',
  },
  live: {
    paymentApi: 'https://api.n1co.com',
    paymentLinkApi: 'https://api-pay.n1co.shop',
    paymentLinkProxyPath: '/api/paymentlink-live',
  },
};

export const ENVIRONMENT_LABELS: Record<Environment, string> = {
  sandbox: 'Sandbox',
  live: 'Live',
};
