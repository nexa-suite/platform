import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonComponent } from '../../shared/presentation/components/button/button.component';
import { EmptyStateComponent } from '../../shared/presentation/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/presentation/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../shared/presentation/components/loading-state/loading-state.component';
import { MetricCardComponent } from '../../shared/presentation/components/metric-card/metric-card.component';
import { NexaIconComponent } from '../../shared/presentation/components/nexa-icon/nexa-icon.component';
import { PageHeaderComponent } from '../../shared/presentation/components/page-header/page-header.component';
import { StatusBadgeComponent, type StatusTone } from '../../shared/presentation/components/status-badge/status-badge.component';
import { WarehouseOperationsFacade } from '../application/warehouse-operations.facade';
import { InventoryCatalogReference } from '../domain/inventory-catalog-reference.models';
import { InventoryLot } from '../domain/warehouse.models';

type InventoryFilter = 'all' | 'available' | 'attention' | 'out';
type InventoryProductStatus = 'healthy' | 'attention' | 'out';

interface InventoryProductRow {
  readonly id: string;
  readonly name: string;
  readonly productCode: string;
  readonly lots: readonly InventoryLot[];
  readonly onHand: number;
  readonly reserved: number;
  readonly available: number;
  readonly unit: string;
  readonly earliestExpiration: string | null;
  readonly status: InventoryProductStatus;
}

@Component({
  selector: 'nexa-inventory-overview-page',
  standalone: true,
  imports: [
    ButtonComponent,
    DatePipe,
    DecimalPipe,
    EmptyStateComponent,
    ErrorStateComponent,
    LoadingStateComponent,
    MetricCardComponent,
    NexaIconComponent,
    PageHeaderComponent,
    ReactiveFormsModule,
    RouterLink,
    RouterLinkActive,
    StatusBadgeComponent,
    TranslatePipe,
  ],
  templateUrl: './inventory-overview-page.component.html',
  styleUrl: './inventory-overview-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryOverviewPageComponent {
  readonly facade = inject(WarehouseOperationsFacade);
  readonly catalogProducts = signal<readonly InventoryCatalogReference[]>([]);
  readonly movementOpen = signal(false);
  readonly search = signal('');
  readonly filter = signal<InventoryFilter>('all');
  readonly filterOptions: readonly { value: InventoryFilter; label: string }[] = [
    { value: 'all', label: 'warehouse.inventoryUi.filters.all' },
    { value: 'available', label: 'warehouse.inventoryUi.filters.available' },
    { value: 'attention', label: 'warehouse.inventoryUi.filters.attention' },
    { value: 'out', label: 'warehouse.inventoryUi.filters.out' },
  ];
  private readonly fb = inject(FormBuilder);

  readonly receipt = this.fb.nonNullable.group({
    warehouseId: ['', Validators.required],
    zoneId: ['', Validators.required],
    catalogItemId: ['', Validators.required],
    batchNumber: ['', Validators.required],
    expirationDate: ['', Validators.required],
    quantity: [1, [Validators.required, Validators.min(0.0001)]],
    unit: ['UNIT', Validators.required],
    temperatureValue: [null as number | null],
  });

  readonly primaryWarehouse = computed(() => this.facade.warehouses()[0] ?? null);
  readonly reservedLots = computed(() => this.facade.lots().filter((lot) => lot.reserved > 0).length);
  readonly unavailableLots = computed(() => this.facade.lots().filter((lot) => this.isUnavailable(lot)).length);
  readonly fefoRiskLots = computed(() => [...this.facade.lots()]
    .filter((lot) => this.isFefoRisk(lot))
    .sort((left, right) => left.expirationDate.localeCompare(right.expirationDate)));

  readonly productRows = computed<readonly InventoryProductRow[]>(() => {
    const lotsByCatalog = new Map<string, InventoryLot[]>();
    for (const lot of this.facade.lots()) {
      const lots = lotsByCatalog.get(lot.catalogItemId) ?? [];
      lots.push(lot);
      lotsByCatalog.set(lot.catalogItemId, lots);
    }

    const rows = new Map<string, InventoryProductRow>();
    for (const product of this.catalogProducts()) {
      rows.set(product.catalogItemId, this.toRow(product.catalogItemId, product.name, product.productCode, lotsByCatalog.get(product.catalogItemId) ?? []));
    }
    for (const [catalogItemId, lots] of lotsByCatalog) {
      if (!rows.has(catalogItemId)) rows.set(catalogItemId, this.toRow(catalogItemId, catalogItemId, catalogItemId, lots));
    }
    return [...rows.values()].sort((left, right) => {
      if (left.status !== right.status) return left.status === 'out' ? 1 : -1;
      return left.name.localeCompare(right.name);
    });
  });

  readonly filteredRows = computed(() => {
    const term = this.search().trim().toLocaleLowerCase();
    const filter = this.filter();
    return this.productRows().filter((row) => {
      const matchesSearch = !term || [row.name, row.productCode, row.id, ...row.lots.map((lot) => lot.batchNumber)]
        .some((value) => value.toLocaleLowerCase().includes(term));
      const matchesFilter = filter === 'all' || (filter === 'available' && row.status !== 'out') || row.status === filter;
      return matchesSearch && matchesFilter;
    });
  });

  constructor() {
    this.facade.load();
    this.facade.activeCatalogItems().subscribe({ next: (items) => this.catalogProducts.set(items) });
  }

  setFilter(value: InventoryFilter): void {
    this.filter.set(value);
  }

  searchChanged(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  toggleMovement(): void {
    this.movementOpen.update((open) => !open);
  }

  closeMovement(): void {
    this.movementOpen.set(false);
  }

  warehouseChanged(): void {
    const warehouseId = this.receipt.controls.warehouseId.value;
    this.receipt.controls.zoneId.setValue('');
    if (warehouseId) this.facade.loadZones(warehouseId);
  }

  receive(): void {
    if (this.receipt.invalid) return;
    const value = this.receipt.getRawValue();
    this.facade.receive({ ...value, temperatureValue: value.temperatureValue ?? undefined });
  }

  catalogName(catalogItemId: string): string {
    return this.catalogProducts().find((item) => item.catalogItemId === catalogItemId)?.name ?? catalogItemId;
  }

  warehouseName(row: InventoryProductRow): string {
    const warehouseId = row.lots[0]?.warehouseId;
    return this.facade.warehouses().find((warehouse) => warehouse.id === warehouseId)?.name ?? warehouseId ?? '—';
  }

  availablePercent(row: InventoryProductRow): number {
    return row.onHand > 0 ? Math.min(100, Math.max(0, (row.available / row.onHand) * 100)) : 0;
  }

  statusTone(status: InventoryProductStatus): StatusTone {
    return status === 'healthy' ? 'success' : status === 'attention' ? 'warning' : 'danger';
  }

  warehouseTone(status: string): StatusTone {
    return status === 'ACTIVE' ? 'success' : 'neutral';
  }

  private toRow(id: string, name: string, productCode: string, lots: readonly InventoryLot[]): InventoryProductRow {
    const sortedLots = [...lots].sort((left, right) => left.expirationDate.localeCompare(right.expirationDate));
    const available = sortedLots.reduce((total, lot) => total + lot.available, 0);
    const onHand = sortedLots.reduce((total, lot) => total + lot.onHand, 0);
    const reserved = sortedLots.reduce((total, lot) => total + lot.reserved, 0);
    const status: InventoryProductStatus = available <= 0 ? 'out' : sortedLots.some((lot) => this.isFefoRisk(lot)) ? 'attention' : 'healthy';
    return { id, name, productCode, lots: sortedLots, onHand, reserved, available, unit: sortedLots[0]?.unit ?? 'UNIT', earliestExpiration: sortedLots[0]?.expirationDate ?? null, status };
  }

  private isUnavailable(lot: InventoryLot): boolean {
    return lot.available <= 0 || ['BLOCKED', 'QUARANTINED', 'EXPIRED', 'DEPLETED'].includes(lot.status);
  }

  private isFefoRisk(lot: InventoryLot): boolean {
    const expiration = Date.parse(lot.expirationDate);
    if (!Number.isFinite(expiration)) return false;
    const riskWindow = Date.now() + 10 * 24 * 60 * 60 * 1000;
    return expiration <= riskWindow;
  }
}
