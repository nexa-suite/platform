import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { CustomerRelationshipsApiPort } from '../../customerbuyerrelationships/domain/ports/customer-relationships-api.port';
import { LogisticsApiPort } from '../../fulfillmentdelivery/domain/ports/logistics-api.port';
import { WarehouseOperationsApiPort } from '../../inventoryavailability/domain/ports/warehouse-operations-api.port';
import { SalesCommitmentApiPort } from '../../salescommitment/domain/ports/sales-commitment-api.port';
import { ChangeFeedService } from '../change-feed/application/change-feed.service';
import { PlatformAuthenticationBoundary } from '../security/platform-authentication.boundary';
import { CompanyOwnerExecutiveOverviewFacade } from './company-owner-executive-overview.facade';

const salesPage = { items: [], page: 0, size: 1, totalItems: 7, totalPages: 7, sort: { field: 'createdAt', direction: 'desc' as const } };
const clientPage = { items: [], page: 0, size: 1, totalItems: 3, totalPages: 3, sort: { field: 'commercialName', direction: 'asc' as const } };
const apiPage = { items: [], page: 0, size: 1, total: 4 };
const dashboard = { readyForOperations: 1, preparing: 2, assigned: 3, scheduled: 4, readyForRoute: 5, inRoute: 6, incidents: 2, deliveredToday: 8, temperatureAlerts: 0, podPending: 1, reservationsReady: 1 };

describe('CompanyOwnerExecutiveOverviewFacade', () => {
  function configure(hasPermission: (permission: string) => boolean, sales = { purchaseRequests: vi.fn(() => of(salesPage)), salesOrders: vi.fn(() => of(salesPage)) }) {
    const customers = { clientAccounts: vi.fn(() => of(clientPage)) };
    const warehouse = { warehouses: vi.fn(() => of(apiPage)), lots: vi.fn(() => of(apiPage)) };
    const logistics = { dashboard: vi.fn(() => of(dashboard)) };
    TestBed.configureTestingModule({
      providers: [
        CompanyOwnerExecutiveOverviewFacade,
        { provide: PlatformAuthenticationBoundary, useValue: { hasPermission } },
        { provide: SalesCommitmentApiPort, useValue: sales },
        { provide: CustomerRelationshipsApiPort, useValue: customers },
        { provide: WarehouseOperationsApiPort, useValue: warehouse },
        { provide: LogisticsApiPort, useValue: logistics },
        { provide: ChangeFeedService, useValue: { events: of(), connect: vi.fn() } },
      ],
    });
    return { facade: TestBed.inject(CompanyOwnerExecutiveOverviewFacade), sales, customers, warehouse, logistics };
  }

  it('composes only projections authorized by effective permissions', () => {
    const permission = vi.fn((value: string) => value === 'sales:read');
    const { facade, sales, customers, warehouse, logistics } = configure(permission);

    facade.load();

    expect(facade.snapshot()).toMatchObject({ salesOrders: 7, purchaseRequests: 7, clientAccounts: 3, warehouses: null, inventoryLots: null, activeDispatches: null, dispatchIncidents: null, deliveredToday: null });
    expect(sales.salesOrders).toHaveBeenCalledOnce();
    expect(customers.clientAccounts).toHaveBeenCalledOnce();
    expect(warehouse.warehouses).not.toHaveBeenCalled();
    expect(warehouse.lots).not.toHaveBeenCalled();
    expect(logistics.dashboard).not.toHaveBeenCalled();
  });

  it('exposes operational metrics when warehouse and logistics permissions are present', () => {
    const { facade } = configure(() => true);

    facade.load();

    expect(facade.snapshot()).toMatchObject({ warehouses: 4, inventoryLots: 4, activeDispatches: 21, dispatchIncidents: 2, deliveredToday: 8 });
    expect(facade.error()).toBeNull();
  });

  it('keeps a retryable error state when an authorized projection fails', () => {
    const sales = { purchaseRequests: vi.fn(() => throwError(() => new Error('offline'))), salesOrders: vi.fn(() => throwError(() => new Error('offline'))) };
    const { facade } = configure(() => true, sales);

    facade.load();

    expect(facade.error()).toBe('COMPANY_OWNER_OVERVIEW_LOAD_FAILED');
    expect(facade.loading()).toBe(false);
  });
});
