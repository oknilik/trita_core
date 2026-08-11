#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────
// step12 — karrier-családok hozzárendelése a katalógushoz.
//
// Miért Node és nem Python, mint a step1…step11? Mert ez a lépés NEM külső
// forrást dolgoz fel (O*NET/ESCO/FEOR), hanem a repó saját katalógusán
// számol, és ugyanazt a konfigurációt olvassa, amit a TS-oldal
// (`src/lib/career/catalog/families.json`). Két nyelven tartani ugyanazt a
// hozzárendelési logikát felesleges kockázat lenne.
//
// A hozzárendelés HIBRID:
//   1. szemantikus korlát — a család `iscoPrefix` listája; a LEGHOSSZABB
//      illeszkedő prefix nyer (így a 3411 „jogi asszisztens" a `jog`-hoz megy,
//      nem a 34-es `segito`-hoz),
//   2. a megengedett családok közül a viselkedés-vektor dönt: a horgonyok
//      centroidjához mért euklideszi távolság,
//   3. a `pinned` nevek mindent felülírnak (pl. az „Adóügyintéző" az ISCO
//      2411-en ül a könyvelőkkel, mégis a `jog`-hoz tartozik).
//
// Futtatás:
//   node scripts/career-catalog/step12_families.mjs           # száraz futás
//   node scripts/career-catalog/step12_families.mjs --write   # katalógus írása
// ─────────────────────────────────────────────────────────────────────

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const CATALOG = resolve(ROOT, "src/lib/career/catalog/occupations.core.json");
const FAMILIES = resolve(ROOT, "src/lib/career/catalog/families.json");
const REVIEW = resolve(ROOT, "docs/product/data/career-families-review.csv");

const WRITE = process.argv.includes("--write");

const DIMS = ["H", "E", "X", "A", "C", "O"];
const AXES = ["people", "variety", "autonomy", "creation", "pace", "structure", "setting"];
const LETTERS = ["R", "I", "A", "S", "E", "C"];

/**
 * Viselkedés-vektor. A RIASEC dupla súlyt kap: az érdeklődés az, amit a
 * felhasználó FELISMER magán, a dimenzió-szintek és a tengelyek finomítanak.
 */
function vector(o) {
  return [
    ...DIMS.map((d) => (o.abs?.[d] ?? 50) / 100),
    ...AXES.map((a) => ((o.axes?.[a] ?? 0) + 1) / 2),
    ...LETTERS.map((l) => ((o.riasec?.[l] ?? 0) / 100) * 2),
  ];
}
const distance = (a, b) => Math.sqrt(a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0));
const centroid = (vs) => vs[0].map((_, i) => vs.reduce((s, v) => s + v[i], 0) / vs.length);

function main() {
  const catalog = JSON.parse(readFileSync(CATALOG, "utf8"));
  const config = JSON.parse(readFileSync(FAMILIES, "utf8"));
  const occupations = catalog.occupations;
  const byName = new Map(occupations.map((o) => [o.hu, o]));

  // Horgony-ellenőrzés: elgépelt név csendben rossz centroidot adna.
  const missing = [];
  for (const f of config.families) {
    for (const a of f.anchors) if (!byName.has(a)) missing.push(`${f.key} → "${a}"`);
  }
  if (missing.length) {
    console.error(`HIBA — ismeretlen horgony-foglalkozás:\n  ${missing.join("\n  ")}`);
    process.exit(1);
  }

  const centroids = new Map(
    config.families.map((f) => [f.key, centroid(f.anchors.map((a) => vector(byName.get(a))))]),
  );
  const pinned = new Map();
  for (const f of config.families) for (const name of f.pinned ?? []) pinned.set(name, f.key);

  const assignments = new Map();
  const distances = [];
  for (const o of occupations) {
    if (pinned.has(o.hu)) {
      assignments.set(o.id, { family: pinned.get(o.hu), distance: 0, pinned: true });
      continue;
    }
    const isco = String(o.isco ?? "");
    let longest = -1;
    let pool = [];
    for (const f of config.families) {
      const match = f.iscoPrefix
        .filter((p) => isco.startsWith(p))
        .sort((a, b) => b.length - a.length)[0];
      if (!match) continue;
      if (match.length > longest) {
        longest = match.length;
        pool = [f.key];
      } else if (match.length === longest) pool.push(f.key);
    }
    if (!pool.length) pool = config.families.map((f) => f.key);

    const v = vector(o);
    let best = pool[0];
    let bestDistance = Infinity;
    for (const key of pool) {
      const d = distance(v, centroids.get(key));
      if (d < bestDistance) {
        bestDistance = d;
        best = key;
      }
    }
    assignments.set(o.id, { family: best, distance: bestDistance, pinned: false });
    distances.push(bestDistance);
  }

  // Review-küszöb: a 85. percentilis fölötti távolságúak kézi ellenőrzésre.
  distances.sort((a, b) => a - b);
  const threshold = distances[Math.floor(distances.length * 0.85)];

  const perFamily = new Map();
  for (const o of occupations) {
    const a = assignments.get(o.id);
    if (!perFamily.has(a.family)) perFamily.set(a.family, []);
    perFamily.get(a.family).push({ o, ...a });
  }

  console.log(`\ncsalád                  db   szórás   review`);
  console.log("─".repeat(48));
  const rows = [...perFamily.entries()].sort((a, b) => b[1].length - a[1].length);
  for (const [key, members] of rows) {
    const vs = members.map((m) => vector(m.o));
    const c = centroid(vs);
    const spread = vs.reduce((s, v) => s + distance(v, c), 0) / vs.length;
    const review = members.filter((m) => !m.pinned && m.distance > threshold).length;
    console.log(
      `${key.padEnd(22)} ${String(members.length).padStart(3)}   ${spread.toFixed(2).padStart(5)}   ${String(review).padStart(4)}`,
    );
  }
  const reviewList = occupations
    .filter((o) => {
      const a = assignments.get(o.id);
      return !a.pinned && a.distance > threshold;
    })
    .map((o) => ({ o, a: assignments.get(o.id) }));
  console.log("─".repeat(48));
  console.log(
    `${rows.length} család · ${occupations.length} foglalkozás · ${reviewList.length} review (küszöb ${threshold.toFixed(2)})`,
  );

  if (!WRITE) {
    console.log("\n[SZÁRAZ FUTÁS] A katalógus nem változott. Írás: --write\n");
    return;
  }

  for (const o of occupations) o.family = assignments.get(o.id).family;
  catalog.meta.familyVersion = config.meta.version;
  // Tömörítve írjuk vissza — a katalógus így él a repóban (345 KB egy sorban).
  // A szépen formázott alak megháromszorozná a méretét, és a diff olvashatatlan
  // lenne; a tartalmi review a CSV-n történik, nem a JSON-on.
  writeFileSync(CATALOG, `${JSON.stringify(catalog)}\n`);
  console.log(`\nkatalógus írva: ${CATALOG}`);

  const csv = [
    "id;nev;isco;feor;csalad;tavolsag",
    ...reviewList
      .sort((x, y) => y.a.distance - x.a.distance)
      .map(({ o, a }) =>
        [o.id, o.hu, o.isco ?? "", o.feor ?? "", a.family, a.distance.toFixed(3)].join(";"),
      ),
  ].join("\n");
  writeFileSync(REVIEW, `${csv}\n`);
  console.log(`review-lista írva: ${REVIEW} (${reviewList.length} tétel)\n`);
}

main();
