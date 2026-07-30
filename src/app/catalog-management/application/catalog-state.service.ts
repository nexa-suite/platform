import { Injectable, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import {
  CatalogDetailState,
  CatalogFilters,
  CatalogViewState,
  INITIAL_CATALOG_DETAIL_STATE,
  INITIAL_CATALOG_VIEW_STATE
} from '../domain/models/catalog.models';
import { CatalogApiService } from '../infrastructure/http/catalog-api.service';

@Injectable({ providedIn: 'root' })
export class CatalogStateService {
  private readonly api = inject(CatalogApiService);
  private readonly viewStateSignal = signal<CatalogViewState>(INITIAL_CATALOG_VIEW_STATE);
  private readonly detailStateSignal = signal<CatalogDetailState>(INITIAL_CATALOG_DETAIL_STATE);
  private listSubscription: Subscription | null = null;
  private detailSubscription: Subscription | null = null;
  private lastFilters: CatalogFilters | null = null;
  private lastId: string | null = null;

  readonly viewState = this.viewStateSignal.asReadonly();
  readonly detailState = this.detailStateSignal.asReadonly();

  load(filters: CatalogFilters): void {
    this.lastFilters = filters;
    const hasItems = this.viewStateSignal().items.length > 0;
    this.viewStateSignal.update((current) => ({
      ...current,
      status: hasItems ? 'retrying' : 'loading',
      message: null
    }));
    this.listSubscription?.unsubscribe();
    this.listSubscription = this.api.search(filters).subscribe({
      next: (page) => this.viewStateSignal.set({
        status: page.items.length > 0 ? 'success' : 'empty',
        items: page.items,
        page,
        message: null
      }),
      error: () => this.viewStateSignal.update((current) => ({ ...current, status: 'error', message: 'CATALOG_LOAD_FAILED' }))
    });
  }

  retry(): void {
    if (this.lastFilters) this.load(this.lastFilters);
  }

  loadDetail(id: string): void {
    this.lastId = id;
    const hasItem = this.detailStateSignal().item !== null;
    this.detailStateSignal.update((current) => ({
      ...current,
      status: hasItem ? 'retrying' : 'loading',
      message: null
    }));
    this.detailSubscription?.unsubscribe();
    this.detailSubscription = this.api.getById(id).subscribe({
      next: (item) => this.detailStateSignal.set({ status: 'success', item, message: null }),
      error: () => this.detailStateSignal.update((current) => ({ ...current, status: 'error', message: 'CATALOG_DETAIL_FAILED' }))
    });
  }

  retryDetail(): void {
    if (this.lastId) this.loadDetail(this.lastId);
  }
}
