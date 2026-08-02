export interface PlatformNavigationItem {
  readonly labelKey: string;
  readonly path: string;
  readonly icon: string;
  readonly permission?: string;
  readonly roles?: readonly string[];
}

export const PLATFORM_NAVIGATION: readonly PlatformNavigationItem[] = [
  { labelKey: 'shell.navigation.companyAdministration', path: '/ops/operations/company-administration', icon: 'business', permission: 'tenant:read', roles: ['TENANT_ADMIN', 'COMPANY_OWNER'] },
  { labelKey: 'shell.navigation.salesDashboard', path: '/ops/commercial/dashboard', icon: 'monitoring', permission: 'sales:read', roles: ['SALES'] },
  { labelKey: 'shell.navigation.operationsDashboard', path: '/ops/operations/dashboard', icon: 'dashboard', permission: 'warehouse:read', roles: ['WAREHOUSE', 'LOGISTICS'] },
  { labelKey: 'catalog.navigation.catalog', path: '/ops/catalog', icon: 'inventory_2', permission: 'catalog:read', roles: ['COMPANY_OWNER', 'SALES', 'WAREHOUSE', 'LOGISTICS'] },
  { labelKey: 'shell.navigation.clientAccounts', path: '/ops/commercial/client-accounts', icon: 'handshake', permission: 'sales:read', roles: ['SALES'] },
  { labelKey: 'shell.navigation.purchaseRequests', path: '/ops/commercial/purchase-requests', icon: 'request_quote', permission: 'sales:read', roles: ['SALES'] },
  { labelKey: 'shell.navigation.salesOrders', path: '/ops/commercial/sales-orders', icon: 'receipt_long', permission: 'sales:read', roles: ['SALES'] },
  { labelKey: 'shell.navigation.inventoryControl', path: '/ops/operations/inventory', icon: 'inventory', permission: 'warehouse:read', roles: ['WAREHOUSE', 'LOGISTICS'] },
  { labelKey: 'shell.navigation.warehouses', path: '/ops/operations/warehouses', icon: 'warehouse', permission: 'warehouse:read', roles: ['WAREHOUSE'] },
  { labelKey: 'shell.navigation.inventoryLots', path: '/ops/operations/inventory/lots', icon: 'category', permission: 'warehouse:read', roles: ['WAREHOUSE'] },
  { labelKey: 'shell.navigation.stockMovements', path: '/ops/operations/inventory/movements', icon: 'swap_vert', permission: 'warehouse:read', roles: ['WAREHOUSE'] },
  { labelKey: 'shell.navigation.reservations', path: '/ops/operations/inventory/reservations', icon: 'inventory_2', permission: 'warehouse:read', roles: ['WAREHOUSE'] },
  { labelKey: 'shell.navigation.fulfillmentReadiness', path: '/ops/operations/fulfillment-readiness', icon: 'local_shipping', permission: 'fulfillment:read', roles: ['WAREHOUSE', 'LOGISTICS'] },
  { labelKey: 'shell.navigation.inventoryOverview', path: '/ops/operations/inventory-overview', icon: 'inventory', permission: 'warehouse:read', roles: ['LOGISTICS'] },
  { labelKey: 'shell.navigation.dispatchOrders', path: '/ops/operations/dispatch-orders', icon: 'send', permission: 'logistics:read', roles: ['LOGISTICS'] },
  { labelKey: 'shell.navigation.proofOfDelivery', path: '/ops/operations/proof-of-delivery', icon: 'fact_check', permission: 'logistics:read', roles: ['LOGISTICS'] },
  { labelKey: 'shell.navigation.temperatureIncidents', path: '/ops/operations/temperature-incidents', icon: 'thermostat', permission: 'logistics:read', roles: ['LOGISTICS'] },
  { labelKey: 'shell.navigation.operationalAnalytics', path: '/ops/operations/operational-analytics', icon: 'analytics', permission: 'logistics:read', roles: ['LOGISTICS'] }
];
