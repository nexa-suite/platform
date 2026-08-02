import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PLATFORM_RUNTIME_CONFIG } from '../../../core/security/runtime-config';
import { OperationalSettings } from '../../domain/models/company-administration.models';
import { CompanyAdministrationApiService } from './company-administration-api.service';

describe('CompanyAdministrationApiService', () => {
  let service: CompanyAdministrationApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CompanyAdministrationApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PLATFORM_RUNTIME_CONFIG, useValue: { apiBaseUrl: 'http://api.local', surface: 'PLATFORM' } }
      ]
    });
    service = TestBed.inject(CompanyAdministrationApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('uses tenant administration paths and preserves ETag preconditions', () => {
    const settings: OperationalSettings = {
      workspaceId: 'workspace/one',
      defaultWarehouseSelectionPolicy: 'MANUAL',
      orderCutoffPolicy: 'SAME_DAY',
      fulfillmentDefaults: 'STANDARD',
      inventoryVisibilityPolicy: 'TENANT',
      buyerAvailabilityPolicy: 'AVAILABLE',
      operatingHoursStart: '08:00',
      operatingHoursEnd: '18:00',
      orderCutoffMinutes: 60,
      thermalLogRequired: true,
      version: 7
    };
    service.updateOperationalSettings('workspace/one', settings, 7).subscribe();
    const request = http.expectOne('http://api.local/api/v1/workspaces/workspace%2Fone/operational-settings');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.headers.get('If-Match')).toBe('"7"');
    request.flush({});
  });

  it('sends idempotency keys for workspace and invitation creation', () => {
    service.createWorkspace({ name: 'New', slug: 'new' }, 'workspace-key').subscribe();
    const workspaceRequest = http.expectOne('http://api.local/api/v1/workspaces');
    expect(workspaceRequest.request.method).toBe('POST');
    expect(workspaceRequest.request.headers.get('Idempotency-Key')).toBe('workspace-key');
    workspaceRequest.flush({});

    service.createInvitation({ email: 'member@example.com', displayName: 'Member', roles: ['SALES'] }, 'invitation-key').subscribe();
    const invitationRequest = http.expectOne('http://api.local/api/v1/organization-invitations');
    expect(invitationRequest.request.method).toBe('POST');
    expect(invitationRequest.request.headers.get('Idempotency-Key')).toBe('invitation-key');
    expect(invitationRequest.request.body).not.toHaveProperty('token');
    invitationRequest.flush({});
  });

  it('supports membership detail and public invitation acceptance without leaking a token into another payload', () => {
    service.membership('member/one').subscribe();
    const detailRequest = http.expectOne('http://api.local/api/v1/workspace-memberships/member%2Fone');
    expect(detailRequest.request.method).toBe('GET');
    detailRequest.flush({});

    service.acceptInvitation({ token: 'opaque-token', password: 'long-enough-password', displayName: 'New member' }).subscribe();
    const acceptanceRequest = http.expectOne('http://api.local/api/v1/organization-invitation-acceptances');
    expect(acceptanceRequest.request.method).toBe('POST');
    expect(acceptanceRequest.request.body).toEqual({ token: 'opaque-token', password: 'long-enough-password', displayName: 'New member' });
    acceptanceRequest.flush({ invitationId: 'invitation', userId: 'user', workspaceId: 'workspace', roles: ['SALES'] });
  });
});
