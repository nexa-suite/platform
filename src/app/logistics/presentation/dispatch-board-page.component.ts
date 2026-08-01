import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { PageHeaderComponent } from '../../shared/presentation/components/page-header/page-header.component';
import { SectionPanelComponent } from '../../shared/presentation/components/section-panel/section-panel.component';
import { LoadingStateComponent } from '../../shared/presentation/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../shared/presentation/components/error-state/error-state.component';
import { LogisticsFacade } from '../application/logistics.facade';

@Component({
  selector: 'nexa-dispatch-board-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, PageHeaderComponent, SectionPanelComponent, LoadingStateComponent, ErrorStateComponent],
  template: `
    <section class="page"><nexa-page-header [title]="'logistics.board' | translate" [subtitle]="'logistics.boardSubtitle' | translate" />
      @if (facade.loading()) { <nexa-loading-state /> }
      @else if (facade.error(); as error) { <nexa-error-state [title]="'logistics.unavailable' | translate" [description]="error" (retry)="facade.retry()" /> }
      @else {
        <nexa-section-panel [title]="'logistics.forms.createDispatch' | translate">
          <form [formGroup]="createForm" (ngSubmit)="create()"><input formControlName="reservationId" [placeholder]="'logistics.forms.reservationId' | translate" [attr.aria-label]="'logistics.forms.reservationId' | translate"><input type="number" formControlName="reservationVersion" min="0" [placeholder]="'logistics.forms.reservationVersion' | translate" [attr.aria-label]="'logistics.forms.reservationVersion' | translate"><button type="submit" [disabled]="createForm.invalid">{{ 'logistics.forms.createDispatch' | translate }}</button></form>
        </nexa-section-panel>
        <nexa-section-panel [title]="'logistics.board' | translate"><table><thead><tr><th>{{ 'logistics.fields.dispatch' | translate }}</th><th>{{ 'logistics.fields.salesOrder' | translate }}</th><th>{{ 'logistics.fields.client' | translate }}</th><th>{{ 'logistics.fields.destination' | translate }}</th><th>{{ 'logistics.fields.route' | translate }}</th><th>{{ 'logistics.fields.window' | translate }}</th><th>{{ 'logistics.fields.status' | translate }}</th><th>{{ 'logistics.fields.alerts' | translate }}</th><th>{{ 'logistics.fields.action' | translate }}</th></tr></thead><tbody>
          @for (item of facade.dispatches(); track item.id) { <tr><td><a [routerLink]="['/ops/operations/dispatch-orders', item.id]">{{ item.dispatchNumber }}</a></td><td>{{ item.salesOrderNumber }}</td><td>{{ item.clientAccountId || '—' }}</td><td>{{ item.destination || '—' }}</td><td>{{ item.assignment?.routeName || '—' }} / {{ item.assignment?.vehicleReference || '—' }}</td><td>{{ item.deliveryWindowStart || '—' }}<br>{{ item.eta || '—' }}</td><td>{{ ('logistics.status.' + item.status) | translate }}</td><td>@if (item.alerts.length) { @for (alert of item.alerts; track alert) { <span>{{ ('logistics.status.' + alert) | translate }}</span> } } @else { — }</td><td><button type="button" (click)="facade.prepare(item)" [disabled]="item.status !== 'READY_FOR_OPERATIONS'">{{ 'logistics.actions.startPreparation' | translate }}</button><button type="button" (click)="facade.startRoute(item)" [disabled]="item.status !== 'READY_FOR_ROUTE'">{{ 'logistics.actions.startRoute' | translate }}</button></td></tr> }
          @empty { <tr><td colspan="9">{{ 'logistics.empty' | translate }}</td></tr> }
        </tbody></table></nexa-section-panel>
      }
    </section>
  `,
  styles: [`form{display:flex;gap:.5rem;flex-wrap:wrap}input{padding:.55rem}table{width:100%;border-collapse:collapse}th,td{padding:.65rem;text-align:left;border-bottom:1px solid #ddd;vertical-align:top}button{margin-right:.4rem}`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DispatchBoardPageComponent {
  readonly facade = inject(LogisticsFacade);
  private readonly fb = inject(FormBuilder);
  readonly createForm = this.fb.nonNullable.group({ reservationId: ['', Validators.required], reservationVersion: [0, [Validators.required, Validators.min(0)]] });
  constructor() { this.facade.load(); }
  create(): void { if (this.createForm.invalid) return; const value = this.createForm.getRawValue(); this.facade.create(value.reservationId.trim(), value.reservationVersion); }
}
