import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList, CdkDropListGroup } from '@angular/cdk/drag-drop';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { PageHeaderComponent } from '../../shared/presentation/components/page-header/page-header.component';
import { SectionPanelComponent } from '../../shared/presentation/components/section-panel/section-panel.component';
import { LoadingStateComponent } from '../../shared/presentation/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../shared/presentation/components/error-state/error-state.component';
import { downloadCsv, printCurrentView } from '../../shared/application/utilities/export.util';
import { LogisticsFacade } from '../application/logistics.facade';
import { DispatchOrder, DispatchStatus } from '../domain/logistics.models';

const BOARD_STATUSES: readonly DispatchStatus[] = ['READY_FOR_OPERATIONS', 'PREPARING', 'ASSIGNED', 'SCHEDULED', 'READY_FOR_ROUTE', 'IN_ROUTE', 'DELIVERED', 'INCIDENT', 'REPROGRAMMED', 'CANCELLED'];

@Component({
  selector: 'nexa-dispatch-board-page',
  standalone: true,
  imports: [CdkDrag, CdkDragHandle, CdkDropList, CdkDropListGroup, ReactiveFormsModule, RouterLink, TranslatePipe, PageHeaderComponent, SectionPanelComponent, LoadingStateComponent, ErrorStateComponent],
  template: `
    <section class="page" (keydown)="keyboard($event)">
      <nexa-page-header [title]="'logistics.board' | translate" [subtitle]="'logistics.boardSubtitle' | translate">
        <div page-header-actions><button type="button" (click)="exportCsv()">{{ 'logistics.actions.exportCsv' | translate }}</button><button type="button" (click)="print()">{{ 'logistics.actions.print' | translate }}</button></div>
      </nexa-page-header>
      <p class="board-help" role="status">{{ 'logistics.kanban.keyboardHint' | translate }}</p>
      @if (facade.loading()) { <nexa-loading-state /> }
      @else if (facade.error(); as error) { <nexa-error-state [title]="'logistics.unavailable' | translate" [description]="error" (retry)="facade.retry()" /> }
      @else {
        @if (facade.canWrite()) { <nexa-section-panel [title]="'logistics.forms.createDispatch' | translate">
          <form [formGroup]="createForm" (ngSubmit)="create()"><input formControlName="reservationId" [placeholder]="'logistics.forms.reservationId' | translate" [attr.aria-label]="'logistics.forms.reservationId' | translate"><input type="number" formControlName="reservationVersion" min="0" [placeholder]="'logistics.forms.reservationVersion' | translate" [attr.aria-label]="'logistics.forms.reservationVersion' | translate"><button type="submit" [disabled]="createForm.invalid">{{ 'logistics.forms.createDispatch' | translate }}</button></form>
        </nexa-section-panel> } @else { <p class="read-only" role="status">{{ 'logistics.readOnly' | translate }}</p> }
        <nexa-section-panel [title]="'logistics.kanban.title' | translate">
          <div class="kanban" cdkDropListGroup tabindex="0" aria-label="Dispatch kanban">
            @for (column of columns(); track column.status) {
              <section class="kanban-column" [attr.data-status]="column.status" cdkDropList [cdkDropListData]="column.items" [cdkDropListEnterPredicate]="dropPredicate(column.status)" (cdkDropListDropped)="drop($event, column.status)">
                <header><h3>{{ ('logistics.status.' + column.status) | translate }}</h3><span>{{ column.items.length }}</span></header>
                <div class="kanban-items">
                  @for (item of column.items; track item.id) {
                    <article class="kanban-card" cdkDrag [cdkDragData]="item"><a [routerLink]="['/ops/operations/dispatch-orders', item.id]">{{ item.dispatchNumber }}</a><strong>{{ item.salesOrderNumber }}</strong><span>{{ item.destination || '—' }}</span><small>{{ ('logistics.status.' + item.status) | translate }}</small><div class="drag-hint" cdkDragHandle>{{ 'logistics.kanban.drag' | translate }}</div></article>
                  }
                  @if (!column.items.length) { <p class="column-empty">{{ 'logistics.kanban.emptyColumn' | translate }}</p> }
                </div>
              </section>
            }
          </div>
        </nexa-section-panel>
        <nexa-section-panel [title]="'logistics.board' | translate"><table><thead><tr><th>{{ 'logistics.fields.dispatch' | translate }}</th><th>{{ 'logistics.fields.salesOrder' | translate }}</th><th>{{ 'logistics.fields.client' | translate }}</th><th>{{ 'logistics.fields.destination' | translate }}</th><th>{{ 'logistics.fields.route' | translate }}</th><th>{{ 'logistics.fields.window' | translate }}</th><th>{{ 'logistics.fields.status' | translate }}</th><th>{{ 'logistics.fields.alerts' | translate }}</th><th>{{ 'logistics.fields.action' | translate }}</th></tr></thead><tbody>
          @for (item of facade.dispatches(); track item.id) { <tr><td><a [routerLink]="['/ops/operations/dispatch-orders', item.id]">{{ item.dispatchNumber }}</a></td><td>{{ item.salesOrderNumber }}</td><td>{{ item.clientAccountId || '—' }}</td><td>{{ item.destination || '—' }}</td><td>{{ item.assignment?.routeName || '—' }} / {{ item.assignment?.vehicleReference || '—' }}</td><td>{{ item.deliveryWindowStart || '—' }}<br>{{ item.eta || '—' }}</td><td>{{ ('logistics.status.' + item.status) | translate }}</td><td>@if (item.alerts.length) { @for (alert of item.alerts; track alert) { <span>{{ ('logistics.status.' + alert) | translate }}</span> } } @else { — }</td><td>@if (facade.canWrite()) { <button type="button" (click)="facade.prepare(item)" [disabled]="item.status !== 'READY_FOR_OPERATIONS'">{{ 'logistics.actions.startPreparation' | translate }}</button><button type="button" (click)="facade.startRoute(item)" [disabled]="item.status !== 'READY_FOR_ROUTE'">{{ 'logistics.actions.startRoute' | translate }}</button> } @else { <span>{{ 'logistics.readOnly' | translate }}</span> }</td></tr> }
          @empty { <tr><td colspan="9">{{ 'logistics.empty' | translate }}</td></tr> }
        </tbody></table></nexa-section-panel>
      }
    </section>
  `,
  styles: [`form{display:flex;gap:.5rem;flex-wrap:wrap}input{padding:.55rem}table{width:100%;border-collapse:collapse}th,td{padding:.65rem;text-align:left;border-bottom:1px solid #ddd;vertical-align:top}button{margin-right:.4rem}.board-help,.read-only{margin:0}.kanban{display:grid;grid-template-columns:repeat(5,minmax(12rem,1fr));gap:.75rem;overflow-x:auto;padding-bottom:.5rem}.kanban-column{min-height:14rem;padding:.65rem;background:#f8fafc;border:1px solid #dbe3ee;border-radius:.65rem}.kanban-column header{display:flex;align-items:center;justify-content:space-between;gap:.5rem}.kanban-column h3{font-size:.9rem;margin:0}.kanban-column header span{font-weight:700}.kanban-items{display:grid;gap:.5rem;margin-top:.65rem;min-height:10rem}.kanban-card{display:grid;gap:.25rem;padding:.7rem;background:#fff;border:1px solid #dbe3ee;border-radius:.5rem;box-shadow:0 2px 5px #0f172a12}.kanban-card a{font-weight:700}.kanban-card span,.kanban-card small,.drag-hint,.column-empty{color:#64748b;font-size:.8rem}.drag-hint{cursor:grab}.cdk-drag-preview{box-sizing:border-box;padding:.7rem;background:#fff;border:1px solid #0f766e;border-radius:.5rem;box-shadow:0 12px 24px #0f172a33}.cdk-drag-placeholder{opacity:.25}.cdk-drop-list-dragging .kanban-card:not(.cdk-drag-placeholder){transition:transform 150ms ease}@media(max-width:760px){.kanban{grid-template-columns:repeat(2,minmax(10rem,1fr))}table{display:block;overflow-x:auto}}`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DispatchBoardPageComponent {
  readonly facade = inject(LogisticsFacade);
  private readonly fb = inject(FormBuilder);
  readonly createForm = this.fb.nonNullable.group({ reservationId: ['', Validators.required], reservationVersion: [0, [Validators.required, Validators.min(0)]] });
  readonly columns = computed(() => BOARD_STATUSES.map((status) => ({ status, items: this.facade.dispatches().filter((item) => item.status === status) })));

  constructor() { this.facade.load(); }
  create(): void { if (this.createForm.invalid || !this.facade.canWrite()) return; const value = this.createForm.getRawValue(); this.facade.create(value.reservationId.trim(), value.reservationVersion); }
  drop(event: CdkDragDrop<DispatchOrder[]>, target: DispatchStatus): void { const item = event.item.data as DispatchOrder | undefined; if (item) this.facade.moveToStatus(item, target); }
  dropPredicate(target: DispatchStatus): (drag: CdkDrag<DispatchOrder>) => boolean { return (drag) => this.facade.canWrite() && ((drag.data.status === 'READY_FOR_OPERATIONS' && target === 'PREPARING') || (drag.data.status === 'SCHEDULED' && target === 'READY_FOR_ROUTE') || (drag.data.status === 'READY_FOR_ROUTE' && target === 'IN_ROUTE')); }
  keyboard(event: KeyboardEvent): void { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); this.facade.rollbackBoard(); } }
  exportCsv(): void { downloadCsv('nexa-dispatch-board.csv', this.facade.dispatches().map((item) => ({ dispatch: item.dispatchNumber, salesOrder: item.salesOrderNumber, status: item.status, destination: item.destination ?? '', eta: item.eta ?? '' }))); }
  print(): void { printCurrentView(); }
}
