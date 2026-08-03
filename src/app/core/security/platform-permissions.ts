import { InternalRole } from '../../iam/domain/models/auth.models';

/**
 * Permission codes owned by the API access policy.
 *
 * The client never derives a user's permissions from this list; it only uses
 * the codes returned by the authenticated session to protect and expose UI.
 */
export const PLATFORM_PERMISSIONS = {
  tenantRead: 'tenant:read',
  tenantManage: 'tenant:manage',
  iamUserRead: 'iam:user:read',
  iamUserManage: 'iam:user:manage',
  ownerDashboardRead: 'owner:dashboard:read',
  salesRead: 'sales:read',
  salesWrite: 'sales:write',
  warehouseRead: 'warehouse:read',
  warehouseWrite: 'warehouse:write',
  fulfillmentRead: 'fulfillment:read',
  logisticsRead: 'logistics:read',
  logisticsWrite: 'logistics:write',
  catalogRead: 'catalog:read',
  catalogManage: 'catalog:manage',
  catalogPriceManage: 'catalog:price:manage',
  promotionRead: 'promotion:read',
  promotionManage: 'promotion:manage'
} as const;

export type PlatformPermission = (typeof PLATFORM_PERMISSIONS)[keyof typeof PLATFORM_PERMISSIONS];

export interface PlatformArea {
  readonly path: string;
  readonly permission: PlatformPermission;
}

/** Areas shown by the role selector. Permission checks remain authoritative. */
export const PLATFORM_AREAS: Readonly<Record<InternalRole, PlatformArea>> = {
  TENANT_ADMIN: { path: '/ops/operations/company-administration', permission: PLATFORM_PERMISSIONS.tenantRead },
  COMPANY_OWNER: { path: '/ops/executive-overview', permission: PLATFORM_PERMISSIONS.ownerDashboardRead },
  SALES: { path: '/ops/commercial/dashboard', permission: PLATFORM_PERMISSIONS.salesRead },
  WAREHOUSE: { path: '/ops/operations/dashboard', permission: PLATFORM_PERMISSIONS.warehouseRead },
  LOGISTICS: { path: '/ops/operations/dispatch-orders', permission: PLATFORM_PERMISSIONS.logisticsRead }
};

/** Preferred landing areas for a session carrying one or more backend roles. */
export const PLATFORM_LANDINGS: Readonly<Record<InternalRole, PlatformArea>> = {
  TENANT_ADMIN: { path: '/ops/operations/company-administration', permission: PLATFORM_PERMISSIONS.tenantRead },
  COMPANY_OWNER: { path: '/ops/executive-overview', permission: PLATFORM_PERMISSIONS.ownerDashboardRead },
  SALES: { path: '/ops/commercial/dashboard', permission: PLATFORM_PERMISSIONS.salesRead },
  WAREHOUSE: { path: '/ops/operations/dashboard', permission: PLATFORM_PERMISSIONS.warehouseRead },
  LOGISTICS: { path: '/ops/operations/dashboard', permission: PLATFORM_PERMISSIONS.warehouseRead }
};

export const PLATFORM_ROLE_PRIORITY: readonly InternalRole[] = [
  'TENANT_ADMIN',
  'COMPANY_OWNER',
  'SALES',
  'WAREHOUSE',
  'LOGISTICS'
];
