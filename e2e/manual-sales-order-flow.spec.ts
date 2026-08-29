import { expect, test } from '@playwright/test';
import { requiresCredentials, signIn } from './support/auth';

test('Sales completes the four-step manual order flow with server route preview', async ({ page }) => {
  test.setTimeout(90_000);
  requiresCredentials('SALES');
  await signIn(page, 'SALES');

  const draftCreate = page.waitForResponse((response) => response.request().method() === 'POST' && /\/api\/v1\/sales-orders\/manual-drafts$/.test(new URL(response.url()).pathname));
  await page.goto('/ops/commercial/manual-orders/new');
  expect((await draftCreate).status()).toBe(201);
  await expect(page).toHaveURL(/\/ops\/commercial\/manual-orders\/[^/]+\/client$/);
  await expect(page.getByRole('heading', { name: /select client|selecciona cliente/i })).toBeVisible();

  const clientCard = page.locator('button.client-card').filter({ hasText: /La Cava Fría|CLI-001/i }).first();
  await expect(clientCard).toBeVisible();
  await clientCard.click();
  await page.locator('#manual-order-payment-preference').selectOption('CASH');
  await expect(page.getByRole('button', { name: /continue|continuar/i })).toBeEnabled();
  await page.getByRole('button', { name: /continue|continuar/i }).click();
  await expect(page).toHaveURL(/\/items$/);
  await expect(page.getByRole('heading', { name: /add products|agregar productos/i })).toBeVisible();

  const draftItemsPath = new URL(page.url()).pathname;
  await page.getByRole('link', { name: /open product catalog|abrir catálogo|abrir catalogo/i }).click();
  await expect(page).toHaveURL(/\/ops\/product-catalog/);
  const productCard = page.locator('.catalog-card').filter({ hasText: /COPPA/i }).first();
  await expect(productCard).toBeVisible();
  await productCard.getByRole('button', { name: /agregar|add/i }).click();
  await page.getByRole('link', { name: /create sales order|crear sales order/i }).click();
  await expect(page).toHaveURL(new RegExp(`${draftItemsPath}$`));
  await expect(page.getByText(/COPPA/i).first()).toBeVisible();
  const itemsSave = page.waitForResponse((response) => response.request().method() === 'PUT' && /\/api\/v1\/sales-orders\/manual-drafts\/[^/]+\/items$/.test(new URL(response.url()).pathname));
  await page.getByRole('button', { name: /continue to delivery|continuar a entrega/i }).click();
  expect((await itemsSave).status()).toBe(200);
  await expect(page).toHaveURL(/\/delivery$/);
  await expect(page.getByRole('heading', { name: /delivery information|entrega y servicio/i })).toBeVisible();
  await expect(page.locator('.route-preview-card')).toBeVisible();
  const routeSummary = page.locator('.route-summary');
  const destinationLabel = (await routeSummary.locator('span').nth(1).innerText()).trim();
  expect(destinationLabel).not.toMatch(/delivery address pending|dirección de entrega pendiente/i);
  expect(destinationLabel.length).toBeGreaterThan(0);

  const continueReview = page.getByRole('button', { name: /continue to review|guardar y continuar/i });
  await expect(continueReview).toBeEnabled();
  let persistedDraft: {
    readonly delivery?: {
      readonly addressSnapshot?: string | null;
      readonly routeSnapshot?: string | null;
      readonly warehouseId?: string | null;
      readonly warehouseSnapshot?: string | null;
    } | null;
  } | undefined;
  const deliverySave = page.waitForResponse(async (response) => {
    const isDeliverySave = response.request().method() === 'PUT'
      && /\/api\/v1\/sales-orders\/manual-drafts\/[^/]+\/delivery$/.test(new URL(response.url()).pathname);
    if (!isDeliverySave) {
      return false;
    }

    persistedDraft = await response.json() as typeof persistedDraft;
    return true;
  });
  await continueReview.click();
  const deliveryResponse = await deliverySave;
  expect(deliveryResponse.status()).toBe(200);
  expect(persistedDraft).toBeDefined();
  expect(persistedDraft?.delivery?.addressSnapshot).toBeTruthy();
  expect(persistedDraft?.delivery?.routeSnapshot).toBeTruthy();
  expect(persistedDraft?.delivery?.warehouseId).toBeTruthy();
  expect(persistedDraft?.delivery?.warehouseSnapshot).toBeTruthy();
  await expect(page).toHaveURL(/\/review$/);
  await expect(page.getByRole('heading', { name: /confirm cold-chain purchase order|revisión/i })).toBeVisible();
  const stableDestination = destinationLabel
    .replace(/^(av\.?|avenida|calle|jr\.?|jirón)\s+/i, '')
    .replace(/\s+\d{6}$/i, '')
    .trim();
  expect(stableDestination.length).toBeGreaterThan(0);
  await expect(page.locator('main')).toContainText(stableDestination);

  const submission = page.waitForResponse((response) => response.request().method() === 'POST' && /\/api\/v1\/sales-orders\/manual-drafts\/[^/]+\/submissions$/.test(new URL(response.url()).pathname));
  await page.getByRole('button', { name: /confirm order|crear sales order/i }).click();
  const submissionResponse = await submission;
  expect([200, 201]).toContain(submissionResponse.status());
  await expect(page).toHaveURL(/\/ops\/commercial\/sales-orders\/[^/]+$/);
});
