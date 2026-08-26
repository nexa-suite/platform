import { Observable } from 'rxjs';
import {
  CatalogBrand,
  CatalogBrandCommand,
  CatalogCategory,
  CatalogCategoryCommand,
  CatalogLifecycleStatus,
  CatalogManagementPage,
  CatalogPrice,
  CatalogPriceCommand,
  CatalogProduct,
  CatalogProductCommand,
  CatalogProductFamily,
  CatalogProductVariant,
  CatalogPromotion,
  CatalogPromotionCommand,
  CatalogSellableSku
} from '../models/catalog-management.models';

/** Application-facing catalog management contract. */
export abstract class CatalogManagementApiPort {
  abstract categories(search?: string): Observable<CatalogManagementPage<CatalogCategory>>;
  abstract category(id: string): Observable<CatalogCategory>;
  abstract createCategory(command: CatalogCategoryCommand): Observable<CatalogCategory>;
  abstract updateCategory(id: string, version: number, command: CatalogCategoryCommand): Observable<CatalogCategory>;
  abstract changeCategoryStatus(id: string, version: number, status: 'ACTIVE' | 'INACTIVE'): Observable<CatalogCategory>;
  abstract brands(search?: string): Observable<CatalogManagementPage<CatalogBrand>>;
  abstract brand(id: string): Observable<CatalogBrand>;
  abstract createBrand(command: CatalogBrandCommand): Observable<CatalogBrand>;
  abstract updateBrand(id: string, version: number, command: CatalogBrandCommand): Observable<CatalogBrand>;
  abstract changeBrandStatus(id: string, version: number, status: 'ACTIVE' | 'INACTIVE'): Observable<CatalogBrand>;
  abstract families(search?: string): Observable<CatalogManagementPage<CatalogProductFamily>>;
  abstract family(id: string): Observable<CatalogProductFamily>;
  abstract variants(familyId: string, search?: string): Observable<CatalogManagementPage<CatalogProductVariant>>;
  abstract variant(id: string): Observable<CatalogProductVariant>;
  abstract variantSkus(variantId: string, search?: string): Observable<CatalogManagementPage<CatalogSellableSku>>;
  abstract skus(search?: string, familyId?: string): Observable<CatalogManagementPage<CatalogSellableSku>>;
  abstract sku(id: string): Observable<CatalogSellableSku>;
  abstract products(search?: string, status?: string): Observable<CatalogManagementPage<CatalogProduct>>;
  abstract product(id: string): Observable<CatalogProduct>;
  abstract createProduct(command: CatalogProductCommand): Observable<CatalogProduct>;
  abstract updateProduct(id: string, version: number, command: CatalogProductCommand): Observable<CatalogProduct>;
  abstract changeProductStatus(id: string, version: number, status: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED' | 'ARCHIVED'): Observable<CatalogProduct>;
  abstract prices(skuId: string): Observable<readonly CatalogPrice[]>;
  abstract createPrice(skuId: string, command: CatalogPriceCommand): Observable<CatalogPrice>;
  abstract promotions(status?: string): Observable<CatalogManagementPage<CatalogPromotion>>;
  abstract promotion(id: string): Observable<CatalogPromotion>;
  abstract createPromotion(command: CatalogPromotionCommand): Observable<CatalogPromotion>;
  abstract updatePromotion(id: string, version: number, command: CatalogPromotionCommand): Observable<CatalogPromotion>;
  abstract changePromotionStatus(id: string, version: number, status: CatalogLifecycleStatus): Observable<CatalogPromotion>;
}
