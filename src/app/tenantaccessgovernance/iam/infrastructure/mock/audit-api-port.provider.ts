import { inject, Provider } from '@angular/core';
import { PLATFORM_RUNTIME_CONFIG } from '../../../../core/security/runtime-config';
import { AuditApiPort } from '../../domain/ports/audit-api.port';
import { AuditApiService } from '../audit-api.service';
import { MockAuditApiService } from './mock-audit-api.service';

export const auditApiPortProvider: Provider = { provide: AuditApiPort, useFactory: () => inject(PLATFORM_RUNTIME_CONFIG).dataMode === 'mock' ? inject(MockAuditApiService) : inject(AuditApiService) };
