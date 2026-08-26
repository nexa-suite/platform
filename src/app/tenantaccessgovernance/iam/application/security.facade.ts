import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, tap, throwError } from 'rxjs';
import { ActiveSession, Profile, Registration } from '../domain/security.models';
import { SecurityApiPort } from '../domain/ports/security-api.port';

@Injectable({ providedIn: 'root' })
export class SecurityFacade {
  private readonly api = inject(SecurityApiPort);
  readonly profile = signal<Profile | null>(null);
  readonly sessions = signal<readonly ActiveSession[]>([]);
  readonly registration = signal<Registration | null>(null);
  readonly busy = signal(false);
  readonly message = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly hasSessions = computed(() => this.sessions().length > 0);
  private run<T>(request: () => import('rxjs').Observable<T>) {
    this.busy.set(true); this.error.set(null);
    return request().pipe(tap(() => this.busy.set(false)), catchError((error: unknown) => { this.busy.set(false); this.error.set('iamSecurity.error'); return throwError(() => error); }));
  }
  loadProfile() { return this.run(() => this.api.profile()).pipe(tap((value) => this.profile.set(value))); }
  saveProfile(value: { displayName: string; phone: string; preferredLanguage: string; timezone: string }, version: number) { return this.run(() => this.api.updateProfile(value, version)).pipe(tap((result) => { this.profile.set(result); this.message.set('iamSecurity.profileSaved'); })); }
  changePassword(current: string, next: string) { return this.run(() => this.api.changePassword(current, next)).pipe(tap(() => this.message.set('iamSecurity.passwordChanged'))); }
  loadSessions() { return this.run(() => this.api.sessions()).pipe(tap((result) => this.sessions.set(result.sessions))); }
  revokeSession(id: string) { return this.run(() => this.api.revokeSession(id)).pipe(tap(() => this.sessions.update((items) => items.filter((item) => item.sessionId !== id)))); }
  revokeOthers() { return this.run(() => this.api.revokeOtherSessions()).pipe(tap(() => this.sessions.update((items) => items.filter((item) => item.current)))); }
  requestReset(email: string) { return this.run(() => this.api.requestReset(email)).pipe(tap(() => this.message.set('iamSecurity.resetRequested'))); }
  resetPassword(token: string, next: string) { return this.run(() => this.api.resetPassword(token, next)).pipe(tap(() => this.message.set('iamSecurity.resetCompleted'))); }
  register(value: unknown) { return this.run(() => this.api.registerOrganization(value)).pipe(tap((result) => { this.registration.set(this.safeRegistration(result)); this.message.set('iamSecurity.registrationSubmitted'); })); }
  loadRegistration(id: string, statusToken: string) { return this.run(() => this.api.registration(id, statusToken)).pipe(tap((value) => this.registration.set(this.safeRegistration(value)))); }
  clearMessages() { this.message.set(null); this.error.set(null); }

  private safeRegistration(value: Registration): Registration {
    return { registrationId: value.registrationId, status: value.status, submittedAt: value.submittedAt };
  }
}
