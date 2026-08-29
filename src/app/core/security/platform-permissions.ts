import { AuthenticatedUser, InternalRole } from './platform-authentication.boundary';

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
  documentRead: 'document.read',
  documentGenerate: 'document.generate',
  documentUpload: 'document.upload',
  documentDownload: 'document.download',
  paymentRead: 'payment.read',
  paymentReconcile: 'payment.reconcile',
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

export interface PlatformWorkArea extends PlatformArea {
  readonly id: string;
  readonly labelKey: string;
}

export type PlatformOperationalRole = 'WAREHOUSE' | 'LOGISTICS';

/**
 * Resolves the primary operational work area without broadening permissions.
 * Explicit backend roles win over the effective permission fallback so a
 * multi-role session still opens the work area selected by its role identity.
 */
export function platformOperationalRoleForUser(
  user: AuthenticatedUser | null,
  hasPermission: (permission: string) => boolean,
): PlatformOperationalRole | null {
  if (user?.roles.includes('LOGISTICS') && hasPermission(PLATFORM_PERMISSIONS.logisticsRead)) {
    return 'LOGISTICS';
  }
  if (user?.roles.includes('WAREHOUSE') && hasPermission(PLATFORM_PERMISSIONS.warehouseRead)) {
    return 'WAREHOUSE';
  }
  if (hasPermission(PLATFORM_PERMISSIONS.logisticsRead) && !hasPermission(PLATFORM_PERMISSIONS.warehouseRead)) {
    return 'LOGISTICS';
  }
  if (hasPermission(PLATFORM_PERMISSIONS.warehouseRead)) return 'WAREHOUSE';
  return null;
}

/** Ordered permission-backed destinations used for landing and custom-role sessions. */
export const PLATFORM_PERMISSION_WORK_AREAS: readonly PlatformWorkArea[] = [
  { id: 'TENANT_ADMIN', path: '/ops/operations/company-administration', permission: PLATFORM_PERMISSIONS.tenantRead, labelKey: 'shell.roles.TENANT_ADMIN' },
  { id: 'COMPANY_OWNER', path: '/ops/executive-overview', permission: PLATFORM_PERMISSIONS.ownerDashboardRead, labelKey: 'shell.roles.COMPANY_OWNER' },
  { id: 'SALES', path: '/ops/commercial/dashboard', permission: PLATFORM_PERMISSIONS.salesRead, labelKey: 'shell.roles.SALES' },
  { id: 'WAREHOUSE', path: '/ops/operations/dashboard', permission: PLATFORM_PERMISSIONS.warehouseRead, labelKey: 'shell.roles.WAREHOUSE' },
  { id: 'LOGISTICS', path: '/ops/operations/dispatch-orders', permission: PLATFORM_PERMISSIONS.logisticsRead, labelKey: 'shell.roles.LOGISTICS' },
  { id: 'FULFILLMENT', path: '/ops/fulfillment/readiness', permission: PLATFORM_PERMISSIONS.fulfillmentRead, labelKey: 'shell.navigation.fulfillmentReadiness' },
  { id: 'FINANCE', path: '/ops/finance/bank-transfers', permission: PLATFORM_PERMISSIONS.paymentReconcile, labelKey: 'shell.navigation.bankTransfers' },
  { id: 'CATALOG', path: '/ops/catalog', permission: PLATFORM_PERMISSIONS.catalogRead, labelKey: 'shell.groups.catalog' },
];

export const PLATFORM_PERMISSION_LANDINGS: readonly PlatformArea[] = PLATFORM_PERMISSION_WORK_AREAS;

export function firstPermittedPlatformLanding(
  hasPermission: (permission: string) => boolean,
): PlatformArea | null {
  return PLATFORM_PERMISSION_LANDINGS.find(({ permission }) => hasPermission(permission)) ?? null;
}

/**
 * Role semantics choose the initial area when the backend grants a broader
 * permission envelope than the role's primary landing. Custom roles still
 * resolve by effective permission only.
 */
export function platformLandingForUser(
  user: AuthenticatedUser | null,
  hasPermission: (permission: string) => boolean,
): PlatformArea | null {
  if (user?.roles.length === 1) {
    const role = user.roles[0];
    const roleLanding = PLATFORM_LANDINGS[role];
    if (roleLanding && hasPermission(roleLanding.permission)) return roleLanding;
  }
  return firstPermittedPlatformLanding(hasPermission);
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
  LOGISTICS: { path: '/ops/operations/dispatch-orders', permission: PLATFORM_PERMISSIONS.logisticsRead }
};

export const PLATFORM_ROLE_PRIORITY: readonly InternalRole[] = [
  'TENANT_ADMIN',
  'COMPANY_OWNER',
  'SALES',
  'WAREHOUSE',
  'LOGISTICS'
];
