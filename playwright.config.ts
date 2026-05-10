import { defineConfig, devices } from "@playwright/test";

const webPort = process.env.E2E_WEB_PORT ?? "3100";
const adminPort = process.env.E2E_ADMIN_PORT ?? "3101";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  timeout: 120_000,
  expect: {
    timeout: 10_000,
  },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    viewport: { width: 1440, height: 960 },
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        channel: "chrome",
        baseURL: `http://localhost:${webPort}`,
      },
    },
  ],
  metadata: {
    webBaseUrl: `http://localhost:${webPort}`,
    adminBaseUrl: `http://localhost:${adminPort}`,
  },
  webServer: [
    {
      command: "pnpm --dir apps/api exec tsx src/index.ts",
      url: "http://localhost:4000/health",
      reuseExistingServer: true,
      timeout: 120_000,
      env: {
        PORT: "4000",
        NODE_ENV: "test",
      },
    },
    {
      command: `pnpm --dir apps/web exec next start -p ${webPort}`,
      url: `http://localhost:${webPort}`,
      reuseExistingServer: true,
      timeout: 120_000,
      env: {
        NEXTAUTH_URL: `http://localhost:${webPort}`,
        NEXT_PUBLIC_API_URL: "http://localhost:4000",
        NODE_ENV: "production",
      },
    },
    {
      command: `pnpm --dir apps/admin exec next start -p ${adminPort}`,
      url: `http://localhost:${adminPort}`,
      reuseExistingServer: true,
      timeout: 120_000,
      env: {
        NEXTAUTH_URL: `http://localhost:${adminPort}`,
        NEXT_PUBLIC_API_URL: "http://localhost:4000",
        NODE_ENV: "production",
      },
    },
  ],
});
