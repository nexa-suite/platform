import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, map, of, switchMap, tap, throwError } from 'rxjs';
import { INITIAL_AUTH_STATE, AuthSession, AuthState, AuthStatus, AuthenticatedUser, SignInCommand, TwoFactorChallenge, isTwoFactorChallenge } from '../domain/models/auth.models';
import { AuthApiPort } from '../domain/ports/auth-api.port';
import { AccessTokenPort } from '../domain/ports/access-token.port';
import { AuthLifecycleChannel } from '../../../core/security/auth-lifecycle.channel';

@Injectable({ providedIn: 'root' })
export class AuthenticationService {
  private readonly api = inject(AuthApiPort);
  private readonly tokenStore = inject(AccessTokenPort);
  private readonly lifecycle = inject(AuthLifecycleChannel);
  private readonly router = inject(Router, { optional: true });
  private readonly stateSignal = signal<AuthState>(INITIAL_AUTH_STATE);
  private readonly twoFactorChallengeSignal = signal<TwoFactorChallenge | null>(null);

  constructor() {
    this.lifecycle.events.subscribe(() => {
      this.clearLocalSession();
      void this.router?.navigateByUrl('/sign-in', { replaceUrl: true });
    });
  }

  readonly state = this.stateSignal.asReadonly();
  readonly status = computed<AuthStatus>(() => this.stateSignal().status);
  readonly currentUser = computed<AuthenticatedUser | null>(() => this.stateSignal().user);
  readonly isAuthenticated = computed(() => this.stateSignal().status === 'authenticated');
  readonly twoFactorChallenge = this.twoFactorChallengeSignal.asReadonly();
  readonly hasPermission = (permission: string): boolean => {
    const required = permission.trim().toLowerCase();
    return this.currentUser()?.permissions.some((candidate) => {
      const normalized = candidate.trim().toLowerCase();
      return normalized === required || normalized.replaceAll('.', ':') === required.replaceAll('.', ':');
    }) ?? false;
  };

  workspacePreview(workspaceSlug: string) {
    return this.api.workspacePreview(workspaceSlug);
  }

  restore(): Observable<void> {
    this.stateSignal.set({ status: 'restoring', user: null, message: null });
    this.twoFactorChallengeSignal.set(null);
    this.tokenStore.clear();
    return this.api.refresh().pipe(
      switchMap((session) => this.api.currentSession(session.accessToken)),
      tap((session) => this.acceptSession(session)),
      map(() => undefined),
      catchError(() => {
        this.tokenStore.clear();
        this.stateSignal.set({ status: 'anonymous', user: null, message: null });
        return of(undefined);
      })
    );
  }

  signIn(command: SignInCommand): Observable<AuthenticatedUser | null> {
    this.stateSignal.set({ status: 'authenticating', user: null, message: null });
    this.twoFactorChallengeSignal.set(null);

    return this.api.login(command).pipe(
      switchMap((result) => {
        if (isTwoFactorChallenge(result)) {
          this.twoFactorChallengeSignal.set(result.challenge);
          this.stateSignal.set({ status: 'two-factor-challenge', user: null, message: null });
          return of(null);
        }
        return this.api.currentSession(result.accessToken).pipe(
          tap((session) => this.acceptSession(session)),
          map((session) => session.user),
        );
      }),
      catchError((error: unknown) => {
        this.tokenStore.clear();
        this.stateSignal.set({ status: 'error', user: null, message: 'SIGN_IN_FAILED' });
        return throwError(() => error);
      })
    );
  }

  verifyTwoFactor(code: string): Observable<AuthenticatedUser> {
    const challenge = this.twoFactorChallengeSignal();
    if (!challenge) return throwError(() => new Error('NO_PENDING_TWO_FACTOR_CHALLENGE'));
    this.stateSignal.set({ status: 'verifying-two-factor', user: null, message: null });
    return this.api.verifyTwoFactor(challenge.challengeId, code.trim()).pipe(
      tap((session) => this.acceptSession(session)),
      map((session) => session.user),
      catchError((error: unknown) => {
        this.stateSignal.set({ status: 'two-factor-challenge', user: null, message: 'TWO_FACTOR_FAILED' });
        return throwError(() => error);
      }),
    );
  }

  cancelTwoFactor(): void {
    this.clearLocalSession();
  }

  refreshAccessToken(): Observable<string> {
    return this.api.refresh().pipe(
      tap((session) => this.acceptSession(session)),
      map((session) => session.accessToken),
      catchError((error: unknown) => {
        this.expireSession();
        return throwError(() => error);
      })
    );
  }

  hasAccessToken(): boolean {
    return this.tokenStore.read() !== null;
  }

  accessToken(): string | null {
    return this.tokenStore.read();
  }

  markForbidden(): void {
    this.stateSignal.update((current) => ({ ...current, status: 'forbidden', message: null }));
  }

  expireSession(): void {
    this.clearLocalSession('SESSION_EXPIRED');
    this.lifecycle.broadcastLogout();
    void this.router?.navigateByUrl('/sign-in', { replaceUrl: true });
  }

  signOut(): Observable<void> {
    const accessToken = this.tokenStore.read();
    this.stateSignal.set({ status: 'signingOut', user: null, message: null });
    return this.api.signOut(accessToken).pipe(
      catchError(() => of(void 0)),
      tap(() => {
        this.clearLocalSession();
        this.lifecycle.broadcastLogout();
      }),
      map(() => undefined),
    );
  }

  private acceptSession(session: AuthSession): void {
    this.twoFactorChallengeSignal.set(null);
    this.tokenStore.write(session.accessToken);
    this.stateSignal.set({ status: 'authenticated', user: session.user, message: null });
  }

  private clearLocalSession(message: string | null = null): void {
    this.twoFactorChallengeSignal.set(null);
    this.tokenStore.clear();
    this.stateSignal.set({ status: 'anonymous', user: null, message });
  }
}
