import { test, expect } from '../src/fixtures/api.fixture';
import { buildPet } from '../config/data/pet.factory';
import { PetClient } from '../src/clients/PetClient';
import { Pet, PetStatus } from '../src/type/pet';

const POLL_OPTIONS = { timeout: 15_000, intervals: [1_000, 2_000, 3_000] };

async function isPetListedWithStatus(
  petClient: PetClient,
  petId: number,
  status: PetStatus,
): Promise<boolean | string> {
  const response = await petClient.findByStatus(status);
  if (!response.ok()) {
    return `HTTP ${response.status()} al consultar status=${status}`;
  }
  try {
    const pets: Pet[] = await response.json();
    return pets.some((pet) => pet.id === petId);
  } catch {
    return `Respuesta no es JSON válido al consultar status=${status}`;
  }
}

test('Escenario C: cambiar estado de available a sold y verificar por estado', async ({ petClient }) => {
  test.setTimeout(60_000);
  const pet = buildPet({ status: 'available' });

  await test.step('Crear mascota en estado available', async () => {
    const response = await petClient.create(pet);
    expect(response, 'La creación de la mascota debe responder 2xx').toBeOK();
  });

  await test.step('Actualizar el estado a sold', async () => {
    const response = await petClient.update({ ...pet, status: 'sold' });
    expect(response, 'La actualización debe responder 2xx').toBeOK();

    const body: Pet = await response.json();
    expect(body.status, 'El PUT debe devolver la mascota con status sold').toBe('sold');
  });

  await test.step('Verificar que aparece al consultar por sold', async () => {
    await expect
      .poll(() => isPetListedWithStatus(petClient, pet.id, 'sold'), {
        ...POLL_OPTIONS,
        message: `La mascota ${pet.id} debería aparecer en findByStatus=sold`,
      })
      .toBe(true);
  });

  await test.step('Verificar que ya no aparece como available', async () => {
    await expect
      .poll(() => isPetListedWithStatus(petClient, pet.id, 'available'), {
        ...POLL_OPTIONS,
        message: `La mascota ${pet.id} no debería seguir en findByStatus=available`,
      })
      .toBe(false);
  });
});

