# Parte 2 - UI Testing (Demoblaze)

Framework de pruebas de UI con Playwright + TypeScript y Page Object Model sobre [Demoblaze](https://www.demoblaze.com/).

## Requisitos

- Node.js 20 o superior
- npm

## Instalación

```bash
cd "Parte 2"
npm install
npx playwright install chromium
```

## Ejecución

| Comando | Descripción |
|---|---|
| `npm run test:stg` | Ejecuta todos los tests en **staging** (headless) |
| `npm run test:prod` | Ejecuta todos los tests en **production** (headless) |
| `npm test` | Ejecuta en staging (ambiente por defecto) |
| `npm run test:headed` | Staging con el browser visible |
| `npm run test:ui` | Abre el modo UI de Playwright |
| `npm run test:slow` | Staging con browser visible y 500 ms de pausa entre acciones |
| `npx playwright show-report` | Abre el último reporte HTML |

Para pasar opciones extra a Playwright, usar `--`:

```bash
npm run test:stg -- tests/purchase.spec.ts
npm run test:headed -- --grep "Opcional"
```

## Ambientes

El ambiente se elige con la variable `ENV` (por defecto `staging`). Cada ambiente tiene dos archivos:

| Archivo | Contenido |
|---|---|
| `.env.<ambiente>` | URL del sitio (`BASE_URL`) |
| `config/data/<ambiente>.json` | Producto a comprar, productos del carrito y datos del cliente |

**Agregar un ambiente nuevo** (ej: `qa`): crear `.env.qa` y `config/data/qa.json`. Si falta alguno, la ejecución falla al inicio con un mensaje que indica cuál.

> Ambos ambientes apuntan a la misma URL (como permite el enunciado). La diferencia está en los datos: cada ambiente compra productos distintos con un cliente distinto.

**Datos de prueba:** los nombres son ficticios y las tarjetas son números de prueba públicos. No se usan datos personales reales.

## Estructura

```
config/
  data/            Datos de prueba por ambiente (JSON)
  test-data.ts     Carga los datos del ambiente activo
src/
  pages/           Un Page Object por pantalla (BasePage, HomePage, ProductPage, CartPage)
  components/      Partes de una pantalla sin URL propia (PlaceOrderModal)
  flows/           Secuencias de negocio que cruzan varias pantallas (PurchaseFlow)
  fixtures/        Inyectan pages y flows en los tests
  types/           Product, Customer
  utils/           Escritura de archivos y manejo de diálogos nativos
tests/             Specs por escenario
output/            Archivos generados por los tests (no se versiona)
```

**Responsabilidades:**
- **Pages / components:** qué se puede hacer en una pantalla y cómo encontrar sus elementos.
- **Flows:** secuencias que se repiten en varios tests (ej: agregar al carrito y comprar).
- **Tests:** qué se valida. Las validaciones de negocio viven en el test, no en el flow.

## Escenarios

| Archivo | Escenario |
|---|---|
| `product-catalog.spec.ts` | **A:** lee nombre, precio y link de los productos de las 2 primeras páginas y genera `output/products-<ambiente>.txt` (también se adjunta al reporte) |
| `purchase.spec.ts` | **B:** compra un producto y valida la confirmación (monto, tarjeta y nombre) |
| `cart-total.spec.ts` | **Opcional 1:** agrega dos productos y valida que el total del carrito sea la suma de sus precios |
| `purchase-validation.spec.ts` | **Opcional 2 (negativo):** intenta comprar con el formulario vacío y valida que se muestre el error y no se genere la compra |

## Decisiones técnicas

- **Esperas por condición, no por tiempo:** Demoblaze carga productos, carrito y total por AJAX. La paginación espera a que cambie el primer producto de la grilla, y el total del carrito se valida con `expect.poll`, porque se calcula de a un producto a la vez. No se usa `waitForTimeout` en los tests.
- **Diálogos nativos (`alert`):** se aceptan dentro de un listener registrado antes de la acción (`utils/dialog.ts`). Si el alert se dispara durante el clic y se espera recién después, el clic nunca termina (deadlock). El mensaje del alert se usa como verificación (ej: "Product added").
- **Aislamiento entre tests:** cada test corre en su propio browser context, por lo que cada uno tiene su propio carrito (Demoblaze lo guarda en una cookie).
- **Links absolutos:** el `href` de los productos es relativo y se convierte a URL completa antes de escribirlo en el archivo.
- **Evidencia de fallo:** screenshot y video solo cuando un test falla (`only-on-failure` / `retain-on-failure`).
- **Modo lento (`SLOW_MO`):** pausa entre acciones y antes de aceptar diálogos, solo para observar la ejecución. Con `SLOW_MO=0` (por defecto) no afecta los tiempos.
- **Timeout de aserciones en 15 s:** Demoblaze depende de una API externa cuya velocidad varía. Con 5 s (el valor por defecto) aparecieron fallas intermitentes al ejecutar 11 browsers en paralelo, que no ocurrían con 1 worker. Como las esperas son por condición, el timeout solo pesa cuando el sitio realmente está lento.

## Posibles mejoras

- Ejecutar en Firefox y WebKit agregando proyectos en `playwright.config.ts`.
- Validar que no haya productos repetidos entre páginas en el escenario A.

## Parte 3 - Reporting con Allure

### Reporte elegido

**Allure 3** (`allure-playwright` + CLI `allure`), adicional al reporte HTML nativo de Playwright.

Se eligió Allure 3 porque funciona solo con Node.js: a diferencia de Allure 2, no requiere Java, y alcanza con `npm install` para usarlo.

### Qué muestra

- Tests ejecutados, resultado (pass/fail) y duración
- Pasos de cada test (`test.step`)
- Adjuntos JSON con las respuestas de la API
- Ambiente y URL base de la ejecución (portada del reporte)
- **Evidencia de fallo:** screenshot, video y trace de Playwright, adjuntados automáticamente cuando un test falla. Los mensajes de los diálogos nativos (`alert`) se adjuntan como texto, porque el navegador los dibuja fuera de la página y no aparecen en screenshots ni videos.

### Cambios en el framework

- `playwright.config.ts`: se agregaron los reporters `list`, `html` (sin apertura automática) y `allure-playwright`. Screenshot y video en `only-on-failure` / `retain-on-failure` (ya configurados desde el inicio) y `trace: 'retain-on-failure'`.`.
- `package.json`: scripts para generar y abrir el reporte, y limpieza automática de resultados antes de cada ejecución (`pretest:stg` / `pretest:prod`), para que el reporte no mezcle corridas anteriores.

### Cómo generar y ver el reporte

```bash
npm run test:stg          # ejecuta los tests (limpia resultados anteriores)
npm run report:generate   # genera el HTML en ./allure-report
npm run report:open       # abre el reporte en el navegador
```

## Parte 4.1 - Paralelización

### Estrategia

Paralelización **por test y por browser**:

- `fullyParallel: true`: cada test se asigna a un worker de forma independiente.
- Tres proyectos (`chromium`, `firefox`, `webkit`): cada test se ejecuta en los tres browsers, y esas ejecuciones también se reparten entre los workers.

Para ejecutar en un solo browser: `npm run test:stg -- --project=chromium`.

### Aislamiento de datos

- Cada test corre en su propio **browser context** (equivalente a una ventana de incógnito nueva). Como Demoblaze guarda el carrito en una cookie, cada test tiene su propio carrito vacío.
- **Problema encontrado:** al agregar browsers, el escenario A de los tres browsers escribía en paralelo el mismo archivo (`products-staging.txt`) y se pisaban. Se resolvió incluyendo el browser en el nombre del archivo (`products-<ambiente>-<browser>.txt`). El carrito no tenía este problema porque vive dentro del browser; el archivo no, porque vive en el disco compartido.

### Cambios realizados

- `playwright.config.ts`: proyectos `firefox` y `webkit`, y `workers: process.env.CI ? 2 : undefined`.
- `product-catalog.spec.ts`: nombre de archivo por ambiente y browser.
- `package.json`: los scripts de depuración (`test:headed`, `test:slow`) se limitan a Chromium para no abrir tres browsers a la vez.

### Impacto en tiempo (12 tests = 4 tests × 3 browsers, promedio de 3 corridas)

| Ejecución | Tiempo | vs. secuencial |
|---|---|---|
| Secuencial (1 worker) | ~82 s | — |
| Paralelo (11 workers) | 23.0 s | **72% menos** (3.6× más rápido) |

**Observación:** en paralelo, cada test individual se vuelve más lento (ej: la compra pasa de ~11 s a ~16-18 s), porque los browsers compiten por CPU y memoria y aumenta la carga sobre el sitio. Por eso 11 workers no rinden 11 veces más: el tiempo total queda cerca del test más lento más el arranque de los browsers.