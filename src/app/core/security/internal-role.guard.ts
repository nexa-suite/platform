import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { PlatformAuthenticationBoundary } from './platform-authentication.boundary';
import { InternalRole } from './platform-authentication.boundary';
import { PLATFORM_ROUTES, safeReturnUrl } from '../routing/route-paths';

export function internalRoleGuard(requiredRoles: readonly InternalRole[]): CanActivateFn {
  return (_route, routerState) => {
    const authentication = inject(PlatformAuthenticationBoundary);
    const router = inject(Router);
    const user = authentication.currentUser();

    if (authentication.status() !== 'authenticated' || !user) {
      return router.createUrlTree(['/sign-in'], { queryParams: { returnUrl: safeReturnUrl(routerState.url) } });
    }

    if (user.roles.some((role) => requiredRoles.includes(role))) return true;

    authentication.markForbidden();
    return router.createUrlTree([PLATFORM_ROUTES.forbidden], {
      queryParams: { returnUrl: safeReturnUrl(routerState.url), reason: 'ROLE_NOT_ASSIGNED' }
    });
  };
}
