import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

import { routes } from './app.routes';
import { bearerInterceptor } from './core/security/bearer.interceptor';
import { platformRuntimeConfigFactory, PLATFORM_RUNTIME_CONFIG } from './core/security/runtime-config';
import { changeFeedPortProvider } from './core/change-feed/infrastructure/mock/change-feed-port.provider';
import { refreshInterceptor } from './core/security/refresh.interceptor';
import { PlatformAuthenticationBoundary } from './core/security/platform-authentication.boundary';
import { AuthApiPort } from './tenantaccessgovernance/iam/domain/ports/auth-api.port';
import { AccessTokenPort } from './tenantaccessgovernance/iam/domain/ports/access-token.port';
import { SecurityApiPort } from './tenantaccessgovernance/iam/domain/ports/security-api.port';
import { AuditApiPort } from './tenantaccessgovernance/iam/domain/ports/audit-api.port';
import { CompanyAdministrationApiPort } from './tenantaccessgovernance/tenantmanagement/domain/ports/company-administration-api.port';
import { AuthApiService } from './tenantaccessgovernance/iam/infrastructure/http/auth-api.service';
import { MockAuthApiService } from './tenantaccessgovernance/iam/infrastructure/mock/mock-auth-api.service';
import { authApiPortProvider } from './tenantaccessgovernance/iam/infrastructure/mock/auth-api-port.provider';
import { AccessTokenStore } from './tenantaccessgovernance/iam/infrastructure/token/access-token.store';
import { SecurityApiService } from './tenantaccessgovernance/iam/infrastructure/security-api.service';
import { AuditApiService } from './tenantaccessgovernance/iam/infrastructure/audit-api.service';
import { MockSecurityApiService } from './tenantaccessgovernance/iam/infrastructure/mock/mock-security-api.service';
import { MockAuditApiService } from './tenantaccessgovernance/iam/infrastructure/mock/mock-audit-api.service';
import { securityApiPortProvider } from './tenantaccessgovernance/iam/infrastructure/mock/security-api-port.provider';
import { auditApiPortProvider } from './tenantaccessgovernance/iam/infrastructure/mock/audit-api-port.provider';
import { CompanyAdministrationApiService } from './tenantaccessgovernance/tenantmanagement/infrastructure/http/company-administration-api.service';
import { MockCompanyAdministrationApiService } from './tenantaccessgovernance/tenantmanagement/infrastructure/mock/mock-company-administration-api.service';
import { companyAdministrationApiPortProvider } from './tenantaccessgovernance/tenantmanagement/infrastructure/mock/company-administration-api-port.provider';
import { CustomerRelationshipsApiPort } from './customerbuyerrelationships/domain/ports/customer-relationships-api.port';
import { CustomerRelationshipsApiService } from './customerbuyerrelationships/infrastructure/http/customer-relationships-api.service';
import { MockCustomerRelationshipsApiService } from './customerbuyerrelationships/infrastructure/mock/mock-customer-relationships-api.service';
import { customerRelationshipsApiPortProvider } from './customerbuyerrelationships/infrastructure/mock/customer-relationships-api-port.provider';
import { CatalogApiPort } from './catalogcommercialpolicy/domain/ports/catalog-api.port';
import { CatalogManagementApiPort } from './catalogcommercialpolicy/domain/ports/catalog-management-api.port';
import { CatalogPromotionTargetsPort } from './catalogcommercialpolicy/domain/ports/catalog-promotion-targets.port';
import { CatalogApiService } from './catalogcommercialpolicy/infrastructure/http/catalog-api.service';
import { MockCatalogApiService } from './catalogcommercialpolicy/infrastructure/mock/mock-catalog-api.service';
import { catalogApiPortProvider } from './catalogcommercialpolicy/infrastructure/mock/catalog-api-port.provider';
import { CatalogManagementApiService } from './catalogcommercialpolicy/infrastructure/http/catalog-management-api.service';
import { MockCatalogManagementApiService } from './catalogcommercialpolicy/infrastructure/mock/mock-catalog-management-api.service';
import { catalogManagementApiPortProvider } from './catalogcommercialpolicy/infrastructure/mock/catalog-management-api-port.provider';
import { CatalogPromotionTargetsGateway } from './catalogcommercialpolicy/infrastructure/http/catalog-promotion-targets.gateway';
import { MockCatalogPromotionTargetsGateway } from './catalogcommercialpolicy/infrastructure/mock/mock-catalog-promotion-targets.gateway';
import { catalogPromotionTargetsPortProvider } from './catalogcommercialpolicy/infrastructure/mock/catalog-promotion-targets-port.provider';
import { SalesCommitmentCatalogPort, SalesCommitmentCustomerPort } from './salescommitment/domain/ports/sales-commitment-cross-context.ports';
import { SalesCommitmentCatalogGateway } from './salescommitment/infrastructure/catalog/sales-commitment-catalog.gateway';
import { SalesCommitmentCustomerGateway } from './salescommitment/infrastructure/customer/sales-commitment-customer.gateway';
import { SalesCommitmentApiService } from './salescommitment/infrastructure/http/sales-commitment-api.service';
import { MockSalesCommitmentApiService } from './salescommitment/infrastructure/mock/mock-sales-commitment-api.service';
import { salesCommitmentApiPortProvider } from './salescommitment/infrastructure/mock/sales-commitment-api-port.provider';
import { InventoryCatalogPort, SalesOrderVersionPort } from './inventoryavailability/domain/ports/inventory-cross-context.ports';
import { InventoryCatalogGateway } from './inventoryavailability/infrastructure/catalog/inventory-catalog.gateway';
import { SalesOrderVersionGateway } from './inventoryavailability/infrastructure/sales/sales-order-version.gateway';
import { MockInventoryCatalogGateway, MockSalesOrderVersionGateway } from './inventoryavailability/infrastructure/mock/mock-inventory-cross-context';
import { inventoryCatalogPortProvider, salesOrderVersionPortProvider } from './inventoryavailability/infrastructure/mock/inventory-cross-context.providers';
import { LogisticsApiPort } from './fulfillmentdelivery/domain/ports/logistics-api.port';
import { LogisticsApiService } from './fulfillmentdelivery/infrastructure/logistics-api.service';
import { MockLogisticsApiService } from './fulfillmentdelivery/infrastructure/mock/mock-logistics-api.service';
import { logisticsApiPortProvider } from './fulfillmentdelivery/infrastructure/mock/logistics-api-port.provider';
import { PaymentsApiPort } from './payments/domain/ports/payments-api.port';
import { PaymentsApiService } from './payments/infrastructure/payments-api.service';
import { MockPaymentsApiService } from './payments/infrastructure/mock/mock-payments-api.service';
import { paymentsApiPortProvider } from './payments/infrastructure/mock/payments-api-port.provider';
import { BusinessDocumentsApiPort } from './businessdocuments/domain/ports/business-documents-api.port';
import { BusinessDocumentsApiService } from './businessdocuments/infrastructure/business-documents-api.service';
import { MockBusinessDocumentsApiService } from './businessdocuments/infrastructure/mock/mock-business-documents-api.service';
import { businessDocumentsApiPortProvider } from './businessdocuments/infrastructure/mock/business-documents-api-port.provider';
import { NotificationsApiPort } from './notifications/domain/ports/notifications-api.port';
import { NotificationsApiService } from './notifications/infrastructure/notifications-api.service';
import { MockNotificationsApiService } from './notifications/infrastructure/mock/mock-notifications-api.service';
import { notificationsApiPortProvider } from './notifications/infrastructure/mock/notifications-api-port.provider';
import { ManualOrderCartPort } from './salescommitment/application/ports/manual-order-cart.port';
import { ManualOrderCartStoragePort } from './salescommitment/application/ports/manual-order-cart-storage.port';
import { ManualOrderCartService } from './salescommitment/application/manual-orders/manual-order-cart.service';
import { BrowserManualOrderCartStorageAdapter } from './salescommitment/infrastructure/manual-orders/browser-manual-order-cart-storage.adapter';
import { SalesDashboardSupportingDataPort } from './salescommitment/domain/ports/sales-dashboard-supporting-data.port';
import { SalesDashboardSupportingDataGateway } from './salescommitment/infrastructure/dashboard/sales-dashboard-supporting-data.gateway';
import { PlatformNavigationBadgePort } from './core/navigation/platform-navigation-badge.port';
import { SalesNavigationBadgeService } from './salescommitment/application/navigation/sales-navigation-badge.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: PLATFORM_RUNTIME_CONFIG, useFactory: platformRuntimeConfigFactory },
    changeFeedPortProvider,
    provideHttpClient(withInterceptors([bearerInterceptor, refreshInterceptor])),
    AuthApiService,
    MockAuthApiService,
    authApiPortProvider,
    { provide: AccessTokenPort, useExisting: AccessTokenStore },
    SecurityApiService,
    MockSecurityApiService,
    securityApiPortProvider,
    AuditApiService,
    MockAuditApiService,
    auditApiPortProvider,
    CompanyAdministrationApiService,
    MockCompanyAdministrationApiService,
    companyAdministrationApiPortProvider,
    CustomerRelationshipsApiService,
    MockCustomerRelationshipsApiService,
    customerRelationshipsApiPortProvider,
    CatalogApiService,
    MockCatalogApiService,
    catalogApiPortProvider,
    CatalogManagementApiService,
    MockCatalogManagementApiService,
    catalogManagementApiPortProvider,
    CatalogPromotionTargetsGateway,
    MockCatalogPromotionTargetsGateway,
    catalogPromotionTargetsPortProvider,
    SalesCommitmentApiService,
    MockSalesCommitmentApiService,
    salesCommitmentApiPortProvider,
    { provide: SalesCommitmentCustomerPort, useExisting: SalesCommitmentCustomerGateway },
    { provide: SalesCommitmentCatalogPort, useExisting: SalesCommitmentCatalogGateway },
    InventoryCatalogGateway,
    MockInventoryCatalogGateway,
    inventoryCatalogPortProvider,
    SalesOrderVersionGateway,
    MockSalesOrderVersionGateway,
    salesOrderVersionPortProvider,
    LogisticsApiService,
    MockLogisticsApiService,
    logisticsApiPortProvider,
    PaymentsApiService,
    MockPaymentsApiService,
    paymentsApiPortProvider,
    BusinessDocumentsApiService,
    MockBusinessDocumentsApiService,
    businessDocumentsApiPortProvider,
    NotificationsApiService,
    MockNotificationsApiService,
    notificationsApiPortProvider,
    ManualOrderCartService,
    BrowserManualOrderCartStorageAdapter,
    { provide: ManualOrderCartPort, useExisting: ManualOrderCartService },
    { provide: ManualOrderCartStoragePort, useExisting: BrowserManualOrderCartStorageAdapter },
    { provide: SalesDashboardSupportingDataPort, useExisting: SalesDashboardSupportingDataGateway },
    { provide: PlatformNavigationBadgePort, useExisting: SalesNavigationBadgeService },
    provideRouter(routes, withComponentInputBinding()),
    provideAppInitializer(() => inject(PlatformAuthenticationBoundary).restore()),
    provideTranslateService({
      fallbackLang: 'en',
      lang: 'en',
      loader: provideTranslateHttpLoader({ prefix: './assets/i18n/', suffix: '.json?v=0.7.1' })
    })
  ]
};
