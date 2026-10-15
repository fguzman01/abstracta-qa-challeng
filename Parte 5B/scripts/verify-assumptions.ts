/**
 * Contrasta una muestra de casos generados (Parte 5B/outputs/casos-*-raw.csv)
 * con el comportamiento real de https://petstore.swagger.io/v2.
 *
 * Uso: npx tsx "Parte 5B/scripts/verify-assumptions.ts"
 *
 * - No envía credenciales (ni api_key ni OAuth2).
 * - Crea sus propios datos con ids/usernames únicos y elimina solo lo que creó.
 * - Ejecuta los casos en forma secuencial.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const BASE_URL = 'https://petstore.swagger.io/v2';
const OUTPUTS_DIR = resolve(dirname(process.argv[1]), '..', 'outputs');
const INT64_MAX = '9223372036854775807';

// ---------- Datos de los casos (Tipo y status esperado salen de los CSV) ----------

type CaseRow = { id: string; tipo: string; esperado: string };

function loadCases(): Map<string, CaseRow> {
  const cases = new Map<string, CaseRow>();
  for (const tag of ['pet', 'store', 'user']) {
    const lines = readFileSync(resolve(OUTPUTS_DIR, `casos-${tag}-raw.csv`), 'utf8')
      .split(/\r?\n/)
      .slice(1)
      .filter(Boolean);
    for (const line of lines) {
      const cols = line.split(';');
      const status = cols[7].match(/\b[1-5]\d{2}\b/);
      cases.set(cols[0], { id: cols[0], tipo: cols[3], esperado: status ? status[0] : '?' });
    }
  }
  return cases;
}

// ---------- Helpers HTTP ----------

type Res = { status: number; body: string };

async function call(method: string, path: string, opts: { json?: unknown; raw?: string; form?: Record<string, string> } = {}): Promise<Res> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  let body: string | undefined;
  if (opts.raw !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = opts.raw;
  } else if (opts.json !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(opts.json);
  } else if (opts.form) {
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
    body = new URLSearchParams(opts.form).toString();
  }
  try {
    const res = await fetch(`${BASE_URL}${path}`, { method, headers, body, signal: AbortSignal.timeout(20_000) });
    return { status: res.status, body: await res.text() };
  } catch (err) {
    return { status: 0, body: `ERROR de red: ${(err as Error).message}` };
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Id único < 2^53 para no perder precisión en JS. */
const uniqueId = () => Date.now() * 1000 + Math.floor(Math.random() * 1000);
const uniqueName = (prefix: string) => `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;

const petBody = (id: number | string, extra: Record<string, unknown> = {}) => ({
  id,
  category: { id: 1, name: 'dogs' },
  name: 'doggie',
  photoUrls: ['https://img/1.png'],
  tags: [{ id: 1, name: 'tag1' }],
  status: 'available',
  ...extra,
});

/** Crea una mascota propia y espera a que sea visible (la API tiene varias instancias). */
async function createPet(): Promise<number> {
  const id = uniqueId();
  await call('POST', '/pet', { json: petBody(id) });
  for (let i = 0; i < 5; i++) {
    if ((await call('GET', `/pet/${id}`)).status === 200) break;
    await sleep(500);
  }
  return id;
}

// ---------- Limpieza: solo recursos creados por este script ----------

const created = { pets: new Set<string>(), orders: new Set<string>(), users: new Set<string>() };

async function cleanup() {
  for (const id of created.pets) await call('DELETE', `/pet/${id}`);
  for (const id of created.orders) await call('DELETE', `/store/order/${id}`);
  for (const u of created.users) await call('DELETE', `/user/${encodeURIComponent(u)}`);
}

// ---------- Muestra de casos ----------

type Check = { request: string; res: Res; note?: string; extraOk?: boolean };
type Sample = { id: string; categoria: string; run: () => Promise<Check> };

const samples: Sample[] = [
  // Respuesta exitosa no documentada (se asumió 200)
  { id: 'PET-001', categoria: 'Éxito no documentado', run: async () => {
    const id = uniqueId(); created.pets.add(String(id));
    return { request: 'POST /pet (Pet completo sin token)', res: await call('POST', '/pet', { json: petBody(id) }) };
  } },
  { id: 'PET-016', categoria: 'Éxito no documentado', run: async () => {
    const id = await createPet(); created.pets.add(String(id));
    return { request: `PUT /pet (id propio name doggie-upd status sold)`, res: await call('PUT', '/pet', { json: petBody(id, { name: 'doggie-upd', status: 'sold' }) }) };
  } },
  { id: 'PET-035', categoria: 'Éxito no documentado', run: async () => {
    const id = await createPet(); created.pets.add(String(id));
    return { request: `POST /pet/{id} form name=doggie-form status=pending`, res: await call('POST', `/pet/${id}`, { form: { name: 'doggie-form', status: 'pending' } }) };
  } },
  { id: 'PET-042', categoria: 'Éxito no documentado', run: async () => {
    const id = await createPet();
    return { request: 'DELETE /pet/{id} (mascota propia)', res: await call('DELETE', `/pet/${id}`) };
  } },
  { id: 'STO-028', categoria: 'Éxito no documentado', run: async () => {
    const id = uniqueId();
    await call('POST', '/store/order', { json: { id, petId: 1, quantity: 1, status: 'placed', complete: false } });
    await sleep(500);
    const res = await call('DELETE', `/store/order/${id}`);
    if (res.status !== 200) created.orders.add(String(id));
    return { request: 'DELETE /store/order/{id} (orden propia)', res };
  } },
  { id: 'USR-009', categoria: 'Éxito no documentado', run: async () => {
    const users = [uniqueName('qa5b_a'), uniqueName('qa5b_b')];
    users.forEach((u) => created.users.add(u));
    return { request: 'POST /user/createWithArray (2 usuarios)', res: await call('POST', '/user/createWithArray', { json: users.map((username) => ({ username, firstName: 'QA', password: 'Pass123' })) }) };
  } },
  { id: 'USR-040', categoria: 'Éxito no documentado', run: async () => ({
    request: 'GET /user/logout (sin sesión)', res: await call('GET', '/user/logout'),
  }) },

  // Seguridad (se asumió 401 o 403)
  { id: 'PET-014', categoria: 'Seguridad', run: async () => {
    const id = uniqueId(); created.pets.add(String(id));
    return { request: 'POST /pet sin header Authorization', res: await call('POST', '/pet', { json: petBody(id) }) };
  } },
  { id: 'PET-033', categoria: 'Seguridad', run: async () => {
    const id = await createPet(); created.pets.add(String(id));
    return { request: 'GET /pet/{id} sin header api_key', res: await call('GET', `/pet/${id}`) };
  } },
  { id: 'PET-047', categoria: 'Seguridad', run: async () => {
    const id = await createPet(); created.pets.add(String(id));
    return { request: 'DELETE /pet/{id} sin token ni api_key', res: await call('DELETE', `/pet/${id}`) };
  } },
  { id: 'STO-004', categoria: 'Seguridad', run: async () => ({
    request: 'GET /store/inventory sin api_key', res: await call('GET', '/store/inventory'),
  }) },
  { id: 'USR-008', categoria: 'Seguridad', run: async () => {
    const username = uniqueName('qa5b'); created.users.add(username);
    return { request: 'POST /user sin sesión iniciada', res: await call('POST', '/user', { json: { username, firstName: 'QA', password: 'Pass123' } }) };
  } },

  // Campo requerido faltante
  { id: 'PET-003', categoria: 'Requerido faltante', run: async () => {
    const id = uniqueId(); created.pets.add(String(id));
    return { request: 'POST /pet sin name', res: await call('POST', '/pet', { json: { id, photoUrls: ['https://img/1.png'] } }) };
  } },
  { id: 'PET-058', categoria: 'Requerido faltante', run: async () => ({
    request: 'GET /pet/findByStatus sin query status', res: await call('GET', '/pet/findByStatus'),
  }) },

  // Valor fuera de enum
  { id: 'PET-007', categoria: 'Fuera de enum', run: async () => {
    const id = uniqueId(); created.pets.add(String(id));
    return { request: "POST /pet status='unknown'", res: await call('POST', '/pet', { json: petBody(id, { status: 'unknown' }) }) };
  } },
  { id: 'PET-059', categoria: 'Fuera de enum', run: async () => ({
    request: 'GET /pet/findByStatus?status=unknown', res: await call('GET', '/pet/findByStatus?status=unknown'),
  }) },
  { id: 'STO-010', categoria: 'Fuera de enum', run: async () => {
    const id = uniqueId(); created.orders.add(String(id));
    return { request: "POST /store/order status='cancelled'", res: await call('POST', '/store/order', { json: { id, petId: 1, quantity: 1, status: 'cancelled' } }) };
  } },

  // Tipo de dato incorrecto
  { id: 'PET-006', categoria: 'Tipo incorrecto', run: async () => ({
    request: "POST /pet id='abc'", res: await call('POST', '/pet', { json: petBody('abc') }),
  }) },
  { id: 'STO-011', categoria: 'Tipo incorrecto', run: async () => {
    const id = uniqueId(); created.orders.add(String(id));
    return { request: "POST /store/order quantity='abc'", res: await call('POST', '/store/order', { json: { id, petId: 1, quantity: 'abc', status: 'placed' } }) };
  } },

  // Id no numérico, negativo o fuera de rango
  { id: 'PET-027', categoria: 'Id inválido', run: async () => ({
    request: 'GET /pet/abc', res: await call('GET', '/pet/abc'),
  }) },
  { id: 'PET-029', categoria: 'Id inválido', run: async () => ({
    request: 'GET /pet/-1', res: await call('GET', '/pet/-1'),
  }) },
  { id: 'STO-023', categoria: 'Id inválido', run: async () => ({
    request: 'GET /store/order/11', res: await call('GET', '/store/order/11'),
  }) },

  // Id int64 máximo
  { id: 'PET-010', categoria: 'Int64 máximo', run: async () => {
    const pre = await call('GET', `/pet/${INT64_MAX}`);
    if (pre.status === 200) {
      return { request: `POST /pet id=${INT64_MAX}`, res: { status: 0, body: 'OMITIDO: ya existe una mascota ajena con ese id' }, extraOk: false };
    }
    created.pets.add(INT64_MAX);
    // Body crudo: JSON.stringify perdería precisión con un Number.
    const raw = `{"id":${INT64_MAX},"name":"doggie","photoUrls":["https://img/1.png"],"status":"available"}`;
    const res = await call('POST', '/pet', { raw });
    const preserved = res.body.includes(`"id":${INT64_MAX}`);
    return { request: `POST /pet id=${INT64_MAX}`, res, extraOk: preserved, note: preserved ? '' : 'id no preservado en el body' };
  } },

  // Control: resultado documentado en la spec
  { id: 'PET-026', categoria: 'Control (documentado)', run: async () => {
    const id = uniqueId();
    return { request: 'GET /pet/{idInexistente}', res: await call('GET', `/pet/${id}`) };
  } },
  { id: 'USR-017', categoria: 'Control (documentado)', run: async () => ({
    request: 'GET /user/{usernameInexistente}', res: await call('GET', `/user/${uniqueName('noexiste')}`),
  }) },

  // ---------- Segunda verificación: un representante por patrón "por analogía" ----------
  { id: 'PET-005', categoria: 'Body no parseable', run: async () => ({
    request: 'POST /pet con JSON truncado', res: await call('POST', '/pet', { raw: '{"name": "doggie", "photoUrls": [' }),
  }) },
  { id: 'USR-004', categoria: 'Tipo incorrecto', run: async () => {
    const username = uniqueName('qa5b'); created.users.add(username);
    return { request: "POST /user userStatus='activo'", res: await call('POST', '/user', { json: { username, firstName: 'QA', userStatus: 'activo' } }) };
  } },
  { id: 'STO-016', categoria: 'Tipo incorrecto', run: async () => {
    const id = uniqueId(); created.orders.add(String(id));
    return { request: "POST /store/order shipDate='2026-13-45'", res: await call('POST', '/store/order', { json: { id, petId: 1, quantity: 1, shipDate: '2026-13-45', status: 'placed' } }) };
  } },
  { id: 'PET-044', categoria: 'Id inválido', run: async () => ({
    request: 'DELETE /pet/abc', res: await call('DELETE', '/pet/abc'),
  }) },
  { id: 'STO-022', categoria: 'Id inválido', run: async () => ({
    request: 'GET /store/order/0', res: await call('GET', '/store/order/0'),
  }) },
  { id: 'PET-066', categoria: 'Requerido faltante', run: async () => ({
    request: 'GET /pet/findByTags sin query tags', res: await call('GET', '/pet/findByTags'),
  }) },
  { id: 'USR-035', categoria: 'Requerido faltante', run: async () => ({
    request: 'GET /user/login solo con password', res: await call('GET', '/user/login?password=Pass123'),
  }) },
  { id: 'USR-033', categoria: 'Login inválido', run: async () => {
    const username = uniqueName('qa5b'); created.users.add(username);
    await call('POST', '/user', { json: { username, firstName: 'QA', password: 'Pass123' } });
    await sleep(500);
    const query = new URLSearchParams({ username, password: 'incorrecta' });
    return { request: 'GET /user/login con password incorrecta', res: await call('GET', `/user/login?${query}`) };
  } },
  { id: 'USR-034', categoria: 'Login inválido', run: async () => {
    const query = new URLSearchParams({ username: uniqueName('noexiste'), password: 'cualquiera' });
    return { request: 'GET /user/login con usuario inexistente', res: await call('GET', `/user/login?${query}`) };
  } },
];

// ---------- Ejecución ----------

const excerpt = (s: string) => s.replace(/[\r\n]+/g, ' ').replace(/;/g, ',').slice(0, 200);

async function main() {
  const cases = loadCases();
  const rows: string[] = ['ID;Tipo;Request;Status esperado;Status real;Coincide;Extracto del body'];
  const results: { tipo: string; categoria: string; ok: boolean }[] = [];

  for (const s of samples) {
    const meta = cases.get(s.id);
    if (!meta) throw new Error(`Caso ${s.id} no encontrado en los CSV`);
    const { request, res, extraOk, note } = await s.run();
    const ok = String(res.status) === meta.esperado && extraOk !== false;
    results.push({ tipo: meta.tipo, categoria: s.categoria, ok });
    const body = note ? `${note} | ${res.body}` : res.body;
    rows.push([s.id, meta.tipo, request, meta.esperado, String(res.status), ok ? 'Sí' : 'No', excerpt(body)].join(';'));
    console.log(`${s.id.padEnd(8)} ${request.padEnd(45)} esperado ${meta.esperado} real ${res.status} ${ok ? 'OK' : 'NO'}`);
    await sleep(300);
  }

  await cleanup();

  const outFile = resolve(OUTPUTS_DIR, 'verificacion-api.csv');
  writeFileSync(outFile, rows.join('\n') + '\n', 'utf8');

  const summarize = (key: 'tipo' | 'categoria') => {
    const groups = new Map<string, { ok: number; ko: number }>();
    for (const r of results) {
      const g = groups.get(r[key]) ?? { ok: 0, ko: 0 };
      r.ok ? g.ok++ : g.ko++;
      groups.set(r[key], g);
    }
    console.table(Object.fromEntries([...groups].map(([k, g]) => [k, { total: g.ok + g.ko, coinciden: g.ok, 'no coinciden': g.ko }])));
  };

  const ok = results.filter((r) => r.ok).length;
  console.log(`\nResumen: ${results.length} casos | ${ok} coinciden | ${results.length - ok} no coinciden`);
  console.log('\nPor tipo:');
  summarize('tipo');
  console.log('Por categoría de supuesto:');
  summarize('categoria');
  console.log(`\nCSV guardado en ${outFile}`);
}

main().catch(async (err) => {
  console.error(err);
  await cleanup();
  process.exit(1);
});
