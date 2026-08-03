import { PLATFORM_PERMISSIONS, PlatformPermission } from '../security/platform-permissions';

export interface PlatformNavigationItem {
  readonly labelKey: string;
  readonly path: string;
  readonly icon: string;
  readonly permission: PlatformPermission;
}

export type PlatformNavigationGroupId = 'administration' | 'commercial' | 'catalog' | 'warehouse' | 'logistics';

export interface PlatformNavigationGroup {
  readonly id: PlatformNavigationGroupId;
  readonly labelKey: string;
  readonly icon: string;
  readonly items: readonly PlatformNavigationItem[];
}

const ADMINISTRATION_ITEMS: readonly PlatformNavigationItem[] = [
  { labelKey: 'shell.navigation.companyAdministration', path: '/ops/operations/company-administration', icon: 'business', permission: PLATFORM_PERMISSIONS.tenantRead },
  { labelKey: 'shell.navigation.executiveOverview', path: '/ops/executive-overview', icon: 'insights', permission: PLATFORM_PERMISSIONS.ownerDashboardRead }
];

const COMMERCIAL_ITEMS: readonly PlatformNavigationItem[] = [
  { labelKey: 'shell.navigation.salesDashboard', path: '/ops/commercial/dashboard', icon: 'monitoring', permission: PLATFORM_PERMISSIONS.salesRead },
  { labelKey: 'shell.navigation.clientAccounts', path: '/ops/commercial/client-accounts', icon: 'handshake', permission: PLATFORM_PERMISSIONS.salesRead },
  { labelKey: 'shell.navigation.requestBuilder', path: '/ops/commercial/request-builder', icon: 'playlist_add', permission: PLATFORM_PERMISSIONS.salesWrite },
  { labelKey: 'shell.navigation.manualSalesOrder', path: '/ops/commercial/manual-sales-order', icon: 'add_shopping_cart', permission: PLATFORM_PERMISSIONS.salesWrite },
  { labelKey: 'shell.navigation.purchaseRequests', path: '/ops/commercial/purchase-requests', icon: 'request_quote', permission: PLATFORM_PERMISSIONS.salesRead },
  { labelKey: 'shell.navigation.salesOrders', path: '/ops/commercial/sales-orders', icon: 'receipt_long', permission: PLATFORM_PERMISSIONS.salesRead }
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

export const PLATFORM_NAVIGATION_GROUPS: readonly PlatformNavigationGroup[] = [
  { id: 'administration', labelKey: 'shell.groups.administration', icon: 'admin_panel_settings', items: ADMINISTRATION_ITEMS },
  { id: 'commercial', labelKey: 'shell.groups.commercial', icon: 'handshake', items: COMMERCIAL_ITEMS },
  { id: 'catalog', labelKey: 'shell.groups.catalog', icon: 'inventory_2', items: CATALOG_ITEMS },
  { id: 'warehouse', labelKey: 'shell.groups.warehouse', icon: 'warehouse', items: WAREHOUSE_ITEMS },
  { id: 'logistics', labelKey: 'shell.groups.logistics', icon: 'local_shipping', items: LOGISTICS_ITEMS }
];

export const PLATFORM_NAVIGATION: readonly PlatformNavigationItem[] = [
  ...PLATFORM_NAVIGATION_GROUPS.flatMap((group) => group.items)
];
