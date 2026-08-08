export interface CatalogManagementPage<T> {
  readonly items: readonly T[];
  readonly page: number;
  readonly size: number;
  readonly total: number;
  readonly totalPages: number;
}

export type CatalogLifecycleStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED' | 'ARCHIVED' | 'PAUSED' | 'SCHEDULED' | 'CANCELLED' | 'EXPIRED';

export interface CatalogCategory {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly parentId: string | null;
  readonly status: CatalogLifecycleStatus;
  readonly version: number;
}

export interface CatalogBrand {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly status: CatalogLifecycleStatus;
  readonly version: number;
}

export interface CatalogProductFamily {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly description: string;
  readonly categoryId: string;
  readonly categoryName: string;
  readonly brandId: string;
  readonly brandName: string;
  readonly countryOfOrigin: string | null;
  readonly manufacturerReference: string | null;
  readonly supplierReference: string | null;
  readonly storageFamily: string;
  readonly status: CatalogLifecycleStatus;
  readonly skuCount: number;
  readonly imagePath: string | null;
  readonly imageFileName: string | null;
  readonly version: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CatalogProductVariant {
  readonly id: string;
  readonly familyId: string;
  readonly familyCode: string;
  readonly familyName: string;
  readonly code: string;
  readonly name: string;
  readonly description: string | null;
  readonly status: CatalogLifecycleStatus;
  readonly skuCount: number;
  readonly version: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CatalogSellableSku {
  readonly id: string;
  readonly familyId: string;
  readonly familyCode: string;
  readonly familyName: string;
  readonly variantId?: string | null;
  readonly variantCode?: string | null;
  readonly variantName?: string | null;
  readonly categoryName: string;
  readonly brandName: string;
  readonly skuCode: string;
  readonly gtin: string | null;
  readonly presentation: string;
  readonly packagingType: string;
  readonly unitOfMeasure: string;
  readonly netWeight: number | null;
  readonly grossWeight: number | null;
  readonly packQuantity: number;
  readonly temperatureMin: number | null;
  readonly temperatureMax: number | null;
  readonly shelfLifeDays: number;
  readonly minimumRemainingShelfLifeDays: number;
  readonly lotTrackingRequired: boolean;
  readonly expiryTrackingRequired: boolean;
  readonly taxCategory: string;
  readonly status: CatalogLifecycleStatus;
  readonly visible: boolean;
  readonly version: number;
  readonly legacyCatalogItemId: string | null;
  readonly imagePath: string | null;
  readonly imageFileName: string | null;
  readonly availabilityStatus: string;
  readonly nearExpiry: boolean;
  readonly availabilityAsOf: string | null;
  readonly currentPrice: CatalogPrice | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CatalogProduct {
  readonly id: string;
  readonly catalogItemId: string;
  readonly productCode: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly categoryId: string;
  readonly categoryName: string;
  readonly brandId: string;
  readonly brandName: string;
  readonly storageTemperature: string;
  readonly status: CatalogLifecycleStatus;
  readonly presentation: string;
  readonly unitOfMeasure: string;
  readonly buyerVisible: boolean;
  readonly imagePath: string | null;
  readonly currentPrice: CatalogPrice | null;
  readonly version: number;
}

export interface CatalogPrice {
  readonly id: string;
  readonly skuId?: string;
  readonly productId?: string;
  readonly amount: number;
  readonly currency: string;
  readonly validFrom: string;
  readonly validUntil: string | null;
  readonly sourceCode: string;
  readonly sourceDescription: string;
  readonly cancelled: boolean;
  readonly version: number;
}

export interface CatalogPromotion {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly status: CatalogLifecycleStatus;
  readonly discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  readonly discountValue: number;
  readonly currency: string | null;
  readonly startsAt: string;
  readonly endsAt: string | null;
  readonly minimumQuantity: number;
  readonly stackingPolicy: string;
  readonly priority: number;
  readonly productIds: readonly string[];
  readonly categoryIds: readonly string[];
  readonly clientAccountIds: readonly string[];
  readonly rules: readonly CatalogPromotionRule[];
  readonly version: number;
}

export interface CatalogPromotionRule { readonly type: string; readonly value: string; }

export interface CatalogCategoryCommand { readonly parentId: string | null; readonly slug: string; readonly name: string; readonly description: string; }
export interface CatalogBrandCommand { readonly slug: string; readonly name: string; readonly description: string; }
export interface CatalogProductCommand {
  readonly catalogItemId: string;
  readonly productCode: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly categoryId: string;
  readonly brandId: string;
  readonly storageTemperature: string;
  readonly presentation: string;
  readonly unitOfMeasure: string;
  readonly buyerVisible: boolean;
  readonly imagePath: string;
}
export interface CatalogPriceCommand { readonly amount: number; readonly currency: string; readonly validFrom: string; readonly validUntil: string | null; readonly sourceCode: string; readonly sourceDescription: string; }
export interface CatalogPromotionCommand {
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  readonly discountValue: number;
  readonly currency: string | null;
  readonly startsAt: string;
  readonly endsAt: string | null;
  readonly minimumQuantity: number;
  readonly stackingPolicy: string;
  readonly priority: number;
  readonly productIds: readonly string[];
  readonly categoryIds: readonly string[];
  readonly clientAccountIds: readonly string[];
  readonly rules: readonly CatalogPromotionRule[];
}
