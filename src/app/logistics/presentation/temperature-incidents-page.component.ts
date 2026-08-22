import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
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
          <div class="table-shell"><table><caption>{{ 'logistics.temperature' | translate }}</caption><thead><tr><th scope="col">{{ 'logistics.fields.dispatch' | translate }}</th><th scope="col">{{ 'logistics.fields.status' | translate }}</th><th scope="col">{{ 'logistics.fields.alerts' | translate }}</th><th scope="col">{{ 'logistics.fields.action' | translate }}</th></tr></thead>
            <tbody>@for (item of incidentDispatches(); track item.id) {
                <tr><td>{{ item.dispatchNumber }}</td><td>{{ ('logistics.status.' + item.status) | translate }}</td><td>@for (alert of item.alerts; track alert) { {{ ('logistics.status.' + alert) | translate }} } @empty { — }</td><td><a [routerLink]="['/ops/operations/dispatch-orders', item.id]">{{ 'logistics.detail' | translate }}</a></td></tr>
            } @empty { <tr><td colspan="4">{{ 'logistics.empty' | translate }}</td></tr> }</tbody>
          </table></div>
        </nexa-section-panel>
        <p class="hint">{{ 'logistics.forms.reading' | translate }} · {{ 'logistics.forms.incident' | translate }} · {{ 'logistics.forms.reprogramRoute' | translate }}: {{ 'logistics.detail' | translate }}</p>
      }
    </section>
  `,
  styles: [`table{width:100%;border-collapse:collapse}th,td{padding:var(--nexa-space-3) var(--nexa-space-4);text-align:left;border-bottom:1px solid var(--nexa-color-border-decorative)}caption{padding:var(--nexa-space-3) var(--nexa-space-4);font-weight:var(--nexa-font-weight-semibold);text-align:left}.hint{margin-top:var(--nexa-space-4);color:var(--nexa-color-text-secondary)}`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemperatureIncidentsPageComponent {
  readonly facade = inject(LogisticsFacade);
  readonly incidentDispatches = computed(() => this.facade.dispatches().filter((item) => item.temperatureStatus === 'OUT_OF_RANGE' || item.status === 'INCIDENT'));
  constructor() { this.facade.load(); }
}
