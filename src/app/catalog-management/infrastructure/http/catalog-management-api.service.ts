import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { platformApiUrl, PLATFORM_RUNTIME_CONFIG } from '../../../core/security/runtime-config';
import {
  CatalogBrand, CatalogBrandCommand, CatalogCategory, CatalogCategoryCommand, CatalogLifecycleStatus,
  CatalogManagementPage, CatalogPrice, CatalogPriceCommand, CatalogProduct, CatalogProductCommand,
  CatalogPromotion, CatalogPromotionCommand
} from '../../domain/models/catalog-management.models';

@Injectable({ providedIn: 'root' })
export class CatalogManagementApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(PLATFORM_RUNTIME_CONFIG);

  categories(search = ''): Observable<CatalogManagementPage<CatalogCategory>> {
    return this.getPage<CatalogCategory>('/catalog/categories', search);
  }
  category(id: string): Observable<CatalogCategory> { return this.http.get<CatalogCategory>(this.api(`/catalog/categories/${encodeURIComponent(id)}`)); }
  createCategory(command: CatalogCategoryCommand): Observable<CatalogCategory> { return this.create('/catalog/categories', command); }
  updateCategory(id: string, version: number, command: CatalogCategoryCommand): Observable<CatalogCategory> { return this.update(`/catalog/categories/${encodeURIComponent(id)}`, version, command); }
  changeCategoryStatus(id: string, version: number, status: 'ACTIVE' | 'INACTIVE'): Observable<CatalogCategory> { return this.lifecycle<CatalogCategory>(`/catalog/categories/${encodeURIComponent(id)}/${status === 'ACTIVE' ? 'activations' : 'deactivations'}`, version); }

  brands(search = ''): Observable<CatalogManagementPage<CatalogBrand>> { return this.getPage<CatalogBrand>('/catalog/brands', search); }
  brand(id: string): Observable<CatalogBrand> { return this.http.get<CatalogBrand>(this.api(`/catalog/brands/${encodeURIComponent(id)}`)); }
  createBrand(command: CatalogBrandCommand): Observable<CatalogBrand> { return this.create('/catalog/brands', command); }
  updateBrand(id: string, version: number, command: CatalogBrandCommand): Observable<CatalogBrand> { return this.update(`/catalog/brands/${encodeURIComponent(id)}`, version, command); }
  changeBrandStatus(id: string, version: number, status: 'ACTIVE' | 'INACTIVE'): Observable<CatalogBrand> { return this.lifecycle<CatalogBrand>(`/catalog/brands/${encodeURIComponent(id)}/${status === 'ACTIVE' ? 'activations' : 'deactivations'}`, version); }

  products(search = '', status = ''): Observable<CatalogManagementPage<CatalogProduct>> {
    let params = new HttpParams().set('page', 0).set('size', 100);
    if (search) params = params.set('search', search);
    if (status) params = params.set('status', status);
    return this.http.get<{ items: readonly CatalogProduct[]; page: number; size: number; total: number; totalPages?: number }>(this.api('/catalog/products'), { params }).pipe(map((page) => ({ ...page, totalPages: page.totalPages ?? (page.total ? Math.ceil(page.total / page.size) : 0) })));
  }
  product(id: string): Observable<CatalogProduct> { return this.http.get<CatalogProduct>(this.api(`/catalog/products/${encodeURIComponent(id)}`)); }
  createProduct(command: CatalogProductCommand): Observable<CatalogProduct> { return this.create('/catalog/products', command); }
  updateProduct(id: string, version: number, command: CatalogProductCommand): Observable<CatalogProduct> { return this.update(`/catalog/products/${encodeURIComponent(id)}`, version, command); }
  changeProductStatus(id: string, version: number, status: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED' | 'ARCHIVED'): Observable<CatalogProduct> {
    const suffix: Record<string, string> = { ACTIVE: 'activations', INACTIVE: 'deactivations', DISCONTINUED: 'discontinuations', ARCHIVED: 'archivings' };
    return this.lifecycle<CatalogProduct>(`/catalog/products/${encodeURIComponent(id)}/${suffix[status]}`, version);
  }

  prices(productId: string): Observable<readonly CatalogPrice[]> { return this.http.get<readonly CatalogPrice[]>(this.api(`/catalog/products/${encodeURIComponent(productId)}/prices`)); }
  createPrice(productId: string, command: CatalogPriceCommand): Observable<CatalogPrice> { return this.create(`/catalog/products/${encodeURIComponent(productId)}/prices`, command); }
  cancelPrice(id: string, version: number): Observable<CatalogPrice> { return this.lifecycle<CatalogPrice>(`/catalog/prices/${encodeURIComponent(id)}/cancellations`, version); }

  promotions(status = ''): Observable<CatalogManagementPage<CatalogPromotion>> {
    let params = new HttpParams().set('page', 0).set('size', 100);
    if (status) params = params.set('status', status);
    return this.http.get<{ items: readonly CatalogPromotion[]; page: number; size: number; total: number; totalPages?: number }>(this.api('/catalog/promotions'), { params }).pipe(map((page) => ({ ...page, totalPages: page.totalPages ?? (page.total ? Math.ceil(page.total / page.size) : 0) })));
  }
  promotion(id: string): Observable<CatalogPromotion> { return this.http.get<CatalogPromotion>(this.api(`/catalog/promotions/${encodeURIComponent(id)}`)); }
  createPromotion(command: CatalogPromotionCommand): Observable<CatalogPromotion> { return this.create('/catalog/promotions', command); }
  updatePromotion(id: string, version: number, command: CatalogPromotionCommand): Observable<CatalogPromotion> { return this.update(`/catalog/promotions/${encodeURIComponent(id)}`, version, command); }
  changePromotionStatus(id: string, version: number, status: CatalogLifecycleStatus): Observable<CatalogPromotion> {
    const suffix: Record<string, string> = { SCHEDULED: 'schedules', ACTIVE: 'activations', PAUSED: 'pauses', CANCELLED: 'cancellations', EXPIRED: 'expirations' };
    return this.lifecycle<CatalogPromotion>(`/catalog/promotions/${encodeURIComponent(id)}/${suffix[status]}`, version);
  }

  private getPage<T>(path: string, search: string): Observable<CatalogManagementPage<T>> {
    let params = new HttpParams().set('page', 0).set('size', 100);
    if (search) params = params.set('search', search);
    return this.http.get<CatalogManagementPage<T>>(this.api(path), { params }).pipe(map((page) => ({ ...page, totalPages: page.totalPages ?? (page.total ? Math.ceil(page.total / page.size) : 0) })));
  }
  private create<T>(path: string, body: unknown): Observable<T> { return this.http.post<T>(this.api(path), body, { headers: new HttpHeaders({ 'Idempotency-Key': this.idempotencyKey() }) }); }
  private update<T>(path: string, version: number, body: unknown): Observable<T> { return this.http.patch<T>(this.api(path), body, { headers: this.ifMatch(version) }); }
  private lifecycle<T>(path: string, version: number): Observable<T> { return this.http.post<T>(this.api(path), {}, { headers: this.ifMatch(version) }); }
  private ifMatch(version: number): HttpHeaders { return new HttpHeaders({ 'If-Match': `"${version}"` }); }
  private idempotencyKey(): string { return globalThis.crypto?.randomUUID?.() ?? `catalog-${Date.now()}-${Math.random().toString(36).slice(2)}`; }
  private api(path: string): string { return platformApiUrl(this.config, `/api/v1${path}`); }
}
