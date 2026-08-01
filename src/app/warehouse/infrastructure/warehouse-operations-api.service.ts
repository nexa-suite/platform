import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { platformApiUrl, PLATFORM_RUNTIME_CONFIG } from '../../core/security/runtime-config';
import { ApiPage, InventoryAvailability, InventoryLot, ReadinessCandidate, Reservation, ReservationPreview, StorageZone, StockMovement, WarehouseSummary } from '../domain/warehouse.models';

@Injectable()
export class WarehouseOperationsApiService {
  private readonly http = inject(HttpClient); private readonly config = inject(PLATFORM_RUNTIME_CONFIG);
  private api(path: string): string { return platformApiUrl(this.config, `/api/v1${path}`); }
  warehouses(): Observable<ApiPage<WarehouseSummary>> { return this.http.get<ApiPage<WarehouseSummary>>(this.api('/warehouses'), { params: new HttpParams().set('size', 100) }); }
  zones(warehouseId: string): Observable<ApiPage<StorageZone>> { return this.http.get<ApiPage<StorageZone>>(this.api(`/warehouses/${encodeURIComponent(warehouseId)}/zones`)); }
  lots(): Observable<ApiPage<InventoryLot>> { return this.http.get<ApiPage<InventoryLot>>(this.api('/inventory/lots'), { params: new HttpParams().set('size', 100).set('sort', 'expirationDate,asc') }); }
  lot(id: string): Observable<InventoryLot> { return this.http.get<InventoryLot>(this.api(`/inventory/lots/${encodeURIComponent(id)}`)); }
  movements(): Observable<ApiPage<StockMovement>> { return this.http.get<ApiPage<StockMovement>>(this.api('/inventory/movements'), { params: new HttpParams().set('size', 100) }); }
  reservations(): Observable<ApiPage<Reservation>> { return this.http.get<ApiPage<Reservation>>(this.api('/inventory-reservations'), { params: new HttpParams().set('size', 100) }); }
  reservation(id: string): Observable<Reservation> { return this.http.get<Reservation>(this.api(`/inventory-reservations/${encodeURIComponent(id)}`)); }
  availability(ids: readonly string[]): Observable<readonly InventoryAvailability[]> { let params = new HttpParams(); ids.forEach((id) => params = params.append('catalogItemIds', id)); return this.http.get<readonly InventoryAvailability[]>(this.api('/inventory-availability'), { params }); }
  release(id: string, version: number, reason: string): Observable<Reservation> { const headers = new HttpHeaders({ 'If-Match': `"${version}"`, 'Idempotency-Key': crypto.randomUUID() }); return this.http.post<Reservation>(this.api(`/inventory-reservations/${encodeURIComponent(id)}/releases`), { reason }, { headers }); }
  createWarehouse(payload: { code: string; name: string; address?: string }): Observable<WarehouseSummary> { return this.http.post<WarehouseSummary>(this.api('/warehouses'), payload); }
  updateWarehouse(id: string, version: number, payload: { name?: string; address?: string; status?: string }): Observable<WarehouseSummary> { return this.http.patch<WarehouseSummary>(this.api(`/warehouses/${encodeURIComponent(id)}`), payload, { headers: new HttpHeaders({ 'If-Match': `"${version}"` }) }); }
  createZone(warehouseId: string, payload: { code: string; name: string; type: string; temperatureMin?: number; temperatureMax?: number }): Observable<StorageZone> { return this.http.post<StorageZone>(this.api(`/warehouses/${encodeURIComponent(warehouseId)}/zones`), payload); }
  updateZone(warehouseId: string, zoneId: string, version: number, payload: { name?: string; temperatureMin?: number; temperatureMax?: number; status?: string }): Observable<StorageZone> { return this.http.patch<StorageZone>(this.api(`/warehouses/${encodeURIComponent(warehouseId)}/zones/${encodeURIComponent(zoneId)}`), payload, { headers: new HttpHeaders({ 'If-Match': `"${version}"` }) }); }
  receive(payload: { warehouseId: string; zoneId: string; catalogItemId: string; batchNumber: string; expirationDate: string; quantity: number; unit: string; temperatureValue?: number; notes?: string }): Observable<InventoryLot> { return this.http.post<InventoryLot>(this.api('/inventory/inbound-receipts'), payload, { headers: new HttpHeaders({ 'Idempotency-Key': crypto.randomUUID() }) }); }
  adjust(payload: { lotId: string; quantity: number; direction: 'IN' | 'OUT'; reason: string }, version: number): Observable<InventoryLot> { return this.http.post<InventoryLot>(this.api('/inventory/adjustments'), payload, { headers: new HttpHeaders({ 'If-Match': `"${version}"`, 'Idempotency-Key': crypto.randomUUID() }) }); }
  waste(payload: { lotId: string; quantity: number; reason: string }, version: number): Observable<InventoryLot> { return this.http.post<InventoryLot>(this.api('/inventory/waste-movements'), payload, { headers: new HttpHeaders({ 'If-Match': `"${version}"`, 'Idempotency-Key': crypto.randomUUID() }) }); }
  statusCommand(lotId: string, command: 'blocks' | 'quarantines' | 'availability-restorations', version: number, reason: string): Observable<InventoryLot> { return this.http.post<InventoryLot>(this.api(`/inventory/lots/${encodeURIComponent(lotId)}/${command}`), { reason }, { headers: new HttpHeaders({ 'If-Match': `"${version}"`, 'Idempotency-Key': crypto.randomUUID() }) }); }
  preview(salesOrderId: string): Observable<ReservationPreview> { return this.http.get<ReservationPreview>(this.api(`/fulfillment-candidates/${encodeURIComponent(salesOrderId)}/inventory-reservation-preview`)); }
  reserve(salesOrderId: string, version: number): Observable<Reservation> { return this.http.post<Reservation>(this.api(`/fulfillment-candidates/${encodeURIComponent(salesOrderId)}/inventory-reservations`), {}, { headers: new HttpHeaders({ 'If-Match': `"${version}"`, 'Idempotency-Key': crypto.randomUUID() }) }); }
  readiness(): Observable<readonly ReadinessCandidate[]> { return this.http.get<readonly ReadinessCandidate[]>(this.api('/dispatch-readiness-candidates')); }
}
