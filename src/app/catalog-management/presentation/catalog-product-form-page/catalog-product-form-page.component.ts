import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { forkJoin, of } from 'rxjs';
import { AuthenticationService } from '../../../iam/application/authentication.service';
import { NexaIconComponent } from '../../../shared/presentation/components/nexa-icon/nexa-icon.component';
import { PageHeaderComponent } from '../../../shared/presentation/components/page-header/page-header.component';
import { SectionPanelComponent } from '../../../shared/presentation/components/section-panel/section-panel.component';
import { CatalogManagementApiService } from '../../infrastructure/http/catalog-management-api.service';
import { CatalogBrand, CatalogCategory, CatalogProduct, CatalogProductCommand } from '../../domain/models/catalog-management.models';

@Component({
  selector: 'nexa-catalog-product-form-page',
  standalone: true,
  imports: [NexaIconComponent, PageHeaderComponent, ReactiveFormsModule, RouterLink, SectionPanelComponent, TranslatePipe],
  template: `
    <section class="catalog-management-page">
      <nexa-page-header [eyebrow]="'catalog.eyebrow' | translate" [title]="isNew ? ('catalog.actions.newProduct' | translate) : ('catalog.navigation.productDetail' | translate)" [subtitle]="'catalog.modules.products.description' | translate">
        <a page-header-actions routerLink="/ops/catalog/products"><nexa-icon name="arrow_back" /> {{ 'catalog.backToProducts' | translate }}</a>
      </nexa-page-header>
      @if (loading()) { <p role="status">{{ 'catalog.states.loading' | translate }}</p> }
      @if (error(); as errorKey) { <p class="error" role="alert">{{ errorKey | translate }}</p> }
      @if (!loading()) {
        <div class="product-layout">
          <nexa-section-panel [title]="'catalog.fields.commercialDefinition' | translate">
            <form [formGroup]="form" (ngSubmit)="save()" novalidate>
              <div class="form-grid">
                <label>{{ 'catalog.fields.catalogItemId' | translate }}<input formControlName="catalogItemId" [readonly]="!isNew" /></label>
                <label>{{ 'catalog.fields.code' | translate }}<input formControlName="productCode" [readonly]="!isNew" /></label>
                <label>{{ 'catalog.fields.slug' | translate }}<input formControlName="slug" /></label>
                <label>{{ 'catalog.fields.name' | translate }}<input formControlName="name" /></label>
                <label>{{ 'catalog.fields.category' | translate }}<select formControlName="categoryId"><option value="">{{ 'catalog.fields.selectCategory' | translate }}</option>@for (category of categories(); track category.id) { <option [value]="category.id">{{ category.name }}</option> }</select></label>
                <label>{{ 'catalog.fields.brand' | translate }}<select formControlName="brandId"><option value="">{{ 'catalog.fields.selectBrand' | translate }}</option>@for (brand of brands(); track brand.id) { <option [value]="brand.id">{{ brand.name }}</option> }</select></label>
                <label>{{ 'catalog.fields.storageTemperature' | translate }}<input formControlName="storageTemperature" /></label>
                <label>{{ 'catalog.fields.presentation' | translate }}<input formControlName="presentation" /></label>
                <label>{{ 'catalog.fields.unitOfMeasure' | translate }}<input formControlName="unitOfMeasure" /></label>
                <label>{{ 'catalog.fields.imagePath' | translate }}<input formControlName="imagePath" /></label>
              </div>
              <label>{{ 'catalog.fields.description' | translate }}<textarea formControlName="description" rows="4"></textarea></label>
              <label class="check"><input type="checkbox" formControlName="buyerVisible" /> {{ 'catalog.fields.buyerVisible' | translate }}</label>
              @if (canManage()) { <div class="form-actions"><button type="submit" [disabled]="form.invalid || saving()">{{ saving() ? ('catalog.states.saving' | translate) : ('catalog.actions.save' | translate) }}</button></div> }
            </form>
          </nexa-section-panel>
          @if (product(); as current) {
            <nexa-section-panel [title]="'catalog.fields.lifecycle' | translate">
              <dl><div><dt>{{ 'catalog.fields.status' | translate }}</dt><dd>{{ ('catalog.status.' + current.status) | translate }}</dd></div><div><dt>{{ 'catalog.fields.version' | translate }}</dt><dd>{{ current.version }}</dd></div><div><dt>{{ 'catalog.fields.price' | translate }}</dt><dd>{{ current.currentPrice ? (current.currentPrice.amount.toFixed(2) + ' ' + current.currentPrice.currency) : '—' }}</dd></div></dl>
              @if (canManage() && current.status !== 'ARCHIVED') { <div class="form-actions"><button type="button" (click)="changeStatus(current)">{{ current.status === 'ACTIVE' ? ('catalog.actions.deactivate' | translate) : ('catalog.actions.activate' | translate) }}</button></div> }
              <a class="secondary-link" routerLink="/ops/catalog/pricing">{{ 'catalog.actions.managePricing' | translate }}</a>
            </nexa-section-panel>
          }
        </div>
      }
    </section>
  `,
  styles: [`
    :host { display: block; } .product-layout { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(16rem, .8fr); gap: var(--nexa-space-6); }
    form, dl { display: grid; gap: var(--nexa-space-3); } .form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--nexa-space-3); }
    label { display: grid; gap: .25rem; color: var(--nexa-color-text-secondary); font-size: var(--nexa-font-size-sm); } input, textarea, select { width: 100%; padding: .65rem .75rem; border: 1px solid var(--nexa-color-border-default); border-radius: var(--nexa-radius-sm); background: var(--nexa-surface-card); font: inherit; } input[type=checkbox] { width: auto; } .check { display: flex; align-items: center; gap: .5rem; margin-top: var(--nexa-space-3); }
    button { min-height: 2.35rem; padding: .45rem .75rem; border: 0; border-radius: var(--nexa-radius-sm); background: var(--nexa-color-primary-700); color: white; cursor: pointer; font: inherit; } button:disabled { opacity: .55; cursor: not-allowed; } .form-actions { display: flex; gap: .5rem; margin-top: var(--nexa-space-4); } dt { color: var(--nexa-color-text-secondary); font-size: var(--nexa-font-size-xs); } dd { margin: 0; font-weight: 600; } .secondary-link { display: inline-block; margin-top: var(--nexa-space-5); color: var(--nexa-color-primary-700); } .error { color: var(--nexa-color-danger-700); }
    @media (max-width: 820px) { .product-layout, .form-grid { grid-template-columns: 1fr; } }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CatalogProductFormPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(CatalogManagementApiService);
  private readonly auth = inject(AuthenticationService);
  private readonly fb = inject(FormBuilder);
  readonly productId = this.route.snapshot.paramMap.get('productId');
  readonly isNew = !this.productId;
  readonly canManage = computed(() => this.auth.hasPermission('catalog:manage'));
  readonly categories = signal<readonly CatalogCategory[]>([]);
  readonly brands = signal<readonly CatalogBrand[]>([]);
  readonly product = signal<CatalogProduct | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly form = this.fb.nonNullable.group({
    catalogItemId: ['', Validators.required], productCode: ['', Validators.required], slug: ['', Validators.required], name: ['', Validators.required], description: [''], categoryId: ['', Validators.required], brandId: ['', Validators.required], storageTemperature: ['', Validators.required], presentation: ['', Validators.required], unitOfMeasure: ['', Validators.required], buyerVisible: [true], imagePath: ['']
  });

  constructor() {
    const sources = { categories: this.api.categories(), brands: this.api.brands(), product: this.productId ? this.api.product(this.productId) : of(null) };
    forkJoin(sources).subscribe({ next: ({ categories, brands, product }) => { this.categories.set(categories.items); this.brands.set(brands.items); if (product) { this.product.set(product); this.form.patchValue({ catalogItemId: product.catalogItemId, productCode: product.productCode, slug: product.slug, name: product.name, description: product.description, categoryId: product.categoryId, brandId: product.brandId, storageTemperature: product.storageTemperature, presentation: product.presentation, unitOfMeasure: product.unitOfMeasure, buyerVisible: product.buyerVisible, imagePath: product.imagePath ?? '' }); if (!this.canManage()) this.form.disable(); } this.loading.set(false); }, error: () => { this.error.set('catalog.states.errorDescription'); this.loading.set(false); } });
  }

  save(): void {
    if (!this.canManage() || this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true); this.error.set(null);
    const command: CatalogProductCommand = this.form.getRawValue();
    const request = this.productId && this.product() ? this.api.updateProduct(this.productId, this.product()!.version, command) : this.api.createProduct(command);
    request.subscribe({ next: (product) => { this.product.set(product); this.saving.set(false); void this.router.navigate(['/ops/catalog/products', product.id]); }, error: () => { this.error.set('catalog.states.saveError'); this.saving.set(false); } });
  }

  changeStatus(product: CatalogProduct): void {
    const status = product.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    this.api.changeProductStatus(product.id, product.version, status).subscribe({ next: (updated) => { this.product.set(updated); }, error: () => this.error.set('catalog.states.saveError') });
  }
}
