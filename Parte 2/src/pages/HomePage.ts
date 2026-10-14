import { Locator, Page, expect } from "@playwright/test";
import { Product } from '../types/product';

export class HomePage {
    private readonly productCards: Locator;
    private readonly nextButton: Locator;

    constructor(private readonly page: Page) {
        this.productCards = page.locator('#tbodyid .card');
        this.nextButton = page.locator('#next2');
    }

    async goto(): Promise<void> {
        await this.page.goto('');
        await expect(this.productCards.first()).toBeVisible();
    }

    async getProducts(): Promise<Product[]> {
        const products: Product[] = [];

        for (const card of await this.productCards.all()) {
            const titleLink = card.locator('.card-title a');
            const name = (await titleLink.innerText()).trim();
            const href = await titleLink.getAttribute('href');
            const priceText = await card.locator('h5').innerText();     

        products.push({
            name,
            price: Number(priceText.replace(/[^0-9.]/g, '')),
            link: new URL(href ?? '', this.page.url()).toString(),
            });
        }

        return products;
    }

    async goToNextPage(): Promise<void> {
        const firstTitle = this.productCards.first().locator('.card-title a');
        const titleBefore = await firstTitle.innerText();

        await this.nextButton.click();
        await expect(firstTitle).not.toHaveText(titleBefore);
    }

    async openProduct(name: string): Promise<void> {
        await this.page.locator('#tbodyid').getByRole('link', { name, exact: true }).click();
    }

}