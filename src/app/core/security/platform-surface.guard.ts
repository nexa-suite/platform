import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { PLATFORM_RUNTIME_CONFIG, PLATFORM_SURFACE } from './runtime-config';
import { PLATFORM_ROUTES } from '../routing/route-paths';

export const platformSurfaceGuard: CanActivateFn = (_route, routerState) => {
  const config = inject(PLATFORM_RUNTIME_CONFIG);
  const router = inject(Router);

  if (config.surface === PLATFORM_SURFACE) return true;

  return router.createUrlTree([PLATFORM_ROUTES.forbidden], {
    queryParams: { returnUrl: routerState.url, reason: 'SURFACE_NOT_ALLOWED' }
  });
};
