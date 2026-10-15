# Ambigüedades y vacíos — tag `pet`

1. **Faltan respuestas exitosas:** `POST /pet`, `PUT /pet`, `POST /pet/{petId}` y `DELETE /pet/{petId}` no documentan ningún 2xx. No se sabe qué status ni qué body devuelven cuando la operación sale bien.
2. **No hay respuestas de autenticación:** todos los endpoints declaran `petstore_auth` o `api_key`, pero ninguno documenta 401 ni 403.
3. **Seguridad inconsistente:** `GET /pet/{petId}` usa `api_key` y el resto usa OAuth2. `findByStatus` y `findByTags` piden OAuth2 aunque solo leen datos.
4. **Header `api_key` en DELETE:** es opcional, no tiene descripción y no se explica cómo convive con `petstore_auth`.
5. **Se usa 405 para la validación:** la spec usa 405 ("Invalid input" / "Validation exception") para errores de validación, aunque 405 significa Method Not Allowed. Tampoco distingue entre un body mal formado, un campo requerido faltante y un tipo incorrecto.
6. **`findByStatus` se contradice:** dice "comma separated strings", pero `collectionFormat` es `multi`. Además el parámetro es `required: true` y aun así tiene `default: available`.
7. **El `status` del form no tiene enum:** en `POST /pet/{petId}`, `status` es un string libre. En el modelo `Pet` es un enum.
8. **Faltan restricciones:** no hay `minimum` para `petId`, no hay `minLength` para `name` y no hay `minItems` para `photoUrls`. No se sabe si 0, valores negativos, `""` o `[]` son válidos.
9. **No se define quién asigna el id:** no se indica si `id` en `POST /pet` es obligatorio, si lo genera el servidor ni qué pasa si ya existe.
10. **uploadImage queda indefinido:** `file` y `additionalMetadata` son opcionales, no hay restricciones de tipo ni tamaño de archivo, solo se documenta 200 y no se explica el contenido de `ApiResponse.message`.
11. **`findByTags` está deprecated:** no se indica qué lo reemplaza ni hasta cuándo estará disponible.
12. **Precisión de int64:** los ids son `int64`, pero JSON/JavaScript pierde precisión por encima de 2^53. Esto afecta las aserciones en TypeScript.
