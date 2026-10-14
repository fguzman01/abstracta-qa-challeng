# Parte 1 - API Testing (Petstore)

Framework de pruebas de API con Playwright + TypeScript sobre [Swagger Petstore](https://petstore.swagger.io).

## Requisitos

- Node.js 20 o superior
- npm

## Instalación

```bash
cd "Parte 1"
npm install
```

No se instalan browsers: el proyecto solo prueba API.

## Ejecución

| Comando | Descripción |
|---|---|
| `npm run test:stg` | Ejecuta todos los tests en **staging** |
| `npm run test:prod` | Ejecuta todos los tests en **production** |
| `npm test` | Ejecuta en staging (ambiente por defecto) |
| `npx playwright show-report` | Abre el último reporte HTML |

Para pasar opciones extra a Playwright, usar `--`:

```bash
npm run test:stg -- --reporter=list
npm run test:stg -- tests/pet-status.spec.ts
```

## Ambientes

El ambiente se elige con la variable `ENV` (por defecto `staging`). Cada ambiente tiene dos archivos:

| Archivo | Contenido |
|---|---|
| `.env.<ambiente>` | URL base de la API (`BASE_URL`) |
| `config/data/<ambiente>.json` | Datos de prueba propios del ambiente (prefijo de nombres, categoría, tags) |

Los scripts `test:stg` y `test:prod` usan `cross-env`, por lo que funcionan igual en CMD, PowerShell, bash y CI.

**Agregar un ambiente nuevo** (ej: `qa`): crear `.env.qa` y `config/data/qa.json`, y opcionalmente un script `test:qa` en `package.json`. Si falta alguno de los dos archivos, la ejecución falla al inicio con un mensaje que indica cuál.

> Ambos ambientes apuntan a la misma URL pública (como permite el enunciado). La diferencia se nota en los datos: las mascotas de staging se crean con prefijo `STG` y las de production con `PRD`.

## Estructura

```
config/
  data/            Datos de prueba por ambiente (JSON)
  test-data.ts     Carga los datos del ambiente activo
src/
  clients/         Un client por recurso de la API (PetClient, StoreClient)
  data/            Factories que generan datos válidos con ids únicos
  fixtures/        Inyectan los clients en los tests
  types/           Modelos de datos según el Swagger (Pet, Order)
tests/             Specs por escenario
```

**Flujo:** el test pide un client por fixture → arma sus datos con una factory → el client hace el request usando la `baseURL` del ambiente activo.

Para agregar pruebas de un recurso nuevo (ej: `user`): crear su type, su client y registrarlo en el fixture. Los tests existentes no se tocan.

## Escenarios

| Archivo | Escenario |
|---|---|
| `pet-creation.spec.ts` | **A:** crea 10 mascotas (5 available, 4 pending, 1 sold) y obtiene el detalle de la vendida |
| `store-orders.spec.ts` | **B:** lista mascotas disponibles, guarda 5 en un `Map` y crea una orden para cada una |
| `pet-status.spec.ts` | **C:** crea una mascota, la cambia de available a sold y verifica el cambio consultando por estado |
| `smoke.spec.ts` | Verificación rápida: crear y obtener una mascota |

## Decisiones técnicas

- **Ids únicos:** la Petstore es pública y compartida. Cada mascota y orden se crea con un id generado (`timestamp × 1000 + random`) para evitar colisiones con otros usuarios y entre tests en paralelo.
- **Búsqueda por id propio (escenario A):** la mascota vendida se obtiene por su id, no con `findByStatus=sold`, porque la API pública devuelve cientos de mascotas vendidas de terceros.
- **Filtro de ids seguros (escenario B):** se descartan mascotas con ids que superan `Number.MAX_SAFE_INTEGER`, porque JavaScript los redondea al parsear el JSON y la orden apuntaría a otra mascota.
- **Polling en vez de esperas fijas (escenario C):** `expect.poll` reintenta la consulta hasta 15 segundos y continúa apenas el cambio se refleja.
- **Errores explícitos (escenario C):** la consulta por estado distingue entre "la mascota no está" y "la consulta falló" (HTTP de error o JSON inválido). Un error nunca se interpreta como resultado válido, así el test no puede pasar en verde sin haber verificado.
- **Validación de órdenes con la respuesta del POST:** el Swagger indica que `GET /store/order/{id}` solo garantiza ids del 1 al 10.

## Posibles mejoras

- Validación de schema en runtime (`zod` o `ajv`) para detectar respuestas que no cumplen el contrato.
- Limpieza automática de los datos creados en el teardown del fixture.