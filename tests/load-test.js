import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// ── Custom metrics ────────────────────────────────
const errorRate      = new Rate('error_rate');
const loginDuration  = new Trend('login_duration');
const registerDuration = new Trend('register_duration');
const complaintDuration = new Trend('complaint_duration');
const healthDuration = new Trend('health_duration');
const totalRequests  = new Counter('total_requests');

// ── Test configuration ────────────────────────────
export const options = {
  stages: [
    { duration: '30s', target: 10  }, // ramp up to 10 users
    { duration: '60s', target: 50  }, // ramp up to 50 users
    { duration: '60s', target: 100 }, // ramp up to 100 users (peak load)
    { duration: '30s', target: 50  }, // scale down
    { duration: '30s', target: 0   }, // ramp down to 0
  ],
  thresholds: {
    error_rate:        ['rate<0.1'],   // error rate below 10%
    http_req_failed:   ['rate<0.1'],   // less than 10% failures
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// ── Helpers ───────────────────────────────────────
function randomEmail() {
  return `user_${Math.random().toString(36).substring(7)}_${Date.now()}@test.com`;
}

function randomComplaint() {
  const complaints = [
    { title: 'Water pipe broken on Avenue Kennedy', description: 'There is a major water leak on Avenue Kennedy causing flooding on the street and wasting water resources in our neighbourhood.' },
    { title: 'Power outage in Bastos area', description: 'We have had no electricity for the past 3 days in the Bastos neighbourhood. The transformer appears to have broken down and needs urgent repair.' },
    { title: 'Large pothole on Boulevard de la Liberté', description: 'There is a very dangerous pothole on Boulevard de la Liberté that has caused several motorcycle accidents this week. Urgent road repair needed.' },
    { title: 'Garbage not collected for 2 weeks', description: 'The garbage collection service has not come to our street for over two weeks. There is a large amount of waste piling up which is a health hazard.' },
    { title: 'Street light not working', description: 'The street lights on Rue de Nachtigal have been broken for a month. The area is very dark at night making it dangerous for pedestrians and residents.' },
  ];
  return complaints[Math.floor(Math.random() * complaints.length)];
}

// ── Main test scenario ────────────────────────────
export default function () {
  const email = randomEmail();
  const password = 'TestPass123!';

  // ── 1. Health check ───────────────────────────
  const healthStart = Date.now();
  const healthRes = http.get(`${BASE_URL}/health`);
  healthDuration.add(Date.now() - healthStart);
  totalRequests.add(1);

  check(healthRes, {
    'health check status 200': (r) => r.status === 200,
    'health check has gateway field': (r) => {
      try { return JSON.parse(r.body).gateway === 'up'; }
      catch { return false; }
    },
  });
  errorRate.add(healthRes.status !== 200);

  sleep(0.5);

  // ── 2. Register ───────────────────────────────
  const registerStart = Date.now();
  const registerRes = http.post(
    `${BASE_URL}/auth/register`,
    JSON.stringify({
      name: 'Test User',
      email: email,
      password: password,
      role: 'CITIZEN',
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  registerDuration.add(Date.now() - registerStart);
  totalRequests.add(1);

  const registerOk = check(registerRes, {
    'register status 201': (r) => r.status === 201,
    'register returns token': (r) => {
      try { return !!JSON.parse(r.body).access_token; }
      catch { return false; }
    },
  });
  errorRate.add(!registerOk);

  if (!registerOk) {
    sleep(1);
    return;
  }

  const registerData = JSON.parse(registerRes.body);
  let token = registerData.access_token;

  sleep(0.5);

  // ── 3. Login ──────────────────────────────────
  const loginStart = Date.now();
  const loginRes = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email, password }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  loginDuration.add(Date.now() - loginStart);
  totalRequests.add(1);

  const loginOk = check(loginRes, {
    'login status 200': (r) => r.status === 200,
    'login returns token': (r) => {
      try { return !!JSON.parse(r.body).access_token; }
      catch { return false; }
    },
  });
  errorRate.add(!loginOk);

  if (loginOk) {
    token = JSON.parse(loginRes.body).access_token;
  }

  sleep(0.5);

  // ── 4. Submit complaint ───────────────────────
  const complaint = randomComplaint();
  const complaintStart = Date.now();
  const complaintRes = http.post(
    `${BASE_URL}/complaints`,
    JSON.stringify(complaint),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }
  );
  complaintDuration.add(Date.now() - complaintStart);
  totalRequests.add(1);

  const complaintOk = check(complaintRes, {
    'complaint status 201': (r) => r.status === 201,
    'complaint auto-classified': (r) => {
      try { return !!JSON.parse(r.body).department; }
      catch { return false; }
    },
    'complaint has SLA': (r) => {
      try { return !!JSON.parse(r.body).slaDeadline; }
      catch { return false; }
    },
  });
  errorRate.add(!complaintOk);

  sleep(0.5);

  // ── 5. Get my complaints ──────────────────────
  const mineRes = http.get(
    `${BASE_URL}/complaints/mine`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  totalRequests.add(1);

  check(mineRes, {
    'get my complaints status 200': (r) => r.status === 200,
    'returns array': (r) => {
      try { return Array.isArray(JSON.parse(r.body)); }
      catch { return false; }
    },
  });

  sleep(1);
}

// ── Summary ───────────────────────────────────────
export function handleSummary(data) {
  return {
    'tests/load-test-results.json': JSON.stringify(data, null, 2),
    stdout: `
╔══════════════════════════════════════════════════════╗
║           CIVITRACK LOAD TEST RESULTS               ║
╚══════════════════════════════════════════════════════╝

Total Requests    : ${data.metrics.total_requests?.values?.count || 0}
Error Rate        : ${(data.metrics.error_rate?.values?.rate * 100 || 0).toFixed(2)}%
HTTP Failures     : ${(data.metrics.http_req_failed?.values?.rate * 100 || 0).toFixed(2)}%

Response Times:
  Health Check    : avg ${(data.metrics.health_duration?.values?.avg || 0).toFixed(0)}ms
  Register        : avg ${(data.metrics.register_duration?.values?.avg || 0).toFixed(0)}ms
  Login           : avg ${(data.metrics.login_duration?.values?.avg || 0).toFixed(0)}ms
  Submit Complaint: avg ${(data.metrics.complaint_duration?.values?.avg || 0).toFixed(0)}ms

Checks Passed     : ${(data.metrics.checks?.values?.rate * 100 || 0).toFixed(2)}%

Peak VUs          : ${data.metrics.vus_max?.values?.max || 0}
Test Duration     : ${(data.state?.testRunDurationMs / 1000 || 0).toFixed(0)}s
`,
  };
}
