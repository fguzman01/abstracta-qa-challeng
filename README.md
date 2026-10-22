# Abstracta QA Challenge - Automation Senior

Solución del desafío técnico de automatización: pruebas de API y UI con Playwright + TypeScript, reporting con Allure, ejecución en paralelo, pipeline CI/CD, generación de casos con IA y una prueba de performance con k6.

**Reportes publicados:** [https://<usuario>.github.io/<repo>/](https://<usuario>.github.io/<repo>/)

## Contenido

| Carpeta | Parte | Descripción |
|---|---|---|
| [`Parte 1/`](Parte%201/README.md) | 1, 3 y 4.1 | Pruebas de API sobre Swagger Petstore |
| [`Parte 2/`](Parte%202/README.md) | 2, 3 y 4.1 | Pruebas de UI sobre Demoblaze con Page Object Model |
| [`.github/workflows/`](.github/workflows/tests.yml) | 4.2 | Pipeline de GitHub Actions |
| [`Parte 5B/`](Parte%205B/) | 5B | Generación y evaluación de casos de prueba con IA (entregable en PDF) |
| [`Parte 6/`](Parte%206/README.md) | 6 | Prueba de carga con k6 |

Las Partes 3 (reporting) y 4.1 (paralelización) se implementaron sobre los proyectos de las Partes 1 y 2. Cada README documenta su sección correspondiente.

## Requisitos

- Node.js 20 o superior
- npm
- [k6](https://grafana.com/docs/k6/latest/set-up/install-k6/) (solo para la Parte 6)

## Inicio rápido

Cada parte es un proyecto independiente y se ejecuta desde su propia carpeta.

```bash
# Parte 1 - API
cd "Parte 1"
npm install
npm run test:stg

# Parte 2 - UI
cd "Parte 2"
npm install
npx playwright install
npm run test:stg

# Reporte Allure (en cualquiera de las dos)
npm run report:generate
npm run report:open

# Parte 6 - Performance
cd "Parte 6"
k6 run scripts/list-pets.js
```

Para ejecutar en producción, usar `npm run test:prod`. Cada README explica cómo funcionan los ambientes y cómo agregar uno nuevo.

## Resumen de decisiones

- **Un framework por tipo de prueba:** API y UI son proyectos separados, con dependencias y configuración propias, pero con la misma arquitectura (clients o pages, fixtures, factories y datos por ambiente).
- **Datos aislados en servicios compartidos:** la Petstore y Demoblaze son públicas. Todos los datos se crean con ids únicos y cada test es independiente, lo que permite ejecutar en paralelo.
- **Esperas por condición, nunca por tiempo:** reintentos acotados (`expect.poll`, `toPass`) donde el servicio es inconsistente, y esperas por cambios reales del DOM en la UI.
- **Fallar con mensajes claros:** el ambiente y los datos de prueba se validan al iniciar, y las aserciones explican qué se esperaba.
- **Defectos documentados como tests:** los defectos encontrados en la API (Parte 5B) se automatizaron con `test.fail()`, para que queden vigilados en el pipeline.

<!-- Pega aquí tu sección "## Parte 4.2 - Pipeline CI/CD" -->
## Parte 4.2 - Pipeline CI/CD

### Herramienta elegida

**GitHub Actions.** El repositorio ya está en GitHub, por lo que no requiere instalar ni mantener un servidor (a diferencia de Jenkins), se configura con un solo archivo versionado junto al código y ofrece runners Linux con soporte nativo para Playwright.

### Qué hace el pipeline

Archivo: `.github/workflows/tests.yml`

| Job | Qué hace |
|---|---|
| `Parte 1 - API` | Instala dependencias, ejecuta los tests de API y publica los reportes |
| `Parte 2 - UI` | Instala dependencias y browsers, ejecuta los tests de UI en Chromium, Firefox y WebKit y publica los reportes |
| `Publicar reportes en GitHub Pages` | Toma los reportes Allure de ambos jobs y los publica como sitio web (solo desde `main`) |

Los jobs de API y UI corren **en paralelo**. En CI cada proyecto usa 2 workers (`workers: process.env.CI ? 2 : undefined`).

**Disparadores:**
- **Push** a cualquier rama: ejecuta en `staging`.
- **Manual** (Actions → Tests → Run workflow): permite elegir `staging` o `production`.

**Los reportes se publican aunque fallen tests** (`if: !cancelled()`), porque es cuando más se necesitan.

### Cómo ver los reportes

- **GitHub Pages:** [https://github.com/fguzman01/abstracta-qa-challeng/](https://github.com/fguzman01/abstracta-qa-challeng/), con el último reporte de `main` (índice con links a API y UI).
- **Artefactos descargables:** en cada ejecución (Actions → la ejecución → sección *Artifacts*) quedan disponibles por 14 días:
  - `allure-report-api-<ambiente>` y `allure-report-ui-<ambiente>`
  - `playwright-report-api-<ambiente>` y `playwright-report-ui-<ambiente>`

Para abrir un reporte Allure descargado: descomprimirlo dentro de la carpeta del proyecto correspondiente y ejecutar `npx allure open ./allure-report`.

### Configuración desde cero

1. Crear un repositorio en GitHub y subir el proyecto (incluyendo la carpeta `.github/workflows/`).
2. **Settings → Pages → Build and deployment → Source:** seleccionar **GitHub Actions**.
3. Hacer push a `main`. El pipeline se ejecuta automáticamente; el progreso se ve en la pestaña **Actions**.
4. Al terminar, el job de publicación muestra el link al sitio de GitHub Pages.

No se requieren secretos ni variables configuradas en GitHub: la URL y los datos de cada ambiente están versionados en el repositorio.

> **Nota:** GitHub Pages es gratuito solo para repositorios públicos. En un repositorio privado con plan gratuito, el job de publicación falla y los reportes quedan disponibles igualmente como artefactos.

### Decisiones técnicas

- **`npm ci`** en lugar de `npm install`: instala exactamente las versiones del `package-lock.json`, lo que hace la ejecución reproducible.
- **Caché de npm** por proyecto (`cache-dependency-path`), para acelerar las instalaciones.
- **`working-directory`** por job, porque cada parte es un proyecto independiente. Las rutas de los artefactos se escriben completas (`Parte 1/allure-report`), ya que `working-directory` solo aplica a los pasos `run`.
- **Ambiente por variable global** `ENV`: en push vale `staging`, y en ejecución manual toma el valor elegido. Los proyectos ya leen `ENV`, por lo que no requieren cambios para CI.