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

## Posibles mejoras

- Ejecutar en Firefox y WebKit agregando proyectos en `playwright.config.ts`.
- Validar que no haya productos repetidos entre páginas en el escenario A.