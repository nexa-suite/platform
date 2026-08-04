import { expect, test, type Page } from '@playwright/test';
import { requiresCredentials, signIn } from './support/auth';
import { credentialEnvironment } from './support/role-fixtures';

const API_URL = process.env.NEXA_API_URL ?? 'http://localhost:8080';

interface CatalogReference {
  readonly id: string;
  readonly name: string;
}

interface CatalogPage<T> {
  readonly items?: readonly T[];
}

interface ProductFamily {
  readonly id: string;
  readonly status: string;
  readonly version: number;
}

interface SellableSku {
  readonly id: string;
  readonly status: string;
  readonly version: number;
}

async function serviceHeaders(page: Page): Promise<Readonly<Record<string, string>>> {
  const { email, password, workspace } = credentialEnvironment('COMPANY_OWNER');
  if (!email || !password) throw new Error('Missing COMPANY_OWNER credential fixture');
  const response = await page.request.post(`${API_URL}/api/v1/authentication/sign-in`, {
    headers: { Origin: 'http://localhost:4200' },
    data: { identifier: email, password, workspaceSlug: workspace, surface: 'PLATFORM' },
  });
  expect(response.ok()).toBeTruthy();
  const body = await response.json() as { readonly accessToken?: string };
  if (!body.accessToken) throw new Error('Canonical catalog E2E did not receive an access token');
  return { Authorization: `Bearer ${body.accessToken}`, Origin: 'http://localhost:4200' };
}

async function firstReference(page: Page, path: string, label: string, headers: Readonly<Record<string, string>>): Promise<CatalogReference> {
  const response = await page.request.get(`${API_URL}${path}`, { headers });
  expect(response.ok()).toBeTruthy();
  const body = await response.json() as CatalogPage<CatalogReference>;
  const item = body.items?.[0];
  if (!item?.id || !item.name) throw new Error(`Seed catalog ${label} is unavailable`);
  return item;
}

test('Company Owner completes the canonical Product Family, SKU and price mutation chain', async ({ page }) => {
  test.setTimeout(60_000);
  requiresCredentials('COMPANY_OWNER');
  await signIn(page, 'COMPANY_OWNER');

  const headers = await serviceHeaders(page);
  const category = await firstReference(page, '/api/v1/catalog/categories?search=Butter&size=100', 'category', headers);
  const brand = await firstReference(page, '/api/v1/catalog/brands?search=Agriform&size=100', 'brand', headers);
  const suffix = `${Date.now()}`;

  const familyResponse = await page.request.post(`${API_URL}/api/v1/product-families`, {
    headers,
    data: {
      code: `E2E-F-${suffix}`,
      name: `E2E Refrigerated Family ${suffix}`,
      description: 'Canonical Product Family browser service evidence',
      categoryId: category.id,
      brandId: brand.id,
      storageFamily: 'REFRIGERATED',
    },
  });
  expect(familyResponse.status()).toBe(201);
  const family = await familyResponse.json() as ProductFamily;
  expect(family.status).toBe('DRAFT');
  expect(family.version).toBe(0);

  const familyActivation = await page.request.post(`${API_URL}/api/v1/product-families/${family.id}/activations`, {
    headers: { ...headers, 'If-Match': '"0"' },
  });
  expect(familyActivation.ok()).toBeTruthy();
  expect((await familyActivation.json() as ProductFamily).status).toBe('ACTIVE');

  const skuResponse = await page.request.post(`${API_URL}/api/v1/product-families/${family.id}/skus`, {
    headers,
    data: {
      skuCode: `E2E-S-${suffix}`,
      presentation: 'E2E UNIT',
      packagingType: 'UNIT',
      unitOfMeasure: 'UNIT',
      packQuantity: 1,
      temperatureMin: 2,
      temperatureMax: 8,
      shelfLifeDays: 30,
      minimumRemainingShelfLifeDays: 5,
      lotTrackingRequired: true,
      expiryTrackingRequired: true,
      taxCategory: 'STANDARD',
    },
  });
  expect(skuResponse.status()).toBe(201);
  const sku = await skuResponse.json() as SellableSku;
  expect(sku.status).toBe('DRAFT');
  expect(sku.version).toBe(0);

  const skuActivation = await page.request.post(`${API_URL}/api/v1/skus/${sku.id}/activations`, {
    headers: { ...headers, 'If-Match': '"0"' },
  });
  expect(skuActivation.ok()).toBeTruthy();
  expect((await skuActivation.json() as SellableSku).status).toBe('ACTIVE');

  const priceResponse = await page.request.post(`${API_URL}/api/v1/skus/${sku.id}/prices`, {
    headers: { ...headers, 'Idempotency-Key': `e2e-price-${suffix}` },
    data: {
      amount: 19.99,
      currency: 'USD',
      validFrom: new Date(Date.now() - 300_000).toISOString(),
      sourceCode: `E2E-${suffix}`,
      sourceDescription: 'Canonical current SKU price',
    },
  });
  expect(priceResponse.status()).toBe(201);
  expect((await priceResponse.json() as { readonly amount: number; readonly currency: string })).toMatchObject({ amount: 19.99, currency: 'USD' });

  const skuRead = await page.request.get(`${API_URL}/api/v1/skus/${sku.id}`, { headers });
  expect(skuRead.ok()).toBeTruthy();
  expect(await skuRead.json()).toMatchObject({ id: sku.id, familyId: family.id, status: 'ACTIVE' });

  await page.goto('/ops/catalog');
  await expect(page.locator('main#main-content')).toBeVisible();
});
