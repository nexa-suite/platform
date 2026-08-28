import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ButtonComponent } from '../../shared/presentation/components/button/button.component';
import { ErrorStateComponent } from '../../shared/presentation/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../shared/presentation/components/loading-state/loading-state.component';
import { NexaIconComponent } from '../../shared/presentation/components/nexa-icon/nexa-icon.component';
import { PageHeaderComponent } from '../../shared/presentation/components/page-header/page-header.component';
import { LogisticsFacade } from '../application/logistics.facade';
import { DispatchOrder, DispatchStatus } from '../domain/logistics.models';
import { formatDispatchDestination } from './dispatch-destination.util';

type DispatchBoardSort = 'priority' | 'eta' | 'route' | 'client' | 'status' | 'newest';

interface DispatchBoardColumn {
  readonly key: string;
  readonly labelKey: string;
  readonly statuses: readonly DispatchStatus[];
}

const BOARD_COLUMNS: readonly DispatchBoardColumn[] = [
  { key: 'ready_for_operations', labelKey: 'logistics.boardUi.columns.ready_for_operations', statuses: ['READY_FOR_OPERATIONS'] },
  { key: 'preparing', labelKey: 'logistics.boardUi.columns.preparing', statuses: ['PREPARING', 'ASSIGNED', 'SCHEDULED', 'READY_FOR_ROUTE', 'REPROGRAMMED'] },
  { key: 'in_route', labelKey: 'logistics.boardUi.columns.in_route', statuses: ['IN_ROUTE'] },
  { key: 'delivered', labelKey: 'logistics.boardUi.columns.delivered', statuses: ['DELIVERED'] },
  { key: 'incident', labelKey: 'logistics.boardUi.columns.incident', statuses: ['INCIDENT', 'CANCELLED'] },
];

const PRIORITY_RANK: Readonly<Record<string, number>> = { HIGH: 0, NORMAL: 1, MEDIUM: 1, LOW: 2 };

@Component({
  selector: 'nexa-dispatch-board-page',
  standalone: true,
  imports: [DatePipe, ErrorStateComponent, LoadingStateComponent, NexaIconComponent, PageHeaderComponent, ButtonComponent, RouterLink, TranslatePipe],
  templateUrl: './dispatch-board-page.component.html',
  styleUrl: './dispatch-board-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DispatchBoardPageComponent {
  readonly facade = inject(LogisticsFacade);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  readonly search = signal('');
  readonly routeFilter = signal('all');
  readonly sortMode = signal<DispatchBoardSort>('priority');
  readonly filteredDispatches = computed(() => {
    const query = this.search().trim().toLocaleLowerCase();
    const route = this.routeFilter();
    const rows = this.facade.dispatches().filter((item) => {
      if (route !== 'all' && item.assignment?.routeName !== route) return false;
      if (!query) return true;
      return [item.dispatchNumber, item.salesOrderNumber, item.clientName, item.clientCode, this.destinationLabel(item), item.deliveryArea, item.status, item.assignment?.routeName]
        .filter((value): value is string => Boolean(value))
        .some((value) => value.toLocaleLowerCase().includes(query));
    });
    return [...rows].sort((left, right) => this.compare(left, right));
  });
  readonly columns = computed(() => BOARD_COLUMNS.map((column) => ({
    ...column,
    items: this.filteredDispatches().filter((item) => column.statuses.includes(item.status as DispatchStatus)),
  })));
  readonly routes = computed(() => [
    'all',
    ...new Set(this.facade.dispatches().map((item) => item.assignment?.routeName).filter((value): value is string => Boolean(value))),
  ]);

  constructor() { this.facade.load(); }

  setSearch(value: string): void { this.search.set(value); }
  setRoute(value: string): void { this.routeFilter.set(value || 'all'); }
  setSort(value: string): void { this.sortMode.set(value as DispatchBoardSort); }

  clientName(item: DispatchOrder): string { return item.clientName || item.clientCode || item.clientAccountId || '—'; }
  destinationLabel(item: DispatchOrder): string { return formatDispatchDestination(item); }
  routeName(item: DispatchOrder): string { return item.assignment?.routeName || this.translate.instant('logistics.boardUi.routePending'); }
  responsible(item: DispatchOrder): string { return item.assignment?.responsibleDisplayName || this.translate.instant('logistics.boardUi.unassigned'); }
  dateValue(item: DispatchOrder): string | null { return item.eta || item.deliveryWindowStart; }
  temperatureRange(item: DispatchOrder): string {
    if (item.temperatureMin === null && item.temperatureMax === null) return '—';
    const unit = item.temperatureUnit === 'CELSIUS' ? '°C' : item.temperatureUnit ?? '';
    return `${item.temperatureMin ?? '—'} – ${item.temperatureMax ?? '—'} ${unit}`.trim();
  }
  priorityKey(item: DispatchOrder): string {
    const value = item.priority?.toUpperCase();
    return value === 'HIGH' ? 'high' : value === 'LOW' ? 'low' : 'medium';
  }
  statusTone(item: DispatchOrder): string {
    if (item.status === 'DELIVERED') return 'status-delivered';
    if (item.status === 'INCIDENT' || item.status === 'CANCELLED') return 'status-incident';
    if (item.status === 'IN_ROUTE') return 'status-route';
    return 'status-progress';
  }
  isDelayed(item: DispatchOrder): boolean {
    const date = item.eta ? Date.parse(item.eta) : NaN;
    return Number.isFinite(date) && date < Date.now() && !['DELIVERED', 'INCIDENT', 'CANCELLED'].includes(item.status);
  }
  canAdvance(item: DispatchOrder): boolean { return this.facade.canWrite() && this.facade.moveTargets(item).length > 0; }
  moveLabel(item: DispatchOrder): string {
    if (item.status === 'DELIVERED') return 'logistics.boardUi.delivered';
    if (item.status === 'INCIDENT') return 'logistics.boardUi.incidentLocked';
    if (item.status === 'CANCELLED') return 'logistics.boardUi.returnedToSales';
    return 'logistics.boardUi.moveForward';
  }

  openDetail(item: DispatchOrder): void { void this.router.navigate(['/ops/operations/dispatch-orders', item.id]); }

  moveForward(item: DispatchOrder, event?: Event): void {
    event?.stopPropagation();
    const target = this.facade.moveTargets(item)[0];
    if (target) this.facade.moveToStatus(item, target);
  }

  keyboardBoard(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      this.facade.rollbackBoard();
    }
  }

  keyboard(event: KeyboardEvent, item: DispatchOrder): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.openDetail(item);
    }
  }

  private compare(left: DispatchOrder, right: DispatchOrder): number {
    switch (this.sortMode()) {
      case 'eta': return this.time(left.eta) - this.time(right.eta);
      case 'route': return this.text(left.assignment?.routeName).localeCompare(this.text(right.assignment?.routeName));
      case 'client': return this.clientName(left).localeCompare(this.clientName(right));
      case 'status': return left.status.localeCompare(right.status);
      case 'newest': return this.time(right.updatedAt) - this.time(left.updatedAt);
      default: return (PRIORITY_RANK[left.priority?.toUpperCase() ?? ''] ?? 3) - (PRIORITY_RANK[right.priority?.toUpperCase() ?? ''] ?? 3);
    }
  }

  private time(value: string | null): number { return value ? Date.parse(value) : Number.MAX_SAFE_INTEGER; }
  private text(value: string | null | undefined): string { return value ?? ''; }
}
