import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getButtonClassName } from "@/components/ui/primitives/Button";

// SÖTÉT PANELEN ÜLŐ GOMB (2026-08-11 regresszió).
//
// A self-hero „Megosztás" gombja alapállapotban láthatatlan volt a zsálya-
// gradiensen, és CSAK hoverre jelent meg. Ok: `variant="ghost"` + kézi
// `text-[var(--color-text-on-inverse-muted)]` felülírás — csakhogy a `cn()`
// SIMA ÖSSZEFŰZŐ, nem tailwind-merge. Az ütköző utility-k MINDKETTEN
// kimennek, és a generált CSS sorrendje dönt, nem a `className` sorrendje;
// itt a variant világos `text-action-secondary-fg`-je nyert. Hoverre azért
// vált láthatóvá, mert a ghost saját `hover:bg-state-hover-bg`-je (világos
// krém) alatt a sötét felirat olvashatóvá vált.
//
// A `onInverse` 2026-08-09 óta létezett, de CSAK a tiltott állapotot és a
// fókuszgyűrűt kezelte — az alapállapot világos maradt. Ez a rés zárult be.

const read = (relative: string) =>
  readFileSync(join(process.cwd(), relative), "utf8");

/** A világos készlet szövegszíne — sötét panelen ez a bukás jele. */
const LIGHT_SURFACE_FG = "text-action-secondary-fg";

test("az inverz ghost/secondary nem viszi a világos felület szövegszínét", () => {
  for (const variant of ["ghost", "secondary"] as const) {
    const light = getButtonClassName({ variant });
    const inverse = getButtonClassName({ variant, onInverse: true });

    assert.ok(
      light.includes(LIGHT_SURFACE_FG),
      `${variant}: a világos készlet váratlanul nem használja a ${LIGHT_SURFACE_FG}-t`,
    );
    assert.equal(
      inverse.includes(LIGHT_SURFACE_FG),
      false,
      `${variant}: a sötét panelen is a világos ${LIGHT_SURFACE_FG} megy ki — a gomb eltűnik`,
    );
    assert.ok(
      inverse.includes("--color-text-on-inverse"),
      `${variant}: az inverz készletnek nincs sötét-panel szövegszíne`,
    );
  }
});

test("az inverz készlet nem támaszkodik világos hover-háttérre", () => {
  // A `hover:bg-state-hover-bg` világos krém: sötét panelen ez okozta a
  // „csak hoverre látszik" tünetet.
  for (const variant of ["ghost", "secondary"] as const) {
    const inverse = getButtonClassName({ variant, onInverse: true });
    assert.equal(
      inverse.includes("hover:bg-state-hover-bg"),
      false,
      `${variant}: világos hover-háttér a sötét panelen`,
    );
    assert.equal(
      inverse.includes("hover:text-state-hover-fg"),
      false,
      `${variant}: világos hover-szövegszín a sötét panelen`,
    );
  }
});

test("az inverz primary világos töltést kap sötét felirattal", () => {
  const inverse = getButtonClassName({ variant: "primary", onInverse: true });
  // A világos primary töltése az `action-primary-bg` (sötét zsálya) — pont
  // az a szín, ami a sötét herón beleolvadna.
  assert.equal(
    inverse.includes("bg-action-primary-bg"),
    false,
    "a sötét herón a sötét zsálya töltés menne ki",
  );
  assert.ok(inverse.includes("bg-[var(--color-text-on-inverse)]"));
  assert.ok(inverse.includes("text-[var(--color-surface-inverse)]"));
});

test("a világos és az inverz készlet KIZÁRJA egymást (nincs ütközés)", () => {
  // A javítás lényege: a sötét panel a világos HELYETT kapja a saját
  // készletét, nem MELLÉ — így nincs mit feloldani a kaszkádban.
  for (const variant of ["primary", "secondary", "ghost"] as const) {
    const inverse = getButtonClassName({ variant, onInverse: true });
    const lightOnly = getButtonClassName({ variant })
      .split(" ")
      .filter((c) => c.includes("action-") || c.includes("state-hover"));
    for (const cls of lightOnly) {
      assert.equal(
        inverse.split(" ").includes(cls),
        false,
        `${variant}: a világos ${cls} a sötét készletben is benne van`,
      );
    }
  }
});

// ── Forrás-szintű szerződés ────────────────────────────────────────────────
//
// A SurfaceHero `actions=` slotja MINDKÉT színsémán sötét gradiensen ül —
// minden odakerülő Button-nak `onInverse`-nek kell lennie.
const SURFACE_HERO_CALLERS = [
  "src/components/results/ProfileHero.tsx",
  "src/app/(app)/hiring/[orgId]/_components/HiringDashboard.tsx",
  "src/app/(app)/team/[id]/_tabs/TeamHeroBlock.tsx",
  "src/app/(app)/org/[id]/page.tsx",
  "src/app/(app)/manager/page.tsx",
  "src/app/(app)/hiring/[orgId]/candidates/[inviteId]/page.tsx",
  "src/components/career/fakedoor/CareerFakeDoor.tsx",
];

/** Az `actions={ … }` prop kiegyensúlyozott kapcsos-zárójeles szelete. */
function actionsBlocks(source: string): string[] {
  const blocks: string[] = [];
  const marker = "actions={";
  let from = 0;
  for (;;) {
    const start = source.indexOf(marker, from);
    if (start === -1) break;
    let depth = 0;
    let i = start + marker.length - 1;
    for (; i < source.length; i += 1) {
      if (source[i] === "{") depth += 1;
      else if (source[i] === "}") {
        depth -= 1;
        if (depth === 0) break;
      }
    }
    blocks.push(source.slice(start, i + 1));
    from = i + 1;
  }
  return blocks;
}

/**
 * `<Button …>` nyitótagok. A záró `>`-t MÉLYSÉG-TUDATOSAN keressük: egy
 * `onClick={() => …}` prop nyílfüggvénye is `>`-t tartalmaz, a naiv
 * nem-mohó illesztés ott elvágná a tagot (és a mögötte álló `onInverse`
 * néma hamis-riasztást adna).
 */
function buttonOpenTags(block: string): string[] {
  const tags: string[] = [];
  const re = /<Button\b/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(block)) !== null) {
    let depth = 0;
    let i = match.index;
    for (; i < block.length; i += 1) {
      const ch = block[i];
      if (ch === "{") depth += 1;
      else if (ch === "}") depth -= 1;
      else if (ch === ">" && depth === 0) break;
    }
    tags.push(block.slice(match.index, i + 1));
  }
  return tags;
}

test("a hero actions-slotjában minden Button onInverse", () => {
  let checked = 0;
  for (const file of SURFACE_HERO_CALLERS) {
    for (const block of actionsBlocks(read(file))) {
      for (const tag of buttonOpenTags(block)) {
        checked += 1;
        assert.ok(
          /\bonInverse\b/.test(tag),
          `${file}: hero-actions Button onInverse nélkül — sötét panelen világos készletet kapna\n${tag}`,
        );
      }
    }
  }
  // Ha a slice-oló elromlik (0 találat), a teszt némán zöld lenne.
  assert.ok(checked >= 2, `váratlanul kevés hero-gomb ellenőrizve (${checked})`);
});
