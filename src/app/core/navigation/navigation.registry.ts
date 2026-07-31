export interface PlatformNavigationItem {
  readonly label: string;
  readonly path: string;
  readonly icon: string;
  readonly permission?: string;
  readonly roles?: readonly string[];
}

export const PLATFORM_NAVIGATION: readonly PlatformNavigationItem[] = [
  { label: 'Company Administration', path: '/ops/operations/company-administration', icon: 'business', permission: 'tenant:read', roles: ['COMPANY_OWNER'] },
  { label: 'Overview', path: '/ops/overview', icon: 'dashboard' },
  { label: 'Product Catalog', path: '/ops/product-catalog', icon: 'inventory_2', permission: 'catalog:read' },
  { label: 'Client Accounts', path: '/ops/commercial/client-accounts', icon: 'handshake', permission: 'sales:read' },
  { label: 'Purchase Requests', path: '/ops/commercial/purchase-requests', icon: 'request_quote', permission: 'sales:read' },
  { label: 'Sales Orders', path: '/ops/commercial/sales-orders', icon: 'receipt_long', permission: 'sales:read' },
  { label: 'Fulfillment Readiness', path: '/ops/fulfillment/readiness', icon: 'warehouse', permission: 'fulfillment:read' }
];
