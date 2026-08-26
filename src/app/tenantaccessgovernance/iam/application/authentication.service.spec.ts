import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { of, throwError } from 'rxjs';
import { AuthenticationService } from './authentication.service';
import { AuthApiPort } from '../domain/ports/auth-api.port';
import { AccessTokenPort } from '../domain/ports/access-token.port';
import { AuthSession, SignInCommand } from '../domain/models/auth.models';

const session: AuthSession = {
  accessToken: 'token-in-memory',
  user: {
    subject: 'user-1',
    identifier: 'carlos@icisa.pe',
    displayName: 'Carlos',
    workspaceSlug: 'icisa',
    roles: ['SALES'],
    permissions: ['sales:write']
  }
};

describe('AuthenticationService', () => {
  const api = { login: vi.fn(), currentSession: vi.fn(), refresh: vi.fn(), signOut: vi.fn() };
  let storedToken: string | null;
  const tokenStore = {
    read: () => storedToken,
    write: (token: string) => { storedToken = token; },
    clear: () => { storedToken = null; }
  };
  let service: AuthenticationService;

  beforeEach(() => {
    vi.resetAllMocks();
    storedToken = null;
    TestBed.configureTestingModule({ providers: [AuthenticationService, { provide: AuthApiPort, useValue: api }, { provide: AccessTokenPort, useValue: tokenStore }] });
    service = TestBed.inject(AuthenticationService);
  });

  it('restores to anonymous without reading persistent storage', () => {
    expect(service.status()).toBe('unknown');
    api.refresh.mockReturnValue(throwError(() => new Error('no refresh cookie')));
    service.restore().subscribe();
    expect(service.status()).toBe('anonymous');
    expect(service.accessToken()).toBeNull();
  });

  it('authenticates the internal user and stores only the access token', () => {
    const command: SignInCommand = { identifier: 'carlos@icisa.pe', password: 'password', workspaceSlug: 'icisa' };
    api.login.mockReturnValue(of(session));
    api.currentSession.mockReturnValue(of(session));

    expect(service.status()).toBe('unknown');
    service.signIn(command).subscribe();

    expect(service.status()).toBe('authenticated');
    expect(service.currentUser()?.workspaceSlug).toBe('icisa');
    expect(service.accessToken()).toBe('token-in-memory');
    expect(api.login).toHaveBeenCalledWith(command);
  });

  it('moves to error without exposing the backend error', () => {
    api.login.mockReturnValue(throwError(() => new Error('secret backend detail')));

    service.signIn({ identifier: 'user', password: 'password', workspaceSlug: 'icisa' }).subscribe({ error: () => undefined });

    expect(service.status()).toBe('error');
    expect(service.state().message).toBe('SIGN_IN_FAILED');
    expect(service.state().message).not.toContain('secret');
  });

  it('revokes the server session and clears the local session on logout', () => {
    api.login.mockReturnValue(of(session));
    api.currentSession.mockReturnValue(of(session));
    api.signOut.mockReturnValue(of(undefined));
    service.signIn({ identifier: 'carlos@icisa.pe', password: 'password', workspaceSlug: 'icisa' }).subscribe();

    service.signOut().subscribe();

    expect(api.signOut).toHaveBeenCalledWith('token-in-memory');
    expect(service.status()).toBe('anonymous');
    expect(service.accessToken()).toBeNull();
  });
});
