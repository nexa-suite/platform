import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthenticationService } from '../../iam/application/authentication.service';
import { PageHeaderComponent } from '../../shared/presentation/components/page-header/page-header.component';
import { LoadingStateComponent } from '../../shared/presentation/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../shared/presentation/components/error-state/error-state.component';
import { BusinessDocumentsApiService } from '../infrastructure/business-documents-api.service';
import { BusinessDocument, BusinessDocumentEvent, EvidenceObject, GenerationRequest } from '../domain/business-document.models';

type DocumentFormat = 'PDF' | 'CSV' | 'XML';
type SubjectOption = { readonly key: string; readonly label: string; readonly subjectType: string; readonly subjectId: string };

@Component({
  selector: 'nexa-business-documents-page',
  standalone: true,
  imports: [PageHeaderComponent, LoadingStateComponent, ErrorStateComponent],
  template: `
    <section class="page">
      <nexa-page-header title="Business documents" subtitle="Immutable generated documents and evidence lifecycle" />
      @if (loading()) { <nexa-loading-state /> }
      @else if (error(); as message) { <nexa-error-state title="Documents unavailable" [description]="message" (retry)="load()" /> }
      @else {
        @if (canGenerate()) {
          <section class="action-panel" aria-labelledby="generation-title">
            <h2 id="generation-title">Generate document</h2>
            <p class="hint">Choose a server-backed subject. Internal identifiers are kept out of the form.</p>
            <div class="form-grid">
              <label>Subject<select [value]="generationSubjectKey()" (change)="generationSubjectKey.set($any($event.target).value)">@for (subject of subjectOptions(); track subject.key) { <option [value]="subject.key">{{ subject.label }}</option> } @empty { <option value="">No eligible subjects loaded</option> }</select></label>
              <label>Document type<select [value]="generationDocumentType()" (change)="generationDocumentType.set($any($event.target).value)">@for (type of documentTypes; track type) { <option [value]="type">{{ type }}</option> }</select></label>
              <label>Format<select [value]="generationFormat()" (change)="generationFormat.set($any($event.target).value)">@for (format of formats; track format) { <option [value]="format">{{ format }}</option> }</select></label>
            </div>
            <button type="button" [disabled]="!generationSubjectKey() || saving()" (click)="requestGeneration()">{{ saving() ? 'Requesting…' : 'Request generation' }}</button>
          </section>
        }
        <table>
          <thead><tr><th>Reference</th><th>Type</th><th>Format</th><th>Status</th><th>Generated</th><th>Actions</th></tr></thead>
          <tbody>
            @for (document of documents(); track document.id) {
              <tr><td>{{ document.documentNumber || subjectLabel(document.subjectType, document.subjectId) }}</td><td>{{ document.documentType }}</td><td>{{ document.format }}</td><td>{{ document.status }}</td><td>{{ document.generatedAt || '—' }}</td><td class="actions"><button type="button" (click)="selectDocument(document)">Detail / log</button><button type="button" [disabled]="document.status !== 'GENERATED'" (click)="download(document)">Download</button>@if (canGenerate()) { <button type="button" [disabled]="saving()" (click)="regenerate(document)">Regenerate</button> }</td></tr>
            } @empty { <tr><td colspan="6">No business documents.</td></tr> }
          </tbody>
        </table>
        @if (canUpload()) {
          <section class="action-panel" aria-labelledby="evidence-title">
            <h2 id="evidence-title">Upload evidence</h2>
            <p class="hint">Request a quarantined object, then attach the file for malware scanning.</p>
            <div class="form-grid">
              <label>Subject<select [value]="evidenceSubjectKey()" (change)="evidenceSubjectKey.set($any($event.target).value)">@for (subject of subjectOptions(); track subject.key) { <option [value]="subject.key">{{ subject.label }}</option> } @empty { <option value="">No eligible subjects loaded</option> }</select></label>
              <label>Filename<input [value]="evidenceFilename()" (input)="evidenceFilename.set($any($event.target).value)" placeholder="pod-photo.jpg" /></label>
              <label>Declared type<select [value]="evidenceContentType()" (change)="evidenceContentType.set($any($event.target).value)"><option value="application/pdf">application/pdf</option><option value="image/jpeg">image/jpeg</option><option value="image/png">image/png</option><option value="text/csv">text/csv</option></select></label>
            </div>
            <input #evidenceFile type="file" hidden (change)="completeEvidence($event)" />
            <button type="button" [disabled]="!evidenceSubjectKey() || !evidenceFilename().trim() || saving()" (click)="requestEvidence()">Request upload</button>
            @if (requestedEvidence(); as requested) { <span class="pending-upload">{{ requested.originalFilename }} requested ({{ requested.lifecycleStatus }}). Choose the file to complete it.</span><button type="button" (click)="chooseEvidenceFile()">Choose file</button> }
          </section>
        }
        <h2>Evidence</h2>
        <table>
          <thead><tr><th>File</th><th>Subject</th><th>Lifecycle</th><th>Detected type</th><th>Action</th></tr></thead>
          <tbody>
            @for (evidence of evidence(); track evidence.id) {
              <tr><td>{{ evidence.originalFilename }}</td><td>{{ subjectLabel(evidence.subjectType, evidence.subjectId) }}</td><td>{{ evidence.lifecycleStatus }}</td><td>{{ evidence.detectedContentType || '—' }}</td><td><button type="button" [disabled]="evidence.lifecycleStatus !== 'AVAILABLE'" (click)="downloadEvidence(evidence)">Download</button></td></tr>
            } @empty { <tr><td colspan="5">No evidence.</td></tr> }
          </tbody>
        </table>
        @if (selectedDocument(); as detail) {
          <aside class="detail-panel" aria-labelledby="detail-title">
            <div class="detail-heading"><h2 id="detail-title">{{ detail.documentNumber || detail.documentType }}</h2><button type="button" (click)="selectedDocument.set(null)">Close</button></div>
            <dl><div><dt>Subject</dt><dd>{{ subjectLabel(detail.subjectType, detail.subjectId) }}</dd></div><div><dt>Status</dt><dd>{{ detail.status }}</dd></div><div><dt>Version</dt><dd>{{ detail.version }}</dd></div><div><dt>Checksum</dt><dd>{{ detail.checksumSha256 || '—' }}</dd></div><div><dt>Failure</dt><dd>{{ detail.failureCode || '—' }}{{ detail.failureDetail ? ' · ' + detail.failureDetail : '' }}</dd></div></dl>
            <h3>Lifecycle log</h3>
            @if (detailLoading()) { <p role="status">Loading log…</p> } @else { <ul class="event-list">@for (event of selectedEvents(); track event.eventId) { <li><strong>{{ event.eventType }}</strong><span>{{ event.status }} · {{ event.occurredAt }}</span></li> } @empty { <li>No lifecycle events recorded.</li> }</ul> }
          </aside>
        }
      }
    </section>
  `,
  styles: [`:host{display:block}.page{display:grid;gap:1rem}.action-panel,.detail-panel{display:grid;gap:.75rem;padding:1rem;border:1px solid #dbe3ee;border-radius:.6rem;background:#fff}.form-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.75rem}label{display:grid;gap:.3rem;font-size:.875rem;color:#475569}input,select{width:100%;padding:.55rem;border:1px solid #cbd5e1;border-radius:.4rem;background:#fff;font:inherit}button{padding:.4rem .7rem;border:0;border-radius:.4rem;background:#2166c1;color:#fff;cursor:pointer;font:inherit}button:disabled{opacity:.55;cursor:not-allowed}.hint{margin:0;color:#64748b}.pending-upload{color:#334155}.actions{display:flex;flex-wrap:wrap;gap:.35rem}table{width:100%;border-collapse:collapse}th,td{padding:.65rem;text-align:left;border-bottom:1px solid #dbe3ee;vertical-align:top}.detail-heading{display:flex;justify-content:space-between;align-items:center}.detail-heading h2{margin:0}dl{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.75rem}dt{font-size:.75rem;color:#64748b}dd{margin:.2rem 0 0;overflow-wrap:anywhere}.event-list{display:grid;gap:.5rem;padding:0;margin:0;list-style:none}.event-list li{display:grid;gap:.2rem;padding:.6rem;background:#f8fafc;border-radius:.4rem}.event-list span{color:#64748b;font-size:.875rem}@media(max-width:820px){.form-grid,dl{grid-template-columns:1fr}.actions{flex-direction:column;align-items:flex-start}}`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BusinessDocumentsPageComponent {
  private readonly api = inject(BusinessDocumentsApiService);
  private readonly auth = inject(AuthenticationService);
  private readonly route = inject(ActivatedRoute);
  private readonly evidenceFile = viewChild<ElementRef<HTMLInputElement>>('evidenceFile');
  readonly documents = signal<readonly BusinessDocument[]>([]);
  readonly evidence = signal<readonly EvidenceObject[]>([]);
  readonly loading = signal(false);
  readonly detailLoading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly selectedDocument = signal<BusinessDocument | null>(null);
  readonly selectedEvents = signal<readonly BusinessDocumentEvent[]>([]);
  readonly requestedEvidence = signal<EvidenceObject | null>(null);
  readonly generationSubjectKey = signal('');
  readonly generationDocumentType = signal('ORDER_SUMMARY');
  readonly generationFormat = signal<DocumentFormat>('PDF');
  readonly evidenceSubjectKey = signal('');
  readonly evidenceFilename = signal('');
  readonly evidenceContentType = signal('application/pdf');
  readonly documentTypes = ['ORDER_SUMMARY', 'PURCHASE_REQUEST_SUMMARY', 'COMMERCIAL_INVOICE_DRAFT', 'DELIVERY_GUIDE_DRAFT', 'POD_REPORT', 'INCIDENT_REPORT', 'PAYMENT_RECEIPT'] as const;
  readonly formats: readonly DocumentFormat[] = ['PDF', 'CSV', 'XML'];
  readonly canGenerate = computed(() => this.auth.hasPermission('document:generate'));
  readonly canUpload = computed(() => this.auth.hasPermission('document:upload'));
  readonly subjectOptions = computed<readonly SubjectOption[]>(() => {
    const values = new Map<string, SubjectOption>();
    for (const item of this.documents()) values.set(`${item.subjectType}::${item.subjectId}`, { key: `${item.subjectType}::${item.subjectId}`, label: this.subjectLabel(item.subjectType, item.subjectId), subjectType: item.subjectType, subjectId: item.subjectId });
    for (const item of this.evidence()) values.set(`${item.subjectType}::${item.subjectId}`, { key: `${item.subjectType}::${item.subjectId}`, label: this.subjectLabel(item.subjectType, item.subjectId), subjectType: item.subjectType, subjectId: item.subjectId });
    const routeOrderId = this.route.snapshot.queryParamMap.get('orderId');
    if (routeOrderId) values.set(`SALES_ORDER::${routeOrderId}`, { key: `SALES_ORDER::${routeOrderId}`, label: 'Sales order from route', subjectType: 'SALES_ORDER', subjectId: routeOrderId });
    return [...values.values()];
  });

  constructor() { this.load(); }

  load(): void {
    this.loading.set(true); this.error.set(null);
    forkJoin({ documents: this.api.list(), evidence: this.api.listEvidence() }).subscribe({ next: (value) => { this.documents.set(value.documents.items); this.evidence.set(value.evidence.items); this.ensureSubjectSelection(); this.loading.set(false); }, error: () => { this.error.set('The document service did not respond.'); this.loading.set(false); } });
  }

  requestGeneration(): void {
    const subject = this.subjectOptions().find((item) => item.key === this.generationSubjectKey());
    if (!subject || !this.canGenerate()) return;
    this.saving.set(true); this.api.requestGeneration({ subjectType: subject.subjectType, subjectId: subject.subjectId, documentType: this.generationDocumentType(), format: this.generationFormat() }).subscribe({ next: () => { this.saving.set(false); this.load(); }, error: () => { this.error.set('The document generation request failed.'); this.saving.set(false); } });
  }

  regenerate(document: BusinessDocument): void {
    if (!this.canGenerate()) return;
    this.saving.set(true); this.api.regenerate(document.id).subscribe({ next: () => { this.saving.set(false); this.load(); }, error: () => { this.error.set('The document regeneration request failed.'); this.saving.set(false); } });
  }

  selectDocument(document: BusinessDocument): void {
    this.selectedDocument.set(document); this.selectedEvents.set([]); this.detailLoading.set(true);
    forkJoin({ detail: this.api.get(document.id), events: this.api.events(document.id) }).subscribe({ next: (value) => { this.selectedDocument.set(value.detail); this.selectedEvents.set(value.events); this.detailLoading.set(false); }, error: () => { this.error.set('The document detail or lifecycle log failed.'); this.detailLoading.set(false); } });
  }

  download(document: BusinessDocument): void {
    if (document.status !== 'GENERATED') return;
    this.api.download(document.id).subscribe({ next: (response) => this.save(response.body, document.documentNumber || document.id, document.format.toLowerCase()), error: () => this.error.set('The document download failed.') });
  }

  requestEvidence(): void {
    const subject = this.subjectOptions().find((item) => item.key === this.evidenceSubjectKey());
    if (!subject || !this.canUpload() || !this.evidenceFilename().trim()) return;
    this.saving.set(true); this.api.requestEvidence({ subjectType: subject.subjectType, subjectId: subject.subjectId, originalFilename: this.evidenceFilename().trim(), declaredContentType: this.evidenceContentType() }).subscribe({ next: (value) => { this.requestedEvidence.set(value); this.saving.set(false); this.load(); }, error: () => { this.error.set('The evidence upload request failed.'); this.saving.set(false); } });
  }

  chooseEvidenceFile(): void { this.evidenceFile()?.nativeElement.click(); }

  completeEvidence(event: Event): void {
    const evidence = this.requestedEvidence(); const file = (event.target as HTMLInputElement).files?.[0];
    if (!evidence || !file) return;
    this.saving.set(true); this.api.completeEvidence(evidence.id, file).subscribe({ next: () => { this.requestedEvidence.set(null); this.saving.set(false); this.load(); }, error: () => { this.error.set('The evidence file could not be uploaded.'); this.saving.set(false); } });
  }

  downloadEvidence(evidence: EvidenceObject): void {
    if (evidence.lifecycleStatus !== 'AVAILABLE') return;
    this.api.downloadEvidence(evidence.id).subscribe({ next: (response) => this.save(response.body, evidence.originalFilename, ''), error: () => this.error.set('The evidence download failed.') });
  }

  subjectLabel(type: string, id: string): string { return `${type.replaceAll('_', ' ')} · ${id.slice(0, 8)}`; }

  private ensureSubjectSelection(): void {
    const first = this.subjectOptions()[0]?.key ?? '';
    if (!this.generationSubjectKey() || !this.subjectOptions().some((item) => item.key === this.generationSubjectKey())) this.generationSubjectKey.set(first);
    if (!this.evidenceSubjectKey() || !this.subjectOptions().some((item) => item.key === this.evidenceSubjectKey())) this.evidenceSubjectKey.set(first);
  }

  private save(blob: Blob | null, name: string, extension: string): void {
    if (!blob) return;
    const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = extension ? `${name}.${extension}` : name; anchor.click(); URL.revokeObjectURL(url);
  }
}
