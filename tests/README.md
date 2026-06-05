# CiviTrack Load & Stress Tests

Built with [k6](https://k6.io) — open-source load testing tool.

## Install k6

**Windows:**
```powershell
winget install k6 --source winget
```

Or download from: https://k6.io/docs/get-started/installation/

## Test Files

| File | Purpose | Users | Duration |
|------|---------|-------|----------|
| `smoke-test.js` | Quick sanity check | 1 | 30s |
| `load-test.js` | Normal load simulation | up to 100 | ~3.5 min |
| `stress-test.js` | Find breaking point | up to 300 | ~2 min |

## Run Tests

Make sure the app is running first:
```bash
docker-compose up -d
```

### Smoke Test (run first)
```bash
k6 run tests/smoke-test.js
```

### Load Test
```bash
k6 run tests/load-test.js
```

### Stress Test
```bash
k6 run tests/stress-test.js
```

### Custom base URL (for VPS)
```bash
k6 run --env BASE_URL=http://your-vps-ip:3000 tests/load-test.js
```

## What is tested

**Load Test stages:**
1. Ramp up to 10 users (30s)
2. Ramp up to 50 users (60s)
3. Peak load — 100 users (60s)
4. Scale down (30s)
5. Ramp down to 0 (30s)

**Each virtual user:**
1. Hits `/health` endpoint
2. Registers a new account
3. Logs in
4. Submits a complaint (auto-classified)
5. Retrieves their complaints

## Expected Results

| Metric | Target |
|--------|--------|
| Error rate | < 10% |
| 95th percentile response | < 2000ms |
| Checks passed | > 90% |
