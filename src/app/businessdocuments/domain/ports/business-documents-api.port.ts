import { Observable } from 'rxjs';
import { ApiPage, BusinessDocument, BusinessDocumentEvent, EvidenceObject, GenerationRequest } from '../business-document.models';

/** Business-document application port; HTTP response details stay in infrastructure. */
export abstract class BusinessDocumentsApiPort {
  abstract list(page?: number, size?: number, status?: string): Observable<ApiPage<BusinessDocument>>;
  abstract requestGeneration(command: { subjectType: string; subjectId: string; documentType: string; format: 'PDF' | 'CSV' | 'XML' }, key?: string): Observable<GenerationRequest>;
  abstract get(id: string): Observable<BusinessDocument>;
  abstract events(id: string): Observable<readonly BusinessDocumentEvent[]>;
  abstract regenerate(id: string, key?: string): Observable<GenerationRequest>;
  abstract download(id: string): Observable<Blob | null>;
  abstract listEvidence(page?: number, size?: number, subjectType?: string, subjectId?: string): Observable<ApiPage<EvidenceObject>>;
  abstract requestEvidence(command: { subjectType: string; subjectId: string; originalFilename: string; declaredContentType: string }, key?: string): Observable<EvidenceObject>;
  abstract completeEvidence(id: string, file: File, key?: string): Observable<EvidenceObject>;
  abstract downloadEvidence(id: string): Observable<Blob | null>;
}
