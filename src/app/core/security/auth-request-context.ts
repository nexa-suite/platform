import { HttpContextToken } from '@angular/common/http';

export const AUTH_REFRESH_RETRY = new HttpContextToken<boolean>(() => false);

export function isAuthenticationRequest(url: string): boolean {
  return /\/api\/v1\/authentication\/(sign-in|refresh|sign-out)$/.test(url);
}
