export type ColdChainRequirement = 'NONE' | 'REFRIGERATED' | 'FROZEN';
export type CatalogStatusFilter = '' | 'ACTIVE' | 'INACTIVE';
export type CatalogLoadStatus = 'loading' | 'success' | 'empty' | 'error' | 'retrying';

export interface CatalogMoney {
  readonly amount: number;
  readonly currency: string;
}

export interface CatalogImage {
  readonly url: string | null;
  readonly fileName: string | null;
}

export interface ProductCatalogItem {
  readonly id: string;
  readonly name: string;
  readonly brand: string;
  readonly category: string;
  readonly presentation: string;
  readonly unitPrice: CatalogMoney;
  readonly coldChain: ColdChainRequirement;
  readonly image: CatalogImage;
}

export interface ProductCatalogDetail extends ProductCatalogItem {
  readonly description: string;
}

export interface CatalogFilters {
  readonly q: string;
  readonly category: string;
  readonly brand: string;
  readonly coldChain: '' | ColdChainRequirement;
  readonly status: CatalogStatusFilter;
  readonly page: number;
  readonly size: number;
  readonly sort: string;
  readonly direction: 'asc' | 'desc';
}

export interface CatalogPage {
  readonly items: readonly ProductCatalogItem[];
  readonly page: number;
  readonly size: number;
  readonly totalItems: number;
  readonly totalPages: number;
  readonly sort: { readonly field: string; readonly direction: 'asc' | 'desc' };
}

export interface CatalogViewState {
  readonly status: CatalogLoadStatus;
  readonly items: readonly ProductCatalogItem[];
  readonly page: CatalogPage | null;
  readonly message: string | null;
}

export interface CatalogDetailState {
  readonly status: CatalogLoadStatus;
  readonly item: ProductCatalogDetail | null;
  readonly message: string | null;
}

export const DEFAULT_CATALOG_FILTERS: CatalogFilters = {
  q: '',
  category: '',
  brand: '',
  coldChain: '',
  status: '',
  page: 0,
  size: 20,
  sort: 'itemName',
  direction: 'asc'
};

export const INITIAL_CATALOG_VIEW_STATE: CatalogViewState = {
  status: 'loading',
  items: [],
  page: null,
  message: null
};

export const INITIAL_CATALOG_DETAIL_STATE: CatalogDetailState = {
  status: 'loading',
  item: null,
  message: null
};

export function parseColdChain(value: string | null): CatalogFilters['coldChain'] {
  const normalized = value?.trim().toUpperCase();
  return normalized === 'NONE' || normalized === 'REFRIGERATED' || normalized === 'FROZEN' ? normalized : '';
}

export function parseStatus(value: string | null): CatalogStatusFilter {
  const normalized = value?.trim().toUpperCase();
  return normalized === 'ACTIVE' || normalized === 'INACTIVE' ? normalized : '';
}

export function parsePage(value: string | null): number {
  const page = Number(value);
  return Number.isInteger(page) && page >= 0 ? page : DEFAULT_CATALOG_FILTERS.page;
}

export function parseSize(value: string | null): number {
  const size = Number(value);
  return Number.isInteger(size) && size >= 1 && size <= 100 ? size : DEFAULT_CATALOG_FILTERS.size;
}

export function parseDirection(value: string | null): 'asc' | 'desc' {
  return value?.toLowerCase() === 'desc' ? 'desc' : 'asc';
}
