import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PlatformAuthenticationBoundary } from '../../core/security/platform-authentication.boundary';
import { PLATFORM_PERMISSIONS } from '../../core/security/platform-permissions';
import { BusinessDocumentsFacade } from '../application/business-documents.facade';
import { BusinessDocumentsPageComponent } from './business-documents-page.component';

const document = {
  id: 'document-1',
  clientAccountId: 'client-1',
  subjectType: 'SALES_ORDER',
  subjectId: 'order-1',
  documentType: 'ORDER_SUMMARY',
  documentNumber: 'SO-2026-0001',
  version: 1,
  status: 'GENERATED',
  format: 'PDF' as const,
  contentType: 'application/pdf',
  checksumSha256: 'checksum',
  byteSize: 2048,
  generatedAt: '2026-08-29T10:00:00Z',
  failureCode: null,
  failureDetail: null,
};

const evidence = {
  id: 'evidence-1',
  subjectType: 'SALES_ORDER',
  subjectId: 'order-1',
  lifecycleStatus: 'AVAILABLE' as const,
  declaredContentType: 'image/png',
  detectedContentType: 'image/png',
  originalFilename: 'pod.png',
  checksumSha256: 'checksum',
  byteSize: 1024,
  createdAt: '2026-08-29T10:00:00Z',
  scannedAt: '2026-08-29T10:01:00Z',
  failureCode: null,
  updatedAt: '2026-08-29T10:01:00Z',
};

describe('BusinessDocumentsPageComponent', () => {
  afterEach(() => TestBed.resetTestingModule());

  function configure(): { fixture: ComponentFixture<BusinessDocumentsPageComponent>; facade: { list: ReturnType<typeof vi.fn> }; hasPermission: ReturnType<typeof vi.fn> } {
    const facade = {
      list: vi.fn(() => of({ items: [document], page: 0, size: 25, total: 1 })),
      listEvidence: vi.fn(() => of({ items: [evidence], page: 0, size: 25, total: 1 })),
      get: vi.fn(() => of(document)),
      events: vi.fn(() => of([])),
      requestGeneration: vi.fn(() => of({})),
      regenerate: vi.fn(() => of({})),
      download: vi.fn(() => of(new Blob(['document'], { type: 'application/pdf' }))),
      requestEvidence: vi.fn(() => of(evidence)),
      completeEvidence: vi.fn(() => of(evidence)),
      downloadEvidence: vi.fn(() => of(new Blob(['evidence'], { type: 'image/png' }))),
    };
    const hasPermission = vi.fn(() => true);

    TestBed.configureTestingModule({
      imports: [BusinessDocumentsPageComponent],
      providers: [
        provideTranslateService(),
        { provide: BusinessDocumentsFacade, useValue: facade },
        { provide: PlatformAuthenticationBoundary, useValue: { hasPermission } },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: () => null } } } },
      ],
    });

    const fixture = TestBed.createComponent(BusinessDocumentsPageComponent);
    fixture.detectChanges();
    return { fixture, facade, hasPermission };
  }

  it('uses canonical API permission keys and renders server-backed document data', () => {
    const { fixture, hasPermission } = configure();
    const component = fixture.componentInstance;

    expect(component.documentCount()).toBe(1);
    expect(component.generatedCount()).toBe(1);
    expect(component.availableEvidenceCount()).toBe(1);
    expect(hasPermission).toHaveBeenCalledWith(PLATFORM_PERMISSIONS.documentGenerate);
    expect(hasPermission).toHaveBeenCalledWith(PLATFORM_PERMISSIONS.documentUpload);
    expect(hasPermission).toHaveBeenCalledWith(PLATFORM_PERMISSIONS.documentDownload);
    expect(fixture.nativeElement.querySelector('table')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('SO-2026-0001');
  });

  it('delegates status filtering to the existing API query contract', () => {
    const { facade } = configure();
    const component = TestBed.createComponent(BusinessDocumentsPageComponent).componentInstance;

    component.applyStatusFilter('GENERATED');

    expect(facade.list).toHaveBeenLastCalledWith(0, 25, 'GENERATED');
  });

  it('keeps type filtering local to the loaded server page', () => {
    const { fixture } = configure();
    const component = fixture.componentInstance;

    component.applyTypeFilter('POD_REPORT');
    fixture.detectChanges();

    expect(component.filteredDocuments()).toHaveLength(0);
    expect(fixture.nativeElement.querySelector('.documents-table')).toBeFalsy();
  });
});
