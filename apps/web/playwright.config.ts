import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.WEB_SMOKE_PORT ?? "3001");
const baseURL = `http://127.0.0.1:${port}`;
const backendBaseURL = process.env.WEB_SMOKE_BACKEND_URL ?? "http://127.0.0.1:18080";

export default defineConfig({
  testDir: "./tests",
  testMatch: "*.smoke.spec.ts",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : [["list"]],
  use: {
    ...devices["Desktop Chrome"],
    baseURL,
    headless: true,
    trace: "retain-on-failure",
  },
  webServer: {
    command: "pnpm run smoke:serve",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    stdout: "ignore",
    stderr: "pipe",
    env: {
      INTERNAL_API_BASE_URL: backendBaseURL,
      NEXT_PUBLIC_API_BASE_URL: backendBaseURL,
      NEXT_PUBLIC_RUNTIME_DATA_MODE: "seed-read",
      PLATFORM_ADMIN_SHARED_SECRET: "stage03-platform-admin-secret",
      PORT: String(port),
    },
  },
});
