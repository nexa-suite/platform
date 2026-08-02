import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthenticationService } from '../../../iam/application/authentication.service';
import { NexaIconComponent } from '../../../shared/presentation/components/nexa-icon/nexa-icon.component';
import { PageHeaderComponent } from '../../../shared/presentation/components/page-header/page-header.component';
import { SectionPanelComponent } from '../../../shared/presentation/components/section-panel/section-panel.component';
import { CatalogManagementApiService } from '../../infrastructure/http/catalog-management-api.service';
import { CatalogPromotion, CatalogPromotionCommand } from '../../domain/models/catalog-management.models';

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
              <div class="form-grid"><label>{{ 'catalog.fields.slug' | translate }}<input formControlName="slug" /></label><label>{{ 'catalog.fields.name' | translate }}<input formControlName="name" /></label><label>{{ 'catalog.fields.discountType' | translate }}<select formControlName="discountType"><option value="PERCENTAGE">{{ 'catalog.discountType.percentage' | translate }}</option><option value="FIXED_AMOUNT">{{ 'catalog.discountType.fixedAmount' | translate }}</option></select></label><label>{{ 'catalog.fields.discountValue' | translate }}<input type="number" min="0" step="0.01" formControlName="discountValue" /></label><label>{{ 'catalog.fields.currency' | translate }}<input formControlName="currency" maxlength="3" /></label><label>{{ 'catalog.fields.minimumQuantity' | translate }}<input type="number" min="1" step="1" formControlName="minimumQuantity" /></label><label>{{ 'catalog.fields.startsAt' | translate }}<input type="datetime-local" formControlName="startsAt" /></label><label>{{ 'catalog.fields.endsAt' | translate }}<input type="datetime-local" formControlName="endsAt" /></label><label>{{ 'catalog.fields.stackingPolicy' | translate }}<select formControlName="stackingPolicy"><option value="EXCLUSIVE">{{ 'catalog.stacking.exclusive' | translate }}</option><option value="STACKABLE">{{ 'catalog.stacking.stackable' | translate }}</option></select></label></div>
              <label>{{ 'catalog.fields.description' | translate }}<textarea formControlName="description" rows="4"></textarea></label>
              <label>{{ 'catalog.fields.productTargets' | translate }}<textarea formControlName="productIds" rows="2" [placeholder]="'catalog.fields.idsPlaceholder' | translate"></textarea></label>
              <label>{{ 'catalog.fields.categoryTargets' | translate }}<textarea formControlName="categoryIds" rows="2" [placeholder]="'catalog.fields.idsPlaceholder' | translate"></textarea></label>
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
    :host { display: block; } .promotion-layout { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(16rem, .8fr); gap: var(--nexa-space-6); } form, dl { display: grid; gap: var(--nexa-space-3); } .form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--nexa-space-3); } label { display: grid; gap: .25rem; color: var(--nexa-color-text-secondary); font-size: var(--nexa-font-size-sm); } input, textarea, select { width: 100%; padding: .65rem .75rem; border: 1px solid var(--nexa-color-border-default); border-radius: var(--nexa-radius-sm); background: var(--nexa-surface-card); font: inherit; } button { min-height: 2.35rem; padding: .45rem .75rem; border: 0; border-radius: var(--nexa-radius-sm); background: var(--nexa-color-primary-700); color: white; cursor: pointer; font: inherit; } button:disabled { opacity: .55; cursor: not-allowed; } .form-actions, .lifecycle-actions { display: flex; flex-wrap: wrap; gap: .5rem; margin-top: var(--nexa-space-4); } dt { color: var(--nexa-color-text-secondary); font-size: var(--nexa-font-size-xs); } dd { margin: 0; font-weight: 600; } .preview { padding: .75rem; border-radius: var(--nexa-radius-sm); background: var(--nexa-surface-page); } .error { color: var(--nexa-color-danger-700); } @media (max-width: 820px) { .promotion-layout, .form-grid { grid-template-columns: 1fr; } }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CatalogPromotionFormPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(CatalogManagementApiService);
  private readonly auth = inject(AuthenticationService);
  private readonly fb = inject(FormBuilder);
  readonly promotionId = this.route.snapshot.paramMap.get('promotionId');
  readonly isNew = !this.promotionId;
  readonly canManage = computed(() => this.auth.hasPermission('promotion:manage'));
  readonly promotion = signal<CatalogPromotion | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly form = this.fb.nonNullable.group({ slug: ['', Validators.required], name: ['', Validators.required], description: [''], discountType: ['PERCENTAGE' as 'PERCENTAGE' | 'FIXED_AMOUNT', Validators.required], discountValue: [0, [Validators.required, Validators.min(0)]], currency: ['PEN', Validators.required], startsAt: ['', Validators.required], endsAt: [''], minimumQuantity: [1, [Validators.required, Validators.min(1)]], stackingPolicy: ['EXCLUSIVE', Validators.required], productIds: [''], categoryIds: [''] });

  constructor() {
    if (!this.promotionId) { this.loading.set(false); return; }
    this.api.promotion(this.promotionId).subscribe({ next: (promotion) => { this.promotion.set(promotion); this.form.patchValue({ ...promotion, startsAt: this.toLocal(promotion.startsAt), endsAt: promotion.endsAt ? this.toLocal(promotion.endsAt) : '', productIds: promotion.productIds.join(', '), categoryIds: promotion.categoryIds.join(', ') }); if (!this.canManage()) this.form.disable(); this.loading.set(false); }, error: () => { this.error.set('catalog.states.errorDescription'); this.loading.set(false); } });
  }

  save(): void {
    if (!this.canManage() || this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true); this.error.set(null); const value = this.form.getRawValue(); const command: CatalogPromotionCommand = { slug: value.slug, name: value.name, description: value.description, discountType: value.discountType, discountValue: Number(value.discountValue), currency: value.currency.toUpperCase(), startsAt: new Date(value.startsAt).toISOString(), endsAt: value.endsAt ? new Date(value.endsAt).toISOString() : null, minimumQuantity: Number(value.minimumQuantity), stackingPolicy: value.stackingPolicy, productIds: this.ids(value.productIds), categoryIds: this.ids(value.categoryIds) };
    const request = this.promotionId && this.promotion() ? this.api.updatePromotion(this.promotionId, this.promotion()!.version, command) : this.api.createPromotion(command);
    request.subscribe({ next: (promotion) => { this.promotion.set(promotion); this.saving.set(false); void this.router.navigate(['/ops/catalog/promotions', promotion.id]); }, error: () => { this.error.set('catalog.states.saveError'); this.saving.set(false); } });
  }
  changeStatus(promotion: CatalogPromotion, status: CatalogPromotion['status']): void { this.api.changePromotionStatus(promotion.id, promotion.version, status).subscribe({ next: (updated) => this.promotion.set(updated), error: () => this.error.set('catalog.states.saveError') }); }
  nextActions(promotion: CatalogPromotion): readonly { status: CatalogPromotion['status']; key: string }[] {
    const actions: Record<string, readonly { status: CatalogPromotion['status']; key: string }[]> = { DRAFT: [{ status: 'SCHEDULED', key: 'catalog.actions.schedule' }, { status: 'ACTIVE', key: 'catalog.actions.activate' }, { status: 'CANCELLED', key: 'catalog.actions.cancel' }], SCHEDULED: [{ status: 'ACTIVE', key: 'catalog.actions.activate' }, { status: 'CANCELLED', key: 'catalog.actions.cancel' }], ACTIVE: [{ status: 'PAUSED', key: 'catalog.actions.pause' }, { status: 'EXPIRED', key: 'catalog.actions.expire' }, { status: 'CANCELLED', key: 'catalog.actions.cancel' }], PAUSED: [{ status: 'ACTIVE', key: 'catalog.actions.resume' }, { status: 'CANCELLED', key: 'catalog.actions.cancel' }] };
    return actions[promotion.status] ?? [];
  }
  preview(): string { const value = this.form.getRawValue(); return value.discountType === 'PERCENTAGE' ? `${value.discountValue}%` : `${value.discountValue} ${value.currency}`; }
  private ids(value: string): readonly string[] { return value.split(',').map((id) => id.trim()).filter(Boolean); }
  private toLocal(value: string): string { const date = new Date(value); const pad = (number: number) => String(number).padStart(2, '0'); return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`; }
}
