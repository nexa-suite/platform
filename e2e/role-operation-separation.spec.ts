import { expect, test, type Page } from '@playwright/test';
import { requiresCredentials, signIn } from './support/auth';

function captureApiPaths(page: Page): Set<string> {
  const paths = new Set<string>();
  page.on('request', (request) => {
    const path = new URL(request.url()).pathname;
    if (path.startsWith('/api/v1/')) paths.add(path);
  });
  return paths;
}

test('LOGISTICS dashboard loads dispatch sources without loading Warehouse projections', async ({ page }) => {
  requiresCredentials('LOGISTICS');
  await signIn(page, 'LOGISTICS');

  const apiPaths = captureApiPaths(page);
  await page.goto('/ops/operations/dashboard');
  await expect(page.getByRole('heading', { name: /fulfillment and delivery|preparación y entregas/i })).toBeVisible();
  await expect.poll(() => apiPaths.has('/api/v1/logistics/operations-dashboard')).toBe(true);
  await expect.poll(() => apiPaths.has('/api/v1/dispatch-orders')).toBe(true);

  expect(apiPaths.has('/api/v1/warehouses')).toBe(false);
  expect(apiPaths.has('/api/v1/inventory/lots')).toBe(false);
  expect(apiPaths.has('/api/v1/inventory/movements')).toBe(false);
  expect(apiPaths.has('/api/v1/inventory-reservations')).toBe(false);
});

test('WAREHOUSE dashboard loads inventory sources without loading Dispatch projections', async ({ page }) => {
  requiresCredentials('WAREHOUSE');
  await signIn(page, 'WAREHOUSE');

  const apiPaths = captureApiPaths(page);
  await page.goto('/ops/operations/dashboard');
  await expect(page.getByRole('heading', { name: /inventory and warehouse|inventario y almacén/i })).toBeVisible();
  await expect.poll(() => apiPaths.has('/api/v1/warehouses')).toBe(true);
  await expect.poll(() => apiPaths.has('/api/v1/inventory/lots')).toBe(true);

  expect(apiPaths.has('/api/v1/logistics/operations-dashboard')).toBe(false);
  expect(apiPaths.has('/api/v1/dispatch-orders')).toBe(false);
  expect(apiPaths.has('/api/v1/proof-of-delivery')).toBe(false);
});
