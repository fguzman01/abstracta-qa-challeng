import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Ambiente activo: staging por defecto
const ENV = process.env.ENV ?? 'staging';
dotenv.config({ path: path.resolve(__dirname, `.env.${ENV}`) });

// Falla rápido si el ambiente no está bien configurado
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
    baseURL: BASE_URL, // debe terminar en "/" (ej: .../v2/)
    extraHTTPHeaders: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'api',
    },
  ],
});