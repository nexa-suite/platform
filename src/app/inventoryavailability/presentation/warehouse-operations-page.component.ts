import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { WarehouseOperationsFacade } from '../application/warehouse-operations.facade';
import { PageHeaderComponent } from '../../shared/presentation/components/page-header/page-header.component';
import { SectionPanelComponent } from '../../shared/presentation/components/section-panel/section-panel.component';
import { MetricCardComponent } from '../../shared/presentation/components/metric-card/metric-card.component';
import { LoadingStateComponent } from '../../shared/presentation/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../shared/presentation/components/error-state/error-state.component';

@Component({ selector: 'nexa-warehouse-operations-page', imports: [DatePipe, PageHeaderComponent, SectionPanelComponent, MetricCardComponent, LoadingStateComponent, ErrorStateComponent], templateUrl: './warehouse-operations-page.component.html', styleUrl: './warehouse-operations-page.component.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class WarehouseOperationsPageComponent {
  readonly facade = inject(WarehouseOperationsFacade); readonly mode = inject(ActivatedRoute).snapshot.data['mode'] as string | undefined;
  constructor() { this.facade.load(); }
  title(): string { return ({ dashboard: 'Operations Dashboard', inventory: 'Inventory Control', warehouses: 'Warehouses and Zones', lots: 'Inventory Lots', movements: 'Stock Movements', reservations: 'Reservations', readiness: 'Fulfillment Readiness' } as Record<string, string>)[this.mode ?? 'dashboard'] ?? 'Warehouse Operations'; }
}
