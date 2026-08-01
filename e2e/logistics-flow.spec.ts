import { test, expect } from 'playwright/test';
import { requiresCredentials, signIn } from './support/auth';

test('Logistics reaches dispatch and operations views', async ({ page }) => {
  requiresCredentials('LOGISTICS');
  await signIn(page, 'LOGISTICS');
  await page.goto('/ops/operations/dispatch-orders');
  await expect(page.locator('body')).toContainText(/dispatch|despacho/i);
  await expect(page.getByRole('link', { name: /proof of delivery|prueba de entrega/i })).toBeVisible();
});
