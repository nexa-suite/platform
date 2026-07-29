export const PLATFORM_ROUTES = {
  signIn: '/sign-in',
  forbidden: '/forbidden',
  overview: '/ops/overview',
  catalog: '/ops/product-catalog'
} as const;

export function safeReturnUrl(returnUrl: string | null | undefined): string {
  if (!returnUrl || !returnUrl.startsWith('/') || returnUrl.startsWith('//')) {
    return PLATFORM_ROUTES.overview;
  }

  if (/^\/(sign-in|forbidden)(?:\/|\?|$)/.test(returnUrl)) {
    return PLATFORM_ROUTES.overview;
  }

  return returnUrl;
}
