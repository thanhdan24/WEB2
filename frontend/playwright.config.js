import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests', workers: 1,
  use: { baseURL: 'http://localhost:5500', headless: true, launchOptions: { channel: 'msedge' } },
  webServer: { command: 'npm.cmd start', url: 'http://localhost:5500', reuseExistingServer: false }
});
