import { inject, Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { PLATFORM_RUNTIME_CONFIG } from '../../../core/security/runtime-config';
import { CatalogManagementApiPort } from '../../domain/ports/catalog-management-api.port';
import { CatalogBrand, CatalogBrandCommand, CatalogCategory, CatalogCategoryCommand, CatalogLifecycleStatus, CatalogManagementPage, CatalogPrice, CatalogPriceCommand, CatalogProduct, CatalogProductCommand, CatalogProductFamily, CatalogProductVariant, CatalogPromotion, CatalogPromotionCommand, CatalogSellableSku } from '../../domain/models/catalog-management.models';
import { MOCK_CATALOG_FIXTURES } from './mock-catalog.fixtures';

const DEMO_NOW = '2026-08-26T10:00:00Z';

/** BC-03 local adapter for operational catalog administration. */
@Injectable({ providedIn: 'root' })
export class MockCatalogManagementApiService extends CatalogManagementApiPort {
  private readonly config = inject(PLATFORM_RUNTIME_CONFIG);
  private readonly fixture = MOCK_CATALOG_FIXTURES[this.config.tenantProfile];
  private readonly categoryStore = new Map<string, CatalogCategory>();
  private readonly brandStore = new Map<string, CatalogBrand>();
  private readonly familyStore = new Map<string, CatalogProductFamily>();
  private readonly variantStore = new Map<string, CatalogProductVariant>();
  private readonly skuStore = new Map<string, CatalogSellableSku>();
  private readonly productStore = new Map<string, CatalogProduct>();
  private readonly priceStore = new Map<string, CatalogPrice[]>();
  private readonly promotionStore = new Map<string, CatalogPromotion>();
  private sequence = 10;

  constructor() {
    super();
    const categoryId = `${this.config.tenantProfile}-category-001`;
    const brandId = `${this.config.tenantProfile}-brand-001`;
    this.categoryStore.set(categoryId, { id: categoryId, slug: 'cold-chain', name: 'Cold chain', description: 'Demo cold-chain catalog category.', parentId: null, status: 'ACTIVE', version: 1 });
    this.brandStore.set(brandId, { id: brandId, slug: this.config.tenantProfile, name: this.config.tenantProfile === 'icisa' ? 'ICISA suppliers' : 'Nexa Demo', description: 'Demo catalog brand.', status: 'ACTIVE', version: 1 });
    for (const [index, item] of this.fixture.entries()) {
      const familyId = `${this.config.tenantProfile}-family-${String(index + 1).padStart(3, '0')}`;
      const variantId = `${familyId}-variant-001`;
      const skuId = item.sellableSkuId ?? `${this.config.tenantProfile}-sku-${String(index + 1).padStart(3, '0')}`;
      const family: CatalogProductFamily = { id: familyId, code: `FAM-${item.skuCode ?? item.id}`, name: item.productFamilyName, description: item.description, categoryId, categoryName: item.category, brandId, brandName: item.brand, countryOfOrigin: 'PE', manufacturerReference: null, supplierReference: null, storageFamily: item.coldChain, status: 'ACTIVE', skuCount: 1, imagePath: item.image?.url ?? null, imageFileName: item.image?.fileName ?? null, version: 1, createdAt: '2026-01-01T08:00:00Z', updatedAt: DEMO_NOW };
      this.familyStore.set(familyId, family);
      this.variantStore.set(variantId, { id: variantId, familyId, familyCode: family.code, familyName: family.name, code: `VAR-${String(index + 1).padStart(3, '0')}`, name: item.presentation, description: item.description, status: 'ACTIVE', skuCount: 1, version: 1, createdAt: family.createdAt, updatedAt: DEMO_NOW });
      const price: CatalogPrice = { id: `${skuId}-price-001`, skuId, amount: item.unitPrice.amount, currency: item.unitPrice.currency, validFrom: '2026-01-01T00:00:00Z', validUntil: null, sourceCode: 'MOCK_FIXTURE', sourceDescription: 'Local demo fixture', cancelled: false, version: 1 };
      this.priceStore.set(skuId, [price]);
      this.skuStore.set(skuId, { id: skuId, familyId, familyCode: family.code, familyName: family.name, variantId, variantCode: `VAR-${String(index + 1).padStart(3, '0')}`, variantName: item.presentation, categoryName: item.category, brandName: item.brand, skuCode: item.skuCode ?? item.id, gtin: null, presentation: item.presentation, packagingType: item.packagingType ?? 'BOX', unitOfMeasure: item.unitOfMeasure ?? 'UNIT', netWeight: item.netWeight, grossWeight: item.grossWeight, packQuantity: 1, temperatureMin: item.coldChain === 'FROZEN' ? -18 : 2, temperatureMax: item.coldChain === 'FROZEN' ? -12 : 8, shelfLifeDays: 30, minimumRemainingShelfLifeDays: 3, lotTrackingRequired: true, expiryTrackingRequired: true, taxCategory: 'STANDARD', status: 'ACTIVE', visible: true, version: 1, legacyCatalogItemId: item.id, imagePath: item.image?.url ?? null, imageFileName: item.image?.fileName ?? null, availabilityStatus: item.availabilityStatus, nearExpiry: item.nearExpiry, availabilityAsOf: DEMO_NOW, currentPrice: price, createdAt: '2026-01-01T08:00:00Z', updatedAt: DEMO_NOW });
      this.productStore.set(item.id, { id: item.id, catalogItemId: item.id, productCode: item.skuCode ?? item.id, slug: item.id.toLowerCase(), name: item.name, description: item.description, categoryId, categoryName: item.category, brandId, brandName: item.brand, storageTemperature: item.coldChain, status: 'ACTIVE', presentation: item.presentation, unitOfMeasure: item.unitOfMeasure ?? 'UNIT', buyerVisible: true, imagePath: item.image?.url ?? null, currentPrice: price, version: 1 });
    }
    const first = this.fixture[0];
    if (first) this.promotionStore.set(`${this.config.tenantProfile}-promotion-001`, { id: `${this.config.tenantProfile}-promotion-001`, slug: 'demo-buyer-price', name: 'Demo buyer price', description: 'Deterministic local promotion.', status: 'ACTIVE', discountType: 'PERCENTAGE', discountValue: 10, currency: null, startsAt: '2026-01-01T00:00:00Z', endsAt: null, minimumQuantity: 1, stackingPolicy: 'EXCLUSIVE', priority: 10, productIds: [first.id], categoryIds: [], clientAccountIds: [], rules: [], version: 1 });
  }

  categories(search = ''): Observable<CatalogManagementPage<CatalogCategory>> { return of(this.page(this.filter(this.categoryStore.values(), search, (item) => `${item.name} ${item.slug}`))); }
  category(id: string): Observable<CatalogCategory> { return this.required(this.categoryStore.get(id), 'MOCK_CATEGORY_NOT_FOUND'); }
  createCategory(command: CatalogCategoryCommand): Observable<CatalogCategory> { const id = this.id('category'); const item: CatalogCategory = { ...command, id, status: 'ACTIVE', version: 1 }; this.categoryStore.set(id, item); return of(item); }
  updateCategory(id: string, version: number, command: CatalogCategoryCommand): Observable<CatalogCategory> { return this.update(this.categoryStore, id, version, (current) => ({ ...current, ...command })); }
  changeCategoryStatus(id: string, version: number, status: 'ACTIVE' | 'INACTIVE'): Observable<CatalogCategory> { return this.update(this.categoryStore, id, version, (current) => ({ ...current, status })); }
  brands(search = ''): Observable<CatalogManagementPage<CatalogBrand>> { return of(this.page(this.filter(this.brandStore.values(), search, (item) => `${item.name} ${item.slug}`))); }
  brand(id: string): Observable<CatalogBrand> { return this.required(this.brandStore.get(id), 'MOCK_BRAND_NOT_FOUND'); }
  createBrand(command: CatalogBrandCommand): Observable<CatalogBrand> { const id = this.id('brand'); const item: CatalogBrand = { ...command, id, status: 'ACTIVE', version: 1 }; this.brandStore.set(id, item); return of(item); }
  updateBrand(id: string, version: number, command: CatalogBrandCommand): Observable<CatalogBrand> { return this.update(this.brandStore, id, version, (current) => ({ ...current, ...command })); }
  changeBrandStatus(id: string, version: number, status: 'ACTIVE' | 'INACTIVE'): Observable<CatalogBrand> { return this.update(this.brandStore, id, version, (current) => ({ ...current, status })); }
  families(search = ''): Observable<CatalogManagementPage<CatalogProductFamily>> { return of(this.page(this.filter(this.familyStore.values(), search, (item) => `${item.name} ${item.code}`))); }
  family(id: string): Observable<CatalogProductFamily> { return this.required(this.familyStore.get(id), 'MOCK_FAMILY_NOT_FOUND'); }
  variants(familyId: string, search = ''): Observable<CatalogManagementPage<CatalogProductVariant>> { return of(this.page(this.filter([...this.variantStore.values()].filter((item) => item.familyId === familyId), search, (item) => `${item.name} ${item.code}`))); }
  variant(id: string): Observable<CatalogProductVariant> { return this.required(this.variantStore.get(id), 'MOCK_VARIANT_NOT_FOUND'); }
  variantSkus(variantId: string, search = ''): Observable<CatalogManagementPage<CatalogSellableSku>> { return of(this.page(this.filter([...this.skuStore.values()].filter((item) => item.variantId === variantId), search, (item) => `${item.skuCode} ${item.familyName}`))); }
  skus(search = '', familyId?: string): Observable<CatalogManagementPage<CatalogSellableSku>> { return of(this.page(this.filter([...this.skuStore.values()].filter((item) => !familyId || item.familyId === familyId), search, (item) => `${item.skuCode} ${item.familyName} ${item.categoryName}`))); }
  sku(id: string): Observable<CatalogSellableSku> { return this.required(this.skuStore.get(id), 'MOCK_SKU_NOT_FOUND'); }
  products(search = '', status?: string): Observable<CatalogManagementPage<CatalogProduct>> { return of(this.page([...this.productStore.values()].filter((item) => !status || item.status === status).filter((item) => !search || `${item.name} ${item.productCode}`.toLowerCase().includes(search.toLowerCase())))); }
  product(id: string): Observable<CatalogProduct> { return this.required(this.productStore.get(id), 'MOCK_PRODUCT_NOT_FOUND'); }
  createProduct(command: CatalogProductCommand): Observable<CatalogProduct> { const id = this.id('product'); const category = this.categoryStore.get(command.categoryId); const brand = this.brandStore.get(command.brandId); const item: CatalogProduct = { ...command, id, name: command.name, categoryName: category?.name ?? command.categoryId, brandName: brand?.name ?? command.brandId, status: 'ACTIVE', currentPrice: null, version: 1 }; this.productStore.set(id, item); return of(item); }
  updateProduct(id: string, version: number, command: CatalogProductCommand): Observable<CatalogProduct> { return this.update(this.productStore, id, version, (current) => ({ ...current, ...command })); }
  changeProductStatus(id: string, version: number, status: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED' | 'ARCHIVED'): Observable<CatalogProduct> { return this.update(this.productStore, id, version, (current) => ({ ...current, status })); }
  prices(skuId: string): Observable<readonly CatalogPrice[]> { return this.skuStore.has(skuId) ? of(this.priceStore.get(skuId) ?? []) : throwError(() => new Error('MOCK_SKU_NOT_FOUND')); }
  createPrice(skuId: string, command: CatalogPriceCommand): Observable<CatalogPrice> { if (!this.skuStore.has(skuId)) return throwError(() => new Error('MOCK_SKU_NOT_FOUND')); const value: CatalogPrice = { ...command, id: this.id('price'), skuId, cancelled: false, version: 1 }; this.priceStore.set(skuId, [...(this.priceStore.get(skuId) ?? []), value]); return of(value); }
  promotions(status = ''): Observable<CatalogManagementPage<CatalogPromotion>> { return of(this.page([...this.promotionStore.values()].filter((item) => !status || item.status === status))); }
  promotion(id: string): Observable<CatalogPromotion> { return this.required(this.promotionStore.get(id), 'MOCK_PROMOTION_NOT_FOUND'); }
  createPromotion(command: CatalogPromotionCommand): Observable<CatalogPromotion> { const item: CatalogPromotion = { ...command, id: this.id('promotion'), status: 'DRAFT', version: 1 }; this.promotionStore.set(item.id, item); return of(item); }
  updatePromotion(id: string, version: number, command: CatalogPromotionCommand): Observable<CatalogPromotion> { return this.update(this.promotionStore, id, version, (current) => ({ ...current, ...command })); }
  changePromotionStatus(id: string, version: number, status: CatalogLifecycleStatus): Observable<CatalogPromotion> { return this.update(this.promotionStore, id, version, (current) => ({ ...current, status })); }

  private id(kind: string): string { return `${this.config.tenantProfile}-${kind}-${String(this.sequence++).padStart(3, '0')}`; }
  private page<T>(items: readonly T[]): CatalogManagementPage<T> { return { items, page: 0, size: items.length, total: items.length, totalPages: items.length ? 1 : 0 }; }
  private filter<T>(items: Iterable<T>, search: string, text: (item: T) => string): readonly T[] { const query = search.trim().toLowerCase(); return [...items].filter((item) => !query || text(item).toLowerCase().includes(query)); }
  private required<T>(value: T | undefined, message: string): Observable<T> { return value === undefined ? throwError(() => new Error(message)) : of(value); }
  private update<T extends { readonly id: string; readonly version: number }>(store: Map<string, T>, id: string, version: number, apply: (current: T) => T): Observable<T> { const current = store.get(id); if (!current) return throwError(() => new Error('MOCK_CATALOG_RESOURCE_NOT_FOUND')); if (current.version !== version) return throwError(() => Object.assign(new Error('MOCK_CATALOG_CONCURRENCY_CONFLICT'), { status: 409 })); const value = { ...apply(current), version: current.version + 1 }; store.set(id, value); return of(value); }
}
