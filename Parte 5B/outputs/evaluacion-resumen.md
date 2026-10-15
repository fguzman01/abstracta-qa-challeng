# Evaluación de casos generados — Resumen

**Fuentes:** `casos-pet-raw.csv`, `casos-store-raw.csv`, `casos-user-raw.csv`, `verificacion-api.csv` y `swagger.json`.
**Detalle por caso:** [`evaluacion-casos.csv`](evaluacion-casos.csv), generado con `node scripts/build-evaluacion.mjs` (desde `Parte 5B/`).

**Cobertura de la verificación:** 33 casos se verificaron contra la API real en dos ejecuciones de `npm run verify`, 111 se clasificaron por analogía con casos verificados de la misma categoría y 1 no se ejecutó (PET-010).

## Reglas de clasificación aplicadas

**Precedencia:** cuando un caso cumple más de un criterio, se aplica este orden: Hallazgo > Pregunta al negocio > Descartar > Automatizar con ajuste > Automatizar.

**Regla de consistencia para validaciones** (campo requerido, enum, formato y rango):
- Si la spec **declara la restricción** y **documenta un código de error** para input inválido en ese endpoint, pero la API no la aplica, es **Hallazgo**.
- Si la restricción o el código de error no están en la spec, o la spec se contradice sobre la regla misma, es **Pregunta al negocio**.

Ejemplos:
- `POST /pet` sin `name` es Hallazgo, porque `name` está en `required` y se documenta 405 Invalid input.
- `name: ""` es Pregunta, porque la spec no define `minLength`.

## 1. Totales por clasificación y tag

| Clasificación | pet | store | user | Total |
|---|---|---|---|---|
| Automatizar | 17 | 6 | 17 | 40 |
| Automatizar con ajuste | 12 | 6 | 0 | 18 |
| Hallazgo | 20 | 13 | 13 | 46 |
| Pregunta al negocio | 17 | 5 | 11 | 33 |
| Descartar | 3 | 5 | 0 | 8 |
| **Total** | **69** | **35** | **41** | **145** |

De los 46 hallazgos, **18 están verificados** y **28 son por analogía**. Cada patrón de analogía tiene al menos un caso verificado, salvo el overflow numérico (ver sección 2).

## 2. Hallazgos verificados (con evidencia)

| ID | Request | Esperado (spec) | Respuesta real | Problema |
|---|---|---|---|---|
| USR-033 | `GET /user/login` con password incorrecta | 400 Invalid username/password supplied | **200** `{"code":200,"type":"unknown","message":"logged in user session:1792101285013"}` | **Crítico.** El login acepta cualquier password. |
| USR-034 | `GET /user/login` con usuario inexistente | 400 | **200** `"logged in user session:…"` | **Crítico.** El login acepta usuarios que no existen. |
| USR-035 | `GET /user/login?password=Pass123` (sin username) | 400 | **200** `"logged in user session:…"` | El login no exige el parámetro requerido `username`. |
| PET-006 | `POST /pet` con `id: "abc"` | 405 Invalid input | **500** `{"code":500,"type":"unknown","message":"something bad happened"}` | Un input inválido produce un error de servidor. |
| PET-005 | `POST /pet` con JSON truncado | 405 Invalid input | **500** `"something bad happened"` | Un body no parseable produce un error de servidor. |
| STO-011 | `POST /store/order` con `quantity: "abc"` | 400 Invalid Order | **500** `"something bad happened"` | Error de servidor en vez del 400 documentado. |
| USR-004 | `POST /user` con `userStatus: "activo"` | 400 | **500** `"something bad happened"` | Error de servidor en vez del 400. |
| PET-027 | `GET /pet/abc` | 400 Invalid ID supplied | **404** `{"code":404,"type":"unknown","message":"java.lang.NumberFormatException: For input string: \"abc\""}` | Contradice el 400 documentado y **expone una excepción interna de Java**. |
| PET-044 | `DELETE /pet/abc` | 400 Invalid ID supplied | **404** con el mismo `NumberFormatException` | Igual que PET-027 en DELETE. |
| STO-016 | `POST /store/order` con `shipDate: "2026-13-45"` | 400 Invalid Order | **200** con `"shipDate":"2027-02-14T00:00:00.000+0000"` | **Corrupción silenciosa de datos:** la API "corre" el mes 13 y el día 45 y guarda otra fecha. |
| STO-010 | `POST /store/order` con `status: "cancelled"` | 400 Invalid Order | **200** con `"status":"cancelled"` | Guarda una orden con un status fuera del enum. |
| PET-007 | `POST /pet` con `status: "unknown"` | 405 Invalid input | **200** con `"status":"unknown"` | Guarda un Pet con un status fuera del enum. |
| PET-059 | `GET /pet/findByStatus?status=unknown` | 400 Invalid status value | **200** `[{…,"status":"unknown"}]` | No rechaza el valor fuera del enum y devuelve datos inválidos guardados (PET-007). |
| PET-003 | `POST /pet` sin `name` | 405 Invalid input | **200** `{"id":…,"photoUrls":[…],"tags":[]}` | Guarda un Pet sin un campo requerido. |
| PET-058 | `GET /pet/findByStatus` sin `status` | 400 Invalid status value | **200** `[]` | No aplica ni el 400 por parámetro requerido ni el `default: available`. |
| PET-066 | `GET /pet/findByTags` sin `tags` | 400 Invalid tag value | **200** `[]` | No rechaza la falta del parámetro requerido. |
| STO-023 | `GET /store/order/11` | 400 (maximum 10) | **404** `{"code":1,"type":"error","message":"Order not found"}` | No valida el rango documentado. |
| STO-022 | `GET /store/order/0` | 400 (minimum 1) | **404** `"Order not found"` | No valida el rango documentado. |

**Evidencia complementaria (STO-004):** `GET /store/inventory` devuelve claves como `"AAA"`, `"sold "`, `"null"`, `"0.5"` y `"avalible"`. Esto confirma que la API persiste status fuera del enum de forma generalizada.

### Hallazgos por analogía

| Patrón | Confirmado por | Casos que dependen |
|---|---|---|
| Body no parseable → 500 | PET-005 | PET-022, STO-009, USR-003, USR-023 |
| Tipo incorrecto o forma incorrecta del body → 500 | PET-006, STO-011, USR-004 | PET-018, USR-011, USR-014, USR-024 |
| Overflow numérico → 500 | *Sin confirmar* (ver corrección 2) | PET-011, STO-015, USR-005 |
| Id de path no numérico → 404 con excepción expuesta | PET-027, PET-044 | PET-031, PET-032, PET-038, PET-053, STO-025, STO-032 |
| Rango de `orderId` documentado no validado | STO-022, STO-023 | STO-019, STO-024, STO-030, STO-031 |
| Requerido o enum documentado no validado | PET-003, PET-007, PET-058, PET-059, PET-066 | PET-004, PET-020, PET-021, PET-060 |
| Login acepta cualquier credencial | USR-033, USR-034, USR-035 | USR-036, USR-037, USR-038 |

## 3. Preguntas al negocio (agrupadas por tema)

Ninguna de estas preguntas se automatiza hasta que se defina el comportamiento. **No se ajustó el resultado esperado al comportamiento real.**

### Autenticación y autorización
La spec declara `petstore_auth` y `api_key`, y la descripción de los endpoints de user dice "solo el usuario logueado". Sin embargo, la API respondió 200 a **todas** las requests sin credenciales, incluso para crear y eliminar. Además, el login entrega una sesión con cualquier credencial (USR-033), así que hoy no existe un control de acceso efectivo.
- ¿La API debe exigir autenticación? ¿Con qué código rechaza (401 o 403)? → PET-014, PET-023, PET-033, PET-041, PET-047, PET-054, PET-063, PET-069, STO-004, USR-008, USR-026, USR-030
- ¿Se validan la api_key y los scopes OAuth2 (`write:pets`)? → PET-015, PET-034, STO-005
- ¿Un usuario puede modificar o eliminar a otro? ¿Cómo se transporta la sesión y qué invalida el logout? → USR-031, USR-041
- *Relacionado (descartado como duplicado):* los endpoints de `/store/order` no declaran security. ¿Es aceptable que un cliente anónimo elimine órdenes? (STO-035)

### Restricciones no declaradas en la spec
- ¿Se rechazan `name: ""` o `photoUrls: []`? La spec no define `minLength` ni `minItems`. → PET-008, PET-009
- ¿`User` tiene campos requeridos? ¿Se valida el formato de `email`? ¿Qué es un username inválido? → USR-002, USR-007, USR-019, USR-029
- ¿`quantity` admite 0 o negativos? ¿`petId` debe referenciar una mascota existente? → STO-012, STO-013, STO-017
- ¿`username` es único? ¿Si el path y el body difieren, cuál prevalece? → USR-006, USR-025
- ¿Qué tipos de archivo se aceptan en uploadImage? → PET-051

### Enums sin regla clara
- El `status` del form data es un string libre en la spec. ¿Se valida contra el enum del modelo Pet? → PET-039
- ¿El enum distingue mayúsculas? ¿Un tag vacío es un filtro válido? → PET-061, PET-068

### Contradicción de la spec en findByStatus
- ¿Los valores se separan con comas, como dice la descripción, o se repite el parámetro, como indica `collectionFormat: multi`? → PET-062

## 4. Ajustes recurrentes (Automatizar con ajuste)

- **Datos compartidos:** las órdenes con id entre 1 y 10 y los ids fijos (STO-006, STO-020, STO-021, STO-026, STO-027, PET-028) pisan o dependen de datos ajenos. Hay que usar ids únicos o ejecutar en un entorno aislado.
- **Esperado corregible sin implicancia de seguridad:** un id negativo devuelve 404, no 400 (PET-029, PET-045, PET-019).
- **Códigos no documentados que hay que confirmar:** Content-Type no soportado y uploadImage o form sobre una mascota inexistente (PET-013, PET-037, PET-040, PET-050, PET-052, STO-018).
- **Datos ajenos inválidos:** en búsquedas por status hay que validar solo el filtro, no el esquema completo, porque otros usuarios guardan Pets sin `name` (PET-055, PET-056).
- **Precisión de int64:** PET-010 debe usar un id único cercano a 2^63 y comparar el id como string o BigInt. La API también asigna ids de usuario cercanos a int64 máximo (`9223372036854761717` en USR-008).

## 5. Descartados

| ID | Motivo |
|---|---|
| PET-030 | No determinista: ya existe una mascota ajena con id int64 máximo. |
| PET-046 | Equivalente a PET-042, porque la API ignora las credenciales. |
| PET-049 | Bajo valor: queda cubierto por PET-048 y PET-050. |
| STO-002 | No determinista: el conteo global del inventario cambia. |
| STO-003 | El resultado esperado no es verificable. |
| STO-033 | Equivalente a STO-028. |
| STO-034 | Bajo valor y no se puede asegurar que el id no exista. |
| STO-035 | Equivalente a STO-028. La pregunta de seguridad se lleva a la sección 3. |

## 6. Correcciones tras la segunda verificación

La segunda ejecución agregó 9 casos: un representante por cada patrón de analogía (PET-005, USR-004, STO-016, PET-044, STO-022, PET-066 y USR-035) más USR-033 y USR-034. Totales antes y después:

| Clasificación | Antes | Después | Cambio |
|---|---|---|---|
| Automatizar | 43 | 40 | −3 |
| Automatizar con ajuste | 18 | 18 | 0 |
| Hallazgo (verificados) | 39 (6) | 46 (18) | +7 (+12 verificados) |
| Pregunta al negocio | 37 | 33 | −4 |
| Descartar | 8 | 8 | 0 |

### Corrección 1 — El login no valida credenciales (contradice la clasificación)
- **USR-033 y USR-034:** pasan de **Automatizar a Hallazgo**. Estaban como Automatizar porque la spec documenta 400, pero la API devuelve 200 y una sesión con una password incorrecta y con un usuario inexistente.
- **Casos dependientes:**
  - **USR-038** (inyección en username) pasa de **Automatizar a Hallazgo por analogía**, porque si cualquier credencial es aceptada, también lo será el payload.
  - **USR-037** (credenciales vacías) cambia la base de su analogía a USR-033, USR-034 y USR-035.
  - **USR-032** (login válido) sigue en Automatizar. Su justificación ahora advierte que un 200 no distingue un login válido de uno inválido.
- **USR-035:** se confirma como Hallazgo, porque el login sin username devuelve 200. USR-036 hereda la confirmación.

### Corrección 2 — Fecha inválida: se acepta en silencio, no hay 500 (contradice la analogía)
- **STO-016:** sigue siendo **Hallazgo**, pero cambia el motivo. Se esperaba un 500, como en los demás errores de deserialización. La API respondió **200** y guardó `2026-13-45` como `2027-02-14`. Es más grave que un 500, porque se persiste un dato distinto al enviado sin avisar.
- **Casos dependientes:** ningún caso dependía de STO-016. El resultado sí debilita la analogía "overflow numérico → 500" (PET-011, STO-015, USR-005). Siguen como Hallazgo por analogía, pero su justificación ahora indica que la API puede aceptar valores inválidos en silencio. Quedan marcados como **sin confirmar**.

### Corrección 3 — Patrones confirmados (sin cambio de clasificación)
- **PET-005 (body no parseable → 500):** confirma PET-022, STO-009, USR-003 y USR-023. Se actualizó su justificación.
- **USR-004 (tipo incorrecto en User → 500):** confirma el patrón también para el tag user (USR-011, USR-014, USR-024).
- **PET-044 (DELETE /pet/abc → 404 con `NumberFormatException`):** confirma que la excepción se expone también en DELETE.
- **STO-022 (orderId 0 → 404):** confirma que no se valida ninguno de los límites del rango.
- **PET-066 (findByTags sin tags → 200 `[]`):** pasa a Hallazgo verificado.

### Corrección 4 — Consistencia en campos requeridos (regla explicada arriba)
Antes había una inconsistencia: PET-003 y PET-004 (`POST /pet` sin requerido) estaban como Pregunta, y PET-020 (el mismo caso en `PUT /pet`) estaba como Hallazgo. Se aplicó la regla de consistencia a **todos** los casos de validación:

| Caso | Antes | Después | Motivo |
|---|---|---|---|
| PET-003, PET-004 | Pregunta | **Hallazgo** | `name` y `photoUrls` están en `required` y `POST /pet` documenta 405 Invalid input. |
| PET-058 | Pregunta | **Hallazgo** | `status` es required y se documenta 400. La contradicción con `default` no lo salva: la API devuelve `[]`, que no cumple ninguna de las dos lecturas. |
| PET-007 | Pregunta | **Hallazgo** | Se extiende la misma regla a enums: el enum está declarado y se documenta 405. Queda consistente con PET-021 (el mismo caso en PUT). |
| PET-008, PET-009 | Pregunta | Pregunta (sin cambio) | La spec no declara `minLength` ni `minItems`. |
| PET-039, PET-061, PET-062, PET-068 | Pregunta | Pregunta (sin cambio) | La restricción no está declarada o la spec se contradice sobre la regla. |
| USR-035, USR-036, USR-037 | Hallazgo | Hallazgo (sin cambio) | Ya cumplían la regla: parámetros required con 400 documentado. |

*Nota:* la tarea pedía aplicar el criterio a los casos de campo requerido faltante. Se extendió también a PET-007 (enum), porque la misma inconsistencia existía frente a PET-021 y la regla no distingue el tipo de restricción.
