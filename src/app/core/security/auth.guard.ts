import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthenticationService } from '../../iam/application/authentication.service';
import { PLATFORM_ROUTES, safeReturnUrl } from '../routing/route-paths';

export const authGuard: CanActivateFn = (_route, routerState) => {
  const authentication = inject(AuthenticationService);
  const router = inject(Router);

  if (authentication.status() === 'authenticated') return true;

  return router.createUrlTree([PLATFORM_ROUTES.signIn], {
    queryParams: { returnUrl: safeReturnUrl(routerState.url) }
  });
};

export const anonymousGuard: CanActivateFn = (_route, routerState) => {
  const authentication = inject(AuthenticationService);
  const router = inject(Router);

  if (authentication.status() !== 'authenticated') return true;

  const returnUrl = routerState.root.queryParams['returnUrl'];
  return router.parseUrl(safeReturnUrl(typeof returnUrl === 'string' ? returnUrl : PLATFORM_ROUTES.landing));
};
