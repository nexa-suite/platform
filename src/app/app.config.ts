import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

import { routes } from './app.routes';
import { bearerInterceptor } from './core/security/bearer.interceptor';
import { platformRuntimeConfigFactory, PLATFORM_RUNTIME_CONFIG } from './core/security/runtime-config';
import { CHANGE_FEED_PORT } from './core/change-feed/application/change-feed.port';
import { ChangeFeedClient } from './core/change-feed/infrastructure/change-feed.service';
import { refreshInterceptor } from './core/security/refresh.interceptor';
import { PlatformAuthenticationBoundary } from './core/security/platform-authentication.boundary';
import { AuthApiPort } from './tenantaccessgovernance/iam/domain/ports/auth-api.port';
import { AccessTokenPort } from './tenantaccessgovernance/iam/domain/ports/access-token.port';
import { SecurityApiPort } from './tenantaccessgovernance/iam/domain/ports/security-api.port';
import { AuditApiPort } from './tenantaccessgovernance/iam/domain/ports/audit-api.port';
import { CompanyAdministrationApiPort } from './tenantaccessgovernance/tenantmanagement/domain/ports/company-administration-api.port';
import { AuthApiService } from './tenantaccessgovernance/iam/infrastructure/http/auth-api.service';
import { AccessTokenStore } from './tenantaccessgovernance/iam/infrastructure/token/access-token.store';
import { SecurityApiService } from './tenantaccessgovernance/iam/infrastructure/security-api.service';
import { AuditApiService } from './tenantaccessgovernance/iam/infrastructure/audit-api.service';
import { CompanyAdministrationApiService } from './tenantaccessgovernance/tenantmanagement/infrastructure/http/company-administration-api.service';
import { CustomerRelationshipsApiPort } from './customerbuyerrelationships/domain/ports/customer-relationships-api.port';
import { CustomerRelationshipsApiService } from './customerbuyerrelationships/infrastructure/http/customer-relationships-api.service';
import { CatalogApiPort } from './catalogcommercialpolicy/domain/ports/catalog-api.port';
import { CatalogManagementApiPort } from './catalogcommercialpolicy/domain/ports/catalog-management-api.port';
import { CatalogPromotionTargetsPort } from './catalogcommercialpolicy/domain/ports/catalog-promotion-targets.port';
import { CatalogApiService } from './catalogcommercialpolicy/infrastructure/http/catalog-api.service';
import { CatalogManagementApiService } from './catalogcommercialpolicy/infrastructure/http/catalog-management-api.service';
import { CatalogPromotionTargetsGateway } from './catalogcommercialpolicy/infrastructure/http/catalog-promotion-targets.gateway';
import { SalesCommitmentCatalogPort, SalesCommitmentCustomerPort } from './salescommitment/domain/ports/sales-commitment-cross-context.ports';
import { SalesCommitmentApiPort } from './salescommitment/domain/ports/sales-commitment-api.port';
import { SalesCommitmentCatalogGateway } from './salescommitment/infrastructure/catalog/sales-commitment-catalog.gateway';
import { SalesCommitmentCustomerGateway } from './salescommitment/infrastructure/customer/sales-commitment-customer.gateway';
import { SalesCommitmentApiService } from './salescommitment/infrastructure/http/sales-commitment-api.service';
import { InventoryCatalogPort, SalesOrderVersionPort } from './inventoryavailability/domain/ports/inventory-cross-context.ports';
import { InventoryCatalogGateway } from './inventoryavailability/infrastructure/catalog/inventory-catalog.gateway';
import { SalesOrderVersionGateway } from './inventoryavailability/infrastructure/sales/sales-order-version.gateway';
import { LogisticsApiPort } from './fulfillmentdelivery/domain/ports/logistics-api.port';
import { LogisticsApiService } from './fulfillmentdelivery/infrastructure/logistics-api.service';
import { PaymentsApiPort } from './payments/domain/ports/payments-api.port';
import { PaymentsApiService } from './payments/infrastructure/payments-api.service';
import { BusinessDocumentsApiPort } from './businessdocuments/domain/ports/business-documents-api.port';
import { BusinessDocumentsApiService } from './businessdocuments/infrastructure/business-documents-api.service';
import { NotificationsApiPort } from './notifications/domain/ports/notifications-api.port';
import { NotificationsApiService } from './notifications/infrastructure/notifications-api.service';
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
    ChangeFeedClient,
    { provide: CHANGE_FEED_PORT, useExisting: ChangeFeedClient },
    provideHttpClient(withInterceptors([bearerInterceptor, refreshInterceptor])),
    AuthApiService,
    { provide: AuthApiPort, useExisting: AuthApiService },
    { provide: AccessTokenPort, useExisting: AccessTokenStore },
    SecurityApiService,
    { provide: SecurityApiPort, useExisting: SecurityApiService },
    AuditApiService,
    { provide: AuditApiPort, useExisting: AuditApiService },
    CompanyAdministrationApiService,
    { provide: CompanyAdministrationApiPort, useExisting: CompanyAdministrationApiService },
    CustomerRelationshipsApiService,
    { provide: CustomerRelationshipsApiPort, useExisting: CustomerRelationshipsApiService },
    CatalogApiService,
    { provide: CatalogApiPort, useExisting: CatalogApiService },
    CatalogManagementApiService,
    { provide: CatalogManagementApiPort, useExisting: CatalogManagementApiService },
    CatalogPromotionTargetsGateway,
    { provide: CatalogPromotionTargetsPort, useExisting: CatalogPromotionTargetsGateway },
    SalesCommitmentApiService,
    { provide: SalesCommitmentApiPort, useExisting: SalesCommitmentApiService },
    { provide: SalesCommitmentCustomerPort, useExisting: SalesCommitmentCustomerGateway },
    { provide: SalesCommitmentCatalogPort, useExisting: SalesCommitmentCatalogGateway },
    InventoryCatalogGateway,
    { provide: InventoryCatalogPort, useExisting: InventoryCatalogGateway },
    SalesOrderVersionGateway,
    { provide: SalesOrderVersionPort, useExisting: SalesOrderVersionGateway },
    LogisticsApiService,
    { provide: LogisticsApiPort, useExisting: LogisticsApiService },
    PaymentsApiService,
    { provide: PaymentsApiPort, useExisting: PaymentsApiService },
    BusinessDocumentsApiService,
    { provide: BusinessDocumentsApiPort, useExisting: BusinessDocumentsApiService },
    NotificationsApiService,
    { provide: NotificationsApiPort, useExisting: NotificationsApiService },
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
