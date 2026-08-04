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

test('LOGISTICS moves a dispatch card through a real Kanban lifecycle command and reloads with keyboard rollback', async ({ page, request }) => {
  requiresCredentials('LOGISTICS');
  const fixture = await createLifecycleDispatch(request);
  await signIn(page, 'LOGISTICS');
  await page.goto('/ops/operations/dispatch-orders');
  await expect(page.getByRole('heading', { name: /dispatch kanban|kanban de despachos/i })).toBeVisible();

  const source = page.locator(`[data-status="READY_FOR_OPERATIONS"] article a[href$="/${fixture.id}"]`).locator('..');
  const target = page.locator('[data-status="PREPARING"]');
  await expect(source).toBeVisible();
  const mutation = page.waitForResponse((response) => response.request().method() === 'POST' && response.url().includes('/preparation-starts'));
  if (test.info().project.name === 'mobile') {
    const card = page.locator(`[data-status="READY_FOR_OPERATIONS"] article`).filter({ has: page.locator(`a[href$="/${fixture.id}"]`) });
    await card.locator('select').selectOption('PREPARING');
  } else {
    const handleBox = await source.locator('.drag-hint').boundingBox();
    const targetBox = await target.locator('.kanban-items').boundingBox();
    expect(handleBox).not.toBeNull();
    expect(targetBox).not.toBeNull();
    await page.mouse.move(handleBox!.x + handleBox!.width / 2, handleBox!.y + handleBox!.height / 2);
    await page.mouse.down();
    await page.mouse.move(handleBox!.x + handleBox!.width / 2 + 12, handleBox!.y + handleBox!.height / 2 + 12, { steps: 5 });
    await page.mouse.move(targetBox!.x + targetBox!.width / 2, targetBox!.y + Math.min(40, targetBox!.height - 10), { steps: 20 });
    await page.waitForTimeout(250);
    await page.mouse.up();
  }
  const response = await mutation;
  expect(response.ok()).toBeTruthy();

  const reload = page.waitForResponse((item) => item.request().method() === 'GET' && item.url().includes('/api/v1/dispatch-orders'));
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+Z' : 'Control+Z');
  await reload;
  await expect(page.locator('[data-status="PREPARING"]')).toBeVisible();
});
