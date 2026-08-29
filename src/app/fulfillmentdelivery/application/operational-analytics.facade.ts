import { Injectable, computed, inject, signal } from '@angular/core';
import { catchError, forkJoin, Observable, of } from 'rxjs';
import { DispatchOrder, OperationalAnalytics, OperationsDashboard } from '../domain/logistics.models';
import { OperationalAnalyticsCatalogItem, OperationalAnalyticsDocument, OperationalAnalyticsMovement, OperationalAnalyticsSourcesPort } from './operational-analytics.sources';

export type OperationalAnalyticsSource = 'analytics' | 'dashboard' | 'dispatches' | 'catalog' | 'documents' | 'movements';
export type OperationalAnalyticsSourceErrors = Readonly<Record<OperationalAnalyticsSource, string | null>>;

export interface AnalyticsStatusRow {
  readonly status: string;
  readonly count: number;
  readonly percent: number;
}

export interface AnalyticsRouteRow {
  readonly route: string | null;
  readonly count: number;
  readonly percent: number;
}

const EMPTY_SOURCE_ERRORS: OperationalAnalyticsSourceErrors = {
  analytics: null,
  dashboard: null,
  dispatches: null,
  catalog: null,
  documents: null,
  movements: null,
};

@Injectable()
export class OperationalAnalyticsFacade {
  private readonly sources = inject(OperationalAnalyticsSourcesPort);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly sourceErrors = signal<OperationalAnalyticsSourceErrors>(EMPTY_SOURCE_ERRORS);
  readonly failedSources = computed(() =>
    (Object.keys(this.sourceErrors()) as OperationalAnalyticsSource[]).filter((source) => Boolean(this.sourceErrors()[source])),
  );
  readonly hasSourceErrors = computed(() => this.failedSources().length > 0);

  readonly analytics = signal<OperationalAnalytics | null>(null);
  readonly dashboard = signal<OperationsDashboard | null>(null);
  readonly dispatches = signal<readonly DispatchOrder[]>([]);
  readonly catalogItems = signal<readonly OperationalAnalyticsCatalogItem[]>([]);
  readonly catalogTotal = signal<number | null>(null);
  readonly documents = signal<readonly OperationalAnalyticsDocument[]>([]);
  readonly documentsTotal = signal<number | null>(null);
  readonly movements = signal<readonly OperationalAnalyticsMovement[]>([]);
  readonly movementsTotal = signal<number | null>(null);

  readonly statusRows = computed<readonly AnalyticsStatusRow[]>(() => {
    const counts = new Map<string, number>();
    this.dispatches().forEach((dispatch) => {
      const status = dispatch.status?.trim().toUpperCase() || 'UNKNOWN';
      counts.set(status, (counts.get(status) ?? 0) + 1);
    });
    const total = [...counts.values()].reduce((sum, count) => sum + count, 0);
    return [...counts.entries()]
      .map(([status, count]) => ({ status, count, percent: this.ratio(count, total) }))
      .sort((left, right) => right.count - left.count || left.status.localeCompare(right.status));
  });

  readonly routeRows = computed<readonly AnalyticsRouteRow[]>(() => {
    const counts = new Map<string, number>();
    this.dispatches().forEach((dispatch) => {
      const route = dispatch.assignment?.routeName?.trim() || '';
      counts.set(route, (counts.get(route) ?? 0) + 1);
    });
    const total = [...counts.values()].reduce((sum, count) => sum + count, 0);
    return [...counts.entries()]
      .map(([route, count]) => ({ route: route || null, count, percent: this.ratio(count, total) }))
      .sort((left, right) => {
        if (right.count !== left.count) return right.count - left.count;
        if (left.route === null) return 1;
        if (right.route === null) return -1;
        return left.route.localeCompare(right.route);
      });
  });

  readonly recentMovements = computed(() =>
    [...this.movements()]
      .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt))
      .slice(0, 8),
  );
  readonly catalogTouched = computed(() => new Set(this.movements().map((movement) => movement.catalogItemId)).size);
  readonly generatedDocuments = computed(() =>
    this.documents().filter((document) => document.status.trim().toUpperCase() === 'GENERATED').length,
  );
  readonly documentReadiness = computed<number | null>(() => {
    const total = this.documentsTotal();
    return total === null ? null : this.ratio(this.generatedDocuments(), total);
  });
  readonly fulfillmentRate = computed<number | null>(() => {
    const data = this.analytics();
    return data ? this.ratio(data.delivered, data.dispatches) : null;
  });
  readonly temperatureHealth = computed<number | null>(() => {
    const data = this.analytics();
    if (!data) return null;
    return data.dispatches > 0 ? this.ratio(Math.max(0, data.dispatches - data.temperatureExcursions), data.dispatches) : 100;
  });
  readonly allSourcesUnavailable = computed(() =>
    !this.analytics() && this.failedSources().length === Object.keys(EMPTY_SOURCE_ERRORS).length,
  );

  load(from: string, to: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.sourceErrors.set(EMPTY_SOURCE_ERRORS);

    forkJoin({
      analytics: this.source('analytics', this.sources.analytics(from, to)),
      dashboard: this.source('dashboard', this.sources.dashboard()),
      dispatches: this.source('dispatches', this.sources.dispatches()),
      catalog: this.source('catalog', this.sources.catalog()),
      documents: this.source('documents', this.sources.documents()),
      movements: this.source('movements', this.sources.movements()),
    }).subscribe({
      next: (data) => {
        if (data.analytics) this.analytics.set(data.analytics);
        if (data.dashboard) this.dashboard.set(data.dashboard);
        if (data.dispatches) this.dispatches.set(data.dispatches.items);
        if (data.catalog) {
          this.catalogItems.set(data.catalog.items);
          this.catalogTotal.set(data.catalog.totalItems);
        }
        if (data.documents) {
          this.documents.set(data.documents.items);
          this.documentsTotal.set(data.documents.total);
        }
        if (data.movements) {
          this.movements.set(data.movements.items);
          this.movementsTotal.set(data.movements.total);
        }
        if (this.allSourcesUnavailable()) this.error.set('No se pudo cargar la analítica operativa.');
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar la analítica operativa.');
        this.loading.set(false);
      },
    });
  }

  retry(): void {
    const data = this.analytics();
    const end = data?.to ? new Date(data.to) : new Date();
    const start = data?.from ? new Date(data.from) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    this.load(start.toISOString(), end.toISOString());
  }

  catalogName(catalogItemId: string): string {
    return this.catalogItems().find((item) => item.id === catalogItemId)?.name ?? catalogItemId;
  }

  statusKey(status: string): string {
    const normalized = status.trim().toUpperCase();
    return ['READY_FOR_OPERATIONS', 'PREPARING', 'ASSIGNED', 'SCHEDULED', 'READY_FOR_ROUTE', 'IN_ROUTE', 'DELIVERED', 'INCIDENT', 'REPROGRAMMED', 'CANCELLED'].includes(normalized)
      ? normalized
      : 'UNKNOWN';
  }

  statusTone(status: string): 'success' | 'info' | 'warning' | 'danger' {
    switch (this.statusKey(status)) {
      case 'DELIVERED': return 'success';
      case 'INCIDENT':
      case 'CANCELLED': return 'danger';
      case 'READY_FOR_OPERATIONS':
      case 'PREPARING':
      case 'ASSIGNED':
      case 'SCHEDULED':
      case 'READY_FOR_ROUTE':
      case 'IN_ROUTE': return 'info';
      default: return 'warning';
    }
  }

  movementTypeKey(type: string): string {
    return ['INBOUND_RECEIPT', 'OUTBOUND_CONSUMPTION', 'RESERVATION', 'RESERVATION_CREATED', 'RESERVATION_RELEASE', 'RESERVATION_EXPIRATION', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT', 'WASTE', 'LOT_BLOCKED', 'LOT_QUARANTINED', 'LOT_AVAILABLE'].includes(type)
      ? type
      : '';
  }

  movementDirection(type: string): 'inbound' | 'outbound' | 'neutral' {
    const normalized = type.trim().toUpperCase();
    if (normalized.includes('INBOUND') || normalized.endsWith('_IN') || normalized === 'LOT_AVAILABLE') return 'inbound';
    if (normalized.includes('OUTBOUND') || normalized.endsWith('_OUT') || normalized === 'WASTE') return 'outbound';
    return 'neutral';
  }

  percent(value: number | null): number {
    return value === null ? 0 : Math.min(100, Math.max(0, Math.round(value)));
  }

  percentLabel(value: number | null): string {
    return value === null ? '—' : `${this.percent(value)}%`;
  }

  ringBackground(value: number | null): string {
    return `conic-gradient(var(--nexa-color-primary-600) ${this.percent(value)}%, var(--nexa-color-neutral-200) 0)`;
  }

  maxBarPercent(value: number, rows: readonly { readonly count: number }[]): number {
    const max = Math.max(1, ...rows.map((row) => row.count));
    return Math.max(8, Math.round(value / max * 100));
  }

  private ratio(value: number, total: number): number {
    return total > 0 ? Math.min(100, Math.max(0, Math.round(value / total * 100))) : 0;
  }

  private source<T>(source: OperationalAnalyticsSource, request: Observable<T>): Observable<T | null> {
    return request.pipe(catchError(() => {
      this.sourceErrors.update((errors) => ({ ...errors, [source]: `No se pudo cargar ${source}.` }));
      return of(null);
    }));
  }
}
