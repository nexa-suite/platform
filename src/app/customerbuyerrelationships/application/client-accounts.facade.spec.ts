import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CustomerRelationshipsApiPort } from '../domain/ports/customer-relationships-api.port';
import { ClientAccountsFacade } from './client-accounts.facade';
import { DEFAULT_CLIENT_ACCOUNT_FILTERS } from '../domain/client-account.models';

describe('ClientAccountsFacade', () => {
  const page = { items: [{ id: '1', code: 'CLI-001', businessName: 'Business', commercialName: 'Commercial', segment: 'FOOD', contactPerson: 'Carlos', contactEmail: 'carlos@example.com', phone: '+5112345678', deliveryProfile: 'Cold', paymentCondition: 'CREDIT', status: 'ACTIVE', buyerMembershipId: null, version: 0 }], page: 0, size: 25, totalItems: 1, totalPages: 1, sort: { field: 'commercialName', direction: 'asc' as const } };
  beforeEach(() => TestBed.resetTestingModule());
  it('loads list and detail states', () => {
    const api = { clientAccounts: vi.fn(() => of(page)), clientAccount: vi.fn(() => of(page.items[0])) };
    TestBed.configureTestingModule({ providers: [ClientAccountsFacade, { provide: CustomerRelationshipsApiPort, useValue: api }] }); const facade = TestBed.inject(ClientAccountsFacade);
    facade.load({ ...DEFAULT_CLIENT_ACCOUNT_FILTERS, q: 'CLI', status: 'ACTIVE' }); expect(facade.state().status).toBe('success'); expect(facade.state().page?.items).toHaveLength(1); facade.loadDetail('1'); expect(facade.state().item?.id).toBe('1');
  });
  it('preserves error and retries list', () => {
    const api = { clientAccounts: vi.fn(() => throwError(() => new Error('offline'))) };
    TestBed.configureTestingModule({ providers: [ClientAccountsFacade, { provide: CustomerRelationshipsApiPort, useValue: api }] }); const facade = TestBed.inject(ClientAccountsFacade); facade.load(); expect(facade.state().status).toBe('error'); facade.retry(); expect(api.clientAccounts).toHaveBeenCalledTimes(2);
  });
});
