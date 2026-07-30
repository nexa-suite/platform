import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { platformApiUrl, PLATFORM_RUNTIME_CONFIG } from '../../../core/security/runtime-config';
import { ClientAccount, ClientAccountCommand, ClientAccountFilters, ClientAccountPage, DEFAULT_CLIENT_ACCOUNT_FILTERS } from '../../client-accounts/domain/client-account.models';
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

  createClientAccount(command: ClientAccountCommand): Observable<ClientAccount> {
    return this.http.post<ApiRecord>(this.api('/client-accounts'), command).pipe(map(toClientAccount));
  }

  updateClientAccount(id: string, version: number, command: Partial<ClientAccountCommand>): Observable<ClientAccount> {
    return this.http.patch<ApiRecord>(this.api(`/client-accounts/${encodeURIComponent(id)}`), command, { headers: this.ifMatch(version) }).pipe(map(toClientAccount));
  }

  changeClientAccountStatus(id: string, version: number, action: 'activations' | 'suspensions'): Observable<ClientAccount> {
    return this.http.post<ApiRecord>(this.api(`/client-accounts/${encodeURIComponent(id)}/${action}`), {}, { headers: this.ifMatch(version) }).pipe(map(toClientAccount));
  }

  associateBuyer(id: string, version: number, membershipId: string | null): Observable<ClientAccount> {
    return this.http.put<ApiRecord>(this.api(`/client-accounts/${encodeURIComponent(id)}/buyer-membership`), { membershipId }, { headers: this.ifMatch(version) }).pipe(map(toClientAccount));
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
}
