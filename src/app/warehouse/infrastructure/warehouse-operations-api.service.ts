import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { platformApiUrl, PLATFORM_RUNTIME_CONFIG } from '../../core/security/runtime-config';
import { ApiPage, InventoryAvailability, InventoryLot, Reservation, StorageZone, StockMovement, WarehouseSummary } from '../domain/warehouse.models';

@Injectable()
export class WarehouseOperationsApiService {
  private readonly http = inject(HttpClient); private readonly config = inject(PLATFORM_RUNTIME_CONFIG);
  private api(path: string): string { return platformApiUrl(this.config, `/api/v1${path}`); }
  warehouses(): Observable<ApiPage<WarehouseSummary>> { return this.http.get<ApiPage<WarehouseSummary>>(this.api('/warehouses'), { params: new HttpParams().set('size', 100) }); }
  zones(warehouseId: string): Observable<ApiPage<StorageZone>> { return this.http.get<ApiPage<StorageZone>>(this.api(`/warehouses/${encodeURIComponent(warehouseId)}/zones`)); }
  lots(): Observable<ApiPage<InventoryLot>> { return this.http.get<ApiPage<InventoryLot>>(this.api('/inventory/lots'), { params: new HttpParams().set('size', 100).set('sort', 'expirationDate,asc') }); }
  movements(): Observable<ApiPage<StockMovement>> { return this.http.get<ApiPage<StockMovement>>(this.api('/inventory/movements'), { params: new HttpParams().set('size', 100) }); }
  reservations(): Observable<ApiPage<Reservation>> { return this.http.get<ApiPage<Reservation>>(this.api('/inventory-reservations'), { params: new HttpParams().set('size', 100) }); }
  availability(ids: readonly string[]): Observable<readonly InventoryAvailability[]> { let params = new HttpParams(); ids.forEach((id) => params = params.append('catalogItemIds', id)); return this.http.get<readonly InventoryAvailability[]>(this.api('/inventory-availability'), { params }); }
  release(id: string, version: number, reason: string): Observable<Reservation> { const headers = new HttpHeaders({ 'If-Match': `"${version}"`, 'Idempotency-Key': crypto.randomUUID() }); return this.http.post<Reservation>(this.api(`/inventory-reservations/${encodeURIComponent(id)}/releases`), { reason }, { headers }); }
}
