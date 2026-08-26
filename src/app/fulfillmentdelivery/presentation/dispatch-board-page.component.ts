import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList, CdkDropListGroup } from '@angular/cdk/drag-drop';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { PageHeaderComponent } from '../../shared/presentation/components/page-header/page-header.component';
import { SectionPanelComponent } from '../../shared/presentation/components/section-panel/section-panel.component';
import { LoadingStateComponent } from '../../shared/presentation/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../shared/presentation/components/error-state/error-state.component';
import { downloadCsv, printCurrentView } from '../../shared/application/utilities/export.util';
import { LogisticsFacade } from '../application/logistics.facade';
import { DispatchOrder, DispatchStatus } from '../domain/logistics.models';

const BOARD_STATUSES: readonly DispatchStatus[] = [
  'READY_FOR_OPERATIONS', 'PREPARING', 'ASSIGNED', 'SCHEDULED', 'READY_FOR_ROUTE',
  'IN_ROUTE', 'DELIVERED', 'INCIDENT', 'REPROGRAMMED', 'CANCELLED',
];

@Component({
  selector: 'nexa-dispatch-board-page',
  standalone: true,
  imports: [CdkDrag, CdkDragHandle, CdkDropList, CdkDropListGroup, RouterLink, TranslatePipe,
    PageHeaderComponent, SectionPanelComponent, LoadingStateComponent, ErrorStateComponent],
  template: `
    <section class="page" (keydown)="keyboard($event)">
      <nexa-page-header [title]="'logistics.board' | translate" [subtitle]="'logistics.boardSubtitle' | translate">
        <div page-header-actions>
          <label class="filter"><span>{{ 'logistics.filters.status' | translate }}</span>
            <select [value]="facade.statusFilter() ?? ''" (change)="filter($event)">
              <option value="">{{ 'logistics.filters.allStatuses' | translate }}</option>
              @for (status of statuses; track status) { <option [value]="status">{{ ('logistics.status.' + status) | translate }}</option> }
            </select>
          </label>
          <button type="button" (click)="exportCsv()">{{ 'logistics.actions.exportCsv' | translate }}</button>
          <button type="button" (click)="print()">{{ 'logistics.actions.print' | translate }}</button>
        </div>
      </nexa-page-header>
      <p class="board-help" role="status">{{ 'logistics.kanban.keyboardHint' | translate }}</p>
      @if (facade.loading()) { <nexa-loading-state /> }
      @else if (facade.error(); as error) { <nexa-error-state [title]="'logistics.unavailable' | translate" [description]="error" (retry)="facade.retry()" /> }
      @else {
        @if (!facade.canWrite()) { <p class="read-only" role="status">{{ 'logistics.readOnly' | translate }}</p> }
        <nexa-section-panel [title]="'logistics.kanban.title' | translate">
          <div class="kanban" cdkDropListGroup aria-label="Dispatch kanban">
            @for (column of columns(); track column.status) {
              <section class="kanban-column" [attr.data-status]="column.status" cdkDropList
                [cdkDropListData]="column.items" [cdkDropListSortingDisabled]="true"
                [cdkDropListEnterPredicate]="dropPredicate(column.status)"
                (cdkDropListDropped)="drop($event, column.status)">
                <header><h3>{{ ('logistics.status.' + column.status) | translate }}</h3><span>{{ column.items.length }}</span></header>
                <div class="kanban-items">
                  @for (item of column.items; track item.id) {
                    <article class="kanban-card" cdkDrag [cdkDragData]="item">
                      <header class="card-heading"><a [routerLink]="['/ops/operations/dispatch-orders', item.id]">{{ item.dispatchNumber }}</a><span class="priority">{{ item.priority || '—' }}</span><button type="button" class="drag-handle drag-hint" cdkDragHandle [attr.aria-label]="'logistics.kanban.drag' | translate">{{ 'logistics.kanban.drag' | translate }}</button></header>
                      <strong>{{ item.salesOrderNumber }}</strong>
                      <span>{{ item.clientName || item.clientCode || item.clientAccountId || '—' }}</span>
                      <span>{{ item.deliveryArea || item.destination || '—' }}</span>
                      <small>{{ item.eta || item.deliveryWindowStart || '—' }}</small>
                      <small>{{ item.temperatureStatus || 'UNKNOWN' }} · {{ item.temperatureMin ?? '—' }} – {{ item.temperatureMax ?? '—' }} {{ item.temperatureUnit || '' }}</small>
                      <small>{{ item.assignment?.responsibleDisplayName || '—' }} · {{ item.assignment?.vehicleReference || '—' }}</small>
                      @if (facade.canWrite() && facade.moveTargets(item).length) {
                        <label class="move-control"><span>{{ 'logistics.actions.moveTo' | translate }}</span>
                          <select [attr.aria-label]="'logistics.actions.moveTo' | translate" (change)="moveFallback(item, $event)">
                            <option value="">{{ 'logistics.actions.chooseStatus' | translate }}</option>
                            @for (target of facade.moveTargets(item); track target) { <option [value]="target">{{ ('logistics.status.' + target) | translate }}</option> }
                          </select>
                        </label>
                      }
                    </article>
                  }
                  @if (!column.items.length) { <p class="column-empty">{{ 'logistics.kanban.emptyColumn' | translate }}</p> }
                </div>
              </section>
            }
          </div>
        </nexa-section-panel>
        <nexa-section-panel [title]="'logistics.board' | translate"><table><thead><tr>
          <th>{{ 'logistics.fields.dispatch' | translate }}</th><th>{{ 'logistics.fields.salesOrder' | translate }}</th>
          <th>{{ 'logistics.fields.client' | translate }}</th><th>{{ 'logistics.fields.destination' | translate }}</th>
          <th>{{ 'logistics.fields.priority' | translate }}</th><th>{{ 'logistics.fields.route' | translate }}</th>
          <th>{{ 'logistics.fields.window' | translate }}</th><th>{{ 'logistics.fields.temperature' | translate }}</th>
          <th>{{ 'logistics.fields.status' | translate }}</th><th>{{ 'logistics.fields.action' | translate }}</th>
        </tr></thead><tbody>
          @for (item of facade.dispatches(); track item.id) { <tr>
            <td><a [routerLink]="['/ops/operations/dispatch-orders', item.id]">{{ item.dispatchNumber }}</a></td>
            <td>{{ item.salesOrderNumber }}</td><td>{{ item.clientName || item.clientCode || item.clientAccountId || '—' }}</td>
            <td>{{ item.deliveryArea || item.destination || '—' }}</td><td>{{ item.priority || '—' }}</td>
            <td>{{ item.assignment?.routeName || '—' }} / {{ item.assignment?.vehicleReference || '—' }}<br>{{ item.assignment?.responsibleDisplayName || '—' }}</td>
            <td>{{ item.deliveryWindowStart || '—' }}<br>{{ item.eta || '—' }}</td>
            <td>{{ item.temperatureStatus || 'UNKNOWN' }}<br>{{ item.temperatureMin ?? '—' }} – {{ item.temperatureMax ?? '—' }} {{ item.temperatureUnit || '' }}</td>
            <td>{{ ('logistics.status.' + item.status) | translate }}@if (item.alerts.length) { <br>@for (alert of item.alerts; track alert) { <small>{{ ('logistics.status.' + alert) | translate }}</small> } }</td>
            <td>@if (facade.canWrite() && facade.moveTargets(item).length) { @for (target of facade.moveTargets(item); track target) { <button type="button" (click)="move(item, target)">{{ actionLabel(target) | translate }}</button> } <select [attr.aria-label]="'logistics.actions.moveTo' | translate" (change)="moveFallback(item, $event)"><option value="">{{ 'logistics.actions.chooseStatus' | translate }}</option>@for (target of facade.moveTargets(item); track target) { <option [value]="target">{{ ('logistics.status.' + target) | translate }}</option> }</select> } @else { <span>{{ 'logistics.actions.detailRequired' | translate }}</span> }</td>
          </tr> } @empty { <tr><td colspan="10">{{ 'logistics.empty' | translate }}</td></tr> }
        </tbody></table></nexa-section-panel>
      }
    </section>
  `,
  styles: [`
    .filter{display:flex;align-items:center;gap:var(--nexa-space-2)}.filter select,select{padding:var(--nexa-space-2);border:1px solid var(--nexa-color-border-interactive);border-radius:var(--nexa-radius-control);background:var(--nexa-surface-card);color:var(--nexa-color-text-primary)}.board-help,.read-only{margin:0;color:var(--nexa-color-text-secondary)}.kanban{display:grid;grid-template-columns:repeat(5,minmax(13rem,1fr));gap:var(--nexa-space-3);overflow-x:auto;padding-bottom:var(--nexa-space-2)}.kanban-column{min-height:14rem;padding:var(--nexa-space-3);background:var(--nexa-surface-inset);border:1px solid var(--nexa-color-border-default);border-radius:var(--nexa-radius-card)}.kanban-column header{display:flex;align-items:center;justify-content:space-between;gap:var(--nexa-space-2)}.kanban-column h3{font-size:var(--nexa-font-size-sm);font-weight:var(--nexa-font-weight-semibold);margin:0;color:var(--nexa-color-text-primary)}.kanban-column header span{font-weight:var(--nexa-font-weight-bold);color:var(--nexa-color-text-secondary)}.kanban-items{display:grid;gap:var(--nexa-space-2);margin-top:var(--nexa-space-3);min-height:10rem}.kanban-card{display:grid;gap:var(--nexa-space-1);padding:var(--nexa-space-3);background:var(--nexa-surface-card);border:1px solid var(--nexa-color-border-default);border-radius:var(--nexa-radius-control);box-shadow:var(--nexa-shadow-xs)}.card-heading{display:flex;justify-content:space-between;gap:var(--nexa-space-2)}.kanban-card a{font-weight:var(--nexa-font-weight-semibold);color:var(--nexa-color-primary-700);text-decoration:none}.kanban-card span,.kanban-card small,.drag-handle,.column-empty{color:var(--nexa-color-text-secondary);font-size:var(--nexa-font-size-xs)}.priority{font-weight:var(--nexa-font-weight-bold)}.drag-handle{cursor:grab;border:0;background:transparent;text-align:left;padding:var(--nexa-space-1) 0;color:var(--nexa-color-text-muted)}.move-control{display:grid;gap:var(--nexa-space-1);font-size:var(--nexa-font-size-xs)}.cdk-drag-preview{box-sizing:border-box;padding:var(--nexa-space-3);background:var(--nexa-surface-card);border:1px solid var(--nexa-color-primary-600);border-radius:var(--nexa-radius-control);box-shadow:var(--nexa-shadow-lg)}.cdk-drag-placeholder{opacity:.25}.cdk-drop-list-dragging .kanban-card:not(.cdk-drag-placeholder){transition:transform var(--nexa-motion-duration-fast) var(--nexa-motion-easing-standard)}table{width:100%;border-collapse:collapse}th,td{padding:var(--nexa-space-3);text-align:left;border-bottom:1px solid var(--nexa-color-border-decorative);vertical-align:top;color:var(--nexa-color-text-primary)}th{font-size:var(--nexa-font-size-xs);font-weight:var(--nexa-font-weight-bold);color:var(--nexa-color-text-secondary);text-transform:uppercase}button{margin-right:var(--nexa-space-2)}@media(max-width:760px){.kanban{grid-template-columns:repeat(2,minmax(0,1fr));overflow-x:hidden}.kanban-column,.kanban-card{min-width:0}.card-heading{min-width:0;flex-wrap:wrap}.card-heading a{min-width:0;overflow-wrap:anywhere}.drag-handle{flex:0 0 auto}table{display:block;overflow-x:auto}}
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DispatchBoardPageComponent {
  readonly facade = inject(LogisticsFacade);
  readonly statuses = BOARD_STATUSES;
  readonly columns = computed(() => BOARD_STATUSES.map((status) => ({
    status,
    items: this.facade.dispatches().filter((item) => item.status === status),
  })));

  constructor() { this.facade.load(); }

  filter(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.facade.setStatusFilter(value ? value as DispatchStatus : null);
  }

  drop(event: CdkDragDrop<DispatchOrder[]>, target: DispatchStatus): void {
    const item = event.item.data as DispatchOrder | undefined;
    if (item && this.facade.canMove(item, target)) this.facade.moveToStatus(item, target);
  }

  dropPredicate(target: DispatchStatus): (drag: CdkDrag<DispatchOrder>) => boolean {
    return (drag) => this.facade.canWrite() && this.facade.canMove(drag.data, target);
  }

  moveFallback(item: DispatchOrder, event: Event): void {
    const select = event.target as HTMLSelectElement;
    const target = select.value as DispatchStatus;
    select.value = '';
    if (target && this.facade.canMove(item, target)) this.facade.moveToStatus(item, target);
  }

  move(item: DispatchOrder, target: DispatchStatus): void {
    if (this.facade.canMove(item, target)) this.facade.moveToStatus(item, target);
  }

  actionLabel(target: DispatchStatus): string {
    switch (target) {
      case 'PREPARING': return 'logistics.actions.startPreparation';
      case 'READY_FOR_ROUTE': return 'logistics.actions.ready';
      case 'IN_ROUTE': return 'logistics.actions.startRoute';
      default: return 'logistics.actions.moveTo';
    }
  }

  keyboard(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      this.facade.rollbackBoard();
    }
  }

  exportCsv(): void {
    downloadCsv('nexa-dispatch-board.csv', this.facade.dispatches().map((item) => ({
      dispatch: item.dispatchNumber, salesOrder: item.salesOrderNumber, client: item.clientName ?? item.clientCode ?? '',
      destination: item.deliveryArea ?? item.destination ?? '', priority: item.priority ?? '', status: item.status,
      scheduled: item.eta ?? item.deliveryWindowStart ?? '', temperature: item.temperatureStatus,
      assignee: item.assignment?.responsibleDisplayName ?? '', vehicle: item.assignment?.vehicleReference ?? '',
    })));
  }

  print(): void { printCurrentView(); }
}
