import { request as playwrightRequest, test, expect, type APIRequestContext, type Page } from '@playwright/test';
import { assertNoBrowserSecrets, messageIds, waitForResetLink } from './support/mailpit';
import { requiresCredentials, signIn } from './support/auth';

const API_URL = process.env.NEXA_API_URL ?? 'http://localhost:8080';
const ORIGIN = 'http://localhost:4200';

async function apiSignIn(api: APIRequestContext, identifier: string, password: string): Promise<string> {
  const response = await api.post('/api/v1/authentication/sign-in', { data: { identifier, password, workspaceSlug: process.env.NEXA_E2E_WORKSPACE ?? 'icisa', surface: 'PLATFORM' } });
  expect(response.status()).toBe(200);
  const body = await response.json() as { accessToken: string };
  expect(body.accessToken).toBeTruthy();
  return body.accessToken;
}

function collectBrowserErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error' && !/Failed to load resource: the server responded with a status of 401/i.test(message.text())) errors.push(message.text()); });
  page.on('requestfailed', (request) => { if (request.failure()?.errorText !== 'net::ERR_ABORTED' && !/\/api\/v1\/authentication\/refresh$/.test(request.url())) errors.push(request.url()); });
  return errors;
}

test('Platform password recovery proves old-password rejection, session invalidation and generic unknown-account response', async ({ page }) => {
  requiresCredentials('OWNER');
  const errors = collectBrowserErrors(page);
  const email = process.env.NEXA_E2E_OWNER_EMAIL!;
  const password = process.env.NEXA_E2E_OWNER_PASSWORD!;
  const nextPassword = `NexaReset!${Date.now()}`;
  const api = await playwrightRequest.newContext({ baseURL: API_URL, extraHTTPHeaders: { Origin: ORIGIN } });
  try {
    const priorToken = await apiSignIn(api, email, password);
    const before = await messageIds(page);
    await page.goto('/forgot-password');
    await page.getByLabel(/email|correo/i).fill(email);
    await page.getByRole('button', { name: /send|enviar/i }).click();
    const knownMessage = await page.getByRole('status').innerText();
    const resetUrl = await waitForResetLink(page, 'PLATFORM', before);
    const resetToken = new URL(resetUrl).searchParams.get('token');
    expect(resetToken).toBeTruthy();
    await page.goto(resetUrl);
    await page.getByLabel(/token/i).fill(resetToken!);
    await page.locator('input[formcontrolname="newPassword"]').fill(nextPassword);
    await page.getByRole('button', { name: /save|guardar/i }).click();
    await expect(page.getByRole('status')).toBeVisible();

    const oldLogin = await api.post('/api/v1/authentication/sign-in', { data: { identifier: email, password, workspaceSlug: process.env.NEXA_E2E_WORKSPACE ?? 'icisa', surface: 'PLATFORM' } });
    expect(oldLogin.status()).toBe(401);
    const nextToken = await apiSignIn(api, email, nextPassword);
    const priorSession = await api.get('/api/v1/session', { headers: { Authorization: `Bearer ${priorToken}` } });
    expect(priorSession.status()).toBe(401);

    if (test.info().project.name === 'desktop') {
      await page.goto('/forgot-password');
      await page.getByLabel(/email|correo/i).fill(`unknown-${Date.now()}@example.test`);
      await page.getByRole('button', { name: /send|enviar/i }).click();
      await expect(page.getByRole('status')).toHaveText(knownMessage);
    }

    const restore = await api.post('/api/v1/me/password-changes', {
      headers: { Authorization: `Bearer ${nextToken}` },
      data: { currentPassword: nextPassword, newPassword: password },
    });
    expect(restore.status()).toBe(204);
    await assertNoBrowserSecrets(page);
    expect(errors).toEqual([]);
  } finally {
    await api.dispose();
  }
});

test('Platform session page proves A/B isolation, other-session revocation and current-session revocation', async ({ page }) => {
  requiresCredentials('OWNER');
  const email = process.env.NEXA_E2E_OWNER_EMAIL!;
  const password = process.env.NEXA_E2E_OWNER_PASSWORD!;
  const api = await playwrightRequest.newContext({ baseURL: API_URL, extraHTTPHeaders: { Origin: ORIGIN } });
  try {
    await signIn(page, 'OWNER');
    await page.goto('/iam/security/sessions');
    await page.getByRole('button', { name: /revoke (other|all)|revocar (otras|todas)/i }).click();
    const tokenB = await apiSignIn(api, email, password);
    await page.getByRole('button', { name: /retry|reintentar/i }).click();
    await expect(page.locator('main > ul > li')).toHaveCount(2);
    await page.getByRole('button', { name: /revoke other sessions|revocar otras sesiones/i }).click();
    await expect(page.locator('main > ul > li')).toHaveCount(1);
    const rejected = await api.get('/api/v1/session', { headers: { Authorization: `Bearer ${tokenB}` } });
    expect(rejected.status()).toBe(401);
    await expect(page.getByRole('heading', { name: /sessions|sesiones/i })).toBeVisible();
    await page.getByRole('button', { name: /revoke current session/i }).click();
    await expect(page).toHaveURL(/\/sign-in/);
    await assertNoBrowserSecrets(page);
  } finally {
    await api.dispose();
  }
});
