import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { platformApiUrl, PLATFORM_RUNTIME_CONFIG } from '../../../core/security/runtime-config';
import { PurchaseRequestLineCommand } from '../http/sales-commitment-api.service';
import { ManualOrderPriority } from '../../application/manual-orders/manual-order-wizard-state.service';

export interface ManualOrderDraftView {
  readonly id: string;
  readonly version: number;
  readonly status: string;
  readonly clientAccountId: string;
  readonly requestedDeliveryDate: string;
  readonly priority: ManualOrderPriority;
  readonly paymentPreference: string;
  readonly currency: string;
  readonly notes: string;
  readonly lines: readonly PurchaseRequestLineCommand[];
  readonly addressId: string | null;
  readonly deliveryNotes: string;
  readonly warehouseId: string | null;
  readonly routeProvider: string | null;
  readonly readyToCreate: boolean;
  readonly salesOrderId: string | null;
}

@Injectable()
export class ManualOrderDraftApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(PLATFORM_RUNTIME_CONFIG);
  private readonly api = (path: string) => platformApiUrl(this.config, `/api/v1/sales-orders/manual-drafts${path}`);

  create(): Observable<ManualOrderDraftView> {
    return this.http.post<unknown>(this.api(''), null, { headers: this.idempotency() }).pipe(map((value) => draft(value)));
  }

  get(id: string): Observable<ManualOrderDraftView> {
    return this.http.get<unknown>(this.api(`/${encodeURIComponent(id)}`)).pipe(map((value) => draft(value)));
  }

  client(id: string, version: number, value: { readonly clientAccountId: string; readonly requestedDeliveryDate: string; readonly priority: string; readonly paymentPreference: string; readonly currency: string; readonly notes: string }): Observable<ManualOrderDraftView> {
    return this.http.put<unknown>(this.api(`/${encodeURIComponent(id)}/client`), value, { observe: 'response', headers: this.ifMatch(version) }).pipe(map((response) => draft(response.body)));
  }

  items(id: string, version: number, lines: readonly PurchaseRequestLineCommand[]): Observable<ManualOrderDraftView> {
    return this.http.put<unknown>(this.api(`/${encodeURIComponent(id)}/items`), { lines: lines.map((line) => ({ skuId: uuidOrNull(line.catalogItemId), catalogItemId: line.catalogItemId, quantity: line.quantity, unit: line.unit, notes: line.notes ?? null })) }, { observe: 'response', headers: this.ifMatch(version) }).pipe(map((response) => draft(response.body)));
  }

  delivery(id: string, version: number, value: { readonly addressId: string; readonly deliveryNotes: string; readonly routeProvider: string | null }): Observable<ManualOrderDraftView> {
    return this.http.put<unknown>(this.api(`/${encodeURIComponent(id)}/delivery`), value, { observe: 'response', headers: this.ifMatch(version) }).pipe(map((response) => draft(response.body)));
  }

  review(id: string): Observable<ManualOrderDraftView> {
    return this.http.get<unknown>(this.api(`/${encodeURIComponent(id)}/review`)).pipe(map((value) => draft((value as Record<string, unknown>)['draft'] ?? value)));
  }

  submit(id: string, version: number): Observable<{ readonly id: string }> {
    return this.http.post<{ readonly id: string }>(this.api(`/${encodeURIComponent(id)}/submissions`), null, { headers: this.ifMatch(version).set('Idempotency-Key', randomKey()) });
  }

  private ifMatch(version: number): HttpHeaders { return new HttpHeaders({ 'If-Match': `"${version}"` }); }
  private idempotency(): HttpHeaders { return new HttpHeaders({ 'Idempotency-Key': randomKey() }); }
}

function draft(value: unknown): ManualOrderDraftView {
  const raw = (value ?? {}) as Record<string, any>;
  const client = (raw['client'] ?? {}) as Record<string, any>;
  const delivery = (raw['delivery'] ?? {}) as Record<string, any>;
  const lines = Array.isArray(raw['lines']) ? raw['lines'] as readonly Record<string, any>[] : [];
  return {
    id: String(raw['id'] ?? ''), version: Number(raw['version'] ?? 0), status: String(raw['status'] ?? 'DRAFT'),
    clientAccountId: String(client['id'] ?? raw['clientAccountId'] ?? ''), requestedDeliveryDate: String(raw['requestedDeliveryDate'] ?? ''),
    priority: (String(raw['priority'] ?? 'NORMAL').toUpperCase() as ManualOrderPriority), paymentPreference: String(raw['paymentPreference'] ?? 'CREDIT_LINE'),
    currency: String(raw['currency'] ?? 'PEN'), notes: String(raw['notes'] ?? ''),
    lines: lines.map((line) => ({ catalogItemId: String(line['catalogItemId'] ?? line['skuId'] ?? ''), quantity: Number(line['quantity'] ?? 0), unit: String(line['unit'] ?? 'UNIT'), notes: line['notes'] == null ? null : String(line['notes']) })),
    addressId: delivery['addressId'] == null ? null : String(delivery['addressId']), deliveryNotes: String(delivery['deliveryNotes'] ?? ''),
    warehouseId: delivery['warehouseId'] == null ? null : String(delivery['warehouseId']), routeProvider: delivery['routeProvider'] == null ? null : String(delivery['routeProvider']),
    readyToCreate: raw['readyToCreate'] === true, salesOrderId: raw['salesOrderId'] == null ? null : String(raw['salesOrderId']),
  };
}

function uuidOrNull(value: string): string | null {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value) ? value : null;
}

function randomKey(): string { return globalThis.crypto?.randomUUID?.() ?? `platform-manual-${Date.now()}-${Math.random().toString(36).slice(2)}`; }
