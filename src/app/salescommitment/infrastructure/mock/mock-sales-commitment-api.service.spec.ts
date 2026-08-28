import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { afterEach, describe, expect, it } from 'vitest';
import { PLATFORM_RUNTIME_CONFIG } from '../../../core/security/runtime-config';
import { MockSalesCommitmentApiService } from './mock-sales-commitment-api.service';

describe('MockSalesCommitmentApiService', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('loads the deterministic ICISA inbox', async () => {
    const service = configure('icisa');
    const page = await firstValueFrom(service.purchaseRequests({
      status: 'SUBMITTED', priority: '', clientAccountId: '', q: '', page: 0, size: 25, sort: 'createdAt', direction: 'desc'
    }));

    expect(page.items).toHaveLength(1);
    expect(page.items[0]?.code).toBe('PR-ICISA-001');
    expect((await firstValueFrom(service.purchaseRequestEvents(page.items[0]!.id))).length).toBeGreaterThan(0);
  });

  it('completes a generic manual-order draft using the existing port contract', async () => {
    const service = configure('generic');
    const draft = await firstValueFrom(service.createManualSalesOrderDraft());
    const withClient = await firstValueFrom(service.updateManualSalesOrderDraftClient(draft.id, draft.version, {
      clientAccountId: 'generic-client-001',
      requestedDeliveryDate: '2026-02-20',
      priority: 'HIGH',
      paymentPreference: 'CREDIT_LINE',
      currency: 'PEN',
      notes: 'Demo order'
    }));
    const withItems = await firstValueFrom(service.replaceManualSalesOrderDraftItems(withClient.id, withClient.version, [{
      catalogItemId: 'generic-catalog-001',
      quantity: 2,
      unit: 'KG',
      notes: null
    }]));
    const withDelivery = await firstValueFrom(service.updateManualSalesOrderDraftDelivery(withItems.id, withItems.version, {
      addressId: 'generic-address-001',
      deliveryNotes: 'Call on arrival',
      routeProvider: 'LOCAL_ESTIMATE'
    }));
    const review = await firstValueFrom(service.reviewManualSalesOrderDraft(withDelivery.id));
    const order = await firstValueFrom(service.submitManualSalesOrderDraft(withDelivery.id, withDelivery.version));

    expect(review.readyToCreate).toBe(true);
    expect(order.status).toBe('PENDING');
    expect(order.clientAccountId).toBe('generic-client-001');
    expect((await firstValueFrom(service.manualSalesOrderDraft(draft.id))).status).toBe('CREATED');
  });

  function configure(tenantProfile: 'generic' | 'icisa'): MockSalesCommitmentApiService {
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_RUNTIME_CONFIG, useValue: { apiBaseUrl: '', surface: 'PLATFORM', dataMode: 'mock', tenantProfile } },
        MockSalesCommitmentApiService
      ]
    });
    return TestBed.inject(MockSalesCommitmentApiService);
  }
});
