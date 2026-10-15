import { test, expect } from '../src/fixtures/pages.fixture';
import { envData } from '../config/test-data';

test('Opcional 1: el total del carrito es la suma de los productos agregados', async ({ purchaseFlow, productPage, cartPage }) => {
  const prices: number[] = [];

  for (const name of envData.cartProducts) {
    prices.push(await purchaseFlow.addToCart(name));
  }

  const expectedTotal = prices.reduce((sum, price) => sum + price, 0);

  await test.step(`Validar productos y total (${expectedTotal}) en el carrito`, async () => {
    await productPage.goToCart();
    for (const name of envData.cartProducts) {
      await cartPage.expectProductInCart(name);
    }
    await expect.poll(() => cartPage.getTotal(), {
      message: 'El total del carrito debe ser la suma de los precios',
    }).toBe(expectedTotal);
  });
});