import { test, expect } from '../../src/fixtures/api.fixture';
import { buildPet } from '../../config/data/pet.factory';
import { buildOrder } from '../../config/data/order.factory';

const RETRY = { timeout: 15_000, intervals: [1_000, 2_000, 3_000] };

test('STO-028: eliminar orden existente', async ({ petClient, storeClient }) => {
  const pet = buildPet();
  const order = buildOrder(pet.id);

  await test.step('Crear mascota y una orden propia', async () => {
    await expect(await petClient.create(pet)).toBeOK();
    await expect(await storeClient.createOrder(order)).toBeOK();
  });

  await test.step('Eliminar la orden', async () => {
    await expect(async () => {
      await expect(await storeClient.deleteOrder(order.id)).toBeOK();
    }).toPass(RETRY);
  });

  await test.step('Verificar que un segundo DELETE devuelve 404', async () => {
    // Se verifica con DELETE y no con GET: GET solo admite ids de 1 a 10 según la spec
    await expect(async () => {
      const response = await storeClient.deleteOrder(order.id);
      expect(response.status()).toBe(404);
    }).toPass(RETRY);
  });
});
