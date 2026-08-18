import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PLATFORM_RUNTIME_CONFIG, platformApiUrl } from '../../core/security/runtime-config';
import { ApiPage, BusinessDocument, BusinessDocumentEvent, EvidenceObject, GenerationRequest } from '../domain/business-document.models';

@Injectable({ providedIn: 'root' })
export class BusinessDocumentsApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(PLATFORM_RUNTIME_CONFIG);

  private api(path: string): string { return platformApiUrl(this.config, `/api/v1${path}`); }
  private idempotency(key?: string): HttpHeaders { return new HttpHeaders({ 'Idempotency-Key': key?.trim() || crypto.randomUUID() }); }

  list(page = 0, size = 25, status?: string): Observable<ApiPage<BusinessDocument>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (status) params = params.set('status', status);
    return this.http.get<ApiPage<BusinessDocument>>(this.api('/business-documents'), { params });
  }

  requestGeneration(command: { subjectType: string; subjectId: string; documentType: string; format: 'PDF' | 'CSV' | 'XML' }, key?: string): Observable<GenerationRequest> {
    return this.http.post<GenerationRequest>(this.api('/business-document-generation-requests'), command, { headers: this.idempotency(key) });
  }

  get(id: string): Observable<BusinessDocument> { return this.http.get<BusinessDocument>(this.api(`/business-documents/${encodeURIComponent(id)}`)); }
  events(id: string): Observable<readonly BusinessDocumentEvent[]> { return this.http.get<readonly BusinessDocumentEvent[]>(this.api(`/business-documents/${encodeURIComponent(id)}/events`)); }
  regenerate(id: string, key?: string): Observable<GenerationRequest> { return this.http.post<GenerationRequest>(this.api(`/business-documents/${encodeURIComponent(id)}/regenerations`), {}, { headers: this.idempotency(key) }); }

  download(id: string): Observable<HttpResponse<Blob>> {
    return this.http.get(this.api(`/business-documents/${encodeURIComponent(id)}/downloads`), { observe: 'response', responseType: 'blob' });
  }

  listEvidence(page = 0, size = 25, subjectType?: string, subjectId?: string): Observable<ApiPage<EvidenceObject>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (subjectType) params = params.set('subjectType', subjectType);
    if (subjectId) params = params.set('subjectId', subjectId);
    return this.http.get<ApiPage<EvidenceObject>>(this.api('/business-document-evidence'), { params });
  }

  requestEvidence(command: { subjectType: string; subjectId: string; originalFilename: string; declaredContentType: string }, key?: string): Observable<EvidenceObject> {
    return this.http.post<EvidenceObject>(this.api('/business-document-evidence/requests'), command, { headers: this.idempotency(key) });
  }

  completeEvidence(id: string, file: File, key?: string): Observable<EvidenceObject> {
    const body = new FormData();
    body.append('file', file, file.name);
    return this.http.put<EvidenceObject>(this.api(`/business-document-evidence/${encodeURIComponent(id)}/content`), body, { headers: this.idempotency(key) });
  }

  downloadEvidence(id: string): Observable<HttpResponse<Blob>> {
    return this.http.get(this.api(`/business-document-evidence/${encodeURIComponent(id)}/downloads`), { observe: 'response', responseType: 'blob' });
  }
}
