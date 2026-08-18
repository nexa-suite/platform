import { test, expect } from '@playwright/test';
import { requiresCredentials, signIn } from './support/auth';

test('Logistics reaches dispatch and operations views', async ({ page }) => {
  requiresCredentials('LOGISTICS');
  await signIn(page, 'LOGISTICS');
  await page.goto('/ops/operations/dispatch-orders');
  await expect(page.locator('body')).toContainText(/dispatch|despacho/i);
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
  const proofLink = sidebar.getByRole('link', { name: /proof of delivery|prueba de entrega/i });
  await expect(proofLink).toBeVisible();
});
