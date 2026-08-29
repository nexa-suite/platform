import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { StatusBadgeComponent, type StatusTone } from '../../shared/presentation/components/status-badge/status-badge.component';
import { MetricCardComponent } from '../../shared/presentation/components/metric-card/metric-card.component';
import { NexaIconComponent } from '../../shared/presentation/components/nexa-icon/nexa-icon.component';
import { EmptyStateComponent } from '../../shared/presentation/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/presentation/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../shared/presentation/components/loading-state/loading-state.component';
import { RouterLink } from '@angular/router';
import { PageHeaderComponent } from '../../shared/presentation/components/page-header/page-header.component';
import { SectionPanelComponent } from '../../shared/presentation/components/section-panel/section-panel.component';
import { WarehouseOperationsFacade } from '../application/warehouse-operations.facade';
import { InventoryCatalogReference } from '../domain/inventory-catalog-reference.models';
import { InventoryLot } from '../domain/warehouse.models';

@Component({
  selector: 'nexa-inventory-lots-page',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    EmptyStateComponent,
    ErrorStateComponent,
    LoadingStateComponent,
    MetricCardComponent,
    NexaIconComponent,
    PageHeaderComponent,
    RouterLink,
    SectionPanelComponent,
    StatusBadgeComponent,
    TranslatePipe,
  ],
  templateUrl: './inventory-lots-page.component.html',
  styleUrl: './inventory-lots-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryLotsPageComponent {
  readonly facade = inject(WarehouseOperationsFacade);
  readonly catalogProducts = signal<readonly InventoryCatalogReference[]>([]);
  readonly search = signal('');
  readonly status = signal('');
  readonly statusOptions = ['AVAILABLE', 'BLOCKED', 'QUARANTINED', 'EXPIRED', 'DEPLETED'] as const;

  readonly filteredLots = computed(() => {
    const query = this.search().trim().toLowerCase();
    const status = this.status();
    return [...this.facade.lots()]
      .filter((lot) => {
        const matchesQuery = !query || this.searchValues(lot).some((value) => value.toLowerCase().includes(query));
        return matchesQuery && (!status || lot.status === status);
      })
      .sort((left, right) => left.expirationDate.localeCompare(right.expirationDate));
  });
  readonly availableLots = computed(() => this.filteredLots().filter((lot) => lot.available > 0).length);
  readonly attentionLots = computed(() => this.filteredLots().filter((lot) => ['BLOCKED', 'QUARANTINED', 'EXPIRED', 'DEPLETED'].includes(lot.status)).length);
  readonly availableUnits = computed(() => this.filteredLots().reduce((total, lot) => total + lot.available, 0));

  constructor() {
    this.facade.load();
    this.facade.activeCatalogItems().subscribe({
      next: (items) => this.catalogProducts.set(items),
      error: () => this.catalogProducts.set([]),
    });
  }

  setSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  setStatus(event: Event): void {
    this.status.set((event.target as HTMLSelectElement).value);
  }

  shortIdentifier(value: string): string {
    return value.length > 14 ? `${value.slice(0, 8).toUpperCase()}…${value.slice(-4).toUpperCase()}` : value;
  }

  catalogName(catalogItemId: string): string {
    return this.catalogProducts().find((item) => item.catalogItemId === catalogItemId)?.name ?? catalogItemId;
  }

  catalogCode(catalogItemId: string): string {
    return this.catalogProducts().find((item) => item.catalogItemId === catalogItemId)?.productCode ?? catalogItemId;
  }

  warehouseName(lot: InventoryLot): string {
    const warehouse = this.facade.warehouses().find((item) => item.id === lot.warehouseId);
    return warehouse?.name ?? this.shortIdentifier(lot.warehouseId);
  }

  warehouseCode(lot: InventoryLot): string {
    const warehouse = this.facade.warehouses().find((item) => item.id === lot.warehouseId);
    return warehouse?.code ?? this.shortIdentifier(lot.warehouseId);
  }

  private searchValues(lot: InventoryLot): readonly string[] {
    return [
      this.catalogName(lot.catalogItemId),
      this.catalogCode(lot.catalogItemId),
      lot.catalogItemId,
      lot.skuId ?? '',
      lot.batchNumber,
      this.warehouseName(lot),
      this.warehouseCode(lot),
      lot.warehouseId,
      lot.zoneId,
    ];
  }

  statusTone(status: string): StatusTone {
    if (status === 'AVAILABLE') return 'success';
    if (status === 'BLOCKED') return 'danger';
    if (status === 'QUARANTINED' || status === 'EXPIRED') return 'warning';
    return 'neutral';
  }
}
