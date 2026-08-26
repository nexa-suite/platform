import { Observable } from 'rxjs';
import { ApiPage, InventoryAvailability, InventoryLot, ReadinessCandidate, Reservation, ReservationPreview, StorageZone, StockMovement, WarehouseSummary } from '../warehouse.models';

/** Warehouse/inventory application port. */
export abstract class WarehouseOperationsApiPort {
  abstract warehouses(): Observable<ApiPage<WarehouseSummary>>;
  abstract zones(warehouseId: string): Observable<ApiPage<StorageZone>>;
  abstract lots(): Observable<ApiPage<InventoryLot>>;
  abstract lot(id: string): Observable<InventoryLot>;
  abstract movements(): Observable<ApiPage<StockMovement>>;
  abstract reservations(): Observable<ApiPage<Reservation>>;
  abstract reservation(id: string): Observable<Reservation>;
  abstract availability(ids: readonly string[]): Observable<readonly InventoryAvailability[]>;
  abstract release(id: string, version: number, reason: string, idempotencyKey?: string): Observable<Reservation>;
  abstract createWarehouse(payload: { code: string; name: string; address?: string }): Observable<WarehouseSummary>;
  abstract updateWarehouse(id: string, version: number, payload: { name?: string; address?: string; status?: string }): Observable<WarehouseSummary>;
  abstract createZone(warehouseId: string, payload: { code: string; name: string; type: string; temperatureMin?: number; temperatureMax?: number }): Observable<StorageZone>;
  abstract updateZone(warehouseId: string, zoneId: string, version: number, payload: { name?: string; temperatureMin?: number; temperatureMax?: number; status?: string }): Observable<StorageZone>;
  abstract receive(payload: { warehouseId: string; zoneId: string; catalogItemId: string; skuId?: string; batchNumber: string; expirationDate: string; quantity: number; unit: string; temperatureValue?: number; notes?: string }, idempotencyKey?: string): Observable<InventoryLot>;
  abstract adjust(payload: { lotId: string; quantity: number; direction: 'IN' | 'OUT'; reason: string }, version: number, idempotencyKey?: string): Observable<InventoryLot>;
  abstract waste(payload: { lotId: string; quantity: number; reason: string }, version: number, idempotencyKey?: string): Observable<InventoryLot>;
  abstract statusCommand(lotId: string, command: 'blocks' | 'quarantines' | 'availability-restorations', version: number, reason: string, idempotencyKey?: string): Observable<InventoryLot>;
  abstract preview(salesOrderId: string): Observable<ReservationPreview>;
  abstract reserve(salesOrderId: string, version: number, idempotencyKey?: string): Observable<Reservation>;
  abstract readiness(): Observable<readonly ReadinessCandidate[]>;
}
