import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { WarehouseOperationsFacade } from '../application/warehouse-operations.facade';
import { EmptyStateComponent } from '../../shared/presentation/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/presentation/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../shared/presentation/components/loading-state/loading-state.component';
import { MetricCardComponent } from '../../shared/presentation/components/metric-card/metric-card.component';
import { PageHeaderComponent } from '../../shared/presentation/components/page-header/page-header.component';
import { SectionPanelComponent } from '../../shared/presentation/components/section-panel/section-panel.component';

@Component({
  selector: 'nexa-stock-movements-page',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    EmptyStateComponent,
    ErrorStateComponent,
    LoadingStateComponent,
    MetricCardComponent,
    PageHeaderComponent,
    SectionPanelComponent,
    TranslatePipe,
  ],
  templateUrl: './stock-movements-page.component.html',
  styleUrl: './stock-movements-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StockMovementsPageComponent {
  readonly facade = inject(WarehouseOperationsFacade);
  readonly orderedMovements = computed(() => [...this.facade.movements()].sort((left, right) =>
    Date.parse(right.occurredAt) - Date.parse(left.occurredAt)));
  readonly inboundCount = computed(() =>
    this.facade.movements().filter((movement) => movement.type === 'INBOUND_RECEIPT').length);
  readonly outboundCount = computed(() =>
    this.facade.movements().filter((movement) => movement.type === 'OUTBOUND_CONSUMPTION').length);
  readonly reservationCount = computed(() =>
    this.facade.movements().filter((movement) => movement.type.startsWith('RESERVATION')).length);

  constructor() {
    this.facade.load();
  }

  shortIdentifier(value: string): string {
    return value.length > 12 ? value.slice(0, 8).toUpperCase() : value;
  }

  movementTone(type: string): 'inbound' | 'outbound' | 'reservation' | 'adjustment' {
    if (type === 'INBOUND_RECEIPT') return 'inbound';
    if (type === 'OUTBOUND_CONSUMPTION' || type === 'WASTE') return 'outbound';
    if (type.startsWith('RESERVATION')) return 'reservation';
    return 'adjustment';
  }
}
