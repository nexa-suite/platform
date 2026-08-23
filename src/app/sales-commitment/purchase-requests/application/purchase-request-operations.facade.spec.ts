import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SalesCommitmentApiService } from '../../infrastructure/http/sales-commitment-api.service';
import { PurchaseRequestOperationsFacade } from './purchase-request-operations.facade';
import { DEFAULT_PURCHASE_REQUEST_FILTERS } from '../domain/purchase-request.models';

describe('PurchaseRequestOperationsFacade', () => {
  const item = { id: 'PR-1', code: 'PR-0001', clientAccountId: 'CLI-1', buyerMembershipId: 'M-1', status: 'SUBMITTED' as const, priority: 'NORMAL', requestedDeliveryDate: null, deliveryProfileSnapshot: null, paymentOption: null, comment: null, reviewNote: null, lines: [], version: 0 };
  const page = { items: [item], page: 0, size: 25, total: 1 };
  beforeEach(() => TestBed.resetTestingModule());
  it('loads inbox, detail and review action', () => {
    const api = { purchaseRequests: vi.fn(() => of(page)), purchaseRequest: vi.fn(() => of(item)), purchaseRequestEvents: vi.fn(() => of([])), transitionPurchaseRequest: vi.fn(() => of({ ...item, status: 'IN_REVIEW' as const })) };
    TestBed.configureTestingModule({ providers: [PurchaseRequestOperationsFacade, { provide: SalesCommitmentApiService, useValue: api }] }); const facade = TestBed.inject(PurchaseRequestOperationsFacade); facade.load({ ...DEFAULT_PURCHASE_REQUEST_FILTERS, status: 'SUBMITTED' }); expect(facade.state().status).toBe('success'); facade.loadDetail('PR-1'); facade.transition('PR-1', 0, 'reviews'); expect(facade.state().item?.status).toBe('IN_REVIEW');
  });
  it('exposes retryable inbox error', () => {
    const api = { purchaseRequests: vi.fn(() => throwError(() => new Error('offline'))), purchaseRequestEvents: vi.fn(() => of([])) };
    TestBed.configureTestingModule({ providers: [PurchaseRequestOperationsFacade, { provide: SalesCommitmentApiService, useValue: api }] }); const facade = TestBed.inject(PurchaseRequestOperationsFacade); facade.load(); expect(facade.state().status).toBe('error'); facade.retry(); expect(api.purchaseRequests).toHaveBeenCalledTimes(2);
  });
});
