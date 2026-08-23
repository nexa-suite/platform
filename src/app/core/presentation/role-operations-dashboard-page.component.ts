import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthenticationService } from '../../iam/application/authentication.service';
import { LogisticsFacade } from '../../logistics/application/logistics.facade';
import { ErrorStateComponent } from '../../shared/presentation/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../shared/presentation/components/loading-state/loading-state.component';
import { MetricCardComponent } from '../../shared/presentation/components/metric-card/metric-card.component';
import { PageHeaderComponent } from '../../shared/presentation/components/page-header/page-header.component';
import { SectionPanelComponent } from '../../shared/presentation/components/section-panel/section-panel.component';
import { WarehouseOperationsFacade } from '../../warehouse/application/warehouse-operations.facade';

@Component({
  selector: 'nexa-role-operations-dashboard-page',
  standalone: true,
  imports: [
    ErrorStateComponent,
    LoadingStateComponent,
    MetricCardComponent,
    PageHeaderComponent,
    RouterLink,
    SectionPanelComponent,
    TranslatePipe,
  ],
  templateUrl: './role-operations-dashboard-page.component.html',
  styleUrl: './role-operations-dashboard-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleOperationsDashboardPageComponent {
  private readonly auth = inject(AuthenticationService);
  readonly warehouse = inject(WarehouseOperationsFacade);
  readonly delivery = inject(LogisticsFacade);
  readonly isDeliveryCoordination = computed(() =>
    this.auth.currentUser()?.roles.includes('LOGISTICS') ?? false);

  constructor() {
    if (this.isDeliveryCoordination()) {
      this.delivery.loadDashboard();
    } else {
      this.warehouse.load();
    }
  }
}
