import { RedirectFunction, Router, Routes } from '@angular/router';
import { inject } from '@angular/core';
import { AuthenticationService } from './iam/application/authentication.service';
import { anonymousGuard, authGuard } from './core/security/auth.guard';
import { platformSurfaceGuard } from './core/security/platform-surface.guard';
import { PlatformShellComponent } from './core/layout/platform-shell/platform-shell.component';
import { permissionGuard } from './core/security/permission.guard';
import { platformLandingForUser, PLATFORM_PERMISSIONS } from './core/security/platform-permissions';
import { SalesOperationsApiService } from './sales/infrastructure/http/sales-operations-api.service';
import { ClientAccountsFacade } from './sales/client-accounts/application/client-accounts.facade';
import { PurchaseRequestOperationsFacade } from './sales/purchase-requests/application/purchase-request-operations.facade';
import { ManualOrderWizardFacade } from './sales/manual-orders/application/manual-order-wizard.facade';
import { manualOrderStepGuard } from './sales/manual-orders/presentation/manual-order-step.guard';
import { createManualOrderDraftGuard } from './sales/manual-orders/presentation/create-manual-order-draft.guard';
import { SalesOrdersFacade } from './sales/sales-orders/application/sales-orders.facade';
import { WarehouseOperationsApiService } from './warehouse/infrastructure/warehouse-operations-api.service';
import { WarehouseOperationsFacade } from './warehouse/application/warehouse-operations.facade';
import { catalogReadGuard, catalogManageGuard, promotionReadGuard, promotionManageGuard } from './core/security/catalog-access.guard';
import { tenantManagementRoutes } from './tenant-management/tenant-management.routes';

const roleLandingRedirect: RedirectFunction = () => {
  const auth = inject(AuthenticationService);
  const router = inject(Router);
  if (auth.status() !== 'authenticated') {
    return router.createUrlTree(['/sign-in'], { queryParams: { returnUrl: '/' } });
  }
  const landing = platformLandingForUser(auth.currentUser(), auth.hasPermission);
  return router.createUrlTree([landing?.path ?? '/forbidden']);
};
const dynamicRedirect = (target: string, parameter: string): RedirectFunction => (route) =>
  inject(Router).createUrlTree([target, route.params[parameter]]);
const businessDocumentsOrderRedirect: RedirectFunction = (route) =>
  inject(Router).createUrlTree(['/ops/operations/business-documents'], { queryParams: { orderId: route.params['orderId'] } });

export const routes: Routes = [
  ...tenantManagementRoutes,
  { path: 'auth/login', pathMatch: 'full', redirectTo: 'sign-in' },
  { path: 'auth/recover', pathMatch: 'full', redirectTo: 'forgot-password' },
  { path: 'auth/blocked', pathMatch: 'full', redirectTo: 'forbidden' },
  { path: 'auth/forbidden', pathMatch: 'full', redirectTo: 'forbidden' },
  { path: 'sign-in', loadComponent: () => import('./iam/presentation/sign-in-page/sign-in-page.component').then((module) => module.SignInPageComponent), canActivate: [anonymousGuard] },
  { path: 'forgot-password', loadComponent: () => import('./iam/presentation/forgot-password-page/forgot-password-page.component').then((module) => module.ForgotPasswordPageComponent) },
  { path: 'reset-password', loadComponent: () => import('./iam/presentation/reset-password-page/reset-password-page.component').then((module) => module.ResetPasswordPageComponent) },
  { path: 'tenant-management/register-organization', loadComponent: () => import('./iam/presentation/organization-onboarding-page/organization-onboarding-page.component').then((module) => module.OrganizationOnboardingPageComponent) },
  { path: 'tenant-management/registration-pending/:registrationId', loadComponent: () => import('./iam/presentation/pending-activation-page/pending-activation-page.component').then((module) => module.PendingActivationPageComponent) },
  { path: 'forbidden', loadComponent: () => import('./iam/presentation/forbidden-page/forbidden-page.component').then((module) => module.ForbiddenPageComponent) },
  {
    path: '',
    component: PlatformShellComponent,
    canActivate: [platformSurfaceGuard, authGuard],
    data: { surface: 'PLATFORM' },
    children: [
      { path: '', pathMatch: 'full', redirectTo: roleLandingRedirect },
      { path: 'iam/profile', loadComponent: () => import('./iam/presentation/profile-page/profile-page.component').then((module) => module.ProfilePageComponent) },
      { path: 'iam/security/password', loadComponent: () => import('./iam/presentation/change-password-page/change-password-page.component').then((module) => module.ChangePasswordPageComponent) },
      { path: 'iam/security/sessions', loadComponent: () => import('./iam/presentation/sessions-page/sessions-page.component').then((module) => module.SessionsPageComponent) },
      { path: 'ops/overview', loadComponent: () => import('./core/presentation/overview-page/overview-page.component').then((module) => module.OverviewPageComponent), canActivate: [permissionGuard(PLATFORM_PERMISSIONS.fulfillmentRead)] },
      { path: 'ops/executive-overview', loadComponent: () => import('./core/presentation/company-owner-executive-overview-page.component').then((module) => module.CompanyOwnerExecutiveOverviewPageComponent), canActivate: [permissionGuard(PLATFORM_PERMISSIONS.ownerDashboardRead)] },
      { path: 'ops/operations/audit', loadComponent: () => import('./core/audit/presentation/audit-viewer-page.component').then((module) => module.AuditViewerPageComponent), canActivate: [permissionGuard(PLATFORM_PERMISSIONS.tenantRead)] },
      { path: 'ops/commercial/dashboard', loadComponent: () => import('./sales/dashboard/presentation/sales-dashboard-page.component').then((module) => module.SalesDashboardPageComponent), canActivate: [permissionGuard(PLATFORM_PERMISSIONS.salesRead)], providers: [SalesOperationsApiService] },
      {
        path: 'ops/operations/dashboard', data: { mode: 'dashboard' },
        loadComponent: () => import('./core/presentation/role-operations-dashboard-page.component').then((module) => module.RoleOperationsDashboardPageComponent),
        canActivate: [permissionGuard(PLATFORM_PERMISSIONS.warehouseRead)], providers: [WarehouseOperationsApiService, WarehouseOperationsFacade]
      },
      {
        path: 'ops/operations/inventory', data: { mode: 'inventory' },
        loadComponent: () => import('./warehouse/presentation/inventory-overview-page.component').then((module) => module.InventoryOverviewPageComponent),
        canActivate: [permissionGuard(PLATFORM_PERMISSIONS.warehouseRead)], providers: [WarehouseOperationsApiService, WarehouseOperationsFacade]
      },
      {
        path: 'ops/operations/warehouses', data: { mode: 'warehouses' },
        loadComponent: () => import('./warehouse/presentation/warehouses-page.component').then((module) => module.WarehousesPageComponent),
        canActivate: [permissionGuard(PLATFORM_PERMISSIONS.warehouseRead)], providers: [WarehouseOperationsApiService, WarehouseOperationsFacade]
      },
      {
        path: 'ops/operations/warehouses/:warehouseId', data: { mode: 'warehouses' },
        loadComponent: () => import('./warehouse/presentation/warehouse-detail-page.component').then((module) => module.WarehouseDetailPageComponent),
        canActivate: [permissionGuard(PLATFORM_PERMISSIONS.warehouseRead)], providers: [WarehouseOperationsApiService, WarehouseOperationsFacade]
      },
      {
        path: 'ops/operations/inventory/lots', data: { mode: 'lots' },
        loadComponent: () => import('./warehouse/presentation/inventory-lots-page.component').then((module) => module.InventoryLotsPageComponent),
        canActivate: [permissionGuard(PLATFORM_PERMISSIONS.warehouseRead)], providers: [WarehouseOperationsApiService, WarehouseOperationsFacade]
      },
      {
        path: 'ops/operations/inventory/lots/:lotId', data: { mode: 'lots' },
        loadComponent: () => import('./warehouse/presentation/inventory-lot-detail-page.component').then((module) => module.InventoryLotDetailPageComponent),
        canActivate: [permissionGuard(PLATFORM_PERMISSIONS.warehouseRead)], providers: [WarehouseOperationsApiService, WarehouseOperationsFacade]
      },
      {
        path: 'ops/operations/inventory/movements', data: { mode: 'movements' },
        loadComponent: () => import('./warehouse/presentation/stock-movements-page.component').then((module) => module.StockMovementsPageComponent),
        canActivate: [permissionGuard(PLATFORM_PERMISSIONS.warehouseRead)], providers: [WarehouseOperationsApiService, WarehouseOperationsFacade]
      },
      {
        path: 'ops/operations/inventory/reservations', data: { mode: 'reservations' },
        loadComponent: () => import('./warehouse/presentation/inventory-reservations-page.component').then((module) => module.InventoryReservationsPageComponent),
        canActivate: [permissionGuard(PLATFORM_PERMISSIONS.warehouseRead)], providers: [WarehouseOperationsApiService, WarehouseOperationsFacade]
      },
      {
        path: 'ops/operations/inventory/reservations/:reservationId', data: { mode: 'reservations' },
        loadComponent: () => import('./warehouse/presentation/inventory-reservation-detail-page.component').then((module) => module.InventoryReservationDetailPageComponent),
        canActivate: [permissionGuard(PLATFORM_PERMISSIONS.warehouseRead)], providers: [WarehouseOperationsApiService, WarehouseOperationsFacade]
      },
      {
        path: 'ops/operations/fulfillment-readiness', data: { mode: 'readiness' },
        loadComponent: () => import('./warehouse/presentation/fulfillment-readiness-page.component').then((module) => module.FulfillmentReadinessPageComponent),
        canActivate: [permissionGuard(PLATFORM_PERMISSIONS.fulfillmentRead)], providers: [WarehouseOperationsApiService, WarehouseOperationsFacade, SalesOperationsApiService]
      },
      { path: 'ops/operations/inventory-overview', loadComponent: () => import('./warehouse/presentation/inventory-overview-page.component').then((module) => module.InventoryOverviewPageComponent), canActivate: [permissionGuard(PLATFORM_PERMISSIONS.warehouseRead)], providers: [WarehouseOperationsApiService, WarehouseOperationsFacade] },
      { path: 'ops/operations/inventory-control', pathMatch: 'full', redirectTo: 'ops/operations/inventory' },
      { path: 'ops/operations/inventory-lots', pathMatch: 'full', redirectTo: 'ops/operations/inventory/lots' },
      { path: 'ops/operations/dispatch-orders', loadComponent: () => import('./logistics/presentation/dispatch-board-page.component').then((module) => module.DispatchBoardPageComponent), canActivate: [permissionGuard(PLATFORM_PERMISSIONS.logisticsRead)] },
      { path: 'ops/operations/dispatch-orders/:dispatchOrderId', loadComponent: () => import('./logistics/presentation/dispatch-detail-page.component').then((module) => module.DispatchDetailPageComponent), canActivate: [permissionGuard(PLATFORM_PERMISSIONS.logisticsRead)] },
      { path: 'ops/operations/proof-of-delivery', loadComponent: () => import('./logistics/presentation/proof-of-delivery-page.component').then((module) => module.ProofOfDeliveryPageComponent), canActivate: [permissionGuard(PLATFORM_PERMISSIONS.logisticsRead)] },
      { path: 'ops/operations/temperature-incidents', loadComponent: () => import('./logistics/presentation/temperature-incidents-page.component').then((module) => module.TemperatureIncidentsPageComponent), canActivate: [permissionGuard(PLATFORM_PERMISSIONS.logisticsRead)] },
      { path: 'ops/operations/operational-analytics', loadComponent: () => import('./logistics/presentation/operational-analytics-page.component').then((module) => module.OperationalAnalyticsPageComponent), canActivate: [permissionGuard(PLATFORM_PERMISSIONS.logisticsRead)] },
      { path: 'ops/operations/business-documents/orders/:orderId', redirectTo: businessDocumentsOrderRedirect },
      { path: 'ops/operations/business-documents', loadComponent: () => import('./documents/presentation/business-documents-page.component').then((module) => module.BusinessDocumentsPageComponent), canActivate: [permissionGuard(PLATFORM_PERMISSIONS.documentRead)] },
      { path: 'ops/catalog', pathMatch: 'full', loadComponent: () => import('./catalog-management/presentation/catalog-home-page/catalog-home-page.component').then((module) => module.CatalogHomePageComponent), canActivate: [catalogReadGuard] },
      { path: 'ops/catalog/products', pathMatch: 'full', loadComponent: () => import('./catalog-management/presentation/catalog-products-page/catalog-products-page.component').then((module) => module.CatalogProductsPageComponent), canActivate: [catalogReadGuard] },
      { path: 'ops/catalog/families', pathMatch: 'full', loadComponent: () => import('./catalog-management/presentation/catalog-products-page/catalog-products-page.component').then((module) => module.CatalogProductsPageComponent), canActivate: [catalogReadGuard] },
      { path: 'ops/catalog/skus', pathMatch: 'full', loadComponent: () => import('./catalog-management/presentation/catalog-pricing-page/catalog-pricing-page.component').then((module) => module.CatalogPricingPageComponent), canActivate: [catalogReadGuard] },
      { path: 'ops/catalog/products/new', loadComponent: () => import('./catalog-management/presentation/catalog-product-form-page/catalog-product-form-page.component').then((module) => module.CatalogProductFormPageComponent), canActivate: [catalogManageGuard] },
      { path: 'ops/catalog/products/:productId', loadComponent: () => import('./catalog-management/presentation/catalog-product-form-page/catalog-product-form-page.component').then((module) => module.CatalogProductFormPageComponent), canActivate: [catalogReadGuard] },
      { path: 'ops/catalog/categories', data: { kind: 'categories' }, loadComponent: () => import('./catalog-management/presentation/catalog-taxonomy-page/catalog-taxonomy-page.component').then((module) => module.CatalogTaxonomyPageComponent), canActivate: [catalogManageGuard] },
      { path: 'ops/catalog/brands', data: { kind: 'brands' }, loadComponent: () => import('./catalog-management/presentation/catalog-taxonomy-page/catalog-taxonomy-page.component').then((module) => module.CatalogTaxonomyPageComponent), canActivate: [catalogManageGuard] },
      { path: 'ops/catalog/pricing', loadComponent: () => import('./catalog-management/presentation/catalog-pricing-page/catalog-pricing-page.component').then((module) => module.CatalogPricingPageComponent), canActivate: [catalogReadGuard] },
      { path: 'ops/catalog/promotions', loadComponent: () => import('./catalog-management/presentation/catalog-promotions-page/catalog-promotions-page.component').then((module) => module.CatalogPromotionsPageComponent), canActivate: [promotionReadGuard] },
      { path: 'ops/catalog/promotions/new', loadComponent: () => import('./catalog-management/presentation/catalog-promotion-form-page/catalog-promotion-form-page.component').then((module) => module.CatalogPromotionFormPageComponent), canActivate: [promotionManageGuard], providers: [SalesOperationsApiService] },
      { path: 'ops/catalog/promotions/:promotionId', loadComponent: () => import('./catalog-management/presentation/catalog-promotion-form-page/catalog-promotion-form-page.component').then((module) => module.CatalogPromotionFormPageComponent), canActivate: [promotionReadGuard], providers: [SalesOperationsApiService] },
      { path: 'ops/product-catalog', pathMatch: 'full', redirectTo: 'ops/catalog/products' },
      { path: 'ops/product-catalog/:catalogItemId', loadComponent: () => import('./catalog-management/presentation/product-catalog-detail-page/product-catalog-detail-page.component').then((module) => module.ProductCatalogDetailPageComponent), canActivate: [catalogReadGuard] },
      { path: 'ops/commercial/promotions', pathMatch: 'full', redirectTo: 'ops/catalog/promotions' },
      { path: 'ops/commercial/manual-order-entry', pathMatch: 'full', redirectTo: 'ops/commercial/manual-orders/new' },
      { path: 'ops/commercial/business-documents/orders/:orderId', redirectTo: businessDocumentsOrderRedirect },
      { path: 'ops/commercial/business-documents', pathMatch: 'full', redirectTo: 'ops/operations/business-documents' },
      {
        path: 'ops/operations/company-administration',
        loadComponent: () => import('./tenant-management/presentation/company-administration-page/company-administration-page.component').then((module) => module.CompanyAdministrationPageComponent),
        canActivate: [permissionGuard(PLATFORM_PERMISSIONS.tenantRead)]
      },
      { path: 'ops/company-administration', pathMatch: 'full', redirectTo: 'ops/operations/company-administration' },
      { path: 'ops/settings', pathMatch: 'full', redirectTo: 'ops/operations/company-administration' },
      {
        path: 'ops/commercial/client-accounts',
        loadComponent: () => import('./sales/client-accounts/presentation/client-accounts-page.component').then((module) => module.ClientAccountsPageComponent),
        canActivate: [permissionGuard(PLATFORM_PERMISSIONS.salesRead)], providers: [SalesOperationsApiService, ClientAccountsFacade]
      },
      {
        path: 'ops/commercial/client-accounts/new',
        loadComponent: () => import('./sales/client-accounts/presentation/client-account-detail-page.component').then((module) => module.ClientAccountDetailPageComponent),
        canActivate: [permissionGuard(PLATFORM_PERMISSIONS.salesWrite)], providers: [SalesOperationsApiService, ClientAccountsFacade]
      },
      {
        path: 'ops/commercial/client-accounts/:clientAccountId',
        loadComponent: () => import('./sales/client-accounts/presentation/client-account-detail-page.component').then((module) => module.ClientAccountDetailPageComponent),
        canActivate: [permissionGuard(PLATFORM_PERMISSIONS.salesRead)], providers: [SalesOperationsApiService, ClientAccountsFacade]
      },
      { path: 'ops/commercial/request-builder', pathMatch: 'full', redirectTo: 'ops/commercial/purchase-requests' },
      { path: 'ops/commercial/request-builder/:purchaseRequestId', pathMatch: 'full', redirectTo: dynamicRedirect('/ops/commercial/purchase-requests', 'purchaseRequestId') },
      { path: 'ops/commercial/manual-sales-order', pathMatch: 'full', redirectTo: 'ops/commercial/manual-orders/new' },
      {
        path: 'ops/commercial/manual-orders/new',
        loadComponent: () => import('./sales/manual-orders/presentation/manual-order-start-page.component').then((module) => module.ManualOrderStartPageComponent),
        canActivate: [permissionGuard(PLATFORM_PERMISSIONS.salesWrite)], providers: [SalesOperationsApiService, ManualOrderWizardFacade]
      },
      {
        path: 'ops/commercial/manual-orders/new/client', pathMatch: 'full',
        loadComponent: () => import('./sales/manual-orders/presentation/manual-order-start-page.component').then((module) => module.ManualOrderStartPageComponent),
        canActivate: [permissionGuard(PLATFORM_PERMISSIONS.salesWrite), createManualOrderDraftGuard], providers: [SalesOperationsApiService, ManualOrderWizardFacade]
      },
      {
        path: 'ops/commercial/manual-orders/new/items', pathMatch: 'full', redirectTo: 'ops/commercial/manual-orders/new/client'
      },
      {
        path: 'ops/commercial/manual-orders/new/delivery', pathMatch: 'full', redirectTo: 'ops/commercial/manual-orders/new/client'
      },
      {
        path: 'ops/commercial/manual-orders/new/review', pathMatch: 'full', redirectTo: 'ops/commercial/manual-orders/new/client'
      },
      {
        path: 'ops/commercial/manual-orders/:draftId/client', data: { manualOrderStep: 'client' },
        loadComponent: () => import('./sales/manual-orders/presentation/manual-order-client-page.component').then((module) => module.ManualOrderClientPageComponent),
        canActivate: [permissionGuard(PLATFORM_PERMISSIONS.salesWrite), manualOrderStepGuard], providers: [SalesOperationsApiService, ManualOrderWizardFacade]
      },
      {
        path: 'ops/commercial/manual-orders/:draftId/items', data: { manualOrderStep: 'items' },
        loadComponent: () => import('./sales/manual-orders/presentation/manual-order-items-page.component').then((module) => module.ManualOrderItemsPageComponent),
        canActivate: [permissionGuard(PLATFORM_PERMISSIONS.salesWrite), manualOrderStepGuard], providers: [SalesOperationsApiService, ManualOrderWizardFacade]
      },
      {
        path: 'ops/commercial/manual-orders/:draftId/delivery', data: { manualOrderStep: 'delivery' },
        loadComponent: () => import('./sales/manual-orders/presentation/manual-order-delivery-page.component').then((module) => module.ManualOrderDeliveryPageComponent),
        canActivate: [permissionGuard(PLATFORM_PERMISSIONS.salesWrite), manualOrderStepGuard], providers: [SalesOperationsApiService, ManualOrderWizardFacade]
      },
      {
        path: 'ops/commercial/manual-orders/:draftId/review', data: { manualOrderStep: 'review' },
        loadComponent: () => import('./sales/manual-orders/presentation/manual-order-review-page.component').then((module) => module.ManualOrderReviewPageComponent),
        canActivate: [permissionGuard(PLATFORM_PERMISSIONS.salesWrite), manualOrderStepGuard], providers: [SalesOperationsApiService, ManualOrderWizardFacade]
      },
      {
        path: 'ops/commercial/purchase-requests',
        loadComponent: () => import('./sales/purchase-requests/presentation/purchase-request-inbox-page.component').then((module) => module.PurchaseRequestInboxPageComponent),
        canActivate: [permissionGuard(PLATFORM_PERMISSIONS.salesRead)], providers: [SalesOperationsApiService, PurchaseRequestOperationsFacade]
      },
      {
        path: 'ops/commercial/purchase-requests/:purchaseRequestId',
        loadComponent: () => import('./sales/purchase-requests/presentation/purchase-request-detail-page.component').then((module) => module.PurchaseRequestDetailPageComponent),
        canActivate: [permissionGuard(PLATFORM_PERMISSIONS.salesRead)], providers: [SalesOperationsApiService, PurchaseRequestOperationsFacade]
      },
      {
        path: 'ops/commercial/sales-orders',
        loadComponent: () => import('./sales/sales-orders/presentation/sales-orders-page.component').then((module) => module.SalesOrdersPageComponent),
        canActivate: [permissionGuard(PLATFORM_PERMISSIONS.salesRead)], providers: [SalesOperationsApiService, SalesOrdersFacade]
      },
      {
        path: 'ops/commercial/sales-orders/:salesOrderId',
        loadComponent: () => import('./sales/sales-orders/presentation/sales-order-detail-page.component').then((module) => module.SalesOrderDetailPageComponent),
        canActivate: [permissionGuard(PLATFORM_PERMISSIONS.salesRead)], providers: [SalesOperationsApiService, SalesOrdersFacade]
      },
      { path: 'ops/commercial/purchase-orders', pathMatch: 'full', redirectTo: 'ops/commercial/sales-orders' },
      { path: 'ops/commercial/purchase-orders/:salesOrderId', redirectTo: dynamicRedirect('/ops/commercial/sales-orders', 'salesOrderId') },
      {
        path: 'ops/fulfillment/readiness',
        loadComponent: () => import('./sales/sales-orders/presentation/fulfillment-readiness-page.component').then((module) => module.FulfillmentReadinessPageComponent),
        canActivate: [permissionGuard(PLATFORM_PERMISSIONS.fulfillmentRead)], providers: [SalesOperationsApiService, SalesOrdersFacade]
      },
      { path: 'ops/clients', pathMatch: 'full', redirectTo: 'ops/commercial/client-accounts' },
      { path: 'ops/commercial/requests', pathMatch: 'full', redirectTo: 'ops/commercial/purchase-requests' },
      { path: 'ops/commercial/purchase-requests/new', pathMatch: 'full', redirectTo: 'ops/commercial/purchase-requests' },
      { path: 'ops/commercial/requests/:purchaseRequestId', redirectTo: dynamicRedirect('/ops/commercial/purchase-requests', 'purchaseRequestId') },
      { path: 'ops/commercial/orders', pathMatch: 'full', redirectTo: 'ops/commercial/sales-orders' },
      { path: 'ops/commercial/orders/:salesOrderId', redirectTo: dynamicRedirect('/ops/commercial/sales-orders', 'salesOrderId') },
      { path: 'ops/orders', pathMatch: 'full', redirectTo: 'ops/commercial/sales-orders' },
      { path: 'ops/profile', pathMatch: 'full', redirectTo: 'iam/profile' },
      { path: 'overview', pathMatch: 'full', redirectTo: 'ops/overview' },
      { path: '**', redirectTo: '/' }
    ]
  }
];
