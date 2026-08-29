import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { EmptyStateComponent } from '../../shared/presentation/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/presentation/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../shared/presentation/components/loading-state/loading-state.component';
import { MetricCardComponent } from '../../shared/presentation/components/metric-card/metric-card.component';
import { NexaIconComponent } from '../../shared/presentation/components/nexa-icon/nexa-icon.component';
import { PageHeaderComponent } from '../../shared/presentation/components/page-header/page-header.component';
import { SectionPanelComponent } from '../../shared/presentation/components/section-panel/section-panel.component';
import { StatusBadgeComponent, type StatusTone } from '../../shared/presentation/components/status-badge/status-badge.component';
import { WarehouseOperationsFacade } from '../application/warehouse-operations.facade';

@Component({
  selector: 'nexa-inventory-reservations-page',
  standalone: true,
  imports: [
    DatePipe,
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
  templateUrl: './inventory-reservations-page.component.html',
  styleUrl: './inventory-reservations-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryReservationsPageComponent {
  readonly facade = inject(WarehouseOperationsFacade);
  readonly search = signal('');
  readonly status = signal('');
  readonly statusOptions = ['RESERVED', 'SHORTAGE', 'RELEASED', 'CONSUMED'] as const;

  readonly filteredReservations = computed(() => {
    const query = this.search().trim().toLowerCase();
    const status = this.status();
    return this.facade.reservations().filter((reservation) => {
      const matchesQuery = !query || [reservation.orderNumber, reservation.salesOrderId, reservation.clientAccountId]
        .some((value) => value?.toLowerCase().includes(query));
      return matchesQuery && (!status || reservation.status === status);
    });
  });
  readonly activeCount = computed(() => this.filteredReservations().filter((reservation) => reservation.status === 'RESERVED').length);
  readonly shortageCount = computed(() => this.filteredReservations().filter((reservation) => reservation.status === 'SHORTAGE').length);
  readonly releasableCount = computed(() => this.filteredReservations().filter((reservation) => reservation.status === 'RESERVED').length);

  constructor() {
    this.facade.load();
  }

  setSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  setStatus(event: Event): void {
    this.status.set((event.target as HTMLSelectElement).value);
  }

  statusTone(status: string): StatusTone {
    if (status === 'RESERVED') return 'info';
    if (status === 'SHORTAGE') return 'danger';
    if (status === 'RELEASED' || status === 'CONSUMED') return 'success';
    return 'neutral';
  }

  release(reservationId: string, version: number): void {
    this.facade.release(reservationId, version, 'Warehouse release');
  }
}
