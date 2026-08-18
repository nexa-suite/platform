import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { NexaIconComponent } from '../../../shared/presentation/components/nexa-icon/nexa-icon.component';
import { PageHeaderComponent } from '../../../shared/presentation/components/page-header/page-header.component';
import { SectionPanelComponent } from '../../../shared/presentation/components/section-panel/section-panel.component';
import { CatalogProductFamily, CatalogSellableSku } from '../../domain/models/catalog-management.models';
import { CatalogManagementApiService } from '../../infrastructure/http/catalog-management-api.service';

@Component({
  selector: 'nexa-catalog-product-form-page',
  standalone: true,
  imports: [NexaIconComponent, PageHeaderComponent, RouterLink, SectionPanelComponent, TranslatePipe],
  template: `
    <section class="catalog-management-page">
      <nexa-page-header [eyebrow]="'catalog.eyebrow' | translate" [title]="isNew ? 'Product Family authority' : (family()?.name ?? ('catalog.navigation.productDetail' | translate))" [subtitle]="'catalog.modules.products.description' | translate">
        <a page-header-actions routerLink="/ops/catalog/products"><nexa-icon name="arrow_back" /> {{ 'catalog.backToProducts' | translate }}</a>
      </nexa-page-header>
      @if (isNew) {
        <nexa-section-panel title="Product Family authority"><p class="notice">Esta pantalla es de consulta. Las familias y los SKU se administran en la autoridad canónica del catálogo.</p>
        </nexa-section-panel>
      } @else if (loading()) { <p role="status">{{ 'catalog.states.loading' | translate }}</p> }
      @else if (error(); as errorKey) { <p class="error" role="alert">{{ errorKey | translate }}</p> }
      @else if (family(); as current) {
        <div class="family-layout">
          <nexa-section-panel [title]="current.name">
            <div class="family-summary">@if (current.imagePath) { <img [src]="current.imagePath" [alt]="current.name" /> }<div><p class="muted">{{ current.code }} · {{ current.brandName }} · {{ current.categoryName }}</p><p>{{ current.description }}</p><dl><div><dt>{{ 'catalog.fields.status' | translate }}</dt><dd>{{ ('catalog.status.' + current.status) | translate }}</dd></div><div><dt>SKU</dt><dd>{{ current.skuCount }}</dd></div><div><dt>{{ 'catalog.fields.version' | translate }}</dt><dd>{{ current.version }}</dd></div></dl></div></div>
          </nexa-section-panel>
          <nexa-section-panel title="Sellable SKU presentations">
            @if (!skus().length) { <p>{{ 'catalog.states.emptyDescription' | translate }}</p> }
            @else { <div class="table-wrap"><table><thead><tr><th>SKU</th><th>{{ 'catalog.fields.presentation' | translate }}</th><th>{{ 'catalog.fields.unitOfMeasure' | translate }}</th><th>{{ 'catalog.fields.price' | translate }}</th><th>Availability</th><th>{{ 'catalog.fields.status' | translate }}</th></tr></thead><tbody>@for (sku of skus(); track sku.id) { <tr><td class="sku-cell">@if (sku.imagePath) { <img [src]="sku.imagePath" [alt]="current.name" loading="lazy" /> }<span><strong>{{ sku.skuCode }}</strong><small>@if (sku.variantName) { {{ sku.variantName }} · } {{ sku.legacyCatalogItemId || sku.id }}</small></span></td><td>{{ sku.presentation }}<small>{{ sku.packagingType }}</small></td><td>{{ sku.unitOfMeasure }} · {{ sku.packQuantity }}</td><td>{{ formatPrice(sku) }}</td><td><span [class.near-expiry]="sku.nearExpiry">{{ sku.availabilityStatus }}</span></td><td>{{ ('catalog.status.' + sku.status) | translate }}</td></tr> }</tbody></table></div>}
          </nexa-section-panel>
        </div>
      }
    </section>
  `,
  styles: [`
    :host { display: block; } .family-layout { display: grid; gap: var(--nexa-space-6); } .family-summary { display: flex; gap: var(--nexa-space-5); } .family-summary img { width: 10rem; height: 10rem; border-radius: var(--nexa-radius-sm); object-fit: cover; } .muted, small, dt { color: var(--nexa-color-text-secondary); } dl { display: flex; flex-wrap: wrap; gap: 1.5rem; } dt { font-size: var(--nexa-font-size-xs); } dd { margin: .25rem 0 0; font-weight: 600; } .table-wrap { overflow-x: auto; } table { width: 100%; border-collapse: collapse; } th, td { padding: .7rem .5rem; border-bottom: 1px solid var(--nexa-color-border-default); text-align: left; vertical-align: top; } th { color: var(--nexa-color-text-secondary); font-size: var(--nexa-font-size-xs); text-transform: uppercase; } small { display: block; } .sku-cell { display: flex; align-items: center; gap: .65rem; } .sku-cell img { width: 2.75rem; height: 2.75rem; border-radius: var(--nexa-radius-sm); object-fit: cover; } .near-expiry { color: var(--nexa-color-danger-700); font-weight: 600; } .error { color: var(--nexa-color-danger-700); } .notice { color: var(--nexa-color-text-secondary); }
    @media (max-width: 680px) { .family-summary { flex-direction: column; } .family-summary img { width: 100%; height: 12rem; } }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CatalogProductFormPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(CatalogManagementApiService);
  readonly familyId = this.route.snapshot.paramMap.get('productId');
  readonly isNew = !this.familyId;
  readonly family = signal<CatalogProductFamily | null>(null);
  readonly skus = signal<readonly CatalogSellableSku[]>([]);
  readonly loading = signal(!this.isNew);
  readonly error = signal<string | null>(null);

  constructor() {
    if (this.familyId) {
      this.api.family(this.familyId).subscribe({
        next: (family) => { this.family.set(family); this.api.skus('', family.id).subscribe({ next: (page) => { this.skus.set(page.items); this.loading.set(false); }, error: () => { this.error.set('catalog.states.errorDescription'); this.loading.set(false); } }); },
        error: () => { this.error.set('catalog.states.errorDescription'); this.loading.set(false); }
      });
    }
  }

  formatPrice(sku: CatalogSellableSku): string { return sku.currentPrice ? `${sku.currentPrice.amount.toFixed(2)} ${sku.currentPrice.currency}` : '—'; }
}
