import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthenticationService } from '../../../iam/application/authentication.service';
import { NexaIconComponent } from '../../../shared/presentation/components/nexa-icon/nexa-icon.component';
import { PageHeaderComponent } from '../../../shared/presentation/components/page-header/page-header.component';
import { SectionPanelComponent } from '../../../shared/presentation/components/section-panel/section-panel.component';
import { CatalogSellableSku, CatalogPrice, CatalogPriceCommand } from '../../domain/models/catalog-management.models';
import { CatalogManagementApiService } from '../../infrastructure/http/catalog-management-api.service';

@Component({
  selector: 'nexa-catalog-pricing-page',
  standalone: true,
  imports: [NexaIconComponent, PageHeaderComponent, ReactiveFormsModule, RouterLink, SectionPanelComponent, TranslatePipe],
  template: `
    <section class="catalog-management-page">
      <nexa-page-header [eyebrow]="'catalog.eyebrow' | translate" [title]="'catalog.navigation.pricing' | translate" [subtitle]="'catalog.modules.pricing.description' | translate"><a page-header-actions routerLink="/ops/catalog"><nexa-icon name="arrow_back" /> {{ 'catalog.backToCatalogHome' | translate }}</a></nexa-page-header>
      <div class="pricing-layout">
        <nexa-section-panel title="Sellable SKU pricing">
          <label>{{ 'catalog.filters.query' | translate }}<input [value]="search()" (input)="search.set($any($event.target).value)" (keyup.enter)="loadSkus()" /></label>
          @if (loading()) { <p role="status">{{ 'catalog.states.loading' | translate }}</p> }
          @if (!loading() && !skus().length) { <p>{{ 'catalog.states.emptyDescription' | translate }}</p> }
          @for (sku of skus(); track sku.id) { <button type="button" class="sku-option" [class.selected]="selectedSku()?.id === sku.id" (click)="selectSku(sku)"><strong>{{ sku.familyName }}</strong><span>{{ sku.skuCode }} · {{ sku.presentation }} · {{ formatPrice(sku) }}</span></button> }
        </nexa-section-panel>
        <nexa-section-panel title="Canonical price history">
          @if (!selectedSku()) { <p>{{ 'catalog.states.selectProduct' | translate }}</p> }
          @if (selectedSku(); as sku) {
            <p class="selected-title"><strong>{{ sku.familyName }}</strong> · {{ sku.skuCode }} · {{ sku.presentation }} · {{ sku.availabilityStatus }}</p>
            @if (canManagePrice()) { <form [formGroup]="form" (ngSubmit)="createPrice()" class="price-form"><div class="form-grid"><label>{{ 'catalog.fields.amount' | translate }}<input type="number" min="0" step="0.01" formControlName="amount" /></label><label>{{ 'catalog.fields.currency' | translate }}<input formControlName="currency" maxlength="3" /></label><label>{{ 'catalog.fields.validFrom' | translate }}<input type="datetime-local" formControlName="validFrom" /></label><label>{{ 'catalog.fields.validUntil' | translate }}<input type="datetime-local" formControlName="validUntil" /></label></div><div class="form-grid"><label>{{ 'catalog.fields.sourceCode' | translate }}<input formControlName="sourceCode" /></label><label>{{ 'catalog.fields.sourceDescription' | translate }}<input formControlName="sourceDescription" /></label></div><button type="submit" [disabled]="form.invalid || saving()">{{ saving() ? ('catalog.states.saving' | translate) : ('catalog.actions.createPrice' | translate) }}</button></form> }
            @if (error(); as errorKey) { <p class="error" role="alert">{{ errorKey | translate }}</p> }
            @if (!prices().length) { <p>{{ 'catalog.states.noPrices' | translate }}</p> }
            @if (prices().length) { <div class="table-wrap"><table><thead><tr><th>{{ 'catalog.fields.amount' | translate }}</th><th>{{ 'catalog.fields.validFrom' | translate }}</th><th>{{ 'catalog.fields.validUntil' | translate }}</th><th>{{ 'catalog.fields.priceState' | translate }}</th></tr></thead><tbody>@for (price of prices(); track price.id) { <tr><td>{{ price.amount.toFixed(2) }} {{ price.currency }}</td><td>{{ formatDate(price.validFrom) }}</td><td>{{ price.validUntil ? formatDate(price.validUntil) : '—' }}</td><td>{{ ('catalog.priceState.' + stateOf(price)) | translate }}</td></tr> }</tbody></table></div> }
          }
        </nexa-section-panel>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; } .pricing-layout { display: grid; grid-template-columns: minmax(15rem, .75fr) minmax(0, 1.75fr); gap: var(--nexa-space-6); } label { display: grid; gap: .25rem; margin-bottom: var(--nexa-space-3); color: var(--nexa-color-text-secondary); font-size: var(--nexa-font-size-sm); } input { width: 100%; padding: .65rem .75rem; border: 1px solid var(--nexa-color-border-default); border-radius: var(--nexa-radius-sm); font: inherit; } .sku-option { display: grid; width: 100%; gap: .2rem; margin: .35rem 0; padding: .75rem; border: 1px solid var(--nexa-color-border-default); border-radius: var(--nexa-radius-sm); background: var(--nexa-surface-card); text-align: left; cursor: pointer; font: inherit; } .sku-option span { color: var(--nexa-color-text-secondary); font-size: var(--nexa-font-size-xs); } .sku-option.selected { border-color: var(--nexa-color-primary-700); box-shadow: 0 0 0 1px var(--nexa-color-primary-700); } .selected-title { margin-top: 0; } .price-form { padding: var(--nexa-space-4); margin-bottom: var(--nexa-space-5); border: 1px solid var(--nexa-color-border-default); border-radius: var(--nexa-radius-sm); } .form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--nexa-space-3); } button { min-height: 2.35rem; padding: .45rem .75rem; border: 0; border-radius: var(--nexa-radius-sm); background: var(--nexa-color-primary-700); color: white; cursor: pointer; font: inherit; } button:disabled { opacity: .55; cursor: not-allowed; } .table-wrap { overflow-x: auto; } table { width: 100%; border-collapse: collapse; } th, td { padding: .7rem .5rem; border-bottom: 1px solid var(--nexa-color-border-default); text-align: left; vertical-align: top; } th { color: var(--nexa-color-text-secondary); font-size: var(--nexa-font-size-xs); text-transform: uppercase; } .error { color: var(--nexa-color-danger-700); }
    @media (max-width: 820px) { .pricing-layout, .form-grid { grid-template-columns: 1fr; } }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CatalogPricingPageComponent {
  private readonly api = inject(CatalogManagementApiService);
  private readonly auth = inject(AuthenticationService);
  private readonly fb = inject(FormBuilder);
  readonly canManagePrice = computed(() => this.auth.hasPermission('catalog:price:manage'));
  readonly skus = signal<readonly CatalogSellableSku[]>([]);
  readonly selectedSku = signal<CatalogSellableSku | null>(null);
  readonly prices = signal<readonly CatalogPrice[]>([]);
  readonly search = signal('');
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly form = this.fb.nonNullable.group({ amount: [0, [Validators.required, Validators.min(0)]], currency: ['PEN', [Validators.required, Validators.minLength(3), Validators.maxLength(3)]], validFrom: ['', Validators.required], validUntil: [''], sourceCode: ['PLATFORM'], sourceDescription: [''] });

  constructor() { this.loadSkus(); }

  loadSkus(): void {
    this.loading.set(true); this.error.set(null);
    this.api.skus(this.search()).subscribe({ next: (page) => { this.skus.set(page.items); if (!this.selectedSku() && page.items[0]) this.selectSku(page.items[0]); this.loading.set(false); }, error: () => { this.error.set('catalog.states.errorDescription'); this.loading.set(false); } });
  }
  selectSku(sku: CatalogSellableSku): void { this.selectedSku.set(sku); this.error.set(null); this.api.prices(sku.id).subscribe({ next: (prices) => this.prices.set(prices), error: () => this.error.set('catalog.states.errorDescription') }); }
  createPrice(): void {
    const sku = this.selectedSku(); if (!sku || !this.canManagePrice() || this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true); this.error.set(null); const value = this.form.getRawValue();
    const command: CatalogPriceCommand = { amount: Number(value.amount), currency: value.currency.toUpperCase(), validFrom: this.toInstant(value.validFrom), validUntil: value.validUntil ? this.toInstant(value.validUntil) : null, sourceCode: value.sourceCode, sourceDescription: value.sourceDescription };
    this.api.createPrice(sku.id, command).subscribe({ next: () => { this.saving.set(false); this.selectSku(sku); }, error: () => { this.saving.set(false); this.error.set('catalog.states.saveError'); } });
  }
  stateOf(price: CatalogPrice): 'current' | 'future' | 'historical' | 'cancelled' { if (price.cancelled) return 'cancelled'; const now = Date.now(); if (new Date(price.validFrom).getTime() > now) return 'future'; if (!price.validUntil || new Date(price.validUntil).getTime() > now) return 'current'; return 'historical'; }
  formatPrice(sku: CatalogSellableSku): string { return sku.currentPrice ? `${sku.currentPrice.amount.toFixed(2)} ${sku.currentPrice.currency}` : '—'; }
  formatDate(value: string): string { return new Date(value).toLocaleString(); }
  private toInstant(value: string): string { return new Date(value).toISOString(); }
}
