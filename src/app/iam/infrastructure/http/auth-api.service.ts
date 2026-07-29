import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import {
  AuthSession,
  AuthenticatedUser,
  InternalRole,
  normalizeInternalRoles,
  SignInCommand
} from '../../domain/models/auth.models';
import { PLATFORM_RUNTIME_CONFIG, platformApiUrl } from '../../../core/security/runtime-config';

interface AuthApiUser {
  readonly id?: string;
  readonly subject?: string;
  readonly identifier?: string;
  readonly email?: string;
  readonly displayName?: string;
  readonly name?: string;
  readonly workspaceSlug?: string;
  readonly roles?: readonly string[];
  readonly authorities?: readonly string[];
}

interface AuthApiSessionResponse {
  readonly accessToken: string;
  readonly user?: AuthApiUser;
}

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(PLATFORM_RUNTIME_CONFIG);

  login(command: SignInCommand): Observable<AuthSession> {
    return this.http
      .post<AuthApiSessionResponse>(platformApiUrl(this.config, '/api/v1/auth/login'), command)
      .pipe(map((response) => this.toSession(response, command)));
  }

  refresh(): Observable<AuthSession> {
    return this.http
      .post<AuthApiSessionResponse>(platformApiUrl(this.config, '/api/v1/auth/refresh'), null, { withCredentials: true })
      .pipe(map((response) => this.toSession(response)));
  }

  private toSession(response: AuthApiSessionResponse, command?: SignInCommand): AuthSession {
    const user = response.user ?? {};
    const identifier = user.identifier ?? user.email ?? command?.identifier ?? '';
    const workspaceSlug = user.workspaceSlug ?? command?.workspaceSlug ?? '';
    const roles = normalizeInternalRoles([...(user.roles ?? []), ...(user.authorities ?? [])]);
    const authenticatedUser: AuthenticatedUser = {
      subject: user.subject ?? user.id ?? identifier,
      identifier,
      displayName: user.displayName ?? user.name ?? identifier,
      workspaceSlug,
      roles: roles as readonly InternalRole[]
    };

    return { accessToken: response.accessToken, user: authenticatedUser };
  }
}
