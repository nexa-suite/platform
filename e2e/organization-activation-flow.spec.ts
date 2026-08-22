import { request as playwrightRequest, test, expect } from '@playwright/test';
import { assertNoBrowserSecrets, messageIds, waitForResetLink } from './support/mailpit';
import { fillOrganizationRegistration } from './support/organization-onboarding';

const API_URL = process.env.NEXA_API_URL ?? 'http://localhost:8080';

test('organization onboarding reaches ACTIVE only through the operator boundary and founder can enter both assigned work areas', async ({ page }) => {
  const operator = process.env.NEXA_E2E_SYSTEM_OPERATOR ?? process.env.NEXA_SYSTEM_OPERATOR_TOKEN;
  if (!operator) throw new Error('Missing NEXA_E2E_SYSTEM_OPERATOR for activation evidence');
  const api = await playwrightRequest.newContext({ baseURL: API_URL, extraHTTPHeaders: { Origin: 'http://localhost:4200' } });
  const operatorApi = await playwrightRequest.newContext({ baseURL: API_URL });
  const suffix = Date.now();
  const founderEmail = `e2e-activated-${suffix}@example.test`;
  const founderPassword = `NexaFounder!${suffix}`;
  const before = await messageIds(page);
  try {
    await page.goto('/tenant-management/register-organization');
    const slug = `e2e-activated-${suffix}`;
    await fillOrganizationRegistration(page, {
      legalName: `E2E Activated ${suffix}`,
      displayName: 'E2E Activated',
      storageSite: 'E2E Store',
      storageAddress: 'Av. E2E 200',
      founderName: 'E2E Founder',
      founderEmail,
      workspaceName: `E2E Activated Workspace ${suffix}`,
      workspaceSlug: slug,
    });
    let registrationResponse: { ok: boolean; body: { registrationId: string; statusToken: string } } | undefined;
    const registrationRoute = '**/api/v1/tenant-management/organization-registrations';
    await page.route(registrationRoute, async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue();
        return;
      }
      const response = await route.fetch();
      const body = await response.body();
      registrationResponse = {
        ok: response.ok(),
        body: JSON.parse(body.toString()) as { registrationId: string; statusToken: string },
      };
      await route.fulfill({ response, body });
    });
    await page.getByRole('button', { name: /submit registration|enviar registro/i }).click();
    await expect.poll(() => registrationResponse, { timeout: 10_000 }).toBeDefined();
    await page.unroute(registrationRoute);
    expect(registrationResponse).toBeDefined();
    expect(registrationResponse!.ok).toBeTruthy();
    const registration = registrationResponse!.body;
    await expect(page).toHaveURL(/registration-pending/);
    const pendingUrl = await page.url();
    const registrationId = registration.registrationId;
    const statusToken = registration.statusToken;
    expect(pendingUrl).toContain(`registration-pending/${registrationId}`);
    expect(statusToken).toBeTruthy();
    await expect(page).not.toHaveURL(/statusToken=/);
    expect(page.url()).not.toContain(statusToken);
    const activation = await operatorApi.post(`/api/v1/internal/organization-registrations/${registrationId}/activation`, { headers: { 'X-Nexa-System-Operator': operator } });
    expect(activation.status()).toBe(200);
    const result = await activation.json() as { status: string; roles: string[] };
    expect(result.status).toBe('ACTIVE');
    expect(result.roles).toEqual(expect.arrayContaining(['TENANT_ADMIN', 'COMPANY_OWNER']));
    const status = await api.get(`/api/v1/tenant-management/organization-registrations/${registrationId}?statusToken=${encodeURIComponent(statusToken!)}`);
    expect(status.status()).toBe(200);
    expect((await status.json() as { status: string }).status).toBe('ACTIVE');
    expect(page.url()).not.toContain(statusToken!);

    const resetUrl = await waitForResetLink(page, 'PLATFORM', before);
    const resetToken = new URL(resetUrl).searchParams.get('token');
    await page.goto(resetUrl);
    await page.getByLabel(/token/i).fill(resetToken!);
    await page.locator('input[formcontrolname="newPassword"]').fill(founderPassword);
    await page.getByRole('button', { name: /save|guardar/i }).click();
    await expect(page.getByRole('status')).toBeVisible();
    const login = await api.post('/api/v1/authentication/sign-in', { data: { identifier: founderEmail, password: founderPassword, workspaceSlug: slug, surface: 'PLATFORM' } });
    expect(login.status()).toBe(200);
    const loginBody = await login.json() as { accessToken: string; session: { roles: string[] } };
    expect(loginBody.session.roles).toEqual(expect.arrayContaining(['TENANT_ADMIN', 'COMPANY_OWNER']));

    await page.goto('/sign-in');
    await page.locator('input[autocomplete="organization"]').fill(slug);
    await page.locator('input[autocomplete="username"]').fill(founderEmail);
    await page.locator('input[autocomplete="current-password"]').fill(founderPassword);
    await page.getByRole('button', { name: /sign in|ingresar/i }).click();
    await expect(page).not.toHaveURL(/\/sign-in/);
    const switcher = page.locator('.workspace-card select');
    if (!(await switcher.isVisible())) {
      const menuButton = page.getByRole('button', { name: /open operations navigation|abrir navegación de operaciones|abrir navegacion de operaciones/i });
      if (await menuButton.isVisible()) await menuButton.click();
    }
    await expect(switcher).toBeVisible();
    await expect(switcher.locator('option')).toHaveText([
      /tenant administration|administración del tenant/i,
      /company owner|propietario de la compañía/i,
    ]);
    await page.goto('/ops/operations/company-administration');
    await expect(page.getByRole('heading', { name: /company administration/i })).toBeVisible();
    await page.goto('/ops/executive-overview');
    await expect(page.getByRole('heading', { name: /executive overview/i })).toBeVisible();
    await assertNoBrowserSecrets(page);
  } finally {
    await api.dispose();
    await operatorApi.dispose();
  }
});
