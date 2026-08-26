import { Injectable, inject } from '@angular/core';
import { BusinessDocumentsApiPort } from '../domain/ports/business-documents-api.port';

/** Application boundary for the business-document and evidence lifecycle. */
@Injectable({ providedIn: 'root' })
export class BusinessDocumentsFacade {
  private readonly api = inject(BusinessDocumentsApiPort);

  readonly list = (...args: Parameters<BusinessDocumentsApiPort['list']>) => this.api.list(...args);
  readonly requestGeneration = (...args: Parameters<BusinessDocumentsApiPort['requestGeneration']>) => this.api.requestGeneration(...args);
  readonly get = (...args: Parameters<BusinessDocumentsApiPort['get']>) => this.api.get(...args);
  readonly events = (...args: Parameters<BusinessDocumentsApiPort['events']>) => this.api.events(...args);
  readonly regenerate = (...args: Parameters<BusinessDocumentsApiPort['regenerate']>) => this.api.regenerate(...args);
  readonly download = (...args: Parameters<BusinessDocumentsApiPort['download']>) => this.api.download(...args);
  readonly listEvidence = (...args: Parameters<BusinessDocumentsApiPort['listEvidence']>) => this.api.listEvidence(...args);
  readonly requestEvidence = (...args: Parameters<BusinessDocumentsApiPort['requestEvidence']>) => this.api.requestEvidence(...args);
  readonly completeEvidence = (...args: Parameters<BusinessDocumentsApiPort['completeEvidence']>) => this.api.completeEvidence(...args);
  readonly downloadEvidence = (...args: Parameters<BusinessDocumentsApiPort['downloadEvidence']>) => this.api.downloadEvidence(...args);
}
