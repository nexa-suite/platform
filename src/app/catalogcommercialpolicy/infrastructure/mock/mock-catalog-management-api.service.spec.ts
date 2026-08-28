import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { afterEach, describe, expect, it } from 'vitest';

import { PLATFORM_RUNTIME_CONFIG } from '../../../core/security/runtime-config';
import { CatalogCategoryCommand } from '../../domain/models/catalog-management.models';
import { MockCatalogManagementApiService } from './mock-catalog-management-api.service';

describe('MockCatalogManagementApiService', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('exposes catalog administration projections and optimistic versioning', async () => {
    const service = configure('icisa');
    const categories = await firstValueFrom(service.categories());
    const families = await firstValueFrom(service.families('gouda'));
    const promotions = await firstValueFrom(service.promotions('ACTIVE'));
    const category = await firstValueFrom(service.createCategory(categoryCommand));
    const updated = await firstValueFrom(service.updateCategory(category.id, category.version, { ...categoryCommand, name: 'Cold chain updated' }));

    expect(categories.items[0]).toMatchObject({ status: 'ACTIVE' });
    expect(families.items[0]?.name).toContain('Queso Gouda');
    expect(promotions.items[0]).toMatchObject({ status: 'ACTIVE', discountType: 'PERCENTAGE' });
    expect(updated).toMatchObject({ name: 'Cold chain updated', version: 2 });
    await expect(firstValueFrom(service.updateCategory(category.id, category.version, categoryCommand))).rejects.toMatchObject({ status: 409 });
  });

  it('keeps product, SKU, price and promotion reads on the same BC owner', async () => {
    const service = configure('generic');
    const products = await firstValueFrom(service.products('gouda'));
    const skus = await firstValueFrom(service.skus());
    const prices = await firstValueFrom(service.prices(skus.items[0]!.id));

    expect(products.items[0]).toMatchObject({ id: 'generic-catalog-001', buyerVisible: true });
    expect(skus.items).toHaveLength(3);
    expect(prices[0]).toMatchObject({ sourceCode: 'MOCK_FIXTURE', cancelled: false });
  });

  const categoryCommand: CatalogCategoryCommand = { parentId: null, slug: 'cold-chain-demo', name: 'Cold chain demo', description: 'Demo category.' };

  function configure(tenantProfile: 'generic' | 'icisa'): MockCatalogManagementApiService {
    TestBed.configureTestingModule({
      providers: [
        MockCatalogManagementApiService,
        { provide: PLATFORM_RUNTIME_CONFIG, useValue: { apiBaseUrl: '', surface: 'PLATFORM', dataMode: 'mock', tenantProfile } },
      ],
    });
    return TestBed.inject(MockCatalogManagementApiService);
  }
});
