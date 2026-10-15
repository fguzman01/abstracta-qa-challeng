/**
 * Genera Parte 5B/outputs/evaluacion-casos.csv a partir de:
 *   - casos-{pet,store,user}-raw.csv (columnas del caso y status esperado por la IA)
 *   - verificacion-api.csv (status real de los casos ejecutados)
 *   - la clasificación manual de abajo (evalMap)
 *
 * Uso (desde Parte 5B/): node scripts/build-evaluacion.mjs
 * Imprime la tabla de totales por clasificación y tag para el resumen.
 *
 * Regla de consistencia para validaciones (campo requerido, enum, formato, rango):
 *   - La spec declara la restricción Y documenta un código de error para input inválido
 *     en ese endpoint, pero la API no la aplica  -> Hallazgo.
 *   - La restricción o el código de error no están en la spec, o la spec se contradice
 *     sobre la regla misma                         -> Pregunta al negocio.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUTPUTS = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'outputs');
const OUT = resolve(OUTPUTS, 'evaluacion-casos.csv');
const A = 'Automatizar', AA = 'Automatizar con ajuste', H = 'Hallazgo', P = 'Pregunta al negocio', D = 'Descartar';

// ID -> [clasificación, justificación]
const evalMap = {
  // ---------- PET ----------
  'PET-001': [A, 'Positivo con supuesto de éxito verificado: 200 y el body devuelve el Pet enviado.'],
  'PET-002': [A, 'Análogo a PET-001. Leer el id asignado del body para poder limpiar.'],
  'PET-003': [H, 'name es requerido y POST /pet documenta 405 Invalid input, pero la API guarda el Pet sin name (200).'],
  'PET-004': [H, 'photoUrls es requerido y se documenta 405. Por analogía con PET-003 la API no valida requeridos.'],
  'PET-005': [H, 'JSON truncado devuelve 500 "something bad happened" en vez del 405 documentado.'],
  'PET-006': [H, 'Tipo incorrecto en id devuelve 500 "something bad happened" en vez de un 4xx de validación.'],
  'PET-007': [H, 'Enum declarado y 405 documentado, pero la API guarda status=unknown (200). Mismo criterio que PET-021.'],
  'PET-008': [P, 'La API no valida requeridos (PET-003). La spec no define minLength para name.'],
  'PET-009': [P, 'La API no valida requeridos (PET-003). La spec no define minItems para photoUrls.'],
  'PET-010': [AA, 'Id fijo ocupado por otro usuario. Usar un id único cercano a 2^63 y comparar el id como string o BigInt.'],
  'PET-011': [H, 'Por analogía con PET-006 se espera 5xx. Confirmar: STO-016 mostró que algunos valores inválidos se aceptan en silencio.'],
  'PET-012': [A, 'Positivo análogo a PET-001 con XML.'],
  'PET-013': [AA, 'Código no documentado para Content-Type no soportado. Confirmar el código real antes de fijar el esperado.'],
  'PET-014': [P, 'Sin token la API crea la mascota (200). La spec declara OAuth2 pero no define el rechazo.'],
  'PET-015': [P, 'Análogo a PET-014: la API no exige token, menos aún scopes.'],
  'PET-016': [A, 'Positivo con supuesto de éxito verificado: 200 con name y status actualizados.'],
  'PET-017': [A, '404 documentado. Análogo al control PET-026.'],
  'PET-018': [H, '400 documentado. Por analogía con PET-006 un id no numérico en el body produce 500.'],
  'PET-019': [AA, 'Id negativo no se trata como inválido (PET-029). Confirmar el código real y ajustar el esperado.'],
  'PET-020': [H, '405 Validation exception documentado pero la API acepta Pets sin name (PET-003).'],
  'PET-021': [H, '405 Validation exception documentado pero la API acepta status fuera del enum (PET-007).'],
  'PET-022': [H, 'Patrón confirmado en PET-005: un body no parseable devuelve 500.'],
  'PET-023': [P, 'Análogo a PET-014: la API no exige autenticación.'],
  'PET-024': [A, '200 documentado. Verificado indirectamente en PET-033.'],
  'PET-025': [A, '200 documentado con produces application/xml.'],
  'PET-026': [A, 'Control: 404 Pet not found documentado y verificado.'],
  'PET-027': [H, 'Spec documenta 400 pero devuelve 404 y expone java.lang.NumberFormatException en el body.'],
  'PET-028': [AA, 'Otro usuario puede crear el id 0. Verificar con GET previo y omitir si existe.'],
  'PET-029': [AA, 'El -1 no se trata como inválido: devuelve 404 Pet not found. Ajustar el esperado a 404.'],
  'PET-030': [D, 'No determinista: ya existe una mascota ajena con id int64 máximo (evidencia de PET-010).'],
  'PET-031': [H, '400 documentado. Por analogía con PET-027 un id no parseable devuelve 404 con excepción interna.'],
  'PET-032': [H, '400 documentado. Por analogía con PET-027 un id decimal devuelve 404 con excepción interna.'],
  'PET-033': [P, 'Sin api_key la API devuelve la mascota (200). La spec declara api_key pero no define el rechazo.'],
  'PET-034': [P, 'Análogo a PET-033: la API no valida la api_key.'],
  'PET-035': [A, 'Positivo con supuesto de éxito verificado: 200 al actualizar por form.'],
  'PET-036': [A, 'Ambos campos son opcionales. Análogo a PET-035.'],
  'PET-037': [AA, 'La spec solo documenta 405. Confirmar el código real para mascota inexistente.'],
  'PET-038': [H, 'Por analogía con PET-027 un petId no numérico devuelve 404 con excepción interna.'],
  'PET-039': [P, 'El status del form es string libre en la spec y la API no valida enums (PET-007).'],
  'PET-040': [AA, 'Código no documentado para Content-Type incorrecto. Confirmar el código real.'],
  'PET-041': [P, 'Análogo a PET-014: la API no exige autenticación.'],
  'PET-042': [A, 'Positivo con supuesto de éxito verificado: 200 al eliminar.'],
  'PET-043': [A, '404 documentado. Análogo al control PET-026.'],
  'PET-044': [H, 'Spec documenta 400 pero devuelve 404 y expone java.lang.NumberFormatException en el body.'],
  'PET-045': [AA, 'Análogo a PET-029: el -1 no se trata como inválido. Ajustar el esperado a 404.'],
  'PET-046': [D, 'Equivalente a PET-042: la API ignora credenciales, el header api_key no cambia el resultado.'],
  'PET-047': [P, 'Sin credenciales la API elimina la mascota (200). Riesgo alto: cualquiera puede borrar datos.'],
  'PET-048': [A, 'Positivo análogo a otros éxitos verificados. Validar solo el esquema de ApiResponse.'],
  'PET-049': [D, 'Bajo valor: queda cubierto por PET-048 y PET-050.'],
  'PET-050': [AA, 'Ambos campos son opcionales y solo se documenta 200. Confirmar el código real sin archivo.'],
  'PET-051': [P, 'La spec no restringe el tipo de archivo. Definir si se aceptan archivos que no son imagen.'],
  'PET-052': [AA, 'La spec solo documenta 200. Confirmar el código real para mascota inexistente.'],
  'PET-053': [H, 'Por analogía con PET-027 un petId no numérico devuelve 404 con excepción interna.'],
  'PET-054': [P, 'Análogo a PET-014: la API no exige autenticación.'],
  'PET-055': [AA, 'Validar solo el status de cada Pet, no el esquema: otros usuarios guardan Pets sin name (PET-003).'],
  'PET-056': [AA, 'Igual que PET-055: validar solo el status, no el esquema completo de datos ajenos.'],
  'PET-057': [A, 'Determinista: busca el id propio en el resultado.'],
  'PET-058': [H, 'Sin status devuelve 200 con []: no aplica ni el 400 documentado ni el default available.'],
  'PET-059': [H, '400 Invalid status value documentado pero devuelve 200 con Pets guardados con status=unknown.'],
  'PET-060': [H, 'Análogo a PET-059: un valor fuera del enum no devuelve el 400 documentado.'],
  'PET-061': [P, 'La spec no define si el enum distingue mayúsculas.'],
  'PET-062': [P, 'La spec se contradice: la descripción dice separado por comas y collectionFormat es multi.'],
  'PET-063': [P, 'Análogo a PET-014: la API no exige autenticación.'],
  'PET-064': [A, 'Determinista con un tag único. Endpoint deprecated, prioridad baja.'],
  'PET-065': [A, 'Determinista con tags únicos.'],
  'PET-066': [H, 'tags es requerido y se documenta 400, pero sin el parámetro devuelve 200 con [].'],
  'PET-067': [A, 'Determinista con un tag nunca usado.'],
  'PET-068': [P, 'La spec no define si un tag vacío es inválido.'],
  'PET-069': [P, 'Análogo a PET-014: la API no exige autenticación.'],

  // ---------- STORE ----------
  'STO-001': [A, '200 documentado. Validar tipos sin asumir claves: el inventario tiene status basura (AAA, null).'],
  'STO-002': [D, 'No determinista: el conteo global cambia con datos de otros usuarios.'],
  'STO-003': [D, 'El resultado esperado no es verificable: acepta dos comportamientos distintos.'],
  'STO-004': [P, 'Sin api_key la API devuelve el inventario (200). La spec declara api_key pero no define el rechazo.'],
  'STO-005': [P, 'Análogo a STO-004: la API no valida la api_key.'],
  'STO-006': [AA, 'Usa un id fijo (7) en una API compartida. Usar un id único y validar contra el body de la respuesta.'],
  'STO-007': [A, 'Positivo parametrizado con ids únicos. 200 documentado.'],
  'STO-008': [A, 'Order no tiene campos requeridos. Análogo a otros éxitos. Limpiar con el id devuelto.'],
  'STO-009': [H, '400 Invalid Order documentado. Patrón confirmado en PET-005: un body no parseable devuelve 500.'],
  'STO-010': [H, '400 Invalid Order documentado pero la API guarda la orden con status=cancelled (200).'],
  'STO-011': [H, 'Tipo incorrecto en quantity devuelve 500 "something bad happened" en vez del 400 documentado.'],
  'STO-012': [P, 'La spec no define minimum para quantity. Definir si 0 es válido.'],
  'STO-013': [P, 'La spec no define minimum para quantity. Definir si los negativos son válidos.'],
  'STO-014': [A, 'Positivo de borde. Análogo a otros éxitos de creación.'],
  'STO-015': [H, '400 documentado. Por analogía con STO-011 se espera 500. Confirmar: STO-016 mostró aceptación silenciosa.'],
  'STO-016': [H, 'shipDate 2026-13-45 se acepta (200) y se guarda corrida como 2027-02-14: corrupción silenciosa de datos.'],
  'STO-017': [P, 'La spec no indica si petId debe existir. Definir la regla de integridad.'],
  'STO-018': [AA, 'Solo consume JSON. Confirmar el código real para XML antes de fijar el esperado.'],
  'STO-019': [H, 'Por analogía con STO-023 GET no valida el máximo 10 documentado. Contradice la spec.'],
  'STO-020': [AA, 'Los ids 1 a 10 se comparten con otros usuarios. Ejecutar solo en un entorno aislado.'],
  'STO-021': [AA, 'Crear las órdenes 1 y 10 pisa datos ajenos. Ejecutar solo en un entorno aislado.'],
  'STO-022': [H, 'minimum 1 y 400 documentados pero orderId 0 devuelve 404 Order not found: no valida el rango.'],
  'STO-023': [H, 'maximum 10 y 400 documentados pero devuelve 404 Order not found: no valida el rango.'],
  'STO-024': [H, '400 documentado. Por analogía con STO-023 la API no valida el rango.'],
  'STO-025': [H, '400 documentado. Por analogía con PET-027 devuelve 404 con excepción interna.'],
  'STO-026': [AA, 'Eliminar una orden en el rango 1 a 10 afecta datos ajenos. Ejecutar solo en un entorno aislado.'],
  'STO-027': [AA, 'Requiere una orden en el rango compartido 1 a 10. Ejecutar solo en un entorno aislado.'],
  'STO-028': [A, 'Positivo con supuesto de éxito verificado: 200 al eliminar una orden propia.'],
  'STO-029': [A, '404 documentado. Determinista con una orden propia ya eliminada.'],
  'STO-030': [H, 'minimum 1 y 400 documentados. Por analogía con STO-023 la API no valida el rango.'],
  'STO-031': [H, '400 documentado. Por analogía con STO-023 la API no valida el rango.'],
  'STO-032': [H, '400 documentado. Por analogía con PET-027 devuelve 404 con excepción interna.'],
  'STO-033': [D, 'Equivalente a STO-028, que ya eliminó una orden propia con id mayor a 10.'],
  'STO-034': [D, 'Bajo valor y no determinista: no se puede asegurar que el id no exista.'],
  'STO-035': [D, 'Equivalente a STO-028 (sin credenciales). Se lleva como pregunta de seguridad en el resumen.'],

  // ---------- USER ----------
  'USR-001': [A, 'Éxito verificado en USR-008 (POST /user devuelve 200). Validar con GET posterior.'],
  'USR-002': [P, 'La spec no define campos requeridos. Un usuario sin username tampoco se puede limpiar.'],
  'USR-003': [H, 'Patrón confirmado en PET-005: un body no parseable devuelve 500.'],
  'USR-004': [H, 'userStatus de tipo string devuelve 500 "something bad happened" en vez de un 4xx.'],
  'USR-005': [H, 'Por analogía con USR-004 se espera 500. Confirmar: STO-016 mostró aceptación silenciosa.'],
  'USR-006': [P, 'La spec no define la unicidad de username. Definir si se sobrescribe o se rechaza.'],
  'USR-007': [P, 'La spec no define el formato de email. Definir si se valida.'],
  'USR-008': [P, 'Sin sesión la API crea el usuario (200). La descripción exige login pero no hay security.'],
  'USR-009': [A, 'Positivo con supuesto de éxito verificado: 200 con message ok.'],
  'USR-010': [A, 'Positivo de borde. Análogo a USR-009.'],
  'USR-011': [H, 'Por analogía con PET-006 y STO-011 un body con forma incorrecta produce 500.'],
  'USR-012': [A, 'Positivo. Análogo a USR-009 en el endpoint gemelo.'],
  'USR-013': [A, 'Positivo de borde. Análogo a USR-010.'],
  'USR-014': [H, 'Por analogía con PET-006 y STO-011 un body con forma incorrecta produce 500.'],
  'USR-015': [A, '200 documentado. Determinista con un usuario propio.'],
  'USR-016': [A, '200 documentado con produces application/xml.'],
  'USR-017': [A, 'Control: 404 User not found documentado y verificado.'],
  'USR-018': [A, 'Positivo de borde con un usuario propio. Encodear el path.'],
  'USR-019': [P, 'La spec no define qué es un username inválido.'],
  'USR-020': [A, 'Inexistente: análogo al control USR-017.'],
  'USR-021': [A, 'Positivo análogo a otros éxitos verificados. La precondición de login no es necesaria.'],
  'USR-022': [A, '404 documentado. Análogo al control USR-017.'],
  'USR-023': [H, '400 documentado. Patrón confirmado en PET-005: un body no parseable devuelve 500.'],
  'USR-024': [H, '400 documentado. Por analogía con STO-011 un tipo incorrecto produce 500.'],
  'USR-025': [P, 'La spec no define qué username prevalece si el path y el body difieren.'],
  'USR-026': [P, 'Análogo a USR-008: la API no exige sesión.'],
  'USR-027': [A, 'Positivo análogo a otros éxitos de eliminación verificados.'],
  'USR-028': [A, '404 documentado. Análogo al control USR-017.'],
  'USR-029': [P, 'La spec no define qué es un username inválido.'],
  'USR-030': [P, 'Análogo a USR-008: la API no exige sesión.'],
  'USR-031': [P, 'La spec no define la autorización entre usuarios.'],
  'USR-032': [A, '200 y headers documentados. No distingue login válido de inválido (USR-033), validar también los headers.'],
  'USR-033': [H, 'Password incorrecta devuelve 200 con "logged in user session" en vez del 400 documentado.'],
  'USR-034': [H, 'Usuario inexistente devuelve 200 con "logged in user session" en vez del 400 documentado.'],
  'USR-035': [H, 'Login sin username devuelve 200 con "logged in user session" en vez del 400 documentado.'],
  'USR-036': [H, '400 documentado. Por analogía con USR-035 el login no rechaza un parámetro requerido faltante.'],
  'USR-037': [H, '400 documentado. Por analogía con USR-033 a USR-035 el login acepta cualquier credencial.'],
  'USR-038': [H, '400 documentado. Por analogía con USR-033 y USR-034 el login acepta cualquier credencial.'],
  'USR-039': [A, 'Positivo análogo a USR-040, verificado con 200.'],
  'USR-040': [A, 'Supuesto de éxito verificado: 200 con message ok.'],
  'USR-041': [P, 'La API no exige sesión (USR-008), así que no hay sesión que invalidar. Definir el modelo de sesión.'],
};

const verified = new Map();
for (const line of readFileSync(resolve(OUTPUTS, 'verificacion-api.csv'), 'utf8').split(/\r?\n/).slice(1).filter(Boolean)) {
  const c = line.split(';');
  verified.set(c[0], c[4]);
}

const rows = ['ID;Endpoint;Método;Tipo;Título;Prioridad;Verificado;Status esperado (IA);Status real;Clasificación;Justificación'];
const errors = [];
const seen = new Set();
for (const tag of ['pet', 'store', 'user']) {
  for (const line of readFileSync(resolve(OUTPUTS, `casos-${tag}-raw.csv`), 'utf8').split(/\r?\n/).slice(1).filter(Boolean)) {
    const c = line.split(';');
    const [id, endpoint, metodo, tipo, titulo] = c;
    const prioridad = c[8];
    const esperado = (c[7].match(/\b[1-5]\d{2}\b/) || ['-'])[0];
    const ev = evalMap[id];
    if (!ev) { errors.push(`Falta evaluación de ${id}`); continue; }
    seen.add(id);
    let verificado = 'Por analogía', real = '-';
    if (id === 'PET-010') verificado = 'No ejecutado';
    else if (verified.has(id)) { verificado = 'Sí'; real = verified.get(id); }
    const [clasif, just] = ev;
    if (just.length > 150) errors.push(`${id}: justificación de ${just.length} caracteres`);
    if (just.includes(';')) errors.push(`${id}: justificación con ;`);
    rows.push([id, endpoint, metodo, tipo, titulo, prioridad, verificado, esperado, real, clasif, just].join(';'));
  }
}
for (const id of Object.keys(evalMap)) if (!seen.has(id)) errors.push(`Evaluación sin caso: ${id}`);
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }

writeFileSync(OUT, rows.join('\n') + '\n', 'utf8');

// Resumen para el .md
const data = rows.slice(1).map((r) => r.split(';'));
const tags = { PET: 'pet', STO: 'store', USR: 'user' };
const clases = [A, AA, H, P, D];
console.log('| Clasificación | pet | store | user | Total |\n|---|---|---|---|---|');
for (const cl of clases) {
  const n = (t) => data.filter((d) => d[9] === cl && d[0].startsWith(t)).length;
  console.log(`| ${cl} | ${n('PET')} | ${n('STO')} | ${n('USR')} | ${data.filter((d) => d[9] === cl).length} |`);
}
console.log(`| **Total** | ${data.filter((d) => d[0].startsWith('PET')).length} | ${data.filter((d) => d[0].startsWith('STO')).length} | ${data.filter((d) => d[0].startsWith('USR')).length} | ${data.length} |`);
const hv = data.filter((d) => d[9] === H);
console.log('\nHallazgos verificados:', hv.filter((d) => d[6] === 'Sí').map((d) => d[0]).join(', '));
console.log('Hallazgos por analogía:', hv.filter((d) => d[6] !== 'Sí').map((d) => d[0]).join(', '));
console.log('Preguntas:', data.filter((d) => d[9] === P).map((d) => d[0]).join(', '));
console.log('Verificado:', ['Sí', 'Por analogía', 'No ejecutado'].map((v) => `${v}=${data.filter((d) => d[6] === v).length}`).join(' '));
