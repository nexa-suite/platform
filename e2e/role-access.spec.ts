import { expect, test, type Page } from '@playwright/test';
import { requiresCredentials, signIn, type InternalRole } from './support/auth';

type CredentialRole = InternalRole;
type ForbiddenReason = 'ROLE_NOT_ASSIGNED' | 'PERMISSION_NOT_GRANTED';

interface DeniedRoute {
  readonly path: string;
  readonly reason: ForbiddenReason;
}

interface RoleAccessCase {
  readonly label: string;
  readonly credentialRole: CredentialRole;
  readonly expectedRoles: readonly string[];
  readonly landing: string;
  readonly allowed: readonly string[];
  readonly denied: readonly DeniedRoute[];
}

const REASON_COPY: Record<ForbiddenReason, RegExp> = {
  ROLE_NOT_ASSIGNED: /current roles|roles actuales/i,
  PERMISSION_NOT_GRANTED: /permission required|permiso requerido/i,
};

const ROLE_ACCESS_MATRIX: readonly RoleAccessCase[] = [
  {
    label: 'pure TENANT_ADMIN',
    credentialRole: 'TENANT_ADMIN',
    expectedRoles: ['TENANT_ADMIN'],
    landing: '/ops/operations/company-administration',
    allowed: ['/ops/operations/company-administration'],
    denied: [
      { path: '/ops/catalog', reason: 'ROLE_NOT_ASSIGNED' },
      { path: '/ops/commercial/dashboard', reason: 'PERMISSION_NOT_GRANTED' },
      { path: '/ops/operations/inventory', reason: 'PERMISSION_NOT_GRANTED' },
      { path: '/ops/operations/dispatch-orders', reason: 'PERMISSION_NOT_GRANTED' },
    ],
  },
  {
    label: 'pure COMPANY_OWNER',
    credentialRole: 'COMPANY_OWNER',
    expectedRoles: ['COMPANY_OWNER'],
    landing: '/ops/executive-overview',
    allowed: [
      '/ops/operations/company-administration',
      '/ops/executive-overview',
      '/ops/catalog',
      '/ops/operations/dashboard',
      '/ops/operations/dispatch-orders',
    ],
    denied: [{ path: '/ops/operations/fulfillment-readiness', reason: 'PERMISSION_NOT_GRANTED' }],
  },
  {
    label: 'pure SALES',
    credentialRole: 'SALES',
    expectedRoles: ['SALES'],
    landing: '/ops/commercial/dashboard',
    allowed: [
      '/ops/commercial/dashboard',
      '/ops/catalog',
      '/ops/catalog/products/new',
      '/ops/catalog/promotions',
    ],
    denied: [
      { path: '/ops/operations/company-administration', reason: 'PERMISSION_NOT_GRANTED' },
      { path: '/ops/operations/dispatch-orders', reason: 'PERMISSION_NOT_GRANTED' },
      { path: '/ops/catalog/promotions/new', reason: 'ROLE_NOT_ASSIGNED' },
    ],
  },
  {
    label: 'pure WAREHOUSE',
    credentialRole: 'WAREHOUSE',
    expectedRoles: ['WAREHOUSE'],
    landing: '/ops/operations/dashboard',
    allowed: [
      '/ops/operations/dashboard',
      '/ops/operations/inventory',
      '/ops/operations/fulfillment-readiness',
      '/ops/catalog',
    ],
    denied: [
      { path: '/ops/commercial/dashboard', reason: 'PERMISSION_NOT_GRANTED' },
      { path: '/ops/operations/dispatch-orders', reason: 'PERMISSION_NOT_GRANTED' },
      { path: '/ops/catalog/products/new', reason: 'ROLE_NOT_ASSIGNED' },
      { path: '/ops/catalog/promotions', reason: 'ROLE_NOT_ASSIGNED' },
    ],
  },
  {
    label: 'pure LOGISTICS',
    credentialRole: 'LOGISTICS',
    expectedRoles: ['LOGISTICS'],
    landing: '/ops/operations/dashboard',
    allowed: [
      '/ops/operations/dashboard',
      '/ops/operations/inventory',
      '/ops/operations/fulfillment-readiness',
      '/ops/operations/dispatch-orders',
      '/ops/operations/proof-of-delivery',
      '/ops/operations/temperature-incidents',
      '/ops/operations/operational-analytics',
      '/ops/catalog',
      '/ops/catalog/promotions',
      '/ops/catalog/promotions/new',
    ],
    denied: [
      { path: '/ops/commercial/dashboard', reason: 'PERMISSION_NOT_GRANTED' },
      { path: '/ops/catalog/products/new', reason: 'ROLE_NOT_ASSIGNED' },
      { path: '/ops/catalog/categories', reason: 'ROLE_NOT_ASSIGNED' },
      { path: '/ops/catalog/brands', reason: 'ROLE_NOT_ASSIGNED' },
    ],
  },
  {
    label: 'founder multi-role',
    credentialRole: 'OWNER',
    expectedRoles: ['TENANT_ADMIN', 'COMPANY_OWNER'],
    landing: '/ops/operations/company-administration',
    allowed: [
      '/ops/operations/company-administration',
      '/ops/executive-overview',
      '/ops/catalog',
      '/ops/catalog/products/new',
      '/ops/catalog/promotions/new',
      '/ops/operations/dashboard',
      '/ops/operations/dispatch-orders',
    ],
    denied: [{ path: '/ops/operations/fulfillment-readiness', reason: 'PERMISSION_NOT_GRANTED' }],
  },
];

async function signInAndAssertRoles(
  page: Page,
  credentialRole: CredentialRole,
  expectedRoles: readonly string[],
): Promise<void> {
  const loginResponsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' &&
      response.url().includes('/api/v1/authentication/sign-in'),
  );
  await signIn(page, credentialRole);
  const loginResponse = await loginResponsePromise;
  expect(loginResponse.ok()).toBeTruthy();
  const body = (await loginResponse.json()) as {
    readonly session?: { readonly roles?: readonly string[]; readonly surface?: string };
  };
  const roles = [...(body.session?.roles ?? [])];
  expect(body.session?.surface).toBe('PLATFORM');
  expect(roles).toHaveLength(expectedRoles.length);
  expect(roles).toEqual(expect.arrayContaining([...expectedRoles]));
}

async function assertNoForbiddenSidebarLink(page: Page): Promise<void> {
  const sidebar = page.getByRole('navigation', {
    name: /internal operations navigation|navegación de operaciones internas/i,
  });
  await expect(sidebar).toBeVisible();
  await expect(sidebar.locator('a[href*="/forbidden"]')).toHaveCount(0);
  await expect(sidebar).not.toContainText(/forbidden|access restricted|acceso restringido/i);
}

async function assertAllowedRoute(page: Page, path: string): Promise<void> {
  await test.step(`allowed ${path}`, async () => {
    await page.goto(path);
    await expect.poll(() => new URL(page.url()).pathname).toBe(path);
    await expect(page.locator('.forbidden-page')).toHaveCount(0);
    await expect(page.locator('main#main-content')).toBeVisible();
    await assertNoForbiddenSidebarLink(page);
  });
}

async function assertDeniedRoute(page: Page, denied: DeniedRoute): Promise<void> {
  await test.step(`denied ${denied.path} with ${denied.reason}`, async () => {
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

for (const roleCase of ROLE_ACCESS_MATRIX) {
  test(`${roleCase.label} landing and allowed/denied route matrix`, async ({ page }) => {
    requiresCredentials(roleCase.credentialRole);
    await signInAndAssertRoles(page, roleCase.credentialRole, roleCase.expectedRoles);
    await expect.poll(() => new URL(page.url()).pathname).toBe(roleCase.landing);
    await assertNoForbiddenSidebarLink(page);

    for (const path of roleCase.allowed) await assertAllowedRoute(page, path);
    for (const denied of roleCase.denied) await assertDeniedRoute(page, denied);
  });
}

test('founder multi-role exposes both assigned areas without a Forbidden sidebar link', async ({
  page,
}) => {
  requiresCredentials('OWNER');
  await signInAndAssertRoles(page, 'OWNER', ['TENANT_ADMIN', 'COMPANY_OWNER']);
  const areaSelector = page.locator('.workspace-card select[aria-label]');
  await expect(areaSelector).toBeVisible();
  await expect(areaSelector.locator('option')).toHaveText([
    /tenant administration|administración del tenant/i,
    /company owner|propietario de la compañía/i,
  ]);
  await assertNoForbiddenSidebarLink(page);
});

const runtimeEnv =
  (
    globalThis as typeof globalThis & {
      readonly process?: { readonly env: Record<string, string | undefined> };
    }
  ).process?.env ?? {};
const buyerEmail = runtimeEnv.NEXA_E2E_BUYER_EMAIL ?? runtimeEnv.NEXA_DEV_BUYER_EMAIL;
const buyerPassword = runtimeEnv.NEXA_E2E_BUYER_PASSWORD ?? runtimeEnv.NEXA_DEV_BUYER_PASSWORD;

test('pure BUYER is denied before Platform landing because BUYER belongs to Portal', async ({
  page,
}) => {
  test.skip(
    !buyerEmail || !buyerPassword,
    'BLOCKED: no existing BUYER E2E credential is exposed; Platform source excludes BUYER from InternalRole and the API allows BUYER only on PORTAL.',
  );

  await page.goto('/sign-in');
  await page
    .locator('input[autocomplete="organization"]')
    .fill(runtimeEnv.NEXA_E2E_WORKSPACE ?? runtimeEnv.NEXA_DEV_WORKSPACE_SLUG ?? 'icisa');
  await page.locator('input[autocomplete="username"]').fill(buyerEmail!);
  await page.locator('input[autocomplete="current-password"]').fill(buyerPassword!);
  await page.getByRole('button', { name: /sign in|ingresar/i }).click();
  await expect(page).toHaveURL(/\/sign-in(?:\?.*)?$/);
  await expect(page.getByRole('alert')).toContainText(/could not sign you in|no pudimos iniciar/i);
});
