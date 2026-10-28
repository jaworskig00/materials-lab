import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e', fullyParallel: false, workers: 2, timeout: 60000,
  expect: { timeout: 30000 },
  use: { baseURL: 'http://127.0.0.1:4173/materials-lab/', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1100 } } }, { name: 'webkit', use: { ...devices['Desktop Safari'], viewport: { width: 1440, height: 1100 } } }],
  webServer: { command: 'npm run preview -- --port 4173', url: 'http://127.0.0.1:4173/materials-lab/', reuseExistingServer: !process.env.CI, timeout: 30000 },
  reporter: [['list'], ['html', { open: 'never' }]],
});
