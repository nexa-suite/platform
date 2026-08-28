import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { afterEach, describe, expect, it } from 'vitest';

import { PLATFORM_RUNTIME_CONFIG } from '../../../core/security/runtime-config';
import { MockWarehouseOperationsApiService } from './mock-warehouse-operations-api.service';

describe('MockWarehouseOperationsApiService', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('keeps warehouse, FEFO preview and reservation state inside BC-05', async () => {
    const service = configure('icisa');

    const lots = await firstValueFrom(service.lots());
    const preview = await firstValueFrom(service.preview('icisa-sales-order-001'));
    const reservation = await firstValueFrom(service.reserve('icisa-sales-order-001', 1));
    const released = await firstValueFrom(service.release(reservation.id, reservation.version, 'Demo release'));

    expect(lots.items).toHaveLength(2);
    expect(preview.salesOrderId).toBe('icisa-sales-order-001');
    expect(preview.lines[0]?.allocations[0]?.expirationDate).toBe('2026-10-15');
    expect(reservation.status).toBe('RESERVED');
    expect(released).toMatchObject({ id: reservation.id, status: 'RELEASED', version: 2 });
  });

  it('returns a concurrency conflict for a stale reservation version', async () => {
    const service = configure('generic');
    const reservation = await firstValueFrom(service.reservations());
    const item = reservation.items[0];

    expect(item).toBeDefined();
    expect(() => service.release(item!.id, item!.version - 1, 'Stale demo command')).toThrow('CONCURRENCY_CONFLICT');
  });

  function configure(tenantProfile: 'generic' | 'icisa'): MockWarehouseOperationsApiService {
    TestBed.configureTestingModule({
      providers: [
        MockWarehouseOperationsApiService,
        { provide: PLATFORM_RUNTIME_CONFIG, useValue: { apiBaseUrl: '', surface: 'PLATFORM', dataMode: 'mock', tenantProfile } },
      ],
    });
    return TestBed.inject(MockWarehouseOperationsApiService);
  }
});
