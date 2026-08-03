import { test, expect } from '@playwright/test';
import { requiresCredentials, signIn } from './support/auth';

test('Logistics reaches dispatch and operations views', async ({ page }) => {
  requiresCredentials('LOGISTICS');
  await signIn(page, 'LOGISTICS');
  await page.goto('/ops/operations/dispatch-orders');
  await expect(page.locator('body')).toContainText(/dispatch|despacho/i);
  const proofLink = page.getByRole('link', { name: /proof of delivery|prueba de entrega/i });
  if (!(await proofLink.isVisible())) {
    const menuButton = page.getByRole('button', { name: /open operations navigation|abrir navegación de operaciones|abrir navegacion de operaciones/i });
    await expect(menuButton).toBeVisible();
    await menuButton.click();
  }
  await expect(proofLink).toBeVisible();
});
