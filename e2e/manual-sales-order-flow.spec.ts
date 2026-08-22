import { expect, test } from '@playwright/test';
import { requiresCredentials, signIn } from './support/auth';

test('Sales completes the four-step manual order flow with server route preview', async ({ page }) => {
  test.setTimeout(90_000);
  requiresCredentials('SALES');
  await signIn(page, 'SALES');

  await page.goto('/ops/commercial/manual-orders/new');
  const draftLoad = page.waitForResponse((response) => response.request().method() === 'GET' && /\/api\/v1\/sales-orders\/manual-drafts\/[0-9a-f-]+$/.test(new URL(response.url()).pathname));
  await page.getByRole('button', { name: /iniciar orden manual/i }).click();
  await expect(page).toHaveURL(/\/ops\/commercial\/manual-orders\/[^/]+\/client$/);
  await draftLoad;
  await expect(page.getByRole('heading', { name: /cliente y condiciones/i })).toBeVisible();

  const clientSelect = page.locator('mat-select[formcontrolname="clientAccountId"]');
  await clientSelect.click();
  await page.getByRole('listbox', { name: 'Cliente' }).getByRole('option', { name: /La Cava Fría.*CLI-001/i }).click();
  await expect(clientSelect).toHaveAttribute('aria-invalid', 'false');
  await page.getByRole('button', { name: /guardar y continuar/i }).click();
  await expect(page).toHaveURL(/\/items$/);
  await expect(page.getByRole('heading', { name: /ítems y cantidades/i })).toBeVisible();

  const itemSelect = page.locator('mat-select[formcontrolname="catalogItemId"]');
  await itemSelect.click();
  await page.getByRole('listbox', { name: 'SKU / catálogo' }).getByRole('option').nth(1).click();
  await expect(itemSelect).not.toContainText(/seleccionar ítem/i);
  await page.getByRole('button', { name: /^agregar$/i }).click();
  await page.getByRole('button', { name: /guardar y continuar/i }).click();
  await expect(page).toHaveURL(/\/delivery$/);
  await expect(page.getByRole('heading', { name: /entrega y servicio/i })).toBeVisible();

  const addressSelect = page.locator('mat-select[formcontrolname="addressId"]');
  await addressSelect.click();
  const addressOption = page.getByRole('listbox', { name: 'Dirección guardada' }).getByRole('option').filter({ hasText: /Av\. Sucre 1992/i });
  await expect(addressOption).toHaveCount(1);
  await addressOption.click();
  await page.getByRole('button', { name: /guardar y continuar/i }).click();
  await expect(page).toHaveURL(/\/review$/);
  await expect(page.getByRole('heading', { name: /revisión/i })).toBeVisible();

  await expect(page.locator('.route-preview')).toBeVisible();
  await expect(page.locator('.route-preview')).toContainText(/Av\. Sucre 1992/i);
  await expect(page.locator('.route-preview')).toContainText(/LOCAL_DETERMINISTIC|LOCAL_ESTIMATE/i);

  const submission = page.waitForResponse((response) => response.request().method() === 'POST' && /\/api\/v1\/sales-orders\/manual-drafts\/[^/]+\/submissions$/.test(new URL(response.url()).pathname));
  await page.getByRole('button', { name: /crear sales order/i }).click();
  const submissionResponse = await submission;
  expect([200, 201]).toContain(submissionResponse.status());
  await expect(page).toHaveURL(/\/ops\/commercial\/sales-orders\/[^/]+$/);
});
