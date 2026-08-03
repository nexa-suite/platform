import { expect, test } from '@playwright/test';
import { requiresCredentials, signIn } from './support/auth';
import { createLifecycleDispatch } from './support/logistics-fixtures';

test('SALES creates and submits a real request from the Request Builder', async ({ page }) => {
  requiresCredentials('SALES');
  await signIn(page, 'SALES');
  await page.goto('/ops/commercial/request-builder');
  await expect(page.getByRole('heading', { name: /build purchase request|construir solicitud/i })).toBeVisible();

  const clientSelect = page.getByRole('combobox', { name: /client account|cuenta cliente/i });
  await clientSelect.click();
  const clientOption = page.locator('.cdk-overlay-pane [role="option"]').nth(1);
  await expect(clientOption).toBeVisible();
  await clientOption.click();

  const productSelect = page.getByRole('combobox', { name: /product|producto/i });
  await productSelect.click();
  const productOption = page.locator('.cdk-overlay-pane [role="option"]').nth(1);
  await expect(productOption).toBeVisible();
  await productOption.click();
  await page.getByRole('spinbutton', { name: /quantity|cantidad/i }).fill('1');
  await page.getByRole('button', { name: /add line|agregar línea/i }).click();

  const deliveryProfile = page.locator('[formcontrolname="deliveryProfileSnapshot"]');
  if (!(await deliveryProfile.inputValue())) await deliveryProfile.fill('E2E business delivery address');

  const createResponse = page.waitForResponse((response) => response.request().method() === 'POST' && response.url().includes('/api/v1/purchase-requests'));
  await page.getByRole('button', { name: /save draft|guardar borrador/i }).click();
  const created = await createResponse;
  expect([200, 201]).toContain(created.status());
  await expect(page.getByRole('link', { name: /open request|abrir solicitud/i })).toBeVisible();

  const submitResponse = page.waitForResponse((response) => response.request().method() === 'POST' && response.url().includes('/submissions'));
  await page.getByRole('button', { name: /submit request|enviar solicitud/i }).click();
  const submitted = await submitResponse;
  expect(submitted.ok()).toBeTruthy();
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
  const response = await mutation;
  expect(response.ok()).toBeTruthy();

  const reload = page.waitForResponse((item) => item.request().method() === 'GET' && item.url().includes('/api/v1/dispatch-orders'));
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+Z' : 'Control+Z');
  await reload;
  await expect(page.locator('[data-status="PREPARING"]')).toBeVisible();
});
