import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import {
  AuthSession,
  AuthenticatedUser,
  InternalRole,
  normalizeInternalRoles,
  normalizePermissions,
  SignInCommand
} from '../../domain/models/auth.models';
import { PLATFORM_RUNTIME_CONFIG, platformApiUrl } from '../../../core/security/runtime-config';

interface AuthApiUser {
  readonly userId?: string;
  readonly displayName?: string;
  readonly email?: string;
  readonly preferredLanguage?: string;
  readonly workspaceSlug?: string;
  readonly roles?: readonly string[];
  readonly permissions?: readonly string[];
}

interface AuthApiSessionResponse {
  readonly accessToken: string;
  readonly session?: AuthApiUser;
}

interface AuthApiCurrentSessionResponse {
  readonly user: AuthApiUser;
  readonly tenant: { readonly tenantId: string; readonly tenantSlug: string };
  readonly workspace: { readonly workspaceId: string; readonly workspaceSlug: string };
  readonly membership: { readonly membershipId: string; readonly roles: readonly string[]; readonly permissions: readonly string[] };
  readonly surface: string;
}

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(PLATFORM_RUNTIME_CONFIG);

  login(command: SignInCommand): Observable<AuthSession> {
    return this.http
      .post<AuthApiSessionResponse>(platformApiUrl(this.config, '/api/v1/authentication/sign-in'),
        { ...command, surface: this.config.surface }, { withCredentials: true })
      .pipe(map((response) => this.toSession(response, command)));
  }

  refresh(): Observable<AuthSession> {
    return this.http
      .post<AuthApiSessionResponse>(platformApiUrl(this.config, '/api/v1/authentication/refresh'), null, {
        withCredentials: true,
        headers: { 'X-Nexa-Surface': this.config.surface }
      })
      .pipe(map((response) => this.toSession(response)));
  }

  currentSession(accessToken: string): Observable<AuthSession> {
    return this.http.get<AuthApiCurrentSessionResponse>(platformApiUrl(this.config, '/api/v1/session'), {
      headers: { Authorization: `Bearer ${accessToken}` }
    }).pipe(map((response) => this.toSession({
      accessToken,
      session: {
        ...response.user,
        workspaceSlug: response.workspace.workspaceSlug,
        roles: response.membership.roles,
        permissions: response.membership.permissions
      }
    })));
  }

  signOut(accessToken: string | null): Observable<void> {
    const headers: Record<string, string> = { 'X-Nexa-Surface': this.config.surface };
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
    return this.http.post<void>(platformApiUrl(this.config, '/api/v1/authentication/sign-out'), null, {
      withCredentials: true,
      headers
    });
  }

  private toSession(response: AuthApiSessionResponse, command?: SignInCommand): AuthSession {
    const user = response.session ?? {};
    const identifier = user.email ?? command?.identifier ?? '';
    const workspaceSlug = user.workspaceSlug ?? command?.workspaceSlug ?? '';
    const roles = normalizeInternalRoles(user.roles);
    const authenticatedUser: AuthenticatedUser = {
      subject: user.userId ?? identifier,
      identifier,
      displayName: user.displayName ?? identifier,
      workspaceSlug,
      roles: roles as readonly InternalRole[],
      permissions: normalizePermissions(user.permissions)
    };

    return { accessToken: response.accessToken, user: authenticatedUser };
  }
}
