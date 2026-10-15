import { test, expect } from '../src/fixtures/pages.fixture';

test('Opcional 2: no permite comprar con el formulario vacío', async ({ cartPage }) => {
  await cartPage.goto();
  const modal = await cartPage.placeOrder();

  const alertMessage = await test.step('Enviar el formulario vacío', () => modal.submitExpectingAlert());

  await test.step('Validar que la compra fue rechazada', async () => {
    //expect(alertMessage).toBe('Please fill out Name and Creditcard.');
    expect(alertMessage).toBe('Mensaje que no existe');
    await modal.expectNoConfirmation();
  });
});