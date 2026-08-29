import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { LanguageService } from '../../core/i18n/language.service';
import { PlatformAuthenticationBoundary } from '../../core/security/platform-authentication.boundary';
import { PLATFORM_PERMISSIONS } from '../../core/security/platform-permissions';
import { ButtonComponent } from '../../shared/presentation/components/button/button.component';
import { EmptyStateComponent } from '../../shared/presentation/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/presentation/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../shared/presentation/components/loading-state/loading-state.component';
import { MetricCardComponent } from '../../shared/presentation/components/metric-card/metric-card.component';
import { NexaIconComponent } from '../../shared/presentation/components/nexa-icon/nexa-icon.component';
import { PageHeaderComponent } from '../../shared/presentation/components/page-header/page-header.component';
import { SectionPanelComponent } from '../../shared/presentation/components/section-panel/section-panel.component';
import { SegmentedControlComponent, type NexaSegmentOption } from '../../shared/presentation/components/segmented-control/segmented-control.component';
import { StatusBadgeComponent, type StatusTone } from '../../shared/presentation/components/status-badge/status-badge.component';
import { BusinessDocumentsFacade } from '../application/business-documents.facade';
import { BusinessDocument, BusinessDocumentEvent, EvidenceObject } from '../domain/business-document.models';

type DocumentFormat = 'PDF' | 'CSV' | 'XML';
type SubjectOption = { readonly key: string; readonly label: string; readonly subjectType: string; readonly subjectId: string };

@Component({
  selector: 'nexa-business-documents-page',
  standalone: true,
  imports: [
    ButtonComponent,
    DatePipe,
    EmptyStateComponent,
    ErrorStateComponent,
    LoadingStateComponent,
    MetricCardComponent,
    NexaIconComponent,
    PageHeaderComponent,
    SectionPanelComponent,
    SegmentedControlComponent,
    StatusBadgeComponent,
    TranslatePipe,
  ],
  templateUrl: './business-documents-page.component.html',
  styleUrl: './business-documents-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BusinessDocumentsPageComponent {
  private readonly api = inject(BusinessDocumentsFacade);
  private readonly auth = inject(PlatformAuthenticationBoundary);
  private readonly route = inject(ActivatedRoute);
  private readonly i18n = inject(TranslateService);
  private readonly language = inject(LanguageService);
  private readonly evidenceFile = viewChild<ElementRef<HTMLInputElement>>('evidenceFile');

  readonly documents = signal<readonly BusinessDocument[]>([]);
  readonly evidence = signal<readonly EvidenceObject[]>([]);
  readonly loading = signal(false);
  readonly detailLoading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly detailError = signal<string | null>(null);
  readonly selectedDocument = signal<BusinessDocument | null>(null);
  readonly selectedEvents = signal<readonly BusinessDocumentEvent[]>([]);
  readonly requestedEvidence = signal<EvidenceObject | null>(null);
  readonly showGeneration = signal(false);
  readonly statusFilter = signal('');
  readonly typeFilter = signal('');
  readonly generationSubjectKey = signal('');
  readonly generationDocumentType = signal('ORDER_SUMMARY');
  readonly generationFormat = signal<DocumentFormat>('PDF');
  readonly evidenceSubjectKey = signal('');
  readonly evidenceFilename = signal('');
  readonly evidenceContentType = signal('application/pdf');
  readonly documentTypes = ['ORDER_SUMMARY', 'PURCHASE_REQUEST_SUMMARY', 'COMMERCIAL_INVOICE_DRAFT', 'DELIVERY_GUIDE_DRAFT', 'POD_REPORT', 'INCIDENT_REPORT', 'PAYMENT_RECEIPT'] as const;
  readonly formats: readonly DocumentFormat[] = ['PDF', 'CSV', 'XML'];

  readonly canGenerate = computed(() => this.auth.hasPermission(PLATFORM_PERMISSIONS.documentGenerate));
  readonly canUpload = computed(() => this.auth.hasPermission(PLATFORM_PERMISSIONS.documentUpload));
  readonly canDownload = computed(() => this.auth.hasPermission(PLATFORM_PERMISSIONS.documentDownload));
  readonly filteredDocuments = computed(() => this.documents().filter((document) => !this.typeFilter() || document.documentType === this.typeFilter()));
  readonly documentCount = computed(() => this.documents().length);
  readonly generatedCount = computed(() => this.documents().filter((document) => document.status === 'GENERATED').length);
  readonly attentionCount = computed(() => this.documents().filter((document) => ['FAILED', 'REQUESTED', 'GENERATING'].includes(document.status)).length);
  readonly availableEvidenceCount = computed(() => this.evidence().filter((item) => item.lifecycleStatus === 'AVAILABLE').length);
  readonly statusFilterOptions = computed<readonly NexaSegmentOption[]>(() => {
    this.language.currentLanguage();
    return [
      { value: '', label: this.i18n.instant('businessDocuments.filters.all') },
      { value: 'REQUESTED', label: this.i18n.instant('businessDocuments.status.REQUESTED') },
      { value: 'GENERATING', label: this.i18n.instant('businessDocuments.status.GENERATING') },
      { value: 'GENERATED', label: this.i18n.instant('businessDocuments.status.GENERATED') },
      { value: 'FAILED', label: this.i18n.instant('businessDocuments.status.FAILED') },
      { value: 'SUPERSEDED', label: this.i18n.instant('businessDocuments.status.SUPERSEDED') },
      { value: 'VOIDED', label: this.i18n.instant('businessDocuments.status.VOIDED') },
    ];
  });
  readonly subjectOptions = computed<readonly SubjectOption[]>(() => {
    this.language.currentLanguage();
    const values = new Map<string, SubjectOption>();
    for (const item of this.documents()) values.set(`${item.subjectType}::${item.subjectId}`, { key: `${item.subjectType}::${item.subjectId}`, label: this.subjectLabel(item.subjectType, item.subjectId), subjectType: item.subjectType, subjectId: item.subjectId });
    for (const item of this.evidence()) values.set(`${item.subjectType}::${item.subjectId}`, { key: `${item.subjectType}::${item.subjectId}`, label: this.subjectLabel(item.subjectType, item.subjectId), subjectType: item.subjectType, subjectId: item.subjectId });
    const routeOrderId = this.route.snapshot.queryParamMap.get('orderId');
    if (routeOrderId) values.set(`SALES_ORDER::${routeOrderId}`, { key: `SALES_ORDER::${routeOrderId}`, label: this.i18n.instant('businessDocuments.subjects.routeOrder'), subjectType: 'SALES_ORDER', subjectId: routeOrderId });
    return [...values.values()];
  });

  constructor() { this.load(); }

  load(status = this.statusFilter() || undefined): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({ documents: this.api.list(0, 25, status), evidence: this.api.listEvidence() }).subscribe({
      next: (value) => {
        this.documents.set(value.documents.items);
        this.evidence.set(value.evidence.items);
        this.ensureSubjectSelection();
        this.loading.set(false);
      },
      error: () => {
        this.error.set(this.i18n.instant('businessDocuments.states.loadError'));
        this.loading.set(false);
      },
    });
  }

  openGeneration(): void { this.ensureSubjectSelection(); this.showGeneration.set(true); }

  closeGeneration(): void { this.showGeneration.set(false); }

  applyStatusFilter(value: string): void { this.statusFilter.set(value); this.load(value || undefined); }

  applyTypeFilter(value: string): void { this.typeFilter.set(value); }

  resetFilters(): void { this.statusFilter.set(''); this.typeFilter.set(''); this.load(); }

  requestGeneration(): void {
    const subject = this.subjectOptions().find((item) => item.key === this.generationSubjectKey());
    if (!subject || !this.canGenerate()) return;
    this.saving.set(true);
    this.api.requestGeneration({ subjectType: subject.subjectType, subjectId: subject.subjectId, documentType: this.generationDocumentType(), format: this.generationFormat() }).subscribe({
      next: () => { this.saving.set(false); this.showGeneration.set(false); this.load(); },
      error: () => { this.error.set(this.i18n.instant('businessDocuments.states.generationError')); this.saving.set(false); },
    });
  }

  regenerate(document: BusinessDocument): void {
    if (!this.canGenerate()) return;
    this.saving.set(true);
    this.api.regenerate(document.id).subscribe({
      next: () => { this.saving.set(false); this.load(); },
      error: () => { this.error.set(this.i18n.instant('businessDocuments.states.regenerationError')); this.saving.set(false); },
    });
  }

  selectDocument(document: BusinessDocument): void {
    this.selectedDocument.set(document);
    this.selectedEvents.set([]);
    this.detailError.set(null);
    this.detailLoading.set(true);
    forkJoin({ detail: this.api.get(document.id), events: this.api.events(document.id) }).subscribe({
      next: (value) => { this.selectedDocument.set(value.detail); this.selectedEvents.set(value.events); this.detailLoading.set(false); },
      error: () => { this.detailError.set(this.i18n.instant('businessDocuments.states.detailError')); this.detailLoading.set(false); },
    });
  }

  download(document: BusinessDocument): void {
    if (!this.canDownload() || document.status !== 'GENERATED') return;
    this.api.download(document.id).subscribe({
      next: (blob) => this.save(blob, document.documentNumber || document.id, document.format.toLowerCase()),
      error: () => this.error.set(this.i18n.instant('businessDocuments.states.downloadError')),
    });
  }

  requestEvidence(): void {
    const subject = this.subjectOptions().find((item) => item.key === this.evidenceSubjectKey());
    if (!subject || !this.canUpload() || !this.evidenceFilename().trim()) return;
    this.saving.set(true);
    this.api.requestEvidence({ subjectType: subject.subjectType, subjectId: subject.subjectId, originalFilename: this.evidenceFilename().trim(), declaredContentType: this.evidenceContentType() }).subscribe({
      next: (value) => { this.requestedEvidence.set(value); this.saving.set(false); this.load(); },
      error: () => { this.error.set(this.i18n.instant('businessDocuments.states.evidenceRequestError')); this.saving.set(false); },
    });
  }

  chooseEvidenceFile(): void { this.evidenceFile()?.nativeElement.click(); }

  completeEvidence(event: Event): void {
    const evidence = this.requestedEvidence();
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!evidence || !file) return;
    this.saving.set(true);
    this.api.completeEvidence(evidence.id, file).subscribe({
      next: () => { this.requestedEvidence.set(null); this.saving.set(false); this.load(); },
      error: () => { this.error.set(this.i18n.instant('businessDocuments.states.evidenceUploadError')); this.saving.set(false); },
    });
  }

  downloadEvidence(evidence: EvidenceObject): void {
    if (!this.canDownload() || evidence.lifecycleStatus !== 'AVAILABLE') return;
    this.api.downloadEvidence(evidence.id).subscribe({
      next: (blob) => this.save(blob, evidence.originalFilename, ''),
      error: () => this.error.set(this.i18n.instant('businessDocuments.states.evidenceDownloadError')),
    });
  }

  subjectLabel(type: string, id: string): string { return `${type.replaceAll('_', ' ')} · ${id.slice(0, 8)}`; }

  documentTypeLabelKey(type: string): string { return this.documentTypes.includes(type as (typeof this.documentTypes)[number]) ? `businessDocuments.types.${type}` : type.replaceAll('_', ' '); }

  statusLabelKey(status: string): string { return `businessDocuments.status.${status}`; }

  evidenceStatusLabelKey(status: string): string { return `businessDocuments.evidenceStatus.${status}`; }

  statusTone(status: string): StatusTone {
    if (status === 'GENERATED') return 'success';
    if (status === 'FAILED') return 'danger';
    if (status === 'REQUESTED' || status === 'GENERATING') return 'warning';
    if (status === 'SUPERSEDED' || status === 'VOIDED') return 'neutral';
    return 'info';
  }

  evidenceTone(status: string): StatusTone {
    if (status === 'AVAILABLE') return 'success';
    if (status === 'REJECTED' || status === 'DELETED') return 'danger';
    if (status === 'QUARANTINED' || status === 'SCANNING') return 'warning';
    return 'info';
  }

  formatBytes(bytes: number): string { return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(bytes < 1024 * 1024 ? 1 : 2)} ${bytes < 1024 * 1024 ? 'KB' : 'MB'}`; }

  private ensureSubjectSelection(): void {
    const first = this.subjectOptions()[0]?.key ?? '';
    if (!this.generationSubjectKey() || !this.subjectOptions().some((item) => item.key === this.generationSubjectKey())) this.generationSubjectKey.set(first);
    if (!this.evidenceSubjectKey() || !this.subjectOptions().some((item) => item.key === this.evidenceSubjectKey())) this.evidenceSubjectKey.set(first);
  }

  private save(blob: Blob | null, name: string, extension: string): void {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = extension ? `${name}.${extension}` : name;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}
