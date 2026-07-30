export type SalesOrderStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED';
export type SalesOrderLoadStatus = 'idle' | 'loading' | 'retrying' | 'success' | 'empty' | 'error';

export interface SalesOrderLine {
  readonly id: string;
  readonly catalogItemId: string;
  readonly itemName: string;
  readonly presentation: string;
  readonly quantity: number;
  readonly unit: string;
  readonly unitPriceAmount: number;
  readonly unitPriceCurrency: string;
  readonly lineTotalAmount: number;
}

export interface SalesOrder {
  readonly id: string;
  readonly number: string;
  readonly purchaseRequestId: string;
  readonly clientAccountId: string;
  readonly clientAccountName: string;
  readonly currency: string;
  readonly total: number;
  readonly status: SalesOrderStatus;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly lines: readonly SalesOrderLine[];
  readonly version: number;
  readonly createdAt: string;
}

export interface SalesOrderPage {
  readonly items: readonly SalesOrder[];
  readonly page: number;
  readonly size: number;
  readonly totalItems: number;
  readonly totalPages: number;
  readonly sort: { readonly field: string; readonly direction: 'asc' | 'desc' };
}

export interface SalesOrderFilters {
  readonly status: SalesOrderStatus | '';
  readonly clientAccountId: string;
  readonly purchaseRequestId: string;
  readonly q: string;
  readonly page: number;
  readonly size: number;
  readonly sort: 'number' | 'status' | 'createdAt' | 'total';
  readonly direction: 'asc' | 'desc';
}

export interface SalesOrderEvent {
  readonly id: string;
  readonly type: string;
  readonly occurredAt: string;
  readonly actorDisplayName: string | null;
  readonly note: string | null;
  readonly status: SalesOrderStatus | null;
}

export interface FulfillmentCandidate {
  readonly salesOrderId: string;
  readonly salesOrderNumber: string;
  readonly clientAccountId: string;
  readonly clientAccountName: string;
  readonly status: 'AWAITING_INVENTORY_RESERVATION';
  readonly warehouseId: string | null;
  readonly logisticsEligibleAt: string | null;
}

export interface SalesOrderState {
  readonly status: SalesOrderLoadStatus;
  readonly page: SalesOrderPage | null;
  readonly item: SalesOrder | null;
  readonly events: readonly SalesOrderEvent[];
  readonly candidates: readonly FulfillmentCandidate[];
  readonly message: string | null;
}

export const DEFAULT_SALES_ORDER_FILTERS: SalesOrderFilters = {
  status: '', clientAccountId: '', purchaseRequestId: '', q: '', page: 0, size: 25, sort: 'createdAt', direction: 'desc'
};
