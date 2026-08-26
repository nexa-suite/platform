import { Injectable, inject } from '@angular/core';
import { CatalogManagementApiPort } from '../domain/ports/catalog-management-api.port';
import { CatalogPromotionTargetsPort } from '../domain/ports/catalog-promotion-targets.port';

/**
 * Application facade for catalog administration. Presentation consumes this
 * orchestration boundary and never reaches the HTTP/ACL adapters directly.
 */
@Injectable({ providedIn: 'root' })
export class CatalogManagementFacade {
  private readonly api = inject(CatalogManagementApiPort);
  private readonly promotionTargets = inject(CatalogPromotionTargetsPort);

  readonly categories = (...args: Parameters<CatalogManagementApiPort['categories']>) => this.api.categories(...args);
  readonly category = (...args: Parameters<CatalogManagementApiPort['category']>) => this.api.category(...args);
  readonly createCategory = (...args: Parameters<CatalogManagementApiPort['createCategory']>) => this.api.createCategory(...args);
  readonly updateCategory = (...args: Parameters<CatalogManagementApiPort['updateCategory']>) => this.api.updateCategory(...args);
  readonly changeCategoryStatus = (...args: Parameters<CatalogManagementApiPort['changeCategoryStatus']>) => this.api.changeCategoryStatus(...args);
  readonly brands = (...args: Parameters<CatalogManagementApiPort['brands']>) => this.api.brands(...args);
  readonly brand = (...args: Parameters<CatalogManagementApiPort['brand']>) => this.api.brand(...args);
  readonly createBrand = (...args: Parameters<CatalogManagementApiPort['createBrand']>) => this.api.createBrand(...args);
  readonly updateBrand = (...args: Parameters<CatalogManagementApiPort['updateBrand']>) => this.api.updateBrand(...args);
  readonly changeBrandStatus = (...args: Parameters<CatalogManagementApiPort['changeBrandStatus']>) => this.api.changeBrandStatus(...args);
  readonly families = (...args: Parameters<CatalogManagementApiPort['families']>) => this.api.families(...args);
  readonly family = (...args: Parameters<CatalogManagementApiPort['family']>) => this.api.family(...args);
  readonly variants = (...args: Parameters<CatalogManagementApiPort['variants']>) => this.api.variants(...args);
  readonly variant = (...args: Parameters<CatalogManagementApiPort['variant']>) => this.api.variant(...args);
  readonly variantSkus = (...args: Parameters<CatalogManagementApiPort['variantSkus']>) => this.api.variantSkus(...args);
  readonly skus = (...args: Parameters<CatalogManagementApiPort['skus']>) => this.api.skus(...args);
  readonly sku = (...args: Parameters<CatalogManagementApiPort['sku']>) => this.api.sku(...args);
  readonly products = (...args: Parameters<CatalogManagementApiPort['products']>) => this.api.products(...args);
  readonly product = (...args: Parameters<CatalogManagementApiPort['product']>) => this.api.product(...args);
  readonly createProduct = (...args: Parameters<CatalogManagementApiPort['createProduct']>) => this.api.createProduct(...args);
  readonly updateProduct = (...args: Parameters<CatalogManagementApiPort['updateProduct']>) => this.api.updateProduct(...args);
  readonly changeProductStatus = (...args: Parameters<CatalogManagementApiPort['changeProductStatus']>) => this.api.changeProductStatus(...args);
  readonly prices = (...args: Parameters<CatalogManagementApiPort['prices']>) => this.api.prices(...args);
  readonly createPrice = (...args: Parameters<CatalogManagementApiPort['createPrice']>) => this.api.createPrice(...args);
  readonly promotions = (...args: Parameters<CatalogManagementApiPort['promotions']>) => this.api.promotions(...args);
  readonly promotion = (...args: Parameters<CatalogManagementApiPort['promotion']>) => this.api.promotion(...args);
  readonly createPromotion = (...args: Parameters<CatalogManagementApiPort['createPromotion']>) => this.api.createPromotion(...args);
  readonly updatePromotion = (...args: Parameters<CatalogManagementApiPort['updatePromotion']>) => this.api.updatePromotion(...args);
  readonly changePromotionStatus = (...args: Parameters<CatalogManagementApiPort['changePromotionStatus']>) => this.api.changePromotionStatus(...args);
  readonly listPromotionTargets = (...args: Parameters<CatalogPromotionTargetsPort['list']>) => this.promotionTargets.list(...args);
}
