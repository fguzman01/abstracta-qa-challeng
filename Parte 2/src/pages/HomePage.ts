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
            // El href viene relativo (prod.html?idp_=1): se completa a URL absoluta para el archivo.
            link: new URL(href ?? '', this.page.url()).toString(),
            });
        }

        return products;
    }

    // La grilla se reemplaza por AJAX y la URL no cambia. Se espera a que cambie el primer
    // producto: si se leyera justo después del clic, se volvería a leer la página 1.
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