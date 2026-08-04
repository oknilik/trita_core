// src/lib/team-insights.ts
// Értelmezési réteg — elkülönítve a core kalkulációtól (team-pattern.ts)

// ── Dimenzió szintű insight (KPI sor + TRITAN blokk) ──────

export function getDimensionInsight(dimension: string, score: number): string {
  const insights: Record<string, { high: string; mid: string; low: string }> = {
    INTE: {
      high: "Erős fairness és szabálytisztelet",
      mid:  "Kiegyensúlyozott etikai érzékenység",
      low:  "Pragmatikus, célorientált hozzáállás",
    },
    RESO: {
      high: "Érzékeny, empatikus csapatdinamika",
      mid:  "Kiegyensúlyozott érzelmi stabilitás",
      low:  "Reziliens, nyomásálló csapatenergia",
    },
    TEMP: {
      high: "Magas csapatenergia, társas nyitottság",
      mid:  "Kiegyensúlyozott aktivitási szint",
      low:  "Visszafogott, mélymunka-orientált csapat",
    },
    ADAP: {
      high: "Erős együttműködés, alacsony súrlódás",
      mid:  "Vegyes kooperációs hajlandóság",
      low:  "Direkt, konfrontatív kommunikáció",
    },
    THOR: {
      high: "Fegyelmezett, strukturált munkavégzés",
      mid:  "Kiegyensúlyozott szervezettség",
      low:  "Rugalmas, adaptív munkastílus",
    },
    OPEN: {
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

// ── TRITAN profil 1 mondatos összefoglaló ─────────────────

export function generateTeamSummary(scores: Record<string, number>): string {
  const entries = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (entries.length < 2) return "";

  const highest = entries[0];
  const secondHighest = entries[1];
  const lowest = entries[entries.length - 1];

  const dimNamesHigh: Record<string, string> = {
    INTE: "fairness-érzékenységgel",
    RESO: "érzelmi érzékenységgel",
    TEMP: "társas energiával",
    ADAP: "együttműködési készséggel",
    THOR: "strukturáltsággal",
    OPEN: "nyitottsággal",
  };

  const dimNamesLow: Record<string, string> = {
    INTE: "pragmatikus önérvényesítés",
    RESO: "érzelmi stabilitás",
    TEMP: "visszafogott csapatenergia",
    ADAP: "közvetlen kommunikáció",
    THOR: "rugalmas szervezettség",
    OPEN: "pragmatikus fókusz",
  };

  const h = dimNamesHigh[highest[0]] ?? highest[0];
  const h2 = dimNamesHigh[secondHighest[0]] ?? secondHighest[0];
  const l = dimNamesLow[lowest[0]] ?? lowest[0];

  return `A csapatot kiemelkedő ${h} (${highest[1]}%) és ${h2} (${secondHighest[1]}%) jellemzi; a legfőbb fejlesztési irány a ${l} (${lowest[1]}%).`;
}

// ── Kulcs jellemzők actionable insight-ok ─────────────────

export function getStrengthInsight(dimension: string): string {
  const insights: Record<string, string> = {
    INTE: "A csapat ösztönösen méltányos döntéseket hoz — használd ki a belső mediátorok erejét.",
    RESO: "Empatikus csapat — workshopokon és ügyfélhelyzetekben különösen erős.",
    TEMP: "Társas helyzetekben gyorsan aktiválható — workshopokon, prezentációknál kiváló.",
    ADAP: "Erős együttműködés — komplex projekteknél maguktól is jól koordinálnak.",
    THOR: "Fegyelmezett végrehajtás — határidős projekteknél kiváló teljesítmény várható.",
    OPEN: "Nyitott az újra — innovációs sprintek és kísérletezés természetes közeg nekik.",
  };
  return insights[dimension] ?? "";
}

export function getWeaknessInsight(dimension: string): string {
  const insights: Record<string, string> = {
    INTE: "Figyelj a csapaton belüli méltányosságérzetre — érdemes rendszeres visszajelző kört tartani.",
    RESO: "Érzelmileg érzékenyebb dinamika — konfliktushelyzetben óvatosabb kezelés kell.",
    TEMP: "Visszafogottabb csapat — az aktiváláshoz tudatos energizálás kell a megbeszéléseken.",
    ADAP: "Direkt kommunikáció — konfliktusnál gyorsabban eszkalálódhat. Strukturált vitaformátum segít.",
    THOR: "Rugalmas, de kaotikus lehet — enyhe struktúra bevezetése javít a kiszámíthatóságon.",
    OPEN: "Pragmatikus fókusz — az innovációhoz külső impulzus (workshop, vendégelőadó) kell.",
  };
  return insights[dimension] ?? "";
}

export function getDiversityInsight(dimension: string): string {
  const insights: Record<string, string> = {
    INTE: "Eltérő igazságérzet — érdemes tudatosan tisztázni a csapat normáit.",
    RESO: "Vegyes stressztűrés — a vezető adjon személyre szabott támogatást.",
    TEMP: "Eltérő energiaszintek — az introvertáltak és extravertáltak külön figyelmet igényelnek a megbeszélések formátumánál.",
    ADAP: "Eltérő együttműködési stílusok — a páros munkában érdemes tudatosan keverni.",
    THOR: "Eltérő szervezettség — közös minimum-szabályok kellenek a koordinációhoz.",
    OPEN: "Eltérő nyitottság új megközelítésekre — az innováció és a stabilitás igénye egyaránt jelen van.",
  };
  return insights[dimension] ?? "";
}
