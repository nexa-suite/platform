import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CompanyAdministrationPageComponent } from './company-administration-page.component';
import { CompanyAdministrationApiService } from '../../infrastructure/http/company-administration-api.service';

describe('CompanyAdministrationPageComponent', () => {
  let fixture: ComponentFixture<CompanyAdministrationPageComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CompanyAdministrationPageComponent], providers: [{ provide: CompanyAdministrationApiService, useValue: { organization: () => of({ id: '1', name: 'Nexa', slug: 'nexa', status: 'ACTIVE', currentWorkspaceId: 'w', currentWorkspaceName: 'ICISA', version: 0 }), workspaces: () => of([]), memberships: () => of([]) } }] }).compileComponents();
    fixture = TestBed.createComponent(CompanyAdministrationPageComponent);
    fixture.detectChanges();
  });
  it('renders the organization administration heading', () => expect(fixture.nativeElement.textContent).toContain('Company administration'));
});
