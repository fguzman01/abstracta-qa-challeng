import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

const ENV = process.env.ENV ?? 'staging';
dotenv.config({ path: path.resolve(__dirname, `.env.${ENV}`) });

const BASE_URL = process.env.BASE_URL;
if (!BASE_URL) {
  throw new Error(`Falta BASE_URL para ENV=${ENV}. Revisa el archivo .env.${ENV}`);
}

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['allure-playwright', {
      resultsDir: 'allure-results',
      environmentInfo: { Ambiente: ENV, 'Base URL': BASE_URL},
    }],
  ],

  use: {
    baseURL: BASE_URL,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    launchOptions: {
    slowMo: Number(process.env.SLOW_MO ?? 500),
    },
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});