export type PurchaseRequestStatus = 'DRAFT' | 'SUBMITTED' | 'IN_REVIEW' | 'NEEDS_ADJUSTMENT' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'CONVERTED_TO_ORDER';
export type PurchaseRequestPriority = 'NORMAL' | 'HIGH' | 'URGENT';
export type PaymentOption = 'CREDIT_LINE' | 'BANK_TRANSFER' | 'CASH' | 'CASH_ON_DELIVERY';
export type PurchaseRequestLoadStatus = 'idle' | 'loading' | 'retrying' | 'success' | 'empty' | 'error';

export interface PurchaseRequestLine {
  readonly id: string;
  readonly catalogItemId: string;
  readonly itemName: string;
  readonly presentation: string;
  readonly quantity: number;
  readonly unit: string;
  readonly unitPriceAmount: number | null;
  readonly unitPriceCurrency: string | null;
  readonly notes: string | null;
}

export interface PurchaseRequest {
  readonly id: string;
  readonly code: string;
  readonly clientAccountId: string;
  readonly buyerMembershipId: string;
  readonly status: PurchaseRequestStatus;
  readonly priority: PurchaseRequestPriority;
  readonly requestedDeliveryDate: string | null;
  readonly lineCount: number;
  readonly deliveryProfileSnapshot: string | null;
  readonly paymentOption: PaymentOption | null;
  readonly comment: string | null;
  readonly reviewNote: string | null;
  readonly lines: readonly PurchaseRequestLine[];
  readonly version: number;
}

export interface PurchaseRequestPage {
  readonly items: readonly PurchaseRequest[];
  readonly page: number;
  readonly size: number;
  readonly totalItems: number;
  readonly totalPages: number;
  readonly sort: { readonly field: string; readonly direction: 'asc' | 'desc' };
}

export interface PurchaseRequestFilters {
  readonly status: PurchaseRequestStatus | '';
  readonly priority: PurchaseRequestPriority | '';
  readonly clientAccountId: string;
  readonly q: string;
  readonly page: number;
  readonly size: number;
  readonly sort: 'createdAt' | 'updatedAt';
  readonly direction: 'asc' | 'desc';
}

export interface PurchaseRequestEvent {
  readonly id: string;
  readonly type: string;
  readonly occurredAt: string;
  readonly actorDisplayName: string | null;
  readonly note: string | null;
  readonly status: PurchaseRequestStatus | null;
}

export type PurchaseRequestAction = 'reviews' | 'adjustment-requests' | 'approvals' | 'rejections';

export interface PurchaseRequestState {
  readonly status: PurchaseRequestLoadStatus;
  readonly page: PurchaseRequestPage | null;
  readonly item: PurchaseRequest | null;
  readonly events: readonly PurchaseRequestEvent[];
  readonly message: string | null;
}

export const DEFAULT_PURCHASE_REQUEST_FILTERS: PurchaseRequestFilters = {
  status: '', priority: '', clientAccountId: '', q: '', page: 0, size: 25, sort: 'createdAt', direction: 'desc'
};

export interface CreatePurchaseRequestCommand {
  readonly clientAccountId?: string;
  readonly priority?: string;
  readonly requestedDeliveryDate?: string | null;
  readonly deliveryProfileSnapshot?: string | null;
  readonly paymentOption?: string | null;
  readonly comment?: string | null;
  readonly lines: readonly PurchaseRequestLineCommand[];
}

export interface UpdatePurchaseRequestCommand {
  readonly priority?: string | null;
  readonly requestedDeliveryDate?: string | null;
  readonly deliveryProfileSnapshot?: string | null;
  readonly paymentOption?: string | null;
  readonly comment?: string | null;
}

export interface PurchaseRequestLineCommand {
  readonly catalogItemId: string;
  readonly quantity: number;
  readonly unit: string;
  readonly notes?: string | null;
}

export interface UpdatePurchaseRequestLineCommand {
  readonly quantity: number;
  readonly notes?: string | null;
}

export interface CreateManualSalesOrderCommand {
  readonly clientAccountId: string;
  readonly addressId: string | null;
  readonly manualAddress: SalesCommitmentDeliveryAddressCommand | null;
  readonly requestedDeliveryDate: string;
  readonly deliveryNotes: string;
  readonly warehouseId: string | null;
  readonly routeProvider: string | null;
  readonly paymentOption: string;
  readonly priority: string;
  readonly currency: string;
  readonly notes: string;
  readonly lines: readonly PurchaseRequestLineCommand[];
}
import { SalesCommitmentDeliveryAddressCommand } from '../customer-reference.models';
