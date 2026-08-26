import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideTranslateService } from '@ngx-translate/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CompanyAdministrationFacade } from '../../application/company-administration.facade';
import { INITIAL_TENANT_ADMINISTRATION_STATE } from '../../domain/models/company-administration.models';
import { OrganizationWorkspacesSectionComponent } from './organization-workspaces-section.component';

describe('OrganizationWorkspacesSectionComponent', () => {
  let fixture: ComponentFixture<OrganizationWorkspacesSectionComponent>;
  const state = signal({
    ...INITIAL_TENANT_ADMINISTRATION_STATE,
    profile: { legalName: 'Nexa', displayName: 'Nexa', businessIdentifier: null, operationCategory: 'B2B', version: 0 },
    workspaces: [{ id: 'workspace', tenantId: 'tenant', name: 'ICISA', slug: 'icisa', status: 'ACTIVE', version: 1 }]
  });
  const facade = {
    state: state.asReadonly(),
    canManageOrganization: signal(true).asReadonly(),
    canManageWorkspace: signal(true).asReadonly(),
    busy: signal(false).asReadonly(),
    updateOrganization: vi.fn(),
    renameWorkspace: vi.fn(),
    suspendWorkspace: vi.fn(),
    reactivateWorkspace: vi.fn(),
    selectWorkspace: vi.fn()
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [OrganizationWorkspacesSectionComponent],
      providers: [provideTranslateService(), { provide: CompanyAdministrationFacade, useValue: facade }]
    }).compileComponents();
    fixture = TestBed.createComponent(OrganizationWorkspacesSectionComponent);
    fixture.detectChanges();
  });

  it('keeps the single workspace configurable without an additional workspace form', () => {
    expect(fixture.nativeElement.querySelector('form[aria-label="Create workspace"]')).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Create workspace');
    expect(fixture.nativeElement.textContent).toContain('ICISA');
  });
});
