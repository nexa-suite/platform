import { test, expect } from '@playwright/test';
import { requiresCredentials, signIn } from './support/auth';

test('Sales sees the server-backed commercial dashboard and working links', async ({ page }) => {
  requiresCredentials('SALES');
  await signIn(page, 'SALES');
  await page.goto('/ops/commercial/dashboard');
  await expect(page.getByRole('heading', { name: /sales dashboard|dashboard comercial/i })).toBeVisible();
  const main = page.locator('#main-content');
  await expect(main.getByRole('link', { name: /purchase requests|solicitudes de compra/i })).toBeVisible();
  await expect(main.getByRole('link', { name: /sales orders|órdenes de venta/i })).toBeVisible();
});
