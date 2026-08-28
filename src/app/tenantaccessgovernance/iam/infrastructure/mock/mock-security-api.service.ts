import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { PLATFORM_RUNTIME_CONFIG } from '../../../../core/security/runtime-config';
import { ActiveSession, Profile, Registration } from '../../domain/security.models';
import { SecurityApiPort } from '../../domain/ports/security-api.port';

const DEMO_NOW = '2026-08-26T10:00:00Z';

/** BC-01 local security adapter for profile/session screens in the demo runtime. */
@Injectable({ providedIn: 'root' })
export class MockSecurityApiService implements SecurityApiPort {
  private readonly config = inject(PLATFORM_RUNTIME_CONFIG);
  private profileValue: Profile = { userId: `mock-${this.config.tenantProfile}-operator`, email: this.config.tenantProfile === 'icisa' ? 'carlos@icisa.pe' : 'demo@generic.nexa.test', displayName: this.config.tenantProfile === 'icisa' ? 'Carlos ICISA' : 'Generic Demo Operator', phone: null, preferredLanguage: 'es', timezone: 'America/Lima', version: 1 };
  private readonly session: ActiveSession = { sessionId: `mock-${this.config.tenantProfile}-session-001`, surface: 'PLATFORM', createdAt: '2026-08-26T08:00:00Z', lastSeenAt: DEMO_NOW, expiresAt: '2026-08-27T08:00:00Z', current: true, deviceLabel: 'Nexa demo browser', coarseIp: '127.0.0.1' };

  profile(): Observable<Profile> { return of(this.profileValue); }
  updateProfile(value: { displayName: string; phone: string; preferredLanguage: string; timezone: string }): Observable<Profile> { this.profileValue = { ...this.profileValue, ...value, version: this.profileValue.version + 1 }; return of(this.profileValue); }
  changePassword(): Observable<void> { return of(void 0); }
  sessions(): Observable<{ sessions: ActiveSession[] }> { return of({ sessions: [this.session] }); }
  revokeSession(): Observable<void> { return of(void 0); }
  revokeOtherSessions(): Observable<void> { return of(void 0); }
  requestReset(): Observable<{ message: string }> { return of({ message: 'Password reset requested in demo mode.' }); }
  resetPassword(): Observable<void> { return of(void 0); }
  registerOrganization(): Observable<Registration> { return of({ registrationId: `mock-${this.config.tenantProfile}-registration-001`, status: 'PENDING_REVIEW', submittedAt: DEMO_NOW, statusToken: 'mock-status-token' }); }
  registration(id: string): Observable<Registration> { return of({ registrationId: id, status: 'PENDING_REVIEW', submittedAt: DEMO_NOW, statusToken: 'mock-status-token' }); }
}
