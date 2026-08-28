import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonComponent } from '../../shared/presentation/components/button/button.component';
import { EmptyStateComponent } from '../../shared/presentation/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/presentation/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../shared/presentation/components/loading-state/loading-state.component';
import { MetricCardComponent } from '../../shared/presentation/components/metric-card/metric-card.component';
import { NexaIconComponent } from '../../shared/presentation/components/nexa-icon/nexa-icon.component';
import { PageHeaderComponent } from '../../shared/presentation/components/page-header/page-header.component';
import { SectionPanelComponent } from '../../shared/presentation/components/section-panel/section-panel.component';
import { StatusBadgeComponent } from '../../shared/presentation/components/status-badge/status-badge.component';
import { LogisticsFacade } from '../application/logistics.facade';
import type { DispatchOrder } from '../domain/logistics.models';
import { formatDispatchDestination } from './dispatch-destination.util';

@Component({
  selector: 'nexa-temperature-incidents-page',
  standalone: true,
  imports: [RouterLink, TranslatePipe, ButtonComponent, EmptyStateComponent, ErrorStateComponent, LoadingStateComponent,
    MetricCardComponent, NexaIconComponent, PageHeaderComponent, SectionPanelComponent, StatusBadgeComponent],
  templateUrl: './temperature-incidents-page.component.html',
  styleUrl: './temperature-incidents-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemperatureIncidentsPageComponent {
  readonly facade = inject(LogisticsFacade);
  readonly incidentDispatches = computed(() => this.facade.dispatches().filter((item) => item.temperatureStatus === 'OUT_OF_RANGE' || item.status === 'INCIDENT'));
  readonly outOfRange = computed(() => this.facade.dispatches().filter((item) => item.temperatureStatus === 'OUT_OF_RANGE'));

  constructor() { this.facade.load(); }

  destinationLabel(item: DispatchOrder): string {
    return formatDispatchDestination(item);
  }
}
