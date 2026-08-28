import { inject, Provider } from '@angular/core';
import { PLATFORM_RUNTIME_CONFIG } from '../../../../core/security/runtime-config';
import { SecurityApiPort } from '../../domain/ports/security-api.port';
import { SecurityApiService } from '../security-api.service';
import { MockSecurityApiService } from './mock-security-api.service';

export const securityApiPortProvider: Provider = { provide: SecurityApiPort, useFactory: () => inject(PLATFORM_RUNTIME_CONFIG).dataMode === 'mock' ? inject(MockSecurityApiService) : inject(SecurityApiService) };
