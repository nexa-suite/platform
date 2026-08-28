import { inject, Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { PLATFORM_RUNTIME_CONFIG } from '../../../core/security/runtime-config';
import {
  ManualOrderClient,
  ManualOrderDelivery,
  ManualOrderDraft,
  ManualOrderLine,
  ManualOrderLineCommand,
  ManualOrderReview,
  ManualOrderClientCommand,
  ManualOrderDeliveryCommand
} from '../../domain/manual-orders/manual-order.models';
import {
  CreateManualSalesOrderCommand,
  CreatePurchaseRequestCommand,
  DEFAULT_PURCHASE_REQUEST_FILTERS,
  PaymentOption,
  PurchaseRequest,
  PurchaseRequestAction,
  PurchaseRequestEvent,
  PurchaseRequestFilters,
  PurchaseRequestLine,
  PurchaseRequestLineCommand,
  PurchaseRequestPage,
  PurchaseRequestPriority,
  UpdatePurchaseRequestCommand,
  UpdatePurchaseRequestLineCommand
} from '../../domain/purchase-requests/purchase-request.models';
import {
  DEFAULT_SALES_ORDER_FILTERS,
  FulfillmentCandidate,
  SalesOrder,
  SalesOrderEvent,
  SalesOrderFilters,
  SalesOrderLine,
  SalesOrderPage
} from '../../domain/sales-orders/sales-order.models';
import { SalesCommitmentApiPort } from '../../domain/ports/sales-commitment-api.port';
import { MockSalesCatalogReference, MOCK_SALES_FIXTURES } from './mock-sales.fixtures';

const DEMO_TIMESTAMP = '2026-01-15T10:00:00Z';
const DEMO_UPDATED_TIMESTAMP = '2026-01-15T12:00:00Z';

/** BC-04 demo adapter. All state is local, deterministic and non-HTTP. */
@Injectable({ providedIn: 'root' })
export class MockSalesCommitmentApiService implements SalesCommitmentApiPort {
  private readonly config = inject(PLATFORM_RUNTIME_CONFIG);
  private readonly data = this.fixture();
  private readonly purchaseRequestStore = new Map<string, PurchaseRequest>(this.data.purchaseRequests.map((request) => [request.id, request]));
  private readonly salesOrderStore = new Map<string, SalesOrder>(this.data.salesOrders.map((order) => [order.id, order]));
  private readonly drafts = new Map<string, ManualOrderDraft>();
  private readonly purchaseRequestEventStore = new Map<string, PurchaseRequestEvent[]>(Object.entries(this.data.purchaseRequestEvents).map(([id, events]) => [id, [...events]]));
  private readonly salesOrderEventStore = new Map<string, SalesOrderEvent[]>(Object.entries(this.data.salesOrderEvents).map(([id, events]) => [id, [...events]]));
  private nextDraftSequence = 1;
  private nextPurchaseRequestSequence = this.purchaseRequestStore.size + 1;
  private nextSalesOrderSequence = this.salesOrderStore.size + 1;

  createManualSalesOrder(command: CreateManualSalesOrderCommand): Observable<SalesOrder> {
    return this.operation(() => {
      const client = this.client(command.clientAccountId);
      const lines = this.manualLines(command.lines.map((line) => ({ ...line, notes: line.notes ?? null })));
      const created = this.buildSalesOrder({
        purchaseRequestId: `mock-${this.config.tenantProfile}-manual-request-${this.nextSalesOrderSequence}`,
        client,
        requestedDeliveryDate: command.requestedDeliveryDate,
        delivery: command.addressId ? this.delivery(command.addressId, command.deliveryNotes, command.routeProvider) : null,
        paymentOption: command.paymentOption,
        priority: command.priority,
        currency: command.currency,
        notes: command.notes,
        lines: this.salesLines(lines)
      });
      this.storeSalesOrder(created);
      return created;
    });
  }

  createManualSalesOrderDraft(): Observable<ManualOrderDraft> {
    return this.operation(() => {
      const id = `mock-${this.config.tenantProfile}-manual-draft-${String(this.nextDraftSequence++).padStart(3, '0')}`;
      const draft: ManualOrderDraft = {
        id,
        status: 'DRAFT',
        version: 0,
        client: null,
        requestedDeliveryDate: null,
        priority: 'NORMAL',
        paymentPreference: null,
        currency: 'PEN',
        notes: null,
        creditResult: null,
        lines: [],
        delivery: null,
        readyToCreate: false,
        salesOrderId: null,
        createdAt: DEMO_TIMESTAMP,
        updatedAt: DEMO_TIMESTAMP,
        submittedAt: null
      };
      this.drafts.set(id, draft);
      return draft;
    });
  }

  manualSalesOrderDraft(id: string): Observable<ManualOrderDraft> {
    return this.operation(() => this.require(this.drafts.get(id), 'MOCK_MANUAL_ORDER_DRAFT_NOT_FOUND'));
  }

  updateManualSalesOrderDraftClient(id: string, version: number, command: ManualOrderClientCommand): Observable<ManualOrderDraft> {
    return this.operation(() => {
      const current = this.requireDraft(id, version);
      const updated = this.saveDraft(current, {
        status: 'CLIENT_COMPLETE',
        client: this.client(command.clientAccountId),
        requestedDeliveryDate: command.requestedDeliveryDate,
        priority: this.priority(command.priority),
        paymentPreference: command.paymentPreference.trim() || null,
        currency: command.currency.trim().toUpperCase() || 'PEN',
        notes: command.notes?.trim() || null
      });
      return updated;
    });
  }

  replaceManualSalesOrderDraftItems(id: string, version: number, lines: readonly ManualOrderLineCommand[]): Observable<ManualOrderDraft> {
    return this.operation(() => {
      const current = this.requireDraft(id, version);
      const normalizedLines = this.manualLines(lines);
      return this.saveDraft(current, {
        status: normalizedLines.length ? 'ITEMS_COMPLETE' : current.client ? 'CLIENT_COMPLETE' : 'DRAFT',
        lines: normalizedLines
      });
    });
  }

  updateManualSalesOrderDraftDelivery(id: string, version: number, command: ManualOrderDeliveryCommand): Observable<ManualOrderDraft> {
    return this.operation(() => {
      const current = this.requireDraft(id, version);
      return this.saveDraft(current, {
        status: 'DELIVERY_COMPLETE',
        delivery: this.delivery(command.addressId, command.deliveryNotes, command.routeProvider)
      });
    });
  }

  reviewManualSalesOrderDraft(id: string): Observable<ManualOrderReview> {
    return this.operation(() => {
      const draft = this.require(this.drafts.get(id), 'MOCK_MANUAL_ORDER_DRAFT_NOT_FOUND');
      const clientComplete = draft.client !== null && Boolean(draft.requestedDeliveryDate);
      const itemsComplete = draft.lines.length > 0;
      const deliveryComplete = draft.delivery !== null;
      const readyToCreate = clientComplete && itemsComplete && deliveryComplete && draft.status !== 'ABANDONED' && draft.status !== 'CREATED';
      const missing = [
        ...(clientComplete ? [] : ['client']),
        ...(itemsComplete ? [] : ['items']),
        ...(deliveryComplete ? [] : ['delivery'])
      ];
      return { draft: { ...draft, readyToCreate }, clientComplete, itemsComplete, deliveryComplete, readyToCreate, missing };
    });
  }

  submitManualSalesOrderDraft(id: string, version: number): Observable<SalesOrder> {
    return this.operation(() => {
      const draft = this.requireDraft(id, version);
      const review = this.reviewValue(draft);
      if (!review.readyToCreate || !draft.client || !draft.delivery) throw new Error('MOCK_MANUAL_ORDER_NOT_READY');
      const created = this.buildSalesOrder({
        purchaseRequestId: `mock-${this.config.tenantProfile}-${draft.id}`,
        client: draft.client,
        requestedDeliveryDate: draft.requestedDeliveryDate,
        delivery: draft.delivery,
        paymentOption: draft.paymentPreference,
        priority: draft.priority,
        currency: draft.currency,
        notes: draft.notes,
        lines: this.salesLines(draft.lines)
      });
      this.storeSalesOrder(created);
      this.saveDraft(draft, { status: 'CREATED', salesOrderId: created.id, submittedAt: DEMO_UPDATED_TIMESTAMP });
      return created;
    });
  }

  abandonManualSalesOrderDraft(id: string, version: number): Observable<ManualOrderDraft> {
    return this.operation(() => this.saveDraft(this.requireDraft(id, version), { status: 'ABANDONED' }));
  }

  createPurchaseRequest(command: CreatePurchaseRequestCommand): Observable<PurchaseRequest> {
    return this.operation(() => {
      const client = this.client(command.clientAccountId ?? this.data.client.id);
      const id = `mock-${this.config.tenantProfile}-purchase-request-${String(this.nextPurchaseRequestSequence++).padStart(3, '0')}`;
      const lines = command.lines.map((line, index) => this.purchaseLine(line, `${id}-line-${index + 1}`));
      const request: PurchaseRequest = {
        id,
        code: `${this.codePrefix()}-${String(this.nextPurchaseRequestSequence - 1).padStart(3, '0')}`,
        clientAccountId: client.id,
        buyerMembershipId: `mock-${this.config.tenantProfile}-buyer-001`,
        status: 'DRAFT',
        priority: this.priority(command.priority),
        requestedDeliveryDate: command.requestedDeliveryDate ?? null,
        lineCount: lines.length,
        deliveryProfileSnapshot: command.deliveryProfileSnapshot ?? null,
        paymentOption: this.paymentOption(command.paymentOption),
        comment: command.comment ?? null,
        reviewNote: null,
        lines,
        version: 0
      };
      this.purchaseRequestStore.set(id, request);
      this.appendPurchaseRequestEvent(request, 'CREATED', null);
      return request;
    });
  }

  updatePurchaseRequest(id: string, version: number, command: UpdatePurchaseRequestCommand): Observable<PurchaseRequest> {
    return this.operation(() => {
      const current = this.requirePurchaseRequest(id, version);
      const updated: PurchaseRequest = {
        ...current,
        priority: command.priority == null ? current.priority : this.priority(command.priority),
        requestedDeliveryDate: command.requestedDeliveryDate === undefined ? current.requestedDeliveryDate : command.requestedDeliveryDate,
        deliveryProfileSnapshot: command.deliveryProfileSnapshot === undefined ? current.deliveryProfileSnapshot : command.deliveryProfileSnapshot,
        paymentOption: command.paymentOption === undefined ? current.paymentOption : this.paymentOption(command.paymentOption),
        comment: command.comment === undefined ? current.comment : command.comment,
        version: current.version + 1
      };
      this.purchaseRequestStore.set(id, updated);
      return updated;
    });
  }

  addPurchaseRequestLine(id: string, version: number, command: PurchaseRequestLineCommand): Observable<PurchaseRequest> {
    return this.operation(() => {
      const current = this.requirePurchaseRequest(id, version);
      const line = this.purchaseLine(command, `${id}-line-${current.lines.length + 1}`);
      const updated = this.savePurchaseRequest(current, { lines: [...current.lines, line], lineCount: current.lineCount + 1 });
      return updated;
    });
  }

  updatePurchaseRequestLine(id: string, lineId: string, version: number, command: UpdatePurchaseRequestLineCommand): Observable<PurchaseRequest> {
    return this.operation(() => {
      const current = this.requirePurchaseRequest(id, version);
      if (!current.lines.some((line) => line.id === lineId)) throw new Error('MOCK_PURCHASE_REQUEST_LINE_NOT_FOUND');
      const lines = current.lines.map((line) => line.id === lineId ? { ...line, quantity: command.quantity, notes: command.notes ?? null } : line);
      return this.savePurchaseRequest(current, { lines });
    });
  }

  deletePurchaseRequestLine(id: string, lineId: string, version: number): Observable<PurchaseRequest> {
    return this.operation(() => {
      const current = this.requirePurchaseRequest(id, version);
      const lines = current.lines.filter((line) => line.id !== lineId);
      if (lines.length === current.lines.length) throw new Error('MOCK_PURCHASE_REQUEST_LINE_NOT_FOUND');
      return this.savePurchaseRequest(current, { lines, lineCount: lines.length });
    });
  }

  submitPurchaseRequest(id: string, version: number): Observable<PurchaseRequest> {
    return this.operation(() => {
      const current = this.requirePurchaseRequest(id, version);
      const updated = this.savePurchaseRequest(current, { status: 'SUBMITTED' });
      this.appendPurchaseRequestEvent(updated, 'SUBMITTED', null);
      return updated;
    });
  }

  purchaseRequests(filters: PurchaseRequestFilters = DEFAULT_PURCHASE_REQUEST_FILTERS): Observable<PurchaseRequestPage> {
    return this.operation(() => {
      const query = filters.q.trim().toLowerCase();
      const items = [...this.purchaseRequestStore.values()]
        .filter((request) => !filters.status || request.status === filters.status)
        .filter((request) => !filters.priority || request.priority === filters.priority)
        .filter((request) => !filters.clientAccountId || request.clientAccountId === filters.clientAccountId)
        .filter((request) => !query || [request.id, request.code, request.clientAccountId].some((value) => value.toLowerCase().includes(query)))
        .sort((left, right) => this.compareRequests(left, right, filters.direction));
      return this.page(items, filters.page, filters.size, filters.sort, filters.direction);
    });
  }

  purchaseRequest(id: string): Observable<PurchaseRequest> {
    return this.operation(() => this.require(this.purchaseRequestStore.get(id), 'MOCK_PURCHASE_REQUEST_NOT_FOUND'));
  }

  purchaseRequestEvents(id: string): Observable<readonly PurchaseRequestEvent[]> {
    return this.operation(() => [...(this.purchaseRequestEventStore.get(id) ?? [])]);
  }

  transitionPurchaseRequest(id: string, version: number, action: PurchaseRequestAction, note?: string): Observable<PurchaseRequest> {
    return this.operation(() => {
      const current = this.requirePurchaseRequest(id, version);
      const status: Record<PurchaseRequestAction, PurchaseRequest['status']> = {
        reviews: 'IN_REVIEW',
        'adjustment-requests': 'NEEDS_ADJUSTMENT',
        approvals: 'APPROVED',
        rejections: 'REJECTED'
      };
      const updated = this.savePurchaseRequest(current, { status: status[action], reviewNote: note?.trim() || current.reviewNote });
      this.appendPurchaseRequestEvent(updated, action.toUpperCase(), note?.trim() || null);
      return updated;
    });
  }

  transition(id: string, version: number, action: PurchaseRequestAction, note = ''): Observable<PurchaseRequest> {
    return this.transitionPurchaseRequest(id, version, action, note);
  }

  convertPurchaseRequestToOrder(purchaseRequestId: string, version: number, _idempotencyKey: string, note?: string): Observable<SalesOrder> {
    return this.operation(() => {
      const request = this.requirePurchaseRequest(purchaseRequestId, version);
      const created = this.buildSalesOrder({
        purchaseRequestId: request.id,
        client: this.client(request.clientAccountId),
        requestedDeliveryDate: request.requestedDeliveryDate,
        delivery: null,
        paymentOption: request.paymentOption,
        priority: request.priority,
        currency: request.lines[0]?.unitPriceCurrency ?? 'PEN',
        notes: note?.trim() || request.comment,
        lines: this.salesLinesFromPurchase(request.lines)
      });
      this.storeSalesOrder(created);
      const updated = this.savePurchaseRequest(request, { status: 'CONVERTED_TO_ORDER', reviewNote: note?.trim() || request.reviewNote });
      this.appendPurchaseRequestEvent(updated, 'ORDER_CONVERTED', note?.trim() || null);
      return created;
    });
  }

  salesOrders(filters: SalesOrderFilters = DEFAULT_SALES_ORDER_FILTERS): Observable<SalesOrderPage> {
    return this.operation(() => {
      const query = filters.q.trim().toLowerCase();
      const items = [...this.salesOrderStore.values()]
        .filter((order) => !filters.status || order.status === filters.status)
        .filter((order) => !filters.clientAccountId || order.clientAccountId === filters.clientAccountId)
        .filter((order) => !filters.purchaseRequestId || order.purchaseRequestId === filters.purchaseRequestId)
        .filter((order) => !query || [order.id, order.number, order.clientAccountName].some((value) => value.toLowerCase().includes(query)))
        .sort((left, right) => this.compareOrders(left, right, filters.sort, filters.direction));
      return this.page(items, filters.page, filters.size, filters.sort, filters.direction);
    });
  }

  salesOrder(id: string): Observable<SalesOrder> {
    return this.operation(() => this.require(this.salesOrderStore.get(id), 'MOCK_SALES_ORDER_NOT_FOUND'));
  }

  confirmSalesOrder(id: string, version: number): Observable<SalesOrder> {
    return this.updateSalesOrder(id, version, { status: 'CONFIRMED', confirmedAt: DEMO_UPDATED_TIMESTAMP, rejectedAt: null, cancelledAt: null }, 'CONFIRMED', null);
  }

  rejectSalesOrder(id: string, version: number, reason: string): Observable<SalesOrder> {
    return this.updateSalesOrder(id, version, { status: 'REJECTED', rejectedAt: DEMO_UPDATED_TIMESTAMP, confirmedAt: null, cancelledAt: null }, 'REJECTED', reason.trim() || null);
  }

  cancelSalesOrder(id: string, version: number, reason = ''): Observable<SalesOrder> {
    return this.updateSalesOrder(id, version, { status: 'CANCELLED', cancelledAt: DEMO_UPDATED_TIMESTAMP, confirmedAt: null, rejectedAt: null }, 'CANCELLED', reason.trim() || null);
  }

  salesOrderEvents(id: string): Observable<readonly SalesOrderEvent[]> {
    return this.operation(() => [...(this.salesOrderEventStore.get(id) ?? [])]);
  }

  fulfillmentCandidates(): Observable<readonly FulfillmentCandidate[]> {
    return this.operation(() => [...this.salesOrderStore.values()]
      .filter((order) => order.status === 'CONFIRMED')
      .map((order) => this.data.fulfillmentCandidates.find((candidate) => candidate.salesOrderId === order.id) ?? {
        salesOrderId: order.id,
        salesOrderNumber: order.number,
        clientAccountId: order.clientAccountId,
        clientAccountName: order.clientAccountName,
        status: 'AWAITING_INVENTORY_RESERVATION' as const,
        warehouseId: `mock-${this.config.tenantProfile}-warehouse-001`,
        logisticsEligibleAt: DEMO_UPDATED_TIMESTAMP
      }));
  }

  private fixture() {
    return MOCK_SALES_FIXTURES[this.config.tenantProfile];
  }

  private operation<T>(work: () => T): Observable<T> {
    try {
      return of(work());
    } catch (error) {
      return throwError(() => error);
    }
  }

  private require<T>(value: T | undefined, message: string): T {
    if (value === undefined) throw new Error(message);
    return value;
  }

  private client(id: string): ManualOrderClient {
    return this.require(this.data.clients.find((candidate) => candidate.id === id), 'MOCK_CLIENT_ACCOUNT_NOT_FOUND');
  }

  private catalogItem(id: string): MockSalesCatalogReference {
    const normalized = id.trim();
    return this.require(this.data.catalog.find((item) => item.id === normalized || item.skuCode === normalized), 'MOCK_CATALOG_ITEM_NOT_FOUND');
  }

  private manualLines(lines: readonly ManualOrderLineCommand[]): readonly ManualOrderLine[] {
    return lines.map((command, index) => {
      if (command.quantity <= 0) throw new Error('MOCK_LINE_QUANTITY_INVALID');
      const item = this.catalogItem(command.catalogItemId?.trim() || command.skuId?.trim() || '');
      return {
        id: `${item.id}-draft-line-${index + 1}`,
        skuId: item.id.replace('-catalog-', '-sku-'),
        catalogItemId: item.id,
        productFamily: item.productFamily,
        familyCode: item.familyCode,
        skuCode: item.skuCode,
        presentation: item.presentation,
        unit: command.unit.trim() || item.unit,
        quantity: command.quantity,
        baseUnitPrice: item.price,
        effectiveUnitPrice: item.price,
        discountAmount: 0,
        currency: item.currency,
        availabilityStatus: item.availabilityStatus,
        notes: command.notes?.trim() || null
      };
    });
  }

  private purchaseLine(command: PurchaseRequestLineCommand, id: string): PurchaseRequestLine {
    if (command.quantity <= 0) throw new Error('MOCK_LINE_QUANTITY_INVALID');
    const item = this.catalogItem(command.catalogItemId);
    return {
      id,
      catalogItemId: item.id,
      itemName: item.name,
      presentation: item.presentation,
      quantity: command.quantity,
      unit: command.unit.trim() || item.unit,
      unitPriceAmount: item.price,
      unitPriceCurrency: item.currency,
      notes: command.notes?.trim() || null
    };
  }

  private salesLines(lines: readonly ManualOrderLine[]): readonly SalesOrderLine[] {
    return lines.map((line) => ({
      id: `${line.id}-sales`,
      catalogItemId: line.catalogItemId,
      itemName: line.productFamily,
      presentation: line.presentation,
      quantity: line.quantity,
      unit: line.unit,
      unitPriceAmount: line.effectiveUnitPrice,
      unitPriceCurrency: line.currency,
      lineTotalAmount: line.effectiveUnitPrice * line.quantity
    }));
  }

  private salesLinesFromPurchase(lines: readonly PurchaseRequestLine[]): readonly SalesOrderLine[] {
    return lines.map((line) => ({
      id: `${line.id}-sales`,
      catalogItemId: line.catalogItemId,
      itemName: line.itemName,
      presentation: line.presentation,
      quantity: line.quantity,
      unit: line.unit,
      unitPriceAmount: line.unitPriceAmount ?? 0,
      unitPriceCurrency: line.unitPriceCurrency ?? 'PEN',
      lineTotalAmount: (line.unitPriceAmount ?? 0) * line.quantity
    }));
  }

  private delivery(addressId: string, deliveryNotes: string | null, routeProvider: string | null): ManualOrderDelivery {
    const address = this.data.addresses.find((candidate) => candidate.id === addressId);
    return {
      addressId,
      addressSnapshot: address?.addressSnapshot ?? JSON.stringify({ addressId }),
      routeSnapshot: JSON.stringify({
        distanceKm: 8.4,
        durationSeconds: 1800,
        originLatitude: -12.0464,
        originLongitude: -77.0428,
        destinationLatitude: -11.9881,
        destinationLongitude: -77.0818,
      }),
      warehouseSnapshot: JSON.stringify({ name: 'Nexa Demo Cold Warehouse', address: 'Av. Argentina 3093, Callao, Lima, Peru' }),
      warehouseId: `mock-${this.config.tenantProfile}-warehouse-001`,
      routeProvider: routeProvider?.trim() || 'LOCAL_ESTIMATE',
      deliveryNotes: deliveryNotes?.trim() || null
    };
  }

  private buildSalesOrder(input: {
    readonly purchaseRequestId: string;
    readonly client: ManualOrderClient;
    readonly requestedDeliveryDate: string | null;
    readonly delivery: ManualOrderDelivery | null;
    readonly paymentOption: string | null;
    readonly priority: string;
    readonly currency: string;
    readonly notes: string | null;
    readonly lines: readonly SalesOrderLine[];
  }): SalesOrder {
    const sequence = this.nextSalesOrderSequence++;
    const prefix = this.config.tenantProfile === 'icisa' ? 'SO-ICISA' : 'SO-GEN';
    return {
      id: `mock-${this.config.tenantProfile}-sales-order-${String(sequence).padStart(3, '0')}`,
      number: `${prefix}-${String(sequence).padStart(3, '0')}`,
      purchaseRequestId: input.purchaseRequestId,
      clientAccountId: input.client.id,
      createdByMembershipId: `mock-${this.config.tenantProfile}-membership`,
      buyerMembershipId: `mock-${this.config.tenantProfile}-buyer-001`,
      clientAccountName: input.client.businessName,
      priority: this.priority(input.priority),
      requestedDeliveryDate: input.requestedDeliveryDate,
      deliverySnapshot: input.delivery?.addressSnapshot ?? null,
      paymentOption: input.paymentOption?.trim() || null,
      notes: input.notes?.trim() || null,
      currency: input.currency.trim().toUpperCase() || 'PEN',
      total: input.lines.reduce((total, line) => total + line.lineTotalAmount, 0),
      status: 'PENDING',
      tenantId: `mock-${this.config.tenantProfile}-tenant`,
      workspaceId: `mock-${this.config.tenantProfile}-workspace`,
      lines: input.lines,
      version: 0,
      createdAt: DEMO_TIMESTAMP,
      updatedAt: DEMO_TIMESTAMP,
      confirmedAt: null,
      rejectedAt: null,
      cancelledAt: null
    };
  }

  private storeSalesOrder(order: SalesOrder): void {
    this.salesOrderStore.set(order.id, order);
    this.salesOrderEventStore.set(order.id, [{ id: `${order.id}-event-1`, type: 'CREATED', occurredAt: order.createdAt, actorDisplayName: 'Demo Sales', note: null, status: order.status }]);
  }

  private requireDraft(id: string, version: number): ManualOrderDraft {
    const draft = this.require(this.drafts.get(id), 'MOCK_MANUAL_ORDER_DRAFT_NOT_FOUND');
    if (draft.version !== version) throw new Error('MOCK_CONCURRENCY_CONFLICT');
    return draft;
  }

  private saveDraft(draft: ManualOrderDraft, changes: Partial<ManualOrderDraft>): ManualOrderDraft {
    const next = {
      ...draft,
      ...changes,
      version: draft.version + 1,
      updatedAt: DEMO_UPDATED_TIMESTAMP
    };
    const updated: ManualOrderDraft = {
      ...next,
      readyToCreate: next.status !== 'CREATED' && next.status !== 'ABANDONED' && this.isDraftComplete(next)
    };
    this.drafts.set(updated.id, updated);
    return updated;
  }

  private isDraftComplete(draft: ManualOrderDraft): boolean {
    return draft.client !== null && Boolean(draft.requestedDeliveryDate) && draft.lines.length > 0 && draft.delivery !== null;
  }

  private reviewValue(draft: ManualOrderDraft): ManualOrderReview {
    const clientComplete = draft.client !== null && Boolean(draft.requestedDeliveryDate);
    const itemsComplete = draft.lines.length > 0;
    const deliveryComplete = draft.delivery !== null;
    const readyToCreate = clientComplete && itemsComplete && deliveryComplete && draft.status !== 'ABANDONED' && draft.status !== 'CREATED';
    return { draft, clientComplete, itemsComplete, deliveryComplete, readyToCreate, missing: [] };
  }

  private requirePurchaseRequest(id: string, version: number): PurchaseRequest {
    const request = this.require(this.purchaseRequestStore.get(id), 'MOCK_PURCHASE_REQUEST_NOT_FOUND');
    if (request.version !== version) throw new Error('MOCK_CONCURRENCY_CONFLICT');
    return request;
  }

  private savePurchaseRequest(request: PurchaseRequest, changes: Partial<PurchaseRequest>): PurchaseRequest {
    const updated: PurchaseRequest = { ...request, ...changes, lineCount: changes.lines?.length ?? changes.lineCount ?? request.lineCount, version: request.version + 1 };
    this.purchaseRequestStore.set(updated.id, updated);
    return updated;
  }

  private appendPurchaseRequestEvent(request: PurchaseRequest, type: string, note: string | null): void {
    const events = this.purchaseRequestEventStore.get(request.id) ?? [];
    this.purchaseRequestEventStore.set(request.id, [...events, {
      id: `${request.id}-event-${events.length + 1}`,
      type,
      occurredAt: DEMO_UPDATED_TIMESTAMP,
      actorDisplayName: 'Demo Sales',
      note,
      status: request.status
    }]);
  }

  private updateSalesOrder(id: string, version: number, changes: Partial<SalesOrder>, type: string, note: string | null): Observable<SalesOrder> {
    return this.operation(() => {
      const current = this.require(this.salesOrderStore.get(id), 'MOCK_SALES_ORDER_NOT_FOUND');
      if (current.version !== version) throw new Error('MOCK_CONCURRENCY_CONFLICT');
      const updated: SalesOrder = { ...current, ...changes, version: current.version + 1, updatedAt: DEMO_UPDATED_TIMESTAMP };
      this.salesOrderStore.set(id, updated);
      const events = this.salesOrderEventStore.get(id) ?? [];
      this.salesOrderEventStore.set(id, [...events, {
        id: `${id}-event-${events.length + 1}`,
        type,
        occurredAt: DEMO_UPDATED_TIMESTAMP,
        actorDisplayName: 'Demo Sales',
        note,
        status: updated.status
      }]);
      return updated;
    });
  }

  private priority(value: string | null | undefined): PurchaseRequestPriority {
    return value === 'HIGH' || value === 'URGENT' ? value : 'NORMAL';
  }

  private paymentOption(value: string | null | undefined): PaymentOption | null {
    return value === 'CREDIT_LINE' || value === 'BANK_TRANSFER' || value === 'CASH' || value === 'CASH_ON_DELIVERY' ? value : null;
  }

  private codePrefix(): string {
    return this.config.tenantProfile === 'icisa' ? 'PR-ICISA' : 'PR-GEN';
  }

  private compareRequests(left: PurchaseRequest, right: PurchaseRequest, direction: PurchaseRequestFilters['direction']): number {
    const result = left.code.localeCompare(right.code);
    return direction === 'desc' ? -result : result;
  }

  private compareOrders(left: SalesOrder, right: SalesOrder, sort: SalesOrderFilters['sort'], direction: SalesOrderFilters['direction']): number {
    const leftValue = this.orderSortValue(left, sort);
    const rightValue = this.orderSortValue(right, sort);
    const result = String(leftValue).localeCompare(String(rightValue), undefined, { numeric: true });
    return direction === 'desc' ? -result : result;
  }

  private orderSortValue(order: SalesOrder, sort: SalesOrderFilters['sort']): string | number {
    switch (sort) {
      case 'orderNumber': return order.number;
      case 'priority': return order.priority;
      case 'total': return order.total;
      case 'requestedDeliveryDate': return order.requestedDeliveryDate ?? '';
      case 'updatedAt': return order.updatedAt;
      case 'createdAt': return order.createdAt;
    }
  }

  private page<T>(items: readonly T[], page: number, size: number, sort: string, direction: 'asc' | 'desc'): { items: readonly T[]; page: number; size: number; totalItems: number; totalPages: number; sort: { field: string; direction: 'asc' | 'desc' } } {
    const start = page * size;
    return {
      items: items.slice(start, start + size),
      page,
      size,
      totalItems: items.length,
      totalPages: items.length ? Math.ceil(items.length / size) : 0,
      sort: { field: sort, direction }
    };
  }
}
