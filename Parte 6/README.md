# Parte 6 - Performance (k6)

Prueba de carga simple sobre el endpoint de listado de mascotas de [Swagger Petstore](https://petstore.swagger.io).

## Herramienta

**k6.** Los escenarios se escriben en JavaScript (el mismo lenguaje del resto del proyecto), es liviano, se ejecuta desde la línea de comandos y permite definir criterios de aceptación (*thresholds*) que hacen fallar la ejecución si no se cumplen, por lo que puede usarse como gate en un pipeline.

## Escenario

| Parámetro | Valor |
|---|---|
| Endpoint | `GET /pet/findByStatus?status=available` |
| Executor | `shared-iterations`: N usuarios virtuales concurrentes se reparten un total de requests |
| Concurrencia (N) | Configurable con `VUS` (default 20) |
| Requests totales | Configurable con `ITERATIONS` (default 200) |
| Validaciones (checks) | Status 200 y body que sea una lista JSON |
| Criterios de aceptación | Tasa de error < 5% y p95 < 3 s |
| Tope de duración | 2 minutos (`maxDuration`) |

**Carga moderada a propósito:** la Petstore es un servicio público y compartido. Generar una carga alta sería, en la práctica, saturar un servicio de terceros. Los niveles elegidos alcanzan para observar el comportamiento sin afectar a otros usuarios.

## Ejecución

### Requisitos

- [k6](https://grafana.com/docs/k6/latest/set-up/install-k6/) instalado. En Windows: `winget install k6 --source winget`.

### Comandos

Desde la carpeta `Parte 6`:

```bash
k6 run scripts/list-pets.js                                 # 20 VUs, 200 requests
k6 run -e VUS=50 -e ITERATIONS=500 scripts/list-pets.js     # 50 VUs, 500 requests
```

Cada ejecución genera en `results/`:
- `summary-<N>vus.md`: tabla con las métricas pedidas.
- `summary-<N>vus.json`: todas las métricas de k6.

## Resultados

| Métrica | 20 VUs (200 req) | 50 VUs (500 req) |
|---|---|---|
| Tiempo promedio | 164 ms | 169 ms |
| Mediana | 125 ms | 125 ms |
| **Percentil 95** | **385 ms** | **368 ms** |
| Máximo | 582 ms | 864 ms |
| **Tasa de error** | **0%** | **0%** |
| Throughput | 93 req/s | 190 req/s |

Ambos escenarios cumplieron los criterios de aceptación.

## Análisis

- **Sin degradación con más carga:** al pasar de 20 a 50 usuarios concurrentes, el throughput se duplicó y la mediana y el p95 se mantuvieron prácticamente iguales. La API no mostró signos de saturación en este rango.
- **El promedio es mayor que la mediana por el costo de conexión:** cada usuario virtual abre una conexión HTTPS en su primer request y luego la reutiliza. Ese handshake TLS (p95 de ~255 ms en `http_req_tls_handshaking`) afecta a ~10% de los requests y eleva el promedio y el p95. El tiempo de respuesta del servidor (`http_req_waiting`) tiene un p95 de ~248 ms.
- **Piso de latencia de ~121 ms:** el tiempo mínimo fue el mismo en ambas corridas y corresponde a la latencia de red entre el cliente y el servidor.
- **Respuestas pesadas:** cada respuesta pesa ~45 KB, porque el listado de mascotas disponibles es grande.

## Limitaciones

- Ejecución desde una sola máquina y ubicación: los tiempos incluyen la latencia de red del cliente.
- Servicio público compartido: los resultados pueden variar según la carga que generen otros usuarios en ese momento. En las pruebas funcionales (Parte 1) se observaron errores 500 intermitentes en este mismo endpoint, que no aparecieron en estas corridas.
- Con esta carga no se alcanzó el límite del servicio. Encontrarlo requeriría una prueba de estrés incremental (executor `ramping-vus`) contra un ambiente propio, no contra un servicio público.