import { expect, Page } from 'playwright/test';

export type InternalRole = 'OWNER' | 'TENANT_ADMIN' | 'COMPANY_OWNER' | 'SALES' | 'WAREHOUSE' | 'LOGISTICS';

export async function signIn(page: Page, role: InternalRole): Promise<void> {
  const prefix = `NEXA_E2E_${role}`;
  const email = process.env[`${prefix}_EMAIL`];
  const password = process.env[`${prefix}_PASSWORD`];
  const workspace = process.env.NEXA_E2E_WORKSPACE ?? 'icisa';
  if (!email || !password) throw new Error(`Missing ${prefix}_EMAIL/${prefix}_PASSWORD for authenticated browser evidence`);
  await page.goto('/sign-in');
  await page.locator('input[autocomplete="organization"]').fill(workspace);
  await page.locator('input[autocomplete="username"]').fill(email);
  await page.locator('input[autocomplete="current-password"]').fill(password);
  await page.getByRole('button', { name: /sign in|ingresar/i }).click();
  await expect(page).not.toHaveURL(/\/sign-in/, { timeout: 10_000 });
  await expect(page.locator('main, [role="main"]')).toBeVisible();
}

export function requiresCredentials(role: InternalRole): void {
  if (!process.env[`NEXA_E2E_${role}_EMAIL`] || !process.env[`NEXA_E2E_${role}_PASSWORD`]) {
    throw new Error(`Set NEXA_E2E_${role}_EMAIL and NEXA_E2E_${role}_PASSWORD before authenticated browser validation`);
  }
}
