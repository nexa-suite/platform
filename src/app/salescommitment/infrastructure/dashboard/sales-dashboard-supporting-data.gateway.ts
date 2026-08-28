import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { BusinessDocumentsApiPort } from '../../../businessdocuments/domain/ports/business-documents-api.port';
import { SalesDashboardBusinessDocument, SalesDashboardSupportingDataPort } from '../../domain/ports/sales-dashboard-supporting-data.port';

/** ACL from the sales dashboard to the business-document read capability. */
@Injectable({ providedIn: 'root' })
export class SalesDashboardSupportingDataGateway implements SalesDashboardSupportingDataPort {
  private readonly documents = inject(BusinessDocumentsApiPort);

  pendingBusinessDocuments(): Observable<readonly SalesDashboardBusinessDocument[]> {
    return this.documents.list(0, 25).pipe(
      map((page) => page.items
        .filter((document) => ['PENDING', 'GENERATING', 'OBSERVED', 'FAILED', 'REJECTED'].includes(document.status.toUpperCase()))
        .slice(0, 6)
        .map((document) => ({
          id: document.id,
          clientAccountId: document.clientAccountId,
          subjectType: document.subjectType,
          subjectId: document.subjectId,
          documentType: document.documentType,
          documentNumber: document.documentNumber,
          status: document.status,
        }))
      )
    );
  }
}
