import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthenticationService } from '../../iam/application/authentication.service';
import { catalogReadGuard, catalogManageGuard, promotionManageGuard } from './catalog-access.guard';

const route = {} as never;
const routerState = { url: '/ops/catalog' } as never;

describe('catalog access guards', () => {
  const authentication = {
    status: vi.fn(),
    currentUser: vi.fn(),
    hasPermission: vi.fn(),
    markForbidden: vi.fn()
  };

  beforeEach(() => {
    vi.resetAllMocks();
    authentication.status.mockReturnValue('authenticated');
    authentication.currentUser.mockReturnValue({
      subject: 'user-1',
      identifier: 'user@nexa.test',
      displayName: 'User',
      workspaceSlug: 'icisa',
      roles: ['SALES'],
      permissions: ['catalog:read']
    });
    authentication.hasPermission.mockImplementation((permission: string) => permission === 'catalog:read');
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthenticationService, useValue: authentication }]
    });
  });

  it('allows catalog read when the backend session contains catalog:read', () => {
    authentication.currentUser.mockReturnValue({ roles: ['TENANT_ADMIN'], permissions: ['catalog:read'] });
    authentication.hasPermission.mockReturnValue(true);

    const result = TestBed.runInInjectionContext(() => catalogReadGuard(route, routerState));

    expect(result).toBe(true);
  });

  it('blocks a session that lacks the required backend permission', () => {
    authentication.currentUser.mockReturnValue({ roles: ['SALES'], permissions: [] });
    authentication.hasPermission.mockReturnValue(false);

    const result = TestBed.runInInjectionContext(() => catalogReadGuard(route, routerState));

    expect(result).not.toBe(true);
    expect(authentication.markForbidden).toHaveBeenCalled();
  });

  it('allows product management when the backend session contains catalog:manage', () => {
    authentication.currentUser.mockReturnValue({ roles: ['WAREHOUSE'], permissions: ['catalog:manage'] });
    authentication.hasPermission.mockReturnValue(true);
    expect(TestBed.runInInjectionContext(() => catalogManageGuard(route, routerState))).toBe(true);

    authentication.hasPermission.mockReturnValue(false);
    expect(TestBed.runInInjectionContext(() => catalogManageGuard(route, routerState))).not.toBe(true);
  });

  it('allows promotion management to logistics without granting product management', () => {
    authentication.currentUser.mockReturnValue({ roles: ['LOGISTICS'], permissions: ['promotion:manage'] });
    authentication.hasPermission.mockImplementation((permission: string) => permission === 'promotion:manage');
    expect(TestBed.runInInjectionContext(() => promotionManageGuard(route, routerState))).toBe(true);
    expect(TestBed.runInInjectionContext(() => catalogManageGuard(route, routerState))).not.toBe(true);
  });
});
