import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SecurityFacade } from '../../application/security.facade';
import { OrganizationOnboardingPageComponent } from './organization-onboarding-page.component';

describe('OrganizationOnboardingPageComponent', () => {
  let fixture: ComponentFixture<OrganizationOnboardingPageComponent>;
  let component: OrganizationOnboardingPageComponent;
  const facade = {
    busy: signal(false),
    error: signal<string | null>(null),
    register: vi.fn()
  };

  beforeEach(async () => {
    facade.busy.set(false);
    facade.error.set(null);
    facade.register.mockReset();
    await TestBed.configureTestingModule({
      imports: [OrganizationOnboardingPageComponent],
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: SecurityFacade, useValue: facade }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(OrganizationOnboardingPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('keeps six tenant-registration steps sequential and validates the active step', () => {
    expect(component.steps).toHaveLength(6);
    expect(component.currentStep()).toBe(1);

    component.goToStep(6);
    expect(component.currentStep()).toBe(1);

    component.next();
    expect(component.currentStep()).toBe(1);
    expect(component.form.controls.legalName.touched).toBe(true);
  });

  it('submits the real registration contract only from the review step', () => {
    component.form.patchValue({
      legalName: 'Nexa Foods S.A.C.',
      displayName: 'Nexa Foods',
      storageSiteName: 'Central cold store',
      storageSiteAddress: 'Av. Arnaldo Márquez 1772, Lima',
      founderDisplayName: 'Ana Rivera',
      founderEmail: 'ana@nexa.test',
      workspaceName: 'Nexa Foods Workspace',
      workspaceSlug: 'nexa-foods',
      termsAccepted: true
    });
    component.next();
    component.next();
    component.next();
    component.next();
    component.next();
    expect(component.currentStep()).toBe(6);

    facade.register.mockReturnValue(of({ registrationId: 'registration-1', statusToken: 'status-token' }));
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    component.submit();

    expect(facade.register).toHaveBeenCalledWith(expect.objectContaining({
      legalName: 'Nexa Foods S.A.C.',
      workspaceSlug: 'nexa-foods',
      termsAccepted: true,
      businessIdentifier: null
    }));
    expect(navigate).toHaveBeenCalledWith(
      ['/tenant-management/registration-pending', 'registration-1'],
      { queryParams: { statusToken: 'status-token' } }
    );
  });
});
