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

## Parte 3 - Reporting con Allure

### Reporte elegido

**Allure 3** (`allure-playwright` + CLI `allure`), adicional al reporte HTML nativo de Playwright.

Se eligió Allure 3 porque funciona solo con Node.js: a diferencia de Allure 2, no requiere Java, y alcanza con `npm install` para usarlo.

### Qué muestra

- Tests ejecutados, resultado (pass/fail) y duración
- Pasos de cada test (`test.step`)
- Adjuntos JSON con las respuestas de la API
- Ambiente y URL base de la ejecución (portada del reporte)
- **Evidencia de fallo:** trace de Playwright con cada request y response HTTP. En pruebas de API no aplican screenshot ni video, porque no hay interfaz; la evidencia útil es el tráfico HTTP.

### Cambios en el framework

- `playwright.config.ts`: se agregaron los reporters `list`, `html` (sin apertura automática) y `allure-playwright`, y `trace: 'retain-on-failure'`.
- `package.json`: scripts para generar y abrir el reporte, y limpieza automática de resultados antes de cada ejecución (`pretest:stg` / `pretest:prod`), para que el reporte no mezcle corridas anteriores.

### Cómo generar y ver el reporte

```bash
npm run test:stg          # ejecuta los tests (limpia resultados anteriores)
npm run report:generate   # genera el HTML en ./allure-report
npm run report:open       # abre el reporte en el navegador
```

## Parte 4.1 - Paralelización

### Estrategia

Paralelización **por test** (`fullyParallel: true`): cada test se asigna a un worker de forma independiente, no solo cada archivo.

Además se paralelizó **dentro** del test más lento: el escenario A crea sus 10 mascotas con requests simultáneos (`Promise.all`) en lugar de una por una.

### Aislamiento de datos

- Cada mascota y orden se crea con un id único (`timestamp × 1000 + random`), por lo que tests en paralelo nunca escriben sobre el mismo registro.
- Cada test crea sus propios datos y no depende del orden de ejecución ni de datos creados por otro test.
- El escenario B solo **lee** datos compartidos (mascotas disponibles) y crea órdenes con ids propios.

### Cambios realizados

- `playwright.config.ts`: `workers: process.env.CI ? 2 : undefined` (en local, Playwright usa la mitad de los núcleos disponibles). En CI se limita a 2 por los núcleos del runner y para no saturar una API pública (riesgo de HTTP 429).
- `pet-creation.spec.ts`: creación de mascotas con `Promise.all`.
- `store-orders.spec.ts`: reintento del listado de mascotas (`toPass`) ante errores 500 intermitentes de la API pública, que aparecieron con más frecuencia al ejecutar en paralelo.

### Impacto en tiempo (4 tests, promedio de 3 corridas)

| Ejecución | Tiempo | vs. secuencial |
|---|---|---|
| Secuencial (1 worker) | 5.3 s | — |
| Paralelo (4 workers) | 2.9 s | 45% menos |
| Paralelo + `Promise.all` en escenario A | 2.4 s | **55% menos** |

**Conclusión:** en paralelo, el tiempo total queda limitado por el test más lento. Agregar workers bajó el tiempo a 2.9 s, pero la última mejora vino de optimizar el escenario A, que tardaba 2.4 s por crear las mascotas de a una.