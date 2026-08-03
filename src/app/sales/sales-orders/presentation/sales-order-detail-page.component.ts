import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthenticationService } from '../../../iam/application/authentication.service';
import { ChangeFeedService } from '../../../core/change-feed/infrastructure/change-feed.service';
import { ErrorStateComponent } from '../../../shared/presentation/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../../shared/presentation/components/loading-state/loading-state.component';
import { PageHeaderComponent } from '../../../shared/presentation/components/page-header/page-header.component';
import { downloadCsv, printCurrentView } from '../../../shared/application/utilities/export.util';
import { SalesOrdersFacade } from '../application/sales-orders.facade';

@Component({ selector: 'nexa-sales-order-detail-page', imports: [DecimalPipe, MatButtonModule, MatCardModule, MatChipsModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, RouterLink, TranslatePipe, ErrorStateComponent, LoadingStateComponent, PageHeaderComponent], templateUrl: './sales-order-detail-page.component.html', styleUrl: './sales-order-detail-page.component.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class SalesOrderDetailPageComponent {
  readonly facade = inject(SalesOrdersFacade);
  private readonly authentication = inject(AuthenticationService);
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
}
