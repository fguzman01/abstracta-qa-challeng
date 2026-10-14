import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class ProductPage extends BasePage {
  private readonly productName: Locator;
  private readonly addToCartButton: Locator;

  constructor(page: Page) {
    super(page);
    this.productName = page.locator('.name');
    this.addToCartButton = page.getByRole('link', { name: 'Add to cart' });
  }

  async expectProductLoaded(name: string): Promise<void> {
    await expect(this.productName).toHaveText(name);
  }

  async addToCart(): Promise<void> {
    const dialogPromise = this.page.waitForEvent('dialog');
    await this.addToCartButton.click();

    const dialog = await dialogPromise;
    expect(dialog.message()).toContain('Product added');
    await dialog.accept();
  }
}