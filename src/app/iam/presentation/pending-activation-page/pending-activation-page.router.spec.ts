import { Location } from '@angular/common';
import { provideLocationMocks } from '@angular/common/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SecurityFacade } from '../../application/security.facade';
import { Registration } from '../../domain/security.models';
import { PendingActivationPageComponent } from './pending-activation-page.component';

@Component({ standalone: true, template: '' })
class StartPageComponent {}

const pendingRegistration: Registration = {
  registrationId: 'registration-1',
  status: 'PENDING_ACTIVATION',
  submittedAt: '2026-08-01T00:00:00Z'
};

describe('PendingActivationPageComponent router integration', () => {
  const facade = {
    registration: vi.fn(() => pendingRegistration),
    error: vi.fn(() => null),
    loadRegistration: vi.fn(() => of(pendingRegistration))
  };

  beforeEach(() => {
    vi.resetAllMocks();
    facade.registration.mockReturnValue(pendingRegistration);
    facade.error.mockReturnValue(null);
    facade.loadRegistration.mockReturnValue(of({ ...pendingRegistration, status: 'ACTIVE' }));
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('removes statusToken from the real URL and current history entry', async () => {
    await TestBed.configureTestingModule({
      imports: [PendingActivationPageComponent],
      providers: [
        provideTranslateService(),
        provideLocationMocks(),
        provideRouter([
          { path: '', redirectTo: 'start', pathMatch: 'full' },
          { path: 'start', component: StartPageComponent },
          { path: 'tenant-management/registration-pending/:registrationId', component: PendingActivationPageComponent }
        ]),
        { provide: SecurityFacade, useValue: facade }
      ]
    }).compileComponents();

    const harness = await RouterTestingHarness.create();
    const router = TestBed.inject(Router);
    const location = TestBed.inject(Location);

    await harness.navigateByUrl('/start');
    await harness.navigateByUrl('/tenant-management/registration-pending/registration-1?statusToken=opaque-status-token&keep=value');
    await harness.fixture.whenStable();

    expect(router.url).toBe('/tenant-management/registration-pending/registration-1?keep=value');
    expect(location.path()).toBe('/tenant-management/registration-pending/registration-1?keep=value');
    expect(facade.loadRegistration).toHaveBeenCalledTimes(1);
    expect(facade.loadRegistration).toHaveBeenCalledWith('registration-1', 'opaque-status-token');

    expect(router.url).not.toContain('opaque-status-token');
    expect(location.path()).not.toContain('opaque-status-token');
  });
});
