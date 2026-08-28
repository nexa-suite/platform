import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { afterEach, describe, expect, it } from 'vitest';

import { PLATFORM_RUNTIME_CONFIG } from '../../../core/security/runtime-config';
import { MockLogisticsApiService } from './mock-logistics-api.service';

describe('MockLogisticsApiService', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('runs a dispatch through operational statuses and records POD evidence', async () => {
    const service = configure('icisa');
    let dispatch = (await firstValueFrom(service.detail('icisa-dispatch-001')));

    dispatch = await firstValueFrom(service.prepare(dispatch));
    dispatch = await firstValueFrom(service.assign(dispatch, { responsibleMembershipId: 'icisa-membership-logistics-001', vehicleReference: 'TRK-ICISA-01', routeName: 'Ruta Callao' }));
    dispatch = await firstValueFrom(service.schedule(dispatch, { deliveryWindowStart: '2026-08-28T09:00:00Z', deliveryWindowEnd: '2026-08-28T12:00:00Z', eta: '2026-08-28T10:30:00Z' }));
    dispatch = await firstValueFrom(service.ready(dispatch));
    dispatch = await firstValueFrom(service.startRoute(dispatch));
    dispatch = await firstValueFrom(service.temperature(dispatch, { value: 12, unit: 'CELSIUS', source: 'demo-sensor' }));
    dispatch = await firstValueFrom(service.incident(dispatch, { type: 'TEMPERATURE', severity: 'HIGH', buyerVisible: true, description: 'Demo excursion' }));
    dispatch = await firstValueFrom(service.complete(dispatch, { receiverName: 'María ICISA', completedAt: '2026-08-28T11:00:00Z', notes: 'Received in demo.', photoEvidenceDeclared: true, signatureEvidenceDeclared: true }));

    const events = await firstValueFrom(service.events(dispatch.id));
    const proof = await firstValueFrom(service.proof('COMPLETED'));

    expect(dispatch).toMatchObject({ status: 'DELIVERED', podStatus: 'COMPLETED', temperatureStatus: 'EXCURSION' });
    expect(events.some((event) => event.toStatus === 'DELIVERED' && event.buyerVisible)).toBe(true);
    expect(proof.items).toContainEqual(expect.objectContaining({ dispatchOrderId: dispatch.id, receiverName: 'María ICISA', photoEvidenceDeclared: true }));
  });

  it('rejects a stale dispatch command without mutating the stored item', async () => {
    const service = configure('generic');
    const dispatch = await firstValueFrom(service.detail('generic-dispatch-001'));

    await expect(firstValueFrom(service.prepare({ ...dispatch, version: dispatch.version - 1 }))).rejects.toThrow('CONCURRENCY_CONFLICT');
    await expect(firstValueFrom(service.detail(dispatch.id))).resolves.toMatchObject({ status: 'READY_FOR_OPERATIONS', version: dispatch.version });
  });

  function configure(tenantProfile: 'generic' | 'icisa'): MockLogisticsApiService {
    TestBed.configureTestingModule({
      providers: [
        MockLogisticsApiService,
        { provide: PLATFORM_RUNTIME_CONFIG, useValue: { apiBaseUrl: '', surface: 'PLATFORM', dataMode: 'mock', tenantProfile } },
      ],
    });
    return TestBed.inject(MockLogisticsApiService);
  }
});
