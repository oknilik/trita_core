import type { TestType } from "@prisma/client";
import { runProfileEngine } from "@/lib/profile-engine";
import {
  RESOLUTION_NARRATIVES, BLOCK3_SUMMARIES,
  SOLO_DIM_NARRATIVES, SOLO_DIM_SUMMARIES, SOLO_DIM_PRESSURE,
  PRESSURE_BLINDSPOT_PREFIX, type PressureText,
  SOLO_DIM_ROLE_MODIFIERS, DIMENSION_GROWTH_TIPS,
  COLLAB_CLICK, COLLAB_FRICTION, COLLAB_NEEDS,
  COLLAB_BALANCED_CLICK, COLLAB_BALANCED_FRICTION,
  ROLE_TEXTS, SOLO_DIM_ROLE_TEXTS,
  getEnvRows,
} from "@/lib/profile-content";
import type { Locale } from "@/lib/i18n";

// Munkastílus-tartalom (Ahogy működsz / Ideális környezet / Szerep-illeszkedés)
// közös generátora — a saját eredmény-oldal és a megosztott (/share/[token])
// nézet ugyanebből dolgozik, hogy a két felület soha ne csússzon szét.

export interface WorkstyleContent {
  howYouWork: string[];
  /** Vakfolt + nyomás alatti működés hipotézisek a top-2 solo dimenzióból (P2.1). */
  pressure: string[];
  /** Ugyanez strukturáltan (stress/blindspot külön) — az executive summary oldalhoz (P3.1). */
  pressureParts: PressureText[];
  /** Konkrét viselkedéses fejlődési javaslat a legalacsonyabb dimenzióhoz (P2.4). */
  growthTip?: string;
  /** „Csapatban működve" fejezet (P4.2): partnerek / súrlódások / feltételek. */
  collaboration: { click: string[]; friction: string[]; needs: string[] };
  envItems: { label: string; value: string }[];
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
    strong: "With a balanced profile you can thrive in many roles: generalist, coordinating, and bridge positions where adaptability and stability are the value.",
    medium: "Specialized roles built on a single strong trait can also work — there your motivation and experience decide, not your personality profile.",
    watchOut: "Extreme settings (intense pressure, full isolation, or constant spotlight) draw less on your balance — they require deliberate preparation.",
  },
};

export function buildWorkstyleContent(
  dimScores: Record<string, number>,
  testType: TestType,
  lang: Locale,
): WorkstyleContent {
  const engine = runProfileEngine(dimScores, testType);

  // "Ahogy működsz" narratives
  const howYouWork: string[] = [];
  // Add tension pair narratives (block 6)
  for (const pair of engine.block6Pairs) {
    const narrative = RESOLUTION_NARRATIVES[pair.contentKey]?.[lang];
    if (narrative) howYouWork.push(narrative);
  }
  // Add solo dim narratives if no tension pairs
  if (howYouWork.length === 0) {
    for (const sd of engine.topSoloDims) {
      const key = `${sd.dim}_${sd.level}`;
      const text = SOLO_DIM_NARRATIVES[key]?.[lang];
      if (text) howYouWork.push(text);
    }
  }
  // Add risk texts (block 7)
  for (const pair of engine.block7Pairs) {
    const summary = BLOCK3_SUMMARIES[pair.contentKey]?.[lang];
    if (summary) howYouWork.push(summary);
  }

  // Vakfolt + nyomás alatti működés — a legmarkánsabb (top-2) dimenzióból,
  // pároktól függetlenül, hipotézis-keretezéssel (P2.1). A részletes kártya
  // összefűzött szöveget kap, az executive summary a strukturált részeket.
  const pressure: string[] = [];
  const pressureParts: PressureText[] = [];
  for (const sd of engine.topSoloDims) {
    const key = `${sd.dim}_${sd.level}`;
    const part = SOLO_DIM_PRESSURE[key]?.[lang];
    if (part) {
      pressureParts.push(part);
      pressure.push(`${part.stress} ${PRESSURE_BLINDSPOT_PREFIX[lang]} ${part.blindspot}`);
    }
  }

  // Fejlődési javaslat (P2.4) — a legalacsonyabb dimenzióhoz, csak ha
  // ténylegesen alacsony sávban van (kiegyensúlyozott profilnál nincs tipp).
  const growthTip = (() => {
    const entries = Object.entries(dimScores).filter(([code]) => code !== "I");
    if (entries.length === 0) return undefined;
    const [lowestDim, lowestScore] = entries.reduce((min, cur) => (cur[1] < min[1] ? cur : min));
    if (lowestScore >= 40) return undefined;
    return DIMENSION_GROWTH_TIPS[lowestDim]?.[lang];
  })();

  // „Csapatban működve" fejezet (P4.2) — dimenzió-szintű kompozíció:
  //  - click: a top-2 markáns dimenzió;
  //  - friction: pólusos dimenziók a legerősebb súrlódás-jóslók közül
  //    (THOR > ADAP > INTE — a team-stats FRICTION_WEIGHTS sorrendje, hogy
  //    a riport és a csapat-felület ugyanazt a modellt mondja);
  //  - needs: a legmarkánsabb dimenzió + a legalacsonyabb (ha low sávos).
  const collaboration = (() => {
    const click: string[] = [];
    for (const sd of engine.topSoloDims.slice(0, 2)) {
      const text = COLLAB_CLICK[`${sd.dim}_${sd.level}`]?.[lang];
      if (text) click.push(text);
    }
    if (click.length === 0) click.push(COLLAB_BALANCED_CLICK[lang]);

    const FRICTION_DIM_ORDER = ["THOR", "ADAP", "INTE"] as const;
    const friction: string[] = [];
    for (const dim of FRICTION_DIM_ORDER) {
      const level = engine.categories[dim];
      if (level !== "high" && level !== "low") continue;
      const text = COLLAB_FRICTION[`${dim}_${level}`]?.[lang];
      if (text) friction.push(text);
      if (friction.length === 2) break;
    }
    if (friction.length === 0) friction.push(COLLAB_BALANCED_FRICTION[lang]);

    const needs: string[] = [];
    const needKeys: string[] = [];
    const topSolo = engine.topSoloDims[0];
    if (topSolo) needKeys.push(`${topSolo.dim}_${topSolo.level}`);
    const lowEntries = Object.entries(engine.categories).filter(([, lvl]) => lvl === "low");
    for (const [dim] of lowEntries) {
      const key = `${dim}_low`;
      if (!needKeys.includes(key)) { needKeys.push(key); break; }
    }
    for (const key of needKeys.slice(0, 2)) {
      const text = COLLAB_NEEDS[key]?.[lang];
      if (text) needs.push(text);
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

  // Environment rows
  const envItems = getEnvRows(engine.categories).map((r) => ({
    label: r.label[lang],
    value: r.value[lang],
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
    pressure,
    pressureParts,
    growthTip,
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
