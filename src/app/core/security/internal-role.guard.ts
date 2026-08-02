import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthenticationService } from '../../iam/application/authentication.service';
import { InternalRole } from '../../iam/domain/models/auth.models';
import { PLATFORM_ROUTES } from '../routing/route-paths';

export function internalRoleGuard(requiredRoles: readonly InternalRole[]): CanActivateFn {
  return (_route, routerState) => {
    const authentication = inject(AuthenticationService);
    const router = inject(Router);
    const user = authentication.currentUser();

    if (authentication.status() !== 'authenticated' || !user) {
      return router.createUrlTree(['/sign-in'], { queryParams: { returnUrl: routerState.url } });
    }

    if (user.roles.some((role) => requiredRoles.includes(role))) return true;

    authentication.markForbidden();
    return router.createUrlTree([PLATFORM_ROUTES.forbidden], {
      queryParams: { returnUrl: routerState.url, reason: 'ROLE_NOT_ASSIGNED' }
    });
  };
}
