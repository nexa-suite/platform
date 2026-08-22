import { test, expect } from '@playwright/test';
import { requiresCredentials, signIn } from './support/auth';
import { assertNoBrowserSecrets } from './support/mailpit';
import { fillOrganizationRegistration } from './support/organization-onboarding';

test('public organization onboarding reaches the pending-review state', async ({ page }) => {
  await page.goto('/sign-in');
  await page.goto('/tenant-management/register-organization');
  await expect(page.getByRole('heading', { name: /register your organization|registrar organización/i })).toBeVisible();
  const suffix = Date.now();
  await fillOrganizationRegistration(page, {
    legalName: `E2E Cold Chain ${suffix}`,
    displayName: 'E2E Cold Chain',
    storageSite: 'E2E Cold Store',
    storageAddress: 'Av. E2E 100',
    founderName: 'E2E Founder',
    founderEmail: `e2e-${suffix}@example.test`,
    workspaceName: 'E2E Workspace',
    workspaceSlug: `e2e-${suffix}`,
  });
  let registrationResponse: { ok: boolean; body: { statusToken?: string } } | undefined;
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
      body: JSON.parse(body.toString()) as { statusToken?: string },
    };
    await route.fulfill({ response, body });
  });
  await page.getByRole('button', { name: /submit registration|enviar registro/i }).click();
  await expect.poll(() => registrationResponse, { timeout: 10_000 }).toBeDefined();
  await page.unroute(registrationRoute);
  expect(registrationResponse).toBeDefined();
  expect(registrationResponse!.ok).toBeTruthy();
  const registration = registrationResponse!.body;
  expect(registration.statusToken).toBeTruthy();
  await expect(page).toHaveURL(/registration-pending/);
  await expect(page).not.toHaveURL(/statusToken=/);
  expect(page.url()).not.toContain(registration.statusToken!);
  await assertNoBrowserSecrets(page);
  await expect(page.locator('main')).toContainText(/pending|review|pendiente|revisión/i);

  await page.goBack();
  await expect(page).toHaveURL(/tenant-management\/register-organization/);
  await page.goForward();
  await expect(page).toHaveURL(/tenant-management\/registration-pending/);
  await expect(page).not.toHaveURL(/statusToken=/);
});

test('Tenant Admin lands on company administration and stays inside Platform', async ({ page }) => {
  requiresCredentials('TENANT_ADMIN');
  await signIn(page, 'TENANT_ADMIN');
  await expect(page).toHaveURL(/ops\/operations\/company-administration/);
  await expect(page.locator('main')).toContainText(/company administration|administración de compañía/i);
});
