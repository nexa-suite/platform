import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { PlatformAuthenticationBoundary } from '../../../core/security/platform-authentication.boundary';
import { NexaIconComponent } from '../../../shared/presentation/components/nexa-icon/nexa-icon.component';
import { PageHeaderComponent } from '../../../shared/presentation/components/page-header/page-header.component';
import { SectionPanelComponent } from '../../../shared/presentation/components/section-panel/section-panel.component';
import { CatalogManagementFacade } from '../../application/catalog-management.facade';
import { CatalogPromotion } from '../../domain/models/catalog-management.models';

@Component({
  selector: 'nexa-catalog-promotions-page',
  standalone: true,
  imports: [NexaIconComponent, PageHeaderComponent, RouterLink, SectionPanelComponent, TranslatePipe],
  template: `
    <section class="catalog-management-page">
      <nexa-page-header [eyebrow]="'catalog.eyebrow' | translate" [title]="'catalog.navigation.promotions' | translate" [subtitle]="'catalog.modules.promotions.description' | translate">
        @if (canManage()) { <a page-header-actions class="primary-link" routerLink="/ops/catalog/promotions/new"><nexa-icon name="add" /> {{ 'catalog.actions.newPromotion' | translate }}</a> }
      </nexa-page-header>
      <nexa-section-panel [title]="'catalog.fields.promotionBoard' | translate">
        <div class="filters"><label>{{ 'catalog.fields.status' | translate }}<select [value]="status()" (change)="status.set($any($event.target).value); load()"><option value="">{{ 'catalog.filters.all' | translate }}</option>@for (value of statuses; track value) { <option [value]="value">{{ ('catalog.status.' + value) | translate }}</option> }</select></label><button type="button" (click)="load()">{{ 'catalog.actions.refresh' | translate }}</button></div>
        @if (loading()) { <p role="status">{{ 'catalog.states.loading' | translate }}</p> }
        @if (error(); as errorKey) { <div class="error" role="alert"><p>{{ errorKey | translate }}</p><button type="button" (click)="load()">{{ 'catalog.retry' | translate }}</button></div> }
        @if (!loading() && !error() && !promotions().length) { <p>{{ 'catalog.states.emptyPromotions' | translate }}</p> }
        @if (!loading() && promotions().length) { <div class="table-wrap"><table><thead><tr><th>{{ 'catalog.fields.name' | translate }}</th><th>{{ 'catalog.fields.discount' | translate }}</th><th>{{ 'catalog.fields.priority' | translate }}</th><th>{{ 'catalog.fields.validity' | translate }}</th><th>{{ 'catalog.fields.status' | translate }}</th><th>{{ 'catalog.fields.targets' | translate }}</th><th>{{ 'catalog.fields.actions' | translate }}</th></tr></thead><tbody>@for (promotion of promotions(); track promotion.id) { <tr><td><a [routerLink]="['/ops/catalog/promotions', promotion.id]">{{ promotion.name }}</a><small>{{ promotion.slug }}</small></td><td>{{ discount(promotion) }}</td><td>{{ promotion.priority }}</td><td>{{ formatDate(promotion.startsAt) }} – {{ promotion.endsAt ? formatDate(promotion.endsAt) : '—' }}</td><td>{{ ('catalog.status.' + promotion.status) | translate }}</td><td>{{ promotion.productIds.length + promotion.categoryIds.length + promotion.clientAccountIds.length }}</td><td><a [routerLink]="['/ops/catalog/promotions', promotion.id]">{{ 'catalog.actions.open' | translate }}</a></td></tr> }</tbody></table></div> }
      </nexa-section-panel>
    </section>
  `,
  styles: [`
    :host { display: block; } .primary-link { display: inline-flex; align-items: center; gap: .4rem; padding: .65rem .9rem; border-radius: var(--nexa-radius-sm); background: var(--nexa-color-primary-700); color: white; text-decoration: none; } .filters { display: flex; align-items: end; gap: var(--nexa-space-3); margin-bottom: var(--nexa-space-5); } label { display: grid; flex: 1; gap: .25rem; color: var(--nexa-color-text-secondary); font-size: var(--nexa-font-size-sm); } select { padding: .65rem .75rem; border: 1px solid var(--nexa-color-border-default); border-radius: var(--nexa-radius-sm); background: var(--nexa-surface-card); font: inherit; } button { min-height: 2.35rem; padding: .45rem .75rem; border: 0; border-radius: var(--nexa-radius-sm); background: var(--nexa-color-primary-700); color: white; cursor: pointer; font: inherit; } .error { color: var(--nexa-color-danger-700); } .table-wrap { overflow-x: auto; } table { width: 100%; border-collapse: collapse; } th, td { padding: .75rem .5rem; border-bottom: 1px solid var(--nexa-color-border-default); text-align: left; vertical-align: top; } th { color: var(--nexa-color-text-secondary); font-size: var(--nexa-font-size-xs); text-transform: uppercase; } td a { color: var(--nexa-color-primary-700); font-weight: 600; } td small { display: block; color: var(--nexa-color-text-secondary); }
    @media (max-width: 620px) { .filters { align-items: stretch; flex-direction: column; } }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CatalogPromotionsPageComponent {
  private readonly api = inject(CatalogManagementFacade);
  private readonly auth = inject(PlatformAuthenticationBoundary);
  readonly canManage = computed(() => this.auth.hasPermission('promotion:manage'));
  readonly statuses = ['DRAFT', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'CANCELLED', 'EXPIRED'] as const;
  readonly promotions = signal<readonly CatalogPromotion[]>([]);
  readonly status = signal('');
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  constructor() { this.load(); }
  load(): void { this.loading.set(true); this.error.set(null); this.api.promotions(this.status()).subscribe({ next: (page) => { this.promotions.set(page.items); this.loading.set(false); }, error: () => { this.error.set('catalog.states.errorDescription'); this.loading.set(false); } }); }
  discount(promotion: CatalogPromotion): string { return promotion.discountType === 'PERCENTAGE' ? `${promotion.discountValue}%` : `${promotion.discountValue.toFixed(2)} ${promotion.currency}`; }
  formatDate(value: string): string { return new Date(value).toLocaleDateString(); }
}
