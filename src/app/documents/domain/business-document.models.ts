export interface ApiPage<T> {
  readonly items: readonly T[];
  readonly page: number;
  readonly size: number;
  readonly total: number;
}

export interface BusinessDocument {
  readonly id: string;
  readonly clientAccountId: string | null;
  readonly subjectType: string;
  readonly subjectId: string;
  readonly documentType: string;
  readonly documentNumber: string | null;
  readonly version: number;
  readonly status: string;
  readonly format: 'PDF' | 'CSV' | 'XML';
  readonly contentType: string | null;
  readonly checksumSha256: string | null;
  readonly byteSize: number;
  readonly generatedAt: string | null;
  readonly failureCode: string | null;
  readonly failureDetail: string | null;
}

export interface EvidenceObject {
  readonly id: string;
  readonly subjectType: string;
  readonly subjectId: string;
  readonly lifecycleStatus: 'REQUESTED' | 'UPLOADING' | 'QUARANTINED' | 'SCANNING' | 'AVAILABLE' | 'REJECTED' | 'DELETED';
  readonly declaredContentType: string;
  readonly detectedContentType: string | null;
  readonly originalFilename: string;
  readonly checksumSha256: string | null;
  readonly byteSize: number;
  readonly createdAt: string;
  readonly scannedAt: string | null;
  readonly failureCode: string | null;
  readonly updatedAt: string | null;
}

export interface GenerationRequest {
  readonly id: string;
  readonly documentId: string | null;
  readonly subjectType: string;
  readonly subjectId: string;
  readonly documentType: string;
  readonly format: string;
  readonly status: string;
  readonly requestedAt: string;
  readonly completedAt: string | null;
}

export interface BusinessDocumentEvent {
  readonly eventId: string;
  readonly eventType: string;
  readonly status: string;
  readonly occurredAt: string;
  readonly processedAt: string | null;
  readonly attemptCount: number;
}
