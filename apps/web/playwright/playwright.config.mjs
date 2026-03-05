import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  tsconfig: "./tsconfig.json",
  retries: 0,
  use: {
    headless: true,
    baseURL: "http://localhost:3100",
  },
  webServer: {
    command: "pnpm --filter @feedback-360/web dev --port 3100",
    url: "http://localhost:3100",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
