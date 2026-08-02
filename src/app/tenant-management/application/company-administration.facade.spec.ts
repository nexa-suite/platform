import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CompanyAdministrationApiService } from '../infrastructure/http/company-administration-api.service';
import { CompanyAdministrationFacade } from './company-administration.facade';

describe('CompanyAdministrationFacade', () => {
  const organization = { id: 'org', name: 'Nexa', slug: 'nexa', status: 'ACTIVE', currentWorkspaceId: 'workspace', currentWorkspaceName: 'ICISA', version: 0 };
  const api = () => ({ organization: vi.fn(() => of(organization)), workspaces: vi.fn(() => of([])), memberships: vi.fn(() => of([])) });
  beforeEach(() => TestBed.resetTestingModule());
  it('loads organization, workspaces and teammates into success state', () => {
    const mock = api(); TestBed.configureTestingModule({ providers: [CompanyAdministrationFacade, { provide: CompanyAdministrationApiService, useValue: mock }] });
    const facade = TestBed.inject(CompanyAdministrationFacade); facade.load();
    expect(facade.state().status).toBe('success'); expect(facade.state().organization).toEqual(organization); expect(facade.state().workspaces).toEqual([]); expect(facade.state().memberships).toEqual([]);
  });
  it('exposes retryable error state', () => {
    const mock = { organization: vi.fn(() => throwError(() => new Error('offline'))), workspaces: vi.fn(() => of([])), memberships: vi.fn(() => of([])) };
    TestBed.configureTestingModule({ providers: [CompanyAdministrationFacade, { provide: CompanyAdministrationApiService, useValue: mock }] });
    const facade = TestBed.inject(CompanyAdministrationFacade); facade.load(); expect(facade.state().status).toBe('error'); facade.retry(); expect(mock.organization).toHaveBeenCalledTimes(2);
  });
  it('sends workspace and membership mutations with current versions', () => {
    const membership = { id: 'member', userId: 'user', email: 'user@example.com', displayName: 'User', roles: ['SALES'], status: 'SUSPENDED', version: 1 };
    const mock = { organization: vi.fn(() => of(organization)), workspaces: vi.fn(() => of([{ id: 'workspace', name: 'ICISA', slug: 'icisa', status: 'ACTIVE', version: 2 }])), memberships: vi.fn(() => of([membership])), updateWorkspace: vi.fn(() => of({ id: 'workspace', name: 'ICISA 2', slug: 'icisa-2', status: 'ACTIVE', version: 3 })), changeRoles: vi.fn(() => of(membership)), suspend: vi.fn(() => of(membership)), reactivate: vi.fn(() => of({ ...membership, status: 'ACTIVE' })) };
    TestBed.configureTestingModule({ providers: [CompanyAdministrationFacade, { provide: CompanyAdministrationApiService, useValue: mock }] }); const facade = TestBed.inject(CompanyAdministrationFacade); facade.load(); facade.renameWorkspace('workspace', 2, 'ICISA 2'); facade.changeRoles('member', 1, ['SALES']); facade.suspend('member', 1); facade.reactivate('member', 1);
    expect(mock.updateWorkspace).toHaveBeenCalledWith('workspace', 2, { name: 'ICISA 2' }); expect(mock.changeRoles).toHaveBeenCalledWith('member', 1, ['SALES']); expect(mock.suspend).toHaveBeenCalledWith('member', 1); expect(mock.reactivate).toHaveBeenCalledWith('member', 1);
  });
});
