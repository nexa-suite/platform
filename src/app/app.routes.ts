import { RedirectFunction, Router, Routes } from '@angular/router';
import { inject } from '@angular/core';
import { PlatformAuthenticationBoundary } from './core/security/platform-authentication.boundary';
import { anonymousGuard, authGuard } from './core/security/auth.guard';
import { platformSurfaceGuard } from './core/security/platform-surface.guard';
import { PlatformShellComponent } from './core/layout/platform-shell/platform-shell.component';
import { anyPermissionGuard, permissionGuard } from './core/security/permission.guard';
import { platformLandingForUser, PLATFORM_PERMISSIONS } from './core/security/platform-permissions';
import { SalesCommitmentApiService } from './salescommitment/infrastructure/http/sales-commitment-api.service';
import { ClientAccountsFacade } from './customerbuyerrelationships/application/client-accounts.facade';
import { PurchaseRequestOperationsFacade } from './salescommitment/application/purchase-requests/purchase-request-operations.facade';
import { ManualOrderWizardFacade } from './salescommitment/application/manual-orders/manual-order-wizard.facade';
import { manualOrderStepGuard } from './salescommitment/presentation/manual-orders/manual-order-step.guard';
import { createManualOrderDraftGuard } from './salescommitment/presentation/manual-orders/create-manual-order-draft.guard';
import { SalesOrdersFacade } from './salescommitment/application/sales-orders/sales-orders.facade';
import { CustomerRelationshipsApiService } from './customerbuyerrelationships/infrastructure/http/customer-relationships-api.service';
import { customerRelationshipsApiPortProvider } from './customerbuyerrelationships/infrastructure/mock/customer-relationships-api-port.provider';
import { SalesCommitmentCatalogGateway } from './salescommitment/infrastructure/catalog/sales-commitment-catalog.gateway';
import { SalesCommitmentCatalogPort, SalesCommitmentCustomerPort } from './salescommitment/domain/ports/sales-commitment-cross-context.ports';
import { SalesCommitmentCustomerGateway } from './salescommitment/infrastructure/customer/sales-commitment-customer.gateway';
import { salesCommitmentApiPortProvider } from './salescommitment/infrastructure/mock/sales-commitment-api-port.provider';
import { GoogleMapsRoutePort } from './salescommitment/domain/ports/google-maps-route.port';
import { GoogleMapsRouteAdapter } from './salescommitment/infrastructure/maps/google-maps-route.adapter';
import { CatalogPromotionTargetsGateway } from './catalogcommercialpolicy/infrastructure/http/catalog-promotion-targets.gateway';
import { MockCatalogPromotionTargetsGateway } from './catalogcommercialpolicy/infrastructure/mock/mock-catalog-promotion-targets.gateway';
import { catalogPromotionTargetsPortProvider } from './catalogcommercialpolicy/infrastructure/mock/catalog-promotion-targets-port.provider';
import { WarehouseOperationsApiService } from './inventoryavailability/infrastructure/warehouse-operations-api.service';
import { WarehouseOperationsFacade } from './inventoryavailability/application/warehouse-operations.facade';
import { InventoryCatalogGateway } from './inventoryavailability/infrastructure/catalog/inventory-catalog.gateway';
import { SalesOrderVersionGateway } from './inventoryavailability/infrastructure/sales/sales-order-version.gateway';
import { MockWarehouseOperationsApiService } from './inventoryavailability/infrastructure/mock/mock-warehouse-operations-api.service';
import { warehouseOperationsApiPortProvider } from './inventoryavailability/infrastructure/mock/warehouse-operations-api-port.provider';
import { MockInventoryCatalogGateway, MockSalesOrderVersionGateway } from './inventoryavailability/infrastructure/mock/mock-inventory-cross-context';
import { inventoryCatalogPortProvider, salesOrderVersionPortProvider } from './inventoryavailability/infrastructure/mock/inventory-cross-context.providers';
import { catalogReadGuard, catalogManageGuard, promotionReadGuard, promotionManageGuard } from './core/security/catalog-access.guard';
import { tenantManagementRoutes } from './tenantaccessgovernance/tenantmanagement/presentation/tenant-management.routes';

const roleLandingRedirect: RedirectFunction = () => {
  const auth = inject(PlatformAuthenticationBoundary);
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

const salesCommitmentProviders = [
  SalesCommitmentApiService,
  salesCommitmentApiPortProvider
];
const customerRelationshipProviders = [
  CustomerRelationshipsApiService,
  customerRelationshipsApiPortProvider
];
const salesCommitmentReferenceProviders = [
  ...salesCommitmentProviders,
  ...customerRelationshipProviders,
  SalesCommitmentCatalogGateway,
  { provide: SalesCommitmentCatalogPort, useExisting: SalesCommitmentCatalogGateway },
  SalesCommitmentCustomerGateway,
  { provide: SalesCommitmentCustomerPort, useExisting: SalesCommitmentCustomerGateway },
  GoogleMapsRouteAdapter,
  { provide: GoogleMapsRoutePort, useExisting: GoogleMapsRouteAdapter }
];
const catalogPromotionProviders = [
  CatalogPromotionTargetsGateway,
  MockCatalogPromotionTargetsGateway,
  catalogPromotionTargetsPortProvider
];
const warehouseProviders = [
  ...salesCommitmentProviders,
  WarehouseOperationsApiService,
  MockWarehouseOperationsApiService,
  warehouseOperationsApiPortProvider,
  InventoryCatalogGateway,
  MockInventoryCatalogGateway,
  inventoryCatalogPortProvider,
  SalesOrderVersionGateway,
  MockSalesOrderVersionGateway,
  salesOrderVersionPortProvider,
  WarehouseOperationsFacade
];

export const routes: Routes = [
  ...tenantManagementRoutes,
  { path: 'auth/login', pathMatch: 'full', redirectTo: 'sign-in' },
  { path: 'auth/recover', pathMatch: 'full', redirectTo: 'forgot-password' },
  { path: 'auth/blocked', pathMatch: 'full', redirectTo: 'forbidden' },
  { path: 'auth/forbidden', pathMatch: 'full', redirectTo: 'forbidden' },
  { path: 'sign-in', loadComponent: () => import('./tenantaccessgovernance/iam/presentation/sign-in-page/sign-in-page.component').then((module) => module.SignInPageComponent), canActivate: [anonymousGuard] },
  { path: 'forgot-password', loadComponent: () => import('./tenantaccessgovernance/iam/presentation/forgot-password-page/forgot-password-page.component').then((module) => module.ForgotPasswordPageComponent) },
  { path: 'reset-password', loadComponent: () => import('./tenantaccessgovernance/iam/presentation/reset-password-page/reset-password-page.component').then((module) => module.ResetPasswordPageComponent) },
  { path: 'tenant-management/register-organization', loadComponent: () => import('./tenantaccessgovernance/iam/presentation/organization-onboarding-page/organization-onboarding-page.component').then((module) => module.OrganizationOnboardingPageComponent) },
  { path: 'tenant-management/registration-pending/:registrationId', loadComponent: () => import('./tenantaccessgovernance/iam/presentation/pending-activation-page/pending-activation-page.component').then((module) => module.PendingActivationPageComponent) },
  { path: 'forbidden', loadComponent: () => import('./tenantaccessgovernance/iam/presentation/forbidden-page/forbidden-page.component').then((module) => module.ForbiddenPageComponent) },
  {
    path: '',
    component: PlatformShellComponent,
    canActivate: [platformSurfaceGuard, authGuard],
    data: { surface: 'PLATFORM' },
    children: [
      { path: '', pathMatch: 'full', redirectTo: roleLandingRedirect },
      { path: 'iam/profile', loadComponent: () => import('./tenantaccessgovernance/iam/presentation/profile-page/profile-page.component').then((module) => module.ProfilePageComponent) },
      { path: 'iam/security/password', loadComponent: () => import('./tenantaccessgovernance/iam/presentation/change-password-page/change-password-page.component').then((module) => module.ChangePasswordPageComponent) },
      { path: 'iam/security/sessions', loadComponent: () => import('./tenantaccessgovernance/iam/presentation/sessions-page/sessions-page.component').then((module) => module.SessionsPageComponent) },
      { path: 'ops/overview', loadComponent: () => import('./core/presentation/overview-page/overview-page.component').then((module) => module.OverviewPageComponent), canActivate: [permissionGuard(PLATFORM_PERMISSIONS.fulfillmentRead)] },
      { path: 'ops/executive-overview', loadComponent: () => import('./core/presentation/company-owner-executive-overview-page.component').then((module) => module.CompanyOwnerExecutiveOverviewPageComponent), canActivate: [permissionGuard(PLATFORM_PERMISSIONS.ownerDashboardRead)] },
      { path: 'ops/operations/audit', loadComponent: () => import('./tenantaccessgovernance/iam/presentation/audit-viewer-page.component').then((module) => module.AuditViewerPageComponent), canActivate: [permissionGuard(PLATFORM_PERMISSIONS.tenantRead)] },
      { path: 'ops/commercial/dashboard', loadComponent: () => import('./salescommitment/presentation/dashboard/sales-dashboard-page.component').then((module) => module.SalesDashboardPageComponent), canActivate: [permissionGuard(PLATFORM_PERMISSIONS.salesRead)], providers: salesCommitmentProviders },
      {
        path: 'ops/operations/dashboard', data: { mode: 'dashboard' },
        loadComponent: () => import('./core/presentation/role-operations-dashboard-page.component').then((module) => module.RoleOperationsDashboardPageComponent),
        canActivate: [anyPermissionGuard([PLATFORM_PERMISSIONS.warehouseRead, PLATFORM_PERMISSIONS.logisticsRead])], providers: warehouseProviders
      },
      {
        path: 'ops/operations/inventory', data: { mode: 'inventory' },
        loadComponent: () => import('./inventoryavailability/presentation/inventory-overview-page.component').then((module) => module.InventoryOverviewPageComponent),
        canActivate: [permissionGuard(PLATFORM_PERMISSIONS.warehouseRead)], providers: warehouseProviders
      },
      {
        path: 'ops/operations/warehouses', data: { mode: 'warehouses' },
        loadComponent: () => import('./inventoryavailability/presentation/warehouses-page.component').then((module) => module.WarehousesPageComponent),
        canActivate: [permissionGuard(PLATFORM_PERMISSIONS.warehouseRead)], providers: warehouseProviders
      },
      {
        path: 'ops/operations/warehouses/:warehouseId', data: { mode: 'warehouses' },
        loadComponent: () => import('./inventoryavailability/presentation/warehouse-detail-page.component').then((module) => module.WarehouseDetailPageComponent),
        canActivate: [permissionGuard(PLATFORM_PERMISSIONS.warehouseRead)], providers: warehouseProviders
      },
      {
        path: 'ops/operations/inventory/lots', data: { mode: 'lots' },
        loadComponent: () => import('./inventoryavailability/presentation/inventory-lots-page.component').then((module) => module.InventoryLotsPageComponent),
        canActivate: [permissionGuard(PLATFORM_PERMISSIONS.warehouseRead)], providers: warehouseProviders
      },
      {
        path: 'ops/operations/inventory/lots/:lotId', data: { mode: 'lots' },
        loadComponent: () => import('./inventoryavailability/presentation/inventory-lot-detail-page.component').then((module) => module.InventoryLotDetailPageComponent),
        canActivate: [permissionGuard(PLATFORM_PERMISSIONS.warehouseRead)], providers: warehouseProviders
      },
      {
        path: 'ops/operations/inventory/movements', data: { mode: 'movements' },
        loadComponent: () => import('./inventoryavailability/presentation/stock-movements-page.component').then((module) => module.StockMovementsPageComponent),
        canActivate: [permissionGuard(PLATFORM_PERMISSIONS.warehouseRead)], providers: warehouseProviders
      },
      {
        path: 'ops/operations/inventory/reservations', data: { mode: 'reservations' },
        loadComponent: () => import('./inventoryavailability/presentation/inventory-reservations-page.component').then((module) => module.InventoryReservationsPageComponent),
        canActivate: [permissionGuard(PLATFORM_PERMISSIONS.warehouseRead)], providers: warehouseProviders
      },
      {
        path: 'ops/operations/inventory/reservations/:reservationId', data: { mode: 'reservations' },
        loadComponent: () => import('./inventoryavailability/presentation/inventory-reservation-detail-page.component').then((module) => module.InventoryReservationDetailPageComponent),
        canActivate: [permissionGuard(PLATFORM_PERMISSIONS.warehouseRead)], providers: warehouseProviders
      },
      {
        path: 'ops/operations/fulfillment-readiness', data: { mode: 'readiness' },
        loadComponent: () => import('./inventoryavailability/presentation/fulfillment-readiness-page.component').then((module) => module.FulfillmentReadinessPageComponent),
        canActivate: [permissionGuard(PLATFORM_PERMISSIONS.fulfillmentRead)], providers: warehouseProviders
      },
      { path: 'ops/operations/inventory-overview', loadComponent: () => import('./inventoryavailability/presentation/inventory-overview-page.component').then((module) => module.InventoryOverviewPageComponent), canActivate: [permissionGuard(PLATFORM_PERMISSIONS.warehouseRead)], providers: warehouseProviders },
      { path: 'ops/operations/inventory-control', pathMatch: 'full', redirectTo: 'ops/operations/inventory' },
      { path: 'ops/operations/inventory-lots', pathMatch: 'full', redirectTo: 'ops/operations/inventory/lots' },
      { path: 'ops/operations/dispatch-orders', loadComponent: () => import('./fulfillmentdelivery/presentation/dispatch-board-page.component').then((module) => module.DispatchBoardPageComponent), canActivate: [permissionGuard(PLATFORM_PERMISSIONS.logisticsRead)] },
      { path: 'ops/operations/dispatch-orders/:dispatchOrderId', loadComponent: () => import('./fulfillmentdelivery/presentation/dispatch-detail-page.component').then((module) => module.DispatchDetailPageComponent), canActivate: [permissionGuard(PLATFORM_PERMISSIONS.logisticsRead)] },
      { path: 'ops/operations/proof-of-delivery', loadComponent: () => import('./fulfillmentdelivery/presentation/proof-of-delivery-page.component').then((module) => module.ProofOfDeliveryPageComponent), canActivate: [permissionGuard(PLATFORM_PERMISSIONS.logisticsRead)] },
      { path: 'ops/operations/temperature-incidents', loadComponent: () => import('./fulfillmentdelivery/presentation/temperature-incidents-page.component').then((module) => module.TemperatureIncidentsPageComponent), canActivate: [permissionGuard(PLATFORM_PERMISSIONS.logisticsRead)] },
      { path: 'ops/operations/operational-analytics', loadComponent: () => import('./fulfillmentdelivery/presentation/operational-analytics-page.component').then((module) => module.OperationalAnalyticsPageComponent), canActivate: [permissionGuard(PLATFORM_PERMISSIONS.logisticsRead)] },
      { path: 'ops/operations/business-documents/orders/:orderId', redirectTo: businessDocumentsOrderRedirect },
      { path: 'ops/operations/business-documents', loadComponent: () => import('./businessdocuments/presentation/business-documents-page.component').then((module) => module.BusinessDocumentsPageComponent), canActivate: [permissionGuard(PLATFORM_PERMISSIONS.documentRead)] },
      { path: 'ops/finance/bank-transfers', loadComponent: () => import('./payments/presentation/bank-transfer-review-page.component').then((module) => module.BankTransferReviewPageComponent), canActivate: [permissionGuard(PLATFORM_PERMISSIONS.paymentReconcile)] },
      { path: 'ops/catalog', pathMatch: 'full', loadComponent: () => import('./catalogcommercialpolicy/presentation/catalog-home-page/catalog-home-page.component').then((module) => module.CatalogHomePageComponent), canActivate: [catalogReadGuard] },
      { path: 'ops/catalog/products', pathMatch: 'full', loadComponent: () => import('./catalogcommercialpolicy/presentation/catalog-products-page/catalog-products-page.component').then((module) => module.CatalogProductsPageComponent), canActivate: [catalogReadGuard] },
      { path: 'ops/catalog/families', pathMatch: 'full', loadComponent: () => import('./catalogcommercialpolicy/presentation/catalog-products-page/catalog-products-page.component').then((module) => module.CatalogProductsPageComponent), canActivate: [catalogReadGuard] },
      { path: 'ops/catalog/skus', pathMatch: 'full', loadComponent: () => import('./catalogcommercialpolicy/presentation/catalog-pricing-page/catalog-pricing-page.component').then((module) => module.CatalogPricingPageComponent), canActivate: [catalogReadGuard] },
      { path: 'ops/catalog/products/new', loadComponent: () => import('./catalogcommercialpolicy/presentation/catalog-product-form-page/catalog-product-form-page.component').then((module) => module.CatalogProductFormPageComponent), canActivate: [catalogManageGuard] },
      { path: 'ops/catalog/products/:productId', loadComponent: () => import('./catalogcommercialpolicy/presentation/catalog-product-form-page/catalog-product-form-page.component').then((module) => module.CatalogProductFormPageComponent), canActivate: [catalogReadGuard] },
      { path: 'ops/catalog/categories', data: { kind: 'categories' }, loadComponent: () => import('./catalogcommercialpolicy/presentation/catalog-taxonomy-page/catalog-taxonomy-page.component').then((module) => module.CatalogTaxonomyPageComponent), canActivate: [catalogManageGuard] },
      { path: 'ops/catalog/brands', data: { kind: 'brands' }, loadComponent: () => import('./catalogcommercialpolicy/presentation/catalog-taxonomy-page/catalog-taxonomy-page.component').then((module) => module.CatalogTaxonomyPageComponent), canActivate: [catalogManageGuard] },
      { path: 'ops/catalog/pricing', loadComponent: () => import('./catalogcommercialpolicy/presentation/catalog-pricing-page/catalog-pricing-page.component').then((module) => module.CatalogPricingPageComponent), canActivate: [catalogReadGuard] },
      { path: 'ops/catalog/promotions', loadComponent: () => import('./catalogcommercialpolicy/presentation/catalog-promotions-page/catalog-promotions-page.component').then((module) => module.CatalogPromotionsPageComponent), canActivate: [promotionReadGuard] },
      { path: 'ops/catalog/promotions/new', loadComponent: () => import('./catalogcommercialpolicy/presentation/catalog-promotion-form-page/catalog-promotion-form-page.component').then((module) => module.CatalogPromotionFormPageComponent), canActivate: [promotionManageGuard], providers: catalogPromotionProviders },
      { path: 'ops/catalog/promotions/:promotionId', loadComponent: () => import('./catalogcommercialpolicy/presentation/catalog-promotion-form-page/catalog-promotion-form-page.component').then((module) => module.CatalogPromotionFormPageComponent), canActivate: [promotionReadGuard], providers: catalogPromotionProviders },
      { path: 'ops/product-catalog', pathMatch: 'full', loadComponent: () => import('./catalogcommercialpolicy/presentation/product-catalog-page/product-catalog-page.component').then((module) => module.ProductCatalogPageComponent), canActivate: [catalogReadGuard] },
      { path: 'ops/product-catalog/:catalogItemId', loadComponent: () => import('./catalogcommercialpolicy/presentation/product-catalog-detail-page/product-catalog-detail-page.component').then((module) => module.ProductCatalogDetailPageComponent), canActivate: [catalogReadGuard] },
      { path: 'ops/commercial/promotions', pathMatch: 'full', redirectTo: 'ops/catalog/promotions' },
      { path: 'ops/commercial/manual-order-entry', pathMatch: 'full', redirectTo: 'ops/commercial/manual-orders/new' },
      { path: 'ops/commercial/business-documents/orders/:orderId', redirectTo: businessDocumentsOrderRedirect },
      { path: 'ops/commercial/business-documents', pathMatch: 'full', redirectTo: 'ops/operations/business-documents' },
      {
        path: 'ops/operations/company-administration',
        loadComponent: () => import('./tenantaccessgovernance/tenantmanagement/presentation/company-administration-page/company-administration-page.component').then((module) => module.CompanyAdministrationPageComponent),
        canActivate: [permissionGuard(PLATFORM_PERMISSIONS.tenantRead)]
      },
      { path: 'ops/company-administration', pathMatch: 'full', redirectTo: 'ops/operations/company-administration' },
      { path: 'ops/settings', pathMatch: 'full', redirectTo: 'ops/operations/company-administration' },
      {
        path: 'ops/commercial/client-accounts',
        loadComponent: () => import('./customerbuyerrelationships/presentation/client-accounts-page.component').then((module) => module.ClientAccountsPageComponent),
        canActivate: [permissionGuard(PLATFORM_PERMISSIONS.salesRead)], providers: [...customerRelationshipProviders, ClientAccountsFacade]
      },
      {
        path: 'ops/commercial/client-accounts/new',
        loadComponent: () => import('./customerbuyerrelationships/presentation/client-account-detail-page.component').then((module) => module.ClientAccountDetailPageComponent),
        canActivate: [permissionGuard(PLATFORM_PERMISSIONS.salesWrite)], providers: [...customerRelationshipProviders, ClientAccountsFacade]
      },
      {
        path: 'ops/commercial/client-accounts/:clientAccountId',
        loadComponent: () => import('./customerbuyerrelationships/presentation/client-account-detail-page.component').then((module) => module.ClientAccountDetailPageComponent),
        canActivate: [permissionGuard(PLATFORM_PERMISSIONS.salesRead)], providers: [...customerRelationshipProviders, ClientAccountsFacade]
      },
      { path: 'ops/commercial/request-builder', pathMatch: 'full', redirectTo: 'ops/commercial/purchase-requests' },
      { path: 'ops/commercial/request-builder/:purchaseRequestId', pathMatch: 'full', redirectTo: dynamicRedirect('/ops/commercial/purchase-requests', 'purchaseRequestId') },
      { path: 'ops/commercial/manual-sales-order', pathMatch: 'full', redirectTo: 'ops/commercial/manual-orders/new' },
      {
        path: 'ops/commercial/manual-orders/new',
        loadComponent: () => import('./salescommitment/presentation/manual-orders/manual-order-start-page.component').then((module) => module.ManualOrderStartPageComponent),
        canActivate: [permissionGuard(PLATFORM_PERMISSIONS.salesWrite)], providers: [...salesCommitmentReferenceProviders, ManualOrderWizardFacade]
      },
      {
        path: 'ops/commercial/manual-orders/new/client', pathMatch: 'full',
        loadComponent: () => import('./salescommitment/presentation/manual-orders/manual-order-start-page.component').then((module) => module.ManualOrderStartPageComponent),
        canActivate: [permissionGuard(PLATFORM_PERMISSIONS.salesWrite), createManualOrderDraftGuard], providers: [...salesCommitmentReferenceProviders, ManualOrderWizardFacade]
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
        loadComponent: () => import('./salescommitment/presentation/manual-orders/manual-order-client-page.component').then((module) => module.ManualOrderClientPageComponent),
        canActivate: [permissionGuard(PLATFORM_PERMISSIONS.salesWrite), manualOrderStepGuard], providers: [...salesCommitmentReferenceProviders, ManualOrderWizardFacade]
      },
      {
        path: 'ops/commercial/manual-orders/:draftId/items', data: { manualOrderStep: 'items' },
        loadComponent: () => import('./salescommitment/presentation/manual-orders/manual-order-items-page.component').then((module) => module.ManualOrderItemsPageComponent),
        canActivate: [permissionGuard(PLATFORM_PERMISSIONS.salesWrite), manualOrderStepGuard], providers: [...salesCommitmentReferenceProviders, ManualOrderWizardFacade]
      },
      {
        path: 'ops/commercial/manual-orders/:draftId/delivery', data: { manualOrderStep: 'delivery' },
        loadComponent: () => import('./salescommitment/presentation/manual-orders/manual-order-delivery-page.component').then((module) => module.ManualOrderDeliveryPageComponent),
        canActivate: [permissionGuard(PLATFORM_PERMISSIONS.salesWrite), manualOrderStepGuard], providers: [...salesCommitmentReferenceProviders, ManualOrderWizardFacade]
      },
      {
        path: 'ops/commercial/manual-orders/:draftId/review', data: { manualOrderStep: 'review' },
        loadComponent: () => import('./salescommitment/presentation/manual-orders/manual-order-review-page.component').then((module) => module.ManualOrderReviewPageComponent),
        canActivate: [permissionGuard(PLATFORM_PERMISSIONS.salesWrite), manualOrderStepGuard], providers: [...salesCommitmentReferenceProviders, ManualOrderWizardFacade]
      },
      {
        path: 'ops/commercial/purchase-requests',
        loadComponent: () => import('./salescommitment/presentation/purchase-requests/purchase-request-inbox-page.component').then((module) => module.PurchaseRequestInboxPageComponent),
        canActivate: [permissionGuard(PLATFORM_PERMISSIONS.salesRead)], providers: [...salesCommitmentReferenceProviders, PurchaseRequestOperationsFacade]
      },
      {
        path: 'ops/commercial/purchase-requests/:purchaseRequestId',
        loadComponent: () => import('./salescommitment/presentation/purchase-requests/purchase-request-detail-page.component').then((module) => module.PurchaseRequestDetailPageComponent),
        canActivate: [permissionGuard(PLATFORM_PERMISSIONS.salesRead)], providers: [...salesCommitmentReferenceProviders, PurchaseRequestOperationsFacade]
      },
      {
        path: 'ops/commercial/sales-orders',
        loadComponent: () => import('./salescommitment/presentation/sales-orders/sales-orders-page.component').then((module) => module.SalesOrdersPageComponent),
        canActivate: [permissionGuard(PLATFORM_PERMISSIONS.salesRead)], providers: [...salesCommitmentProviders, SalesOrdersFacade]
      },
      {
        path: 'ops/commercial/sales-orders/:salesOrderId',
        loadComponent: () => import('./salescommitment/presentation/sales-orders/sales-order-detail-page.component').then((module) => module.SalesOrderDetailPageComponent),
        canActivate: [permissionGuard(PLATFORM_PERMISSIONS.salesRead)], providers: [...salesCommitmentProviders, SalesOrdersFacade]
      },
      { path: 'ops/commercial/purchase-orders', pathMatch: 'full', redirectTo: 'ops/commercial/sales-orders' },
      { path: 'ops/commercial/purchase-orders/:salesOrderId', redirectTo: dynamicRedirect('/ops/commercial/sales-orders', 'salesOrderId') },
      {
        path: 'ops/fulfillment/readiness',
        pathMatch: 'full',
        redirectTo: 'ops/operations/fulfillment-readiness'
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
