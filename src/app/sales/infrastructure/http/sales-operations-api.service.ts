import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { platformApiUrl, PLATFORM_RUNTIME_CONFIG } from '../../../core/security/runtime-config';
import { ClientAccount, ClientAccountAddress, ClientAccountCreateCommand, ClientAccountFilters, ClientAccountPage, ClientAccountUpdateCommand, DEFAULT_CLIENT_ACCOUNT_FILTERS, PeruReferenceOption } from '../../client-accounts/domain/client-account.models';
import { DEFAULT_PURCHASE_REQUEST_FILTERS, PurchaseRequest, PurchaseRequestAction, PurchaseRequestEvent, PurchaseRequestFilters, PurchaseRequestPage } from '../../purchase-requests/domain/purchase-request.models';
import { DEFAULT_SALES_ORDER_FILTERS, FulfillmentCandidate, SalesOrder, SalesOrderEvent, SalesOrderFilters, SalesOrderPage } from '../../sales-orders/domain/sales-order.models';
import { ApiPageDto, ApiRecord, toClientAccount, toClientAccountPage, toFulfillmentCandidate, toPurchaseRequest, toPurchaseRequestEvent, toPurchaseRequestPage, toSalesOrder, toSalesOrderEvent, toSalesOrderPage } from './sales-operations-mappers';

@Injectable()
export class SalesOperationsApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(PLATFORM_RUNTIME_CONFIG);
  private readonly api = (path: string) => platformApiUrl(this.config, `/api/v1${path}`);

  clientAccounts(filters: ClientAccountFilters = DEFAULT_CLIENT_ACCOUNT_FILTERS): Observable<ClientAccountPage> {
    return this.http.get<ApiPageDto>(this.api('/client-accounts'), { params: this.params({
      search: filters.q, status: filters.status, page: filters.page, size: filters.size
    }) }).pipe(map(toClientAccountPage));
  }

  clientAccount(id: string): Observable<ClientAccount> {
    return this.http.get<ApiRecord>(this.api(`/client-accounts/${encodeURIComponent(id)}`)).pipe(map(toClientAccount));
  }

  createClientAccount(command: ClientAccountCreateCommand): Observable<ClientAccount> {
    return this.http.post<ApiRecord>(this.api('/client-accounts'), command).pipe(map(toClientAccount));
  }

  updateClientAccount(id: string, version: number, command: ClientAccountUpdateCommand): Observable<ClientAccount> {
    return this.http.patch<ApiRecord>(this.api(`/client-accounts/${encodeURIComponent(id)}`), command, { headers: this.ifMatch(version) }).pipe(map(toClientAccount));
  }

  changeClientAccountStatus(id: string, version: number, action: 'activations' | 'suspensions'): Observable<ClientAccount> {
    return this.http.post<ApiRecord>(this.api(`/client-accounts/${encodeURIComponent(id)}/${action}`), {}, { headers: this.ifMatch(version) }).pipe(map(toClientAccount));
  }

  associateBuyer(id: string, version: number, membershipId: string | null): Observable<ClientAccount> {
    return this.http.put<ApiRecord>(this.api(`/client-accounts/${encodeURIComponent(id)}/buyer-membership`), { membershipId }, { headers: this.ifMatch(version) }).pipe(map(toClientAccount));
  }

  clientAccountAddresses(id: string): Observable<readonly ClientAccountAddress[]> {
    return this.http.get<readonly ApiRecord[]>(this.api(`/client-accounts/${encodeURIComponent(id)}/addresses`)).pipe(map((items) => items.map((item) => this.toAddress(item))));
  }

  createClientAccountAddress(id: string, command: ClientAccountAddressCommand): Observable<ClientAccountAddress> {
    return this.http.post<ApiRecord>(this.api(`/client-accounts/${encodeURIComponent(id)}/addresses`), command, { observe: 'response' }).pipe(map((response) => this.toAddress(response.body ?? {}, response.headers.get('ETag'))));
  }

  updateClientAccountAddress(id: string, addressId: string, version: number, command: ClientAccountAddressUpdateCommand): Observable<ClientAccountAddress> {
    return this.http.patch<ApiRecord>(this.api(`/client-accounts/${encodeURIComponent(id)}/addresses/${encodeURIComponent(addressId)}`), command, { observe: 'response', headers: this.ifMatch(version) }).pipe(map((response) => this.toAddress(response.body ?? {}, response.headers.get('ETag'))));
  }

  setDefaultClientAccountAddress(id: string, addressId: string, version: number): Observable<ClientAccountAddress> {
    return this.http.put<ApiRecord>(this.api(`/client-accounts/${encodeURIComponent(id)}/addresses/${encodeURIComponent(addressId)}/default`), null, { observe: 'response', headers: this.ifMatch(version) }).pipe(map((response) => this.toAddress(response.body ?? {}, response.headers.get('ETag'))));
  }

  deactivateClientAccountAddress(id: string, addressId: string, version: number): Observable<ClientAccountAddress> {
    return this.http.delete<ApiRecord>(this.api(`/client-accounts/${encodeURIComponent(id)}/addresses/${encodeURIComponent(addressId)}`), { observe: 'response', headers: this.ifMatch(version) }).pipe(map((response) => this.toAddress(response.body ?? {}, response.headers.get('ETag'))));
  }

  reference(resource: 'departments' | 'provinces' | 'districts' | 'road-types', parentCode?: string): Observable<readonly PeruReferenceOption[]> {
    let params = new HttpParams();
    if (parentCode) params = params.set('parentCode', parentCode);
    return this.http.get<readonly ApiRecord[]>(this.api(`/reference/${resource}`), { params }).pipe(map((items) => items.map((item) => ({
      id: Number(item['id']) || 0, code: String(item['code'] ?? ''), label: String(item['label'] ?? ''), parentCode: item['parentCode'] ? String(item['parentCode']) : null, active: item['active'] !== false
    }))));
  }

  createManualSalesOrder(command: CreateManualSalesOrderCommand): Observable<SalesOrder> {
    return this.http.post<ApiRecord>(this.api('/sales-orders/manual'), command, { headers: this.idempotencyHeader() }).pipe(map(toSalesOrder));
  }

  createPurchaseRequest(command: CreatePurchaseRequestCommand): Observable<PurchaseRequest> {
    return this.http.post<ApiRecord>(this.api('/purchase-requests'), command, { headers: this.idempotencyHeader() }).pipe(map(toPurchaseRequest));
  }

  updatePurchaseRequest(id: string, version: number, command: UpdatePurchaseRequestCommand): Observable<PurchaseRequest> {
    return this.http.patch<ApiRecord>(this.api(`/purchase-requests/${encodeURIComponent(id)}`), command, { headers: this.ifMatch(version) }).pipe(map(toPurchaseRequest));
  }

  addPurchaseRequestLine(id: string, version: number, command: PurchaseRequestLineCommand): Observable<PurchaseRequest> {
    return this.http.post<ApiRecord>(this.api(`/purchase-requests/${encodeURIComponent(id)}/lines`), command, { headers: this.ifMatch(version) }).pipe(map(toPurchaseRequest));
  }

  updatePurchaseRequestLine(id: string, lineId: string, version: number, command: UpdatePurchaseRequestLineCommand): Observable<PurchaseRequest> {
    return this.http.patch<ApiRecord>(this.api(`/purchase-requests/${encodeURIComponent(id)}/lines/${encodeURIComponent(lineId)}`), command, { headers: this.ifMatch(version) }).pipe(map(toPurchaseRequest));
  }

  deletePurchaseRequestLine(id: string, lineId: string, version: number): Observable<PurchaseRequest> {
    return this.http.delete<ApiRecord>(this.api(`/purchase-requests/${encodeURIComponent(id)}/lines/${encodeURIComponent(lineId)}`), { headers: this.ifMatch(version) }).pipe(map(toPurchaseRequest));
  }

  submitPurchaseRequest(id: string, version: number): Observable<PurchaseRequest> {
    return this.http.post<ApiRecord>(this.api(`/purchase-requests/${encodeURIComponent(id)}/submissions`), null, { headers: this.ifMatch(version).set('Idempotency-Key', this.idempotencyKey()) }).pipe(map(toPurchaseRequest));
  }

  purchaseRequests(filters: PurchaseRequestFilters = DEFAULT_PURCHASE_REQUEST_FILTERS): Observable<PurchaseRequestPage> {
    return this.http.get<ApiPageDto>(this.api('/purchase-requests'), { params: this.params({
      status: filters.status, priority: filters.priority, search: filters.q, page: filters.page, size: filters.size,
      sort: filters.sort + ',' + filters.direction
    }) }).pipe(map(toPurchaseRequestPage));
  }

  purchaseRequest(id: string): Observable<PurchaseRequest> {
    return this.http.get<ApiRecord>(this.api(`/purchase-requests/${encodeURIComponent(id)}`)).pipe(map(toPurchaseRequest));
  }

  purchaseRequestEvents(id: string): Observable<readonly PurchaseRequestEvent[]> {
    return this.http.get<readonly ApiRecord[]>(this.api(`/purchase-requests/${encodeURIComponent(id)}/events`)).pipe(map((events) => events.map(toPurchaseRequestEvent)));
  }

  transitionPurchaseRequest(id: string, version: number, action: PurchaseRequestAction, note?: string): Observable<PurchaseRequest> {
    const body = note?.trim() ? { reviewNote: note.trim() } : {};
    return this.http.post<ApiRecord>(this.api(`/purchase-requests/${encodeURIComponent(id)}/${action}`), body, { headers: this.ifMatch(version) }).pipe(map(toPurchaseRequest));
  }

  transition(id: string, version: number, action: PurchaseRequestAction, note = ''): Observable<PurchaseRequest> {
    return this.transitionPurchaseRequest(id, version, action, note);
  }

  convertPurchaseRequestToOrder(purchaseRequestId: string, version: number, idempotencyKey: string, note?: string): Observable<SalesOrder> {
    const body = note?.trim() ? { note: note.trim() } : null;
    const headers = this.ifMatch(version).set('Idempotency-Key', idempotencyKey);
    return this.http.post<ApiRecord>(this.api(`/purchase-requests/${encodeURIComponent(purchaseRequestId)}/order-conversions`), body, { headers }).pipe(map(toSalesOrder));
  }

  salesOrders(filters: SalesOrderFilters = DEFAULT_SALES_ORDER_FILTERS): Observable<SalesOrderPage> {
    return this.http.get<ApiPageDto>(this.api('/sales-orders'), { params: this.params({
      status: filters.status, clientAccountId: filters.clientAccountId, search: filters.q, page: filters.page, size: filters.size,
      sort: filters.sort + ',' + filters.direction
    }) }).pipe(map(toSalesOrderPage));
  }

  salesOrder(id: string): Observable<SalesOrder> {
    return this.http.get<ApiRecord>(this.api(`/sales-orders/${encodeURIComponent(id)}`)).pipe(map(toSalesOrder));
  }

  confirmSalesOrder(id: string, version: number): Observable<SalesOrder> {
    return this.http.post<ApiRecord>(this.api(`/sales-orders/${encodeURIComponent(id)}/confirmations`), {}, { headers: this.ifMatch(version) }).pipe(map(toSalesOrder));
  }

  rejectSalesOrder(id: string, version: number, reason: string): Observable<SalesOrder> {
    return this.http.post<ApiRecord>(this.api(`/sales-orders/${encodeURIComponent(id)}/rejections`), { reason: reason.trim() }, { headers: this.ifMatch(version) }).pipe(map(toSalesOrder));
  }

  cancelSalesOrder(id: string, version: number, reason?: string): Observable<SalesOrder> {
    const body = reason?.trim() ? { reason: reason.trim() } : {};
    return this.http.post<ApiRecord>(this.api(`/sales-orders/${encodeURIComponent(id)}/cancellations`), body, { headers: this.ifMatch(version) }).pipe(map(toSalesOrder));
  }

  salesOrderEvents(id: string): Observable<readonly SalesOrderEvent[]> {
    return this.http.get<readonly ApiRecord[]>(this.api(`/sales-orders/${encodeURIComponent(id)}/events`)).pipe(map((events) => events.map(toSalesOrderEvent)));
  }

  fulfillmentCandidates(): Observable<readonly FulfillmentCandidate[]> {
    return this.http.get<ApiPageDto>(this.api('/order-fulfillment-candidates')).pipe(map((response) => (response.items ?? []).map(toFulfillmentCandidate)));
  }

  private params(values: Readonly<Record<string, string | number>>): HttpParams {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(values)) {
      if ((typeof value === 'string' || typeof value === 'number') && value !== '') params = params.set(key, value);
    }
    return params;
  }

  private ifMatch(version: number): HttpHeaders { return new HttpHeaders({ 'If-Match': `"${version}"` }); }
  private idempotencyHeader(): HttpHeaders { return new HttpHeaders({ 'Idempotency-Key': this.idempotencyKey() }); }
  private idempotencyKey(): string { return globalThis.crypto?.randomUUID?.() ?? `platform-${Date.now()}-${Math.random().toString(36).slice(2)}`; }

  private toAddress(value: ApiRecord, etag?: string | null): ClientAccountAddress {
    return {
      id: String(value['id'] ?? ''), clientAccountId: String(value['clientAccountId'] ?? ''), label: String(value['label'] ?? ''),
      addressType: String(value['addressType'] ?? 'STREET'), line: String(value['line'] ?? ''), reference: String(value['reference'] ?? ''),
      countryCode: String(value['countryCode'] ?? 'PE'), departmentCode: String(value['departmentCode'] ?? ''),
      provinceCode: String(value['provinceCode'] ?? ''), districtCode: String(value['districtCode'] ?? ''),
      defaultAddress: value['defaultAddress'] === true, active: value['active'] !== false, version: Number(value['version']) || 0,
      recipientName: value['recipientName'] ? String(value['recipientName']) : null, recipientPhone: value['recipientPhone'] ? String(value['recipientPhone']) : null,
      roadType: value['roadType'] ? String(value['roadType']) : null, streetName: value['streetName'] ? String(value['streetName']) : null,
      streetNumber: value['streetNumber'] ? String(value['streetNumber']) : null, interior: value['interior'] ? String(value['interior']) : null,
      postalCode: value['postalCode'] ? String(value['postalCode']) : null, receivingInstructions: value['receivingInstructions'] ? String(value['receivingInstructions']) : null,
      receivingHours: value['receivingHours'] ? String(value['receivingHours']) : null, latitude: value['latitude'] == null ? null : Number(value['latitude']), longitude: value['longitude'] == null ? null : Number(value['longitude']),
      placeId: value['placeId'] ? String(value['placeId']) : null, source: value['source'] ? String(value['source']) : null,
    };
  }
}

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

export interface ClientAccountAddressCommand {
  readonly label: string;
  readonly address: DeliveryAddressCommand;
  readonly defaultAddress?: boolean;
}

export type ClientAccountAddressUpdateCommand = Omit<ClientAccountAddressCommand, 'defaultAddress'>;

export interface DeliveryAddressCommand {
  readonly addressType: string;
  readonly line: string;
  readonly reference: string;
  readonly countryCode: 'PE';
  readonly departmentCode: string;
  readonly provinceCode: string;
  readonly districtCode: string;
  readonly recipientName?: string | null;
  readonly recipientPhone?: string | null;
  readonly roadType?: string | null;
  readonly streetName?: string | null;
  readonly streetNumber?: string | null;
  readonly interior?: string | null;
  readonly postalCode?: string | null;
  readonly receivingInstructions?: string | null;
  readonly receivingHours?: string | null;
  readonly latitude?: number | null;
  readonly longitude?: number | null;
  readonly placeId?: string | null;
  readonly source?: string | null;
}

export interface CreateManualSalesOrderCommand {
  readonly clientAccountId: string;
  readonly addressId: string | null;
  readonly manualAddress: DeliveryAddressCommand | null;
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
