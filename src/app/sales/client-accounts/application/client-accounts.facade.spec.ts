import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SalesOperationsApiService } from '../../infrastructure/http/sales-operations-api.service';
import { ClientAccountsFacade } from './client-accounts.facade';

describe('ClientAccountsFacade', () => {
  const page = { items: [{ id: '1', code: 'CLI-001', businessName: 'Business', commercialName: 'Commercial', segment: 'FOOD', contactPerson: 'Carlos', contactEmail: 'carlos@example.com', phone: '+5112345678', deliveryProfile: 'Cold', paymentCondition: 'CREDIT', status: 'ACTIVE', buyerMembershipId: null, version: 0 }], page: 0, size: 25, total: 1 };
  beforeEach(() => TestBed.resetTestingModule());
  it('loads list and detail states', () => {
    const api = { clientAccounts: vi.fn(() => of(page)), clientAccount: vi.fn(() => of(page.items[0])) };
    TestBed.configureTestingModule({ providers: [ClientAccountsFacade, { provide: SalesOperationsApiService, useValue: api }] }); const facade = TestBed.inject(ClientAccountsFacade);
    facade.load('CLI', 'ACTIVE'); expect(facade.state().status).toBe('success'); expect(facade.state().page?.items).toHaveLength(1); facade.loadDetail('1'); expect(facade.state().item?.id).toBe('1');
  });
  it('preserves error and retries list', () => {
    const api = { clientAccounts: vi.fn(() => throwError(() => new Error('offline'))) };
    TestBed.configureTestingModule({ providers: [ClientAccountsFacade, { provide: SalesOperationsApiService, useValue: api }] }); const facade = TestBed.inject(ClientAccountsFacade); facade.load(); expect(facade.state().status).toBe('error'); facade.retry(); expect(api.clientAccounts).toHaveBeenCalledTimes(2);
  });
});
