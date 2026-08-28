import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonComponent } from '../../shared/presentation/components/button/button.component';
import { ErrorStateComponent } from '../../shared/presentation/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../shared/presentation/components/loading-state/loading-state.component';
import { MetricCardComponent } from '../../shared/presentation/components/metric-card/metric-card.component';
import { NexaIconComponent } from '../../shared/presentation/components/nexa-icon/nexa-icon.component';
import { PageHeaderComponent } from '../../shared/presentation/components/page-header/page-header.component';
import { SectionPanelComponent } from '../../shared/presentation/components/section-panel/section-panel.component';
import { LogisticsFacade } from '../application/logistics.facade';

@Component({
  selector: 'nexa-operational-analytics-page',
  standalone: true,
  imports: [DecimalPipe, RouterLink, TranslatePipe, ButtonComponent, ErrorStateComponent, LoadingStateComponent,
    MetricCardComponent, NexaIconComponent, PageHeaderComponent, SectionPanelComponent],
  templateUrl: './operational-analytics-page.component.html',
  styleUrl: './operational-analytics-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OperationalAnalyticsPageComponent {
  readonly facade = inject(LogisticsFacade);
  private readonly end = new Date();
  private readonly start = new Date(this.end.getTime() - 30 * 24 * 60 * 60 * 1000);

  constructor() { this.load(); }

  retry(): void { this.load(); }
  rateValue(value: number): number { return Math.min(100, Math.max(0, value <= 1 ? value * 100 : value)); }
  rateLabel(value: number): string { return `${Math.round(this.rateValue(value))}%`; }
  ratio(value: number, total: number): number { return total > 0 ? Math.min(100, Math.max(0, value / total * 100)) : 0; }
  fulfillmentLabel(value: number, total: number): string { return `${Math.round(this.ratio(value, total))}%`; }

  private load(): void { this.facade.loadAnalytics(this.start.toISOString(), this.end.toISOString()); }
}
