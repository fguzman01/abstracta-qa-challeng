import { test, expect } from '../../src/fixtures/api.fixture';
import { buildPet, generateId } from '../../config/data/pet.factory';
import { Pet } from '../../src/type/pet';

// La API pública tiene varias instancias: una lectura justo después de escribir puede no verla aún
const RETRY = { timeout: 15_000, intervals: [1_000, 2_000, 3_000] };

test('PET-026: obtener mascota inexistente devuelve 404', async ({ petClient }) => {
  const missingId = generateId();

  await test.step('Consultar un id único que nunca se creó', async () => {
    const response = await petClient.getById(missingId);
    expect(response.status()).toBe(404);

    const body = await response.json();
    expect(body.message).toBe('Pet not found');
  });
});

test('PET-035: actualizar name y status por form data', async ({ petClient }) => {
  const pet = buildPet({ status: 'available' });
  const newName = `${pet.name}-form`;

  await test.step('Crear mascota en estado available', async () => {
    await expect(await petClient.create(pet)).toBeOK();
  });

  await test.step('Actualizar name y status con application/x-www-form-urlencoded', async () => {
    const response = await petClient.updateWithForm(pet.id, { name: newName, status: 'pending' });
    await expect(response).toBeOK();
  });

  await test.step('Verificar que GET refleja los cambios', async () => {
    await expect(async () => {
      const response = await petClient.getById(pet.id);
      await expect(response).toBeOK();
      const body: Pet = await response.json();
      expect(body).toMatchObject({ id: pet.id, name: newName, status: 'pending' });
    }).toPass(RETRY);
  });
});

test('PET-042: eliminar mascota existente', async ({ petClient }) => {
  const pet = buildPet();

  await test.step('Crear mascota', async () => {
    await expect(await petClient.create(pet)).toBeOK();
  });

  await test.step('Eliminar la mascota', async () => {
    await expect(async () => {
      await expect(await petClient.delete(pet.id)).toBeOK();
    }).toPass(RETRY);
  });

  await test.step('Verificar que GET posterior devuelve 404', async () => {
    await expect(async () => {
      const response = await petClient.getById(pet.id);
      expect(response.status()).toBe(404);
    }).toPass(RETRY);
  });
});

test('PET-064: buscar mascota por un tag único', async ({ petClient }) => {
  const tagId = generateId();
  const tagName = `tag-${tagId}`;
  const pet = buildPet({ tags: [{ id: tagId, name: tagName }] });

  await test.step('Crear mascota con un tag de nombre único', async () => {
    await expect(await petClient.create(pet)).toBeOK();
  });

  await test.step('Buscar por el tag y verificar el resultado', async () => {
    await expect(async () => {
      const response = await petClient.findByTags([tagName]);
      await expect(response).toBeOK();

      const pets: Pet[] = await response.json();
      expect(pets.map((p) => p.id)).toContain(pet.id);
      for (const found of pets) {
        expect(found.tags?.map((t) => t.name)).toContain(tagName);
      }
    }).toPass(RETRY);
  });
});
