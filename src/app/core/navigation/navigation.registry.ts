import { PLATFORM_PERMISSIONS, PlatformPermission } from '../security/platform-permissions';

export interface PlatformNavigationItem {
  readonly labelKey: string;
  readonly path: string;
  readonly icon: string;
  readonly permission: PlatformPermission;
  readonly badge?: number;
}

export type PlatformNavigationGroupId = 'administration' | 'commercial' | 'catalog' | 'warehouse' | 'logistics' | 'finance';

export interface PlatformNavigationGroup {
  readonly id: PlatformNavigationGroupId;
  readonly labelKey: string;
  readonly icon: string;
  readonly items: readonly PlatformNavigationItem[];
}

const ADMINISTRATION_ITEMS: readonly PlatformNavigationItem[] = [
  { labelKey: 'shell.navigation.companyAdministration', path: '/ops/operations/company-administration', icon: 'business', permission: PLATFORM_PERMISSIONS.tenantRead },
  { labelKey: 'shell.navigation.auditViewer', path: '/ops/operations/audit', icon: 'fact_check', permission: PLATFORM_PERMISSIONS.tenantRead },
  { labelKey: 'shell.navigation.executiveOverview', path: '/ops/executive-overview', icon: 'insights', permission: PLATFORM_PERMISSIONS.ownerDashboardRead }
];

const COMMERCIAL_ITEMS: readonly PlatformNavigationItem[] = [
  { labelKey: 'shell.navigation.salesDashboard', path: '/ops/commercial/dashboard', icon: 'dashboard', permission: PLATFORM_PERMISSIONS.salesRead },
  { labelKey: 'shell.navigation.purchaseRequests', path: '/ops/commercial/purchase-requests', icon: 'inbox', permission: PLATFORM_PERMISSIONS.salesRead },
  { labelKey: 'shell.navigation.purchaseOrders', path: '/ops/commercial/purchase-orders', icon: 'file_edit', permission: PLATFORM_PERMISSIONS.salesRead },
  { labelKey: 'shell.navigation.manualOrderEntry', path: '/ops/commercial/manual-order-entry', icon: 'add_circle', permission: PLATFORM_PERMISSIONS.salesWrite },
  { labelKey: 'shell.navigation.b2bClients', path: '/ops/commercial/client-accounts', icon: 'groups', permission: PLATFORM_PERMISSIONS.salesRead },
  { labelKey: 'shell.navigation.businessDocuments', path: '/ops/commercial/business-documents', icon: 'file_check', permission: PLATFORM_PERMISSIONS.documentRead }
];

const CATALOG_ITEMS: readonly PlatformNavigationItem[] = [
  { labelKey: 'catalog.navigation.catalog', path: '/ops/catalog', icon: 'inventory_2', permission: PLATFORM_PERMISSIONS.catalogRead }
];

const WAREHOUSE_ITEMS: readonly PlatformNavigationItem[] = [
  { labelKey: 'shell.navigation.operationsDashboard', path: '/ops/operations/dashboard', icon: 'dashboard', permission: PLATFORM_PERMISSIONS.warehouseRead },
  { labelKey: 'shell.navigation.inventoryControl', path: '/ops/operations/inventory', icon: 'inventory', permission: PLATFORM_PERMISSIONS.warehouseRead },
  { labelKey: 'shell.navigation.warehouses', path: '/ops/operations/warehouses', icon: 'warehouse', permission: PLATFORM_PERMISSIONS.warehouseRead },
  { labelKey: 'shell.navigation.inventoryLots', path: '/ops/operations/inventory/lots', icon: 'category', permission: PLATFORM_PERMISSIONS.warehouseRead },
  { labelKey: 'shell.navigation.stockMovements', path: '/ops/operations/inventory/movements', icon: 'swap_vert', permission: PLATFORM_PERMISSIONS.warehouseRead },
  { labelKey: 'shell.navigation.reservations', path: '/ops/operations/inventory/reservations', icon: 'inventory_2', permission: PLATFORM_PERMISSIONS.warehouseRead },
  { labelKey: 'shell.navigation.fulfillmentReadiness', path: '/ops/operations/fulfillment-readiness', icon: 'local_shipping', permission: PLATFORM_PERMISSIONS.fulfillmentRead }
];

const LOGISTICS_ITEMS: readonly PlatformNavigationItem[] = [
  { labelKey: 'shell.navigation.dispatchOrders', path: '/ops/operations/dispatch-orders', icon: 'send', permission: PLATFORM_PERMISSIONS.logisticsRead },
  { labelKey: 'shell.navigation.proofOfDelivery', path: '/ops/operations/proof-of-delivery', icon: 'fact_check', permission: PLATFORM_PERMISSIONS.logisticsRead },
  { labelKey: 'shell.navigation.temperatureIncidents', path: '/ops/operations/temperature-incidents', icon: 'thermostat', permission: PLATFORM_PERMISSIONS.logisticsRead },
  { labelKey: 'shell.navigation.operationalAnalytics', path: '/ops/operations/operational-analytics', icon: 'analytics', permission: PLATFORM_PERMISSIONS.logisticsRead }
];

const FINANCE_ITEMS: readonly PlatformNavigationItem[] = [
  { labelKey: 'shell.navigation.bankTransfers', path: '/ops/finance/bank-transfers', icon: 'account_balance', permission: PLATFORM_PERMISSIONS.paymentReconcile }
];

export const PLATFORM_NAVIGATION_GROUPS: readonly PlatformNavigationGroup[] = [
  { id: 'administration', labelKey: 'shell.groups.administration', icon: 'admin_panel_settings', items: ADMINISTRATION_ITEMS },
  { id: 'commercial', labelKey: 'shell.groups.commercial', icon: 'handshake', items: COMMERCIAL_ITEMS },
  { id: 'catalog', labelKey: 'shell.groups.catalog', icon: 'inventory_2', items: CATALOG_ITEMS },
  { id: 'warehouse', labelKey: 'shell.groups.warehouse', icon: 'warehouse', items: WAREHOUSE_ITEMS },
  { id: 'logistics', labelKey: 'shell.groups.logistics', icon: 'local_shipping', items: LOGISTICS_ITEMS },
  { id: 'finance', labelKey: 'shell.groups.finance', icon: 'account_balance', items: FINANCE_ITEMS }
];

export const PLATFORM_NAVIGATION: readonly PlatformNavigationItem[] = [
  ...PLATFORM_NAVIGATION_GROUPS.flatMap((group) => group.items)
];
