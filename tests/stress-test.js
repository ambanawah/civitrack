import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('error_rate');
const responseTrend = new Trend('response_time');

// ── Stress test — finds the breaking point ────────
export const options = {
  stages: [
    { duration: '20s', target: 20  },  // warm up
    { duration: '30s', target: 100 },  // ramp to 100
    { duration: '30s', target: 200 },  // ramp to 200
    { duration: '30s', target: 300 },  // push to 300
    { duration: '20s', target: 0   },  // cool down
  ],
  thresholds: {
    error_rate:        ['rate<0.2'],   // accept up to 20% errors under stress
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // Simple health check under extreme load
  const start = Date.now();
  const res = http.get(`${BASE_URL}/health`);
  responseTrend.add(Date.now() - start);

  check(res, {
    'status 200': (r) => r.status === 200,
    'response under 3s': (r) => r.timings.duration < 3000,
  });

  errorRate.add(res.status !== 200);
  sleep(0.1);
}
