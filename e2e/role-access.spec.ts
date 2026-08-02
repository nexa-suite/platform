import { test, expect } from '@playwright/test';
import { requiresCredentials, signIn } from './support/auth';

for (const role of ['OWNER', 'SALES', 'WAREHOUSE', 'LOGISTICS'] as const) {
  test(`authenticated ${role} lands on an allowed surface`, async ({ page }) => {
    requiresCredentials(role);
    await signIn(page, role);
    await expect(page).not.toHaveURL(/sign-in/);
    await expect(page.locator('body')).not.toContainText(/documents|payments|uploads/i);
  });
}
