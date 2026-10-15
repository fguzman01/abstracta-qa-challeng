## Objetivo
Consolidar los casos generados en una planilla de evaluación, aplicando los criterios definidos abajo.

## Fuentes
- `Parte 5B/outputs/casos-pet-raw.csv`, `casos-store-raw.csv`, `casos-user-raw.csv`
- `Parte 5B/outputs/verificacion-api.csv`
- `Parte 5B/inputs/swagger.json`
No leas otros archivos.

## Criterios de clasificación
Asigna a cada caso UNA de estas clasificaciones:

- **Automatizar:** el resultado esperado está documentado en la spec y la API lo cumple, o es un caso Positivo cuyo supuesto de éxito fue verificado.
- **Automatizar con ajuste:** el caso es válido, pero necesita un cambio para ser confiable o correcto. Ejemplos: usa un id fijo en una API compartida, o el código esperado no está documentado y la verificación mostró otro código sin implicancias de seguridad. Indica el ajuste concreto.
- **Hallazgo:** la API contradice un código documentado en la spec, responde 5xx ante input inválido o expone información interna (stack traces, excepciones).
- **Pregunta al negocio:** el comportamiento esperado no está definido en la spec y la API no aplica la regla asumida (autenticación, validación de campos, enums). No se automatiza hasta que alguien defina el comportamiento correcto. NUNCA cambies el esperado al comportamiento real en estos casos.
- **Descartar:** duplicado de otro caso, no determinista en una API compartida (conteos globales, datos de otros usuarios) o de muy bajo valor. Indica el motivo.

## Casos no verificados
Para los casos que no están en `verificacion-api.csv`, aplica el criterio por analogía con los casos verificados de la misma categoría (por ejemplo, todos los de seguridad sin credenciales) y marca la columna Verificado como "Por analogía". PET-010 se marca como "No ejecutado".

## Salida
1. `Parte 5B/outputs/evaluacion-casos.csv` (separador `;`) con las columnas:
   ID;Endpoint;Método;Tipo;Título;Prioridad;Verificado;Status esperado (IA);Status real;Clasificación;Justificación
   - Verificado: Sí, Por analogía o No ejecutado.
   - Justificación: una frase concreta, máximo 150 caracteres.
2. `Parte 5B/outputs/evaluacion-resumen.md` con:
   - Total de casos por clasificación y por tag.
   - La lista de Hallazgos, cada uno con evidencia (request y respuesta real).
   - La lista de Preguntas al negocio, agrupadas por tema.

No modifiques ningún otro archivo.