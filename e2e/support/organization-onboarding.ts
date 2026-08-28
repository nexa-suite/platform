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
  const taxIdSuffix = data.workspaceSlug.replace(/\D/g, '').slice(-9).padStart(9, '0');
  await page.locator('input[formcontrolname="businessIdentifier"]').fill(`20${taxIdSuffix}`);
  await page.locator('select[formcontrolname="industrySector"]').selectOption('coldChainDistribution');
  await page.locator('.step-actions button.primary-action').click();

  await page.locator('select[formcontrolname="operationType"]').selectOption('b2bColdChainDistributor');
  await page.locator('select[formcontrolname="monthlyVolume"]').selectOption('lt50');
  await page.locator('select[formcontrolname="deliveryCoverage"]').selectOption('limaMetropolitana');
  await page.locator('input[formcontrolname="minTemperature"]').fill('-18');
  await page.locator('input[formcontrolname="maxTemperature"]').fill('5');
  await page.locator('fieldset.choice-field input[type="checkbox"]').first().check();
  await page.locator('.step-actions button.primary-action').click();

  await expect(page.locator('input[formcontrolname="storageSiteName"]')).toBeVisible();

  await page.locator('input[formcontrolname="storageSiteName"]').fill(data.storageSite);
  await page.locator('input[formcontrolname="storageSiteAddress"]').fill(data.storageAddress);
  await page.locator('select[formcontrolname="city"]').selectOption('lima');
  await page.locator('select[formcontrolname="district"]').selectOption('callao');
  await page.locator('select[formcontrolname="locationCountry"]').selectOption('peru');
  await page.locator('input[formcontrolname="warehouseCount"]').fill('1');
  await page.locator('input[formcontrolname="coldRoomsCount"]').fill('1');
  await page.locator('select[formcontrolname="capacityEstimate"]').selectOption('lt100Pallets');
  await page.locator('.step-actions button.primary-action').click();

  const founderParts = data.founderName.trim().split(/\s+/);
  await page.locator('input[formcontrolname="firstName"]').fill(founderParts.shift() ?? 'E2E');
  await page.locator('input[formcontrolname="lastName"]').fill(founderParts.join(' ') || 'Founder');
  await page.locator('input[formcontrolname="jobTitle"]').fill('Company Owner');
  await page.locator('input[formcontrolname="founderEmail"]').fill(data.founderEmail);
  await page.locator('input[formcontrolname="phone"]').fill('999999999');
  await page.locator('.step-actions button.primary-action').click();

  await expect(page.locator('input[formcontrolname="workspaceName"]')).toBeVisible();

  await page.locator('input[formcontrolname="workspaceName"]').fill(data.workspaceName);
  await page.locator('input[formcontrolname="workspaceSlug"]').fill(data.workspaceSlug);
  await page.locator('input[formcontrolname="workspaceDisplayName"]').fill(data.workspaceName);
  await page.locator('.step-actions button.primary-action').click();
  await expect(page.locator('.plan-options')).toBeVisible();

  await page.locator('.step-actions button.primary-action').click();
  await expect(page.locator('#terms-accepted')).toBeVisible();
  await page.locator('#terms-accepted').check();
}
