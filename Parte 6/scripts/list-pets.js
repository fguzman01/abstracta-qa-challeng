import http from 'k6/http';
import { check } from 'k6';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.1.0/index.js';

const BASE_URL = __ENV.BASE_URL || 'https://petstore.swagger.io/v2';
const VUS = Number(__ENV.VUS || 20);
const ITERATIONS = Number(__ENV.ITERATIONS || 200);

export const options = {
  scenarios: {
    listar_mascotas: {
      executor: 'shared-iterations',
      vus: VUS,
      iterations: ITERATIONS,
      maxDuration: '2m',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<3000'],
  },
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)'],
};

export default function () {
  const res = http.get(`${BASE_URL}/pet/findByStatus?status=available`, {
    headers: { Accept: 'application/json' },
    tags: { name: 'GET /pet/findByStatus' },
  });

  check(res, {
    'status es 200': (r) => r.status === 200,
    'body es una lista': (r) => {
      try {
        return Array.isArray(r.json());
      } catch (e) {
        return false;
      }
    },
  });
}

export function handleSummary(data) {
  const duration = data.metrics.http_req_duration.values;
  const errorRate = data.metrics.http_req_failed.values.rate;
  const totalRequests = data.metrics.http_reqs.values.count;

  const report = [
    '## Resultados - GET /pet/findByStatus?status=available',
    '',
    `- Usuarios concurrentes (VUs): ${VUS}`,
    `- Requests totales: ${totalRequests}`,
    '',
    '| Métrica | Valor |',
    '|---|---|',
    `| Tiempo promedio | ${duration.avg.toFixed(0)} ms |`,
    `| Mediana | ${duration.med.toFixed(0)} ms |`,
    `| Percentil 95 | ${duration['p(95)'].toFixed(0)} ms |`,
    `| Máximo | ${duration.max.toFixed(0)} ms |`,
    `| Tasa de error | ${(errorRate * 100).toFixed(2)} % |`,
    '',
  ].join('\n');

  return {
    stdout: textSummary(data, { indent: ' ', enableColors: true }) + '\n\n' + report,
    [`results/summary-${VUS}vus.json`]: JSON.stringify(data, null, 2),
    [`results/summary-${VUS}vus.md`]: report,
  };
}