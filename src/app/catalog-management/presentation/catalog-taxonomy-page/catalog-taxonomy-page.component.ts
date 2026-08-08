import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { CatalogManagementApiService } from '../../infrastructure/http/catalog-management-api.service';
import { CatalogBrand, CatalogCategory } from '../../domain/models/catalog-management.models';
import { NexaIconComponent } from '../../../shared/presentation/components/nexa-icon/nexa-icon.component';
import { PageHeaderComponent } from '../../../shared/presentation/components/page-header/page-header.component';
import { SectionPanelComponent } from '../../../shared/presentation/components/section-panel/section-panel.component';

type TaxonomyItem = CatalogCategory | CatalogBrand;

@Component({
  selector: 'nexa-catalog-taxonomy-page',
  standalone: true,
  imports: [NexaIconComponent, PageHeaderComponent, ReactiveFormsModule, RouterLink, SectionPanelComponent, TranslatePipe],
  template: `
    <section class="catalog-management-page">
      <nexa-page-header [eyebrow]="'catalog.eyebrow' | translate" [title]="titleKey() | translate" [subtitle]="descriptionKey() | translate">
        <a page-header-actions routerLink="/ops/catalog"><nexa-icon name="arrow_back" /> {{ 'catalog.backToCatalogHome' | translate }}</a>
      </nexa-page-header>
      <div class="management-grid">
        <nexa-section-panel [title]="formTitleKey() | translate">
          <form [formGroup]="form" (ngSubmit)="save()" novalidate>
            @if (isCategory()) {
              <label>{{ 'catalog.fields.parentId' | translate }}<select formControlName="parentId"><option value="">{{ 'catalog.fields.optional' | translate }}</option>@for (parent of parentOptions(); track parent.id) { <option [value]="parent.id" [disabled]="parent.id === editingId()">{{ parent.name }} · {{ parent.slug }}</option> }</select></label>
            }
            <label>{{ 'catalog.fields.slug' | translate }}<input formControlName="slug" autocomplete="off" /></label>
            <label>{{ 'catalog.fields.name' | translate }}<input formControlName="name" autocomplete="off" /></label>
            <label>{{ 'catalog.fields.description' | translate }}<textarea formControlName="description" rows="3"></textarea></label>
            <div class="form-actions">
              <button type="submit" [disabled]="form.invalid || saving()">{{ saving() ? ('catalog.states.saving' | translate) : ('catalog.actions.save' | translate) }}</button>
              @if (editingId()) { <button type="button" class="secondary" (click)="resetForm()">{{ 'catalog.actions.cancel' | translate }}</button> }
            </div>
          </form>
          @if (message(); as messageKey) { <p class="success" role="status">{{ messageKey | translate }}</p> }
          @if (error(); as errorKey) { <p class="error" role="alert">{{ errorKey | translate }}</p> }
        </nexa-section-panel>
        <nexa-section-panel [title]="'catalog.results' | translate">
          <label class="search">{{ 'catalog.filters.query' | translate }}<input [value]="search()" (input)="search.set($any($event.target).value)" (keyup.enter)="load()" /></label>
          @if (loading()) { <p role="status">{{ 'catalog.states.loading' | translate }}</p> }
          @if (!loading() && !items().length) { <p class="empty">{{ 'catalog.states.emptyDescription' | translate }}</p> }
          @if (!loading() && items().length) {
            <div class="table-wrap"><table>
              <thead><tr><th>{{ 'catalog.fields.name' | translate }}</th><th>{{ 'catalog.fields.slug' | translate }}</th><th>{{ 'catalog.fields.status' | translate }}</th><th>{{ 'catalog.fields.version' | translate }}</th><th>{{ 'catalog.fields.actions' | translate }}</th></tr></thead>
              <tbody>
                @for (item of items(); track item.id) {
                  <tr><td>{{ item.name }}</td><td>{{ item.slug }}</td><td>{{ ('catalog.status.' + item.status) | translate }}</td><td>{{ item.version }}</td><td class="row-actions"><button type="button" (click)="edit(item)">{{ 'catalog.actions.edit' | translate }}</button><button type="button" (click)="toggleStatus(item)">{{ item.status === 'ACTIVE' ? ('catalog.actions.deactivate' | translate) : ('catalog.actions.activate' | translate) }}</button></td></tr>
                }
              </tbody>
            </table></div>
          }
          @if (error(); as errorKey) { <button type="button" class="secondary" (click)="load()">{{ 'catalog.retry' | translate }}</button> }
        </nexa-section-panel>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .management-grid { display: grid; grid-template-columns: minmax(16rem, .8fr) minmax(0, 1.6fr); gap: var(--nexa-space-6); }
    form, .search { display: grid; gap: var(--nexa-space-3); }
    label { display: grid; gap: var(--nexa-space-1); color: var(--nexa-color-text-secondary); font-size: var(--nexa-font-size-sm); }
    input, textarea, select { width: 100%; padding: .65rem .75rem; border: 1px solid var(--nexa-color-border-default); border-radius: var(--nexa-radius-sm); font: inherit; }
    button { min-height: 2.35rem; padding: .45rem .75rem; border: 0; border-radius: var(--nexa-radius-sm); background: var(--nexa-color-primary-700); color: white; cursor: pointer; font: inherit; }
    button:disabled { cursor: not-allowed; opacity: .55; }
    button.secondary { background: transparent; border: 1px solid var(--nexa-color-border-default); color: var(--nexa-color-text-primary); }
    .form-actions, .row-actions { display: flex; flex-wrap: wrap; gap: var(--nexa-space-2); }
    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: .75rem .5rem; border-bottom: 1px solid var(--nexa-color-border-default); text-align: left; vertical-align: top; }
    th { color: var(--nexa-color-text-secondary); font-size: var(--nexa-font-size-xs); text-transform: uppercase; }
    .success { color: var(--nexa-color-success-700); }
    .error { color: var(--nexa-color-danger-700); }
    @media (max-width: 820px) { .management-grid { grid-template-columns: 1fr; } }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CatalogTaxonomyPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(CatalogManagementApiService);
  private readonly fb = inject(FormBuilder);
  readonly kind = this.route.snapshot.data['kind'] as 'categories' | 'brands';
  readonly isCategory = computed(() => this.kind === 'categories');
  readonly titleKey = computed(() => this.isCategory() ? 'catalog.navigation.categories' : 'catalog.navigation.brands');
  readonly descriptionKey = computed(() => this.isCategory() ? 'catalog.modules.categories.description' : 'catalog.modules.brands.description');
  readonly formTitleKey = computed(() => this.editingId() ? 'catalog.actions.edit' : (this.isCategory() ? 'catalog.actions.newCategory' : 'catalog.actions.newBrand'));
  readonly items = signal<readonly TaxonomyItem[]>([]);
  readonly parentOptions = computed(() => this.items().filter((item): item is CatalogCategory => 'parentId' in item));
  readonly search = signal('');
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  readonly editingId = signal<string | null>(null);
  readonly form = this.fb.nonNullable.group({ parentId: [''], slug: ['', Validators.required], name: ['', Validators.required], description: [''] });

  constructor() { this.load(); }

  load(): void {
    this.loading.set(true); this.error.set(null);
    const request = this.isCategory() ? this.api.categories(this.search()) : this.api.brands(this.search());
    request.subscribe({ next: (page) => { this.items.set(page.items); this.loading.set(false); }, error: () => { this.error.set('catalog.states.errorDescription'); this.loading.set(false); } });
  }

  edit(item: TaxonomyItem): void {
    this.editingId.set(item.id); this.message.set(null); this.error.set(null);
    this.form.patchValue({ parentId: 'parentId' in item ? item.parentId ?? '' : '', slug: item.slug, name: item.name, description: item.description });
  }

  resetForm(): void { this.editingId.set(null); this.form.reset({ parentId: '', slug: '', name: '', description: '' }); this.message.set(null); }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true); this.error.set(null); this.message.set(null);
    const value = this.form.getRawValue();
    const id = this.editingId();
    const current = id ? this.items().find((item) => item.id === id) : null;
    const request = this.isCategory()
      ? (id && current ? this.api.updateCategory(id, current.version, value) : this.api.createCategory(value))
      : (id && current ? this.api.updateBrand(id, current.version, { slug: value.slug, name: value.name, description: value.description }) : this.api.createBrand({ slug: value.slug, name: value.name, description: value.description }));
    request.subscribe({ next: () => { this.saving.set(false); this.message.set('catalog.states.saved'); this.resetForm(); this.load(); }, error: () => { this.saving.set(false); this.error.set('catalog.states.saveError'); } });
  }

  toggleStatus(item: TaxonomyItem): void {
    this.error.set(null); this.message.set(null);
    const status = item.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const request = this.isCategory() ? this.api.changeCategoryStatus(item.id, item.version, status) : this.api.changeBrandStatus(item.id, item.version, status);
    request.subscribe({ next: () => { this.message.set('catalog.states.saved'); this.load(); }, error: () => this.error.set('catalog.states.saveError') });
  }
}
