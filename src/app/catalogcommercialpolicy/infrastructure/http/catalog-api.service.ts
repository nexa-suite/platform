import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { platformApiUrl, platformMediaUrl, PLATFORM_RUNTIME_CONFIG } from '../../../core/security/runtime-config';
import {
  CatalogFilters,
  CatalogPage,
  CatalogMoney,
  ColdChainRequirement,
  ProductCatalogDetail,
  ProductCatalogItem
} from '../../domain/models/catalog.models';
import { CatalogApiPort } from '../../domain/ports/catalog-api.port';

interface CatalogApiMoney { readonly amount: string | number; readonly currency: string; }
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
  readonly unitPrice: CatalogApiMoney;
  readonly coldChainRequirement: string;
  readonly availabilityStatus?: string;
  readonly nearExpiry?: boolean;
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
      coldChain: filters.coldChain,
      status: filters.status
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
      unitPrice: this.toMoney(item.unitPrice),
      coldChain: this.toColdChain(item.coldChainRequirement),
      availabilityStatus: item.availabilityStatus ?? 'UNKNOWN',
      nearExpiry: item.nearExpiry ?? false,
      image: {
        url: platformMediaUrl(this.config, item.image?.url),
        fileName: item.image?.fileName ?? null
      }
    };
  }

  private toMoney(money: CatalogApiMoney): CatalogMoney {
    return { amount: Number(money.amount), currency: money.currency };
  }

  private toColdChain(value: string): ColdChainRequirement {
    const normalized = value.toUpperCase();
    return normalized === 'REFRIGERATED' || normalized === 'FROZEN' ? normalized : 'NONE';
  }
}
