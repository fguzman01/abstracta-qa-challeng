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
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: BASE_URL,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});