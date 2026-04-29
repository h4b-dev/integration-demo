interface Env {
  ASSETS: Fetcher;
}

const PROXY_ROUTES: Record<string, string> = {
  '/api/paymentlink-sandbox': 'https://api-pay-sandbox.n1co.shop/api/paymentlink',
  '/api/paymentlink-live': 'https://api-pay.n1co.shop/api/paymentlink',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    for (const [prefix, target] of Object.entries(PROXY_ROUTES)) {
      if (url.pathname === prefix || url.pathname.startsWith(`${prefix}/`)) {
        const upstream = new URL(target + url.pathname.slice(prefix.length) + url.search);
        const proxied = new Request(upstream.toString(), request);
        proxied.headers.set('Host', upstream.host);
        return fetch(proxied);
      }
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
