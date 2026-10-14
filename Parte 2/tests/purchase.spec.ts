import { test, expect } from '../src/fixtures/pages.fixture';
import { envData } from '../config/test-data';

test('Escenario B: comprar un producto', async ({ purchaseFlow }) => {
  const { product, customer } = envData;

  const { cartTotal, confirmation } = await purchaseFlow.buyProduct(product, customer);

  await test.step('Validar la confirmación de compra', async () => {
    expect(cartTotal, 'El total del carrito debe ser mayor a 0').toBeGreaterThan(0);
    expect(confirmation.title).toBe('Thank you for your purchase!');
    expect(confirmation.details).toContain(`Amount: ${cartTotal} USD`);
    expect(confirmation.details).toContain(`Card Number: ${customer.card}`);
    expect(confirmation.details).toContain(`Name: ${customer.name}`);
  });
});