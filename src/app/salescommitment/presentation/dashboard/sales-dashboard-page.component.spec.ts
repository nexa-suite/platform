import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { EMPTY, Observable, of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { CHANGE_FEED_PORT } from '../../../core/change-feed/application/change-feed.port';
import { SalesCommitmentApiPort } from '../../domain/ports/sales-commitment-api.port';
import { SalesCommitmentCustomerPort } from '../../domain/ports/sales-commitment-cross-context.ports';
import { SalesDashboardSupportingDataPort } from '../../domain/ports/sales-dashboard-supporting-data.port';
import { SalesDashboardPageComponent } from './sales-dashboard-page.component';

const page = <T>(items: readonly T[]) => ({
  items,
  page: 0,
  size: items.length || 5,
  totalItems: items.length,
  totalPages: items.length ? 1 : 0,
  sort: { field: 'createdAt', direction: 'desc' as const },
});

function configureFixture(
  documentsFactory: () => Observable<readonly unknown[]> = () => of([]),
  clientsFactory: () => Observable<unknown> = () => of(page([])),
): { fixture: ComponentFixture<SalesDashboardPageComponent>; documentsApi: { pendingBusinessDocuments: ReturnType<typeof vi.fn> }; clientsApi: { clientAccounts: ReturnType<typeof vi.fn> } } {
  const documentsApi = { pendingBusinessDocuments: vi.fn(documentsFactory) };
  const clientsApi = { clientAccounts: vi.fn(clientsFactory) };
  const salesApi = {
    purchaseRequests: vi.fn(() => of(page([{ id: 'PR-1', code: 'PR-1', status: 'SUBMITTED', clientAccountId: 'C-1' }]))),
    salesOrders: vi.fn(() => of(page([]))),
  };

  TestBed.configureTestingModule({
    imports: [SalesDashboardPageComponent],
    providers: [
      provideRouter([]),
      provideTranslateService(),
      { provide: SalesCommitmentApiPort, useValue: salesApi },
      { provide: SalesDashboardSupportingDataPort, useValue: documentsApi },
      { provide: SalesCommitmentCustomerPort, useValue: clientsApi },
      { provide: CHANGE_FEED_PORT, useValue: { events: EMPTY, connect: vi.fn(), disconnect: vi.fn() } },
    ],
  });

  const fixture = TestBed.createComponent(SalesDashboardPageComponent);
  fixture.detectChanges();
  return { fixture, documentsApi, clientsApi };
}

describe('SalesDashboardPageComponent', () => {
  it('exposes a retryable partial state when business documents fail', () => {
    const documentsFactory = vi.fn()
      .mockReturnValueOnce(throwError(() => new Error('offline')))
      .mockReturnValueOnce(of([{ id: 'DOC-1', clientAccountId: 'C-1', subjectType: 'SALES_ORDER', subjectId: 'SO-1', documentType: 'INVOICE', documentNumber: 'F001-1', status: 'PENDING' }]));
    const { fixture, documentsApi } = configureFixture(documentsFactory);
    const component = fixture.componentInstance;

    expect(component.documentsError()).toBe(true);
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeTruthy();
    expect(component.pendingDocumentCount()).toBe('—');

    component.retryDocuments();
    fixture.detectChanges();

    expect(component.documentsError()).toBe(false);
    expect(documentsApi.pendingBusinessDocuments).toHaveBeenCalledTimes(2);
    expect(fixture.nativeElement.querySelector('.document-check')).toBeTruthy();
    expect(component.pendingDocumentCount()).toBe(1);
  });

  it('retries client references without hiding the request inbox', () => {
    const clientsFactory = vi.fn()
      .mockReturnValueOnce(throwError(() => new Error('offline')))
      .mockReturnValueOnce(of(page([{ id: 'C-1', businessName: 'Client One' }])));
    const { fixture, clientsApi } = configureFixture(() => of([]), clientsFactory);
    const component = fixture.componentInstance;

    expect(component.clientNamesError()).toBe(true);
    expect(fixture.nativeElement.querySelector('[role="status"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.flow-list-item')).toBeTruthy();
    expect(component.clientName('C-1')).toBe('C-1');

    component.retryClientNames();
    fixture.detectChanges();

    expect(component.clientNamesError()).toBe(false);
    expect(clientsApi.clientAccounts).toHaveBeenCalledTimes(2);
    expect(fixture.nativeElement.querySelector('.flow-list-item')).toBeTruthy();
    expect(component.clientName('C-1')).toBe('Client One');
  });
});
