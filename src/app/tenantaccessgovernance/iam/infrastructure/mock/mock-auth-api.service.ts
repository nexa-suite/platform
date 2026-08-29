import { inject, Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { PLATFORM_RUNTIME_CONFIG } from '../../../../core/security/runtime-config';
import { AuthSession, AuthenticationResult, SignInCommand, WorkspacePreview } from '../../domain/models/auth.models';
import { AuthApiPort } from '../../domain/ports/auth-api.port';
import { MOCK_AUTH_FIXTURES, MOCK_AUTH_ROLE_FIXTURES, MockAuthFixture } from './mock-auth.fixtures';

/** BC-01 demo adapter. It deliberately has no HTTP dependency. */
@Injectable({ providedIn: 'root' })
export class MockAuthApiService implements AuthApiPort {
  private readonly config = inject(PLATFORM_RUNTIME_CONFIG);
  private active = this.hasPersistedSession();
  private pendingChallengeId: string | null = null;

  login(command: SignInCommand): Observable<AuthenticationResult> {
    const fixture = this.fixture();
    const matches = command.identifier.trim().toLowerCase() === fixture.identifier &&
      command.password === fixture.password &&
      command.workspaceSlug.trim().toLowerCase() === fixture.workspaceSlug;

    this.active = false;
    this.persistSession(false);
    this.pendingChallengeId = matches ? fixture.twoFactorChallenge.challengeId : null;

    return matches
      ? of({ twoFactorRequired: true, challenge: fixture.twoFactorChallenge })
      : throwError(() => new Error('MOCK_AUTHENTICATION_FAILED'));
  }

  verifyTwoFactor(challengeId: string, code: string): Observable<AuthSession> {
    const fixture = this.fixture();
    if (challengeId !== this.pendingChallengeId || code.trim() !== fixture.twoFactorCode) {
      return throwError(() => new Error('MOCK_TWO_FACTOR_FAILED'));
    }
    this.pendingChallengeId = null;
    this.active = true;
    this.persistSession(true);
    return of(fixture.session);
  }

  workspacePreview(workspaceSlug: string): Observable<WorkspacePreview> {
    const fixture = this.fixture();
    return of(workspaceSlug.trim().toLowerCase() === fixture.workspaceSlug
      ? fixture.workspacePreview
      : { recognized: false, displayName: null, workspaceUrl: null, logoUrl: null, loginAvailable: false });
  }

  refresh(): Observable<AuthSession> {
    return this.active && this.hasPersistedSession()
      ? of(this.fixture().session)
      : throwError(() => new Error('MOCK_SESSION_NOT_FOUND'));
  }

  currentSession(accessToken: string): Observable<AuthSession> {
    return this.active && this.hasPersistedSession() && accessToken === this.fixture().session.accessToken
      ? of(this.fixture().session)
      : throwError(() => new Error('MOCK_SESSION_NOT_FOUND'));
  }

  signOut(_accessToken: string | null): Observable<void> {
    this.active = false;
    this.persistSession(false);
    this.pendingChallengeId = null;
    return of(void 0);
  }

  private fixture(): MockAuthFixture {
    const roleProfile = this.config.demoRoleProfile ?? 'sales';
    return MOCK_AUTH_ROLE_FIXTURES[this.config.tenantProfile][roleProfile] ?? MOCK_AUTH_FIXTURES[this.config.tenantProfile];
  }

  private hasPersistedSession(): boolean {
    return typeof sessionStorage !== 'undefined'
      && sessionStorage.getItem('nexa.platform.mock.session.active') === 'true';
  }

  private persistSession(active: boolean): void {
    if (typeof sessionStorage === 'undefined') return;
    if (active) sessionStorage.setItem('nexa.platform.mock.session.active', 'true');
    else sessionStorage.removeItem('nexa.platform.mock.session.active');
  }
}
