import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AuditEvent } from '../domain/audit.models';
import { AuditApiPort } from '../domain/ports/audit-api.port';

/** Application facade for the IAM-owned audit viewer. */
@Injectable({ providedIn: 'root' })
export class AuditFacade {
  private readonly api = inject(AuditApiPort);

  list(limit?: number): Observable<readonly AuditEvent[]> { return this.api.list(limit); }
  detail(id: string): Observable<AuditEvent> { return this.api.detail(id); }
}
