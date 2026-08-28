import { inject, Provider } from '@angular/core';
import { PLATFORM_RUNTIME_CONFIG } from '../../../../core/security/runtime-config';
import { CompanyAdministrationApiPort } from '../../domain/ports/company-administration-api.port';
import { CompanyAdministrationApiService } from '../http/company-administration-api.service';
import { MockCompanyAdministrationApiService } from './mock-company-administration-api.service';

export const companyAdministrationApiPortProvider: Provider = { provide: CompanyAdministrationApiPort, useFactory: () => inject(PLATFORM_RUNTIME_CONFIG).dataMode === 'mock' ? inject(MockCompanyAdministrationApiService) : inject(CompanyAdministrationApiService) };
