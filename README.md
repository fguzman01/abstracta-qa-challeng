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

- **GitHub Pages:** [https://<usuario>.github.io/<repo>/](https://<usuario>.github.io/<repo>/), con el último reporte de `main` (índice con links a API y UI).
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