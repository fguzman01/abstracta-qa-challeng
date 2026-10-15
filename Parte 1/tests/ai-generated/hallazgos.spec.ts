/**
 * Hallazgos verificados en Parte 5B (ver Parte 5B/outputs/evaluacion-resumen.md).
 * Cada test valida lo que documenta la spec, no el comportamiento actual. Por eso está
 * marcado con test.fail(): hoy falla como se espera y avisará cuando el bug se corrija.
 */
import { test, expect } from '../../src/fixtures/api.fixture';
import { buildPet } from '../../config/data/pet.factory';
import { buildOrder } from '../../config/data/order.factory';
import { buildUser } from '../../config/data/user.factory';

const RETRY = { timeout: 15_000, intervals: [1_000, 2_000, 3_000] };

test.fail('PET-027: obtener mascota con id no numérico devuelve 400', {
  annotation: {
    type: 'issue',
    description:
      'GET /pet/abc responde 404 en vez del 400 Invalid ID supplied documentado y expone ' +
      '"java.lang.NumberFormatException: For input string: \\"abc\\"" en el body. Evidencia: Parte 5B/outputs/verificacion-api.csv',
  },
}, async ({ petClient }) => {
  await test.step('Consultar GET /pet/abc', async () => {
    const response = await petClient.getByRawId('abc');
    expect.soft(response.status(), 'La spec documenta 400 Invalid ID supplied').toBe(400);
    expect.soft(await response.text(), 'El body no debe exponer excepciones internas').not.toContain('Exception');
  });
});

test.fail('USR-033: login con password incorrecta devuelve 400', {
  annotation: {
    type: 'issue',
    description:
      'GET /user/login con password incorrecta responde 200 "logged in user session:<n>" en vez del 400 ' +
      'Invalid username/password supplied documentado: el login acepta cualquier credencial. Evidencia: Parte 5B/outputs/verificacion-api.csv',
  },
}, async ({ userClient }) => {
  const user = buildUser();

  await test.step('Crear usuario con password conocida', async () => {
    await expect(await userClient.create(user)).toBeOK();
    await expect(async () => {
      await expect(await userClient.getByUsername(user.username)).toBeOK();
    }).toPass(RETRY);
  });

  await test.step('Hacer login con una password incorrecta', async () => {
    const response = await userClient.login(user.username, `${user.password}-incorrecta`);
    expect(response.status(), 'La spec documenta 400 Invalid username/password supplied').toBe(400);
  });
});

test.fail('STO-016: crear orden con shipDate inválido devuelve 400', {
  annotation: {
    type: 'issue',
    description:
      'POST /store/order con shipDate "2026-13-45" responde 200 y guarda "2027-02-14T00:00:00.000+0000" ' +
      '(corrupción silenciosa) en vez del 400 Invalid Order documentado. Evidencia: Parte 5B/outputs/verificacion-api.csv',
  },
}, async ({ storeClient }) => {
  const invalidDate = '2026-13-45';
  const order = buildOrder(buildPet().id, { shipDate: invalidDate });

  await test.step('Crear orden con una fecha inexistente', async () => {
    const response = await storeClient.createOrder(order);
    expect.soft(response.status(), 'La spec documenta 400 Invalid Order').toBe(400);

    if (response.ok()) {
      const body = await response.json();
      expect.soft(body.shipDate, 'Si se acepta, no debe guardarse una fecha distinta a la enviada').toBe(invalidDate);
    }
  });
});

test.fail('PET-006: crear mascota con id de tipo incorrecto devuelve 405', {
  annotation: {
    type: 'issue',
    description:
      'POST /pet con id "abc" responde 500 "something bad happened" en vez del 405 Invalid input documentado. ' +
      'Evidencia: Parte 5B/outputs/verificacion-api.csv',
  },
}, async ({ petClient }) => {
  await test.step('Crear mascota con id string', async () => {
    const response = await petClient.createRaw({ ...buildPet(), id: 'abc' });
    expect(response.status(), 'La spec documenta 405 Invalid input').toBe(405);
  });
});
