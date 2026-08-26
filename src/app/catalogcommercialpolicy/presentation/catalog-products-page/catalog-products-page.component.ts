import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { PageHeaderComponent } from '../../../shared/presentation/components/page-header/page-header.component';
import { SectionPanelComponent } from '../../../shared/presentation/components/section-panel/section-panel.component';
import { CatalogManagementFacade } from '../../application/catalog-management.facade';
import { CatalogProductFamily } from '../../domain/models/catalog-management.models';

@Component({
  selector: 'nexa-catalog-products-page',
  standalone: true,
  imports: [PageHeaderComponent, RouterLink, SectionPanelComponent, TranslatePipe],
  template: `
    <section class="catalog-management-page">
      <nexa-page-header [eyebrow]="'catalog.eyebrow' | translate" [title]="'catalog.navigation.products' | translate" [subtitle]="'catalog.modules.products.description' | translate" />
      <nexa-section-panel [title]="'catalog.results' | translate">
        <div class="toolbar"><label>{{ 'catalog.filters.query' | translate }}<input [value]="search()" (input)="search.set($any($event.target).value)" (keyup.enter)="load()" /></label><button type="button" (click)="load()">{{ 'catalog.actions.search' | translate }}</button></div>
        @if (loading()) { <p role="status">{{ 'catalog.states.loading' | translate }}</p> }
        @if (error(); as errorKey) { <div class="error" role="alert"><p>{{ errorKey | translate }}</p><button type="button" (click)="load()">{{ 'catalog.retry' | translate }}</button></div> }
        @if (!loading() && !error() && !families().length) { <p class="empty" role="status">{{ 'catalog.states.emptyDescription' | translate }}</p> }
        @if (!loading() && families().length) {
          <div class="table-wrap"><table>
            <thead><tr><th>{{ 'catalog.fields.name' | translate }}</th><th>{{ 'catalog.fields.code' | translate }}</th><th>{{ 'catalog.fields.category' | translate }}</th><th>{{ 'catalog.fields.brand' | translate }}</th><th>SKU</th><th>{{ 'catalog.fields.status' | translate }}</th></tr></thead>
            <tbody>@for (family of families(); track family.id) {
              <tr>
                <td class="family-cell">@if (family.imagePath) { <img [src]="family.imagePath" [alt]="family.name" loading="lazy" /> }<span><a [routerLink]="['/ops/catalog/products', family.id]">{{ family.name }}</a><small>{{ family.description }}</small></span></td>
                <td>{{ family.code }}</td><td>{{ family.categoryName }}</td><td>{{ family.brandName }}</td><td>{{ family.skuCount }}</td>
                <td>{{ ('catalog.status.' + family.status) | translate }}</td>
              </tr>
            }</tbody>
          </table></div>
        }
      </nexa-section-panel>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .toolbar { display: flex; align-items: end; gap: var(--nexa-space-3); margin-bottom: var(--nexa-space-5); }
    label { display: grid; flex: 1; gap: .25rem; color: var(--nexa-color-text-secondary); font-size: var(--nexa-font-size-sm); }
    input { width: 100%; padding: .65rem .75rem; border: 1px solid var(--nexa-color-border-default); border-radius: var(--nexa-radius-sm); font: inherit; }
    button { min-height: 2.35rem; padding: .45rem .75rem; border: 0; border-radius: var(--nexa-radius-sm); background: var(--nexa-color-primary-700); color: white; cursor: pointer; font: inherit; }
    .error { color: var(--nexa-color-danger-700); } .error button { background: transparent; border: 1px solid currentColor; color: inherit; }
    .table-wrap { overflow-x: auto; } table { width: 100%; border-collapse: collapse; } th, td { padding: .75rem .5rem; border-bottom: 1px solid var(--nexa-color-border-default); text-align: left; vertical-align: top; } th { color: var(--nexa-color-text-secondary); font-size: var(--nexa-font-size-xs); text-transform: uppercase; } td a { color: var(--nexa-color-primary-700); font-weight: 600; } td small { display: block; max-width: 28rem; color: var(--nexa-color-text-secondary); } .family-cell { display: flex; align-items: center; gap: .75rem; } .family-cell img { width: 3.5rem; height: 3.5rem; border-radius: var(--nexa-radius-sm); object-fit: cover; }
    @media (max-width: 680px) { .toolbar { align-items: stretch; flex-direction: column; } }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CatalogProductsPageComponent {
  private readonly api = inject(CatalogManagementFacade);
  readonly families = signal<readonly CatalogProductFamily[]>([]);
  readonly search = signal('');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  constructor() { this.load(); }

  load(): void {
    this.loading.set(true); this.error.set(null);
    this.api.families(this.search()).subscribe({
      next: (page) => { this.families.set(page.items); this.loading.set(false); },
      error: () => { this.error.set('catalog.states.errorDescription'); this.loading.set(false); }
    });
  }
}
