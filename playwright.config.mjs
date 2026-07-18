import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: "kangjie-browser.spec.mjs",
  outputDir: "./output/playwright/results",
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  webServer: {
    command: "npx --yes serve . -l 4187 --no-clipboard",
    url: "http://127.0.0.1:4187/index.html",
    reuseExistingServer: false,
    timeout: 30_000,
  },
  use: {
    baseURL: "http://127.0.0.1:4187",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
