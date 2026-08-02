import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { SecurityApiService } from '../infrastructure/security-api.service';
import { SecurityFacade } from './security.facade';

const profile = { userId: 'user-1', email: 'owner@icisa.example', displayName: 'Owner', phone: null, preferredLanguage: 'es', timezone: 'America/Lima', version: 2 };
const sessions = { sessions: [
  { sessionId: 'current', surface: 'PLATFORM', createdAt: '2026-08-01T00:00:00Z', lastSeenAt: '2026-08-01T01:00:00Z', expiresAt: '2026-08-02T00:00:00Z', current: true, deviceLabel: 'Desktop', coarseIp: null },
  { sessionId: 'other', surface: 'PORTAL', createdAt: '2026-07-31T00:00:00Z', lastSeenAt: '2026-07-31T01:00:00Z', expiresAt: '2026-08-02T00:00:00Z', current: false, deviceLabel: 'Phone', coarseIp: null },
] };

describe('SecurityFacade', () => {
  const api = {
    profile: vi.fn(), updateProfile: vi.fn(), changePassword: vi.fn(), sessions: vi.fn(), revokeSession: vi.fn(), revokeOtherSessions: vi.fn(),
    requestReset: vi.fn(), resetPassword: vi.fn(), registerOrganization: vi.fn(), registration: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
    api.profile.mockReturnValue(of(profile));
    api.updateProfile.mockReturnValue(of({ ...profile, displayName: 'Updated', version: 3 }));
    api.changePassword.mockReturnValue(of(undefined));
    api.sessions.mockReturnValue(of(sessions));
    api.revokeSession.mockReturnValue(of(undefined));
    api.revokeOtherSessions.mockReturnValue(of(undefined));
    api.requestReset.mockReturnValue(of({ message: 'generic' }));
    api.resetPassword.mockReturnValue(of(undefined));
    api.registerOrganization.mockReturnValue(of({ registrationId: 'registration-1', status: 'PENDING_ACTIVATION', submittedAt: '2026-08-01T00:00:00Z', statusToken: 'opaque-status-token' }));
    api.registration.mockReturnValue(of({ registrationId: 'registration-1', status: 'PENDING_ACTIVATION', submittedAt: '2026-08-01T00:00:00Z', statusToken: 'opaque-status-token' }));
    TestBed.configureTestingModule({ providers: [SecurityFacade, { provide: SecurityApiService, useValue: api }] });
  });

  it('loads and updates the optimistic-concurrency profile', () => {
    const facade = TestBed.inject(SecurityFacade);
    facade.loadProfile().subscribe();
    facade.saveProfile({ displayName: 'Updated', phone: '', preferredLanguage: 'es', timezone: 'America/Lima' }, 2).subscribe();
    expect(api.updateProfile).toHaveBeenCalledWith({ displayName: 'Updated', phone: '', preferredLanguage: 'es', timezone: 'America/Lima' }, 2);
    expect(facade.profile()?.displayName).toBe('Updated');
    expect(facade.message()).toBe('iamSecurity.profileSaved');
  });

  it('loads sessions and removes a revoked session without hiding the current session', () => {
    const facade = TestBed.inject(SecurityFacade);
    facade.loadSessions().subscribe();
    facade.revokeSession('other').subscribe();
    expect(facade.sessions().map((item) => item.sessionId)).toEqual(['current']);
    facade.loadSessions().subscribe();
    facade.revokeOthers().subscribe();
    expect(facade.sessions().map((item) => item.sessionId)).toEqual(['current']);
  });

  it('keeps generic reset and password-change results in translated state', () => {
    const facade = TestBed.inject(SecurityFacade);
    facade.changePassword('current', 'new-password-long-enough').subscribe();
    expect(facade.message()).toBe('iamSecurity.passwordChanged');
    facade.requestReset('unknown@example.invalid').subscribe();
    expect(facade.message()).toBe('iamSecurity.resetRequested');
    facade.resetPassword('opaque-token', 'new-password-long-enough').subscribe();
    expect(facade.message()).toBe('iamSecurity.resetCompleted');
  });

  it('stores submitted onboarding and pending registration state', () => {
    const facade = TestBed.inject(SecurityFacade);
    facade.register({ workspaceSlug: 'icisa' }).subscribe();
    expect(facade.registration()?.status).toBe('PENDING_ACTIVATION');
    expect(facade.registration()).not.toHaveProperty('statusToken');
    facade.loadRegistration('registration-1', 'status-token').subscribe();
    expect(api.registration).toHaveBeenCalledWith('registration-1', 'status-token');
    expect(facade.registration()).not.toHaveProperty('statusToken');
  });

  it('exposes a recoverable translated error without backend details', () => {
    api.profile.mockReturnValue(throwError(() => new Error('secret backend detail')));
    const facade = TestBed.inject(SecurityFacade);
    facade.loadProfile().subscribe({ error: () => undefined });
    expect(facade.error()).toBe('iamSecurity.error');
    expect(facade.error()).not.toContain('secret');
  });
});
