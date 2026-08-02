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
  readonly productId: string;
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
  readonly currency: string;
  readonly startsAt: string;
  readonly endsAt: string | null;
  readonly minimumQuantity: number;
  readonly stackingPolicy: string;
  readonly productIds: readonly string[];
  readonly categoryIds: readonly string[];
  readonly version: number;
}

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
  readonly currency: string;
  readonly startsAt: string;
  readonly endsAt: string | null;
  readonly minimumQuantity: number;
  readonly stackingPolicy: string;
  readonly productIds: readonly string[];
  readonly categoryIds: readonly string[];
}
