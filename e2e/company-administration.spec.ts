import { test, expect } from '@playwright/test';
import { assertNoBrowserSecrets } from './support/mailpit';
import { hasDedicatedCompanyOwnerFixture, requiresCredentials, signIn } from './support/auth';

test.describe('Tenant Administration', () => {
  test('authenticated tenant admin can inspect every administration surface', async ({ page }) => {
    requiresCredentials('OWNER');
    await signIn(page, 'OWNER');
    await page.goto('/ops/operations/company-administration');

    const main = page.locator('main, [role="main"]');
    await expect(main.getByRole('heading', { name: /company administration/i })).toBeVisible();
    await expect(main.getByRole('navigation', { name: /company administration sections/i })).toBeVisible();

    for (const tab of ['Organization & workspaces', 'Team & invitations', 'Settings', 'Access & plan']) {
      await page.getByRole('button', { name: tab, exact: true }).click();
      await expect(page.locator('.tab.active')).toHaveText(tab);
    }

    await expect(main).toContainText(/reference-only view|plan and usage/i);
    await assertNoBrowserSecrets(page);
  });

  test('tenant admin performs workspace, settings and invitation workflow without exposing a token', async ({ page }) => {
    requiresCredentials('OWNER');
    await signIn(page, 'OWNER');
    await page.goto('/ops/operations/company-administration');
    await expect(page.getByRole('heading', { name: /company administration/i })).toBeVisible();

    if (test.info().project.name === 'mobile') {
      await page.getByRole('button', { name: 'Settings', exact: true }).click();
      await expect(page.locator('mat-card-subtitle').filter({ hasText: /Regional settings/i })).toBeVisible();
      await assertNoBrowserSecrets(page);
      return;
    }

    await page.getByRole('button', { name: 'Organization & workspaces', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Create workspace', exact: true })).toHaveCount(0);
    await expect(page.getByRole('textbox', { name: 'New workspace name', exact: true })).toHaveCount(0);
    const workspaceRow = page.locator('.workspace-row').first();
    await expect(workspaceRow).toBeVisible();
    await workspaceRow.getByRole('button', { name: 'Configure', exact: true }).click();

    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    await expect(page.locator('mat-card-subtitle').filter({ hasText: /Operational rules/i })).toBeVisible();
    await page.getByLabel('Order cutoff minutes').fill('120');
    await page.getByRole('button', { name: 'Save operational rules', exact: true }).click();
    await expect(page.getByRole('status')).toContainText(/operational saved|saved/i);

    await page.getByRole('button', { name: 'Team & invitations', exact: true }).click();
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const invitationEmail = `e2e-admin-${suffix}@example.test`;
    const invitationForm = page.locator('form[aria-label="Invite internal member"]');
    await invitationForm.getByLabel('Email').fill(invitationEmail);
    await invitationForm.getByLabel('Display name').fill('E2E Internal Member');
    await invitationForm.locator('mat-select').click();
    await page.getByRole('option', { name: /Warehouse/i, exact: true }).click();
    await page.keyboard.press('Escape');
    const invitationResponse = page.waitForResponse((response) => response.request().method() === 'POST' && response.url().endsWith('/api/v1/organization-invitations'));
    const invitationRequest = page.waitForRequest((request) => request.method() === 'POST' && request.url().endsWith('/api/v1/organization-invitations'));
    await invitationForm.getByRole('button', { name: 'Send invitation', exact: true }).click();
    const request = await invitationRequest;
    const requestBody = JSON.parse(request.postData() ?? '{}') as { readonly roles?: readonly string[] };
    expect(requestBody.roles).toEqual(expect.arrayContaining(['SALES', 'WAREHOUSE']));
    expect(request.headerValue('Idempotency-Key')).toBeTruthy();
    const response = await invitationResponse;
    expect(response.status()).toBe(201);
    await expect(page.locator('.invitation-row').filter({ hasText: invitationEmail })).toBeVisible();
    await assertNoBrowserSecrets(page);
  });

  test('pure Company Owner can govern organization and workforce without technical tenant configuration', async ({ page }) => {
    test.skip(!hasDedicatedCompanyOwnerFixture(), 'The current API v0.17.0 bootstrap exposes COMPANY_OWNER through the founder multi-role fixture; a dedicated fixture is not part of the accepted baseline.');
    requiresCredentials('COMPANY_OWNER');
    await signIn(page, 'COMPANY_OWNER');
    await page.goto('/ops/operations/company-administration');
    await expect(page.getByRole('status')).toContainText(/Technical tenant configuration|configuración técnica del tenant/i);

    await page.getByRole('button', { name: 'Organization & workspaces', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Create workspace', exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Save organization', exact: true })).toBeEnabled();
    await expect(page.getByRole('textbox', { name: 'New workspace name', exact: true })).toHaveCount(0);

    await page.getByRole('button', { name: 'Team & invitations', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Send invitation', exact: true })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Suspend', exact: true }).first()).toBeEnabled();

    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Save security settings', exact: true })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Save regional settings', exact: true })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Save operational rules', exact: true })).toBeDisabled();
    await assertNoBrowserSecrets(page);
  });
});
