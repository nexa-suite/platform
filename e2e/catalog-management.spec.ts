import { expect, test } from '@playwright/test';
import { requiresCredentials, signIn } from './support/auth';

function localDateTime(offsetMinutes = 0): string {
  const value = new Date(Date.now() + offsetMinutes * 60_000);
  value.setSeconds(0, 0);
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

test('Company Owner completes the catalog mutation chain with real server state', async ({ page }) => {
  requiresCredentials('COMPANY_OWNER');
  await signIn(page, 'COMPANY_OWNER');

  const suffix = `${Date.now()}`;
  const categoryName = `E2E Category ${suffix}`;
  const categorySlug = `e2e-category-${suffix}`;
  const brandName = `E2E Brand ${suffix}`;
  const brandSlug = `e2e-brand-${suffix}`;
  const productName = `E2E Cold Product ${suffix}`;
  const productSlug = `e2e-cold-product-${suffix}`;
  const productCode = `E2E-P-${suffix}`;
  const catalogItemId = `E2E-CAT-${suffix}`;
  const promotionName = `E2E Quantity Promotion ${suffix}`;
  const promotionSlug = `e2e-quantity-promotion-${suffix}`;

  await page.goto('/ops/catalog/categories');
  await page.locator('[formcontrolname="slug"]').fill(categorySlug);
  await page.locator('[formcontrolname="name"]').fill(categoryName);
  await page.locator('[formcontrolname="description"]').fill('Server-backed E2E catalog category');
  await page.getByRole('button', { name: /save|guardar/i }).click();
  await expect(page.locator('tbody tr').filter({ hasText: categoryName })).toBeVisible();

  await page.goto('/ops/catalog/brands');
  await page.locator('[formcontrolname="slug"]').fill(brandSlug);
  await page.locator('[formcontrolname="name"]').fill(brandName);
  await page.locator('[formcontrolname="description"]').fill('Server-backed E2E catalog brand');
  await page.getByRole('button', { name: /save|guardar/i }).click();
  await expect(page.locator('tbody tr').filter({ hasText: brandName })).toBeVisible();

  await page.goto('/ops/catalog/products/new');
  await expect(page.locator('[formcontrolname="catalogItemId"]')).toBeVisible();
  await page.locator('[formcontrolname="catalogItemId"]').fill(catalogItemId);
  await page.locator('[formcontrolname="productCode"]').fill(productCode);
  await page.locator('[formcontrolname="slug"]').fill(productSlug);
  await page.locator('[formcontrolname="name"]').fill(productName);
  await page.locator('[formcontrolname="description"]').fill('E2E refrigerated cold-chain product');
  await page.locator('[formcontrolname="categoryId"]').selectOption({ label: categoryName });
  await page.locator('[formcontrolname="brandId"]').selectOption({ label: brandName });
  await page.locator('[formcontrolname="storageTemperature"]').fill('REFRIGERATED');
  await page.locator('[formcontrolname="presentation"]').fill('E2E UNIT');
  await page.locator('[formcontrolname="unitOfMeasure"]').fill('UNIT');
  await page.locator('[formcontrolname="imagePath"]').fill('/catalog-items/e2e-cold-product.png');
  await page.getByRole('button', { name: /save|guardar/i }).click();
  await expect(page).not.toHaveURL(/\/ops\/catalog\/products\/new$/);
  await expect(page).toHaveURL(/\/ops\/catalog\/products\/[^/]+$/);
  await expect(page.locator('h1')).toContainText(/product|producto/i);
  const productId = new URL(page.url()).pathname.split('/').pop();
  if (!productId) throw new Error('Catalog product mutation did not return an id');
  await page.getByRole('button', { name: /activate|activar/i }).click();
  await expect(page.locator('dd').filter({ hasText: /active|activo/i })).toBeVisible();

  await page.goto('/ops/catalog/pricing');
  const productSearch = page.locator('input').first();
  await productSearch.fill(productName);
  await productSearch.press('Enter');
  const productOption = page.getByRole('button', { name: new RegExp(productName) });
  await expect(productOption).toBeVisible();
  await productOption.click();
  await page.locator('[formcontrolname="amount"]').fill('19.99');
  await page.locator('[formcontrolname="currency"]').fill('USD');
  await page.locator('[formcontrolname="validFrom"]').fill(localDateTime(-5));
  await page.locator('[formcontrolname="sourceCode"]').fill(`E2E-${suffix}`);
  await page.locator('[formcontrolname="sourceDescription"]').fill('E2E current price');
  await page.getByRole('button', { name: /create price|crear precio/i }).click();
  await expect(page.locator('tbody tr').filter({ hasText: '19.99' })).toBeVisible();

  await page.goto('/ops/catalog/promotions/new');
  await page.locator('[formcontrolname="slug"]').fill(promotionSlug);
  await page.locator('[formcontrolname="name"]').fill(promotionName);
  await page.locator('[formcontrolname="description"]').fill('E2E minimum quantity promotion');
  await page.locator('[formcontrolname="discountType"]').selectOption('PERCENTAGE');
  await page.locator('[formcontrolname="discountValue"]').fill('10');
  await page.locator('[formcontrolname="currency"]').fill('USD');
  await page.locator('[formcontrolname="minimumQuantity"]').fill('5');
  await page.locator('[formcontrolname="priority"]').fill('100');
  await page.locator('[formcontrolname="startsAt"]').fill(localDateTime(-5));
  await page.locator('[formcontrolname="productIds"]').fill(productId);
  const promotionResponsePromise = page.waitForResponse((response) => response.url().includes('/api/v1/catalog/promotions') && response.request().method() === 'POST');
  await page.getByRole('button', { name: /save|guardar/i }).click();
  const promotionResponse = await promotionResponsePromise;
  if (!promotionResponse.ok()) throw new Error(`Catalog promotion POST failed with ${promotionResponse.status()}: ${promotionResponse.request().postData() ?? 'no request body'}`);
  await expect(page).not.toHaveURL(/\/ops\/catalog\/promotions\/new$/);
  await expect(page).toHaveURL(/\/ops\/catalog\/promotions\/[^/]+$/);
  await expect(page.locator('h1')).toContainText(/promotion|promoción/i);
  await expect(page.locator('[formcontrolname="name"]')).toHaveValue(promotionName);
  await page.getByRole('button', { name: /activate|activar/i }).click();
  await expect(page.locator('dd').filter({ hasText: /active|activo/i })).toBeVisible();
});
