import http from 'k6/http';
import { check, sleep } from 'k6';

// ── Smoke test — 1 user, verify everything works ──
export const options = {
  vus: 1,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed:   ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // Health
  const health = http.get(`${BASE_URL}/health`);
  check(health, { 'health ok': (r) => r.status === 200 });

  // Register
  const email = `smoke_${Date.now()}@test.com`;
  const reg = http.post(
    `${BASE_URL}/auth/register`,
    JSON.stringify({ name: 'Smoke User', email, password: 'Test1234!', role: 'CITIZEN' }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  check(reg, { 'register ok': (r) => r.status === 201 });

  // Login
  const login = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email, password: 'Test1234!' }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  check(login, { 'login ok': (r) => r.status === 200 });

  const token = JSON.parse(login.body).access_token;

  // Submit complaint
  const complaint = http.post(
    `${BASE_URL}/complaints`,
    JSON.stringify({
      title: 'Smoke test water leak',
      description: 'This is a smoke test complaint about a water pipe leaking near the main road causing flooding.',
    }),
    { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
  );
  check(complaint, {
    'complaint ok': (r) => r.status === 201,
    'auto-classified': (r) => !!JSON.parse(r.body).department,
  });

  sleep(1);
}
