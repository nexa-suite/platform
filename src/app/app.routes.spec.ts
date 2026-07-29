import { routes } from './app.routes';

describe('Platform routes', () => {
  it('protects the fixed Platform surface and exposes the required aliases', () => {
    const children = routes[0].children ?? [];
    expect(routes.find((route) => route.path === 'sign-in')?.path).toBe('sign-in');
    expect(routes.find((route) => route.path === 'forbidden')?.path).toBe('forbidden');
    expect(children.find((route) => route.path === '')?.redirectTo).toBe('ops/overview');
    expect(children.find((route) => route.path === 'overview')?.redirectTo).toBe('ops/overview');
    expect(children.find((route) => route.path === 'ops/catalog')?.redirectTo).toBe('ops/product-catalog');
    expect(children.some((route) => route.path === 'ops/product-catalog')).toBe(true);
    expect(routes.find((route) => route.path === '')?.data?.['surface']).toBe('PLATFORM');
  });
});
