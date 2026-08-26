import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { of, tap } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SecurityFacade } from '../../application/security.facade';
import { Registration } from '../../domain/security.models';
import { PENDING_STATUS_POLL_INTERVAL_MS, PendingActivationPageComponent } from './pending-activation-page.component';

const pendingRegistration: Registration = {
  registrationId: 'registration-1',
  status: 'PENDING_ACTIVATION',
  submittedAt: '2026-08-01T00:00:00Z'
};

describe('PendingActivationPageComponent', () => {
  let fixture: ComponentFixture<PendingActivationPageComponent>;
  const facade = {
    registration: signal<Registration | null>(null),
    error: signal<string | null>(null),
    loadRegistration: vi.fn(() => of(pendingRegistration))
  };
  const route = {
    snapshot: {
      paramMap: convertToParamMap({ registrationId: 'registration-1' }),
      queryParamMap: convertToParamMap({ statusToken: 'opaque-status-token', keep: 'value' })
    }
  };
  const router = { navigate: vi.fn(() => Promise.resolve(true)) };

  beforeEach(async () => {
    vi.useFakeTimers();
    facade.registration.set(null);
    facade.error.set(null);
    facade.loadRegistration.mockReset();
    facade.loadRegistration.mockImplementation(() => of(pendingRegistration).pipe(tap((value) => facade.registration.set(value))));
    router.navigate.mockReset();
    router.navigate.mockImplementation(() => Promise.resolve(true));
    await TestBed.configureTestingModule({
      imports: [PendingActivationPageComponent],
      providers: [
        provideTranslateService(),
        { provide: ActivatedRoute, useValue: route },
        { provide: Router, useValue: router },
        { provide: SecurityFacade, useValue: facade }
      ]
    }).compileComponents();
  });

  afterEach(() => {
    fixture?.destroy();
    vi.useRealTimers();
  });

  it('captures the navigation token once, scrubs it with replaceUrl, and loads the pending registration', () => {
    fixture = TestBed.createComponent(PendingActivationPageComponent);
    fixture.detectChanges();

    expect(router.navigate).toHaveBeenCalledTimes(1);
    expect(router.navigate).toHaveBeenCalledWith([], {
      relativeTo: route,
      queryParams: { statusToken: null },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
    expect(facade.loadRegistration).toHaveBeenCalledTimes(1);
    expect(facade.loadRegistration).toHaveBeenCalledWith('registration-1', 'opaque-status-token');
    expect(facade.registration()).toEqual(pendingRegistration);
  });

  it('keeps polling in the active screen memory until a terminal status arrives', () => {
    const responses = [pendingRegistration, { ...pendingRegistration, status: 'ACTIVE' }];
    facade.loadRegistration.mockImplementation(() => of(responses.shift()!).pipe(tap((value) => facade.registration.set(value))));

    fixture = TestBed.createComponent(PendingActivationPageComponent);
    fixture.detectChanges();
    expect(facade.loadRegistration).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(PENDING_STATUS_POLL_INTERVAL_MS);
    expect(facade.loadRegistration).toHaveBeenCalledTimes(2);
    expect(facade.registration()?.status).toBe('ACTIVE');

    vi.advanceTimersByTime(PENDING_STATUS_POLL_INTERVAL_MS);
    expect(facade.loadRegistration).toHaveBeenCalledTimes(2);
  });
});
