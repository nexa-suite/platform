import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { platformApiUrl, platformMediaUrl, PLATFORM_RUNTIME_CONFIG } from '../../../core/security/runtime-config';
import {
  CatalogFilters,
  CatalogPage,
  CatalogMoney,
  CatalogAppliedPromotion,
  ColdChainRequirement,
  ProductCatalogDetail,
  ProductCatalogItem
} from '../../domain/models/catalog.models';
import { CatalogApiPort } from '../../domain/ports/catalog-api.port';

interface CatalogApiMoney { readonly amount?: string | number | null; readonly currency?: string | null; }
interface CatalogApiPromotion {
  readonly id?: string | null;
  readonly name?: string | null;
  readonly discountType?: string | null;
  readonly discountAmount?: CatalogApiMoney | null;
}
interface CatalogApiImage { readonly url?: string; readonly fileName?: string; }
interface CatalogApiItem {
  readonly catalogItemId: string;
  readonly productId?: string;
  readonly productFamilyId?: string;
  readonly productFamilyCode?: string;
  readonly productFamilyName?: string;
  readonly sellableSkuId?: string;
  readonly skuCode?: string;
  readonly itemName: string;
  readonly brandName: string;
  readonly categoryName: string;
  readonly description?: string;
  readonly presentation: string;
  readonly unitOfMeasure?: string;
  readonly packagingType?: string;
  readonly netWeight?: string | number;
  readonly grossWeight?: string | number;
  readonly unitPrice?: CatalogApiMoney | null;
  readonly unitPriceAmount?: string | number | null;
  readonly unitPriceCurrency?: string | null;
  readonly coldChainRequirement: string;
  readonly status?: string | null;
  readonly availabilityStatus?: string;
  readonly nearExpiry?: boolean;
  readonly promotionLabel?: string | null;
  readonly basePrice?: CatalogApiMoney | null;
  readonly effectivePrice?: CatalogApiMoney | null;
  readonly discountAmount?: CatalogApiMoney | null;
  readonly currency?: string | null;
  readonly appliedPromotions?: readonly CatalogApiPromotion[] | null;
  readonly pricingAsOf?: string | null;
  readonly availabilityAsOf?: string | null;
  readonly productVariantCode?: string | null;
  readonly productVariantName?: string | null;
  readonly image?: CatalogApiImage;
}
interface CatalogApiPage {
  readonly items: readonly CatalogApiItem[];
  readonly page: number;
  readonly size: number;
  readonly totalItems: number;
  readonly totalPages: number;
  readonly sort?: { readonly field: string; readonly direction: string };
}

@Injectable({ providedIn: 'root' })
export class CatalogApiService implements CatalogApiPort {
  private readonly http = inject(HttpClient);
  private readonly config = inject(PLATFORM_RUNTIME_CONFIG);
  private readonly resourcePath = '/api/v1/catalog-items';

  search(filters: CatalogFilters): Observable<CatalogPage> {
    let params = new HttpParams()
      .set('page', filters.page)
      .set('size', filters.size)
      .set('sort', filters.sort)
      .set('direction', filters.direction);

    for (const [key, value] of Object.entries({
      q: filters.q,
      category: filters.category,
      brand: filters.brand,
      coldChain: filters.coldChain
    })) {
      if (value) params = params.set(key, value);
    }

    return this.http
      .get<CatalogApiPage>(platformApiUrl(this.config, this.resourcePath), { params })
      .pipe(map((response) => this.toPage(response)));
  }

  getById(id: string): Observable<ProductCatalogDetail> {
    return this.http
      .get<CatalogApiItem>(platformApiUrl(this.config, `${this.resourcePath}/${encodeURIComponent(id)}`))
      .pipe(map((response) => this.toDetail(response)));
  }

  private toPage(response: CatalogApiPage): CatalogPage {
    return {
      items: response.items.map((item) => this.toItem(item)),
      page: response.page,
      size: response.size,
      totalItems: response.totalItems,
      totalPages: response.totalPages,
      sort: {
        field: response.sort?.field ?? 'itemName',
        direction: response.sort?.direction?.toLowerCase() === 'desc' ? 'desc' : 'asc'
      }
    };
  }

  private toDetail(item: CatalogApiItem): ProductCatalogDetail {
    return { ...this.toItem(item), description: item.description ?? '' };
  }

  private toItem(item: CatalogApiItem): ProductCatalogItem {
    const effectivePrice = this.toMoney(
      item.effectivePrice ?? item.unitPrice ?? { amount: item.unitPriceAmount ?? 0, currency: item.unitPriceCurrency ?? item.currency ?? 'PEN' }
    );
    const basePrice = item.basePrice ? this.toMoney(item.basePrice) : effectivePrice;
    const discountAmount = item.discountAmount ? this.toMoney(item.discountAmount) : this.zeroMoney(basePrice.currency);
    return {
      id: item.catalogItemId,
      productFamilyId: item.productFamilyId ?? null,
      productFamilyCode: item.productFamilyCode ?? null,
      productFamilyName: item.productFamilyName ?? item.itemName,
      sellableSkuId: item.sellableSkuId ?? item.productId ?? null,
      skuCode: item.skuCode ?? null,
      name: item.itemName,
      brand: item.brandName,
      category: item.categoryName,
      presentation: item.presentation,
      unitOfMeasure: item.unitOfMeasure ?? null,
      packagingType: item.packagingType ?? null,
      netWeight: item.netWeight == null ? null : Number(item.netWeight),
      grossWeight: item.grossWeight == null ? null : Number(item.grossWeight),
      unitPrice: effectivePrice,
      basePrice,
      discountAmount,
      promotionLabel: item.promotionLabel?.trim() || null,
      appliedPromotions: (item.appliedPromotions ?? []).map((promotion): CatalogAppliedPromotion => ({
        id: promotion.id ?? '',
        name: promotion.name ?? null,
        discountType: promotion.discountType ?? null,
        discountAmount: this.toMoney(promotion.discountAmount ?? { amount: 0, currency: item.currency ?? effectivePrice.currency })
      })).filter((promotion) => promotion.id.length > 0),
      pricingAsOf: item.pricingAsOf ?? null,
      coldChain: this.toColdChain(item.coldChainRequirement),
      status: item.status ?? 'ACTIVE',
      availabilityStatus: item.availabilityStatus ?? 'UNKNOWN',
      nearExpiry: item.nearExpiry ?? false,
      availabilityAsOf: item.availabilityAsOf ?? null,
      productVariantCode: item.productVariantCode ?? null,
      productVariantName: item.productVariantName ?? null,
      image: {
        url: platformMediaUrl(this.config, item.image?.url),
        fileName: item.image?.fileName ?? null
      }
    };
  }

  private toMoney(money: CatalogApiMoney): CatalogMoney {
    return {
      amount: Number.isFinite(Number(money.amount)) ? Number(money.amount) : 0,
      currency: money.currency?.trim().toUpperCase() || 'PEN'
    };
  }

  private zeroMoney(currency: string): CatalogMoney {
    return { amount: 0, currency };
  }

  private toColdChain(value: string): ColdChainRequirement {
    const normalized = value.toUpperCase();
    return normalized === 'REFRIGERATED' || normalized === 'FROZEN' ? normalized : 'NONE';
  }
}
