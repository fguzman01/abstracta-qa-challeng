## Objetivo
Automatizar una selección de los casos evaluados dentro del framework existente de la Parte 1, respetando sus convenciones.

## Contexto
- Lee `Parte 1/` para entender el framework: `src/clients`, `src/types`, `src/data`, `src/fixtures`, `tests` y `playwright.config.ts`.
- Casos: `Parte 5B/outputs/evaluacion-casos.csv` y la evidencia en `Parte 5B/outputs/verificacion-api.csv`.

## Selección
1. Entre 6 y 8 casos clasificados como **Automatizar** que no estén cubiertos por los tests existentes. Incluye al menos uno del tag user.
2. Entre 3 y 4 **Hallazgos verificados**: PET-027, USR-033, STO-016 y PET-006.

## Reglas
- Reutiliza los clients, factories y fixtures existentes. Si falta un recurso (por ejemplo, User), créalo con el mismo patrón: type, client, factory y registro en el fixture.
- Los cambios en `src/` deben ser solo aditivos. No modifiques los tests existentes.
- Todas las aserciones asíncronas llevan `await`.
- Usa ids y usernames únicos con la factory existente. Cada test crea sus propios datos y es independiente de los demás.
- Usa `test.step` con nombres en español.
- El título de cada test empieza con el ID del caso. Ejemplo: `PET-017: actualizar mascota inexistente devuelve 404`.
- **Hallazgos:** el test valida lo que dice la spec, no el comportamiento actual. Márcalo con `test.fail()` y una anotación de tipo `issue` que describa el bug y la evidencia. Así queda como falla esperada y avisa cuando el bug se corrija.
- Crea los tests en `Parte 1/tests/ai-generated/`.

## Validación
- Ejecuta `npm run test:stg` desde `Parte 1/`. Todos los tests deben pasar (los marcados con `test.fail()` cuentan como pasados cuando fallan como se espera).
- Si un test falla de forma inesperada, analiza la causa antes de cambiarlo. No ajustes el esperado de un hallazgo para que pase.

## Salida
- Lista de archivos creados o modificados.
- Tabla con cada caso automatizado, su archivo y su resultado.
- Cualquier decisión que hayas tomado y que yo deba revisar.