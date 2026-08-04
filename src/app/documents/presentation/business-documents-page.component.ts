import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { PageHeaderComponent } from '../../shared/presentation/components/page-header/page-header.component';
import { LoadingStateComponent } from '../../shared/presentation/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../shared/presentation/components/error-state/error-state.component';
import { BusinessDocumentsApiService } from '../infrastructure/business-documents-api.service';
import { BusinessDocument, EvidenceObject } from '../domain/business-document.models';

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
        <table>
          <thead><tr><th>Reference</th><th>Type</th><th>Format</th><th>Status</th><th>Generated</th><th>Action</th></tr></thead>
          <tbody>
            @for (document of documents(); track document.id) {
              <tr><td>{{ document.documentNumber || document.subjectId }}</td><td>{{ document.documentType }}</td><td>{{ document.format }}</td><td>{{ document.status }}</td><td>{{ document.generatedAt || '—' }}</td><td><button type="button" [disabled]="document.status !== 'GENERATED'" (click)="download(document)">Download</button></td></tr>
            } @empty { <tr><td colspan="6">No business documents.</td></tr> }
          </tbody>
        </table>
        <h2>Evidence</h2>
        <table>
          <thead><tr><th>File</th><th>Subject</th><th>Lifecycle</th><th>Detected type</th><th>Action</th></tr></thead>
          <tbody>
            @for (evidence of evidence(); track evidence.id) {
              <tr><td>{{ evidence.originalFilename }}</td><td>{{ evidence.subjectType }} / {{ evidence.subjectId }}</td><td>{{ evidence.lifecycleStatus }}</td><td>{{ evidence.detectedContentType || '—' }}</td><td><button type="button" [disabled]="evidence.lifecycleStatus !== 'AVAILABLE'" (click)="downloadEvidence(evidence)">Download</button></td></tr>
            } @empty { <tr><td colspan="5">No evidence.</td></tr> }
          </tbody>
        </table>
      }
    </section>
  `,
  styles: [`:host{display:block}.page{display:grid;gap:1rem}table{width:100%;border-collapse:collapse}th,td{padding:.65rem;text-align:left;border-bottom:1px solid #dbe3ee;vertical-align:top}button{padding:.4rem .7rem}`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BusinessDocumentsPageComponent {
  private readonly api = inject(BusinessDocumentsApiService);
  readonly documents = signal<readonly BusinessDocument[]>([]);
  readonly evidence = signal<readonly EvidenceObject[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  constructor() { this.load(); }

  load(): void {
    this.loading.set(true); this.error.set(null);
    forkJoin({ documents: this.api.list(), evidence: this.api.listEvidence() }).subscribe({ next: (value) => { this.documents.set(value.documents.items); this.evidence.set(value.evidence.items); this.loading.set(false); }, error: () => { this.error.set('The document service did not respond.'); this.loading.set(false); } });
  }

  download(document: BusinessDocument): void {
    if (document.status !== 'GENERATED') return;
    this.api.download(document.id).subscribe({ next: (response) => this.save(response.body, document.documentNumber || document.id, document.format.toLowerCase()), error: () => this.error.set('The document download failed.') });
  }

  downloadEvidence(evidence: EvidenceObject): void {
    if (evidence.lifecycleStatus !== 'AVAILABLE') return;
    this.api.downloadEvidence(evidence.id).subscribe({ next: (response) => this.save(response.body, evidence.originalFilename, ''), error: () => this.error.set('The evidence download failed.') });
  }

  private save(blob: Blob | null, name: string, extension: string): void {
    if (!blob) return;
    const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = extension ? `${name}.${extension}` : name; anchor.click(); URL.revokeObjectURL(url);
  }
}
