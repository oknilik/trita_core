import type { TestType } from "@prisma/client";
import { runProfileEngine } from "@/lib/profile-engine";
import {
  RESOLUTION_NARRATIVES, BLOCK3_SUMMARIES, RISK_TEXTS, DEFAULT_NARRATIVE,
  SOLO_DIM_NARRATIVES, SOLO_DIM_SUMMARIES, SOLO_DIM_PRESSURE,
  PRESSURE_BLINDSPOT_PREFIX, type PressureText,
  SOLO_DIM_ROLE_MODIFIERS, DIMENSION_GROWTH_TIPS, type GrowthPlan,
  COLLAB_CLICK, COLLAB_FRICTION, COLLAB_NEEDS,
  COLLAB_BALANCED_CLICK, COLLAB_BALANCED_FRICTION,
  ROLE_TEXTS, SOLO_DIM_ROLE_TEXTS,
  DIM_LABELS, CATEGORY_LABELS,
  getEnvRows,
} from "@/lib/profile-content";
import { getDimensionTier } from "@/lib/dimension-utils";
import { rankDimensionScores } from "@/lib/tritan";
import { deficitSlotEligible } from "@/lib/score-valence";
import type { Locale } from "@/lib/i18n";

// A fordított dimenzió kódja a kanonikus valencia-kapuból (score-valence.ts)
// — a korábbi helyi literál kivezetve; az örökség-importok kedvéért innen is
// re-exportáljuk.
export { REVERSE_DIM_CODE } from "@/lib/score-valence";

// Munkastílus-tartalom (Ahogy működsz / Ideális környezet / Szerep-illeszkedés)
// közös generátora — a saját eredmény-oldal és a megosztott (/share/[token])
// nézet ugyanebből dolgozik, hogy a két felület soha ne csússzon szét.

/**
 * „Ahogy működsz" — NEVESÍTETT slotok a pozicionális tömb helyett
 * (motor-audit v4, FIX 3): a felület korábban a howYouWork[1]-et vakon
 * „Figyelendő"-ként címkézte, pedig az 1-es index csak akkor kockázat, ha
 * tényleg van risk-pár — különben egy pozitív narratíva került a borostyán
 * kártyába, a valódi kockázat meg a kontextusba csúszott.
 */
export interface HowYouWorkParts {
  /** Fő mintázat — az első narratíva (tension-pár / solo-dim / balanced). */
  main: string;
  /** Figyelendő — CSAK valódi risk-párból (summary + mitigáció); nélküle null. */
  watch: string | null;
  /** Kontextus — a további narratívák és risk-szövegek. */
  context: string[];
}

export interface WorkstyleContent {
  howYouWork: string[];
  /** Ugyanez nevesített slotokkal — a megjelenítők EBBŐL rendereljenek. */
  howYouWorkParts: HowYouWorkParts;
  /** Kockázati tension-párok strukturáltan (összefoglaló + mitigációs tanács
   *  + forrás-dimenziók) — a PDF/megjelenítés célzott használatához; a
   *  howYouWork-ben ugyanez folyó szövegként is megjelenik. */
  riskParts: { summary: string; mitigation: string; source: string }[];
  /** Vakfolt + nyomás alatti működés hipotézisek a top-2 solo dimenzióból (P2.1). */
  pressure: string[];
  /** Ugyanez strukturáltan (stress/blindspot külön + forrás-dimenzió, P5.2). */
  pressureParts: (PressureText & { source: string })[];
  /** Konkrét viselkedéses fejlődési javaslat a legalacsonyabb dimenzióhoz (P2.4). */
  growthTip?: string;
  /** Háromlépcsős fejlődési ív (P5.5): viselkedés → reflexió → mérhető kihívás. */
  growthPlan?: GrowthPlan & { source: string };
  /** „Csapatban működve" fejezet (P4.2): partnerek / súrlódások / feltételek.
   *  source: melyik dimenzió-pólusból következik az állítás (P5.2 „miért"-chip). */
  collaboration: {
    click: { text: string; source?: string }[];
    friction: { text: string; source?: string }[];
    needs: { text: string; source?: string }[];
  };
  /** hedged: a 65/35-ös pólus-ítélet a vizuális tierrel (70/40) nem egyező
   *  sávba esik — a megjelenítő szint-szava ilyenkor „Inkább …" (F3-hedge). */
  envItems: { label: string; value: string; hedged?: boolean }[];
  roleFit: {
    strong: string;
    might: string;
    prep: string;
    /** A második legerősebb dimenzió árnyaló mondata (P2.2) — solo-dim ágon. */
    secondary?: string;
    strongRoles?: string[];
    mightRoles?: string[];
    prepRoles?: string[];
  };
  takeaways: string[];
}

// Role tags — concrete position names per content key.
// Minden TENSION_PAIRS contentKey-hez kell bejegyzés (guardrail-teszt őrzi).
export const ROLE_TAGS: Record<string, Record<string, { strong: string[]; might: string[]; prep: string[] }>> = {
  hu: {
    resilientLeader: { strong: ["Vezető", "Értékesítési vezető", "Kríziskoordinátor", "Változásmenedzsment"], might: ["Projektvezetés", "Ügyfélkapcsolat"], prep: ["Hosszú egyéni fókusz", "Izolált munkakörök"] },
    supportedVisibility: { strong: ["Ügyfélkapcsolat", "Tréning", "HR"], might: ["Prezentáció", "Facilitáció"], prep: ["Izolált munka", "Magas nyomás"] },
    structuredStability: { strong: ["Minőségbiztosítás", "Adminisztráció", "Compliance"], might: ["Projektmenedzsment", "Tanácsadás"], prep: ["Startup", "Változékony környezet"] },
    safeExperimentation: { strong: ["Design Thinking", "Prototípus-készítés", "Innováció"], might: ["Tanácsadás", "Stratégia"], prep: ["Határidő-kritikus végrehajtás"] },
    deepCollaboration: { strong: ["Kiscsapatos kutatás", "Mentorálás", "Páros munka"], might: ["Tanácsadás", "Szakértő"], prep: ["Vállalati networking"] },
    solitaryInnovator: { strong: ["Kutató", "Elemző", "Architect"], might: ["Tanácsadás", "Design"], prep: ["Csapatmunka", "Gyakori meetingek"] },
    facilitatedInnovation: { strong: ["Workshop-facilitálás", "Design Thinking", "Változásmenedzsment"], might: ["Projektmenedzsment", "Oktatás"], prep: ["Top-down döntéshozatal"] },
    responsibleInnovator: { strong: ["Fenntarthatóság", "K+F", "Társadalmi innováció"], might: ["Stratégia", "Termékfejlesztés"], prep: ["Gyors kompromisszum"] },
    ethicalLeader: { strong: ["Értékvezérelt vezetés", "Compliance", "Közszféra", "Nonprofit"], might: ["Tanácsadás", "HR"], prep: ["Erős politikai játszmák"] },
    principledConfronter: { strong: ["Audit", "Minőségbiztosítás", "Jog", "Szabályozás"], might: ["Vezetés", "Tárgyalás"], prep: ["Diplomáciai közvetítés"] },
    structuredCompetitor: { strong: ["Értékesítés", "Üzletfejlesztés", "Teljesítménymenedzsment"], might: ["Projektvezetés", "Műveletek"], prep: ["Konszenzusos kultúra"] },
    structuredInnovator: { strong: ["Termékfejlesztés", "K+F vezetés", "Rendszertervezés"], might: ["Stratégia", "Tanácsadás"], prep: ["Improvizatív közeg"] },
    calmExecution: { strong: ["Üzemeltetés", "Programvezetés", "Minőségbiztosítás"], might: ["Projektmenedzsment", "Compliance"], prep: ["Gyors pivotok"] },
    exploratoryAnalyst: { strong: ["Kutató", "Stratégiai elemző", "Innováció"], might: ["Tanácsadás", "Design"], prep: ["Rutin végrehajtás"] },
    organizedLeader: { strong: ["Projektvezetés", "Csapatvezetés", "Operatív irányítás"], might: ["Programvezetés", "Oktatás"], prep: ["Strukturálatlan közeg"] },
    harmoniousConnector: { strong: ["Csapatépítés", "Facilitáció", "Ügyfélkapcsolat", "Coaching"], might: ["HR", "Partnerség"], prep: ["Konfliktusintenzív szerepek"] },
    performanceDriver: { strong: ["Értékesítés", "Üzletfejlesztés", "Growth"], might: ["Vezetés", "Stratégia"], prep: ["Lassú, konszenzusos döntéshozatal"] },
    disruptiveInnovator: { strong: ["Innovációs vezető", "Vállalkozó", "Stratégiai tanácsadó"], might: ["Termékfejlesztés", "Design"], prep: ["Erősen szabályozott közeg"] },
  },
  en: {
    resilientLeader: { strong: ["Leader", "Sales Lead", "Crisis Coordinator", "Change Management"], might: ["Project Management", "Client Relations"], prep: ["Long solo focus", "Isolated roles"] },
    supportedVisibility: { strong: ["Client Relations", "Training", "HR"], might: ["Presenting", "Facilitation"], prep: ["Isolated work", "High pressure"] },
    structuredStability: { strong: ["Quality Assurance", "Admin", "Compliance"], might: ["Project Management", "Consulting"], prep: ["Startup", "Volatile environment"] },
    safeExperimentation: { strong: ["Design Thinking", "Prototyping", "Innovation"], might: ["Consulting", "Strategy"], prep: ["Deadline-critical execution"] },
    deepCollaboration: { strong: ["Small-team Research", "Mentoring", "Pair work"], might: ["Consulting", "Expert"], prep: ["Corporate networking"] },
    solitaryInnovator: { strong: ["Researcher", "Analyst", "Architect"], might: ["Consulting", "Design"], prep: ["Teamwork", "Frequent meetings"] },
    facilitatedInnovation: { strong: ["Workshop Facilitation", "Design Thinking", "Change Management"], might: ["Project Management", "Education"], prep: ["Top-down decision-making"] },
    responsibleInnovator: { strong: ["Sustainability", "R&D", "Social Innovation"], might: ["Strategy", "Product Development"], prep: ["Quick compromise"] },
    ethicalLeader: { strong: ["Values-driven Leadership", "Compliance", "Public Service", "Nonprofit"], might: ["Consulting", "HR"], prep: ["Heavy office politics"] },
    principledConfronter: { strong: ["Audit", "Quality Assurance", "Legal", "Regulatory"], might: ["Leadership", "Negotiation"], prep: ["Diplomatic mediation"] },
    structuredCompetitor: { strong: ["Sales", "Business Development", "Performance Management"], might: ["Project Management", "Operations"], prep: ["Consensus-driven culture"] },
    structuredInnovator: { strong: ["Product Development", "R&D Leadership", "Systems Design"], might: ["Strategy", "Consulting"], prep: ["Improvised settings"] },
    calmExecution: { strong: ["Operations", "Program Management", "Quality Assurance"], might: ["Project Management", "Compliance"], prep: ["Rapid pivots"] },
    exploratoryAnalyst: { strong: ["Researcher", "Strategic Analyst", "Innovation"], might: ["Consulting", "Design"], prep: ["Routine execution"] },
    organizedLeader: { strong: ["Project Leadership", "Team Leadership", "Operations Management"], might: ["Program Management", "Education"], prep: ["Unstructured settings"] },
    harmoniousConnector: { strong: ["Team Building", "Facilitation", "Client Relations", "Coaching"], might: ["HR", "Partnerships"], prep: ["Conflict-heavy roles"] },
    performanceDriver: { strong: ["Sales", "Business Development", "Growth"], might: ["Leadership", "Strategy"], prep: ["Slow, consensus-based decisions"] },
    disruptiveInnovator: { strong: ["Innovation Lead", "Entrepreneur", "Strategy Consultant"], might: ["Product Development", "Design"], prep: ["Heavily regulated settings"] },
  },
};

// Solo dim role tags fallback — kulcsok: TRITAN dim-kód + _high/_low
// (guardrail-teszt őrzi a lefedettséget).
export const SOLO_ROLE_TAGS: Record<string, Record<string, { strong: string[]; might: string[]; prep: string[] }>> = {
  hu: {
    INTE_high: { strong: ["Compliance", "Etika", "Nonprofit", "Közszféra"], might: ["Vezetés", "Szakértő"], prep: ["Versengő üzlet"] },
    INTE_low: { strong: ["Üzletfejlesztés", "Értékesítés", "Growth", "Vállalkozás"], might: ["Vezetés", "Stratégia"], prep: ["Csapatépítés"] },
    RESO_high: { strong: ["HR", "Coaching", "Egészségügy", "Ügyfélélmény"], might: ["Oktatás", "Tárgyalás"], prep: ["Magas nyomás", "Krízis"] },
    RESO_low: { strong: ["Krízismenedzsment", "Döntéshozatal", "Vezetés"], might: ["Változásvezetés", "Startup"], prep: ["Empatikus közeg"] },
    TEMP_high: { strong: ["Értékesítés", "Csapatvezetés", "PR", "Facilitáció"], might: ["Projektvezetés", "Oktatás"], prep: ["Egyéni mélyülés"] },
    TEMP_low: { strong: ["Kutatás", "Elemzés", "Tervezés", "Írás"], might: ["Tanácsadás", "Szakértő"], prep: ["Networking", "Prezentáció"] },
    ADAP_high: { strong: ["Csapatépítés", "Facilitáció", "Coaching"], might: ["Értékesítés", "Partnerség"], prep: ["Konfliktusos közeg"] },
    ADAP_low: { strong: ["Tárgyalás", "Stratégia", "Döntéshozatal"], might: ["Kutatás", "Elemzés"], prep: ["Harmonikus csapat"] },
    THOR_high: { strong: ["Projektvezetés", "Minőségbiztosítás", "Műveletek"], might: ["Compliance", "Szakértő"], prep: ["Improvizáció"] },
    THOR_low: { strong: ["Innováció", "Startup", "Design"], might: ["Tanácsadás", "Stratégia"], prep: ["Strukturált végrehajtás"] },
    OPEN_high: { strong: ["Kutatás", "Innováció", "Stratégia", "Design"], might: ["Tanácsadás", "Oktatás"], prep: ["Rutin feladatok"] },
    OPEN_low: { strong: ["Végrehajtás", "Adminisztráció", "Műveletek"], might: ["Vezetés", "Projektmenedzsment"], prep: ["Kísérletezés"] },
  },
  en: {
    INTE_high: { strong: ["Compliance", "Ethics", "Nonprofit", "Public Service"], might: ["Leadership", "Expert"], prep: ["Competitive business"] },
    INTE_low: { strong: ["Business Development", "Sales", "Growth", "Entrepreneurship"], might: ["Leadership", "Strategy"], prep: ["Team building"] },
    RESO_high: { strong: ["HR", "Coaching", "Healthcare", "CX"], might: ["Education", "Negotiation"], prep: ["High pressure", "Crisis"] },
    RESO_low: { strong: ["Crisis Management", "Decision-making", "Leadership"], might: ["Change Leadership", "Startup"], prep: ["Empathetic context"] },
    TEMP_high: { strong: ["Sales", "Team Leadership", "PR", "Facilitation"], might: ["Project Management", "Education"], prep: ["Deep solo work"] },
    TEMP_low: { strong: ["Research", "Analysis", "Design", "Writing"], might: ["Consulting", "Expert"], prep: ["Networking", "Presentations"] },
    ADAP_high: { strong: ["Team Building", "Facilitation", "Coaching"], might: ["Sales", "Partnership"], prep: ["Conflict-heavy"] },
    ADAP_low: { strong: ["Negotiation", "Strategy", "Decision-making"], might: ["Research", "Analysis"], prep: ["Harmonious team"] },
    THOR_high: { strong: ["Project Management", "QA", "Operations"], might: ["Compliance", "Expert"], prep: ["Improvisation"] },
    THOR_low: { strong: ["Innovation", "Startup", "Design"], might: ["Consulting", "Strategy"], prep: ["Structured execution"] },
    OPEN_high: { strong: ["Research", "Innovation", "Strategy", "Design"], might: ["Consulting", "Education"], prep: ["Routine tasks"] },
    OPEN_low: { strong: ["Execution", "Administration", "Operations"], might: ["Leadership", "PM"], prep: ["Experimentation"] },
  },
};

// Kiegyensúlyozott (csupa közepes) profil — nincs pár és nincs extrém dim:
// generikus, de értelmes szerep-illeszkedési szöveg üres szekció helyett.
const DEFAULT_ROLE_FIT: Record<Locale, { strong: string; medium: string; watchOut: string }> = {
  hu: {
    strong: "Kiegyensúlyozott profiloddal sokféle szerepben megállod a helyed: generalista, koordináló és hídszerepek, ahol az alkalmazkodóképesség és a stabilitás az érték.",
    medium: "Specializált, egyetlen erős vonásra épülő szerepek is működhetnek — ott a motivációd és a tapasztalatod dönt, nem a személyiségprofilod.",
    watchOut: "Szélsőséges közegek (extrém nyomás, teljes izoláció vagy folyamatos rivaldafény) kevésbé építenek a kiegyensúlyozottságodra — ezekhez tudatos felkészülés kell.",
  },
  en: {
    strong: "With a balanced profile you can thrive in many roles: generalist, coordinating, and bridge positions where flexibility and stability are the value.",
    medium: "Specialized roles built on a single strong trait can also work — there your motivation and experience decide, not your personality profile.",
    watchOut: "Extreme settings (intense pressure, full isolation, or constant spotlight) draw less on your balance — they require deliberate preparation.",
  },
};

// F3 (motor-audit): a pólus-küszöb (profile-engine 65/35) és a vizuális tier
// (dimension-utils 70/40) a 65–70 ill. 35–40 sávban eltér — egy 67-es
// pontszám a stripen „mérsékelt", a pólus-chipen „magas" lenne. A chip ezért
// a köztes sávban HEDGEL („inkább magas"), így nem mond ellent a stripnek,
// a pólus-küszöböket (narratíva-logika) pedig nem bolygatjuk.
const LEANING_LABELS: Record<"high" | "low", Record<Locale, string>> = {
  high: { hu: "inkább magas", en: "leaning high" },
  low: { hu: "inkább alacsony", en: "leaning low" },
};

export function buildWorkstyleContent(
  dimScores: Record<string, number>,
  testType: TestType,
  lang: Locale,
): WorkstyleContent {
  const engine = runProfileEngine(dimScores, testType);

  // Forrás-jelölés (P5.2): melyik dimenzió-pólusból következik az állítás —
  // a „miért" kimondása összeköti a hipotézist az adattal. A szint-szó a
  // vizuális tierrel egyeztetve (F3, ld. LEANING_LABELS).
  const sourceLabel = (dim: string, level: "high" | "medium" | "low") => {
    const score = dimScores[dim];
    const tier = typeof score === "number" ? getDimensionTier(score) : null;
    let levelLabel = CATEGORY_LABELS[level][lang];
    if (tier) {
      if (level === "high" && tier !== "high") levelLabel = LEANING_LABELS.high[lang];
      else if (level === "low" && tier !== "low") levelLabel = LEANING_LABELS.low[lang];
      else if (level === "medium" && tier === "low") levelLabel = LEANING_LABELS.low[lang];
      else if (level === "medium" && tier === "high") levelLabel = LEANING_LABELS.high[lang];
    }
    return `${DIM_LABELS[dim]?.[lang] ?? dim} · ${levelLabel}`;
  };

  // "Ahogy működsz" narratives — a narratívák és a risk-szövegek KÜLÖN
  // gyűjtve, hogy a nevesített slotok (howYouWorkParts) ne pozícióból
  // találgassák, melyik bekezdés kockázat.
  const narratives: string[] = [];
  // Add tension pair narratives (block 6)
  for (const pair of engine.block6Pairs) {
    const narrative = RESOLUTION_NARRATIVES[pair.contentKey]?.[lang];
    if (narrative) narratives.push(narrative);
  }
  // Add solo dim narratives if no tension pairs
  if (narratives.length === 0) {
    for (const sd of engine.topSoloDims) {
      const key = `${sd.dim}_${sd.level}`;
      const text = SOLO_DIM_NARRATIVES[key]?.[lang];
      if (text) narratives.push(text);
    }
  }
  // Kockázati párok (block 7): az összefoglaló után a mitigációs tanács is
  // bekerül külön bekezdésként, és strukturáltan is (riskParts).
  const riskParts: WorkstyleContent["riskParts"] = [];
  const riskTexts: string[] = [];
  // Fél-pár (csak summary VAGY csak mitigáció van a deckben) — a watch-
  // kártyára nem való, de a kontextusból sem veszhet el.
  const orphanRiskTexts: string[] = [];
  for (const pair of engine.block7Pairs) {
    const summary = BLOCK3_SUMMARIES[pair.contentKey]?.[lang];
    const mitigation = RISK_TEXTS[pair.contentKey]?.[lang];
    if (summary) riskTexts.push(summary);
    if (mitigation) riskTexts.push(mitigation);
    if (summary && mitigation) {
      riskParts.push({
        summary,
        mitigation,
        source: `${sourceLabel(pair.dimA, engine.categories[pair.dimA])} × ${sourceLabel(pair.dimB, engine.categories[pair.dimB])}`,
      });
    } else {
      if (summary) orphanRiskTexts.push(summary);
      if (mitigation) orphanRiskTexts.push(mitigation);
    }
  }
  // Kiegyensúlyozott profil: se pár, se pólusos solo-dim — a lapos profil is
  // kapjon értelmes nyitó bekezdést.
  if (narratives.length === 0 && riskTexts.length === 0) {
    narratives.push(DEFAULT_NARRATIVE[lang]);
  }

  // Örökség-fogyasztóknak a pozicionális tömb változatlan sorrendben…
  const howYouWork: string[] = [...narratives, ...riskTexts];
  // …a megjelenítés viszont a nevesített slotokból megy (FIX 3): main = első
  // narratíva; watch = CSAK valódi risk-pár (summary + mitigáció együtt);
  // context = minden további bekezdés.
  const firstRisk = riskParts[0] ?? null;
  const firstRiskText = firstRisk
    ? `${firstRisk.summary} ${firstRisk.mitigation}`
    : null;
  // Defenzív fallback: ha (hiányos deck miatt) egyetlen narratíva sincs, a
  // main a risk-szövegre esik vissza — üres main mellett a szekció el sem
  // készülne, és a kockázat veszne el.
  const mainText = narratives[0] ?? orphanRiskTexts[0] ?? firstRiskText ?? "";
  const howYouWorkParts: HowYouWorkParts = {
    main: mainText,
    watch: firstRiskText && firstRiskText !== mainText ? firstRiskText : null,
    context: [
      ...narratives.slice(1),
      ...riskParts.slice(1).map((part) => `${part.summary} ${part.mitigation}`),
      ...orphanRiskTexts.filter((text) => text !== mainText),
    ],
  };

  // Vakfolt + nyomás alatti működés — a legmarkánsabb (top-2) dimenzióból,
  // pároktól függetlenül, hipotézis-keretezéssel (P2.1). A részletes kártya
  // összefűzött szöveget kap, az executive summary a strukturált részeket.
  const pressure: string[] = [];
  const pressureParts: (PressureText & { source: string })[] = [];
  for (const sd of engine.topSoloDims) {
    const key = `${sd.dim}_${sd.level}`;
    const part = SOLO_DIM_PRESSURE[key]?.[lang];
    if (part) {
      pressureParts.push({ ...part, source: sourceLabel(sd.dim, sd.level) });
      pressure.push(`${part.stress} ${PRESSURE_BLINDSPOT_PREFIX[lang]} ${part.blindspot}`);
    }
  }

  // Fejlődési javaslat (P2.4, P5.5) — a legalacsonyabb dimenzióhoz, csak ha
  // ténylegesen alacsony sávban van (kiegyensúlyozott profilnál nincs tipp).
  // growthTip: rövid forma (summary-oldal); growthPlan: háromlépcsős ív.
  // A fordított RESO KIMARAD a legalacsonyabb-választásból (motor-audit v6,
  // M4a): az alacsony Emocionalitás stabilitás (erőforrás), nem deficit — a
  // „Fejlődési fókusz · Emocionalitás · alacsony" forrás-chip egy stabil
  // kitöltőnél hamis keretezés volt. A választás a legalacsonyabb NEM-RESO
  // dimenzióra esik (ugyanaz a pólus-szabály, mint a selectGrowthFocusItems).
  const { growthTip, growthPlan } = (() => {
    const entries = Object.entries(dimScores).filter(
      ([code]) => code !== "I" && deficitSlotEligible(code),
    );
    if (entries.length === 0) return { growthTip: undefined, growthPlan: undefined };
    const [lowestDim, lowestScore] = entries.reduce((min, cur) => (cur[1] < min[1] ? cur : min));
    if (lowestScore >= 40) return { growthTip: undefined, growthPlan: undefined };
    const plan = DIMENSION_GROWTH_TIPS[lowestDim]?.[lang];
    if (!plan) return { growthTip: undefined, growthPlan: undefined };
    return {
      growthTip: plan.behavior,
      growthPlan: { ...plan, source: sourceLabel(lowestDim, "low") },
    };
  })();

  // „Csapatban működve" fejezet (P4.2) — dimenzió-szintű kompozíció:
  //  - click: a top-2 markáns dimenzió;
  //  - friction: pólusos dimenziók a súrlódás-jóslók súly-sorrendjében
  //    (THOR > ADAP > INTE > RESO > TEMP > OPEN — a team-stats
  //    FRICTION_WEIGHTS sorrendje, hogy a riport és a csapat-felület
  //    ugyanazt a modellt mondja), legfeljebb kettő;
  //  - needs: a legmarkánsabb dimenzió + a legalacsonyabb (ha low sávos).
  const collaboration = (() => {
    type CollabItem = { text: string; source?: string };
    const click: CollabItem[] = [];
    for (const sd of engine.topSoloDims.slice(0, 2)) {
      const text = COLLAB_CLICK[`${sd.dim}_${sd.level}`]?.[lang];
      if (text) click.push({ text, source: sourceLabel(sd.dim, sd.level) });
    }
    if (click.length === 0) click.push({ text: COLLAB_BALANCED_CLICK[lang] });

    const FRICTION_DIM_ORDER = ["THOR", "ADAP", "INTE", "RESO", "TEMP", "OPEN"] as const;
    const friction: CollabItem[] = [];
    for (const dim of FRICTION_DIM_ORDER) {
      const level = engine.categories[dim];
      if (level !== "high" && level !== "low") continue;
      const text = COLLAB_FRICTION[`${dim}_${level}`]?.[lang];
      if (text) friction.push({ text, source: sourceLabel(dim, level) });
      if (friction.length === 2) break;
    }
    if (friction.length === 0) friction.push({ text: COLLAB_BALANCED_FRICTION[lang] });

    const needs: CollabItem[] = [];
    const needKeys: { key: string; dim: string; level: "high" | "low" }[] = [];
    const topSolo = engine.topSoloDims[0];
    if (topSolo) needKeys.push({ key: `${topSolo.dim}_${topSolo.level}`, dim: topSolo.dim, level: topSolo.level as "high" | "low" });
    const lowEntries = Object.entries(engine.categories).filter(([, lvl]) => lvl === "low");
    for (const [dim] of lowEntries) {
      const key = `${dim}_low`;
      if (!needKeys.some((k) => k.key === key)) { needKeys.push({ key, dim, level: "low" }); break; }
    }
    for (const nk of needKeys.slice(0, 2)) {
      const text = COLLAB_NEEDS[nk.key]?.[lang];
      if (text) needs.push({ text, source: sourceLabel(nk.dim, nk.level) });
    }

    return { click, friction, needs };
  })();

  // Role fit texts
  const roleFitSource = engine.block6Pairs[0]?.contentKey
    ?? (engine.topSoloDims[0] ? `${engine.topSoloDims[0].dim}_${engine.topSoloDims[0].level}` : null);
  const roleTexts =
    (roleFitSource
      ? (ROLE_TEXTS[roleFitSource]?.[lang] ?? SOLO_DIM_ROLE_TEXTS[roleFitSource]?.[lang])
      : null) ?? DEFAULT_ROLE_FIT[lang];
  const roleTags = roleFitSource
    ? (ROLE_TAGS[lang]?.[roleFitSource] ?? SOLO_ROLE_TAGS[lang]?.[roleFitSource])
    : null;

  // P2.2 — a második legerősebb dimenzió árnyalása solo-dim ágon:
  // (1) módosító mondat, (2) a másodlagos dimenzió top szereptagjaiból
  // legfeljebb kettő a „Működhet" sávba (dedup). Pár-alapú ágon nem fut,
  // ott a narratíva eleve két dimenzióból épül.
  let roleFitSecondary: string | undefined;
  let mergedMightRoles = roleTags?.might;
  const isSoloRoleFit = !engine.block6Pairs[0]?.contentKey && Boolean(engine.topSoloDims[0]);
  const secondarySolo = engine.topSoloDims[1];
  if (isSoloRoleFit && secondarySolo) {
    const secondaryKey = `${secondarySolo.dim}_${secondarySolo.level}`;
    roleFitSecondary = SOLO_DIM_ROLE_MODIFIERS[secondaryKey]?.[lang];
    const secondaryTags = SOLO_ROLE_TAGS[lang]?.[secondaryKey]?.strong ?? [];
    if (secondaryTags.length > 0) {
      const existing = new Set([...(roleTags?.strong ?? []), ...(roleTags?.might ?? [])]);
      const additions = secondaryTags.filter((tag) => !existing.has(tag)).slice(0, 2);
      if (additions.length > 0) {
        mergedMightRoles = [...(roleTags?.might ?? []), ...additions];
      }
    }
  }

  // Environment rows — a dimScores a hedge-sávok (F3) feloldásához megy át:
  // pólus-ítélet a 65/70 ill. 30/35 közti sávból → „Inkább …" szint-szó.
  const envItems = getEnvRows(engine.categories, dimScores).map((r) => ({
    label: r.label[lang],
    value: r.value[lang],
    hedged: r.hedged ?? false,
  }));

  // Takeaways (block 6 summaries)
  const takeaways: string[] = [];
  for (const pair of engine.block6Pairs) {
    const text = BLOCK3_SUMMARIES[pair.contentKey]?.[lang];
    if (text) takeaways.push(text);
  }
  if (takeaways.length === 0) {
    // Solo-dim ágon a rövid SOLO_DIM_SUMMARIES megy ide, NEM a narratívák —
    // különben a „Kulcs-tanulságok" szó szerint megismételné az
    // „Ahogy működsz" blokkot (javítási terv 2026-07, P1.3).
    for (const sd of engine.topSoloDims) {
      const key = `${sd.dim}_${sd.level}`;
      const text = SOLO_DIM_SUMMARIES[key]?.[lang];
      if (text) takeaways.push(text);
    }
  }

  return {
    howYouWork,
    howYouWorkParts,
    riskParts,
    pressure,
    pressureParts,
    growthTip,
    growthPlan,
    collaboration,
    envItems,
    roleFit: {
      strong: roleTexts?.strong ?? "",
      might: roleTexts?.medium ?? "",
      prep: roleTexts?.watchOut ?? "",
      secondary: roleFitSecondary,
      strongRoles: roleTags?.strong,
      mightRoles: mergedMightRoles,
      prepRoles: roleTags?.prep,
    },
    takeaways,
  };
}

// ─────────────────────────────────────────────────────────────────────
// Fejlődési fókusz — kiválasztási szabály (results-oldal „Fejlődési fókusz"
// szekciója). Motor-audit v4:
//  - FIX 2 (RESO fordított skála): a deficit-logika („a legalacsonyabb
//    pontszám = fejlesztendő") a fordított Emocionalitásra hamis — az
//    alacsony RESO stabilitás (erőforrás), nem hiány. Egy stabil kitöltőnél
//    a Félelem/Szorongás 20 pont nem „első számú fejlődési terület", ezért a
//    RESO-facetek és a RESO-dimenzió KIMARADNAK a deficit-választásból.
//  - FIX 4 (0 mint „nincs mérve"): örökség-eredményben nincs facet-bontás —
//    a hiányzó facet nem 0 pont. A hívó csak VALÓDI facet-pontszámokat adjon
//    át (üres facets tömb = nincs adat), ilyenkor a dimenzió-szintű fallback
//    fut, koholt 0-facet nem kerülhet a fókuszba.
// ─────────────────────────────────────────────────────────────────────

export interface GrowthFocusItem {
  code: string;
  label: string;
  score: number;
  dimCode: string;
  dimLabel: string;
  dimColor: string;
}

interface GrowthFocusDimensionInput {
  code: string;
  label: string;
  color: string;
  score: number;
  /** Csak MÉRT facet-pontszámok — örökség-sorra üres tömb. */
  facets: { code: string; label: string; score: number }[];
}

export function selectGrowthFocusItems(
  mainDimensions: GrowthFocusDimensionInput[],
): GrowthFocusItem[] {
  const allFacets: GrowthFocusItem[] = [];
  for (const dim of mainDimensions) {
    if (!deficitSlotEligible(dim.code)) continue; // fordított skála — nem deficit
    for (const f of dim.facets) {
      allFacets.push({
        code: f.code,
        label: f.label,
        score: f.score,
        dimCode: dim.code,
        dimLabel: dim.label,
        dimColor: dim.color,
      });
    }
  }
  // Dimenziónként legfeljebb 2 facet kerülhet a fókuszba: a GrowthFocus
  // záró javaslata (GROWTH_HINT) dimenzió-kulcsos, így 3 azonos-dimenziós
  // facet háromszor szó szerint ugyanazt a mondatot ismételné. A plafon a
  // listát változatosabbá teszi anélkül, hogy a rangsort felborítaná.
  const MAX_FACETS_PER_DIM = 2;
  const perDimCount = new Map<string, number>();
  const facetItems: GrowthFocusItem[] = [];
  for (const f of allFacets.filter((x) => x.score < 60).sort((a, b) => a.score - b.score)) {
    const used = perDimCount.get(f.dimCode) ?? 0;
    if (used >= MAX_FACETS_PER_DIM) continue;
    perDimCount.set(f.dimCode, used + 1);
    facetItems.push(f);
    if (facetItems.length === 3) break;
  }
  if (facetItems.length >= 1) return facetItems;

  // Dimenzió-szintű fallback (nincs facet-adat vagy minden facet ≥60) —
  // ugyanaz a pólus-szabály: az alacsony RESO itt sem „fejlesztendő".
  return mainDimensions
    .filter((d) => deficitSlotEligible(d.code) && d.score < 60)
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map((d) => ({
      code: d.code,
      label: d.label,
      score: d.score,
      dimCode: d.code,
      dimLabel: d.label,
      dimColor: d.color,
    }));
}

// ─────────────────────────────────────────────────────────────────────
// Hero-mondat dimenzió-választása (results-oldal „heroInsight"). Motor-audit
// v6, M4c: a „leggyengébb" slot korábban nyers `.sort`-tal a fordított RESO-t
// is kiválaszthatta — egy stabil (alacsony Emocionalitású) kitöltő hero-
// mondata a stabilitását nevezte meg gyengeségként. Szabályok:
//  - rangsor a kanonikus rankDimensionScores-szal (determinista tie-break);
//  - a leggyengébb slot a legalacsonyabb NEM-RESO dimenzió;
//  - lapos profilnál (max−min < HERO_RANGE_GATE_FACTOR·SEM) nincs
//    „leggyengébb" — csak az erősség megy ki (weakest: null).
// ─────────────────────────────────────────────────────────────────────

/**
 * A lapos-profil kapu szorzója (motor-audit v9 döntés, 2026-08-11).
 * Ez a kapu NEM két előre kijelölt pontszám különbségét vizsgálja (arra a
 * kanonikus √2·SEM ≈ 1,41·SEM szabály él, ld. DIFF_MIN_GAP), hanem a hat
 * dimenzió TERJEDELMÉT (max−min): a „legerősebb/leggyengébb" állításhoz a
 * szélsőértékeket utólag, a zajt is beleértve választjuk ki. Hat független
 * pontszám várható terjedelme tiszta zaj mellett ≈ 2,5·SEM, ezért a
 * páronkénti √2-nél szigorúbb, 2·SEM-es kapu a szándékos minimum — a
 * korábbi komment tévesen nevezte ezt „a két pontszám hibájának".
 * Viselkedés-változás nincs; a értéket unit-teszt rögzíti.
 */
export const HERO_RANGE_GATE_FACTOR = 2;

export function selectHeroInsightDims<T extends { code: string; score: number }>(
  mainDimensions: ReadonlyArray<T>,
  dimSem: number,
): { strongest: T; weakest: T | null; flat: boolean } | null {
  if (mainDimensions.length === 0) return null;
  const ranked = rankDimensionScores(mainDimensions);
  const strongest = ranked[0];
  const weakCandidates = ranked.filter((d) => deficitSlotEligible(d.code));
  const weakest = weakCandidates[weakCandidates.length - 1];
  if (!weakest || weakest.code === strongest.code) {
    return { strongest, weakest: null, flat: false };
  }
  // Lapos profilnál a „leggyengébb" kijelölése műtermék lenne — a terjedelem-
  // kapu indoklása a HERO_RANGE_GATE_FACTOR kommentjében (range-statisztika,
  // nem páronkénti különbség). ÉS: ugyanez a kapu az ERŐSSÉG-állítást is
  // érvényteleníti — egy 2·SEM-en belüli mezőnyből a „legerősebb" kiemelése
  // ugyanúgy zaj-műtermék, miközben a strip csupa-közepest, a PDF pedig
  // „Kiegyensúlyozott profil"-t mond. A flat jelzésre a hívó a
  // kiegyensúlyozott-profil hero-mondatot rendereli erősség-ige helyett.
  if (strongest.score - weakest.score < HERO_RANGE_GATE_FACTOR * dimSem) {
    return { strongest, weakest: null, flat: true };
  }
  return { strongest, weakest, flat: false };
}
