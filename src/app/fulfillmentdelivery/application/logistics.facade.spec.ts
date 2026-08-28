import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { PlatformAuthenticationBoundary } from '../../core/security/platform-authentication.boundary';
import { DispatchOrder } from '../domain/logistics.models';
import { LogisticsApiPort } from '../domain/ports/logistics-api.port';
import { LogisticsFacade } from './logistics.facade';

const dispatch = { id: 'dispatch-1', status: 'READY_FOR_OPERATIONS', version: 3, alerts: [] } as unknown as DispatchOrder;

describe('LogisticsFacade', () => {
  it('maps supported Kanban drops to server lifecycle commands and reloads on rollback', () => {
    const api = { prepare: vi.fn(() => of({ ...dispatch, status: 'PREPARING' })), dispatches: vi.fn(() => of({ items: [dispatch] })), events: vi.fn(() => of([])) };
    TestBed.configureTestingModule({ providers: [LogisticsFacade, { provide: LogisticsApiPort, useValue: api }, { provide: PlatformAuthenticationBoundary, useValue: { hasPermission: vi.fn(() => true) } }] });
    const facade = TestBed.inject(LogisticsFacade);

    facade.moveToStatus(dispatch, 'PREPARING');
    facade.rollbackBoard();

    expect(api.prepare).toHaveBeenCalledWith(dispatch);
    expect(api.dispatches).toHaveBeenCalled();
  });

  it('does not expose a logistics mutation to a read-only Company Owner session', () => {
    const api = { prepare: vi.fn(() => of(dispatch)) };
    TestBed.configureTestingModule({ providers: [LogisticsFacade, { provide: LogisticsApiPort, useValue: api }, { provide: PlatformAuthenticationBoundary, useValue: { hasPermission: vi.fn(() => false) } }] });
    const facade = TestBed.inject(LogisticsFacade);

    facade.moveToStatus(dispatch, 'PREPARING');

    expect(api.prepare).not.toHaveBeenCalled();
    expect(facade.error()).toBe('LOGISTICS_WRITE_FORBIDDEN');
  });

  it('exposes only transitions backed by an existing authoritative API command', () => {
    const api = { dispatches: vi.fn(() => of({ items: [dispatch] })) };
    TestBed.configureTestingModule({ providers: [LogisticsFacade, { provide: LogisticsApiPort, useValue: api }, { provide: PlatformAuthenticationBoundary, useValue: { hasPermission: vi.fn(() => true) } }] });
    const facade = TestBed.inject(LogisticsFacade);

    expect(facade.moveTargets(dispatch)).toEqual(['PREPARING']);
    expect(facade.canMove(dispatch, 'PREPARING')).toBe(true);
    expect(facade.canMove(dispatch, 'ASSIGNED')).toBe(false);
  });

  it('reloads the board and exposes a controlled message after a stale ETag', () => {
    const api = {
      prepare: vi.fn(() => throwError(() => ({ status: 412, code: 'CONCURRENCY_CONFLICT' }))),
      dispatches: vi.fn(() => of({ items: [dispatch] })),
    };
    TestBed.configureTestingModule({ providers: [LogisticsFacade, { provide: LogisticsApiPort, useValue: api }, { provide: PlatformAuthenticationBoundary, useValue: { hasPermission: vi.fn(() => true) } }] });
    const facade = TestBed.inject(LogisticsFacade);

    facade.moveToStatus(dispatch, 'PREPARING');

    expect(api.prepare).toHaveBeenCalledWith(dispatch);
    expect(api.dispatches).toHaveBeenCalled();
    expect(facade.error()).toBe('LOGISTICS_CONCURRENCY_CONFLICT');
  });

  it('keeps dashboard failures attributable to the dashboard source', () => {
    const api = { dashboard: vi.fn(() => throwError(() => new Error('unavailable'))) };
    TestBed.configureTestingModule({ providers: [LogisticsFacade, { provide: LogisticsApiPort, useValue: api }, { provide: PlatformAuthenticationBoundary, useValue: { hasPermission: vi.fn(() => true) } }] });
    const facade = TestBed.inject(LogisticsFacade);

    facade.loadDashboard();

    expect(facade.dashboardError()).toBe('No se pudo cargar el dashboard operativo.');
    expect(facade.dispatchesError()).toBeNull();
  });
});
