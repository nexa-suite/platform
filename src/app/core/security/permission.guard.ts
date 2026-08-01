import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthenticationService } from '../../iam/application/authentication.service';
import { PLATFORM_ROUTES } from '../routing/route-paths';

export function permissionGuard(requiredPermission: string): CanActivateFn {
  return (_route, routerState) => {
    const authentication = inject(AuthenticationService);
    const router = inject(Router);
    if (authentication.status() === 'authenticated' && authentication.hasPermission(requiredPermission)) return true;
    authentication.markForbidden();
    return router.createUrlTree([PLATFORM_ROUTES.forbidden], { queryParams: { returnUrl: routerState.url } });
  };
}

export function anyPermissionGuard(requiredPermissions: readonly string[]): CanActivateFn {
  return (_route, routerState) => {
    const authentication = inject(AuthenticationService);
    const router = inject(Router);
    if (authentication.status() === 'authenticated' && requiredPermissions.some((permission) => authentication.hasPermission(permission))) return true;
    authentication.markForbidden();
    return router.createUrlTree([PLATFORM_ROUTES.forbidden], { queryParams: { returnUrl: routerState.url } });
  };
}
