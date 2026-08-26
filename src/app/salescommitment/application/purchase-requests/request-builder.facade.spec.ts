import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { SalesCommitmentApiPort } from '../../domain/ports/sales-commitment-api.port';
import { SalesCommitmentCatalogPort, SalesCommitmentCustomerPort } from '../../domain/ports/sales-commitment-cross-context.ports';
import { RequestBuilderFacade } from './request-builder.facade';

describe('RequestBuilderFacade', () => {
  it('loads real reference collections and creates through the sales API adapter', () => {
    const request = { id: 'pr-1', code: 'PR-1', status: 'DRAFT', version: 0, lines: [] } as never;
    const customerApi = {
      clientAccounts: vi.fn(() => of({ items: [{ id: 'client-1' }], page: 0, size: 100, totalItems: 1, totalPages: 1, sort: { field: 'commercialName', direction: 'asc' } })),
    };
    const salesApi = {
      createPurchaseRequest: vi.fn(() => of(request))
    };
    const catalogGateway = { search: vi.fn(() => of({ items: [{ id: 'cat-1' }], page: 0, size: 100, totalItems: 1, totalPages: 1 })) };
    TestBed.configureTestingModule({ providers: [RequestBuilderFacade, { provide: SalesCommitmentApiPort, useValue: salesApi }, { provide: SalesCommitmentCustomerPort, useValue: customerApi }, { provide: SalesCommitmentCatalogPort, useValue: catalogGateway }] });
    const facade = TestBed.inject(RequestBuilderFacade);

    facade.loadReferences();
    expect(facade.state().clients).toHaveLength(1);
    expect(facade.state().catalogItems).toHaveLength(1);
    facade.create({ clientAccountId: 'client-1', lines: [{ catalogItemId: 'cat-1', quantity: 2, unit: 'UNIT' }] }).subscribe();

    expect(salesApi.createPurchaseRequest).toHaveBeenCalledWith({ clientAccountId: 'client-1', lines: [{ catalogItemId: 'cat-1', quantity: 2, unit: 'UNIT' }] });
    expect(facade.state().request).toBe(request);
  });
});
