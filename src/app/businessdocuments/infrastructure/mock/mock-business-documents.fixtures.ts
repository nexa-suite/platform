import { PlatformTenantProfile } from '../../../core/security/runtime-config';
import { BusinessDocument, BusinessDocumentEvent, EvidenceObject } from '../../domain/business-document.models';

export interface MockBusinessDocumentsFixture {
  readonly documents: readonly BusinessDocument[];
  readonly events: readonly BusinessDocumentEvent[];
  readonly evidence: readonly EvidenceObject[];
}

function fixture(profile: PlatformTenantProfile): MockBusinessDocumentsFixture {
  const icisa = profile === 'icisa';
  const orderId = `${profile}-sales-order-002`;
  const orderNumber = icisa ? 'SO-ICISA-002' : 'SO-GEN-002';
  const document: BusinessDocument = { id: `${profile}-document-001`, clientAccountId: `${profile}-client-001`, subjectType: 'SALES_ORDER', subjectId: orderId, documentType: 'ORDER_SUMMARY', documentNumber: `DOC-${orderNumber}`, version: 1, status: 'GENERATED', format: 'PDF', contentType: 'application/pdf', checksumSha256: null, byteSize: 128, generatedAt: '2026-08-26T08:00:00Z', failureCode: null, failureDetail: null };
  const secondDocument: BusinessDocument = { id: `${profile}-document-002`, clientAccountId: `${profile}-client-001`, subjectType: 'SALES_ORDER', subjectId: orderId, documentType: 'DELIVERY_GUIDE_DRAFT', documentNumber: null, version: 1, status: 'GENERATING', format: 'PDF', contentType: 'application/pdf', checksumSha256: null, byteSize: 0, generatedAt: null, failureCode: null, failureDetail: null };
  const evidence: EvidenceObject = { id: `${profile}-evidence-001`, subjectType: 'SALES_ORDER', subjectId: orderId, lifecycleStatus: 'AVAILABLE', detectedContentType: 'image/jpeg', declaredContentType: 'image/jpeg', originalFilename: 'pod-photo.jpg', checksumSha256: null, byteSize: 2048, createdAt: '2026-08-25T11:00:00Z', scannedAt: '2026-08-25T11:01:00Z', failureCode: null, updatedAt: '2026-08-25T11:01:00Z' };
  return { documents: [document, secondDocument], events: [{ eventId: `${document.id}-event-001`, eventType: 'DOCUMENT_GENERATED', status: 'GENERATED', occurredAt: document.generatedAt ?? '2026-08-26T08:00:00Z', processedAt: document.generatedAt, attemptCount: 1 }], evidence: [evidence] };
}

export const MOCK_BUSINESS_DOCUMENT_FIXTURES: Readonly<Record<PlatformTenantProfile, MockBusinessDocumentsFixture>> = { generic: fixture('generic'), icisa: fixture('icisa') };
