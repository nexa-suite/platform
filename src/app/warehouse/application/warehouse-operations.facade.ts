import { Injectable, computed, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { InventoryLot, ReadinessCandidate, Reservation, ReservationPreview, StorageZone, StockMovement, WarehouseSummary } from '../domain/warehouse.models';
import { WarehouseOperationsApiService } from '../infrastructure/warehouse-operations-api.service';

@Injectable()
export class WarehouseOperationsFacade {
  private readonly api = inject(WarehouseOperationsApiService);
  readonly loading = signal(false); readonly error = signal<string | null>(null); readonly warehouses = signal<readonly WarehouseSummary[]>([]); readonly zones = signal<readonly StorageZone[]>([]); readonly lots = signal<readonly InventoryLot[]>([]); readonly movements = signal<readonly StockMovement[]>([]); readonly reservations = signal<readonly Reservation[]>([]);
  readonly previewResult = signal<ReservationPreview | null>(null);
  readonly selectedLot = signal<InventoryLot | null>(null);
  readonly selectedReservation = signal<Reservation | null>(null);
  readonly readiness = signal<readonly ReadinessCandidate[]>([]);
  readonly metrics = computed(() => ({ warehouses: this.warehouses().length, lots: this.lots().length, available: this.lots().filter((lot) => lot.available > 0).length, reserved: this.reservations().filter((r) => r.status === 'RESERVED').length, shortages: this.reservations().filter((r) => r.status === 'SHORTAGE').length }));
  load(): void { this.loading.set(true); this.error.set(null); forkJoin({ warehouses: this.api.warehouses(), lots: this.api.lots(), movements: this.api.movements(), reservations: this.api.reservations() }).subscribe({ next: (data) => { this.warehouses.set(data.warehouses.items); this.lots.set(data.lots.items); this.movements.set(data.movements.items); this.reservations.set(data.reservations.items); this.loading.set(false); }, error: () => { this.error.set('No se pudo cargar la operación de almacén.'); this.loading.set(false); } }); }
  loadZones(warehouseId: string): void { this.api.zones(warehouseId).subscribe({ next: (data) => this.zones.set(data.items), error: () => this.error.set('No se pudieron cargar las zonas.') }); }
  loadLot(id: string): void { this.loading.set(true); this.error.set(null); this.api.lot(id).subscribe({ next: (value) => { this.selectedLot.set(value); this.loading.set(false); }, error: () => { this.error.set('No se pudo cargar el lote.'); this.loading.set(false); } }); }
  loadReservation(id: string): void { this.loading.set(true); this.error.set(null); this.api.reservation(id).subscribe({ next: (value) => { this.selectedReservation.set(value); this.loading.set(false); }, error: () => { this.error.set('No se pudo cargar la reserva.'); this.loading.set(false); } }); }
  retry(): void { this.load(); }
  createWarehouse(payload: { code: string; name: string; address?: string }): void { this.api.createWarehouse(payload).subscribe({ next: () => this.load(), error: () => this.error.set('No se pudo crear el almacén.') }); }
  updateWarehouse(item: WarehouseSummary, payload: { name?: string; address?: string; status?: string }): void { this.api.updateWarehouse(item.id, item.version, payload).subscribe({ next: () => this.load(), error: () => this.error.set('No se pudo actualizar el almacén.') }); }
  suspendWarehouse(item: WarehouseSummary): void { this.api.updateWarehouse(item.id, item.version, { status: 'SUSPENDED' }).subscribe({ next: () => this.load(), error: () => this.error.set('No se pudo suspender el almacén.') }); }
  createZone(warehouseId: string, payload: { code: string; name: string; type: string; temperatureMin?: number; temperatureMax?: number }): void { this.api.createZone(warehouseId, payload).subscribe({ next: () => this.loadZones(warehouseId), error: () => this.error.set('No se pudo crear la zona.') }); }
  updateZone(warehouseId: string, zone: StorageZone, payload: { name?: string; temperatureMin?: number; temperatureMax?: number; status?: string }): void { this.api.updateZone(warehouseId, zone.id, zone.version, payload).subscribe({ next: () => this.loadZones(warehouseId), error: () => this.error.set('No se pudo actualizar la zona.') }); }
  receive(payload: { warehouseId: string; zoneId: string; catalogItemId: string; batchNumber: string; expirationDate: string; quantity: number; unit: string; temperatureValue?: number; notes?: string }): void { this.api.receive(payload).subscribe({ next: () => this.load(), error: () => this.error.set('No se pudo registrar el ingreso.') }); }
  adjust(payload: { lotId: string; quantity: number; direction: 'IN' | 'OUT'; reason: string }, version: number): void { this.api.adjust(payload, version).subscribe({ next: () => this.load(), error: () => this.error.set('No se pudo ajustar el lote.') }); }
  waste(payload: { lotId: string; quantity: number; reason: string }, version: number): void { this.api.waste(payload, version).subscribe({ next: () => this.load(), error: () => this.error.set('No se pudo registrar la merma.') }); }
  changeLotStatus(lot: InventoryLot, command: 'blocks' | 'quarantines' | 'availability-restorations', reason: string): void { this.api.statusCommand(lot.id, command, lot.version, reason).subscribe({ next: () => this.load(), error: () => this.error.set('No se pudo cambiar el estado del lote.') }); }
  preview(salesOrderId: string): void { this.api.preview(salesOrderId).subscribe({ next: (value) => this.previewResult.set(value), error: () => this.error.set('No se pudo calcular FEFO.') }); }
  reserve(salesOrderId: string, version: number): void { this.api.reserve(salesOrderId, version).subscribe({ next: () => { this.load(); this.loadReadiness(); }, error: () => this.error.set('No se pudo reservar el pedido.') }); }
  release(id: string, version: number, reason: string): void { this.api.release(id, version, reason).subscribe({ next: () => this.load(), error: () => this.error.set('No se pudo liberar la reserva.') }); }
  loadReadiness(): void { this.loading.set(true); this.api.readiness().subscribe({ next: (value) => { this.readiness.set(value); this.loading.set(false); }, error: () => { this.error.set('No se pudo cargar la preparación de despacho.'); this.loading.set(false); } }); }
}
