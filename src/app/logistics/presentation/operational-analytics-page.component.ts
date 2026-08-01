import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DecimalPipe, PercentPipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { PageHeaderComponent } from '../../shared/presentation/components/page-header/page-header.component';
import { SectionPanelComponent } from '../../shared/presentation/components/section-panel/section-panel.component';
import { LoadingStateComponent } from '../../shared/presentation/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../shared/presentation/components/error-state/error-state.component';
import { LogisticsFacade } from '../application/logistics.facade';

@Component({
  selector: 'nexa-operational-analytics-page', standalone: true,
  imports: [DecimalPipe, PercentPipe, TranslatePipe, PageHeaderComponent, SectionPanelComponent, LoadingStateComponent, ErrorStateComponent],
  template: `<section class="page"><nexa-page-header [title]="'logistics.analytics'|translate" [subtitle]="'logistics.detailSubtitle'|translate"/>
    @if(facade.loading()){<nexa-loading-state/>}@else if(facade.error();as error){<nexa-error-state [title]="'logistics.unavailable'|translate" [description]="error" (retry)="retry()"/>}@else if(facade.analytics();as data){<nexa-section-panel [title]="'logistics.analytics'|translate"><dl><dt>{{'logistics.fields.dispatches'|translate}}</dt><dd>{{data.dispatches}}</dd><dt>{{'logistics.fields.delivered'|translate}}</dt><dd>{{data.delivered}}</dd><dt>{{'logistics.fields.onTime'|translate}}</dt><dd>{{data.onTimeRate|percent}}</dd><dt>{{'logistics.fields.preparation'|translate}}</dt><dd>{{data.averagePreparationMinutes|number:'1.0-1'}} min</dd><dt>{{'logistics.fields.routeDuration'|translate}}</dt><dd>{{data.averageRouteMinutes|number:'1.0-1'}} min</dd><dt>{{'logistics.fields.incidents'|translate}}</dt><dd>{{data.incidents}}</dd><dt>{{'logistics.fields.excursions'|translate}}</dt><dd>{{data.temperatureExcursions}}</dd><dt>{{'logistics.fields.podCompleted'|translate}}</dt><dd>{{data.podCompleted}}</dd></dl></nexa-section-panel>}</section>`,
  styles: [`dl{display:grid;grid-template-columns:max-content 1fr;gap:.5rem 1rem}`], changeDetection: ChangeDetectionStrategy.OnPush
})
export class OperationalAnalyticsPageComponent {
  readonly facade = inject(LogisticsFacade); private readonly end = new Date(); private readonly start = new Date(this.end.getTime() - 30 * 24 * 60 * 60 * 1000);
  constructor() { this.load(); }
  retry(): void { this.load(); }
  private load(): void { this.facade.loadAnalytics(this.start.toISOString(), this.end.toISOString()); }
}
