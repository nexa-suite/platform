import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

import { routes } from './app.routes';
import { bearerInterceptor } from './core/security/bearer.interceptor';
import { platformRuntimeConfigFactory, PLATFORM_RUNTIME_CONFIG } from './core/security/runtime-config';
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
import { SalesCommitmentCatalogGateway } from './salescommitment/infrastructure/catalog/sales-commitment-catalog.gateway';
import { SalesCommitmentCustomerGateway } from './salescommitment/infrastructure/customer/sales-commitment-customer.gateway';
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

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: PLATFORM_RUNTIME_CONFIG, useFactory: platformRuntimeConfigFactory },
    provideHttpClient(withInterceptors([bearerInterceptor, refreshInterceptor])),
    { provide: AuthApiPort, useExisting: AuthApiService },
    { provide: AccessTokenPort, useExisting: AccessTokenStore },
    { provide: SecurityApiPort, useExisting: SecurityApiService },
    { provide: AuditApiPort, useExisting: AuditApiService },
    { provide: CompanyAdministrationApiPort, useExisting: CompanyAdministrationApiService },
    { provide: CustomerRelationshipsApiPort, useExisting: CustomerRelationshipsApiService },
    { provide: CatalogApiPort, useExisting: CatalogApiService },
    { provide: CatalogManagementApiPort, useExisting: CatalogManagementApiService },
    { provide: CatalogPromotionTargetsPort, useExisting: CatalogPromotionTargetsGateway },
    { provide: SalesCommitmentCustomerPort, useExisting: SalesCommitmentCustomerGateway },
    { provide: SalesCommitmentCatalogPort, useExisting: SalesCommitmentCatalogGateway },
    { provide: InventoryCatalogPort, useExisting: InventoryCatalogGateway },
    { provide: SalesOrderVersionPort, useExisting: SalesOrderVersionGateway },
    { provide: LogisticsApiPort, useExisting: LogisticsApiService },
    { provide: PaymentsApiPort, useExisting: PaymentsApiService },
    { provide: BusinessDocumentsApiPort, useExisting: BusinessDocumentsApiService },
    { provide: NotificationsApiPort, useExisting: NotificationsApiService },
    provideRouter(routes, withComponentInputBinding()),
    provideAppInitializer(() => inject(PlatformAuthenticationBoundary).restore()),
    provideTranslateService({
      fallbackLang: 'en',
      lang: 'en',
      loader: provideTranslateHttpLoader({ prefix: './assets/i18n/', suffix: '.json?v=0.7.1' })
    })
  ]
};
