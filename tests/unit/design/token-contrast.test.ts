import test from "node:test";
import assert from "node:assert/strict";
import { contrast, hasTheme, resolveToken, type ThemeName } from "./css-tokens";

// Token-szintű kontraszt-háló.
//
// Miért ez, és miért nem képi baseline: a sötét mód két felület-készletet
// hoz létre UGYANAZON a kódon (dark-mode-feasibility-2026-08.md). Képi
// snapshotokkal ez nem tartható — token-párokkal viszont igen, és a paletta
// TERVEZÉSE közben szól, nem utólag.
//
// A háló mindkét témára ugyanazt a párlistát futtatja. Amíg a sötét készlet
// nem létezik a globals.css-ben, a sötét futás kihagyja magát.
//
// RACSNI: a ma AA alatt lévő párok nem hibák, hanem NYILVÁNTARTOTT ADÓSSÁG
// (KNOWN_DEBT). Rájuk a mért érték a padló — javulhatnak, romlani nem
// tudnak. Új pár viszont csak a küszöb felett kerülhet be.

/** WCAG AA — normál méretű folyószöveg. */
const AA_TEXT = 4.5;
/** WCAG AA — grafikus elem, nagy szöveg, jelentéshordozó keret. */
const AA_GRAPHIC = 3;

type PairKind = "text" | "graphic";

interface Pair {
  group: string;
  fg: string;
  bg: string;
  kind: PairKind;
}

const pairs: Pair[] = [];
const add = (group: string, kind: PairKind, fg: string, bg: string) =>
  pairs.push({ group, fg, bg, kind });

const SURFACES = ["surface-canvas", "surface-card", "surface-muted", "cream-300"];

// Neutrális szöveg-fokozatok minden felületen — ez a felület 90%-a.
for (const fg of ["text-primary", "text-secondary", "text-muted", "text-faint"]) {
  for (const bg of SURFACES) add("neutrális szöveg", "text", fg, bg);
}

// Dimenzió-hármasok: a `strong` szövegként ül a `soft` tinten, a `base`
// grafikus mark a kártyán.
for (const d of ["h", "e", "x", "a", "c", "o"]) {
  add("dimenzió", "text", `dim-${d}-strong`, `dim-${d}-soft`);
  add("dimenzió", "graphic", `dim-${d}-base`, "surface-card");
}

// Értékelő rampa és csapatszerep-chipek: fg a saját bg-jén.
for (const level of ["high", "mid", "low"]) {
  add("értékelő rampa", "text", `eval-${level}-fg`, `eval-${level}-bg`);
}
for (const family of ["thinking", "action", "people"]) {
  add("csapatszerep chip", "text", `role-${family}-fg`, `role-${family}-bg`);
}

for (const s of ["info", "success", "warning", "error"]) {
  add("státusz", "text", `state-${s}-fg`, `state-${s}-bg`);
}

add("gomb", "text", "action-primary-fg", "action-primary-bg");
add("gomb", "text", "action-secondary-fg", "action-secondary-bg");
add("gomb", "text", "action-destructive-fg", "action-destructive-bg");

// Akcentek a kártyán. A bronz és a zsálya grafikus akcent (sáv, ikon,
// keret) — szövegként a -strong / -deep fokozat megy.
add("akcent", "graphic", "accent-primary", "surface-card");
add("akcent", "graphic", "accent-self", "surface-card");
add("akcent", "text", "accent-primary-strong", "surface-card");
add("akcent", "text", "accent-self-deep", "surface-card");
add("akcent", "text", "accent-candidate", "surface-card");
add("akcent", "text", "accent-candidate", "accent-candidate-soft");

// Réteg-tintek mint panel-háttér, elsődleges szöveggel.
for (const layer of ["self", "team", "org", "candidate"]) {
  add("réteg-tint", "text", "text-primary", `layer-${layer}-soft`);
}

// Paper marketing-téma (founding / patterns). A hatókör globális, ezért ez
// is átfordul — a háló ugyanúgy őrzi.
add("paper", "text", "paper-text", "paper-bg");
add("paper", "text", "paper-text", "paper-card");
add("paper", "text", "paper-muted", "paper-bg");
add("paper", "text", "paper-muted", "paper-card");
add("paper", "text", "paper-heading", "paper-bg");
add("paper", "text", "paper-text", "paper-elevated");
add("paper", "text", "paper-muted", "paper-elevated");

// Akcent-háttéren ülő felirat. A bronz és a zsálya MINDKÉT sémán világos,
// ezért ott sötét tinta kell — a fehér AA alatt volt (UX-audit 2026-08-07).
add("akcent-háttér", "text", "text-on-accent", "bronze");
add("akcent-háttér", "text", "text-on-accent", "accent-primary");
add("akcent-háttér", "text", "text-on-inverse", "surface-inverse");

const key = (p: Pair) => `${p.fg}|${p.bg}`;

/**
 * Nyilvántartott adósság — a 2026-08-07-i mérés a világos témán. Ezek a
 * párok a sötét mód ELŐTT is AA alatt voltak; a háló bevezetése hozta őket
 * felszínre. A szám a PADLÓ: alá menni hiba, fölé menni szabad (és cél).
 *
 * A 6. körben (UX-audit) három tétel KIKERÜLT: a --palette-muted 2%-os
 * sötétítése (#6e6e80 → #6a6a7b) a text-muted két meleg felületét és az
 * eval-low-fg-t is a küszöb fölé vitte. Maradt a `text-faint` négyese: az
 * a leghalkabb szöveg-fokozat, AA-ra emelése a tipográfiai hierarchiát
 * lapítaná össze a `muted`-del — ez design-döntés, nem hozzáférhetőségi
 * kényszer. Az `dim-x-base` grafikus mark szintén nyitva.
 *
 * Rendezés: ami a legmesszebb van a küszöbtől, az a legsürgősebb.
 */
const KNOWN_DEBT: Record<ThemeName, Record<string, { floor: number; note: string }>> = {
  light: {
    "dim-x-base|surface-card": {
      floor: 2.96,
      note: "X (Extraverzió) okker mark fehéren — az egyetlen 3:1 alatti grafikus elem",
    },
    "text-faint|cream-300": { floor: 3.78, note: "leghalkabb metaadat meleg felületen" },
    "text-faint|surface-muted": { floor: 3.8, note: "leghalkabb metaadat meleg felületen" },
    "text-faint|surface-canvas": { floor: 4.01, note: "leghalkabb metaadat a vásznon" },
    "text-faint|surface-card": { floor: 4.4, note: "épphogy AA alatt" },
  },
  dark: {},
};

function threshold(kind: PairKind): number {
  return kind === "text" ? AA_TEXT : AA_GRAPHIC;
}

function checkTheme(theme: ThemeName) {
  const failures: string[] = [];
  const improved: string[] = [];
  const debt = KNOWN_DEBT[theme];

  for (const pair of pairs) {
    const fg = resolveToken(pair.fg, theme);
    const bg = resolveToken(pair.bg, theme);
    assert.ok(fg, `[${theme}] --color-${pair.fg} nem oldható fel hexre`);
    assert.ok(bg, `[${theme}] --color-${pair.bg} nem oldható fel hexre`);

    const ratio = contrast(fg, bg);
    const known = debt[key(pair)];
    const limit = known ? known.floor : threshold(pair.kind);

    if (ratio + 0.005 < limit) {
      failures.push(
        `  ${pair.group}: ${pair.fg} / ${pair.bg} — ${ratio.toFixed(2)}:1 ` +
          `(elvárt ${limit.toFixed(2)}:1${known ? ", nyilvántartott adósság" : ""})`,
      );
    } else if (known && ratio >= threshold(pair.kind)) {
      improved.push(`  ${pair.fg} / ${pair.bg} — ${ratio.toFixed(2)}:1`);
    }
  }

  if (improved.length > 0) {
    console.log(
      `[${theme}] ${improved.length} adósság a küszöb fölé került — ` +
        `vedd ki a KNOWN_DEBT listából:\n${improved.join("\n")}`,
    );
  }

  assert.equal(
    failures.length,
    0,
    `[${theme}] kontraszt-bukás:\n${failures.join("\n")}\n\n` +
      "Új párnál a küszöb kötelező. Meglévő adósság nem romolhat.",
  );
}

/**
 * Felület-elválás: egy panel/chip nem olvadhat bele a szülő felületébe.
 * A szöveg/háttér párok ezt NEM fogják meg — sötéten előfordult, hogy egy
 * chip felirata olvasható volt, de a chip maga láthatatlan.
 *
 * A küszöb a világos téma saját padlójából jön (1.053): nem szigorúbb annál,
 * amit a meglévő design már teljesít.
 */
const SURFACE_MIN = 1.05;
const SURFACE_PAIRS: Array<[string, string]> = [
  ["surface-card", "surface-canvas"],
  ["surface-muted", "surface-card"],
  ["cream-300", "surface-card"],
  ["surface-chip-neutral", "surface-card"],
  ["eval-high-bg", "surface-card"],
  ["eval-mid-bg", "surface-card"],
  ["eval-low-bg", "surface-card"],
  ["state-success-bg", "surface-card"],
  ["state-warning-bg", "surface-card"],
  ["state-error-bg", "surface-card"],
  ["state-info-bg", "surface-card"],
  ["paper-card", "paper-bg"],
  ["paper-elevated", "paper-bg"],
  ...(["h", "e", "x", "a", "c", "o"].map((d) => [`dim-${d}-soft`, "surface-card"]) as Array<
    [string, string]
  >),
];

/**
 * Nyilvántartott felület-adósság — a világos témán MÁR a sötét mód előtt is
 * fennállt. Ugyanaz a racsni, mint a szöveg-kontrasztnál: a szám a padló.
 */
const SURFACE_DEBT: Record<ThemeName, Record<string, number>> = {
  light: { "state-warning-bg|surface-card": 1.037 },
  dark: {},
};

function checkSurfaces(theme: ThemeName) {
  const failures: string[] = [];
  for (const [panel, parent] of SURFACE_PAIRS) {
    const a = resolveToken(panel, theme);
    const b = resolveToken(parent, theme);
    assert.ok(a && b, `[${theme}] ${panel} / ${parent} nem oldható fel`);
    const ratio = contrast(a, b);
    const floor = SURFACE_DEBT[theme][`${panel}|${parent}`] ?? SURFACE_MIN;
    if (ratio + 0.001 < floor) {
      failures.push(
        `  ${panel} / ${parent} — ${ratio.toFixed(3)} (elvárt ${floor}) — beleolvad`,
      );
    }
  }
  assert.equal(failures.length, 0, `[${theme}] felület-elválás:\n${failures.join("\n")}`);
}

test("világos téma — a panelek elválnak a szülő felülettől", () => {
  checkSurfaces("light");
});

test("sötét téma — a panelek elválnak a szülő felülettől", (t) => {
  if (!hasTheme("dark")) {
    t.skip("nincs sötét készlet a globals.css-ben");
    return;
  }
  checkSurfaces("dark");
});

test("világos téma — minden token-pár tartja a küszöböt vagy a padlóját", () => {
  checkTheme("light");
});

test("sötét téma — minden token-pár tartja a küszöböt vagy a padlóját", (t) => {
  if (!hasTheme("dark")) {
    t.skip("nincs sötét készlet a globals.css-ben");
    return;
  }
  checkTheme("dark");
});

test("a nyilvántartott adósság nem nő észrevétlenül", () => {
  // A lista hossza szándékos korlát: új adósságot csak tudatosan, a szám
  // emelésével lehet felvenni — különben a háló magát üresíti ki.
  assert.ok(
    Object.keys(KNOWN_DEBT.light).length <= 5,
    "több nyilvántartott adósság van, mint amennyit a háló bevezetésekor rögzítettünk",
  );
  for (const [pair, entry] of Object.entries(KNOWN_DEBT.light)) {
    assert.ok(entry.note.length > 0, `${pair}: indoklás nélkül nem vehető nyilvántartásba`);
  }
});
