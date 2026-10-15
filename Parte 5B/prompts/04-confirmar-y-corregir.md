## Objetivo
Confirmar contra la API real los patrones clasificados por analogía y corregir la evaluación con la nueva evidencia.

## Fuentes
- `Parte 5B/outputs/evaluacion-casos.csv` y `evaluacion-resumen.md`
- `Parte 5B/outputs/verificacion-api.csv`
- `Parte 5B/scripts/verify-assumptions.ts`
No leas otros archivos.

## Tareas
1. Agrega al script existente `verify-assumptions.ts` (no crees otro) un caso representativo por cada patrón de "Hallazgos por analogía":
   - PET-005: body no parseable
   - USR-004: tipo incorrecto en User
   - STO-016: fecha con formato inválido
   - PET-044: DELETE con id no numérico
   - STO-022: orderId 0
   - PET-066: findByTags sin el parámetro tags
   - USR-035: login sin username
   Agrega también USR-033 y USR-034 (login con credenciales inválidas), que hoy están como "Automatizar" sin verificar.
2. Mantén las mismas reglas: sin credenciales, ids únicos, ejecución secuencial y sin tocar datos ajenos.
3. Ejecuta con `npm run verify` y actualiza `verificacion-api.csv` con todos los casos.
4. Actualiza `evaluacion-casos.csv` y `evaluacion-resumen.md`:
   - Los casos ejecutados pasan a Verificado = Sí, con su status real.
   - Si un resultado contradice la analogía, reclasifica ese caso **y todos los que dependían de él**.
   - Explica cada cambio en una sección nueva: "Correcciones tras la segunda verificación".
5. Corrección de consistencia: PET-003 y PET-004 están como "Pregunta al negocio", pero `POST /pet` documenta 405 Invalid input, y el caso equivalente en PUT (PET-020) está como "Hallazgo". Aplica el mismo criterio a todos los casos de campo requerido faltante y explica la regla usada.
6. Guarda el script de clasificación en `Parte 5B/scripts/build-evaluacion.mjs`, para que la evaluación sea reproducible.

No modifiques otros archivos.