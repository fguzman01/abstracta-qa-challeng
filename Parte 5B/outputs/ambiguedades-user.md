# Ambigüedades y vacíos — tag `user`

1. **"Solo el usuario logueado" sin mecanismo:** `POST /user`, `PUT` y `DELETE /user/{username}` dicen "This can only be done by the logged in user", pero no declaran `security`. Tampoco se explica cómo se envía la sesión que devuelve `/user/login` (header, cookie o token).
2. **Respuestas `default` sin código:** `POST /user`, `createWithArray`, `createWithList` y `logout` solo tienen `default: successful operation`, sin status concreto ni errores documentados.
3. **Endpoints duplicados:** `createWithArray` y `createWithList` tienen la misma definición, y la summary de ambos dice "input array". No se explica en qué se diferencian.
4. **PUT y DELETE no documentan el éxito:** ninguno de los dos tiene respuesta 2xx.
5. **Modelo `User` sin restricciones:** no hay campos requeridos, no se define el formato de `email` y `phone` ni el dominio de valores de `userStatus`, y no se indica si `username` debe ser único.
6. **Body y path pueden no coincidir:** en `PUT /user/{username}` no se indica qué pasa si `username` del body es distinto al del path.
7. **"Invalid username supplied" no se define:** no se dice qué caracteres o longitudes se consideran inválidos.
8. **Las credenciales viajan en la query:** `/user/login` recibe la contraseña "in clear text" en la query string, y `schemes` permite `http`. Es un riesgo de seguridad.
9. **No se explica para qué sirve el token:** el body del login es un `string` sin formato. Tampoco se dice qué pasa cuando se supera `X-Rate-Limit` ni cuando vence `X-Expires-After`.
10. **Logout y autorización entre usuarios:** no se define el efecto del logout ni si un usuario puede modificar o eliminar a otro.
