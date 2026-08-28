import { expect, test } from '@playwright/test';
import { requiresCredentials, signIn } from './support/auth';
import { createLifecycleDispatch } from './support/logistics-fixtures';

test('SALES legacy Request Builder bookmark redirects to the canonical purchase-request inbox', async ({ page }) => {
  requiresCredentials('SALES');
  await signIn(page, 'SALES');
  await page.goto('/ops/commercial/request-builder');
  await expect(page).toHaveURL(/\/ops\/commercial\/purchase-requests$/);
  await expect(page.getByRole('heading', { name: /purchase requests|solicitudes de compra/i })).toBeVisible();
});

test('LOGISTICS moves a dispatch card through a real Kanban command and reloads with keyboard rollback', async ({ page, request }) => {
  requiresCredentials('LOGISTICS');
  const fixture = await createLifecycleDispatch(request);
  await signIn(page, 'LOGISTICS');
  await page.goto('/ops/operations/dispatch-orders');
  await expect(page.getByRole('heading', { name: /dispatch board|dispatch kanban|tablero de despachos|kanban de despachos/i })).toBeVisible();

  const source = page.locator(`[data-status="READY_FOR_OPERATIONS"] article`).filter({ has: page.locator(`a[href$="/${fixture.id}"]`) });
  await expect(source).toBeVisible();
  const mutation = page.waitForResponse((response) => response.request().method() === 'POST' && response.url().includes('/preparation-starts'));
  await source.getByRole('button', { name: /start preparation|move(?: dispatch)? forward|iniciar preparación|avanzar/i }).click();
  const response = await mutation;
  expect(response.ok()).toBeTruthy();

  const reload = page.waitForResponse((item) => item.request().method() === 'GET' && item.url().includes('/api/v1/dispatch-orders'));
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+Z' : 'Control+Z');
  await reload;
  await expect(page.locator('[data-status="PREPARING"]')).toBeVisible();
});
