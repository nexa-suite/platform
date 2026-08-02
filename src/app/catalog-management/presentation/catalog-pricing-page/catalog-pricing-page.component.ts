import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthenticationService } from '../../../iam/application/authentication.service';
import { NexaIconComponent } from '../../../shared/presentation/components/nexa-icon/nexa-icon.component';
import { PageHeaderComponent } from '../../../shared/presentation/components/page-header/page-header.component';
import { SectionPanelComponent } from '../../../shared/presentation/components/section-panel/section-panel.component';
import { CatalogManagementApiService } from '../../infrastructure/http/catalog-management-api.service';
import { CatalogPrice, CatalogPriceCommand, CatalogProduct } from '../../domain/models/catalog-management.models';

@Component({
  selector: 'nexa-catalog-pricing-page',
  standalone: true,
  imports: [NexaIconComponent, PageHeaderComponent, ReactiveFormsModule, RouterLink, SectionPanelComponent, TranslatePipe],
  template: `
    <section class="catalog-management-page">
      <nexa-page-header [eyebrow]="'catalog.eyebrow' | translate" [title]="'catalog.navigation.pricing' | translate" [subtitle]="'catalog.modules.pricing.description' | translate">
        <a page-header-actions routerLink="/ops/catalog"><nexa-icon name="arrow_back" /> {{ 'catalog.backToCatalogHome' | translate }}</a>
      </nexa-page-header>
      <div class="pricing-layout">
        <nexa-section-panel [title]="'catalog.fields.products' | translate">
          <label>{{ 'catalog.filters.query' | translate }}<input [value]="search()" (input)="search.set($any($event.target).value)" (keyup.enter)="loadProducts()" /></label>
          @if (loading()) { <p role="status">{{ 'catalog.states.loading' | translate }}</p> }
          @if (!loading() && !products().length) { <p>{{ 'catalog.states.emptyDescription' | translate }}</p> }
          @for (product of products(); track product.id) { <button type="button" class="product-option" [class.selected]="selectedProduct()?.id === product.id" (click)="selectProduct(product)"><strong>{{ product.name }}</strong><span>{{ product.productCode }} · {{ product.currentPrice ? (product.currentPrice.amount.toFixed(2) + ' ' + product.currentPrice.currency) : '—' }}</span></button> }
        </nexa-section-panel>
        <nexa-section-panel [title]="'catalog.fields.priceHistory' | translate">
          @if (!selectedProduct()) { <p>{{ 'catalog.states.selectProduct' | translate }}</p> }
          @if (selectedProduct(); as product) {
            <p class="selected-title"><strong>{{ product.name }}</strong> · {{ product.categoryName }} · {{ product.brandName }}</p>
            @if (canManagePrice()) {
              <form [formGroup]="form" (ngSubmit)="createPrice()" class="price-form">
                <div class="form-grid"><label>{{ 'catalog.fields.amount' | translate }}<input type="number" min="0" step="0.01" formControlName="amount" /></label><label>{{ 'catalog.fields.currency' | translate }}<input formControlName="currency" maxlength="3" /></label><label>{{ 'catalog.fields.validFrom' | translate }}<input type="datetime-local" formControlName="validFrom" /></label><label>{{ 'catalog.fields.validUntil' | translate }}<input type="datetime-local" formControlName="validUntil" /></label></div>
                <div class="form-grid"><label>{{ 'catalog.fields.sourceCode' | translate }}<input formControlName="sourceCode" /></label><label>{{ 'catalog.fields.sourceDescription' | translate }}<input formControlName="sourceDescription" /></label></div>
                <button type="submit" [disabled]="form.invalid || saving()">{{ saving() ? ('catalog.states.saving' | translate) : ('catalog.actions.createPrice' | translate) }}</button>
              </form>
            }
            @if (error(); as errorKey) { <p class="error" role="alert">{{ errorKey | translate }}</p> }
            @if (!prices().length) { <p>{{ 'catalog.states.noPrices' | translate }}</p> }
            @if (prices().length) { <div class="table-wrap"><table><thead><tr><th>{{ 'catalog.fields.amount' | translate }}</th><th>{{ 'catalog.fields.validFrom' | translate }}</th><th>{{ 'catalog.fields.validUntil' | translate }}</th><th>{{ 'catalog.fields.priceState' | translate }}</th><th>{{ 'catalog.fields.actions' | translate }}</th></tr></thead><tbody>@for (price of prices(); track price.id) { <tr><td>{{ price.amount.toFixed(2) }} {{ price.currency }}</td><td>{{ formatDate(price.validFrom) }}</td><td>{{ price.validUntil ? formatDate(price.validUntil) : '—' }}</td><td>{{ ('catalog.priceState.' + stateOf(price)) | translate }}</td><td>@if (canManagePrice() && !price.cancelled) { <button type="button" class="secondary" (click)="cancel(price)">{{ 'catalog.actions.cancelPrice' | translate }}</button> } @else { — }</td></tr> }</tbody></table></div> }
          }
        </nexa-section-panel>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; } .pricing-layout { display: grid; grid-template-columns: minmax(15rem, .75fr) minmax(0, 1.75fr); gap: var(--nexa-space-6); }
    label { display: grid; gap: .25rem; margin-bottom: var(--nexa-space-3); color: var(--nexa-color-text-secondary); font-size: var(--nexa-font-size-sm); } input { width: 100%; padding: .65rem .75rem; border: 1px solid var(--nexa-color-border-default); border-radius: var(--nexa-radius-sm); font: inherit; } .product-option { display: grid; width: 100%; gap: .2rem; margin: .35rem 0; padding: .75rem; border: 1px solid var(--nexa-color-border-default); border-radius: var(--nexa-radius-sm); background: var(--nexa-surface-card); text-align: left; cursor: pointer; font: inherit; } .product-option span { color: var(--nexa-color-text-secondary); font-size: var(--nexa-font-size-xs); } .product-option.selected { border-color: var(--nexa-color-primary-700); box-shadow: 0 0 0 1px var(--nexa-color-primary-700); } .selected-title { margin-top: 0; } .price-form { padding: var(--nexa-space-4); margin-bottom: var(--nexa-space-5); border: 1px solid var(--nexa-color-border-default); border-radius: var(--nexa-radius-sm); } .form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--nexa-space-3); } button { min-height: 2.35rem; padding: .45rem .75rem; border: 0; border-radius: var(--nexa-radius-sm); background: var(--nexa-color-primary-700); color: white; cursor: pointer; font: inherit; } button:disabled { opacity: .55; cursor: not-allowed; } button.secondary { background: transparent; border: 1px solid var(--nexa-color-border-default); color: var(--nexa-color-text-primary); } .table-wrap { overflow-x: auto; } table { width: 100%; border-collapse: collapse; } th, td { padding: .7rem .5rem; border-bottom: 1px solid var(--nexa-color-border-default); text-align: left; vertical-align: top; } th { color: var(--nexa-color-text-secondary); font-size: var(--nexa-font-size-xs); text-transform: uppercase; } .error { color: var(--nexa-color-danger-700); } .success { color: var(--nexa-color-success-700); }
    @media (max-width: 820px) { .pricing-layout, .form-grid { grid-template-columns: 1fr; } }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CatalogPricingPageComponent {
  private readonly api = inject(CatalogManagementApiService);
  private readonly auth = inject(AuthenticationService);
  private readonly fb = inject(FormBuilder);
  readonly canManagePrice = computed(() => this.auth.hasPermission('catalog:price:manage'));
  readonly products = signal<readonly CatalogProduct[]>([]);
  readonly selectedProduct = signal<CatalogProduct | null>(null);
  readonly prices = signal<readonly CatalogPrice[]>([]);
  readonly search = signal('');
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly form = this.fb.nonNullable.group({ amount: [0, [Validators.required, Validators.min(0)]], currency: ['PEN', [Validators.required, Validators.minLength(3), Validators.maxLength(3)]], validFrom: ['', Validators.required], validUntil: [''], sourceCode: ['PLATFORM'], sourceDescription: [''] });

  constructor() { this.loadProducts(); }

  loadProducts(): void { this.loading.set(true); this.api.products(this.search()).subscribe({ next: (page) => { this.products.set(page.items); if (!this.selectedProduct() && page.items[0]) this.selectProduct(page.items[0]); this.loading.set(false); }, error: () => { this.error.set('catalog.states.errorDescription'); this.loading.set(false); } }); }
  selectProduct(product: CatalogProduct): void { this.selectedProduct.set(product); this.error.set(null); this.api.prices(product.id).subscribe({ next: (prices) => this.prices.set(prices), error: () => this.error.set('catalog.states.errorDescription') }); }
  createPrice(): void {
    const product = this.selectedProduct(); if (!product || !this.canManagePrice() || this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true); this.error.set(null); const value = this.form.getRawValue();
    const command: CatalogPriceCommand = { amount: Number(value.amount), currency: value.currency.toUpperCase(), validFrom: this.toInstant(value.validFrom), validUntil: value.validUntil ? this.toInstant(value.validUntil) : null, sourceCode: value.sourceCode, sourceDescription: value.sourceDescription };
    this.api.createPrice(product.id, command).subscribe({ next: () => { this.saving.set(false); this.selectProduct(product); }, error: () => { this.saving.set(false); this.error.set('catalog.states.saveError'); } });
  }
  cancel(price: CatalogPrice): void { this.api.cancelPrice(price.id, price.version).subscribe({ next: () => { const product = this.selectedProduct(); if (product) this.selectProduct(product); }, error: () => this.error.set('catalog.states.saveError') }); }
  stateOf(price: CatalogPrice): 'current' | 'future' | 'historical' | 'cancelled' { if (price.cancelled) return 'cancelled'; const now = Date.now(); if (new Date(price.validFrom).getTime() > now) return 'future'; if (!price.validUntil || new Date(price.validUntil).getTime() > now) return 'current'; return 'historical'; }
  formatDate(value: string): string { return new Date(value).toLocaleString(); }
  private toInstant(value: string): string { return new Date(value).toISOString(); }
}
