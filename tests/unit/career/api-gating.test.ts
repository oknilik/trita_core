import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// A karrier-API kapuzási szerződése — FORRÁS-SZINTŰ kontraktus-teszt (a
// route-handlerek Clerk/Prisma nélkül unit-rétegben nem hívhatók; a minta az
// analytics instrumentation-coverage teszté).
//
// A szabály: a parkolt modul (CAREER_MODULE_READY=false) VAGY az org-szintű
// elrejtés (isCareerModuleHidden) esetén a karrier-végpontok NEM léteznek
// (404) — összhangban azzal, hogy a UI szerint a feature nincs. A kapu
// korábban csak a /api/career/fit-en élt: a 477 tételes katalógus kapuzatlanul
// enumerálható volt, a kalibrációs visszajelzés pedig kliens által állított
// fitScore-t mentett rating-ként (jövőbeli kalibráció-mérgezés).

const read = (relative: string) =>
  readFileSync(join(process.cwd(), relative), "utf8");

const GATED_ROUTES = [
  "src/app/api/career/fit/route.ts",
  "src/app/api/career/occupations/route.ts",
  "src/app/api/industry-fit/feedback/route.ts",
];

test("minden karrier-végpont a modul-kapu mögött van (404 parkolt/rejtett modulnál)", () => {
  for (const route of GATED_ROUTES) {
    const source = read(route);
    assert.ok(
      source.includes("CAREER_MODULE_READY"),
      `${route}: hiányzik a CAREER_MODULE_READY kapu`,
    );
    assert.ok(
      source.includes("isCareerModuleHidden"),
      `${route}: hiányzik az org-szintű elrejtés-kapu`,
    );
    assert.ok(
      /status:\s*404/.test(source),
      `${route}: a kapu nem 404-gyel zár (a végpont "nem létezik")`,
    );
    assert.match(
      source,
      /!CAREER_MODULE_READY\s*\|\|\s*\(await isCareerModuleHidden\(/,
      `${route}: a kapu-feltétel eltér a /api/career/fit mintájától`,
    );
  }
});

test("kalibrációs visszajelzés: a fitScore-t a szerver számolja, nem a kliens állítja", () => {
  const source = read("src/app/api/industry-fit/feedback/route.ts");
  // A séma nem fogad kliens-oldali pontszámot…
  assert.ok(
    !/fitScore:\s*z\./.test(source),
    "a zod-séma ismét elfogad kliens-oldali fitScore-t",
  );
  // …a rating a szerver-oldali motorból jön (person + engine).
  assert.ok(
    source.includes("buildPersonInput"),
    "a route nem a tárolt profilból számol",
  );
  assert.ok(
    source.includes("computeCareerFit"),
    "a route nem a motorral számolja a pontszámot",
  );
  assert.ok(
    /rating:\s*fit\.demandFit/.test(source),
    "a mentett rating nem a szerver-oldali demandFit",
  );

  // A kliens-oldali küldő sem próbálkozik pontszámmal (mező-szintű ellenőrzés —
  // a prózai komment említheti a fitScore-t, a POST-body nem).
  const client = read("src/components/results/career/CareerResults.tsx");
  assert.ok(
    !/fitScore\s*:/.test(client),
    "a CareerResults ismét kliens-oldali fitScore mezőt küld",
  );
});

test("observer-anonimitás: a person-építő a közös padlóra kapuz", () => {
  // A viselkedést az engine.test.ts fedi (a motor-oldali védőhálón át); ez a
  // kontraktus azt őrzi, hogy az ADAT-OLDALI kapu (person.ts) is a közös
  // konstansra hivatkozik — ne lehessen a padlót csak az egyik rétegben emelni.
  const person = read("src/lib/career/person.ts");
  assert.ok(
    person.includes("MIN_RATERS_FOR_ANONYMOUS_AGGREGATE"),
    "a person.ts nem a közös anonimitás-padlót használja",
  );
  const engine = read("src/lib/career/engine.ts");
  assert.ok(
    engine.includes("MIN_RATERS_FOR_ANONYMOUS_AGGREGATE"),
    "az engine.ts nem a közös anonimitás-padlót használja",
  );
});
