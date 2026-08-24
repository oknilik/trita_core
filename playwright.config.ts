import { defineConfig, devices } from "@playwright/test";

// 127.0.0.1, nem localhost: a böngésző-oldali névfeloldás így teljesen
// kimarad — CI-runneren előfordult, hogy a chromium a "localhost"-ra
// ERR_NAME_NOT_RESOLVED-et adott, miközben a Node-oldali health-check
// ugyanoda gond nélkül elért.
const serverPort = process.env.PLAYWRIGHT_PORT ?? "4100";
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${serverPort}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html", { open: "never" }], ["list"]],
  // A dev-szerver útvonal-fordítását kiviszi a tesztek idejéből — ld. a fájl
  // fejlécét. Enélkül az első néhány teszt fizeti ki az összes többi
  // fordítását, és hideg `.next`-tel (CI: friss checkout) bele is fut a
  // timeoutba.
  globalSetup: "./tests/e2e/global-setup.ts",
  // A webServer `next dev`: MINDEN útvonal első betöltése fordítással jár, és
  // ez a fordítás a teszt idejébe számít. A Playwright 30 s-os alapértéke egy
  // előre lefordított appra van szabva — nálunk a hideg útvonalakat érintő
  // tesztek rendszeresen belefutottak, és a `retries: 2` fedte el (a második
  // futásra a szerver már meleg volt). Ez a jelzést is elnyelte: egy valódi
  // lassulás ugyanúgy „flaky retry"-ként ment volna át.
  //
  // 60 s bőven a meleg futásidők (2–20 s) felett van, tehát valódi
  // regressziót továbbra is elkap — csak a hidegindítást nem bünteti.
  timeout: 60_000,
  // Az `expect(...)` SAJÁT időkorláttal dolgozik (alapból 5 s), amit a fenti
  // teszt-timeout NEM fed. Ez az 5 s meleg alkalmazásra van szabva: ha egy
  // állítás olyan képernyőt vár, amit a dev-szerver épp most fordít, a
  // várakozás lejár, mielőtt a nézet megjelenne — a teszt pedig „element not
  // found"-ot jelent, ami valódi hibának LÁTSZIK.
  //
  // A suite több tesztje eddig egyenként írt ki `{ timeout: 15_000 }`-et
  // ugyanezért; ez a sor ugyanazt teszi alapértékké. Valódi regressziót
  // továbbra is elkap: egy meglévő nézet másodpercek alatt megjelenik.
  expect: { timeout: 15_000 },
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
    command: `TRITA_E2E_AUTH_BYPASS=1 pnpm exec next dev -p ${serverPort}`,
    url: baseURL,
    timeout: 120_000,
    // A pilot gate soha nem használhat újra egy esetleg dev-DB-vel futó
    // helyi szervert: saját porton, saját processzként indul.
    reuseExistingServer: process.env.TRITA_PILOT_GATE !== "1",
  },
  projects: [
    {
      name: "chromium",
      testIgnore: /\/mobile\//,
      use: {
        ...devices["Desktop Chrome"],
        // A célpont mindig a helyi dev-szerver — host-oldali proxy env
        // (pl. vállalati/CI HTTP_PROXY) ne térítse el a localhost-forgalmat.
        //
        // PLAYWRIGHT_CHROMIUM_PATH: menekülő-út zárt környezethez, ahol a
        // Playwright által várt böngésző-build nincs letöltve, de egy másik
        // elérhető (a PLAYWRIGHT_BASE_URL mintájára). Üresen hagyva a
        // Playwright a saját letöltését használja — CI-ben ez a helyes.
        launchOptions: {
          args: ["--no-proxy-server"],
          ...(process.env.PLAYWRIGHT_CHROMIUM_PATH
            ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
            : {}),
        },
      },
    },
    {
      name: "mobile-compact",
      testMatch: /\/mobile\/.*\.test\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 360, height: 800 },
        hasTouch: true,
        isMobile: true,
        launchOptions: {
          args: ["--no-proxy-server"],
          ...(process.env.PLAYWRIGHT_CHROMIUM_PATH
            ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
            : {}),
        },
      },
    },
    {
      name: "mobile-standard",
      testMatch: /\/mobile\/.*\.test\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 390, height: 844 },
        hasTouch: true,
        isMobile: true,
        launchOptions: {
          args: ["--no-proxy-server"],
          ...(process.env.PLAYWRIGHT_CHROMIUM_PATH
            ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
            : {}),
        },
      },
    },
  ],
});
