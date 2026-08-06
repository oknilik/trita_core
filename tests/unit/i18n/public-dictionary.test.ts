import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import {
  PUBLIC_TRANSLATION_DOMAINS,
  t as publicT,
  tf as publicTf,
} from "@/lib/i18n/public";
import { t as fullT } from "@/lib/i18n";

// ŐRZŐ TESZT a szeletelt i18n-hez.
//
// A publikus (marketing) kliens-komponensek a szűk `@/lib/i18n/public`
// szótárból dolgoznak — ez tartja a landing kezdő JS-ét ~110 KB-tal kisebben
// (az org/results/assessment fordítások nélkül). A szeletelés ára, hogy egy
// publikus felület ELVILEG hivatkozhatna olyan kulcsra, ami csak a teljes
// szótárban van: ilyenkor a t() a NYERS KULCSOT adja vissza, és az jelenik
// meg a felhasználónak. Ez a teszt ezt bukja el build előtt.
//
// Amit NEM fed le: a dinamikusan összerakott kulcsok (sablon-literál,
// változó szegmens). Azokat kézzel kell ellenőrizni — a teszt külön listázza,
// ha ilyet talál, hogy legalább látható legyen.

const ROOT = process.cwd();
const SRC = join(ROOT, "src");

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === "node_modules" || entry === ".next") continue;
      walk(full, out);
    } else if (/\.(tsx|ts)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

const allFiles = walk(SRC);

/** Fájlok, amelyek a PUBLIKUS (szűk) szótárból importálnak. */
const publicFiles = allFiles.filter((f) =>
  readFileSync(f, "utf8").includes('from "@/lib/i18n/public"'),
);

// Statikus t("...") / tf("...") kulcsok — az első argumentum idézőjeles.
const STATIC_KEY = /\b(?:t|tf)\(\s*"([^"]+)"/g;
// Dinamikus kulcs: sablon-literál első argumentumként.
const DYNAMIC_KEY = /\b(?:t|tf)\(\s*`([^`]*)`/g;

test("a publikus szótárt legalább egy publikus kliens-fájl használja", () => {
  assert.ok(
    publicFiles.length >= 10,
    `csak ${publicFiles.length} fájl importál a @/lib/i18n/public-ból — elmozdult a szeletelés?`,
  );
});

test("minden publikus felületen használt statikus kulcs feloldható (HU+EN)", () => {
  const missing: string[] = [];
  let checked = 0;

  for (const file of publicFiles) {
    const source = readFileSync(file, "utf8");
    for (const match of source.matchAll(STATIC_KEY)) {
      const key = match[1];
      // Csak pont-elválasztott kulcsokat nézünk (a t() más célú hívásai,
      // pl. teszt-segédek, nem ilyen alakúak).
      if (!key.includes(".")) continue;
      checked += 1;
      for (const locale of ["hu", "en"] as const) {
        if (publicT(key, locale) === key) {
          missing.push(`${relative(ROOT, file)} :: ${key} (${locale})`);
        }
      }
    }
  }

  assert.ok(checked > 50, `túl kevés kulcsot találtam (${checked}) — elromlott a minta-illesztés?`);
  assert.deepEqual(
    missing,
    [],
    `A publikus szótár nem oldja fel ezeket a kulcsokat — a felületen NYERS KULCS jelenne meg.\n` +
      `Megoldás: vedd fel a hiányzó domént a src/lib/i18n/public.ts PUBLIC_TRANSLATION_DOMAINS listájába,\n` +
      `vagy tedd a kulcsot a shared-labels.ts-be, ha mindkét fa használja.\n` +
      missing.join("\n"),
  );
});

test("a dinamikus kulcsok névtere is benne van a publikus szótárban", () => {
  // A sablon-literálos kulcsok (pl. `pricing.faqQ${i}`) konkrét értékét nem
  // tudjuk statikusan feloldani, de a NÉVTERÜKET igen — és a valós kockázat
  // pont az, hogy egy egész domén hiányzik a publikus szótárból.
  const publicNamespaces = new Set(
    PUBLIC_TRANSLATION_DOMAINS.flatMap((domain) => Object.keys(domain as object)),
  );

  const bad: string[] = [];
  let found = 0;

  for (const file of publicFiles) {
    const source = readFileSync(file, "utf8");
    for (const match of source.matchAll(DYNAMIC_KEY)) {
      const raw = match[1];
      const staticPrefix = raw.split("${")[0];
      const namespace = staticPrefix.split(".")[0];
      // Ha maga a névtér is dinamikus (`${x}.y`), azt nem tudjuk ellenőrizni.
      if (!namespace) {
        bad.push(`${relative(ROOT, file)} :: \`${raw}\` — a NÉVTÉR is dinamikus, kézi ellenőrzés kell`);
        continue;
      }
      found += 1;
      if (!publicNamespaces.has(namespace)) {
        bad.push(`${relative(ROOT, file)} :: \`${raw}\` — a(z) "${namespace}" névtér nincs a publikus szótárban`);
      }
    }
  }

  assert.ok(found > 0, "nem találtam dinamikus kulcsot — elromlott a minta-illesztés?");
  assert.deepEqual(
    bad,
    [],
    `Dinamikus i18n-kulcs olyan névtérre, amit a publikus szótár nem fed:\n${bad.join("\n")}`,
  );
});

test("a publikus és a teljes szótár ugyanazt adja a közös kulcsokra", () => {
  // A shared-labels.ts-ben lévő kulcsok mindkét szótárban élnek — ha
  // elcsúsznának, a landing és az eredmény-oldal más szöveget mutatna.
  for (const key of ["results.roleFitEyebrow", "content.roleFitStrong"]) {
    for (const locale of ["hu", "en"] as const) {
      assert.notEqual(publicT(key, locale), key, `${key} hiányzik a publikus szótárból`);
      assert.equal(
        publicT(key, locale),
        fullT(key, locale),
        `${key} (${locale}) eltér a két szótárban`,
      );
    }
  }
});

test("a tf változó-behelyettesítés a publikus szótárban is működik", () => {
  const withVar = publicTf("nav.greeting", "hu", { name: "Anna" });
  assert.ok(typeof withVar === "string" && withVar.length > 0);
});
