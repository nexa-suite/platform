import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PlatformAuthenticationBoundary } from '../../core/security/platform-authentication.boundary';
import { InventoryCatalogPort, SalesOrderVersionPort } from '../domain/ports/inventory-cross-context.ports';
import { WarehouseOperationsApiPort } from '../domain/ports/warehouse-operations-api.port';
import { WarehouseOperationsFacade } from './warehouse-operations.facade';

const page = { items: [], page: 0, size: 100, total: 0 };

describe('WarehouseOperationsFacade', () => {
  afterEach(() => TestBed.resetTestingModule());

  function configure(api: Partial<Record<keyof WarehouseOperationsApiPort, ReturnType<typeof vi.fn>>>) {
    TestBed.configureTestingModule({
      providers: [
        WarehouseOperationsFacade,
        { provide: WarehouseOperationsApiPort, useValue: api },
        { provide: InventoryCatalogPort, useValue: { activeItems: vi.fn(() => of([])) } },
        { provide: SalesOrderVersionPort, useValue: { currentVersion: vi.fn(() => of(1)) } },
        { provide: PlatformAuthenticationBoundary, useValue: { hasPermission: vi.fn(() => false) } },
      ],
    });
    return TestBed.inject(WarehouseOperationsFacade);
  }

  it('preserves successful API sources and attributes a partial failure', () => {
    const facade = configure({
      warehouses: vi.fn(() => of({ ...page, items: [{ id: 'warehouse-1' }] })),
      lots: vi.fn(() => throwError(() => new Error('lots unavailable'))),
      movements: vi.fn(() => of(page)),
      reservations: vi.fn(() => of(page)),
    });

    facade.load();

    expect(facade.warehouses()).toHaveLength(1);
    expect(facade.sourceErrors()).toMatchObject({ lots: 'WAREHOUSE_LOTS_LOAD_FAILED' });
    expect(facade.hasSourceErrors()).toBe(true);
    expect(facade.error()).toBeNull();
    expect(facade.loading()).toBe(false);
  });

  it('keeps a retryable full error when every warehouse API source fails', () => {
    const api = {
      warehouses: vi.fn(() => throwError(() => new Error('offline'))),
      lots: vi.fn(() => throwError(() => new Error('offline'))),
      movements: vi.fn(() => throwError(() => new Error('offline'))),
      reservations: vi.fn(() => throwError(() => new Error('offline'))),
    };
    const facade = configure(api);

    facade.load();

    expect(facade.error()).toBe('No se pudo cargar la operación de almacén.');
    expect(facade.hasSourceErrors()).toBe(true);
    expect(facade.loading()).toBe(false);
  });
});
