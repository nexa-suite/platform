import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { SalesCommitmentApiPort } from '../../../salescommitment/domain/ports/sales-commitment-api.port';
import { SalesOrderVersionGateway } from './sales-order-version.gateway';

describe('SalesOrderVersionGateway', () => {
  it('exposes only the version required before an inventory reservation', () => {
    const sales = { salesOrder: vi.fn(() => of({ version: 7 })) };
    TestBed.configureTestingModule({ providers: [SalesOrderVersionGateway, { provide: SalesCommitmentApiPort, useValue: sales }] });

    TestBed.inject(SalesOrderVersionGateway).currentVersion('so-1').subscribe((version) => expect(version).toBe(7));
    expect(sales.salesOrder).toHaveBeenCalledWith('so-1');
  });
});
