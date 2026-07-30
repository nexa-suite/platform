import { RedirectFunction, Router, Routes } from '@angular/router';
import { inject } from '@angular/core';
import { internalRoleGuard } from './core/security/internal-role.guard';
import { anonymousGuard, authGuard } from './core/security/auth.guard';
import { platformSurfaceGuard } from './core/security/platform-surface.guard';
import { PlatformShellComponent } from './core/layout/platform-shell/platform-shell.component';
import { OverviewPageComponent } from './core/presentation/overview-page/overview-page.component';
import { ForbiddenPageComponent } from './iam/presentation/forbidden-page/forbidden-page.component';
import { SignInPageComponent } from './iam/presentation/sign-in-page/sign-in-page.component';
import { INTERNAL_ROLES } from './iam/domain/models/auth.models';
import { anyPermissionGuard } from './core/security/permission.guard';
import { ChangeFeedService } from './core/change-feed/infrastructure/change-feed.service';
import { SalesOperationsApiService } from './sales/infrastructure/http/sales-operations-api.service';
import { ClientAccountsFacade } from './sales/client-accounts/application/client-accounts.facade';
import { PurchaseRequestOperationsFacade } from './sales/purchase-requests/application/purchase-request-operations.facade';
import { SalesOrdersFacade } from './sales/sales-orders/application/sales-orders.facade';

const catalogRoles = INTERNAL_ROLES;
const companyOwnerRoles = ['COMPANY_OWNER'] as const;
const salesRoles = ['COMPANY_OWNER', 'SALES'] as const;
const fulfillmentRoles = ['WAREHOUSE', 'LOGISTICS'] as const;
const dynamicRedirect = (target: string, parameter: string): RedirectFunction => (route) =>
  inject(Router).createUrlTree([target, route.params[parameter]]);

export const routes: Routes = [
  { path: 'sign-in', component: SignInPageComponent, canActivate: [anonymousGuard] },
  { path: 'forbidden', component: ForbiddenPageComponent },
  {
    path: '',
    component: PlatformShellComponent,
    canActivate: [platformSurfaceGuard, authGuard],
    data: { surface: 'PLATFORM' },
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'ops/overview' },
      { path: 'ops/overview', component: OverviewPageComponent },
      { path: 'ops/product-catalog', loadComponent: () => import('./catalog-management/presentation/product-catalog-page/product-catalog-page.component').then((module) => module.ProductCatalogPageComponent), canActivate: [internalRoleGuard(catalogRoles)], data: { roles: catalogRoles } },
      { path: 'ops/product-catalog/:catalogItemId', loadComponent: () => import('./catalog-management/presentation/product-catalog-detail-page/product-catalog-detail-page.component').then((module) => module.ProductCatalogDetailPageComponent), canActivate: [internalRoleGuard(catalogRoles)], data: { roles: catalogRoles } },
      {
        path: 'ops/operations/company-administration',
        loadComponent: () => import('./tenant-management/presentation/company-administration-page/company-administration-page.component').then((module) => module.CompanyAdministrationPageComponent),
        canActivate: [internalRoleGuard(companyOwnerRoles)],
        data: { roles: companyOwnerRoles }
      },
      { path: 'ops/company-administration', pathMatch: 'full', redirectTo: 'ops/operations/company-administration' },
      { path: 'ops/settings', pathMatch: 'full', redirectTo: 'ops/operations/company-administration' },
      {
        path: 'ops/commercial/client-accounts',
        loadComponent: () => import('./sales/client-accounts/presentation/client-accounts-page.component').then((module) => module.ClientAccountsPageComponent),
        canActivate: [internalRoleGuard(salesRoles)], data: { roles: salesRoles }, providers: [SalesOperationsApiService, ClientAccountsFacade, ChangeFeedService]
      },
      {
        path: 'ops/commercial/client-accounts/new',
        loadComponent: () => import('./sales/client-accounts/presentation/client-account-detail-page.component').then((module) => module.ClientAccountDetailPageComponent),
        canActivate: [internalRoleGuard(salesRoles)], data: { roles: salesRoles }, providers: [SalesOperationsApiService, ClientAccountsFacade, ChangeFeedService]
      },
      {
        path: 'ops/commercial/client-accounts/:clientAccountId',
        loadComponent: () => import('./sales/client-accounts/presentation/client-account-detail-page.component').then((module) => module.ClientAccountDetailPageComponent),
        canActivate: [internalRoleGuard(salesRoles)], data: { roles: salesRoles }, providers: [SalesOperationsApiService, ClientAccountsFacade, ChangeFeedService]
      },
      {
        path: 'ops/commercial/purchase-requests',
        loadComponent: () => import('./sales/purchase-requests/presentation/purchase-request-inbox-page.component').then((module) => module.PurchaseRequestInboxPageComponent),
        canActivate: [internalRoleGuard(salesRoles)], data: { roles: salesRoles }, providers: [SalesOperationsApiService, PurchaseRequestOperationsFacade, ChangeFeedService]
      },
      {
        path: 'ops/commercial/purchase-requests/:purchaseRequestId',
        loadComponent: () => import('./sales/purchase-requests/presentation/purchase-request-detail-page.component').then((module) => module.PurchaseRequestDetailPageComponent),
        canActivate: [internalRoleGuard(salesRoles)], data: { roles: salesRoles }, providers: [SalesOperationsApiService, PurchaseRequestOperationsFacade, ChangeFeedService]
      },
      {
        path: 'ops/commercial/sales-orders',
        loadComponent: () => import('./sales/sales-orders/presentation/sales-orders-page.component').then((module) => module.SalesOrdersPageComponent),
        canActivate: [internalRoleGuard(salesRoles)], data: { roles: salesRoles }, providers: [SalesOperationsApiService, SalesOrdersFacade, ChangeFeedService]
      },
      {
        path: 'ops/commercial/sales-orders/:salesOrderId',
        loadComponent: () => import('./sales/sales-orders/presentation/sales-order-detail-page.component').then((module) => module.SalesOrderDetailPageComponent),
        canActivate: [internalRoleGuard(salesRoles)], data: { roles: salesRoles }, providers: [SalesOperationsApiService, SalesOrdersFacade, ChangeFeedService]
      },
      {
        path: 'ops/fulfillment/readiness',
        loadComponent: () => import('./sales/sales-orders/presentation/fulfillment-readiness-page.component').then((module) => module.FulfillmentReadinessPageComponent),
        canActivate: [internalRoleGuard(fulfillmentRoles), anyPermissionGuard(['warehouse:read', 'logistics:read'])], data: { roles: fulfillmentRoles, permissions: ['warehouse:read', 'logistics:read'] }, providers: [SalesOperationsApiService, SalesOrdersFacade, ChangeFeedService]
      },
      { path: 'ops/clients', pathMatch: 'full', redirectTo: 'ops/commercial/client-accounts' },
      { path: 'ops/commercial/requests', pathMatch: 'full', redirectTo: 'ops/commercial/purchase-requests' },
      { path: 'ops/commercial/requests/:purchaseRequestId', redirectTo: dynamicRedirect('/ops/commercial/purchase-requests', 'purchaseRequestId') },
      { path: 'ops/commercial/orders', pathMatch: 'full', redirectTo: 'ops/commercial/sales-orders' },
      { path: 'ops/commercial/orders/:salesOrderId', redirectTo: dynamicRedirect('/ops/commercial/sales-orders', 'salesOrderId') },
      { path: 'ops/orders', pathMatch: 'full', redirectTo: 'ops/commercial/sales-orders' },
      { path: 'overview', pathMatch: 'full', redirectTo: 'ops/overview' },
      { path: 'ops/catalog', pathMatch: 'full', redirectTo: 'ops/product-catalog' },
      { path: '**', redirectTo: 'ops/overview' }
    ]
  }
];
