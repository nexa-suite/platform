import { ChangeDetectionStrategy, Component, computed, effect, inject, untracked } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
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

@Component({
  selector: 'nexa-product-catalog-detail-page',
  imports: [ColdChainBadgeComponent, ErrorStateComponent, LoadingStateComponent, MatButtonModule, MatCardModule, NexaIconComponent, NgTemplateOutlet, PageHeaderComponent, RouterLink, TranslatePipe],
  templateUrl: './product-catalog-detail-page.component.html',
  styleUrl: './product-catalog-detail-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductCatalogDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly catalog = inject(CatalogStateService);
  private readonly params = toSignal(this.route.paramMap, { initialValue: this.route.snapshot.paramMap });

  readonly state = this.catalog.detailState;
  readonly item = computed(() => this.state().item);

  constructor() {
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

  formatPrice(item: ProductCatalogDetail): string {
    return `${item.unitPrice.amount.toFixed(2)} ${item.unitPrice.currency}`;
  }
}
