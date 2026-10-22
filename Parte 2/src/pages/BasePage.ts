// src/pages/BasePage.ts
import { Locator, Page } from '@playwright/test';

// Lo común a todas las pantallas: navegar y la barra superior. Cada page define
// su propia ruta y qué significa "cargada" en su goto().
export abstract class BasePage {
  private readonly cartLink: Locator;

  constructor(protected readonly page: Page) {
    this.cartLink = page.locator('#cartur');
  }

  protected async open(path: string): Promise<void> {
    await this.page.goto(path);
  }

  async goToCart(): Promise<void> {
    await this.cartLink.click();
  }
}