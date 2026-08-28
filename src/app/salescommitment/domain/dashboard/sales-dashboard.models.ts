import { PurchaseRequest } from '../purchase-requests/purchase-request.models';
import { SalesOrder } from '../sales-orders/sales-order.models';

export type SalesDashboardLoadStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error';

export interface SalesDashboardMetrics {
  readonly submittedPurchaseRequests: number;
  readonly purchaseRequestsUnderReview: number;
  readonly purchaseRequestsNeedsAdjustment: number;
  readonly approvedPurchaseRequests: number;
  readonly pendingSalesOrders: number;
  readonly confirmedSalesOrders: number;
}

export interface SalesDashboardState {
  readonly status: SalesDashboardLoadStatus;
  readonly metrics: SalesDashboardMetrics;
  readonly recentPurchaseRequests: readonly PurchaseRequest[];
  readonly recentSalesOrders: readonly SalesOrder[];
  readonly message: string | null;
}

export const EMPTY_SALES_DASHBOARD: SalesDashboardState = {
  status: 'idle',
  metrics: { submittedPurchaseRequests: 0, purchaseRequestsUnderReview: 0, purchaseRequestsNeedsAdjustment: 0, approvedPurchaseRequests: 0, pendingSalesOrders: 0, confirmedSalesOrders: 0 },
  recentPurchaseRequests: [],
  recentSalesOrders: [],
  message: null
};
