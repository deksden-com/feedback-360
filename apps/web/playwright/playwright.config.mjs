import { defineConfig } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3100";
const useRemoteBaseUrl = Boolean(process.env.PLAYWRIGHT_BASE_URL);

export default defineConfig({
  testDir: "./tests",
  tsconfig: "./tsconfig.json",
  retries: 0,
  use: {
    headless: true,
    baseURL,
  },
  webServer: useRemoteBaseUrl
    ? undefined
    : {
        command: "pnpm --filter @feedback-360/web dev --hostname 127.0.0.1 --port 3100",
        url: "http://localhost:3100",
        reuseExistingServer: true,
        timeout: 240_000,
      },
});
