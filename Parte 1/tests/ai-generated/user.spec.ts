import { test, expect } from '../../src/fixtures/api.fixture';
import { buildUser } from '../../config/data/user.factory';
import { User } from '../../src/type/user';

const RETRY = { timeout: 15_000, intervals: [1_000, 2_000, 3_000] };

test('USR-015: obtener usuario existente devuelve sus datos', async ({ userClient }) => {
  const user = buildUser();

  await test.step('Crear usuario con username único', async () => {
    await expect(await userClient.create(user)).toBeOK();
  });

  await test.step('Obtener el usuario por username', async () => {
    await expect(async () => {
      const response = await userClient.getByUsername(user.username);
      await expect(response).toBeOK();

      const body: User = await response.json();
      expect(body).toMatchObject({
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        userStatus: user.userStatus,
      });
    }).toPass(RETRY);
  });
});

test('USR-017: obtener usuario inexistente devuelve 404', async ({ userClient }) => {
  const { username } = buildUser();

  await test.step('Consultar un username único que nunca se creó', async () => {
    const response = await userClient.getByUsername(username);
    expect(response.status()).toBe(404);

    const body = await response.json();
    expect(body.message).toBe('User not found');
  });
});

test('USR-027: eliminar usuario existente', async ({ userClient }) => {
  const user = buildUser();

  await test.step('Crear usuario y confirmar que existe', async () => {
    await expect(await userClient.create(user)).toBeOK();
    await expect(async () => {
      await expect(await userClient.getByUsername(user.username)).toBeOK();
    }).toPass(RETRY);
  });

  await test.step('Eliminar el usuario', async () => {
    await expect(async () => {
      await expect(await userClient.delete(user.username)).toBeOK();
    }).toPass(RETRY);
  });

  await test.step('Verificar que GET posterior devuelve 404', async () => {
    await expect(async () => {
      const response = await userClient.getByUsername(user.username);
      expect(response.status()).toBe(404);
    }).toPass(RETRY);
  });
});
