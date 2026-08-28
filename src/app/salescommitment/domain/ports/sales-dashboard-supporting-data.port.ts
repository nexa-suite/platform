import { Observable } from 'rxjs';

/** Small read model exposed to the sales dashboard through a context boundary. */
export interface SalesDashboardBusinessDocument {
  readonly id: string;
  readonly clientAccountId: string | null;
  readonly subjectType: string;
  readonly subjectId: string;
  readonly documentType: string;
  readonly documentNumber: string | null;
  readonly status: string;
}

export abstract class SalesDashboardSupportingDataPort {
  abstract pendingBusinessDocuments(): Observable<readonly SalesDashboardBusinessDocument[]>;
}
