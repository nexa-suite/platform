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
  readonly userId?: string;
  readonly displayName?: string;
  readonly email?: string;
  readonly preferredLanguage?: string;
  readonly workspaceSlug?: string;
  readonly role?: string;
}

interface AuthApiSessionResponse {
  readonly accessToken: string;
  readonly session?: AuthApiUser;
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
        setHeaders: { 'X-Nexa-Surface': this.config.surface }
      })
      .pipe(map((response) => this.toSession(response)));
  }

  signOut(accessToken: string | null): Observable<void> {
    const headers: Record<string, string> = { 'X-Nexa-Surface': this.config.surface };
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    return this.http.post<void>(platformApiUrl(this.config, '/api/v1/authentication/sign-out'), null, {
      withCredentials: true,
      setHeaders: headers
    });
  }

  private toSession(response: AuthApiSessionResponse, command?: SignInCommand): AuthSession {
    const user = response.session ?? {};
    const identifier = user.email ?? command?.identifier ?? '';
    const workspaceSlug = user.workspaceSlug ?? command?.workspaceSlug ?? '';
    const roles = normalizeInternalRoles(user.role ? [user.role] : []);
    const authenticatedUser: AuthenticatedUser = {
      subject: user.userId ?? identifier,
      identifier,
      displayName: user.displayName ?? identifier,
      workspaceSlug,
      roles: roles as readonly InternalRole[]
    };

    return { accessToken: response.accessToken, user: authenticatedUser };
  }
}
