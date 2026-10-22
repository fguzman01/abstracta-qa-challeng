import { defineConfig, devices } from '@playwright/test';
import { ENV, envData } from './config/test-data';

// La URL de cada ambiente vive en config/data/<ambiente>.json. La variable BASE_URL
// permite sobrescribirla sin tocar archivos (por ejemplo, desde el CI).
const BASE_URL = process.env.BASE_URL ?? envData.baseUrl;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // En CI se limita a 2: los runners tienen 2 núcleos.
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

  // Demoblaze carga productos, carrito y totales por AJAX desde una API externa
  // que puede tardar varios segundos, sobre todo con muchos browsers en paralelo.
  expect: { timeout: 15_000 },

  use: {
    baseURL: BASE_URL,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    // Pausa entre acciones solo para observar la ejecución (npm run test:slow). Por defecto es 0.
    launchOptions: {
      slowMo: Number(process.env.SLOW_MO ?? 0),
    },
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});