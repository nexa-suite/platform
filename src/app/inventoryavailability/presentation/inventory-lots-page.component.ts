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
  readonly search = signal('');
  readonly status = signal('');
  readonly statusOptions = ['AVAILABLE', 'BLOCKED', 'QUARANTINED', 'EXPIRED', 'DEPLETED'] as const;

  readonly filteredLots = computed(() => {
    const query = this.search().trim().toLowerCase();
    const status = this.status();
    return this.facade.lots().filter((lot) => {
      const matchesQuery = !query || [lot.catalogItemId, lot.skuId, lot.batchNumber, lot.warehouseId, lot.zoneId]
        .some((value) => value?.toLowerCase().includes(query));
      return matchesQuery && (!status || lot.status === status);
    });
  });
  readonly availableLots = computed(() => this.filteredLots().filter((lot) => lot.available > 0).length);
  readonly attentionLots = computed(() => this.filteredLots().filter((lot) => ['BLOCKED', 'QUARANTINED', 'EXPIRED', 'DEPLETED'].includes(lot.status)).length);
  readonly availableUnits = computed(() => this.filteredLots().reduce((total, lot) => total + lot.available, 0));

  constructor() {
    this.facade.load();
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

  statusTone(status: string): StatusTone {
    if (status === 'AVAILABLE') return 'success';
    if (status === 'BLOCKED') return 'danger';
    if (status === 'QUARANTINED' || status === 'EXPIRED') return 'warning';
    return 'neutral';
  }
}
