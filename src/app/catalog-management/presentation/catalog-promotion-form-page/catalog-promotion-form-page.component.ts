import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import { AuthenticationService } from '../../../iam/application/authentication.service';
import { NexaIconComponent } from '../../../shared/presentation/components/nexa-icon/nexa-icon.component';
import { PageHeaderComponent } from '../../../shared/presentation/components/page-header/page-header.component';
import { SectionPanelComponent } from '../../../shared/presentation/components/section-panel/section-panel.component';
import { CatalogManagementApiService } from '../../infrastructure/http/catalog-management-api.service';
import { CatalogCategory, CatalogProduct, CatalogPromotion, CatalogPromotionCommand } from '../../domain/models/catalog-management.models';
import { CatalogPromotionTargetOption } from '../../domain/models/catalog-promotion-target.models';
import { CatalogPromotionTargetsGateway } from '../../infrastructure/http/catalog-promotion-targets.gateway';

@Component({
  selector: 'nexa-catalog-promotion-form-page',
  standalone: true,
  imports: [NexaIconComponent, PageHeaderComponent, ReactiveFormsModule, RouterLink, SectionPanelComponent, TranslatePipe],
  template: `
    <section class="catalog-management-page">
      <nexa-page-header [eyebrow]="'catalog.eyebrow' | translate" [title]="isNew ? ('catalog.actions.newPromotion' | translate) : ('catalog.navigation.promotionDetail' | translate)" [subtitle]="'catalog.modules.promotions.description' | translate">
        <a page-header-actions routerLink="/ops/catalog/promotions"><nexa-icon name="arrow_back" /> {{ 'catalog.backToPromotions' | translate }}</a>
      </nexa-page-header>
      @if (loading()) { <p role="status">{{ 'catalog.states.loading' | translate }}</p> }
      @if (error(); as errorKey) { <p class="error" role="alert">{{ errorKey | translate }}</p> }
      @if (!loading()) {
        <div class="promotion-layout">
          <nexa-section-panel [title]="'catalog.fields.commercialDefinition' | translate">
            <form [formGroup]="form" (ngSubmit)="save()" novalidate>
              <div class="form-grid"><label>{{ 'catalog.fields.slug' | translate }}<input formControlName="slug" /></label><label>{{ 'catalog.fields.name' | translate }}<input formControlName="name" /></label><label>{{ 'catalog.fields.discountType' | translate }}<select formControlName="discountType"><option value="PERCENTAGE">{{ 'catalog.discountType.percentage' | translate }}</option><option value="FIXED_AMOUNT">{{ 'catalog.discountType.fixedAmount' | translate }}</option></select></label><label>{{ 'catalog.fields.discountValue' | translate }}<input type="number" min="0" step="0.01" formControlName="discountValue" /></label><label>{{ 'catalog.fields.currency' | translate }}<input formControlName="currency" maxlength="3" /></label><label>{{ 'catalog.fields.minimumQuantity' | translate }}<input type="number" min="1" step="1" formControlName="minimumQuantity" /></label><label>{{ 'catalog.fields.priority' | translate }}<input type="number" min="-1000000" max="1000000" step="1" formControlName="priority" /></label><label>{{ 'catalog.fields.startsAt' | translate }}<input type="datetime-local" formControlName="startsAt" /></label><label>{{ 'catalog.fields.endsAt' | translate }}<input type="datetime-local" formControlName="endsAt" /></label><label>{{ 'catalog.fields.stackingPolicy' | translate }}<select formControlName="stackingPolicy"><option value="EXCLUSIVE">{{ 'catalog.stacking.exclusive' | translate }}</option><option value="STACKABLE">{{ 'catalog.stacking.stackable' | translate }}</option></select></label></div>
              <label>{{ 'catalog.fields.description' | translate }}<textarea formControlName="description" rows="4"></textarea></label>
              <fieldset class="target-fieldset"><legend>{{ 'catalog.fields.productTargets' | translate }}</legend><label class="sr-only" for="promotion-products">{{ 'catalog.fields.productTargets' | translate }}</label><select id="promotion-products" multiple size="6" formControlName="productIds">@for (product of products(); track product.id) { <option [value]="product.id">{{ product.name }} · {{ product.productCode }}</option> }</select>@if (optionsLoading()) { <small>{{ 'catalog.states.loading' | translate }}</small> }</fieldset>
              <fieldset class="target-fieldset"><legend>{{ 'catalog.fields.categoryTargets' | translate }}</legend><label class="sr-only" for="promotion-categories">{{ 'catalog.fields.categoryTargets' | translate }}</label><select id="promotion-categories" multiple size="6" formControlName="categoryIds">@for (category of categories(); track category.id) { <option [value]="category.id">{{ category.name }} · {{ category.slug }}</option> }</select></fieldset>
              <fieldset class="target-fieldset"><legend>{{ 'catalog.fields.clientAccountTargets' | translate }}</legend><label class="sr-only" for="promotion-clients">{{ 'catalog.fields.clientAccountTargets' | translate }}</label><select id="promotion-clients" multiple size="6" formControlName="clientAccountIds">@for (target of promotionTargets(); track target.id) { <option [value]="target.id">{{ target.commercialName || target.businessName }} · {{ target.code }}</option> }</select></fieldset>
              <div class="form-grid"><label>{{ 'catalog.fields.clientSegment' | translate }}<input formControlName="clientSegment" /></label><label>{{ 'catalog.fields.buyerTier' | translate }}<input formControlName="buyerTier" /></label></div>
              @if (canManage()) { <div class="form-actions"><button type="submit" [disabled]="form.invalid || saving()">{{ saving() ? ('catalog.states.saving' | translate) : ('catalog.actions.save' | translate) }}</button></div> }
            </form>
          </nexa-section-panel>
          @if (promotion(); as current) {
            <nexa-section-panel [title]="'catalog.fields.lifecycle' | translate">
              <dl><div><dt>{{ 'catalog.fields.status' | translate }}</dt><dd>{{ ('catalog.status.' + current.status) | translate }}</dd></div><div><dt>{{ 'catalog.fields.version' | translate }}</dt><dd>{{ current.version }}</dd></div><div><dt>{{ 'catalog.fields.targets' | translate }}</dt><dd>{{ current.productIds.length + current.categoryIds.length }}</dd></div></dl>
              <p class="preview"><strong>{{ 'catalog.fields.preview' | translate }}</strong> {{ preview() }}</p>
              @if (canManage()) { <div class="lifecycle-actions">@for (action of nextActions(current); track action.status) { <button type="button" (click)="changeStatus(current, action.status)">{{ action.key | translate }}</button> }</div> }
            </nexa-section-panel>
          }
        </div>
      }
    </section>
  `,
  styles: [`
    :host { display: block; } .promotion-layout { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(16rem, .8fr); gap: var(--nexa-space-6); } form, dl { display: grid; gap: var(--nexa-space-3); } .form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--nexa-space-3); } label { display: grid; gap: .25rem; color: var(--nexa-color-text-secondary); font-size: var(--nexa-font-size-sm); } input, textarea, select { width: 100%; padding: .65rem .75rem; border: 1px solid var(--nexa-color-border-default); border-radius: var(--nexa-radius-sm); background: var(--nexa-surface-card); font: inherit; } .target-fieldset { display: grid; gap: .35rem; padding: .75rem; border: 1px solid var(--nexa-color-border-default); border-radius: var(--nexa-radius-sm); } .target-fieldset legend { padding: 0 .25rem; color: var(--nexa-color-text-secondary); font-size: var(--nexa-font-size-sm); } .target-fieldset select { min-height: 8rem; } .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; } button { min-height: 2.35rem; padding: .45rem .75rem; border: 0; border-radius: var(--nexa-radius-sm); background: var(--nexa-color-primary-700); color: white; cursor: pointer; font: inherit; } button:disabled { opacity: .55; cursor: not-allowed; } .form-actions, .lifecycle-actions { display: flex; flex-wrap: wrap; gap: .5rem; margin-top: var(--nexa-space-4); } dt { color: var(--nexa-color-text-secondary); font-size: var(--nexa-font-size-xs); } dd { margin: 0; font-weight: 600; } .preview { padding: .75rem; border-radius: var(--nexa-radius-sm); background: var(--nexa-surface-page); } .error { color: var(--nexa-color-danger-700); } @media (max-width: 820px) { .promotion-layout, .form-grid { grid-template-columns: 1fr; } }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CatalogPromotionFormPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(CatalogManagementApiService);
  private readonly promotionTargetsGateway = inject(CatalogPromotionTargetsGateway);
  private readonly auth = inject(AuthenticationService);
  private readonly fb = inject(FormBuilder);
  readonly promotionId = this.route.snapshot.paramMap.get('promotionId');
  readonly isNew = !this.promotionId;
  readonly canManage = computed(() => this.auth.hasPermission('promotion:manage'));
  readonly promotion = signal<CatalogPromotion | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly optionsLoading = signal(true);
  readonly products = signal<readonly CatalogProduct[]>([]);
  readonly categories = signal<readonly CatalogCategory[]>([]);
  readonly promotionTargets = signal<readonly CatalogPromotionTargetOption[]>([]);
  readonly form = this.fb.nonNullable.group({ slug: ['', Validators.required], name: ['', Validators.required], description: [''], discountType: ['PERCENTAGE' as 'PERCENTAGE' | 'FIXED_AMOUNT', Validators.required], discountValue: [0, [Validators.required, Validators.min(0)]], currency: ['PEN', Validators.required], startsAt: ['', Validators.required], endsAt: [''], minimumQuantity: [1, [Validators.required, Validators.min(1)]], priority: [0, [Validators.required, Validators.min(-1000000), Validators.max(1000000)]], stackingPolicy: ['EXCLUSIVE', Validators.required], productIds: this.fb.nonNullable.control<readonly string[]>([]), categoryIds: this.fb.nonNullable.control<readonly string[]>([]), clientAccountIds: this.fb.nonNullable.control<readonly string[]>([]), clientSegment: [''], buyerTier: [''] });

  constructor() {
    this.loadTargetOptions();
    if (!this.promotionId) { this.loading.set(false); return; }
    this.api.promotion(this.promotionId).subscribe({ next: (promotion) => { this.promotion.set(promotion); this.form.patchValue({ ...promotion, currency: promotion.currency ?? '', startsAt: this.toLocal(promotion.startsAt), endsAt: promotion.endsAt ? this.toLocal(promotion.endsAt) : '', productIds: promotion.productIds, categoryIds: promotion.categoryIds, clientAccountIds: promotion.clientAccountIds, clientSegment: this.rule(promotion, 'CLIENT_SEGMENT'), buyerTier: this.rule(promotion, 'BUYER_TIER') }); if (!this.canManage()) this.form.disable(); this.loading.set(false); }, error: () => { this.error.set('catalog.states.errorDescription'); this.loading.set(false); } });
  }

  private loadTargetOptions(): void {
    forkJoin({
      products: this.api.products(),
      categories: this.api.categories(),
      promotionTargets: this.promotionTargetsGateway.list()
    }).subscribe({
      next: (options) => { this.products.set(options.products.items); this.categories.set(options.categories.items); this.promotionTargets.set(options.promotionTargets); this.optionsLoading.set(false); },
      error: () => { this.optionsLoading.set(false); this.error.set('catalog.states.errorDescription'); }
    });
  }

  save(): void {
    if (!this.canManage() || this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true); this.error.set(null); const value = this.form.getRawValue(); const rules = [{ type: 'CLIENT_SEGMENT', value: value.clientSegment.trim() }, { type: 'BUYER_TIER', value: value.buyerTier.trim() }].filter((rule) => rule.value); const command: CatalogPromotionCommand = { slug: value.slug, name: value.name, description: value.description, discountType: value.discountType, discountValue: Number(value.discountValue), currency: value.discountType === 'PERCENTAGE' ? null : value.currency.toUpperCase(), startsAt: new Date(value.startsAt).toISOString(), endsAt: value.endsAt ? new Date(value.endsAt).toISOString() : null, minimumQuantity: Number(value.minimumQuantity), stackingPolicy: value.stackingPolicy, priority: Number(value.priority), productIds: value.productIds, categoryIds: value.categoryIds, clientAccountIds: value.clientAccountIds, rules };
    const request = this.promotionId && this.promotion() ? this.api.updatePromotion(this.promotionId, this.promotion()!.version, command) : this.api.createPromotion(command);
    request.subscribe({ next: (promotion) => { this.promotion.set(promotion); this.saving.set(false); void this.router.navigate(['/ops/catalog/promotions', promotion.id]); }, error: () => { this.error.set('catalog.states.saveError'); this.saving.set(false); } });
  }
  changeStatus(promotion: CatalogPromotion, status: CatalogPromotion['status']): void { this.api.changePromotionStatus(promotion.id, promotion.version, status).subscribe({ next: (updated) => this.promotion.set(updated), error: () => this.error.set('catalog.states.saveError') }); }
  nextActions(promotion: CatalogPromotion): readonly { status: CatalogPromotion['status']; key: string }[] {
    const actions: Record<string, readonly { status: CatalogPromotion['status']; key: string }[]> = { DRAFT: [{ status: 'SCHEDULED', key: 'catalog.actions.schedule' }, { status: 'ACTIVE', key: 'catalog.actions.activate' }, { status: 'CANCELLED', key: 'catalog.actions.cancel' }], SCHEDULED: [{ status: 'ACTIVE', key: 'catalog.actions.activate' }, { status: 'CANCELLED', key: 'catalog.actions.cancel' }], ACTIVE: [{ status: 'PAUSED', key: 'catalog.actions.pause' }, { status: 'EXPIRED', key: 'catalog.actions.expire' }, { status: 'CANCELLED', key: 'catalog.actions.cancel' }], PAUSED: [{ status: 'ACTIVE', key: 'catalog.actions.resume' }, { status: 'CANCELLED', key: 'catalog.actions.cancel' }] };
    return actions[promotion.status] ?? [];
  }
  preview(): string { const value = this.form.getRawValue(); return value.discountType === 'PERCENTAGE' ? `${value.discountValue}%` : `${value.discountValue} ${value.currency}`; }
  private rule(promotion: CatalogPromotion, type: string): string { return promotion.rules.find((rule) => rule.type === type)?.value ?? ''; }
  private toLocal(value: string): string { const date = new Date(value); const pad = (number: number) => String(number).padStart(2, '0'); return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`; }
}
