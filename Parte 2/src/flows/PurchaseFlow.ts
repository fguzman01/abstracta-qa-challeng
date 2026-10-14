import { test } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { ProductPage } from '../pages/ProductPage';
import { CartPage } from '../pages/CartPage';
import { PurchaseConfirmation } from '../components/PlaceOrderModal';
import { Customer } from '../types/customer';

export interface PurchaseResult {
  cartTotal: number;
  confirmation: PurchaseConfirmation;
}

export class PurchaseFlow {
  constructor(
    private readonly homePage: HomePage,
    private readonly productPage: ProductPage,
    private readonly cartPage: CartPage,
  ) {}

  async buyProduct(productName: string, customer: Customer): Promise<PurchaseResult> {
    await test.step(`Agregar "${productName}" al carrito`, async () => {
      await this.homePage.goto();
      await this.homePage.openProduct(productName);
      await this.productPage.expectProductLoaded(productName);
      await this.productPage.addToCart();
    });

    const cartTotal = await test.step('Verificar el carrito', async () => {
      await this.productPage.goToCart();
      await this.cartPage.expectProductInCart(productName);
      return this.cartPage.getTotal();
    });

    const confirmation = await test.step('Completar la orden', async () => {
      const modal = await this.cartPage.placeOrder();
      await modal.fillForm(customer);
      return modal.purchase();
    });

    return { cartTotal, confirmation };
  }
}