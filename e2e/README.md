# E2E Tests

Playwright tests for the full Garden AI stack. Runs against an isolated Docker environment with a seeded test database.

## Prerequisites

- Docker (with Compose v2)
- Node.js 22+

## Running locally

**1. Start the e2e stack** (from the repo root):

```bash
docker compose -f docker-compose.e2e.yml up -d --wait
```

If backend code has changed since the last run, add `--build` to rebuild the image:

```bash
docker compose -f docker-compose.e2e.yml up -d --wait --build
```

This starts an isolated Postgres (in-memory), Django backend on port 8001, and Vite frontend on port 5174. The backend runs migrations automatically on startup.

**2. Install dependencies and browsers** (first time only):

```bash
cd e2e
npm install
npm run install:browsers
```

**3. Run the tests:**

```bash
npm test
```

**4. Tear down when done** (from the repo root):

```bash
docker compose -f docker-compose.e2e.yml down -v
```

The `-v` flag drops the in-memory volume so the next run starts from a clean database.

## Other commands

```bash
npm run test:ui       # interactive UI mode
npm run test:headed   # watch the browser
npm run report        # open the last HTML report
```

## Test data

`globalSetup` calls `python manage.py seed_test_data` inside the running backend container, which creates:

| Resource | Value |
|---|---|
| Username | `testuser` |
| Password | `TestPass123!` |
| Garden | Sunrise Garden (12 × 10 ft) |
| Bed | Front Raised Bed (8 × 4 ft) |
| Plant | Tomato — placed at (1, 1) |

Tests that need to assert against known state use this seeded data. Tests that create, edit, or delete resources create their own data and never touch the seeded records.

## CI

E2E tests run automatically on every push to `main` via `.github/workflows/e2e.yml`. The HTML report is uploaded as an artifact on failure.
