import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { PlatformAuthenticationBoundary } from '../../../core/security/platform-authentication.boundary';
import { ChangeFeedService } from '../../../core/change-feed/application/change-feed.service';
import { ButtonComponent } from '../../../shared/presentation/components/button/button.component';
import { EmptyStateComponent } from '../../../shared/presentation/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../shared/presentation/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../../shared/presentation/components/loading-state/loading-state.component';
import { NexaIconComponent } from '../../../shared/presentation/components/nexa-icon/nexa-icon.component';
import { PageHeaderComponent } from '../../../shared/presentation/components/page-header/page-header.component';
import { SectionPanelComponent } from '../../../shared/presentation/components/section-panel/section-panel.component';
import { StatusBadgeComponent, StatusTone } from '../../../shared/presentation/components/status-badge/status-badge.component';
import { downloadCsv, printCurrentView } from '../../../shared/application/utilities/export.util';
import { SalesOrdersFacade } from '../../application/sales-orders/sales-orders.facade';
import { SalesOrderStatus } from '../../domain/sales-orders/sales-order.models';

@Component({ selector: 'nexa-sales-order-detail-page', imports: [DecimalPipe, ReactiveFormsModule, RouterLink, TranslatePipe, ButtonComponent, EmptyStateComponent, ErrorStateComponent, LoadingStateComponent, NexaIconComponent, PageHeaderComponent, SectionPanelComponent, StatusBadgeComponent], templateUrl: './sales-order-detail-page.component.html', styleUrl: './sales-order-detail-page.component.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class SalesOrderDetailPageComponent {
  readonly facade = inject(SalesOrdersFacade);
  private readonly authentication = inject(PlatformAuthenticationBoundary);
  readonly reason = new FormControl('', { nonNullable: true });
  readonly canWrite = computed(() => this.authentication.hasPermission('sales:write'));
  private readonly feed = inject(ChangeFeedService);
  private readonly id: string | null;
  constructor() { this.id = inject(ActivatedRoute).snapshot.paramMap.get('salesOrderId'); this.feed.connect(); if (this.id) this.facade.loadDetail(this.id); }
  confirm(): void { const item = this.facade.state().item; if (item) this.facade.confirm(item.id, item.version); }
  reject(): void { const item = this.facade.state().item; if (item) this.facade.reject(item.id, item.version, this.reason.value); }
  cancel(): void { const item = this.facade.state().item; if (item) this.facade.cancel(item.id, item.version, this.reason.value); }
  retry(): void { this.facade.retry(); }
  exportCsv(): void { const order = this.facade.state().item; if (order) downloadCsv(`nexa-${order.number}.csv`, order.lines.map((line) => ({ item: line.itemName, quantity: line.quantity, unit: line.unit, price: line.unitPriceAmount ?? '', currency: line.unitPriceCurrency ?? '' }))); }
  print(): void { printCurrentView(); }
  statusTone(status: SalesOrderStatus): StatusTone {
    if (status === 'CONFIRMED') return 'success';
    if (status === 'REJECTED' || status === 'CANCELLED') return 'danger';
    return 'warning';
  }
  priorityTone(priority: 'NORMAL' | 'HIGH' | 'URGENT'): StatusTone { return priority === 'URGENT' ? 'danger' : priority === 'HIGH' ? 'warning' : 'neutral'; }
}
