import { test, expect } from '@playwright/test';
import { requiresCredentials, signIn } from './support/auth';

test('Warehouse reaches authoritative inventory and reservation views', async ({ page }) => {
  requiresCredentials('WAREHOUSE');
  await signIn(page, 'WAREHOUSE');
  await page.goto('/ops/operations/inventory');
  await expect(page.locator('body')).toContainText(/inventory|inventario/i);
  await expect(page.getByRole('link', { name: /reservations|reservas/i })).toBeVisible();
});
