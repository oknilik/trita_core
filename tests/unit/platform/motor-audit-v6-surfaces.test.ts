import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { diffStandardError } from "@/lib/psychometrics";
import { HEXACO_DIMENSIONS, HEXACO_ORDER } from "@/lib/hexaco";

// Motor-audit v6 felület-kontraktusok (2026-08-11) — FORRÁS-SZINTŰ tesztek
// (a page/route-handlerek Clerk/Prisma nélkül unit-rétegben nem hívhatók;
// a minta az api-gating teszté).
//
// Három szerződés:
//  1) A jelölt-oldal hasonlóság-címkéi mérési-hiba-tudatosak — a korábbi nyers
//     vágások (<10 „kiváló", <20 „jó") a zajszint ALATT jártak.
//  2) Nyers belső dim-kód (H/E/C/…) nem kerülhet a felületre — a
//     badge a kanonikus HEXACO-betű (HEXACO_DIMENSIONS[..].letter).
//  3) A csapatszerep self-beküldő nem nyelheti el a hibát (res.ok ellenőrzés).

const read = (relative: string) =>
  readFileSync(join(process.cwd(), relative), "utf8");

const HIRING_PAGE = "src/app/(app)/hiring/[orgId]/candidates/[inviteId]/page.tsx";
const BLOG_PAGE = "src/app/(marketing)/blog/[slug]/page.tsx";
const TEAM_ROLES_CLIENT = "src/app/(app)/assessment/team-roles/TeamRolesClient.tsx";

test("jelölt-oldal: a hasonlóság-címke SE-tudatos, nem nyers pont-vágás", () => {
  const source = read(HIRING_PAGE);
  // A gap-hiba a közös pszichometriai magból terjed (√2·SEM).
  assert.ok(
    source.includes("diffStandardError"),
    "a jelölt-oldal nem a közös diffStandardError-ból számol",
  );
  // Eltérést csak ~1,96·SE fölött állítunk.
  assert.ok(
    source.includes("1.96"),
    "hiányzik az állíthatósági (~1,96·SE) küszöb",
  );
  // A régi, zajszint alatti nyers vágások nem térhetnek vissza.
  assert.ok(
    !/avgAbsGap\s*<\s*10\b/.test(source) && !/avgAbsGap\s*<\s*20\b/.test(source),
    "a nyers (<10/<20 pontos) hasonlóság-vágás visszakerült",
  );
  // A zaj-padló alatti hasonlóság a mérési hibán belüli egyezésként jelenik meg.
  assert.ok(
    source.includes("similarityWithinError"),
    "a zaj-padló alatti egyezésnek nincs mérési-hibás címkéje",
  );
});

test("jelölt-oldal: a régi vágások a mérési hibán belül jártak (számszerű)", () => {
  // 2026-08-11 (mért reliabilitás-konstansok): SEM(short) 10,23 → 7,56, tehát
  // SE(gap) = √2·SEM 14,47 → 10,70, a zaj-padló (0,8·SE) 11,6 → 8,5.
  // A régi „<10 = kiváló egyezés" vágás így már nem a zaj-padló ALATT van, de
  // továbbra is a KÜLÖNBSÉG mérési hibáján (1×SE) BELÜL — vagyis olyan
  // pontosságot állított, amit a műszer nem tud. Az állíthatósági küszöb
  // (1,96·SE ≈ 21) pedig változatlanul a régi „<20 = jó" határ FÖLÖTT van.
  // A kapuk a bankból/konstansokból származnak, ezért itt sem literálhoz
  // kötünk: a RELÁCIÓ a védendő állítás.
  const gapSe = diffStandardError("short");
  assert.ok(
    gapSe > 10,
    `a gap-hiba (${gapSe.toFixed(1)}) nem haladja meg a régi 10 pontos vágást`,
  );
  assert.ok(
    1.96 * gapSe > 20,
    `az állíthatósági küszöb (${(1.96 * gapSe).toFixed(1)}) nem haladja meg a régi 20 pontos vágást`,
  );
});

test("jelölt-oldal: hiányzó dimenzió nem renderelődik 0%-ként", () => {
  const source = read(HIRING_PAGE);
  assert.ok(
    !source.includes("candidateScores[d] ?? 0"),
    "a hiányzó dimenzió ismét valós 0-ként jelenik meg",
  );
  assert.ok(
    source.includes("presentDims"),
    "nincs jelen-lévő-dimenzió szűrés a render előtt",
  );
});

test("jelölt-oldal + blog: a dim-badge a HEXACO-betű, nem a nyers belső kód", () => {
  for (const page of [HIRING_PAGE, BLOG_PAGE]) {
    const source = read(page);
    assert.ok(
      /HEXACO_DIMENSIONS\[[^\]]+\]\.letter|HEXACO_DIMENSIONS\[[^\]]+\]\?\.letter/.test(source),
      `${page}: a badge nem a HEXACO_DIMENSIONS[..].letter térképen megy át`,
    );
  }
  // A hiring-oldal badge-je nem a nyers kódot rendereli.
  const hiring = read(HIRING_PAGE);
  assert.ok(
    !/>\s*\{d\}\s*</.test(hiring) && !/>\s*\{g\.dim\}\s*</.test(hiring),
    "a jelölt-oldal ismét nyers dim-kódot renderel",
  );
  // A kanonikus térkép minden belső kódra ad betűt (a kontraktus alapja).
  for (const code of HEXACO_ORDER) {
    assert.match(HEXACO_DIMENSIONS[code].letter, /^[HEXACO]$/);
  }
});

test("blog: a sötét kulcsgondolat-blokk bekezdése kontrasztos színt örököl", () => {
  const source = read(BLOG_PAGE);
  assert.ok(
    source.includes("text-[var(--color-text-on-inverse-muted)]"),
    "a kulcsgondolat törzsszövege nem az inverz felület kontrasztos tokenjét használja",
  );
  assert.ok(
    source.includes("[&_p]:text-inherit"),
    "az MDX bekezdés felülírhatja a kulcsgondolat kontrasztos színét",
  );
});

test("csapatszerep self-beküldő: a hiba nem nyelődik el, van újrapróbálás", () => {
  const source = read(TEAM_ROLES_CLIENT);
  assert.ok(
    /res\.ok|response\.ok/.test(source),
    "a self-beküldő nem ellenőrzi a válasz státuszát",
  );
  assert.ok(
    source.includes("teamRole.retry"),
    "nincs újrapróbálás-út a hibaágon",
  );
  // A peer-kliens mintája: a sikertelen beküldés megőrzött állapotból ismételhető.
  assert.ok(
    source.includes("lastFailed"),
    "a sikertelen kitöltés nem őrződik meg az újrapróbáláshoz",
  );
});
