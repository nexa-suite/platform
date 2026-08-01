import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { PageHeaderComponent } from '../../shared/presentation/components/page-header/page-header.component';
import { SectionPanelComponent } from '../../shared/presentation/components/section-panel/section-panel.component';
import { LoadingStateComponent } from '../../shared/presentation/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../shared/presentation/components/error-state/error-state.component';
import { LogisticsFacade } from '../application/logistics.facade';

@Component({
  selector: 'nexa-temperature-incidents-page',
  standalone: true,
  imports: [RouterLink, TranslatePipe, PageHeaderComponent, SectionPanelComponent, LoadingStateComponent, ErrorStateComponent],
  template: `
    <section class="page">
      <nexa-page-header [title]="'logistics.temperature' | translate" [subtitle]="'logistics.detailSubtitle' | translate" />
      @if (facade.loading()) { <nexa-loading-state /> }
      @else if (facade.error(); as error) { <nexa-error-state [title]="'logistics.unavailable' | translate" [description]="error" (retry)="facade.retry()" /> }
      @else {
        <nexa-section-panel [title]="'logistics.temperature' | translate">
          <table><thead><tr><th>{{ 'logistics.fields.dispatch' | translate }}</th><th>{{ 'logistics.fields.status' | translate }}</th><th>{{ 'logistics.fields.alerts' | translate }}</th><th>{{ 'logistics.fields.action' | translate }}</th></tr></thead>
            <tbody>@for (item of facade.dispatches(); track item.id) {
              @if (item.temperatureStatus === 'OUT_OF_RANGE' || item.status === 'INCIDENT') {
                <tr><td>{{ item.dispatchNumber }}</td><td>{{ ('logistics.status.' + item.status) | translate }}</td><td>@for (alert of item.alerts; track alert) { {{ ('logistics.status.' + alert) | translate }} } @empty { — }</td><td><a [routerLink]="['/ops/operations/dispatch-orders', item.id]">{{ 'logistics.detail' | translate }}</a></td></tr>
              }
            } @empty { <tr><td colspan="4">{{ 'logistics.empty' | translate }}</td></tr> }</tbody>
          </table>
        </nexa-section-panel>
        <p class="hint">{{ 'logistics.forms.reading' | translate }} · {{ 'logistics.forms.incident' | translate }} · {{ 'logistics.forms.reprogramRoute' | translate }}: {{ 'logistics.detail' | translate }}</p>
      }
    </section>
  `,
  styles: [`table{width:100%;border-collapse:collapse}th,td{padding:.65rem;text-align:left;border-bottom:1px solid #ddd}.hint{margin-top:1rem}`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemperatureIncidentsPageComponent {
  readonly facade = inject(LogisticsFacade);
  constructor() { this.facade.load(); }
}
