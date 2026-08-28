import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map, throwError } from 'rxjs';
import {
  AuthSession,
  AuthenticationResult,
  AuthenticatedUser,
  InternalRole,
  normalizeInternalRoles,
  normalizePermissions,
  normalizeRoleCodes,
  SignInCommand,
  WorkspacePreview
} from '../../domain/models/auth.models';
import { AuthApiPort } from '../../domain/ports/auth-api.port';
import { PLATFORM_RUNTIME_CONFIG, platformApiUrl } from '../../../../core/security/runtime-config';

interface AuthApiUser {
  readonly userId?: string;
  readonly displayName?: string;
  readonly email?: string;
  readonly preferredLanguage?: string;
  readonly workspaceSlug?: string;
  readonly roles?: readonly string[];
  readonly permissions?: readonly string[];
  readonly roleDefinitionIds?: readonly string[];
  readonly authorizationVersion?: number;
  readonly tenantId?: string;
  readonly tenantSlug?: string;
  readonly workspaceId?: string;
  readonly membershipId?: string;
}

interface AuthApiSessionResponse {
  readonly accessToken: string;
  readonly session?: AuthApiUser;
}

interface AuthApiCurrentSessionResponse {
  readonly user: AuthApiUser;
  readonly tenant: { readonly tenantId: string; readonly tenantSlug: string };
  readonly workspace: { readonly workspaceId: string; readonly workspaceSlug: string };
  readonly membership: { readonly membershipId: string; readonly roles: readonly string[]; readonly permissions: readonly string[]; readonly roleDefinitionIds?: readonly string[]; readonly authorizationVersion?: number };
  readonly surface: string;
}

@Injectable({ providedIn: 'root' })
export class AuthApiService implements AuthApiPort {
  private readonly http = inject(HttpClient);
  private readonly config = inject(PLATFORM_RUNTIME_CONFIG);

  login(command: SignInCommand): Observable<AuthenticationResult> {
    return this.http
      .post<AuthApiSessionResponse>(platformApiUrl(this.config, '/api/v1/authentication/sign-in'),
        { ...command, surface: this.config.surface }, { withCredentials: true })
      .pipe(map((response) => this.toSession(response, command)));
  }

  verifyTwoFactor(_challengeId: string, _code: string): Observable<AuthSession> {
    // The current API contract does not publish a second-factor endpoint yet.
    return throwError(() => new Error('TWO_FACTOR_BACKEND_UNAVAILABLE'));
  }

  workspacePreview(workspaceSlug: string): Observable<WorkspacePreview> {
    return this.http.post<WorkspacePreview>(platformApiUrl(this.config, '/api/v1/auth/workspace-previews'), { workspaceSlug });
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
        tenantId: response.tenant.tenantId,
        tenantSlug: response.tenant.tenantSlug,
        workspaceId: response.workspace.workspaceId,
        membershipId: response.membership.membershipId,
        roles: response.membership.roles,
        permissions: response.membership.permissions,
        roleDefinitionIds: response.membership.roleDefinitionIds,
        authorizationVersion: response.membership.authorizationVersion
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
      permissions: normalizePermissions(user.permissions),
      ...(user.roles?.length ? { roleCodes: normalizeRoleCodes(user.roles) } : {}),
      ...(user.roleDefinitionIds?.length ? { roleDefinitionIds: [...user.roleDefinitionIds] } : {}),
      ...(user.tenantId ? { tenantId: user.tenantId } : {}),
      ...(user.tenantSlug ? { tenantSlug: user.tenantSlug } : {}),
      ...(user.workspaceId ? { workspaceId: user.workspaceId } : {}),
      ...(user.membershipId ? { membershipId: user.membershipId } : {}),
      ...(user.authorizationVersion !== undefined ? { authorizationVersion: user.authorizationVersion } : {})
    };

    return { accessToken: response.accessToken, user: authenticatedUser };
  }
}
