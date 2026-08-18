import { test, expect } from '@playwright/test';
import { requiresCredentials, signIn } from './support/auth';

test('Warehouse reaches authoritative inventory and reservation views', async ({ page }) => {
  requiresCredentials('WAREHOUSE');
  await signIn(page, 'WAREHOUSE');
  await page.goto('/ops/operations/inventory');
  await expect(page.locator('body')).toContainText(/inventory|inventario/i);
  const reservationsLink = page.getByRole('link', { name: /reservations|reservas/i });
  if (!(await reservationsLink.isVisible())) {
    const menuButton = page.getByRole('button', { name: /open operations navigation|abrir navegación de operaciones|abrir navegacion de operaciones/i });
    await expect(menuButton).toBeVisible();
    await menuButton.click();
  }
  await expect(reservationsLink).toBeVisible();
});
