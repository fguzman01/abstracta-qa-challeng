import { test, expect } from '../src/fixtures/api.fixture';
import { buildPet } from '../config/data/pet.factory';
import {Pet, PetStatus} from '../src/type/pet'

const PET_DISTRIBUTION: Record<PetStatus, number> = {
  available: 5,
  pending: 4,
  sold: 1,
};

test('Escenario A: crear 10 mascotas por estado y obtener la vendida', async ({ petClient }) => {
  const createdPets: Pet[] = [];

  await test.step('Crear mascotas según la distribución de estados', async () => {
  const petsToCreate: Pet[] = [];
  for (const [status, quantity] of Object.entries(PET_DISTRIBUTION) as [PetStatus, number][]) {
    for (let i = 0; i < quantity; i++) {
      petsToCreate.push(buildPet({ status }));
    }
  }

// Las 10 creaciones se lanzan en paralelo: en ejecución paralela, el tiempo total
// lo define el test más lento, y este era el más lento al crear de a una.

  const responses = await Promise.all(petsToCreate.map((pet) => petClient.create(pet)));

  for (const response of responses) {
    await expect(response).toBeOK();
  }
  createdPets.push(...petsToCreate);
  expect(createdPets).toHaveLength(10);
  });

  await test.step('Obtener los detalles de la mascota vendida', async () => {
    const soldPet = createdPets.find((pet) => pet.status === 'sold');
    if (!soldPet) {
      throw new Error('No se creó ninguna mascota en estado sold');
    }

    const response = await petClient.getById(soldPet.id);
    await expect(response).toBeOK();

    const body: Pet = await response.json();
    await expect(body).toMatchObject({ id: soldPet.id, name: soldPet.name, status: 'sold' });

    await test.info().attach('sold-pet', {
      body: JSON.stringify(body, null, 2),
      contentType: 'application/json',
    });
  });
  
});