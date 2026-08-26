import { Observable } from 'rxjs';
import { CatalogFilters, CatalogPage, ProductCatalogDetail } from '../models/catalog.models';

export abstract class CatalogApiPort {
  abstract search(filters: CatalogFilters): Observable<CatalogPage>;
  abstract getById(id: string): Observable<ProductCatalogDetail>;
}
