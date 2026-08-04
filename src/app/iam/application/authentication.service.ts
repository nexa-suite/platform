import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, map, of, switchMap, tap, throwError } from 'rxjs';
import { INITIAL_AUTH_STATE, AuthSession, AuthState, AuthStatus, AuthenticatedUser, SignInCommand } from '../domain/models/auth.models';
import { AuthApiService } from '../infrastructure/http/auth-api.service';
import { AccessTokenStore } from '../infrastructure/token/access-token.store';
import { AuthLifecycleChannel } from '../../core/security/auth-lifecycle.channel';

@Injectable({ providedIn: 'root' })
export class AuthenticationService {
  private readonly api = inject(AuthApiService);
  private readonly tokenStore = inject(AccessTokenStore);
  private readonly lifecycle = inject(AuthLifecycleChannel);
  private readonly router = inject(Router, { optional: true });
  private readonly stateSignal = signal<AuthState>(INITIAL_AUTH_STATE);

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
  readonly hasPermission = (permission: string): boolean => {
    const required = permission.trim().toLowerCase();
    return this.currentUser()?.permissions.some((candidate) => {
      const normalized = candidate.trim().toLowerCase();
      return normalized === required || normalized.replaceAll('.', ':') === required.replaceAll('.', ':');
    }) ?? false;
  };

  restore(): Observable<void> {
    this.stateSignal.set({ status: 'restoring', user: null, message: null });
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

  signIn(command: SignInCommand): Observable<AuthenticatedUser> {
    this.stateSignal.set({ status: 'authenticating', user: null, message: null });

    return this.api.login(command).pipe(
      switchMap((session) => this.api.currentSession(session.accessToken)),
      tap((session) => this.acceptSession(session)),
      map((session) => session.user),
      catchError((error: unknown) => {
        this.tokenStore.clear();
        this.stateSignal.set({ status: 'error', user: null, message: 'SIGN_IN_FAILED' });
        return throwError(() => error);
      })
    );
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
    this.tokenStore.write(session.accessToken);
    this.stateSignal.set({ status: 'authenticated', user: session.user, message: null });
  }

  private clearLocalSession(message: string | null = null): void {
    this.tokenStore.clear();
    this.stateSignal.set({ status: 'anonymous', user: null, message });
  }
}
