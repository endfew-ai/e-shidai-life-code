import { defineConfig, devices } from "@playwright/test";

const testPort = Number(process.env.PLAYWRIGHT_PORT || 4197);
const testBaseUrl = `http://127.0.0.1:${testPort}`;

export default defineConfig({
  testDir: "./tests",
  testMatch: ["kangjie-browser.spec.mjs", "numerology-browser.spec.mjs"],
  outputDir: "./output/playwright/results",
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  webServer: {
    command: `npx --yes serve . -l ${testPort} --no-clipboard`,
    url: `${testBaseUrl}/index.html`,
    reuseExistingServer: false,
    timeout: 30_000,
  },
  use: {
    baseURL: testBaseUrl,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
