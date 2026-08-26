import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { PLATFORM_RUNTIME_CONFIG, platformApiUrl } from '../../../core/security/runtime-config';
import { AuditApiPort } from '../domain/ports/audit-api.port';
import { AuditEvent } from '../domain/audit.models';

export type { AuditEvent } from '../domain/audit.models';

@Injectable({ providedIn: 'root' })
export class AuditApiService implements AuditApiPort {
  private readonly http = inject(HttpClient);
  private readonly config = inject(PLATFORM_RUNTIME_CONFIG);

  list(limit = 100): Observable<readonly AuditEvent[]> {
    const params = new HttpParams().set('limit', Math.min(100, Math.max(1, limit)));
    return this.http.get<{ readonly items?: readonly Record<string, unknown>[] }>(platformApiUrl(this.config, '/api/v1/audit-logs'), { params }).pipe(
      map((response) => (response.items ?? []).map((item) => ({
        id: String(item['id'] ?? ''), actorMembershipId: item['actorMembershipId'] ? String(item['actorMembershipId']) : null,
        actorWorkArea: String(item['actorWorkArea'] ?? ''), eventType: String(item['eventType'] ?? ''), subjectType: String(item['subjectType'] ?? ''),
        subjectId: item['subjectId'] ? String(item['subjectId']) : null, correlationId: item['correlationId'] ? String(item['correlationId']) : null,
        occurredAt: String(item['occurredAt'] ?? ''), metadata: (item['metadata'] ?? {}) as Readonly<Record<string, unknown>>,
      }))),
    );
  }

  detail(id: string): Observable<AuditEvent> {
    return this.http.get<AuditEvent>(platformApiUrl(this.config, `/api/v1/audit-logs/${encodeURIComponent(id)}`));
  }
}
