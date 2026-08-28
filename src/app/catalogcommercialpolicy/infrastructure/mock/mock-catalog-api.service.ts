import { inject, Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { PLATFORM_RUNTIME_CONFIG } from '../../../core/security/runtime-config';
import { CatalogFilters, CatalogPage, ProductCatalogDetail } from '../../domain/models/catalog.models';
import { CatalogApiPort } from '../../domain/ports/catalog-api.port';
import { MOCK_CATALOG_FIXTURES } from './mock-catalog.fixtures';

/** BC-03 demo adapter. Search and detail are local deterministic projections. */
@Injectable({ providedIn: 'root' })
export class MockCatalogApiService implements CatalogApiPort {
  private readonly config = inject(PLATFORM_RUNTIME_CONFIG);

  search(filters: CatalogFilters): Observable<CatalogPage> {
    const query = filters.q.trim().toLowerCase();
    const category = filters.category.trim().toLowerCase();
    const brand = filters.brand.trim().toLowerCase();
    const items = MOCK_CATALOG_FIXTURES[this.config.tenantProfile]
      .filter((item) => filters.status !== 'INACTIVE')
      .filter((item) => !query || [item.name, item.brand, item.category, item.presentation, item.skuCode ?? ''].some((value) => value.toLowerCase().includes(query)))
      .filter((item) => !category || item.category.toLowerCase() === category)
      .filter((item) => !brand || item.brand.toLowerCase() === brand)
      .filter((item) => !filters.coldChain || item.coldChain === filters.coldChain)
      .sort((left, right) => {
        const result = left.name.localeCompare(right.name);
        return filters.direction === 'desc' ? -result : result;
      });

    const start = filters.page * filters.size;
    return of({
      items: items.slice(start, start + filters.size),
      page: filters.page,
      size: filters.size,
      totalItems: items.length,
      totalPages: items.length ? Math.ceil(items.length / filters.size) : 0,
      sort: { field: filters.sort, direction: filters.direction }
    });
  }

  getById(id: string): Observable<ProductCatalogDetail> {
    const item = MOCK_CATALOG_FIXTURES[this.config.tenantProfile].find((candidate) => candidate.id === id);
    return item ? of(item) : throwError(() => new Error('MOCK_CATALOG_ITEM_NOT_FOUND'));
  }
}
