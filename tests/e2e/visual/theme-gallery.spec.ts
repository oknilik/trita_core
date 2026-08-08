import { existsSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";

// Képi regressziós háló a színsémákra.
//
// ELŐZMÉNY: a korábbi pixel-baseline-ok macOS-en készültek, a CI Linuxán nem
// léteztek, és a nyelvi/spacing körök után elavultak — ezért törölték őket
// (ld. tests/e2e/team/team-intelligence-visual.test.ts fejléce). A sötét mód
// viszont KÉT felület-készletet hoz létre ugyanazon a kódon, amit kézzel nem
// lehet ellenőrizni.
//
// AMIÉRT EZ MOST TARTHATÓ: nem valódi app-oldalt fotózunk, hanem a
// token-galériát (`/dev/tokens`). Ott nincs adat, dátum, animáció és
// véletlen, tehát a baseline nem avul el magától — ami eltér, az tényleg a
// design-rendszer változása.
//
// AMIT NEM VÁLT KI: ez a design-rendszert őrzi, nem az elrendezést. A
// komponens-szintű vizuális háló továbbra is nyitott tétel.
//
// ────────────────────────────────────────────────────────────────────────
// BASELINE NÉLKÜL A TESZT KIHAGYJA MAGÁT — szándékosan.
//
// A baseline platform- ÉS böngészőbuild-függő. Ha hiányzik, a Playwright
// alapból legenerálná és elbuktatná a futást; egy másik gépen készült fájl
// pedig garantáltan hamis riasztást adna a betűrenderelés eltérése miatt.
// Ezért itt inkább csendben kimarad, és attól a pillanattól őriz, hogy
// valaki commitolt baseline-t.
//
// BASELINE LÉTREHOZÁSA / FRISSÍTÉSE (szándékos design-változás után) —
// azon a platformon, amin a CI fut:
//
//   UPDATE_VISUAL_BASELINE=1 pnpm exec playwright test tests/e2e/visual \
//     --update-snapshots
//
// majd a keletkezett `theme-gallery.spec.ts-snapshots/*.png` fájlokat
// commitold. Más platformon készültet ne.
// ────────────────────────────────────────────────────────────────────────

// A projekt gyökeréből származtatva: a Playwright innen fut, és így a
// modulrendszertől (ESM/CJS) függetlenül működik.
const SNAPSHOT_DIR = join(
  process.cwd(),
  "tests/e2e/visual/theme-gallery.spec.ts-snapshots",
);

const THEMES = ["light", "dark"] as const;

/**
 * Baseline-generáló futáskor NEM hagyjuk ki magunkat — különben a
 * `--update-snapshots` sosem tudná létrehozni az első baseline-t.
 *
 * Miért env és nem a CLI-kapcsoló: a Playwright a teszteket külön worker
 * processzben futtatja, oda a parancssori argumentumok nem jutnak el.
 */
const UPDATING = process.env.UPDATE_VISUAL_BASELINE === "1";

/** Van-e commitolt baseline (bármelyik platform-utótaggal). */
function hasBaseline(theme: string): boolean {
  const base = `token-gallery-${theme}.png`;
  if (!existsSync(SNAPSHOT_DIR)) return false;
  return [base, ...["linux", "darwin", "win32"].map((os) => base.replace(/\.png$/, `-${os}.png`))]
    .some((file) => existsSync(join(SNAPSHOT_DIR, file)));
}

for (const theme of THEMES) {
  test.describe(`token-galéria — ${theme} színséma`, () => {
    // A döntés a teszt TÖRZSÉN KÍVÜL: így baseline hiányában böngésző sem
    // indul (a törzsben lévő skip már a fixture létrehozása után futna).
    test.skip(
      !UPDATING && !hasBaseline(theme),
      "nincs commitolt baseline — hozd létre a CI platformján: " +
        "UPDATE_VISUAL_BASELINE=1 pnpm exec playwright test tests/e2e/visual --update-snapshots",
    );

    test("megegyezik a baseline-nal", async ({ page, context, baseURL }) => {
      await context.addCookies([
        { name: "trita_theme", value: theme, url: baseURL ?? "http://127.0.0.1:4100" },
      ]);

      await page.goto("/dev/tokens", { waitUntil: "domcontentloaded" });

      // A színsémát a festés előtti script teszi ki a <html>-re; itt csak
      // megvárjuk, hogy tényleg megtörtént.
      await expect
        .poll(() => page.evaluate(() => document.documentElement.dataset.theme))
        .toBe(theme);

      // Betűk betöltve — enélkül az első felvétel fallback-fonttal készülne.
      await page.evaluate(() => document.fonts.ready);

      // Animáció/átmenet kikapcsolva: két felvétel különben más fázisban
      // készülhet, és a diff zajos lenne (ezt a hibát menet közben mértük).
      await page.addStyleTag({
        content: "*,*::before,*::after{animation:none !important;transition:none !important}",
      });

      await expect(page).toHaveScreenshot(`token-gallery-${theme}.png`, {
        fullPage: true,
        // A betűrenderelés apró eltérései ne bukjanak; a színváltozás igen.
        maxDiffPixelRatio: 0.002,
        animations: "disabled",
      });
    });
  });
}
