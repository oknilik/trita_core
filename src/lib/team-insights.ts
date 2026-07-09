// src/lib/team-insights.ts
// Értelmezési réteg — elkülönítve a core kalkulációtól (team-pattern.ts)

// ── Dimenzió szintű insight (KPI sor + HEXACO blokk) ──────

export function getDimensionInsight(dimension: string, score: number): string {
  const insights: Record<string, { high: string; mid: string; low: string }> = {
    H: {
      high: "Erős fairness és szabálytisztelet",
      mid:  "Kiegyensúlyozott etikai érzékenység",
      low:  "Pragmatikus, célorientált hozzáállás",
    },
    E: {
      high: "Érzékeny, empatikus csapatdinamika",
      mid:  "Kiegyensúlyozott érzelmi stabilitás",
      low:  "Reziliens, nyomásálló csapatenergia",
    },
    X: {
      high: "Magas csapatenergia, társas nyitottság",
      mid:  "Kiegyensúlyozott aktivitási szint",
      low:  "Visszafogott, mélymunka-orientált csapat",
    },
    A: {
      high: "Erős együttműködés, alacsony súrlódás",
      mid:  "Vegyes kooperációs hajlandóság",
      low:  "Direkt, konfrontatív kommunikáció",
    },
    C: {
      high: "Fegyelmezett, strukturált munkavégzés",
      mid:  "Kiegyensúlyozott szervezettség",
      low:  "Rugalmas, adaptív munkastílus",
    },
    O: {
      high: "Nyitott, kísérletező szemlélet",
      mid:  "Kiegyensúlyozott innováció és stabilitás",
      low:  "Pragmatikus, bevált módszerekre építő",
    },
  };

  const dim = insights[dimension];
  if (!dim) return "";
  if (score >= 60) return dim.high;
  if (score >= 40) return dim.mid;
  return dim.low;
}

// ── HEXACO profil 1 mondatos összefoglaló ─────────────────

export function generateTeamSummary(scores: Record<string, number>): string {
  const entries = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (entries.length < 2) return "";

  const highest = entries[0];
  const secondHighest = entries[1];
  const lowest = entries[entries.length - 1];

  const dimNamesHigh: Record<string, string> = {
    H: "fairness-érzékenységgel",
    E: "érzelmi érzékenységgel",
    X: "társas energiával",
    A: "együttműködési készséggel",
    C: "strukturáltsággal",
    O: "nyitottsággal",
  };

  const dimNamesLow: Record<string, string> = {
    H: "pragmatikus önérvényesítés",
    E: "érzelmi stabilitás",
    X: "visszafogott csapatenergia",
    A: "közvetlen kommunikáció",
    C: "rugalmas szervezettség",
    O: "pragmatikus fókusz",
  };

  const h = dimNamesHigh[highest[0]] ?? highest[0];
  const h2 = dimNamesHigh[secondHighest[0]] ?? secondHighest[0];
  const l = dimNamesLow[lowest[0]] ?? lowest[0];

  return `Ez a csapat kiemelkedő ${h} (${highest[1]}%) és ${h2} (${secondHighest[1]}%) jellemezhető, ahol a ${l} (${lowest[1]}%) a legfőbb fejlesztési irány.`;
}

// ── Kulcs jellemzők actionable insight-ok ─────────────────

export function getStrengthInsight(dimension: string): string {
  const insights: Record<string, string> = {
    H: "A csapat természetesen igazságos döntéseket hoz — használd ki a belső mediátorok erejét.",
    E: "Empatikus csapat — workshopokon és ügyfélhelyzetekben különösen erős.",
    X: "Társas helyzetekben gyorsan aktiválható — workshopokon, pitcheknél kiváló.",
    A: "Erős együttműködés — komplex projekteknél természetesen jól koordinálnak.",
    C: "Fegyelmezett végrehajtás — határidős projekteknél kiváló teljesítmény várható.",
    O: "Nyitott az újra — innovációs sprintek és kísérletezés természetes közeg nekik.",
  };
  return insights[dimension] ?? "";
}

export function getWeaknessInsight(dimension: string): string {
  const insights: Record<string, string> = {
    H: "Figyelj a csapaton belüli méltányosság-érzetre — érdemes rendszeres check-in.",
    E: "Érzelmileg érzékenyebb dinamika — konfliktushelyzetben óvatosabb kezelés kell.",
    X: "Visszafogottabb csapat — az aktiváláshoz tudatos energizálás kell a meetingeken.",
    A: "Direkt kommunikáció — konfliktusnál gyorsabban eszkalálódhat. Strukturált vita-formátum segít.",
    C: "Rugalmas, de kaotikus lehet — enyhe struktúra bevezetése javít a kiszámíthatóságon.",
    O: "Pragmatikus fókusz — az innovációhoz külső impulzus (workshop, vendégelőadó) kell.",
  };
  return insights[dimension] ?? "";
}

export function getDiversityInsight(dimension: string): string {
  const insights: Record<string, string> = {
    H: "Eltérő fairness-érzet — érdemes tudatosan tisztázni a csapat normáit.",
    E: "Vegyes stressztűrés — a vezető személyre szabott támogatást adjon.",
    X: "Eltérő energiaszintek — az intrók és extrók külön figyelmet igényelnek a meetingformátumoknál.",
    A: "Eltérő együttműködési stílusok — a páros munkában érdemes tudatosan keverni.",
    C: "Eltérő szervezettség — közös minimum-szabályok kellenek a koordinációhoz.",
    O: "Eltérő nyitottság új megközelítésekre — az innováció és a stabilitás igénye egyaránt jelen van.",
  };
  return insights[dimension] ?? "";
}
