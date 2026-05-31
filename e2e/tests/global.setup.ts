import { test as setup } from "@playwright/test";
import { execSync } from "child_process";
import { request } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

const BACKEND_URL = "http://localhost:8001";
const AUTH_FILE = path.join(__dirname, "../.auth/user.json");

async function waitForHealth(url: string, maxWaitMs = 60_000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    try {
      const ctx = await request.newContext();
      const res = await ctx.get(`${url}/api/health/`);
      await ctx.dispose();
      if (res.ok()) return;
    } catch {
      // not ready yet
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Backend at ${url} did not become healthy within ${maxWaitMs}ms`);
}

setup.setTimeout(120_000);

setup("seed database and authenticate", async () => {
  await waitForHealth(BACKEND_URL);

  execSync(
    "docker compose -f docker-compose.e2e.yml exec -T backend python manage.py seed_test_data",
    {
      cwd: path.join(__dirname, "../.."),
      stdio: "inherit",
    },
  );

  const ctx = await request.newContext({ baseURL: BACKEND_URL });
  const res = await ctx.post("/api/auth/token/", {
    data: { username: "testuser", password: "TestPass123!" },
  });

  if (!res.ok()) {
    throw new Error(`Login failed: ${res.status()} ${await res.text()}`);
  }

  const { access, refresh } = await res.json();
  await ctx.dispose();

  const authDir = path.dirname(AUTH_FILE);
  if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });

  fs.writeFileSync(
    AUTH_FILE,
    JSON.stringify({
      cookies: [],
      origins: [
        {
          origin: "http://localhost:5174",
          localStorage: [
            { name: "access_token", value: access },
            { name: "refresh_token", value: refresh },
          ],
        },
      ],
    }),
  );
});
