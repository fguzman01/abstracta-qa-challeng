import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { acceptNextDialog } from '../utils/dialog';

export class ProductPage extends BasePage {
  private readonly productName: Locator;
  private readonly addToCartButton: Locator;
  private readonly productPrice: Locator;

  constructor(page: Page) {
    super(page);
    this.productName = page.locator('.name');
    this.addToCartButton = page.getByRole('link', { name: 'Add to cart' });
    this.productPrice = page.locator('.price-container');
  }

  async expectProductLoaded(name: string): Promise<void> {
    await expect(this.productName).toHaveText(name);
  }

  async addToCart(): Promise<void> {
    const message = await acceptNextDialog(this.page, () => this.addToCartButton.click());
     expect(message).toContain('Product added');
  }

    async getPrice(): Promise<number> {
    const text = await this.productPrice.innerText();
    const price = Number(text.match(/\d+(\.\d+)?/)?.[0]);
    expect(price, `No se pudo leer el precio desde "${text}"`).toBeGreaterThan(0);
    return price;
  }
}