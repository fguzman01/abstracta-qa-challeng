import { test, expect } from '../src/fixtures/api.fixture';
import { buildOrder } from '../config/data/order.factory';
import { Pet } from '../src/type/pet';
import { Order } from '../src/type/order';

const PETS_TO_ORDER = 5;

test('Escenario B: listar mascotas disponibles y crear una orden para 5 de ellas', async ({ petClient, storeClient }) => {
  const selectedPets = new Map<number, Pet>();
  const createdOrders: Order[] = [];

  await test.step(`Listar mascotas disponibles y guardar ${PETS_TO_ORDER}`, async () => {
    let pets: Pet[] = [];

    await expect(async () => {
      const response = await petClient.findByStatus('available');
      await expect(response, 'El listado de mascotas disponibles debe responder 2xx').toBeOK();
      pets = await response.json();
    }).toPass({ timeout: 15_000, intervals: [1_000, 2_000, 3_000] });

    for (const pet of pets) {
      if (selectedPets.size === PETS_TO_ORDER) break;
      if (Number.isSafeInteger(pet.id) && pet.status === 'available') {
        selectedPets.set(pet.id, pet);
      }
    }

    expect(selectedPets.size, `La API debe devolver al menos ${PETS_TO_ORDER} mascotas disponibles válidas`).toBe(PETS_TO_ORDER);
  });

  await test.step('Crear una orden por cada mascota seleccionada', async () => {
    for (const pet of selectedPets.values()) {
      const order = buildOrder(pet.id);
      const response = await storeClient.createOrder(order);
      await expect(response).toBeOK();

      const body: Order = await response.json();
      expect(body).toMatchObject({ id: order.id, petId: pet.id, status: 'placed' });
      createdOrders.push(body);
    }

    await test.info().attach('created-orders', {
      body: JSON.stringify(createdOrders, null, 2),
      contentType: 'application/json',
    });
  });
});