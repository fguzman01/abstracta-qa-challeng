import { test, expect } from '../src/fixtures/api.fixture';
import { buildPet } from '../config/data/pet.factory';
import { Pet } from '../src/type/pet';

test('smoke: crear y obtener una mascota', async ({ petClient }) => {
  const pet = buildPet();

  const createResponse = await petClient.create(pet);
  await expect(createResponse).toBeOK();

  const getResponse = await petClient.getById(pet.id);
  await expect(getResponse).toBeOK();

  const body: Pet = await getResponse.json();
  expect(body).toMatchObject({ id: pet.id, name: pet.name, status: pet.status });
});