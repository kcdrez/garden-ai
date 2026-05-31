import { execSync } from "child_process";
import { request } from "@playwright/test";

const BACKEND_URL = "http://localhost:8001";
const AUTH_FILE = ".auth/user.json";

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

async function seedAndLogin(): Promise<void> {
  // Seed deterministic test data via management command
  execSync("docker compose -f docker-compose.e2e.yml exec -T backend python manage.py seed_test_data", {
    cwd: process.cwd().replace(/\/e2e$/, ""),
    stdio: "inherit",
  });

  // Log in and save auth state for reuse in all specs
  const ctx = await request.newContext({ baseURL: BACKEND_URL });
  const res = await ctx.post("/api/auth/token/", {
    data: { username: "testuser", password: "TestPass123!" },
  });

  if (!res.ok()) {
    throw new Error(`Login failed: ${res.status()} ${await res.text()}`);
  }

  const { access, refresh } = await res.json();
  await ctx.dispose();

  // Write storageState manually so browser tests can reuse the tokens
  const fs = await import("fs");
  const path = await import("path");
  const authDir = path.join(__dirname, ".auth");
  if (!fs.existsSync(authDir)) fs.mkdirSync(authDir);

  fs.writeFileSync(
    path.join(__dirname, AUTH_FILE),
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
}

export default async function globalSetup() {
  await waitForHealth(BACKEND_URL);
  await seedAndLogin();
}
