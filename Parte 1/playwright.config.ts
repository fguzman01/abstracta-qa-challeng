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
  // En CI se limita a 2: los runners tienen 2 núcleos y no conviene saturar una API pública.
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['list'],
    // Sin esto, el reporte se abre solo al fallar y bloquea la terminal (y el pipeline).
    ['html', { open: 'never' }],
    ['allure-playwright', {
      resultsDir: 'allure-results',
      environmentInfo: { Ambiente: ENV, 'Base URL': BASE_URL },
    }],
  ],

  use: {
    baseURL: BASE_URL, // debe terminar en "/" (ej: .../v2/)
    extraHTTPHeaders: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    trace: 'retain-on-failure',
  },

  projects: [
    {
      name: 'api',
    },
  ],
});