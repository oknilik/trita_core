import type { TeamPatternResult, AxisGrade } from "@/lib/team-pattern";
import { AXES, AXIS_LABELS, type Localized, type OperatingAxis } from "./questions";
import { POLICY, type OperatingResult } from "./scoring";

export const COMPOSITION_AXES = ["drive", "cohesion", "discipline", "openness"] as const;
export type CompositionAxis = typeof COMPOSITION_AXES[number];
export interface CompositionSnapshot {
  code: string; name: string; memberCount: number;
  stability: TeamPatternResult["stability"];
  axes: Record<CompositionAxis, { mean: number; sd: number; grade: AxisGrade }>;
}
export interface ComparisonPrompt {
  operatingAxis: OperatingAxis; compositionAxis: CompositionAxis;
  support: Localized; tension: Localized;
}
export interface TeamStyleSnapshot {
  version: 1;
  operating: (OperatingResult & { referenceStart: string; referenceEnd: string }) | null;
  composition: CompositionSnapshot | null;
  sameRespondents: boolean | null;
  comparison: { operatingCode: string | null; compositionCode: string; prompts: ComparisonPrompt[] } | null;
}

/** Whitelist of aggregates: no names, IDs, item answers or styleDistances. */
export function snapshotComposition(result: TeamPatternResult | null): CompositionSnapshot | null {
  if (!result) return null;
  return { code: result.patternCode, name: result.patternName, memberCount: result.membersWithAssessment,
    stability: result.stability,
    axes: Object.fromEntries(COMPOSITION_AXES.map((key) => [key, {
      mean: result.axes[key].value, sd: result.axes[key].diversity, grade: result.axes[key].grade,
    }])) as CompositionSnapshot["axes"],
  };
}

// These are discussion pairings, not conversions between constructs or validated fit rules.
const PAIRINGS: Record<OperatingAxis, CompositionAxis> = {
  information: "discipline", coordination: "cohesion", decision: "drive", execution: "openness",
};
const PROMPTS: Record<OperatingAxis, Record<"left" | "right", { support: Localized; tension: Localized }>> = {
  information: {
    left: {
      support: { hu: "Segít a közös nyilvántartás abban, hogy mindenki megtalálja, amire szüksége van? Mondjatok egy példát, amikor jól működött.", en: "How do shared records help members with different needs for structure?" },
      tension: { hu: "Van olyan adat vagy leírás, amelyet rendszeresen frissítetek, de senki sem használ? Mit lehetne egyszerűbben rögzíteni?", en: "When does documentation require more administration than the guidance it provides?" },
    },
    right: {
      support: { hu: "Mely helyzetekben segít a közvetlen beszélgetés gyorsabban megérteni a feladatot?", en: "When do direct conversations help people understand a task faster?" },
      tension: { hu: "Kinek hiányzik visszakereshető leírás, és hogyan marad képben az, aki kimaradt a beszélgetésből?", en: "Who needs a retrievable record, and how does someone absent from a conversation stay informed?" },
    },
  },
  coordination: {
    left: {
      support: { hu: "Ha előre tisztázzátok, ki miért felel, könnyebb egymásnak segíteni? Mikor tapasztaltátok ezt?", en: "How do explicit responsibilities help members with different collaboration preferences?" },
      tension: { hu: "Előfordul, hogy valaki azért nem segít, mert egy feladatot más felelősségének tart? Ilyenkor hogyan tudnátok átadni vagy megosztani a munkát?", en: "Are there situations where fixed task boundaries make it harder to help one another?" },
    },
    right: {
      support: { hu: "Mely közös szokásaitok segítenek abban, hogy külön egyeztetés nélkül is tudjátok, kinek mi a következő feladata?", en: "Which shared routines allow you to work together with little explicit coordination?" },
      tension: { hu: "Honnan tudja az új vagy visszafogottabb tag, mikor és miben számítanak rá?", en: "How does a new or quieter member know when and where they are needed?" },
    },
  },
  decision: {
    left: {
      support: { hu: "Mikor könnyíti meg a közös munkát, hogy tudjátok, ki hozza meg a végső döntést? A csendesebb és a kezdeményezőbb tagoknak is segít ez?", en: "When does a clear decision point help members with different levels of social energy?" },
      tension: { hu: "Hogyan jutnak el a kezdeményező és a csendesebb tagok javaslatai a végső döntéshozóhoz?", en: "How do suggestions from both proactive and quieter members reach the final decision-maker?" },
    },
    right: {
      support: { hu: "Hogyan segít a megosztott döntési jog abban, hogy a tagok a saját területükön kezdeményezzenek?", en: "How does distributed authority help members take initiative in their own areas?" },
      tension: { hu: "A döntési jogot ténylegesen minden érintett használja, vagy főleg azok, akik hangosabban képviselik a véleményüket?", en: "Does everyone concerned use their decision authority, or mostly those who voice their views more loudly?" },
    },
  },
  execution: {
    left: {
      support: { hu: "Mikor segít az előre egyeztetett munkamenet azoknak is, akik szívesen újítanak, és azoknak is, akik a bevált megoldásokat kedvelik?", en: "On which tasks does a fixed workflow support members with different appetites for novelty?" },
      tension: { hu: "Hogyan döntitek el, hogy egy új ötlet miatt változtattok a terven, vagy előbb befejezitek, amit elkezdtetek?", en: "Where is there room to try a new idea, and when does following the plan serve the task?" },
    },
    right: {
      support: { hu: "Amikor új megoldást próbáltok ki, hogyan vonjátok be azokat is, akik szívesebben maradnának a bevált módszernél?", en: "How do you turn new experiences into useful experiments across different levels of openness?" },
      tension: { hu: "Mikor válik nehézzé követni a változásokat? Miben érdemes állandóságot tartanotok, hogy mindenki tudja, mire számíthat?", en: "How much change remains manageable, and which stable reference points help members who need predictability?" },
    },
  },
};

// Profile-specific questions make each pair meaningful without asserting a causal fit.
const PROFILE_SUPPORT: Record<OperatingAxis, Record<"left" | "right", Record<"high" | "low", Localized>>> = {
  information: {
    left: {
      high: { hu: "A profil alapján fontos lehet nektek, hogy átlátható legyen a munka. Hogyan segít ebben a közös nyilvántartás? Hozzatok egy példát, amikor könnyen visszakerestetek benne valamit.", en: "How do shared, retrievable records support the stronger tendency toward organization in the personality profile?" },
      low: { hu: "A profilban kevésbé hangsúlyos a rendszerezés. Segít a közös nyilvántartás abban, hogy mégis követni tudjátok a feladatokat? Mikor használtátok legutóbb erre?", en: "Do shared records provide a useful external reference where the tendency toward organization is less pronounced?" },
    },
    right: {
      high: { hu: "A profil alapján fontos lehet nektek a rendezettség, az információkat mégis főként beszélgetésben adjátok át. Hogyan keresitek vissza később a fontos részleteket?", en: "How does a stronger tendency toward organization coexist with conversation-based information sharing? What makes key details retrievable?" },
      low: { hu: "A profilban kevésbé hangsúlyos a rendszerezés. Mikor segít a közvetlen beszélgetés abban, hogy gyorsan tisztázzatok egy feladatot?", en: "Does direct information exchange support shared work when organization is less prominent in the profile?" },
    },
  },
  coordination: {
    left: {
      high: { hu: "A profil alapján szívesen segíthettek egymásnak. Könnyebb ezt megtenni, ha előre tudjátok, ki miért felel? Mikor tapasztaltátok ezt legutóbb?", en: "Alongside a higher cooperative personality proxy, how do explicit responsibilities help turn willingness to help into concrete tasks?" },
      low: { hu: "Az együttműködési hajlam kevésbé hangsúlyos a profilban. Megkönnyíti a közös munkát, ha előre tisztázzátok, ki miért felel? Mondjatok egy példát.", en: "Alongside a less pronounced cooperative personality proxy, do clear task boundaries provide common ground?" },
    },
    right: {
      high: { hu: "A profil alapján szívesen segíthettek egymásnak. Mely közös szokásaitokból tudjátok külön egyeztetés nélkül is, mikor van szükség a segítségetekre?", en: "Alongside a higher cooperative personality proxy, do genuinely shared routines support work with little explicit coordination?" },
      low: { hu: "Az együttműködési hajlam kevésbé hangsúlyos a profilban. Mely közös szokásaitok segítenek mégis abban, hogy külön egyeztetés nélkül is összehangoljátok a feladatokat?", en: "Which shared routines support organic coordination even when the cooperative personality proxy is less pronounced?" },
    },
  },
  decision: {
    left: {
      high: { hu: "Hogyan jutnak el a csapattagok ötletei ahhoz, aki a végső döntést hozza? Mikor könnyítette meg ezt valakinek a kezdeményezése?", en: "How do initiatives associated with higher social activity reach the central decision-maker?" },
      low: { hu: "A profil alapján visszafogottabbak lehettek társas helyzetekben. Segíti a haladást, hogy egy ember hozza meg a végső döntést? Marad előtte időtök átgondolni és elmondani a véleményeteket?", en: "With a quieter social profile, does a central decision point help progress while leaving time for individual reflection?" },
    },
    right: {
      high: { hu: "A profil alapján szívesen kezdeményezhettek társas helyzetekben. Mikor segít ez abban, hogy a saját feladataitokban önállóan döntsetek?", en: "How does higher social activity translate into decision initiatives within distributed areas of authority?" },
      low: { hu: "A profil alapján visszafogottabbak lehettek társas helyzetekben. Mire van szükségetek ahhoz, hogy a saját feladataitokban önállóan döntsetek?", en: "What preparation helps a team with a quieter social profile use distributed decision authority?" },
    },
  },
  execution: {
    left: {
      high: { hu: "A profil alapján szívesen próbálhattok ki új ötleteket. Mikor segít az előre egyeztetett terv abban, hogy el is készüljetek velük?", en: "Alongside higher personality openness, how does a fixed plan help turn ideas into completed work?" },
      low: { hu: "A profil alapján közelebb állhatnak hozzátok a bevált megoldások. Mikor segít az előre egyeztetett terv abban, hogy tudjátok, mire számíthattok?", en: "For a composition leaning toward established approaches, when does following a plan provide useful predictability?" },
    },
    right: {
      high: { hu: "A profil alapján szívesen próbálhattok ki új ötleteket. Mikor változtattatok legutóbb a munkameneten egy visszajelzés hatására? Mi lett az eredménye?", en: "How does a feedback-responsive workflow support higher personality openness? Which experiment produced a tangible result?" },
      low: { hu: "A profil alapján közelebb állhatnak hozzátok a bevált megoldások. Milyen tapasztalat győzött meg benneteket legutóbb arról, hogy érdemes változtatni a munkameneten?", en: "Alongside a composition leaning toward established approaches, what concrete evidence makes a workflow change acceptable?" },
    },
  },
};

export function compareTeamPatterns(operating: OperatingResult | null, composition: CompositionSnapshot | null): TeamStyleSnapshot["comparison"] {
  if (!operating || !composition || operating.patternUnavailableReason === "different_cohorts" ||
    AXES.some((axis) => operating.axes[axis].status !== "available" || operating.axes[axis].coverage < POLICY.minCoverage)) return null;
  return {
    operatingCode: operating.pattern?.code ?? null, compositionCode: composition.code,
    prompts: AXES.map((axis) => {
      const pole = operating.axes[axis].pole;
      const prompt = pole === "mixed" ? {
        support: { hu: `Mikor segít a kétféle megoldás váltogatása ezen a területen: ${AXIS_LABELS[axis].name.hu.toLowerCase()}?`, en: `When does switching between the two ${AXIS_LABELS[axis].name.en.toLowerCase()} modes help?` },
        tension: { hu: "Ugyanazokat a helyzeteket értékeltétek, vagy eltérő feladatok és tapasztalatok kerültek az átlagba?", en: "Did you rate the same situations, or does the average combine different tasks and experiences?" },
      } : PROMPTS[axis][pole === "right" ? "right" : "left"];
      const grade = composition.axes[PAIRINGS[axis]].grade;
      const support = (pole === "left" || pole === "right") && grade !== "balanced"
        ? PROFILE_SUPPORT[axis][pole][grade.endsWith("high") ? "high" : "low"] : prompt.support;
      return { operatingAxis: axis, compositionAxis: PAIRINGS[axis], ...prompt, support };
    }),
  };
}
