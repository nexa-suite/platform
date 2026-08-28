import { test, expect } from '@playwright/test';
import { requiresCredentials, signIn } from './support/auth';

test('sign-out revokes the Platform browser session', async ({ page }) => {
  requiresCredentials('OWNER');
  await signIn(page, 'OWNER');
  const sidebar = page.locator('mat-sidenav.platform-sidebar');
  if (!(await sidebar.isVisible())) {
    await page.getByRole('button', { name: /open operations navigation|abrir navegación de operaciones|abrir navegacion de operaciones/i }).click();
  }
  const signOutResponsePromise = page.waitForResponse((response) => response.request().method() === 'POST' && response.url().includes('/api/v1/authentication/sign-out'));
  await page.getByRole('button', { name: /sign out|cerrar sesión|cerrar sesion/i }).click();
  await expect((await signOutResponsePromise)).toBeTruthy();
  await page.reload();
  await page.goto('/ops/overview');
  await expect(page).toHaveURL(/sign-in/);
});
