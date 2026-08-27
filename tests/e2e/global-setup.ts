import type { FullConfig } from "@playwright/test";

/**
 * E2E globális bemelegítés.
 *
 * A PROBLÉMA: a webServer `next dev`, tehát minden útvonal ELSŐ betöltése
 * fordítással jár, és ez a fordítás a teszt saját idejébe számít. A
 * Playwright `webServer.url` health-checkje csak a gyökeret kéri le, tehát
 * csak azt fordítja le — az első néhány teszt fizeti ki az összes többi
 * útvonal fordítását. Hideg `.next`-tel (CI: friss checkout) ez még a 60 s-os
 * teszt-timeoutot is túllépheti.
 *
 * Eddig a `retries: 2` fedte el: az első futás bemelegítette a szervert, a
 * második átment. Ez működött, de a JELZÉST is elnyelte — egy valódi lassulás
 * ugyanúgy „flaky retry"-ként ment volna át.
 *
 * A bemelegítés ezt a költséget kiviszi a tesztekből a setupba, ahol nincs
 * időkorlát és nem hamisít eredményt.
 *
 * CSAK PUBLIKUS útvonalak vannak a listán: a védett utakat a middleware
 * bejelentkezés nélkül átirányítja, tehát az oldal-modul nem is fordulna le.
 * A haszon nagy része viszont a KÖZÖS rétegben van (middleware, gyökér-layout,
 * Clerk provider, i18n, design-tokenek) — azt ezek is lefordítják.
 *
 * A hiba SOSEM állítja meg a suite-ot: a bemelegítés gyorsítás, nem feltétel.
 */

const WARMUP_PATHS = [
  "/",
  "/try",
  "/sign-in",
  "/pilot",
  "/how-we-work",
  "/contact",
  // Tokenes belépők: érvénytelen tokennel is lefordítják az oldal-modult,
  // és a suite több tesztje indul innen.
  "/observe/warmup-invalid-token",
  "/join/warmup-invalid-token",
  "/apply/warmup-invalid-token",
];

/** Egy útvonal bemelegítésének felső ideje. */
const PER_PATH_TIMEOUT_MS = 90_000;

export default async function globalSetup(config: FullConfig): Promise<void> {
  const baseURL =
    config.projects[0]?.use?.baseURL ??
    process.env.PLAYWRIGHT_BASE_URL ??
    `http://127.0.0.1:${process.env.PLAYWRIGHT_PORT ?? "4100"}`;

  const startedAt = Date.now();

  // SORBAN, nem párhuzamosan: a dev-szerver fordítója amúgy is sorosít, a
  // párhuzamos kérések csak egymásra várnának – és a naplót olvashatatlanná
  // tennék.
  for (const path of WARMUP_PATHS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PER_PATH_TIMEOUT_MS);
    try {
      await fetch(`${baseURL}${path}`, {
        signal: controller.signal,
        redirect: "follow",
      });
    } catch {
      // Szándékosan néma: a bemelegítés best effort. Ha egy útvonal nem jön
      // össze, a hozzá tartozó teszt majd rendesen elbukik – ott a hibaüzenet
      // is beszédesebb lesz, mint itt.
    } finally {
      clearTimeout(timer);
    }
  }

  const seconds = Math.round((Date.now() - startedAt) / 100) / 10;
  console.log(`[e2e] ${WARMUP_PATHS.length} útvonal bemelegítve ${seconds}s alatt`);
}
