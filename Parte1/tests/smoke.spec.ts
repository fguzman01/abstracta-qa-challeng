import { test, expect } from '@playwright/test';
import { PetClient } from '../src/clients/PetClient';
import { Pet } from '../src/type/pet';
import { envData } from '../config/test-data';
import { buildPet } from '../config/data/pet.factory';

test('smoke: crear y obtener una mascota', async ({ request }) => {
  const petClient = new PetClient(request);

  /*const pet: Pet = {
    id: Date.now(),
    name: `${envData.petNamePrefix}-Smoke Dog`,
    photoUrls: [],
    status: 'available',
    tags: envData.tags,
  };*/

  const pet = buildPet();

  const createResponse = await petClient.create(pet);
  expect(createResponse).toBeOK();

  const getResponse = await petClient.getById(pet.id);
  expect(getResponse).toBeOK();

  const body: Pet = await getResponse.json();
  console.log('Mascota obtenida:', body);
  expect(body.id).toBe(pet.id);
  expect(body.name).toBe(pet.name);
  expect(body.status).toBe(pet.status);
});