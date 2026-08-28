import { inject, Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { PLATFORM_RUNTIME_CONFIG } from '../../../../core/security/runtime-config';
import { AuditEvent } from '../../domain/audit.models';
import { AuditApiPort } from '../../domain/ports/audit-api.port';

/** BC-11 local audit projection for the Platform viewer. */
@Injectable({ providedIn: 'root' })
export class MockAuditApiService implements AuditApiPort {
  private readonly config = inject(PLATFORM_RUNTIME_CONFIG);
  private readonly values: readonly AuditEvent[] = [
    { id: `${this.config.tenantProfile}-audit-001`, actorMembershipId: `mock-${this.config.tenantProfile}-membership`, actorWorkArea: 'PLATFORM', eventType: 'AUTHENTICATED', subjectType: 'SESSION', subjectId: `mock-${this.config.tenantProfile}-session-001`, correlationId: null, occurredAt: '2026-08-26T08:00:00Z', metadata: { mode: 'mock' } },
    { id: `${this.config.tenantProfile}-audit-002`, actorMembershipId: `mock-${this.config.tenantProfile}-membership`, actorWorkArea: 'LOGISTICS', eventType: 'DISPATCH_VIEWED', subjectType: 'DISPATCH_ORDER', subjectId: `${this.config.tenantProfile}-dispatch-002`, correlationId: null, occurredAt: '2026-08-26T09:30:00Z', metadata: { source: 'demo-fixture' } },
  ];
  list(limit = 100): Observable<readonly AuditEvent[]> { return of(this.values.slice(0, limit)); }
  detail(id: string): Observable<AuditEvent> { const value = this.values.find((item) => item.id === id); return value ? of(value) : throwError(() => new Error('MOCK_AUDIT_NOT_FOUND')); }
}
