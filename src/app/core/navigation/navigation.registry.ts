export interface PlatformNavigationItem {
  readonly label: string;
  readonly path: string;
  readonly icon: string;
  readonly permission?: string;
  readonly roles?: readonly string[];
}

export const PLATFORM_NAVIGATION: readonly PlatformNavigationItem[] = [
  { label: 'Company Administration', path: '/ops/operations/company-administration', icon: 'business', permission: 'tenant:read', roles: ['COMPANY_OWNER'] },
  { label: 'Overview', path: '/ops/overview', icon: 'dashboard', roles: ['COMPANY_OWNER'] },
  { label: 'Operations Dashboard', path: '/ops/operations/dashboard', icon: 'dashboard', permission: 'warehouse:read', roles: ['WAREHOUSE', 'LOGISTICS'] },
  { label: 'Product Catalog', path: '/ops/product-catalog', icon: 'inventory_2', permission: 'catalog:read', roles: ['SALES', 'WAREHOUSE'] },
  { label: 'Client Accounts', path: '/ops/commercial/client-accounts', icon: 'handshake', permission: 'sales:read', roles: ['SALES'] },
  { label: 'Purchase Requests', path: '/ops/commercial/purchase-requests', icon: 'request_quote', permission: 'sales:read', roles: ['SALES'] },
  { label: 'Sales Orders', path: '/ops/commercial/sales-orders', icon: 'receipt_long', permission: 'sales:read', roles: ['SALES'] },
  { label: 'Inventory Control', path: '/ops/operations/inventory', icon: 'inventory', permission: 'warehouse:read', roles: ['WAREHOUSE', 'LOGISTICS'] },
  { label: 'Warehouses and Zones', path: '/ops/operations/warehouses', icon: 'warehouse', permission: 'warehouse:read', roles: ['WAREHOUSE'] },
  { label: 'Inventory Lots', path: '/ops/operations/inventory/lots', icon: 'category', permission: 'warehouse:read', roles: ['WAREHOUSE'] },
  { label: 'Stock Movements', path: '/ops/operations/inventory/movements', icon: 'swap_vert', permission: 'warehouse:read', roles: ['WAREHOUSE'] },
  { label: 'Reservations', path: '/ops/operations/inventory/reservations', icon: 'inventory_2', permission: 'warehouse:read', roles: ['WAREHOUSE'] },
  { label: 'Fulfillment Readiness', path: '/ops/operations/fulfillment-readiness', icon: 'local_shipping', permission: 'fulfillment:read', roles: ['WAREHOUSE', 'LOGISTICS'] },
  { label: 'Inventory Overview', path: '/ops/operations/inventory-overview', icon: 'inventory', permission: 'warehouse:read', roles: ['LOGISTICS'] },
  { label: 'Dispatch Orders', path: '/ops/operations/dispatch-orders', icon: 'send', permission: 'logistics:read', roles: ['LOGISTICS'] },
  { label: 'Proof of Delivery', path: '/ops/operations/proof-of-delivery', icon: 'fact_check', permission: 'logistics:read', roles: ['LOGISTICS'] },
  { label: 'Temperature and Incidents', path: '/ops/operations/temperature-incidents', icon: 'thermostat', permission: 'logistics:read', roles: ['LOGISTICS'] },
  { label: 'Operational Analytics', path: '/ops/operations/operational-analytics', icon: 'analytics', permission: 'logistics:read', roles: ['LOGISTICS'] }
];
