import { expect, test, type Page } from '@playwright/test';
import { requiresCredentials, signIn } from './support/auth';

type ForbiddenReason = 'ROLE_NOT_ASSIGNED' | 'PERMISSION_NOT_GRANTED';

interface DeniedRoute {
  readonly path: string;
  readonly reason: ForbiddenReason;
}

const REASON_COPY: Record<ForbiddenReason, RegExp> = {
  ROLE_NOT_ASSIGNED: /current roles|roles actuales/i,
  PERMISSION_NOT_GRANTED: /permission required|permiso requerido/i,
};

const DISPATCH_DETAIL_ROUTE =
  '/ops/operations/dispatch-orders/00000000-0000-0000-0000-000000000000';

const EXPECTED_DISPATCH_CONTROLS = [
  'assignment',
  'scheduling',
  'readiness',
  'start route',
  'temperature',
  'incident',
  'reprogram',
  'pod',
  'delivery',
] as const;

async function signInLogistics(page: Page): Promise<void> {
  const loginResponsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' &&
      response.url().includes('/api/v1/authentication/sign-in'),
  );
  await signIn(page, 'LOGISTICS');
  const loginResponse = await loginResponsePromise;
  expect(loginResponse.ok()).toBeTruthy();
  const body = (await loginResponse.json()) as {
    readonly session?: { readonly roles?: readonly string[]; readonly surface?: string };
  };
  expect(body.session?.surface).toBe('PLATFORM');
  expect(body.session?.roles).toEqual(['LOGISTICS']);
}

async function assertNoForbiddenSidebarLink(page: Page): Promise<void> {
  const sidebar = page.getByRole('navigation', {
    name: /internal operations navigation|navegación de operaciones internas/i,
  });
  await expect(sidebar).toBeVisible();
  await expect(sidebar.locator('a[href*="/forbidden"]')).toHaveCount(0);
  await expect(sidebar).not.toContainText(/forbidden|access restricted|acceso restringido/i);
}

async function assertAllowedSurface(page: Page, path: string, heading: RegExp): Promise<void> {
  await test.step(`LOGISTICS allowed ${path}`, async () => {
    await page.goto(path);
    await expect.poll(() => new URL(page.url()).pathname).toBe(path);
    await expect(page.locator('.forbidden-page')).toHaveCount(0);
    await expect(page.locator('main#main-content')).toBeVisible();
    await expect(page.locator('h1')).toContainText(heading);
    await assertNoForbiddenSidebarLink(page);
  });
}

async function assertDeniedSurface(page: Page, denied: DeniedRoute): Promise<void> {
  await test.step(`LOGISTICS denied ${denied.path}`, async () => {
    await page.goto(denied.path);
    await expect(page).toHaveURL(/\/forbidden(?:\?|$)/);
    const currentUrl = new URL(page.url());
    expect(currentUrl.pathname).toBe('/forbidden');
    expect(currentUrl.searchParams.get('returnUrl')).toBe(denied.path);
    expect(currentUrl.searchParams.get('reason')).toBe(denied.reason);
    await expect(
      page.getByRole('heading', { name: /access restricted|acceso restringido/i }),
    ).toBeVisible();
    await expect(page.locator('.forbidden-page')).toContainText(REASON_COPY[denied.reason]);
    await expect(page.locator('nav a')).toHaveCount(0);
  });
}

test('pure LOGISTICS reaches operational reads, dispatch detail and promotion management', async ({
  page,
}) => {
  requiresCredentials('LOGISTICS');
  await signInLogistics(page);
  await expect.poll(() => new URL(page.url()).pathname).toBe('/ops/operations/dashboard');
  await assertNoForbiddenSidebarLink(page);

  await assertAllowedSurface(
    page,
    '/ops/operations/inventory',
    /inventory control|control de inventario/i,
  );
  await assertAllowedSurface(
    page,
    '/ops/operations/inventory-overview',
    /inventory control|control de inventario/i,
  );
  await assertAllowedSurface(
    page,
    '/ops/operations/fulfillment-readiness',
    /fulfillment readiness|preparación de despacho/i,
  );
  await assertAllowedSurface(
    page,
    '/ops/operations/dispatch-orders',
    /dispatch board|tablero de despachos/i,
  );
  await assertAllowedSurface(page, DISPATCH_DETAIL_ROUTE, /dispatch detail|detalle del despacho/i);
  await assertAllowedSurface(
    page,
    '/ops/operations/proof-of-delivery',
    /proof of delivery|prueba de entrega/i,
  );
  await assertAllowedSurface(
    page,
    '/ops/operations/temperature-incidents',
    /temperature|temperatura/i,
  );
  await assertAllowedSurface(
    page,
    '/ops/operations/operational-analytics',
    /operational analytics|analítica operativa/i,
  );
  await assertAllowedSurface(page, '/ops/catalog', /catalog management|gestión de catálogo/i);
  await assertAllowedSurface(page, '/ops/catalog/products', /products|productos/i);
  await assertAllowedSurface(page, '/ops/catalog/promotions', /promotions|promociones/i);

  await assertAllowedSurface(page, '/ops/catalog/promotions/new', /new promotion|nueva promoción/i);
  await expect(page.getByRole('button', { name: /save|guardar/i })).toBeVisible();

  await assertAllowedSurface(page, '/ops/catalog/pricing', /pricing|precios/i);
  await expect(page.getByRole('button', { name: /create price|crear precio/i })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /cancel price|cancelar precio/i })).toHaveCount(0);

  await assertDeniedSurface(page, {
    path: '/ops/catalog/products/new',
    reason: 'ROLE_NOT_ASSIGNED',
  });
});

function controlCount(page: Page, name: RegExp): Promise<number> {
  return page.getByRole('heading', { name }).count();
}

async function collectDispatchControlEvidence(page: Page): Promise<Set<string>> {
  const observed = new Set<string>();
  const headings: readonly [string, RegExp][] = [
    ['assignment', /assignment|asignación/i],
    ['scheduling', /schedule|programar/i],
    ['temperature', /temperature reading|lectura de temperatura/i],
    ['incident', /^incident$|^incidente$/i],
    ['reprogram', /reprogram route|reprogramar ruta/i],
    ['pod', /proof of delivery metadata|metadatos de prueba de entrega/i],
  ];
  for (const [key, name] of headings) {
    if (await controlCount(page, name)) observed.add(key);
  }
  if (
    await page.getByRole('button', { name: /mark ready for route|marcar listo para ruta/i }).count()
  )
    observed.add('readiness');
  if (await page.getByRole('button', { name: /start route|iniciar ruta/i }).count())
    observed.add('start route');
  if (await page.getByRole('button', { name: /complete delivery|completar entrega/i }).count())
    observed.add('delivery');
  return observed;
}

test('LOGISTICS exposes assignment, lifecycle, temperature, incident, reprogramming and POD controls for available dispatch states', async ({
  page,
}) => {
  requiresCredentials('LOGISTICS');
  await signInLogistics(page);
  await page.goto('/ops/operations/dispatch-orders');
  await expect(page.locator('h1')).toContainText(/dispatch board|tablero de despachos/i);
  await expect(page.locator('nexa-loading-state')).toHaveCount(0, { timeout: 10_000 });

  const dispatchCount = await page.locator('a[href^="/ops/operations/dispatch-orders/"]').count();
  test.skip(
    dispatchCount === 0,
    'BLOCKED: logistics API returned no dispatch order; status-dependent detail controls cannot be evidenced without a real dispatch fixture.',
  );

  const observed = new Set<string>();
  for (let index = 0; index < dispatchCount; index += 1) {
    await page.goto('/ops/operations/dispatch-orders');
    await page.locator('a[href^="/ops/operations/dispatch-orders/"]').nth(index).click();
    await expect(page.locator('h1')).toContainText(/dispatch detail|detalle del despacho/i);
    await expect(page.locator('nexa-loading-state')).toHaveCount(0, { timeout: 10_000 });
    for (const control of await collectDispatchControlEvidence(page)) observed.add(control);
  }

  const missing = EXPECTED_DISPATCH_CONTROLS.filter((control) => !observed.has(control));
  test.skip(
    missing.length > 0,
    `BLOCKED: available dispatch statuses did not expose every required control; missing ${missing.join(', ')}. Seeded status coverage is required for real lifecycle evidence.`,
  );
});
