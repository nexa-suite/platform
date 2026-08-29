import { ChangeDetectionStrategy, Component, computed, effect, inject, untracked } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@ngx-translate/core';
import { NexaIconComponent } from '../../../shared/presentation/components/nexa-icon/nexa-icon.component';
import { ColdChainBadgeComponent, ColdChainVariant } from '../../../shared/presentation/components/cold-chain-badge/cold-chain-badge.component';
import { ErrorStateComponent } from '../../../shared/presentation/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../../shared/presentation/components/loading-state/loading-state.component';
import { PageHeaderComponent } from '../../../shared/presentation/components/page-header/page-header.component';
import { CatalogStateService } from '../../application/catalog-state.service';
import { ProductCatalogDetail } from '../../domain/models/catalog.models';
import { PlatformCatalogCartFacade } from '../../../core/presentation/catalog-cart/platform-catalog-cart.facade';

@Component({
  selector: 'nexa-product-catalog-detail-page',
  imports: [ColdChainBadgeComponent, ErrorStateComponent, LoadingStateComponent, NexaIconComponent, NgTemplateOutlet, PageHeaderComponent, RouterLink, TranslatePipe],
  templateUrl: './product-catalog-detail-page.component.html',
  styleUrl: './product-catalog-detail-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductCatalogDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly catalog = inject(CatalogStateService);
  private readonly params = toSignal(this.route.paramMap, { initialValue: this.route.snapshot.paramMap });
  private readonly queryParams = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });

  readonly state = this.catalog.detailState;
  readonly item = computed(() => this.state().item);
  readonly cart = inject(PlatformCatalogCartFacade);

  constructor() {
    this.cart.activate(this.queryParams().get('draftId'));
    effect(() => {
      const id = this.params().get('catalogItemId');
      if (id) untracked(() => this.catalog.loadDetail(id));
    });
  }

  retry(): void {
    this.catalog.retryDetail();
  }

  coldChainVariant(value: ProductCatalogDetail['coldChain']): ColdChainVariant {
    return value === 'REFRIGERATED' ? 'refrigerated' : value === 'FROZEN' ? 'frozen' : 'ambient';
  }

  coldChainLabel(value: ProductCatalogDetail['coldChain']): string {
    return `catalog.coldChain.${value.toLowerCase()}`;
  }

  availabilityLabelKey(item: ProductCatalogDetail): string {
    return `catalog.availability.${item.availabilityStatus.trim().toUpperCase().replaceAll('-', '_')}`;
  }

  isUnavailable(item: ProductCatalogDetail): boolean {
    return ['OUT_OF_STOCK', 'UNAVAILABLE', 'OUT'].includes(item.availabilityStatus.trim().toUpperCase());
  }

  hasDiscount(item: ProductCatalogDetail): boolean {
    return Boolean(item.basePrice && item.discountAmount && item.discountAmount.amount > 0 && item.basePrice.amount > item.unitPrice.amount);
  }

  toggleCart(item: ProductCatalogDetail): void {
    this.cart.toggle(item);
  }

  manualOrderPath(): string {
    const draftId = this.queryParams().get('draftId');
    return draftId ? `/ops/commercial/manual-orders/${draftId}/items` : '/ops/commercial/manual-order-entry';
  }

  formatPrice(item: ProductCatalogDetail): string {
    return `${item.unitPrice.amount.toFixed(2)} ${item.unitPrice.currency}`;
  }

  formatBasePrice(item: ProductCatalogDetail): string {
    const basePrice = item.basePrice ?? item.unitPrice;
    return `${basePrice.amount.toFixed(2)} ${basePrice.currency}`;
  }
}
