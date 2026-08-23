import { PaymentOption, PurchaseRequest, PurchaseRequestEvent, PurchaseRequestLine, PurchaseRequestPage, PurchaseRequestStatus } from '../../purchase-requests/domain/purchase-request.models';
import { FulfillmentCandidate, SalesOrder, SalesOrderEvent, SalesOrderLine, SalesOrderPage, SalesOrderStatus } from '../../sales-orders/domain/sales-order.models';
import { ManualOrderClient, ManualOrderDraft, ManualOrderDelivery, ManualOrderLine, ManualOrderReview } from '../../manual-orders/domain/manual-order.models';

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

function toManualOrderClient(value: ApiRecord): ManualOrderClient {
  return {
    id: stringValue(value, 'id', 'clientAccountId'),
    code: stringValue(value, 'code', 'clientAccountCode'),
    businessName: stringValue(value, 'businessName', 'legalName'),
    commercialName: stringValue(value, 'commercialName', 'tradeName'),
    taxIdentifierType: stringValue(value, 'taxIdentifierType'),
    taxIdentifierValue: stringValue(value, 'taxIdentifierValue'),
    status: stringValue(value, 'status'),
    paymentTerms: stringValue(value, 'paymentTerms', 'paymentCondition'),
    creditLimit: numberValue(value, 'creditLimit'),
    currentExposure: numberValue(value, 'currentExposure', 'currentCommercialExposure'),
    availableCredit: numberValue(value, 'availableCredit')
  };
}

function toManualOrderLine(value: ApiRecord): ManualOrderLine {
  return {
    id: stringValue(value, 'id', 'lineId'),
    skuId: stringValue(value, 'skuId'),
    catalogItemId: stringValue(value, 'catalogItemId'),
    productFamily: stringValue(value, 'productFamily', 'productFamilyName'),
    familyCode: stringValue(value, 'familyCode', 'productFamilyCode'),
    skuCode: stringValue(value, 'skuCode'),
    presentation: stringValue(value, 'presentation'),
    unit: stringValue(value, 'unit'),
    quantity: numberValue(value, 'quantity'),
    baseUnitPrice: numberValue(value, 'baseUnitPrice', 'baseUnitPriceAmount'),
    effectiveUnitPrice: numberValue(value, 'effectiveUnitPrice', 'unitPriceAmount'),
    discountAmount: numberValue(value, 'discountAmount'),
    currency: stringValue(value, 'currency', 'unitPriceCurrency'),
    availabilityStatus: stringValue(value, 'availabilityStatus'),
    notes: nullableString(value, 'notes')
  };
}

function toManualOrderDelivery(value: ApiRecord): ManualOrderDelivery {
  return {
    addressId: nullableString(value, 'addressId'),
    addressSnapshot: nullableString(value, 'addressSnapshot'),
    routeSnapshot: nullableString(value, 'routeSnapshot'),
    warehouseSnapshot: nullableString(value, 'warehouseSnapshot'),
    warehouseId: nullableString(value, 'warehouseId'),
    routeProvider: nullableString(value, 'routeProvider'),
    deliveryNotes: nullableString(value, 'deliveryNotes')
  };
}

export function toManualOrderDraft(value: ApiRecord): ManualOrderDraft {
  return {
    id: stringValue(value, 'id', 'draftId'),
    status: stringValue(value, 'status') as ManualOrderDraft['status'],
    version: numberValue(value, 'version'),
    client: value['client'] ? toManualOrderClient(record(value['client'])) : null,
    requestedDeliveryDate: nullableString(value, 'requestedDeliveryDate'),
    priority: stringValue(value, 'priority'),
    paymentPreference: nullableString(value, 'paymentPreference'),
    currency: stringValue(value, 'currency'),
    notes: nullableString(value, 'notes'),
    creditResult: nullableString(value, 'creditResult'),
    lines: Array.isArray(value['lines']) ? value['lines'].map((line) => toManualOrderLine(record(line))) : [],
    delivery: value['delivery'] ? toManualOrderDelivery(record(value['delivery'])) : null,
    readyToCreate: value['readyToCreate'] === true,
    salesOrderId: nullableString(value, 'salesOrderId'),
    createdAt: stringValue(value, 'createdAt'),
    updatedAt: stringValue(value, 'updatedAt'),
    submittedAt: nullableString(value, 'submittedAt')
  };
}

export function toManualOrderReview(value: ApiRecord): ManualOrderReview {
  return {
    draft: toManualOrderDraft(record(value['draft'])),
    clientComplete: value['clientComplete'] === true,
    itemsComplete: value['itemsComplete'] === true,
    deliveryComplete: value['deliveryComplete'] === true,
    readyToCreate: value['readyToCreate'] === true,
    missing: Array.isArray(value['missing']) ? value['missing'].map((item) => String(item)) : []
  };
}
