import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonComponent } from '../../shared/presentation/components/button/button.component';
import { ErrorStateComponent } from '../../shared/presentation/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../shared/presentation/components/loading-state/loading-state.component';
import { MetricCardComponent } from '../../shared/presentation/components/metric-card/metric-card.component';
import { NexaIconComponent } from '../../shared/presentation/components/nexa-icon/nexa-icon.component';
import { PageHeaderComponent } from '../../shared/presentation/components/page-header/page-header.component';
import { OperationalAnalyticsFacade } from '../application/operational-analytics.facade';

@Component({
  selector: 'nexa-operational-analytics-page',
  standalone: true,
  imports: [DatePipe, DecimalPipe, RouterLink, TranslatePipe, ButtonComponent, ErrorStateComponent, LoadingStateComponent,
    MetricCardComponent, NexaIconComponent, PageHeaderComponent],
  templateUrl: './operational-analytics-page.component.html',
  styleUrl: './operational-analytics-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OperationalAnalyticsPageComponent {
  readonly facade = inject(OperationalAnalyticsFacade);
  private readonly end = new Date();
  private readonly start = new Date(this.end.getTime() - 30 * 24 * 60 * 60 * 1000);

  constructor() { this.load(); }

  retry(): void { this.facade.retry(); }

  private load(): void { this.facade.load(this.start.toISOString(), this.end.toISOString()); }
}
