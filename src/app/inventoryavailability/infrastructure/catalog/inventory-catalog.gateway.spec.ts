import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { CatalogManagementApiPort } from '../../../catalogcommercialpolicy/domain/ports/catalog-management-api.port';
import { InventoryCatalogGateway } from './inventory-catalog.gateway';

describe('InventoryCatalogGateway', () => {
  it('exposes active catalog references without importing catalog models', () => {
    const catalog = { products: vi.fn(() => of({ items: [{ id: 'p-1', catalogItemId: 'cat-1', productCode: 'SKU-1', name: 'Queso' }] })) };
    TestBed.configureTestingModule({ providers: [InventoryCatalogGateway, { provide: CatalogManagementApiPort, useValue: catalog }] });

    TestBed.inject(InventoryCatalogGateway).activeItems().subscribe((items) => expect(items).toEqual([{ id: 'p-1', catalogItemId: 'cat-1', productCode: 'SKU-1', name: 'Queso' }]));
    expect(catalog.products).toHaveBeenCalledWith('', 'ACTIVE');
  });
});
