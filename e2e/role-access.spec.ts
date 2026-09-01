import { expect, test, type Page } from '@playwright/test';
import { buyerCredentials, hasDedicatedCompanyOwnerFixture, requiresCredentials, signIn, ROLE_FIXTURES, type InternalRole } from './support/auth';
import { credentialEnvironment } from './support/role-fixtures';

const API_URL = process.env.NEXA_API_URL ?? 'http://localhost:8080';

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
      { path: '/ops/catalog', reason: 'PERMISSION_NOT_GRANTED' },
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
    ],
    denied: [
      { path: '/ops/operations/dashboard', reason: 'PERMISSION_NOT_GRANTED' },
      { path: '/ops/operations/dispatch-orders', reason: 'PERMISSION_NOT_GRANTED' },
      { path: '/ops/operations/inventory', reason: 'PERMISSION_NOT_GRANTED' },
      { path: '/ops/operations/proof-of-delivery', reason: 'PERMISSION_NOT_GRANTED' },
      { path: '/ops/operations/temperature-incidents', reason: 'PERMISSION_NOT_GRANTED' },
      { path: '/ops/operations/operational-analytics', reason: 'PERMISSION_NOT_GRANTED' },
      { path: '/ops/operations/fulfillment-readiness', reason: 'PERMISSION_NOT_GRANTED' },
    ],
  },
  {
    label: 'pure SALES',
    credentialRole: 'SALES',
    expectedRoles: ['SALES'],
    landing: '/ops/commercial/dashboard',
    allowed: [
      '/ops/commercial/dashboard',
      '/ops/catalog',
      '/ops/catalog/promotions',
    ],
    denied: [
      { path: '/ops/operations/company-administration', reason: 'PERMISSION_NOT_GRANTED' },
      { path: '/ops/executive-overview', reason: 'PERMISSION_NOT_GRANTED' },
      { path: '/ops/operations/dispatch-orders', reason: 'PERMISSION_NOT_GRANTED' },
      { path: '/ops/catalog/products/new', reason: 'PERMISSION_NOT_GRANTED' },
      { path: '/ops/catalog/promotions/new', reason: 'PERMISSION_NOT_GRANTED' },
      { path: '/ops/catalog/categories', reason: 'PERMISSION_NOT_GRANTED' },
      { path: '/ops/catalog/brands', reason: 'PERMISSION_NOT_GRANTED' },
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
      { path: '/ops/executive-overview', reason: 'PERMISSION_NOT_GRANTED' },
      { path: '/ops/operations/dispatch-orders', reason: 'PERMISSION_NOT_GRANTED' },
      { path: '/ops/catalog/products/new', reason: 'PERMISSION_NOT_GRANTED' },
      { path: '/ops/catalog/promotions', reason: 'PERMISSION_NOT_GRANTED' },
    ],
  },
  {
    label: 'pure LOGISTICS',
    credentialRole: 'LOGISTICS',
    expectedRoles: ['LOGISTICS'],
    landing: '/ops/operations/dispatch-orders',
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
    ],
    denied: [
      { path: '/ops/commercial/dashboard', reason: 'PERMISSION_NOT_GRANTED' },
      { path: '/ops/executive-overview', reason: 'PERMISSION_NOT_GRANTED' },
      { path: '/ops/catalog/products/new', reason: 'PERMISSION_NOT_GRANTED' },
      { path: '/ops/catalog/promotions/new', reason: 'PERMISSION_NOT_GRANTED' },
      { path: '/ops/catalog/categories', reason: 'PERMISSION_NOT_GRANTED' },
      { path: '/ops/catalog/brands', reason: 'PERMISSION_NOT_GRANTED' },
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
    ],
    denied: [
      { path: '/ops/operations/dashboard', reason: 'PERMISSION_NOT_GRANTED' },
      { path: '/ops/operations/dispatch-orders', reason: 'PERMISSION_NOT_GRANTED' },
      { path: '/ops/operations/fulfillment-readiness', reason: 'PERMISSION_NOT_GRANTED' },
    ],
  },
];

async function signInAndAssertRoles(
  page: Page,
  credentialRole: CredentialRole,
  expectedRoles: readonly string[],
): Promise<void> {
  await signIn(page, credentialRole);
  const { email, password, workspace } = credentialEnvironment(credentialRole);
  if (!email || !password) throw new Error(`Missing ${credentialRole} credential fixture`);
  const loginResponse = await page.request.post(`${API_URL}/api/v1/authentication/sign-in`, {
    headers: { Origin: 'http://localhost:4200' },
    data: { identifier: email, password, workspaceSlug: workspace, surface: 'PLATFORM' },
  });
  expect(loginResponse.ok()).toBeTruthy();
  const body = await loginResponse.json() as {
    readonly session?: { readonly roles?: readonly string[]; readonly permissions?: readonly string[]; readonly surface?: string };
  };
  const fixture = ROLE_FIXTURES[credentialRole];
  const roles = [...(body.session?.roles ?? [])];
  expect(body.session?.surface).toBe(fixture.surface);
  expect(roles).toHaveLength(expectedRoles.length);
  expect(roles).toEqual(expect.arrayContaining([...expectedRoles]));
  expect(body.session?.permissions).toEqual(expect.arrayContaining([...fixture.expectedPermissions]));
}

async function assertNoForbiddenSidebarLink(page: Page): Promise<void> {
  const sidebar = page.locator('mat-sidenav.platform-sidebar nav[aria-label]').first();
  await expect(sidebar).toBeAttached();
  if (!(await sidebar.isVisible())) {
    if ((page.viewportSize()?.width ?? 1280) <= 760) {
      const menuButton = page.locator('button.mobile-menu-button');
      await expect(menuButton).toBeVisible();
      await menuButton.click();
    }
  }
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
    if (roleCase.credentialRole === 'COMPANY_OWNER' && !hasDedicatedCompanyOwnerFixture) {
      test.skip(true, 'The local API bootstrap exposes COMPANY_OWNER through the founder multi-role fixture; CI provides a dedicated fixture.');
    }
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
  const areaSelector = page.locator('.workspace-area-selector[aria-label]');
  if (!(await areaSelector.isVisible())) {
    const menuButton = page.getByRole('button', { name: /open operations navigation|abrir navegación de operaciones|abrir navegacion de operaciones/i });
    await expect(menuButton).toBeVisible();
    await menuButton.click();
  }
  await expect(areaSelector).toBeVisible();
  await expect(areaSelector.locator('option')).toHaveText([
    /tenant administration|administración del tenant/i,
    /company owner|propietario de la compañía/i,
  ]);
  await assertNoForbiddenSidebarLink(page);
});

test('pure BUYER is denied before Platform landing because BUYER belongs to Portal', async ({
  page,
}) => {
  const { email: buyerEmail, password: buyerPassword, workspace } = buyerCredentials();
  if (!buyerEmail || !buyerPassword) throw new Error('Missing BUYER credential fixture; BUYER Platform denial is mandatory');

  const loginResponsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' &&
      response.url().includes('/api/v1/authentication/sign-in'),
  );
  await page.goto('/sign-in');
  await page
    .locator('input[autocomplete="organization"]')
    .fill(workspace);
  await page.locator('input[autocomplete="email"], input[autocomplete="username"]').first().fill(buyerEmail!);
  await page.locator('input[autocomplete="current-password"]').fill(buyerPassword!);
  await expect(page.locator('.tenant-preview')).toContainText(/active|activo/i, { timeout: 10_000 });
  await page.getByRole('button', { name: /sign in|ingresar/i }).click();
  const loginResponse = await loginResponsePromise;
  expect(loginResponse.ok()).toBeFalsy();
  await expect(page).toHaveURL(/\/sign-in(?:\?.*)?$/);
  await expect(page.getByRole('alert')).toContainText(/could not sign you in|no pudimos iniciar/i);
});
