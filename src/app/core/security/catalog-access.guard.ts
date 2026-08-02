import { CanActivateFn } from '@angular/router';
import { InternalRole } from '../../iam/domain/models/auth.models';
import { internalRoleGuard } from './internal-role.guard';
import { permissionGuard } from './permission.guard';

export const CATALOG_READ_PERMISSION = 'catalog:read';
export const CATALOG_MANAGE_PERMISSION = 'catalog:manage';
export const CATALOG_PRICE_MANAGE_PERMISSION = 'catalog:price:manage';
export const PROMOTION_READ_PERMISSION = 'promotion:read';
export const PROMOTION_MANAGE_PERMISSION = 'promotion:manage';

export const CATALOG_READ_ROLES = ['COMPANY_OWNER', 'SALES', 'WAREHOUSE', 'LOGISTICS'] as const satisfies readonly InternalRole[];
export const CATALOG_MANAGE_ROLES = ['COMPANY_OWNER', 'SALES'] as const satisfies readonly InternalRole[];
export const CATALOG_PRICE_MANAGE_ROLES = ['COMPANY_OWNER', 'SALES'] as const satisfies readonly InternalRole[];
export const PROMOTION_READ_ROLES = ['COMPANY_OWNER', 'SALES', 'LOGISTICS'] as const satisfies readonly InternalRole[];
export const PROMOTION_MANAGE_ROLES = ['COMPANY_OWNER', 'LOGISTICS'] as const satisfies readonly InternalRole[];

function catalogAccessGuard(roles: readonly InternalRole[], permission: string): CanActivateFn {
  const roleGuard = internalRoleGuard(roles);
  const accessGuard = permissionGuard(permission);

  return (route, routerState) => {
    const roleResult = roleGuard(route, routerState);
    return roleResult === true ? accessGuard(route, routerState) : roleResult;
  };
}

export const catalogReadGuard = catalogAccessGuard(CATALOG_READ_ROLES, CATALOG_READ_PERMISSION);
export const catalogManageGuard = catalogAccessGuard(CATALOG_MANAGE_ROLES, CATALOG_MANAGE_PERMISSION);
export const catalogPriceManageGuard = catalogAccessGuard(CATALOG_PRICE_MANAGE_ROLES, CATALOG_PRICE_MANAGE_PERMISSION);
export const promotionReadGuard = catalogAccessGuard(PROMOTION_READ_ROLES, PROMOTION_READ_PERMISSION);
export const promotionManageGuard = catalogAccessGuard(PROMOTION_MANAGE_ROLES, PROMOTION_MANAGE_PERMISSION);
