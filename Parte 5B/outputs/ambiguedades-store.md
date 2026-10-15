# Ambigüedades y vacíos — tag `store`

1. **Rangos de `orderId` inconsistentes:** GET acepta de 1 a 10 y DELETE solo `minimum: 1`. POST no restringe el `id`, así que se puede crear una orden que después GET no puede consultar.
2. **El código de los valores inválidos no está claro:** GET dice "Other values will generated exceptions" sin decir qué código devuelve. Para un id fuera de rango puede responder 400 o 404.
3. **Las órdenes no tienen seguridad:** ningún endpoint de `/store/order` declara `security`, así que cualquier cliente anónimo puede crear, leer y eliminar órdenes.
4. **DELETE no documenta el éxito:** `DELETE /store/order/{orderId}` no tiene respuesta 2xx.
5. **Modelo `Order` sin restricciones:** no hay campos requeridos, no hay `minimum` para `quantity` y no se indica si `petId` debe existir ni si `shipDate` puede estar en el pasado.
6. **La descripción del parámetro es incorrecta:** `orderId` en GET dice "ID of pet that needs to be fetched", pero en realidad es el id de una orden.
7. **Semántica del inventario:** no se definen las claves del mapa. Se infiere que son los status de mascota, pero no está documentado. Tampoco hay 401 para `api_key`.
8. **El campo `complete` no se explica:** no queda claro cómo se relaciona con `status` (por ejemplo, `delivered` con `complete: false`).
