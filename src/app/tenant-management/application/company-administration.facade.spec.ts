import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthenticationService } from '../../iam/application/authentication.service';
import { CompanyAdministrationApiService } from '../infrastructure/http/company-administration-api.service';
import { CompanyAdministrationFacade } from './company-administration.facade';

const organization = { id: 'org', name: 'Nexa', slug: 'nexa', status: 'ACTIVE', currentWorkspaceId: 'workspace', currentWorkspaceName: 'ICISA', version: 0 };
const profile = { legalName: 'Nexa', displayName: 'Nexa', businessIdentifier: null, operationCategory: 'B2B_COLD_CHAIN_DISTRIBUTOR', version: 0 };
const workspace = { id: 'workspace', tenantId: 'org', name: 'ICISA', slug: 'icisa', status: 'ACTIVE', version: 2 };
const membership = { id: 'member', workspaceId: 'workspace', userId: 'user', email: 'user@example.com', displayName: 'User', roles: ['SALES'], status: 'ACTIVE', version: 1 };
const regional = { timezone: 'UTC', language: 'en', currency: 'USD', countryRegion: 'PE', dateTimePolicy: 'LOCALE', locale: 'en-US', version: 0 };
const units = { massUnit: 'KG', temperatureUnit: 'CELSIUS', distanceUnit: 'KM', volumeUnit: 'M3', version: 0 };
const operational = { workspaceId: 'workspace', defaultWarehouseSelectionPolicy: 'MANUAL', orderCutoffPolicy: 'WORKSPACE_HOURS', fulfillmentDefaults: 'STANDARD', inventoryVisibilityPolicy: 'COARSE', buyerAvailabilityPolicy: 'AVAILABLE_ONLY', operatingHoursStart: '08:00:00', operatingHoursEnd: '18:00:00', orderCutoffMinutes: 120, thermalLogRequired: false, version: 0 };
const notifications = { preferences: [], version: 0 };
const security = { passwordMinLength: 12, sessionDurationMinutes: 480, invitationExpirationHours: 72, requiredEmailDomain: null, version: 0 };
const usage = { planCode: 'STANDARD', monthlyPrice: 0, seatLimit: 10, workspaceLimit: 3, transactionLimit: 1000, activeUsers: 1, workspaceCount: 1, transactionCount: 0, version: 0 };

function apiMock() {
  return {
    organization: vi.fn(() => of(organization)), organizationProfile: vi.fn(() => of(profile)), workspaces: vi.fn(() => of([workspace])), memberships: vi.fn(() => of([membership])),
    regionalSettings: vi.fn(() => of(regional)), unitPreferences: vi.fn(() => of(units)), securitySettings: vi.fn(() => of(security)), customFields: vi.fn(() => of([])), accessMatrix: vi.fn(() => of([])), planUsage: vi.fn(() => of(usage)), planComparison: vi.fn(() => of([])), invitations: vi.fn(() => of({ items: [], page: 0, pageSize: 25, hasNext: false })),
    workspaceSettings: vi.fn(() => of({ workspaceId: 'workspace', defaultWorkspaceBehavior: 'STANDARD', warehousePreferenceStrategy: 'MANUAL', version: 0 })), operationalSettings: vi.fn(() => of(operational)), notificationSettings: vi.fn(() => of(notifications)),
    updateWorkspace: vi.fn(() => of({ ...workspace, name: 'ICISA 2', version: 3 })), membership: vi.fn(() => of(membership)), changeRoles: vi.fn(() => of(membership)), suspend: vi.fn(() => of({ ...membership, status: 'DISABLED', version: 2 })), reactivate: vi.fn(() => of(membership))
  };
}

describe('CompanyAdministrationFacade', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('loads the complete tenant administration read model', () => {
    const api = apiMock();
    TestBed.configureTestingModule({ providers: [CompanyAdministrationFacade, { provide: CompanyAdministrationApiService, useValue: api }, { provide: AuthenticationService, useValue: { hasPermission: () => true } }] });
    const facade = TestBed.inject(CompanyAdministrationFacade); facade.load();
    expect(facade.state().status).toBe('success');
    expect(facade.state().organization).toEqual(organization);
    expect(facade.state().profile).toEqual(profile);
    expect(facade.state().operational).toEqual(operational);
    expect(facade.state().workspaces).toEqual([workspace]);
  });

  it('keeps a retryable error state when a read fails', () => {
    const api = apiMock(); api.organization.mockReturnValue(throwError(() => new Error('offline')));
    TestBed.configureTestingModule({ providers: [CompanyAdministrationFacade, { provide: CompanyAdministrationApiService, useValue: api }, { provide: AuthenticationService, useValue: { hasPermission: () => true } }] });
    const facade = TestBed.inject(CompanyAdministrationFacade); facade.load();
    expect(facade.state().status).toBe('error'); expect(facade.state().message).toBe('offline');
    facade.retry(); expect(api.organization).toHaveBeenCalledTimes(2);
  });

  it('sends current versions and fixed roles to real mutation methods', () => {
    const api = apiMock();
    TestBed.configureTestingModule({ providers: [CompanyAdministrationFacade, { provide: CompanyAdministrationApiService, useValue: api }, { provide: AuthenticationService, useValue: { hasPermission: () => true } }] });
    const facade = TestBed.inject(CompanyAdministrationFacade); facade.load();
    facade.renameWorkspace('workspace', 2, 'ICISA 2', 'icisa-2'); facade.changeRoles('member', 1, ['SALES', 'WAREHOUSE']); facade.suspend('member', 1);
    expect(api.updateWorkspace).toHaveBeenCalledWith('workspace', 2, { name: 'ICISA 2', slug: 'icisa-2' });
    expect(api.changeRoles).toHaveBeenCalledWith('member', 1, ['SALES', 'WAREHOUSE']);
    expect(api.suspend).toHaveBeenCalledWith('member', 1);
  });

  it('reloads the tenant read model after an ETag conflict', () => {
    const api = apiMock();
    api.changeRoles.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 412, error: { code: 'CONCURRENCY_CONFLICT' } })));
    TestBed.configureTestingModule({ providers: [CompanyAdministrationFacade, { provide: CompanyAdministrationApiService, useValue: api }, { provide: AuthenticationService, useValue: { hasPermission: () => true } }] });
    const facade = TestBed.inject(CompanyAdministrationFacade); facade.load();
    facade.changeRoles('member', 1, ['WAREHOUSE']);
    expect(api.changeRoles).toHaveBeenCalledWith('member', 1, ['WAREHOUSE']);
    expect(api.memberships).toHaveBeenCalledTimes(2);
    expect(facade.state().message).toBe('STALE_VERSION');
    expect(facade.state().notice).toBe('STALE_RELOADED');
  });

  it('keeps the owner invariant error visible instead of treating it as a stale reload', () => {
    const api = apiMock();
    api.changeRoles.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 409, error: { code: 'LAST_ACTIVE_OWNER_REQUIRED' } })));
    TestBed.configureTestingModule({ providers: [CompanyAdministrationFacade, { provide: CompanyAdministrationApiService, useValue: api }, { provide: AuthenticationService, useValue: { hasPermission: () => true } }] });
    const facade = TestBed.inject(CompanyAdministrationFacade);
    facade.load();

    facade.changeRoles('member', 1, ['WAREHOUSE']);

    expect(api.memberships).toHaveBeenCalledTimes(1);
    expect(facade.state().message).toBe('LAST_ACTIVE_OWNER_REQUIRED');
  });

  it('does not issue mutations when the required permission is absent', () => {
    const api = apiMock();
    TestBed.configureTestingModule({ providers: [CompanyAdministrationFacade, { provide: CompanyAdministrationApiService, useValue: api }, { provide: AuthenticationService, useValue: { hasPermission: () => false } }] });
    const facade = TestBed.inject(CompanyAdministrationFacade);
    facade.changeRoles('member', 1, ['WAREHOUSE']);
    expect(api.changeRoles).not.toHaveBeenCalled();
  });

  it('keeps Company Owner governance permissions separate from technical tenant permissions', () => {
    const governed = new Set(['tenant.organization.manage', 'tenant.member.invite', 'tenant.member.manage', 'tenant.role.assign', 'notification.manage_preferences']);
    const api = apiMock();
    TestBed.configureTestingModule({ providers: [CompanyAdministrationFacade, { provide: CompanyAdministrationApiService, useValue: api }, { provide: AuthenticationService, useValue: { hasPermission: (permission: string) => governed.has(permission) } }] });
    const facade = TestBed.inject(CompanyAdministrationFacade);

    expect(facade.canManageOrganization()).toBe(true);
    expect(facade.canInviteMembers()).toBe(true);
    expect(facade.canManageMembers()).toBe(true);
    expect(facade.canAssignRoles()).toBe(true);
    expect(facade.canManageNotifications()).toBe(true);
    expect(facade.canManageWorkspace()).toBe(false);
    expect(facade.canManageRoleDefinitions()).toBe(false);
    expect(facade.canManageSecurity()).toBe(false);
  });
});
