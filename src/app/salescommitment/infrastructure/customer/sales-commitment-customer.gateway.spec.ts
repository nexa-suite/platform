import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { CustomerRelationshipsApiPort } from '../../../customerbuyerrelationships/domain/ports/customer-relationships-api.port';
import { SalesCommitmentCustomerReferencePage } from '../../domain/customer-reference.models';
import { SalesCommitmentCustomerGateway } from './sales-commitment-customer.gateway';

describe('SalesCommitmentCustomerGateway', () => {
  it('maps the upstream customer account to a sales reference', () => {
    const customer = {
      clientAccounts: vi.fn(() => of({
        items: [{ id: 'CLI-001', code: 'C-001', businessName: 'ACME S.A.C.', commercialName: 'ACME', taxType: 'RUC', taxValue: '20123456789', deliveryProfile: 'COLD', paymentCondition: 'NET_30', status: 'ACTIVE', buyerMembershipId: 'BUYER-1', version: 4 }],
        page: 0,
        size: 25,
        totalItems: 1,
        totalPages: 1,
        sort: { field: 'commercialName', direction: 'asc' as const }
      }))
    };
    TestBed.configureTestingModule({ providers: [SalesCommitmentCustomerGateway, { provide: CustomerRelationshipsApiPort, useValue: customer }] });

    let result: SalesCommitmentCustomerReferencePage | undefined;
    TestBed.inject(SalesCommitmentCustomerGateway).clientAccounts().subscribe((page) => { result = page; });

    expect(result).toEqual(expect.objectContaining({ items: [{ id: 'CLI-001', code: 'C-001', businessName: 'ACME S.A.C.', commercialName: 'ACME', taxType: 'RUC', taxValue: '20123456789', deliveryProfile: 'COLD', paymentCondition: 'NET_30', status: 'ACTIVE' }] }));
    expect(result?.items[0]).not.toHaveProperty('buyerMembershipId');
  });
});
