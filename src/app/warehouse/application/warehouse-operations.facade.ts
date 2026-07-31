import { Injectable, computed, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { InventoryLot, Reservation, StorageZone, StockMovement, WarehouseSummary } from '../domain/warehouse.models';
import { WarehouseOperationsApiService } from '../infrastructure/warehouse-operations-api.service';

@Injectable()
export class WarehouseOperationsFacade {
  private readonly api = inject(WarehouseOperationsApiService);
  readonly loading = signal(false); readonly error = signal<string | null>(null); readonly warehouses = signal<readonly WarehouseSummary[]>([]); readonly zones = signal<readonly StorageZone[]>([]); readonly lots = signal<readonly InventoryLot[]>([]); readonly movements = signal<readonly StockMovement[]>([]); readonly reservations = signal<readonly Reservation[]>([]);
  readonly metrics = computed(() => ({ warehouses: this.warehouses().length, lots: this.lots().length, available: this.lots().filter((lot) => lot.available > 0).length, reserved: this.reservations().filter((r) => r.status === 'RESERVED').length, shortages: this.reservations().filter((r) => r.status === 'SHORTAGE').length }));
  load(): void { this.loading.set(true); this.error.set(null); forkJoin({ warehouses: this.api.warehouses(), lots: this.api.lots(), movements: this.api.movements(), reservations: this.api.reservations() }).subscribe({ next: (data) => { this.warehouses.set(data.warehouses.items); this.lots.set(data.lots.items); this.movements.set(data.movements.items); this.reservations.set(data.reservations.items); this.loading.set(false); }, error: () => { this.error.set('No se pudo cargar la operación de almacén.'); this.loading.set(false); } }); }
  loadZones(warehouseId: string): void { this.api.zones(warehouseId).subscribe({ next: (data) => this.zones.set(data.items), error: () => this.error.set('No se pudieron cargar las zonas.') }); }
  retry(): void { this.load(); }
}
