import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { AuthenticationService } from '../../iam/application/authentication.service';
import { DispatchOrder } from '../domain/logistics.models';
import { LogisticsApiService } from '../infrastructure/logistics-api.service';
import { LogisticsFacade } from './logistics.facade';

const dispatch = { id: 'dispatch-1', status: 'READY_FOR_OPERATIONS', version: 3, alerts: [] } as unknown as DispatchOrder;

describe('LogisticsFacade', () => {
  it('maps supported Kanban drops to server lifecycle commands and reloads on rollback', () => {
    const api = { prepare: vi.fn(() => of({ ...dispatch, status: 'PREPARING' })), dispatches: vi.fn(() => of({ items: [dispatch] })), events: vi.fn(() => of([])) };
    TestBed.configureTestingModule({ providers: [LogisticsFacade, { provide: LogisticsApiService, useValue: api }, { provide: AuthenticationService, useValue: { hasPermission: vi.fn(() => true) } }] });
    const facade = TestBed.inject(LogisticsFacade);

    facade.moveToStatus(dispatch, 'PREPARING');
    facade.rollbackBoard();

    expect(api.prepare).toHaveBeenCalledWith(dispatch);
    expect(api.dispatches).toHaveBeenCalled();
  });

  it('does not expose a logistics mutation to a read-only Company Owner session', () => {
    const api = { prepare: vi.fn(() => of(dispatch)) };
    TestBed.configureTestingModule({ providers: [LogisticsFacade, { provide: LogisticsApiService, useValue: api }, { provide: AuthenticationService, useValue: { hasPermission: vi.fn(() => false) } }] });
    const facade = TestBed.inject(LogisticsFacade);

    facade.moveToStatus(dispatch, 'PREPARING');

    expect(api.prepare).not.toHaveBeenCalled();
    expect(facade.error()).toBe('LOGISTICS_WRITE_FORBIDDEN');
  });
});
