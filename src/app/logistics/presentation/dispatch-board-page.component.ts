import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHeaderComponent } from '../../shared/presentation/components/page-header/page-header.component';
import { SectionPanelComponent } from '../../shared/presentation/components/section-panel/section-panel.component';
import { LoadingStateComponent } from '../../shared/presentation/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../shared/presentation/components/error-state/error-state.component';
import { LogisticsFacade } from '../application/logistics.facade';

@Component({
  selector: 'nexa-dispatch-board-page',
  standalone: true,
  imports: [RouterLink, PageHeaderComponent, SectionPanelComponent, LoadingStateComponent, ErrorStateComponent],
  template: `
    <section class="page"><nexa-page-header title="Dispatch Board" subtitle="Authoritative lifecycle commands use If-Match and refresh server state" />
      @if (facade.loading()) { <nexa-loading-state /> }
      @else if (facade.error(); as error) { <nexa-error-state title="Dispatch board unavailable" [description]="error" (retry)="facade.retry()" /> }
      @else { <nexa-section-panel title="Dispatch Orders"><table><thead><tr><th>Dispatch</th><th>Sales Order</th><th>Client Account</th><th>Destination</th><th>Route / vehicle</th><th>Window / ETA</th><th>Status</th><th>Alerts</th><th>Action</th></tr></thead><tbody>
        @for (item of facade.dispatches(); track item.id) { <tr><td><a [routerLink]="['/ops/operations/dispatch-orders', item.id]">{{ item.dispatchNumber }}</a></td><td>{{ item.salesOrderNumber }}</td><td>{{ item.clientAccountId }}</td><td>{{ item.destination || '—' }}</td><td>{{ item.assignment?.routeName || '—' }} / {{ item.assignment?.vehicleReference || '—' }}</td><td>{{ item.deliveryWindowStart || '—' }}<br>{{ item.eta || '—' }}</td><td>{{ item.status }}</td><td>{{ item.alerts.join(', ') || '—' }}</td><td><button type="button" (click)="facade.prepare(item)" [disabled]="item.status !== 'READY_FOR_OPERATIONS'">Start preparation</button><button type="button" (click)="facade.startRoute(item)" [disabled]="item.status !== 'READY_FOR_ROUTE'">Start route</button></td></tr> }
        @empty { <tr><td colspan="9">No dispatch orders found.</td></tr> }
      </tbody></table></nexa-section-panel> }
    </section>
  `,
  styles: [`table{width:100%;border-collapse:collapse}th,td{padding:.65rem;text-align:left;border-bottom:1px solid #ddd;vertical-align:top}button{margin-right:.4rem}`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DispatchBoardPageComponent { readonly facade = inject(LogisticsFacade); constructor() { this.facade.load(); } }
