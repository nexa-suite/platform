import { expect, Page } from '@playwright/test';
import { credentialEnvironment, type CredentialRole } from './role-fixtures';

export { ROLE_FIXTURES, hasDedicatedCompanyOwnerFixture } from './role-fixtures';
export type { CredentialRole } from './role-fixtures';

export type InternalRole = Exclude<CredentialRole, 'BUYER'>;

export async function signIn(page: Page, role: InternalRole): Promise<void> {
  const { email, password, workspace } = credentialEnvironment(role);
  if (!email || !password) throw new Error(`Missing credentials for ${role} authenticated browser evidence`);
  await page.goto('/sign-in');
  await page.locator('input[autocomplete="organization"]').fill(workspace);
  await page.locator('input[autocomplete="email"], input[autocomplete="username"]').first().fill(email);
  await page.locator('input[autocomplete="current-password"]').fill(password);
  await expect(page.locator('.tenant-preview')).toContainText(/active|activo/i, { timeout: 10_000 });
  await page.getByRole('button', { name: /sign in|ingresar/i }).click();
  await expect(page).not.toHaveURL(/\/sign-in/, { timeout: 10_000 });
  await expect(page.locator('main, [role="main"]')).toBeVisible();
}

export function requiresCredentials(role: InternalRole): void {
  const { email, password } = credentialEnvironment(role);
  if (!email || !password) {
    throw new Error(`Set NEXA_E2E_${role}_EMAIL/NEXA_E2E_${role}_PASSWORD or matching NEXA_DEV variables before authenticated browser validation`);
  }
}

export function buyerCredentials(): { readonly email?: string; readonly password?: string; readonly workspace: string } {
  return credentialEnvironment('BUYER');
}
