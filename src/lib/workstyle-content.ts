import type { TestType } from "@prisma/client";
import { runProfileEngine } from "@/lib/profile-engine";
import {
  RESOLUTION_NARRATIVES, BLOCK3_SUMMARIES,
  SOLO_DIM_NARRATIVES,
  ROLE_TEXTS, SOLO_DIM_ROLE_TEXTS,
  getEnvRows,
} from "@/lib/profile-content";
import type { Locale } from "@/lib/i18n";

// Munkastílus-tartalom (Ahogy működsz / Ideális környezet / Szerep-illeszkedés)
// közös generátora — a saját eredmény-oldal és a megosztott (/share/[token])
// nézet ugyanebből dolgozik, hogy a két felület soha ne csússzon szét.

export interface WorkstyleContent {
  howYouWork: string[];
  envItems: { label: string; value: string }[];
  roleFit: {
    strong: string;
    might: string;
    prep: string;
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
    for (const sd of engine.topSoloDims) {
      const key = `${sd.dim}_${sd.level}`;
      const text = SOLO_DIM_NARRATIVES[key]?.[lang];
      if (text) takeaways.push(text);
    }
  }

  return {
    howYouWork,
    envItems,
    roleFit: {
      strong: roleTexts?.strong ?? "",
      might: roleTexts?.medium ?? "",
      prep: roleTexts?.watchOut ?? "",
      strongRoles: roleTags?.strong,
      mightRoles: roleTags?.might,
      prepRoles: roleTags?.prep,
    },
    takeaways,
  };
}
