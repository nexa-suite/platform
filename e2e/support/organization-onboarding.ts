import { expect, type Page } from '@playwright/test';

export interface OrganizationRegistrationData {
  readonly legalName: string;
  readonly displayName: string;
  readonly storageSite: string;
  readonly storageAddress: string;
  readonly founderName: string;
  readonly founderEmail: string;
  readonly workspaceName: string;
  readonly workspaceSlug: string;
}

export async function fillOrganizationRegistration(page: Page, data: OrganizationRegistrationData): Promise<void> {
  await page.locator('input[formcontrolname="legalName"]').fill(data.legalName);
  await page.locator('input[formcontrolname="displayName"]').fill(data.displayName);
  await page.locator('.step-actions button.primary-action').click();
  await expect(page.locator('input[formcontrolname="storageSiteName"]')).toBeVisible();

  await page.locator('input[formcontrolname="storageSiteName"]').fill(data.storageSite);
  await page.locator('input[formcontrolname="storageSiteAddress"]').fill(data.storageAddress);
  await page.locator('.step-actions button.primary-action').click();
  await expect(page.locator('input[formcontrolname="founderDisplayName"]')).toBeVisible();

  await page.locator('input[formcontrolname="founderDisplayName"]').fill(data.founderName);
  await page.locator('input[formcontrolname="founderEmail"]').fill(data.founderEmail);
  await page.locator('.step-actions button.primary-action').click();
  await expect(page.locator('input[formcontrolname="workspaceName"]')).toBeVisible();

  await page.locator('input[formcontrolname="workspaceName"]').fill(data.workspaceName);
  await page.locator('input[formcontrolname="workspaceSlug"]').fill(data.workspaceSlug);
  await page.locator('.step-actions button.primary-action').click();
  await expect(page.locator('.plan-options')).toBeVisible();

  await page.locator('.step-actions button.primary-action').click();
  await expect(page.locator('#terms-accepted')).toBeVisible();
  await page.locator('#terms-accepted').check();
}
