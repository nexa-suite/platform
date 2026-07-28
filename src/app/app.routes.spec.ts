import { routes } from './app.routes';

describe('Platform routes', () => {
  it('redirects the root and unknown paths to overview inside the shell', () => {
    const children = routes[0].children ?? [];
    expect(children.find((route) => route.path === '')?.redirectTo).toBe('overview');
    expect(children.find((route) => route.path === '**')?.redirectTo).toBe('overview');
    expect(children.some((route) => route.path === 'overview')).toBe(true);
  });
});
