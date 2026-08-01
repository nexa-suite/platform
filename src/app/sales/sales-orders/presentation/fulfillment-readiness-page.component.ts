import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { TranslatePipe } from '@ngx-translate/core';
import { ChangeFeedService } from '../../../core/change-feed/infrastructure/change-feed.service';
import { EmptyStateComponent } from '../../../shared/presentation/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../shared/presentation/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../../shared/presentation/components/loading-state/loading-state.component';
import { PageHeaderComponent } from '../../../shared/presentation/components/page-header/page-header.component';
import { SalesOrdersFacade } from '../application/sales-orders.facade';

@Component({ selector: 'nexa-fulfillment-readiness-page', imports: [MatCardModule, MatChipsModule, TranslatePipe, EmptyStateComponent, ErrorStateComponent, LoadingStateComponent, PageHeaderComponent], templateUrl: './fulfillment-readiness-page.component.html', styleUrl: './sales-orders-page.component.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class FulfillmentReadinessPageComponent {
  readonly facade = inject(SalesOrdersFacade);
  private readonly feed = inject(ChangeFeedService);
  constructor() { this.feed.connect(); this.facade.loadCandidates(); }
  retry(): void { this.facade.retry(); }
}
