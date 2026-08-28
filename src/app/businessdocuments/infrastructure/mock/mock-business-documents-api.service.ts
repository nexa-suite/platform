import { inject, Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { PLATFORM_RUNTIME_CONFIG } from '../../../core/security/runtime-config';
import { ApiPage, BusinessDocument, BusinessDocumentEvent, EvidenceObject, GenerationRequest } from '../../domain/business-document.models';
import { BusinessDocumentsApiPort } from '../../domain/ports/business-documents-api.port';
import { MOCK_BUSINESS_DOCUMENT_FIXTURES } from './mock-business-documents.fixtures';

const DEMO_NOW = '2026-08-26T10:00:00Z';

/** BC-09 in-memory adapter for document generation and evidence lifecycle demos. */
@Injectable({ providedIn: 'root' })
export class MockBusinessDocumentsApiService extends BusinessDocumentsApiPort {
  private readonly config = inject(PLATFORM_RUNTIME_CONFIG);
  private readonly seed = MOCK_BUSINESS_DOCUMENT_FIXTURES[this.config.tenantProfile];
  private readonly documents = new Map(this.seed.documents.map((item) => [item.id, item]));
  private readonly eventStore = new Map(this.seed.documents.map((item) => [item.id, this.seed.events.filter((event) => event.eventId.startsWith(item.id))]));
  private readonly evidence = new Map(this.seed.evidence.map((item) => [item.id, item]));
  private nextDocument = this.documents.size + 1;
  private nextEvidence = this.evidence.size + 1;
  private nextRequest = 1;

  list(page = 0, size = 25, status?: string): Observable<ApiPage<BusinessDocument>> {
    const values = [...this.documents.values()].filter((item) => !status || item.status === status);
    return of(this.page(values.slice(page * size, page * size + size), page, size, values.length));
  }
  requestGeneration(command: { subjectType: string; subjectId: string; documentType: string; format: 'PDF' | 'CSV' | 'XML' }): Observable<GenerationRequest> {
    const id = `${this.config.tenantProfile}-document-${String(this.nextDocument++).padStart(3, '0')}`;
    const document: BusinessDocument = { id, clientAccountId: `${this.config.tenantProfile}-client-001`, subjectType: command.subjectType, subjectId: command.subjectId, documentType: command.documentType, documentNumber: `DOC-${this.config.tenantProfile.toUpperCase()}-${String(this.nextDocument - 1).padStart(3, '0')}`, version: 1, status: 'GENERATED', format: command.format, contentType: command.format === 'PDF' ? 'application/pdf' : command.format === 'CSV' ? 'text/csv' : 'application/xml', checksumSha256: null, byteSize: 128, generatedAt: DEMO_NOW, failureCode: null, failureDetail: null };
    this.documents.set(id, document); this.eventStore.set(id, [{ eventId: `${id}-event-001`, eventType: 'DOCUMENT_GENERATED', status: 'GENERATED', occurredAt: DEMO_NOW, processedAt: DEMO_NOW, attemptCount: 1 }]);
    return of({ id: `${this.config.tenantProfile}-generation-${String(this.nextRequest++).padStart(3, '0')}`, documentId: id, subjectType: command.subjectType, subjectId: command.subjectId, documentType: command.documentType, format: command.format, status: 'COMPLETED', requestedAt: DEMO_NOW, completedAt: DEMO_NOW });
  }
  get(id: string): Observable<BusinessDocument> { return this.required(this.documents.get(id), 'MOCK_DOCUMENT_NOT_FOUND'); }
  events(id: string): Observable<readonly BusinessDocumentEvent[]> { return of(this.eventStore.get(id) ?? []); }
  regenerate(id: string): Observable<GenerationRequest> {
    const current = this.documents.get(id); if (!current) return throwError(() => new Error('MOCK_DOCUMENT_NOT_FOUND'));
    const updated = { ...current, version: current.version + 1, status: 'GENERATED', generatedAt: DEMO_NOW, byteSize: 128 }; this.documents.set(id, updated); this.eventStore.set(id, [...(this.eventStore.get(id) ?? []), { eventId: `${id}-event-${updated.version}`, eventType: 'DOCUMENT_REGENERATED', status: updated.status, occurredAt: DEMO_NOW, processedAt: DEMO_NOW, attemptCount: 1 }]);
    return of({ id: `${this.config.tenantProfile}-regeneration-${String(this.nextRequest++).padStart(3, '0')}`, documentId: id, subjectType: updated.subjectType, subjectId: updated.subjectId, documentType: updated.documentType, format: updated.format, status: 'COMPLETED', requestedAt: DEMO_NOW, completedAt: DEMO_NOW });
  }
  download(id: string): Observable<Blob | null> { return this.documents.has(id) ? of(new Blob([`Nexa demo document ${id}`], { type: 'application/pdf' })) : throwError(() => new Error('MOCK_DOCUMENT_NOT_FOUND')); }
  listEvidence(page = 0, size = 25, subjectType?: string, subjectId?: string): Observable<ApiPage<EvidenceObject>> {
    const values = [...this.evidence.values()].filter((item) => (!subjectType || item.subjectType === subjectType) && (!subjectId || item.subjectId === subjectId));
    return of(this.page(values.slice(page * size, page * size + size), page, size, values.length));
  }
  requestEvidence(command: { subjectType: string; subjectId: string; originalFilename: string; declaredContentType: string }): Observable<EvidenceObject> {
    const id = `${this.config.tenantProfile}-evidence-${String(this.nextEvidence++).padStart(3, '0')}`;
    const value: EvidenceObject = { id, subjectType: command.subjectType, subjectId: command.subjectId, lifecycleStatus: 'REQUESTED', detectedContentType: null, declaredContentType: command.declaredContentType, originalFilename: command.originalFilename, checksumSha256: null, byteSize: 0, createdAt: DEMO_NOW, scannedAt: null, failureCode: null, updatedAt: DEMO_NOW }; this.evidence.set(id, value); return of(value);
  }
  completeEvidence(id: string, file: File): Observable<EvidenceObject> {
    const current = this.evidence.get(id); if (!current) return throwError(() => new Error('MOCK_EVIDENCE_NOT_FOUND'));
    const updated: EvidenceObject = { ...current, lifecycleStatus: 'AVAILABLE', detectedContentType: file.type || current.declaredContentType, byteSize: file.size, scannedAt: DEMO_NOW, updatedAt: DEMO_NOW }; this.evidence.set(id, updated); return of(updated);
  }
  downloadEvidence(id: string): Observable<Blob | null> { const item = this.evidence.get(id); return item ? of(new Blob([`Nexa demo evidence ${item.originalFilename}`], { type: item.detectedContentType ?? item.declaredContentType })) : throwError(() => new Error('MOCK_EVIDENCE_NOT_FOUND')); }
  private page<T>(items: readonly T[], page: number, size: number, total: number): ApiPage<T> { return { items, page, size, total }; }
  private required<T>(value: T | undefined, message: string): Observable<T> { return value === undefined ? throwError(() => new Error(message)) : of(value); }
}
