import { routes } from './app.routes';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

describe('Platform routes', () => {
  it('protects the fixed Platform surface and exposes the required aliases', () => {
    const shellRoute = routes.find((route) => route.path === '' && route.children);
    const children = shellRoute?.children ?? [];
    expect(routes.find((route) => route.path === 'sign-in')?.path).toBe('sign-in');
    expect(routes.find((route) => route.path === 'forbidden')?.path).toBe('forbidden');
    expect(typeof children.find((route) => route.path === '')?.redirectTo).toBe('function');
    expect(children.find((route) => route.path === 'overview')?.redirectTo).toBe('ops/overview');
    expect(children.find((route) => route.path === 'ops/catalog')?.redirectTo).toBe('ops/product-catalog');
    expect(children.some((route) => route.path === 'ops/product-catalog')).toBe(true);
    expect(children.find((route) => route.path === 'ops/executive-overview')?.canActivate).toBeTruthy();
    expect(shellRoute?.data?.['surface']).toBe('PLATFORM');
  });

  it('preserves dynamic request alias parameter', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const route = routes.find((candidate) => candidate.path === '' && candidate.children)?.children?.find((candidate) => candidate.path === 'ops/commercial/requests/:purchaseRequestId');
    const redirect = TestBed.runInInjectionContext(() => (route?.redirectTo as (data: unknown) => unknown)({ params: { purchaseRequestId: 'PR-123' } }));
    expect(String(redirect)).toContain('/ops/commercial/purchase-requests/PR-123');
  });
});
