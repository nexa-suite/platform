import { test, expect } from '@playwright/test';
import { requiresCredentials, signIn } from './support/auth';
import { assertNoBrowserSecrets } from './support/mailpit';

test('public organization onboarding reaches the pending-review state', async ({ page }) => {
  await page.goto('/sign-in');
  await page.goto('/tenant-management/register-organization');
  await expect(page.getByRole('heading', { name: /register your organization|registrar organización/i })).toBeVisible();
  await page.getByRole('textbox', { name: /legal name|razón social/i }).fill(`E2E Cold Chain ${Date.now()}`);
  await page.getByRole('textbox', { name: /display name|nombre comercial/i }).fill('E2E Cold Chain');
  await page.getByRole('textbox', { name: /storage site|sitio de almacenamiento/i }).fill('E2E Cold Store');
  await page.getByRole('textbox', { name: /storage address|dirección/i }).fill('Av. E2E 100');
  await page.getByRole('textbox', { name: /founder|administrador/i }).fill('E2E Founder');
  await page.getByRole('textbox', { name: /login email|correo/i }).fill(`e2e-${Date.now()}@example.test`);
  await page.getByRole('textbox', { name: /workspace name|nombre del espacio/i }).fill('E2E Workspace');
  await page.getByRole('textbox', { name: /workspace slug|slug/i }).fill(`e2e-${Date.now()}`);
  await page.getByRole('checkbox').check();
  const registrationPromise = page.waitForResponse((response) => response.request().method() === 'POST' && response.url().includes('/api/v1/tenant-management/organization-registrations')).then(async (response) => ({
    ok: response.ok(),
    body: await response.json() as { statusToken?: string },
  }));
  await page.getByRole('button', { name: /submit registration|enviar registro/i }).click();
  const registrationResponse = await registrationPromise;
  expect(registrationResponse.ok).toBeTruthy();
  const registration = registrationResponse.body;
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
