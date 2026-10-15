## Rol
Eres un QA Engineer senior especializado en testing de APIs REST.

## Contexto
Adjunto la especificación Swagger 2.0 de la API Petstore (swagger.json).
- Es una API pública de demostración, compartida por muchos usuarios y sin aislamiento de datos.
- Los casos se van a automatizar con Playwright + TypeScript.

## Tarea
Deriva los casos de prueba de TODOS los endpoints con el tag **[pet | store | user]**.
Para cada endpoint cubre, cuando aplique:
- **Positivos:** flujo correcto (happy path).
- **Negativos:** parámetros faltantes, inválidos o de tipo incorrecto, recursos inexistentes, body mal formado.
- **Borde:** límites de los tipos de dato, strings vacíos, ids extremos, valores fuera del enum.
- **Seguridad:** comportamiento con y sin la autenticación declarada en la spec.

## Reglas
1. Básate solo en la especificación. No inventes endpoints, campos ni códigos de respuesta.
2. Si el resultado esperado de un caso no está documentado en la spec, indícalo en la columna "Supuesto" con lo que asumiste.
3. El resultado esperado debe ser verificable: status code y qué validar en el body.
4. No repitas casos equivalentes.
5. No uses punto y coma (;) dentro de los campos.

## Formato de salida
Responde con una tabla CSV, usando punto y coma (;) como separador, con estas columnas:
ID;Endpoint;Método;Tipo;Título;Precondiciones;Datos de entrada;Resultado esperado;Prioridad;Supuesto

- ID: PET-001, STO-001 o USR-001 según el tag.
- Tipo: Positivo, Negativo, Borde o Seguridad.
- Prioridad: Alta, Media o Baja.

Después de la tabla, agrega una lista breve de **ambigüedades o vacíos** que detectaste en la especificación.