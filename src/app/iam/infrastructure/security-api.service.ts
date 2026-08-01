import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { platformApiUrl, PLATFORM_RUNTIME_CONFIG } from '../../core/security/runtime-config';
import { ActiveSession, Profile, Registration } from '../domain/security.models';

@Injectable({ providedIn: 'root' })
export class SecurityApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(PLATFORM_RUNTIME_CONFIG);
  private url(path: string): string { return platformApiUrl(this.config, path); }
  profile(): Observable<Profile> { return this.http.get<Profile>(this.url('/api/v1/me/profile')); }
  updateProfile(value: { displayName: string; phone: string; preferredLanguage: string; timezone: string }, version: number): Observable<Profile> {
    return this.http.patch<Profile>(this.url('/api/v1/me/profile'), value, { headers: { 'If-Match': `"${version}"` } });
  }
  changePassword(currentPassword: string, newPassword: string): Observable<void> { return this.http.post<void>(this.url('/api/v1/me/password-changes'), { currentPassword, newPassword }); }
  sessions(): Observable<{ sessions: ActiveSession[] }> { return this.http.get<{ sessions: ActiveSession[] }>(this.url('/api/v1/me/sessions')); }
  revokeSession(sessionId: string): Observable<void> { return this.http.delete<void>(this.url(`/api/v1/me/sessions/${sessionId}`)); }
  revokeOtherSessions(): Observable<void> { return this.http.post<void>(this.url('/api/v1/me/session-revocations'), {}); }
  requestReset(email: string): Observable<{ message: string }> { return this.http.post<{ message: string }>(this.url('/api/v1/auth/password-reset-requests'), { email, surface: 'PLATFORM' }); }
  resetPassword(token: string, newPassword: string): Observable<void> { return this.http.post<void>(this.url('/api/v1/auth/password-resets'), { token, newPassword }); }
  registerOrganization(value: unknown): Observable<Registration> { return this.http.post<Registration>(this.url('/api/v1/tenant-management/organization-registrations'), value); }
  registration(id: string): Observable<Registration> { return this.http.get<Registration>(this.url(`/api/v1/tenant-management/organization-registrations/${id}`)); }
}
