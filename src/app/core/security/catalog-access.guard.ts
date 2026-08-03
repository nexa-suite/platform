import { CanActivateFn } from '@angular/router';
import { permissionGuard } from './permission.guard';
import { PLATFORM_PERMISSIONS } from './platform-permissions';

export const CATALOG_READ_PERMISSION = PLATFORM_PERMISSIONS.catalogRead;
export const CATALOG_MANAGE_PERMISSION = PLATFORM_PERMISSIONS.catalogManage;
export const CATALOG_PRICE_MANAGE_PERMISSION = PLATFORM_PERMISSIONS.catalogPriceManage;
export const PROMOTION_READ_PERMISSION = PLATFORM_PERMISSIONS.promotionRead;
export const PROMOTION_MANAGE_PERMISSION = PLATFORM_PERMISSIONS.promotionManage;

export const catalogReadGuard: CanActivateFn = permissionGuard(CATALOG_READ_PERMISSION);
export const catalogManageGuard: CanActivateFn = permissionGuard(CATALOG_MANAGE_PERMISSION);
export const catalogPriceManageGuard: CanActivateFn = permissionGuard(CATALOG_PRICE_MANAGE_PERMISSION);
export const promotionReadGuard: CanActivateFn = permissionGuard(PROMOTION_READ_PERMISSION);
export const promotionManageGuard: CanActivateFn = permissionGuard(PROMOTION_MANAGE_PERMISSION);
