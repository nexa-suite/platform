import { TestBed } from '@angular/core/testing';
import { Type } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { afterEach, describe, expect, it } from 'vitest';

import { PLATFORM_RUNTIME_CONFIG } from './runtime-config';
import { MockAuditApiService } from '../../tenantaccessgovernance/iam/infrastructure/mock/mock-audit-api.service';
import { MockSecurityApiService } from '../../tenantaccessgovernance/iam/infrastructure/mock/mock-security-api.service';
import { MockCompanyAdministrationApiService } from '../../tenantaccessgovernance/tenantmanagement/infrastructure/mock/mock-company-administration-api.service';
import { MockPaymentsApiService } from '../../payments/infrastructure/mock/mock-payments-api.service';
import { MockBusinessDocumentsApiService } from '../../businessdocuments/infrastructure/mock/mock-business-documents-api.service';
import { MockNotificationsApiService } from '../../notifications/infrastructure/mock/mock-notifications-api.service';

describe('Platform extended mock adapters', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('keeps tenant administration and security changes versioned', async () => {
    configure('icisa', MockCompanyAdministrationApiService, MockSecurityApiService);
    const administration = TestBed.inject(MockCompanyAdministrationApiService);
    const security = TestBed.inject(MockSecurityApiService);
    const workspace = (await firstValueFrom(administration.workspaces()))[0]!;
    const updatedWorkspace = await firstValueFrom(administration.updateWorkspace(workspace.id, workspace.version, { name: 'ICISA Operations' }));
    const profile = await firstValueFrom(security.profile());
    const updatedProfile = await firstValueFrom(security.updateProfile({ displayName: 'Carlos Operaciones', phone: '', preferredLanguage: 'es', timezone: 'America/Lima' }));

    expect(updatedWorkspace).toMatchObject({ name: 'ICISA Operations', version: 2 });
    expect(updatedProfile).toMatchObject({ displayName: 'Carlos Operaciones', version: 2 });
  });

  it('covers payment review, document evidence and notification read state', async () => {
    configure('generic', MockPaymentsApiService, MockBusinessDocumentsApiService, MockNotificationsApiService);
    const payments = TestBed.inject(MockPaymentsApiService);
    const documents = TestBed.inject(MockBusinessDocumentsApiService);
    const notifications = TestBed.inject(MockNotificationsApiService);
    const pending = await firstValueFrom(payments.listPendingBankTransfers());
    const reviewed = await firstValueFrom(payments.approveBankTransfer(pending.items[0]!.id));
    const generation = await firstValueFrom(documents.requestGeneration({ subjectType: 'SALES_ORDER', subjectId: 'generic-sales-order-001', documentType: 'ORDER_SUMMARY', format: 'PDF' }));
    const evidence = await firstValueFrom(documents.requestEvidence({ subjectType: 'SALES_ORDER', subjectId: 'generic-sales-order-001', originalFilename: 'pod.png', declaredContentType: 'image/png' }));
    const completedEvidence = await firstValueFrom(documents.completeEvidence(evidence.id, new File(['demo'], 'pod.png', { type: 'image/png' })));
    const before = await firstValueFrom(notifications.list(10));
    await firstValueFrom(notifications.markRead(before[0]!.id));
    const after = await firstValueFrom(notifications.list(10));

    expect(reviewed).toMatchObject({ status: 'APPROVED' });
    expect(generation).toMatchObject({ status: 'COMPLETED', documentId: 'generic-document-003' });
    expect(completedEvidence).toMatchObject({ lifecycleStatus: 'AVAILABLE', detectedContentType: 'image/png' });
    expect(after[0]?.read).toBe(true);
  });

  it('keeps the BC-11 audit projection query-only', async () => {
    configure('icisa', MockAuditApiService);
    const audit = TestBed.inject(MockAuditApiService);
    const events = await firstValueFrom(audit.list(1));
    const detail = await firstValueFrom(audit.detail(events[0]!.id));

    expect(events).toHaveLength(1);
    expect(detail).toMatchObject({ actorWorkArea: 'PLATFORM', metadata: { mode: 'mock' } });
  });

  function configure(tenantProfile: 'generic' | 'icisa', ...services: Type<unknown>[]): void {
    TestBed.configureTestingModule({
      providers: [
        ...services,
        { provide: PLATFORM_RUNTIME_CONFIG, useValue: { apiBaseUrl: '', surface: 'PLATFORM', dataMode: 'mock', tenantProfile } },
      ],
    });
  }
});
