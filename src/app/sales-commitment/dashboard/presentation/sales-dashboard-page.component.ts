import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ErrorStateComponent } from '../../../shared/presentation/components/error-state/error-state.component';
import { EmptyStateComponent } from '../../../shared/presentation/components/empty-state/empty-state.component';
import { LoadingStateComponent } from '../../../shared/presentation/components/loading-state/loading-state.component';
import { MetricCardComponent } from '../../../shared/presentation/components/metric-card/metric-card.component';
import { PageHeaderComponent } from '../../../shared/presentation/components/page-header/page-header.component';
import { SectionPanelComponent } from '../../../shared/presentation/components/section-panel/section-panel.component';
import { SalesDashboardFacade } from '../application/sales-dashboard.facade';

@Component({
  selector: 'nexa-sales-dashboard-page',
  standalone: true,
  providers: [SalesDashboardFacade],
  imports: [RouterLink, TranslatePipe, ErrorStateComponent, EmptyStateComponent, LoadingStateComponent, MetricCardComponent, PageHeaderComponent, SectionPanelComponent],
  template: `<section class="page">
    <nexa-page-header [eyebrow]="'salesDashboard.eyebrow' | translate" [title]="'salesDashboard.title' | translate" [subtitle]="'salesDashboard.description' | translate" />
    @if (facade.state().status === 'loading') { <nexa-loading-state [lines]="4" [label]="'salesDashboard.states.loading' | translate" /> }
    @else if (facade.state().status === 'error') { <nexa-error-state [title]="'salesDashboard.states.errorTitle' | translate" [description]="'salesDashboard.states.errorDescription' | translate" [retryLabel]="'salesDashboard.actions.retry' | translate" (retry)="facade.retry()" /> }
    @else if (facade.state().status === 'empty') { <nexa-empty-state [title]="'salesDashboard.states.emptyTitle' | translate" [description]="'salesDashboard.states.emptyDescription' | translate" /> }
    @else {
      <div class="metric-grid">
        <nexa-metric-card [label]="'salesDashboard.metrics.submitted' | translate" [value]="facade.state().metrics.submittedPurchaseRequests" />
        <nexa-metric-card [label]="'salesDashboard.metrics.underReview' | translate" [value]="facade.state().metrics.purchaseRequestsUnderReview" />
        <nexa-metric-card [label]="'salesDashboard.metrics.approved' | translate" [value]="facade.state().metrics.approvedPurchaseRequests" />
        <nexa-metric-card [label]="'salesDashboard.metrics.pendingOrders' | translate" [value]="facade.state().metrics.pendingSalesOrders" />
        <nexa-metric-card [label]="'salesDashboard.metrics.confirmedOrders' | translate" [value]="facade.state().metrics.confirmedSalesOrders" />
      </div>
      <div class="panels">
        <nexa-section-panel [title]="'salesDashboard.recentRequests' | translate"><ul>@for (request of facade.state().recentPurchaseRequests; track request.id) { <li><a [routerLink]="['/ops/commercial/purchase-requests', request.id]">{{ request.code }}</a><span>{{ 'purchaseRequests.status.' + request.status | translate }}</span></li> }</ul></nexa-section-panel>
        <nexa-section-panel [title]="'salesDashboard.recentOrders' | translate"><ul>@for (order of facade.state().recentSalesOrders; track order.id) { <li><a [routerLink]="['/ops/commercial/sales-orders', order.id]">{{ order.number }}</a><span>{{ 'salesOrders.status.' + order.status | translate }}</span></li> }</ul></nexa-section-panel>
      </div>
    }
    <nexa-section-panel [title]="'salesDashboard.links.title' | translate"><nav class="links"><a routerLink="/ops/product-catalog">{{ 'salesDashboard.links.catalog' | translate }}</a><a routerLink="/ops/commercial/purchase-requests">{{ 'salesDashboard.links.requests' | translate }}</a><a routerLink="/ops/commercial/sales-orders">{{ 'salesDashboard.links.orders' | translate }}</a><a routerLink="/ops/commercial/client-accounts">{{ 'salesDashboard.links.clients' | translate }}</a></nav></nexa-section-panel>
  </section>`,
  styles: [`.metric-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:1rem;margin-bottom:1rem}.panels{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem;margin-bottom:1rem}ul{list-style:none;padding:0;margin:0}li{display:flex;justify-content:space-between;padding:.6rem 0;border-bottom:1px solid var(--nexa-border,#ddd)}a{color:inherit}.links{display:flex;flex-wrap:wrap;gap:1rem}@media(max-width:900px){.metric-grid,.panels{grid-template-columns:1fr 1fr}}@media(max-width:600px){.metric-grid,.panels{grid-template-columns:1fr}}`],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SalesDashboardPageComponent { readonly facade = inject(SalesDashboardFacade); constructor() { this.facade.load(); } }
