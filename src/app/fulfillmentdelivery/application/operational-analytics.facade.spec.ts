import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { OperationalAnalyticsFacade } from './operational-analytics.facade';
import { OperationalAnalyticsSourcesPort } from './operational-analytics.sources';

const analytics = {
  from: '2026-08-01T00:00:00.000Z',
  to: '2026-08-31T00:00:00.000Z',
  dispatches: 2,
  delivered: 1,
  incidents: 0,
  temperatureExcursions: 0,
  podCompleted: 1,
  onTimeRate: 1,
  averagePreparationMinutes: 24.5,
  averageRouteMinutes: 12,
};

function providers(overrides: {
  readonly documents?: unknown;
  readonly movements?: unknown;
} = {}) {
  const sources = {
    analytics: vi.fn(() => of(analytics)),
    dashboard: vi.fn(() => of({ temperatureAlerts: 0 })),
    dispatches: vi.fn(() => of({ items: [
      { id: 'dispatch-1', status: 'DELIVERED', assignment: { routeName: 'North' } },
      { id: 'dispatch-2', status: 'PREPARING', assignment: { routeName: null } },
    ], page: 0, size: 100, total: 2 })),
    catalog: vi.fn(() => of({ items: [{ id: 'catalog-1', name: 'Queso' }], totalItems: 50 })),
    documents: vi.fn(() => overrides.documents ?? of({ items: [
      { id: 'document-1', status: 'GENERATED' },
      { id: 'document-2', status: 'GENERATING' },
    ], total: 2 })),
    movements: vi.fn(() => overrides.movements ?? of({ items: [
      { id: 'movement-1', catalogItemId: 'catalog-1', type: 'OUTBOUND_CONSUMPTION', occurredAt: '2026-08-30T00:00:00.000Z', quantity: 2, unit: 'UNIT' },
    ], total: 1 })),
  };

  return [
    OperationalAnalyticsFacade,
    { provide: OperationalAnalyticsSourcesPort, useValue: sources },
  ];
}

describe('OperationalAnalyticsFacade', () => {
  it('aggregates server-backed records into the Design Lab analytics composition', () => {
    TestBed.configureTestingModule({ providers: providers() });
    const facade = TestBed.inject(OperationalAnalyticsFacade);

    facade.load(analytics.from, analytics.to);

    expect(facade.catalogTotal()).toBe(50);
    expect(facade.statusRows()).toEqual([
      { status: 'DELIVERED', count: 1, percent: 50 },
      { status: 'PREPARING', count: 1, percent: 50 },
    ]);
    expect(facade.routeRows()).toEqual([
      { route: 'North', count: 1, percent: 50 },
      { route: null, count: 1, percent: 50 },
    ]);
    expect(facade.documentReadiness()).toBe(50);
    expect(facade.fulfillmentRate()).toBe(50);
    expect(facade.temperatureHealth()).toBe(100);
    expect(facade.catalogName('catalog-1')).toBe('Queso');
    expect(facade.movementDirection('OUTBOUND_CONSUMPTION')).toBe('outbound');
  });

  it('keeps the primary analytics visible and exposes a failed supporting source', () => {
    TestBed.configureTestingModule({ providers: providers({ documents: throwError(() => new Error('forbidden')) }) });
    const facade = TestBed.inject(OperationalAnalyticsFacade);

    facade.load(analytics.from, analytics.to);

    expect(facade.analytics()).toEqual(analytics);
    expect(facade.failedSources()).toContain('documents');
    expect(facade.documentReadiness()).toBeNull();
    expect(facade.hasSourceErrors()).toBe(true);
  });
});
