import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthenticationService } from '../../iam/application/authentication.service';
import { PLATFORM_ROUTES, safeReturnUrl } from '../routing/route-paths';

export function permissionGuard(requiredPermission: string): CanActivateFn {
  return (_route, routerState) => {
    const authentication = inject(AuthenticationService);
    const router = inject(Router);
    if (authentication.status() !== 'authenticated') {
      return router.createUrlTree([PLATFORM_ROUTES.signIn], { queryParams: { returnUrl: safeReturnUrl(routerState.url) } });
    }
    if (authentication.hasPermission(requiredPermission)) return true;
    authentication.markForbidden();
    return router.createUrlTree([PLATFORM_ROUTES.forbidden], { queryParams: { returnUrl: safeReturnUrl(routerState.url), reason: 'PERMISSION_NOT_GRANTED' } });
  };
}

export function anyPermissionGuard(requiredPermissions: readonly string[]): CanActivateFn {
  return (_route, routerState) => {
    const authentication = inject(AuthenticationService);
    const router = inject(Router);
    if (authentication.status() !== 'authenticated') {
      return router.createUrlTree([PLATFORM_ROUTES.signIn], { queryParams: { returnUrl: safeReturnUrl(routerState.url) } });
    }
    if (requiredPermissions.some((permission) => authentication.hasPermission(permission))) return true;
    authentication.markForbidden();
    return router.createUrlTree([PLATFORM_ROUTES.forbidden], { queryParams: { returnUrl: safeReturnUrl(routerState.url), reason: 'PERMISSION_NOT_GRANTED' } });
  };
}
