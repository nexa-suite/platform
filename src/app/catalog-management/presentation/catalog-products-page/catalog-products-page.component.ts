import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthenticationService } from '../../../iam/application/authentication.service';
import { NexaIconComponent } from '../../../shared/presentation/components/nexa-icon/nexa-icon.component';
import { PageHeaderComponent } from '../../../shared/presentation/components/page-header/page-header.component';
import { SectionPanelComponent } from '../../../shared/presentation/components/section-panel/section-panel.component';
import { CatalogManagementApiService } from '../../infrastructure/http/catalog-management-api.service';
import { CatalogProduct } from '../../domain/models/catalog-management.models';

@Component({
  selector: 'nexa-catalog-products-page',
  standalone: true,
  imports: [NexaIconComponent, PageHeaderComponent, RouterLink, SectionPanelComponent, TranslatePipe],
  template: `
    <section class="catalog-management-page">
      <nexa-page-header [eyebrow]="'catalog.eyebrow' | translate" [title]="'catalog.navigation.products' | translate" [subtitle]="'catalog.modules.products.description' | translate">
        @if (canManage()) { <a page-header-actions class="primary-link" routerLink="/ops/catalog/products/new"><nexa-icon name="add" /> {{ 'catalog.actions.newProduct' | translate }}</a> }
      </nexa-page-header>
      <nexa-section-panel [title]="'catalog.results' | translate">
        <div class="toolbar"><label>{{ 'catalog.filters.query' | translate }}<input [value]="search()" (input)="search.set($any($event.target).value)" (keyup.enter)="load()" /></label><button type="button" (click)="load()">{{ 'catalog.actions.search' | translate }}</button></div>
        @if (loading()) { <p role="status">{{ 'catalog.states.loading' | translate }}</p> }
        @if (error(); as errorKey) { <div class="error" role="alert"><p>{{ errorKey | translate }}</p><button type="button" (click)="load()">{{ 'catalog.retry' | translate }}</button></div> }
        @if (!loading() && !error() && !products().length) { <p class="empty" role="status">{{ 'catalog.states.emptyDescription' | translate }}</p> }
        @if (!loading() && products().length) {
          <div class="table-wrap"><table>
            <thead><tr><th>{{ 'catalog.fields.name' | translate }}</th><th>{{ 'catalog.fields.code' | translate }}</th><th>{{ 'catalog.fields.category' | translate }}</th><th>{{ 'catalog.fields.brand' | translate }}</th><th>{{ 'catalog.fields.price' | translate }}</th><th>{{ 'catalog.fields.status' | translate }}</th><th>{{ 'catalog.fields.actions' | translate }}</th></tr></thead>
            <tbody>@for (product of products(); track product.id) {
              <tr><td><a [routerLink]="['/ops/catalog/products', product.id]">{{ product.name }}</a><small>{{ product.presentation }}</small></td><td>{{ product.productCode }}</td><td>{{ product.categoryName }}</td><td>{{ product.brandName }}</td><td>{{ formatPrice(product) }}</td><td>{{ ('catalog.status.' + product.status) | translate }}</td><td class="actions"><a [routerLink]="['/ops/catalog/products', product.id]">{{ 'catalog.actions.open' | translate }}</a>@if (canManage() && product.status !== 'ARCHIVED') { <button type="button" (click)="toggleStatus(product)">{{ product.status === 'ACTIVE' ? ('catalog.actions.deactivate' | translate) : ('catalog.actions.activate' | translate) }}</button> }</td></tr>
            }</tbody>
          </table></div>
        }
      </nexa-section-panel>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .primary-link { display: inline-flex; align-items: center; gap: .4rem; padding: .65rem .9rem; border-radius: var(--nexa-radius-sm); background: var(--nexa-color-primary-700); color: white; text-decoration: none; }
    .toolbar { display: flex; align-items: end; gap: var(--nexa-space-3); margin-bottom: var(--nexa-space-5); }
    label { display: grid; flex: 1; gap: .25rem; color: var(--nexa-color-text-secondary); font-size: var(--nexa-font-size-sm); }
    input { width: 100%; padding: .65rem .75rem; border: 1px solid var(--nexa-color-border-default); border-radius: var(--nexa-radius-sm); font: inherit; }
    button { min-height: 2.35rem; padding: .45rem .75rem; border: 0; border-radius: var(--nexa-radius-sm); background: var(--nexa-color-primary-700); color: white; cursor: pointer; font: inherit; }
    .error { color: var(--nexa-color-danger-700); } .error button { background: transparent; border: 1px solid currentColor; color: inherit; }
    .table-wrap { overflow-x: auto; } table { width: 100%; border-collapse: collapse; } th, td { padding: .75rem .5rem; border-bottom: 1px solid var(--nexa-color-border-default); text-align: left; vertical-align: top; } th { color: var(--nexa-color-text-secondary); font-size: var(--nexa-font-size-xs); text-transform: uppercase; } td a { color: var(--nexa-color-primary-700); font-weight: 600; } td small { display: block; color: var(--nexa-color-text-secondary); } .actions { display: flex; flex-wrap: wrap; gap: .5rem; } .actions a { align-self: center; } .actions button { background: transparent; border: 1px solid var(--nexa-color-border-default); color: var(--nexa-color-text-primary); }
    @media (max-width: 680px) { .toolbar { align-items: stretch; flex-direction: column; } }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CatalogProductsPageComponent {
  private readonly api = inject(CatalogManagementApiService);
  private readonly authentication = inject(AuthenticationService);
  readonly canManage = computed(() => this.authentication.hasPermission('catalog:manage'));
  readonly products = signal<readonly CatalogProduct[]>([]);
  readonly search = signal('');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  constructor() { this.load(); }

  load(): void {
    this.loading.set(true); this.error.set(null);
    this.api.products(this.search()).subscribe({ next: (page) => { this.products.set(page.items); this.loading.set(false); }, error: () => { this.error.set('catalog.states.errorDescription'); this.loading.set(false); } });
  }

  toggleStatus(product: CatalogProduct): void {
    const status = product.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    this.api.changeProductStatus(product.id, product.version, status).subscribe({ next: () => this.load(), error: () => this.error.set('catalog.states.saveError') });
  }

  formatPrice(product: CatalogProduct): string {
    const price = product.currentPrice;
    return price ? `${price.amount.toFixed(2)} ${price.currency}` : '—';
  }
}
