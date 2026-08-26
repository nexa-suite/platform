import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { CatalogApiPort } from '../../../catalogcommercialpolicy/domain/ports/catalog-api.port';
import { SalesCommitmentCatalogItem, SalesCommitmentCatalogPage } from '../../domain/sales-commitment-catalog.models';
import { SalesCommitmentCatalogPort } from '../../domain/ports/sales-commitment-cross-context.ports';

/** ACL from the Catalog context into the Sales Commitment context. */
@Injectable({ providedIn: 'root' })
export class SalesCommitmentCatalogGateway implements SalesCommitmentCatalogPort {
  private readonly catalog = inject(CatalogApiPort);

  search(query = ''): Observable<SalesCommitmentCatalogPage> {
    return this.catalog.search({
      q: query.trim(), category: '', brand: '', coldChain: '', status: 'ACTIVE',
      page: 0, size: 100, sort: 'itemName', direction: 'asc',
    }).pipe(map((page) => ({
      page: page.page,
      size: page.size,
      totalItems: page.totalItems,
      totalPages: page.totalPages,
      items: page.items.map((item): SalesCommitmentCatalogItem => ({
        id: item.id,
        productFamilyName: item.productFamilyName,
        skuCode: item.skuCode,
        name: item.name,
        presentation: item.presentation,
        image: item.image,
        brand: item.brand,
        category: item.category,
        unitOfMeasure: item.unitOfMeasure,
        packagingType: item.packagingType,
        netWeight: item.netWeight,
        grossWeight: item.grossWeight,
        unitPrice: item.unitPrice,
        availabilityStatus: item.availabilityStatus,
      })),
    })));
  }
}
