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
    for (const [status, quantity] of Object.entries(PET_DISTRIBUTION) as [PetStatus, number][]) {
      for (let i = 0; i < quantity; i++) {
        const pet = buildPet({ status });
        const response = await petClient.create(pet);
        expect(response).toBeOK();
        createdPets.push(pet);
      }
    }
    expect(createdPets).toHaveLength(10);
  });

  await test.step('Obtener los detalles de la mascota vendida', async () => {
    const soldPet = createdPets.find((pet) => pet.status === 'sold');
    if (!soldPet) {
      throw new Error('No se creó ninguna mascota en estado sold');
    }

    const response = await petClient.getById(soldPet.id);
    expect(response).toBeOK();

    const body: Pet = await response.json();
    expect(body).toMatchObject({ id: soldPet.id, name: soldPet.name, status: 'sold' });

    await test.info().attach('sold-pet', {
      body: JSON.stringify(body, null, 2),
      contentType: 'application/json',
    });
  });
  
});