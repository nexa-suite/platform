import { ChangeDetectionStrategy, Component, computed, effect, inject, untracked } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@ngx-translate/core';
import { NexaIconComponent } from '../../../shared/presentation/components/nexa-icon/nexa-icon.component';
import { ColdChainBadgeComponent, ColdChainVariant } from '../../../shared/presentation/components/cold-chain-badge/cold-chain-badge.component';
import { EmptyStateComponent } from '../../../shared/presentation/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../shared/presentation/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../../shared/presentation/components/loading-state/loading-state.component';
import { PageHeaderComponent } from '../../../shared/presentation/components/page-header/page-header.component';
import { SectionPanelComponent } from '../../../shared/presentation/components/section-panel/section-panel.component';
import { CatalogStateService } from '../../application/catalog-state.service';
import { PlatformCatalogCartFacade } from '../../../core/presentation/catalog-cart/platform-catalog-cart.facade';
import {
  CatalogFilters,
  DEFAULT_CATALOG_FILTERS,
  parseColdChain,
  parseDirection,
  parsePage,
  parseSize,
  parseStatus,
  ProductCatalogItem
} from '../../domain/models/catalog.models';

type TextFilter = 'q' | 'category' | 'brand';
type SelectFilter = 'coldChain' | 'status';

@Component({
  selector: 'nexa-product-catalog-page',
  imports: [
    ColdChainBadgeComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    LoadingStateComponent,
    MatButtonModule,
    MatFormFieldModule,
    NexaIconComponent,
    MatInputModule,
    MatPaginatorModule,
    MatSelectModule,
    MatSortModule,
    MatTableModule,
    PageHeaderComponent,
    RouterLink,
    SectionPanelComponent,
    TranslatePipe
  ],
  templateUrl: './product-catalog-page.component.html',
  styleUrl: './product-catalog-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductCatalogPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly catalog = inject(CatalogStateService);
  private readonly queryParamMap = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });

  readonly filters = computed(() => this.readFilters(this.queryParamMap()));
  readonly state = this.catalog.viewState;
  readonly items = computed(() => this.state().items);
  readonly totalItems = computed(() => this.state().page?.totalItems ?? 0);
  readonly cart = inject(PlatformCatalogCartFacade);
  readonly displayedColumns = ['name', 'brand', 'category', 'presentation', 'coldChain', 'unitPrice', 'actions'];

  constructor() {
    this.cart.activate(this.queryParamMap().get('draftId'));
    effect(() => {
      const filters = this.filters();
      untracked(() => this.catalog.load(filters));
    });
  }

  onTextFilter(key: TextFilter, event: Event): void {
    this.updateQuery({ [key]: (event.target as HTMLInputElement).value.trim(), page: 0 });
  }

  onSelectFilter(key: SelectFilter, value: string): void {
    this.updateQuery({ [key]: value, page: 0 });
  }

  onSort(sort: Sort): void {
    this.updateQuery({
      sort: sort.direction ? sort.active : DEFAULT_CATALOG_FILTERS.sort,
      direction: sort.direction === 'desc' ? 'desc' : 'asc',
      page: 0
    });
  }

  onPage(page: PageEvent): void {
    this.updateQuery({ page: page.pageIndex, size: page.pageSize });
  }

  clearFilters(): void {
    this.updateQuery({ q: '', category: '', brand: '', coldChain: '', status: '', page: 0 });
  }

  retry(): void {
    this.catalog.retry();
  }

  detailQueryParams(): Record<string, string | number> {
    const draftId = this.queryParamMap().get('draftId');
    return {
      ...this.serializeFilters(this.filters()),
      ...(draftId ? { draftId } : {}),
    };
  }

  manualOrderPath(): string {
    const draftId = this.queryParamMap().get('draftId');
    return draftId ? `/ops/commercial/manual-orders/${draftId}/items` : '/ops/commercial/manual-order-entry';
  }

  toggleCart(item: ProductCatalogItem): void {
    this.cart.toggle(item);
  }

  isUnavailable(item: ProductCatalogItem): boolean {
    return ['OUT_OF_STOCK', 'UNAVAILABLE', 'OUT'].includes(item.availabilityStatus.trim().toUpperCase());
  }

  coldChainVariant(value: ProductCatalogItem['coldChain']): ColdChainVariant {
    return value === 'REFRIGERATED' ? 'refrigerated' : value === 'FROZEN' ? 'frozen' : 'ambient';
  }

  coldChainLabel(value: ProductCatalogItem['coldChain']): string {
    return `catalog.coldChain.${value.toLowerCase()}`;
  }

  formatPrice(item: ProductCatalogItem): string {
    return `${item.unitPrice.amount.toFixed(2)} ${item.unitPrice.currency}`;
  }

  private readFilters(params: ParamMap): CatalogFilters {
    return {
      q: params.get('q')?.trim() ?? '',
      category: params.get('category')?.trim() ?? '',
      brand: params.get('brand')?.trim() ?? '',
      coldChain: parseColdChain(params.get('coldChain')),
      status: parseStatus(params.get('status')),
      page: parsePage(params.get('page')),
      size: parseSize(params.get('size')),
      sort: params.get('sort')?.trim() || DEFAULT_CATALOG_FILTERS.sort,
      direction: parseDirection(params.get('direction'))
    };
  }

  private updateQuery(changes: Partial<CatalogFilters>): void {
    const next = { ...this.filters(), ...changes };
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: this.serializeFilters(next),
      replaceUrl: true
    });
  }

  private serializeFilters(filters: CatalogFilters): Record<string, string | number> {
    return {
      ...(filters.q ? { q: filters.q } : {}),
      ...(filters.category ? { category: filters.category } : {}),
      ...(filters.brand ? { brand: filters.brand } : {}),
      ...(filters.coldChain ? { coldChain: filters.coldChain } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      page: filters.page,
      size: filters.size,
      sort: filters.sort,
      direction: filters.direction
    };
  }
}
