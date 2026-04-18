import { defineConfig, devices } from "@playwright/test";

const port = 3001;
const baseURL = `http://127.0.0.1:${port}`;

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
      NEXT_PUBLIC_API_BASE_URL: "http://backend:8080",
      NEXT_PUBLIC_RUNTIME_DATA_MODE: "seed-read",
      PORT: String(port),
    },
  },
});
