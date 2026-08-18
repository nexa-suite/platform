export const PLATFORM_ROUTES = {
  landing: '/',
  signIn: '/sign-in',
  forbidden: '/forbidden',
  overview: '/ops/overview',
  catalog: '/ops/product-catalog',
  clientAccounts: '/ops/commercial/client-accounts',
  purchaseRequests: '/ops/commercial/purchase-requests',
  salesOrders: '/ops/commercial/sales-orders',
  fulfillmentReadiness: '/ops/fulfillment/readiness'
} as const;

export function safeReturnUrl(returnUrl: string | null | undefined): string {
  if (typeof returnUrl !== 'string') {
    return PLATFORM_ROUTES.landing;
  }

  const candidate = returnUrl.trim();
  if (!candidate.startsWith('/') || candidate.startsWith('//')) {
    return PLATFORM_ROUTES.landing;
  }

  let decoded: string;
  try {
    decoded = decodeURIComponent(candidate);
  } catch {
    return PLATFORM_ROUTES.landing;
  }

  if (decoded.startsWith('//') || decoded.includes('\\') || /[\u0000-\u001f\u007f]/.test(decoded)) {
    return PLATFORM_ROUTES.landing;
  }

  let normalizedPathname: string;
  try {
    const parsed = new URL(candidate, 'http://nexa.internal');
    if (parsed.origin !== 'http://nexa.internal' || !parsed.pathname.startsWith('/') || parsed.pathname.startsWith('//')) {
      return PLATFORM_ROUTES.landing;
    }
    normalizedPathname = parsed.pathname;
  } catch {
    return PLATFORM_ROUTES.landing;
  }

  if (/^\/(sign-in|forbidden)(?:\/|\?|$)/.test(decoded)
      || /^\/(sign-in|forbidden)(?:\/|$)/.test(normalizedPathname)) {
    return PLATFORM_ROUTES.landing;
  }

  return candidate;
}
