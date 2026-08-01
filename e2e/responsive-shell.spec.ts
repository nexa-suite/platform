import { test, expect } from 'playwright/test';
import { requiresCredentials, signIn } from './support/auth';

test('responsive shell keeps navigation usable at mobile width', async ({ page }) => {
  requiresCredentials('SALES');
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page, 'SALES');
  await expect(page.locator('body')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBeTruthy();
});
