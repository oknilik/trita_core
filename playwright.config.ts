import { defineConfig, devices } from "@playwright/test";

// 127.0.0.1, nem localhost: a böngésző-oldali névfeloldás így teljesen
// kimarad — CI-runneren előfordult, hogy a chromium a "localhost"-ra
// ERR_NAME_NOT_RESOLVED-et adott, miközben a Node-oldali health-check
// ugyanoda gond nélkül elért.
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4100";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL,
    headless: true,
    viewport: { width: 1440, height: 900 },
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "TRITA_E2E_AUTH_BYPASS=1 pnpm exec next dev -p 4100",
    url: baseURL,
    timeout: 120_000,
    reuseExistingServer: true,
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // A célpont mindig a helyi dev-szerver — host-oldali proxy env
        // (pl. vállalati/CI HTTP_PROXY) ne térítse el a localhost-forgalmat.
        launchOptions: { args: ["--no-proxy-server"] },
      },
    },
  ],
});
