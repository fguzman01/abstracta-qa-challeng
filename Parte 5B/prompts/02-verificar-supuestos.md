## Objetivo
Contrastar los resultados esperados de los casos generados con el comportamiento real de la API Petstore, para evaluar críticamente qué supuestos se cumplen.

## Fuentes
- Casos: `Parte 5B/outputs/casos-pet-raw.csv`, `casos-store-raw.csv` y `casos-user-raw.csv`.
- No leas otros archivos del repositorio.

## Selección de la muestra
Elige entre 20 y 25 casos que cubran al menos uno de cada tipo:
- Respuesta exitosa no documentada en la spec (se asumió 200).
- Seguridad (se asumió 401 o 403).
- Campo requerido faltante.
- Valor fuera de enum.
- Tipo de dato incorrecto.
- Id no numérico, negativo o fuera de rango.
- Id int64 máximo.
- Caso sin supuesto (resultado documentado en la spec), como control.

## Prerrequisitos
- Node.js 18 o superior (necesario para `fetch` nativo y `AbortSignal.timeout`).
- `Parte 5B/` debe tener su propio `package.json` con estas devDependencies: `tsx`, `typescript` y `@types/node`. Agrega los scripts `verify` (`tsx scripts/verify-assumptions.ts`) y `typecheck` (`tsc --noEmit`). Si no existe, créalo.
- `Parte 5B/tsconfig.json` con `"types": ["node"]`, `"lib": ["ES2022", "DOM"]`, `"strict": true`, `"noEmit": true` e `include` limitado a `scripts/**/*.ts`. Sin este archivo y sin `@types/node`, el editor marca como error los imports `node:fs` y `node:path` y el uso de `process`, aunque `tsx` igual ejecute el script.
- Instalación desde `Parte 5B/`: `npm install`.
- Antes de ejecutar, `npm run typecheck` debe terminar sin errores.

## Script
- Un solo archivo: `Parte 5B/scripts/verify-assumptions.ts`, ejecutable con `npm run verify` (desde `Parte 5B/`) o `npx tsx "Parte 5B/scripts/verify-assumptions.ts"` (desde la raíz).
- Usa `fetch` nativo de Node. Base URL: `https://petstore.swagger.io/v2`.
- No envíes credenciales, para observar si la API exige autenticación.
- La API es pública y compartida: usa ids y usernames únicos (timestamp + random), crea los datos que cada caso necesite y no modifiques ni elimines datos que no hayas creado.
- Ejecuta los casos de forma secuencial, para no sobrecargar el servicio.

## Salida
Guarda `Parte 5B/outputs/verificacion-api.csv` (separador `;`) con las columnas:
ID;Tipo;Request;Status esperado;Status real;Coincide;Extracto del body
- El extracto del body debe tener como máximo 200 caracteres.
Al final, imprime en consola un resumen: total de casos, cuántos coinciden y cuántos no, agrupado por tipo.

No modifiques ningún otro archivo, salvo `Parte 5B/package.json` y `Parte 5B/tsconfig.json` si hace falta crearlos para cumplir los prerrequisitos.