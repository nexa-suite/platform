import { Observable } from 'rxjs';
import { AuditEvent } from '../audit.models';

/** Audit log port; the viewer does not own the audit HTTP adapter. */
export abstract class AuditApiPort {
  abstract list(limit?: number): Observable<readonly AuditEvent[]>;
  abstract detail(id: string): Observable<AuditEvent>;
}
