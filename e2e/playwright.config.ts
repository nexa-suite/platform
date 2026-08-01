import { defineConfig, devices } from 'playwright/test';

const chromiumPath = process.env.NEXA_E2E_CHROMIUM_PATH;

export default defineConfig({
  testDir: '.',
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  reporter: process.env.CI ? 'dot' : 'list',
  outputDir: 'test-results',
  use: {
    baseURL: process.env.NEXA_PLATFORM_URL ?? 'http://localhost:4200',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    ...(chromiumPath ? { launchOptions: { executablePath: chromiumPath } } : {}),
    ...devices['Desktop Chrome']
  }
});
