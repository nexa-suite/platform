import { inject, Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { PLATFORM_RUNTIME_CONFIG } from '../../../core/security/runtime-config';
import { InventoryAvailability, InventoryLot, ReadinessCandidate, Reservation, ReservationPreview, StorageZone, StockMovement, WarehouseSummary, ApiPage } from '../../domain/warehouse.models';
import { WarehouseOperationsApiPort } from '../../domain/ports/warehouse-operations-api.port';
import { MOCK_WAREHOUSE_FIXTURES } from './mock-warehouse.fixtures';

const DEMO_NOW = '2026-08-26T10:00:00Z';

/** BC-05 in-memory adapter for the raw operational slice. */
@Injectable({ providedIn: 'root' })
export class MockWarehouseOperationsApiService extends WarehouseOperationsApiPort {
  private readonly config = inject(PLATFORM_RUNTIME_CONFIG);
  private readonly seed = this.fixture();
  private readonly warehouseStore = new Map(this.seed.warehouses.map((item) => [item.id, item]));
  private readonly zoneStore = new Map(this.seed.zones.map((item) => [item.id, item]));
  private readonly lotStore = new Map(this.seed.lots.map((item) => [item.id, item]));
  private readonly movementStore = new Map(this.seed.movements.map((item) => [item.id, item]));
  private readonly reservationStore = new Map(this.seed.reservations.map((item) => [item.id, item]));
  private nextWarehouse = this.warehouseStore.size + 1;
  private nextZone = this.zoneStore.size + 1;
  private nextLot = this.lotStore.size + 1;
  private nextMovement = this.movementStore.size + 1;
  private nextReservation = this.reservationStore.size + 1;

  warehouses(): Observable<ApiPage<WarehouseSummary>> { return of(this.page([...this.warehouseStore.values()])); }
  zones(warehouseId: string): Observable<ApiPage<StorageZone>> { return of(this.page([...this.zoneStore.values()].filter((item) => item.warehouseId === warehouseId))); }
  lots(): Observable<ApiPage<InventoryLot>> { return of(this.page([...this.lotStore.values()].sort((a, b) => a.expirationDate.localeCompare(b.expirationDate)))); }
  lot(id: string): Observable<InventoryLot> { return this.required(this.lotStore.get(id), 'MOCK_INVENTORY_LOT_NOT_FOUND'); }
  movements(): Observable<ApiPage<StockMovement>> { return of(this.page([...this.movementStore.values()])); }
  reservations(): Observable<ApiPage<Reservation>> { return of(this.page([...this.reservationStore.values()])); }
  reservation(id: string): Observable<Reservation> { return this.required(this.reservationStore.get(id), 'MOCK_RESERVATION_NOT_FOUND'); }

  availability(ids: readonly string[]): Observable<readonly InventoryAvailability[]> {
    return of(ids.map((catalogItemId): InventoryAvailability => ({ catalogItemId, status: [...this.lotStore.values()].some((lot) => lot.catalogItemId === catalogItemId && lot.available > 0 && lot.status === 'AVAILABLE') ? 'AVAILABLE' : 'UNAVAILABLE', asOf: DEMO_NOW })));
  }

  release(id: string, version: number, reason: string): Observable<Reservation> {
    const current = this.requireVersion(this.reservationStore.get(id), version, 'MOCK_RESERVATION');
    if (current.status !== 'RESERVED') return throwError(() => new Error('MOCK_RESERVATION_NOT_RELEASABLE'));
    const updated = { ...current, status: 'RELEASED', version: current.version + 1 };
    this.reservationStore.set(id, updated);
    for (const allocation of current.allocations ?? []) this.updateLotReservation(allocation.lotId, -allocation.quantity, `Release: ${reason}`);
    return of(updated);
  }

  createWarehouse(payload: { code: string; name: string; address?: string }): Observable<WarehouseSummary> {
    const id = `${this.config.tenantProfile}-warehouse-${String(this.nextWarehouse++).padStart(3, '0')}`;
    const item = { id, code: payload.code.trim(), name: payload.name.trim(), address: payload.address?.trim(), status: 'ACTIVE', version: 0 };
    this.warehouseStore.set(id, item);
    return of(item);
  }

  updateWarehouse(id: string, version: number, payload: { name?: string; address?: string; status?: string }): Observable<WarehouseSummary> {
    const current = this.requireVersion(this.warehouseStore.get(id), version, 'MOCK_WAREHOUSE');
    const updated = { ...current, ...payload, version: current.version + 1 };
    this.warehouseStore.set(id, updated);
    return of(updated);
  }

  createZone(warehouseId: string, payload: { code: string; name: string; type: string; temperatureMin?: number; temperatureMax?: number }): Observable<StorageZone> {
    if (!this.warehouseStore.has(warehouseId)) return throwError(() => new Error('MOCK_WAREHOUSE_NOT_FOUND'));
    const id = `${this.config.tenantProfile}-zone-${String(this.nextZone++).padStart(3, '0')}`;
    const item = { id, warehouseId, code: payload.code.trim(), name: payload.name.trim(), type: payload.type, status: 'ACTIVE', version: 0, temperatureMin: payload.temperatureMin, temperatureMax: payload.temperatureMax };
    this.zoneStore.set(id, item);
    return of(item);
  }

  updateZone(warehouseId: string, zoneId: string, version: number, payload: { name?: string; temperatureMin?: number; temperatureMax?: number; status?: string }): Observable<StorageZone> {
    const current = this.requireVersion(this.zoneStore.get(zoneId), version, 'MOCK_ZONE');
    if (current.warehouseId !== warehouseId) return throwError(() => new Error('MOCK_ZONE_NOT_FOUND'));
    const updated = { ...current, ...payload, version: current.version + 1 };
    this.zoneStore.set(zoneId, updated);
    return of(updated);
  }

  receive(payload: { warehouseId: string; zoneId: string; catalogItemId: string; skuId?: string; batchNumber: string; expirationDate: string; quantity: number; unit: string; temperatureValue?: number; notes?: string }): Observable<InventoryLot> {
    if (!this.warehouseStore.has(payload.warehouseId) || !this.zoneStore.has(payload.zoneId)) return throwError(() => new Error('MOCK_STORAGE_LOCATION_NOT_FOUND'));
    const id = `${this.config.tenantProfile}-lot-${String(this.nextLot++).padStart(3, '0')}`;
    const lot: InventoryLot = { id, warehouseId: payload.warehouseId, zoneId: payload.zoneId, catalogItemId: payload.catalogItemId, skuId: payload.skuId ?? null, batchNumber: payload.batchNumber.trim(), expirationDate: payload.expirationDate, receivedAt: DEMO_NOW, onHand: payload.quantity, reserved: 0, available: payload.quantity, unit: payload.unit.trim() || 'UNIT', status: 'AVAILABLE', version: 0 };
    this.lotStore.set(id, lot);
    this.addMovement(lot, 'INBOUND_RECEIPT', lot.onHand, 0, lot.onHand, 'Demo inbound receipt');
    return of(lot);
  }

  adjust(payload: { lotId: string; quantity: number; direction: 'IN' | 'OUT'; reason: string }, version: number): Observable<InventoryLot> {
    const current = this.requireVersion(this.lotStore.get(payload.lotId), version, 'MOCK_LOT');
    const delta = payload.direction === 'IN' ? payload.quantity : -payload.quantity;
    if (current.available + delta < 0) return throwError(() => new Error('MOCK_INVENTORY_SHORTAGE'));
    const updated = { ...current, onHand: current.onHand + delta, available: current.available + delta, version: current.version + 1 };
    this.lotStore.set(updated.id, updated);
    this.addMovement(updated, payload.direction === 'IN' ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT', payload.quantity, current.onHand, updated.onHand, payload.reason);
    return of(updated);
  }

  waste(payload: { lotId: string; quantity: number; reason: string }, version: number): Observable<InventoryLot> {
    const current = this.requireVersion(this.lotStore.get(payload.lotId), version, 'MOCK_LOT');
    if (current.available < payload.quantity) return throwError(() => new Error('MOCK_INVENTORY_SHORTAGE'));
    const updated = { ...current, onHand: current.onHand - payload.quantity, available: current.available - payload.quantity, version: current.version + 1 };
    this.lotStore.set(updated.id, updated);
    this.addMovement(updated, 'WASTE', payload.quantity, current.onHand, updated.onHand, payload.reason);
    return of(updated);
  }

  statusCommand(lotId: string, command: 'blocks' | 'quarantines' | 'availability-restorations', version: number, reason: string): Observable<InventoryLot> {
    const current = this.requireVersion(this.lotStore.get(lotId), version, 'MOCK_LOT');
    const status = command === 'blocks' ? 'BLOCKED' : command === 'quarantines' ? 'QUARANTINED' : 'AVAILABLE';
    const updated = { ...current, status, version: current.version + 1 };
    this.lotStore.set(lotId, updated);
    this.addMovement(updated, `LOT_${status}`, 0, current.onHand, updated.onHand, reason);
    return of(updated);
  }

  preview(salesOrderId: string): Observable<ReservationPreview> {
    const lot = this.fefoLots().find((item) => item.available > 0);
    const requested = 4;
    const allocated = Math.min(requested, lot?.available ?? 0);
    return of({ salesOrderId, orderNumber: this.orderNumber(salesOrderId), complete: allocated === requested, generatedAt: DEMO_NOW, notice: 'FEFO preview generated by the local demo adapter.', lines: [{ catalogItemId: lot?.catalogItemId ?? `${this.config.tenantProfile}-catalog-001`, skuId: lot?.skuId ?? null, requested, unit: lot?.unit ?? 'UNIT', allocations: lot && allocated ? [{ lotId: lot.id, quantity: allocated, unit: lot.unit, expirationDate: lot.expirationDate }] : [], shortage: Math.max(0, requested - allocated), complete: allocated === requested }] });
  }

  reserve(salesOrderId: string, version: number): Observable<Reservation> {
    const lot = this.fefoLots().find((item) => item.available >= 4);
    if (!lot) return throwError(() => new Error('MOCK_INVENTORY_SHORTAGE'));
    const allocation = { lotId: lot.id, quantity: 4, unit: lot.unit, expirationDate: lot.expirationDate };
    const id = `${this.config.tenantProfile}-reservation-${String(this.nextReservation++).padStart(3, '0')}`;
    const reservation: Reservation = { id, salesOrderId, orderNumber: this.orderNumber(salesOrderId), status: 'RESERVED', createdAt: DEMO_NOW, reservedAt: DEMO_NOW, expiresAt: '2026-08-28T10:00:00Z', version, clientAccountId: `${this.config.tenantProfile}-client-001`, allocations: [allocation] };
    this.reservationStore.set(id, reservation);
    this.updateLotReservation(lot.id, allocation.quantity, 'Reservation created');
    return of(reservation);
  }

  readiness(): Observable<readonly ReadinessCandidate[]> {
    return of([...this.reservationStore.values()].filter((item) => item.status === 'RESERVED').map((item) => ({ reservationId: item.id, salesOrderId: item.salesOrderId, orderNumber: item.orderNumber, clientAccountId: item.clientAccountId ?? `${this.config.tenantProfile}-client-001`, lineCount: item.allocations?.length ?? 0, totalReservedQuantity: item.allocations?.reduce((total, allocation) => total + allocation.quantity, 0) ?? 0, reservedAt: item.reservedAt ?? item.createdAt, expiresAt: item.expiresAt, status: 'AWAITING_DISPATCH' })));
  }

  private fixture() { return MOCK_WAREHOUSE_FIXTURES[this.config.tenantProfile]; }
  private page<T>(items: readonly T[]): ApiPage<T> { return { items, page: 0, size: items.length, total: items.length }; }
  private required<T>(value: T | undefined, message: string): Observable<T> { return value === undefined ? throwError(() => new Error(message)) : of(value); }
  private requireVersion<T extends { version: number }>(value: T | undefined, version: number, resource: string): T { if (!value) throw new Error(`${resource}_NOT_FOUND`); if (value.version !== version) throw new Error(`${resource}_CONCURRENCY_CONFLICT`); return value; }
  private updateLotReservation(id: string, delta: number, reason: string): void { const current = this.lotStore.get(id); if (!current) return; const updated = { ...current, reserved: Math.max(0, current.reserved + delta), available: current.onHand - Math.max(0, current.reserved + delta), version: current.version + 1 }; this.lotStore.set(id, updated); this.addMovement(updated, delta > 0 ? 'RESERVATION_CREATED' : 'RESERVATION_RELEASE', Math.abs(delta), current.reserved, updated.reserved, reason); }
  private addMovement(lot: InventoryLot, type: string, quantity: number, quantityBefore: number, quantityAfter: number, reason: string): void { const movement: StockMovement = { id: `${this.config.tenantProfile}-movement-${String(this.nextMovement++).padStart(3, '0')}`, lotId: lot.id, catalogItemId: lot.catalogItemId, skuId: lot.skuId, type, quantity, unit: lot.unit, quantityBefore, quantityAfter, reservedBefore: lot.reserved, reservedAfter: lot.reserved, reason, occurredAt: DEMO_NOW }; this.movementStore.set(movement.id, movement); }
  private orderNumber(id: string): string { return id.endsWith('-001') ? (this.config.tenantProfile === 'icisa' ? 'SO-ICISA-001' : 'SO-GEN-001') : (this.config.tenantProfile === 'icisa' ? 'SO-ICISA-002' : 'SO-GEN-002'); }
  private fefoLots(): readonly InventoryLot[] { return [...this.lotStore.values()].filter((item) => item.status === 'AVAILABLE').sort((a, b) => a.expirationDate.localeCompare(b.expirationDate)); }
}
