import { defineConfig } from '@playwright/test';
import { ENV, envData } from './config/test-data';

// La URL de cada ambiente vive en config/data/<ambiente>.json. La variable BASE_URL
// permite sobrescribirla sin tocar archivos (por ejemplo, desde el CI).
const BASE_URL = process.env.BASE_URL ?? envData.baseUrl;

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
    // En API no hay screenshot ni video: la evidencia de un fallo es el tráfico HTTP del trace.
    trace: 'retain-on-failure',
  },

  projects: [
    {
      name: 'api',
    },
  ],
});