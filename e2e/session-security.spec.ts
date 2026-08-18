import { test, expect } from '@playwright/test';
import { requiresCredentials, signIn } from './support/auth';

test('sign-out revokes the Platform browser session', async ({ page }) => {
  requiresCredentials('OWNER');
  await signIn(page, 'OWNER');
  const signOutResponsePromise = page.waitForResponse((response) => response.request().method() === 'POST' && response.url().includes('/api/v1/authentication/sign-out'));
  await page.locator('button[aria-label="Sign out"], button[aria-label="Cerrar sesión"]').click();
  await expect((await signOutResponsePromise)).toBeTruthy();
  await page.reload();
  await page.goto('/ops/overview');
  await expect(page).toHaveURL(/sign-in/);
});
