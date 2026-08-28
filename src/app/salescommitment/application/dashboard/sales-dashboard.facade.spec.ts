import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { SalesCommitmentApiPort } from '../../domain/ports/sales-commitment-api.port';
import { DEFAULT_PURCHASE_REQUEST_FILTERS } from '../../domain/purchase-requests/purchase-request.models';
import { DEFAULT_SALES_ORDER_FILTERS } from '../../domain/sales-orders/sales-order.models';
import { SalesDashboardFacade } from './sales-dashboard.facade';

const page = { items: [{ id: 'PR-1', code: 'PR-1', status: 'SUBMITTED', clientAccountId: 'C-1', buyerMembershipId: 'B-1', priority: 'NORMAL', requestedDeliveryDate: null, lineCount: 1, deliveryProfileSnapshot: null, paymentOption: null, comment: null, reviewNote: null, lines: [], version: 0 }], page: 0, size: 5, totalItems: 1, totalPages: 1, sort: { field: 'createdAt', direction: 'desc' as const } };
const orders = { items: [{ id: 'SO-1', number: 'SO-1', status: 'PENDING', purchaseRequestId: 'PR-1', clientAccountId: 'C-1', createdByMembershipId: 'M-1', buyerMembershipId: 'B-1', clientAccountName: 'Client', priority: 'NORMAL', requestedDeliveryDate: null, deliverySnapshot: null, paymentOption: null, notes: null, currency: 'PEN', total: 1, tenantId: 'T-1', workspaceId: 'W-1', lines: [], version: 0, createdAt: '', updatedAt: '', confirmedAt: null, rejectedAt: null, cancelledAt: null }], page: 0, size: 5, totalItems: 1, totalPages: 1, sort: { field: 'createdAt', direction: 'desc' as const } };

describe('SalesDashboardFacade', () => {
  it('renders server-backed metrics and recent resources', () => {
    const api = { purchaseRequests: vi.fn(() => of(page)), salesOrders: vi.fn(() => of(orders)) };
    TestBed.configureTestingModule({ providers: [SalesDashboardFacade, { provide: SalesCommitmentApiPort, useValue: api }] });
    const facade = TestBed.inject(SalesDashboardFacade); facade.load();
    expect(facade.state().status).toBe('success');
    expect(facade.state().metrics.submittedPurchaseRequests).toBe(1);
    expect(facade.state().recentSalesOrders[0].id).toBe('SO-1');
    expect(api.purchaseRequests).toHaveBeenCalledWith(expect.objectContaining({ ...DEFAULT_PURCHASE_REQUEST_FILTERS, size: 1, status: 'SUBMITTED' }));
    expect(api.salesOrders).toHaveBeenCalledWith(expect.objectContaining({ ...DEFAULT_SALES_ORDER_FILTERS, size: 1, status: 'PENDING' }));
  });

  it('keeps a recoverable error state and retries', () => {
    const api = { purchaseRequests: vi.fn(() => throwError(() => new Error('offline'))), salesOrders: vi.fn(() => throwError(() => new Error('offline'))) };
    TestBed.configureTestingModule({ providers: [SalesDashboardFacade, { provide: SalesCommitmentApiPort, useValue: api }] });
    const facade = TestBed.inject(SalesDashboardFacade); facade.load();
    expect(facade.state().status).toBe('error');
    facade.retry(); expect(api.purchaseRequests).toHaveBeenCalledTimes(10);
  });
});
