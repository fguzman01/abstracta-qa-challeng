// src/pages/BasePage.ts
import { Locator, Page } from '@playwright/test';

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