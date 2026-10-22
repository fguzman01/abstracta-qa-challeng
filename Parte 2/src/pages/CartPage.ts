import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { PlaceOrderModal } from '../components/PlaceOrderModal';

export class CartPage extends BasePage {
  readonly placeOrderModal: PlaceOrderModal;
  private readonly cartRows: Locator;
  private readonly totalPrice: Locator;
  private readonly placeOrderButton: Locator;

    constructor(page: Page) {
        super(page);
        this.placeOrderModal = new PlaceOrderModal(page);
        this.cartRows = page.locator('#tbodyid tr');
        this.totalPrice = page.locator('#totalp');
        this.placeOrderButton = page.getByRole('button', { name: 'Place Order' });
    }

    async goto(): Promise<void> {
        await this.open('cart.html');
        await expect(this.placeOrderButton).toBeVisible();
    }

    async expectProductInCart(name: string): Promise<void> {
        await expect(this.cartRows.filter({ hasText: name })).toBeVisible();
    }

    // El total llega por AJAX. Sin esta espera se leería "" y Number("") da 0,
    // un número válido que ocultaría el error.
    async getTotal(): Promise<number> {
        await expect(this.totalPrice).not.toBeEmpty();
        return Number(await this.totalPrice.innerText());
    }

    async placeOrder(): Promise<PlaceOrderModal> {
        await this.placeOrderButton.click();
        return this.placeOrderModal;
    }
}