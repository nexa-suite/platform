import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { CompanyAdministrationPageComponent } from './company-administration-page.component';
import { CompanyAdministrationFacade } from '../../application/company-administration.facade';
import { INITIAL_TENANT_ADMINISTRATION_STATE } from '../../domain/models/company-administration.models';

describe('CompanyAdministrationPageComponent', () => {
  let fixture: ComponentFixture<CompanyAdministrationPageComponent>;
  const state = signal({ ...INITIAL_TENANT_ADMINISTRATION_STATE, status: 'success' as const, organization: { id: 'org', name: 'Nexa', slug: 'nexa', status: 'ACTIVE', currentWorkspaceId: 'workspace', currentWorkspaceName: 'ICISA', version: 0 }, profile: { legalName: 'Nexa', displayName: 'Nexa', businessIdentifier: null, operationCategory: 'B2B', version: 0 }, workspaces: [], memberships: [] });
  const facade = { state: state.asReadonly(), canManage: signal(true).asReadonly(), busy: signal(false).asReadonly(), load: () => undefined, retry: () => undefined };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CompanyAdministrationPageComponent], providers: [{ provide: CompanyAdministrationFacade, useValue: facade }] }).compileComponents();
    fixture = TestBed.createComponent(CompanyAdministrationPageComponent); fixture.detectChanges();
  });

  it('renders administrative navigation and organization overview', () => {
    expect(fixture.nativeElement.textContent).toContain('Company administration');
    expect(fixture.nativeElement.textContent).toContain('Organization');
    expect(fixture.nativeElement.textContent).toContain('Manage workspaces');
  });
});
