import { ClientAccount, ClientAccountPage } from '../../client-accounts/domain/client-account.models';
import { PaymentOption, PurchaseRequest, PurchaseRequestEvent, PurchaseRequestLine, PurchaseRequestPage, PurchaseRequestStatus } from '../../purchase-requests/domain/purchase-request.models';
import { FulfillmentCandidate, SalesOrder, SalesOrderEvent, SalesOrderLine, SalesOrderPage, SalesOrderStatus } from '../../sales-orders/domain/sales-order.models';

export type ApiRecord = Readonly<Record<string, unknown>>;

export interface ApiPageDto extends ApiRecord {
  readonly items?: readonly ApiRecord[];
  readonly page?: number;
  readonly size?: number;
  readonly totalItems?: number;
  readonly total?: number;
  readonly totalPages?: number;
  readonly sort?: ApiRecord;
}

const record = (value: unknown): ApiRecord => value !== null && typeof value === 'object' ? value as ApiRecord : {};
const stringValue = (value: ApiRecord, ...keys: string[]): string => {
  for (const key of keys) {
    const candidate = value[key];
    if (typeof candidate === 'string') return candidate;
  }
  return '';
};
const nullableString = (value: ApiRecord, ...keys: string[]): string | null => stringValue(value, ...keys) || null;
const numberValue = (value: ApiRecord, ...keys: string[]): number => {
  for (const key of keys) {
    const candidate = value[key];
    const number = typeof candidate === 'number' ? candidate : typeof candidate === 'string' ? Number(candidate) : NaN;
    if (Number.isFinite(number)) return number;
  }
  return 0;
};
const nestedString = (value: ApiRecord, key: string, ...keys: string[]): string => {
  const nested = value[key];
  return typeof nested === 'string' ? nested : stringValue(record(nested), ...keys);
};

export function toClientAccount(value: ApiRecord): ClientAccount {
  return {
    id: stringValue(value, 'clientAccountId', 'id'),
    code: stringValue(value, 'clientAccountCode', 'code'),
    businessName: stringValue(value, 'businessName', 'legalName'),
    commercialName: stringValue(value, 'commercialName', 'tradeName'),
    segment: stringValue(value, 'segment'),
    contactPerson: stringValue(value, 'contactPerson', 'contactName'),
    contactEmail: stringValue(value, 'contactEmail', 'email'),
    phone: stringValue(value, 'phone', 'contactPhone'),
    deliveryProfile: stringValue(value, 'deliveryProfile'),
    paymentCondition: stringValue(value, 'paymentCondition'),
    status: stringValue(value, 'status'),
    buyerMembershipId: nullableString(value, 'buyerMembershipId'),
    version: numberValue(value, 'version')
  };
}

export function toPage<T>(response: ApiPageDto, mapper: (value: ApiRecord) => T): { readonly items: readonly T[]; readonly page: number; readonly size: number; readonly totalItems: number; readonly totalPages: number; readonly sort: { readonly field: string; readonly direction: 'asc' | 'desc' } } {
  const page = numberValue(response, 'page');
  const size = numberValue(response, 'size') || 25;
  const totalItems = numberValue(response, 'totalItems', 'total');
  const sort = record(response.sort);
  return {
    items: (response.items ?? []).map(mapper),
    page,
    size,
    totalItems,
    totalPages: numberValue(response, 'totalPages') || Math.ceil(totalItems / size),
    sort: { field: stringValue(sort, 'field') || 'createdAt', direction: stringValue(sort, 'direction').toLowerCase() === 'asc' ? 'asc' : 'desc' }
  };
}

export function toClientAccountPage(response: ApiPageDto): ClientAccountPage { return toPage(response, toClientAccount); }

function toPurchaseRequestLine(value: ApiRecord): PurchaseRequestLine {
  const price = record(value['unitPrice']);
  return {
    id: stringValue(value, 'purchaseRequestLineId', 'lineId', 'id'),
    catalogItemId: stringValue(value, 'catalogItemId'),
    itemName: stringValue(value, 'itemName', 'catalogItemName'),
    presentation: stringValue(value, 'presentation', 'presentationSnapshot'),
    quantity: numberValue(value, 'quantity'),
    unit: stringValue(value, 'unit'),
    unitPriceAmount: Object.keys(price).length ? numberValue(price, 'amount') : nullableNumber(value, 'unitPriceAmount'),
    unitPriceCurrency: Object.keys(price).length ? nullableString(price, 'currency') : nullableString(value, 'unitPriceCurrency'),
    notes: nullableString(value, 'notes')
  };
}

const nullableNumber = (value: ApiRecord, ...keys: string[]): number | null => {
  const number = numberValue(value, ...keys);
  return number === 0 && !keys.some((key) => typeof value[key] === 'number' || typeof value[key] === 'string') ? null : number;
};

export function toPurchaseRequest(value: ApiRecord): PurchaseRequest {
  const status = stringValue(value, 'status') as PurchaseRequestStatus;
  return {
    id: stringValue(value, 'purchaseRequestId', 'id'),
    code: stringValue(value, 'requestNumber', 'purchaseRequestNumber', 'code'),
    clientAccountId: stringValue(value, 'clientAccountId'),
    buyerMembershipId: stringValue(value, 'buyerMembershipId'),
    status,
    priority: stringValue(value, 'priority') as PurchaseRequest['priority'],
    requestedDeliveryDate: nullableString(value, 'requestedDeliveryDate'),
    lineCount: numberValue(value, 'lineCount') || (Array.isArray(value['lines']) ? value['lines'].length : 0),
    deliveryProfileSnapshot: nullableString(value, 'deliveryProfileSnapshot'),
    paymentOption: (nullableString(value, 'paymentOption') as PaymentOption | null),
    comment: nullableString(value, 'comment'),
    reviewNote: nullableString(value, 'reviewNote'),
    lines: Array.isArray(value['lines']) ? value['lines'].map((line) => toPurchaseRequestLine(record(line))) : [],
    version: numberValue(value, 'version')
  };
}

export function toPurchaseRequestPage(response: ApiPageDto): PurchaseRequestPage { return toPage(response, toPurchaseRequest); }

export function toPurchaseRequestEvent(value: ApiRecord): PurchaseRequestEvent {
  return {
    id: stringValue(value, 'eventId', 'id'),
    type: stringValue(value, 'eventType', 'type'),
    occurredAt: stringValue(value, 'occurredAt', 'createdAt'),
    actorDisplayName: nullableString(value, 'actorDisplayName', 'actorName'),
    note: nullableString(value, 'note', 'reviewNote'),
    status: (nullableString(value, 'status') as PurchaseRequestStatus | null)
  };
}

function toSalesOrderLine(value: ApiRecord): SalesOrderLine {
  const price = record(value['unitPrice']);
  return {
    id: stringValue(value, 'salesOrderLineId', 'lineId', 'id'),
    catalogItemId: stringValue(value, 'catalogItemId'),
    itemName: stringValue(value, 'itemName', 'catalogItemName'),
    presentation: stringValue(value, 'presentation'),
    quantity: numberValue(value, 'quantity'),
    unit: stringValue(value, 'unit'),
    unitPriceAmount: Object.keys(price).length ? numberValue(price, 'amount') : numberValue(value, 'unitPriceAmount'),
    unitPriceCurrency: Object.keys(price).length ? stringValue(price, 'currency') : stringValue(value, 'unitPriceCurrency'),
    lineTotalAmount: numberValue(value, 'lineTotalAmount', 'lineSubtotal', 'totalAmount')
  };
}

export function toSalesOrder(value: ApiRecord): SalesOrder {
  return {
    id: stringValue(value, 'salesOrderId', 'id'),
    number: stringValue(value, 'salesOrderNumber', 'number'),
    purchaseRequestId: stringValue(value, 'purchaseRequestId', 'sourcePurchaseRequestId'),
    clientAccountId: stringValue(value, 'clientAccountId'),
    createdByMembershipId: stringValue(value, 'createdByMembershipId'),
    buyerMembershipId: stringValue(value, 'buyerMembershipId'),
    clientAccountName: nestedString(value, 'clientAccount', 'commercialName', 'businessName', 'name') || stringValue(value, 'clientAccountName'),
    priority: stringValue(value, 'priority') as SalesOrder['priority'],
    requestedDeliveryDate: nullableString(value, 'requestedDeliveryDate'),
    deliverySnapshot: nullableString(value, 'deliverySnapshot'),
    paymentOption: nullableString(value, 'paymentOption'),
    notes: nullableString(value, 'notes'),
    currency: stringValue(value, 'currency'),
    total: numberValue(value, 'total', 'totalAmount'),
    status: stringValue(value, 'status') as SalesOrderStatus,
    tenantId: stringValue(value, 'tenantId'),
    workspaceId: stringValue(value, 'workspaceId'),
    lines: Array.isArray(value['lines']) ? value['lines'].map((line) => toSalesOrderLine(record(line))) : [],
    version: numberValue(value, 'version'),
    createdAt: stringValue(value, 'createdAt'),
    updatedAt: stringValue(value, 'updatedAt'),
    confirmedAt: nullableString(value, 'confirmedAt'),
    rejectedAt: nullableString(value, 'rejectedAt'),
    cancelledAt: nullableString(value, 'cancelledAt')
  };
}

export function toSalesOrderPage(response: ApiPageDto): SalesOrderPage { return toPage(response, toSalesOrder); }

export function toSalesOrderEvent(value: ApiRecord): SalesOrderEvent {
  return {
    id: stringValue(value, 'eventId', 'id'),
    type: stringValue(value, 'eventType', 'type'),
    occurredAt: stringValue(value, 'occurredAt', 'createdAt'),
    actorDisplayName: nullableString(value, 'actorDisplayName', 'actorName'),
    note: nullableString(value, 'note', 'reason'),
    status: nullableString(value, 'status') as SalesOrderStatus | null
  };
}

export function toFulfillmentCandidate(value: ApiRecord): FulfillmentCandidate {
  return {
    salesOrderId: stringValue(value, 'salesOrderId', 'orderId'),
    salesOrderNumber: stringValue(value, 'salesOrderNumber', 'orderNumber'),
    clientAccountId: stringValue(value, 'clientAccountId'),
    clientAccountName: stringValue(value, 'clientAccountName'),
    status: 'AWAITING_INVENTORY_RESERVATION',
    warehouseId: nullableString(value, 'warehouseId'),
    logisticsEligibleAt: nullableString(value, 'logisticsEligibleAt', 'eligibleAt')
  };
}
