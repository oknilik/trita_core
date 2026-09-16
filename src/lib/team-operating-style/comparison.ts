import type { TeamPatternResult, AxisGrade } from "@/lib/team-pattern";
import { AXES, AXIS_LABELS, type Localized, type OperatingAxis } from "./questions";
import type { OperatingResult } from "./scoring";

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
  comparison: { operatingCode: string; compositionCode: string; prompts: ComparisonPrompt[] } | null;
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
      support: { hu: "Miben segíti a közös nyilvántartás a különböző rendszerezettségi igényű tagokat?", en: "How do shared records help members with different needs for structure?" },
      tension: { hu: "Mikor igényel több adminisztrációt a dokumentálás, mint amennyi támpontot ad?", en: "When does documentation require more administration than the guidance it provides?" },
    },
    right: {
      support: { hu: "Mely helyzetekben segít a közvetlen beszélgetés gyorsabban megérteni a feladatot?", en: "When do direct conversations help people understand a task faster?" },
      tension: { hu: "Kinek hiányzik visszakereshető leírás, és hogyan marad képben az, aki kimaradt a beszélgetésből?", en: "Who needs a retrievable record, and how does someone absent from a conversation stay informed?" },
    },
  },
  coordination: {
    left: {
      support: { hu: "Hogyan segítenek a kimondott felelősségek az eltérő együttműködési igényű tagoknak?", en: "How do explicit responsibilities help members with different collaboration preferences?" },
      tension: { hu: "Van-e helyzet, amikor a rögzített feladathatárok megnehezítik az egymásnak nyújtott segítséget?", en: "Are there situations where fixed task boundaries make it harder to help one another?" },
    },
    right: {
      support: { hu: "Mely közösen megtanult rutinok teszik lehetővé, hogy kevés egyeztetéssel is együtt haladjatok?", en: "Which shared routines allow you to work together with little explicit coordination?" },
      tension: { hu: "Honnan tudja az új vagy visszafogottabb tag, mikor és miben számítanak rá?", en: "How does a new or quieter member know when and where they are needed?" },
    },
  },
  decision: {
    left: {
      support: { hu: "Mikor ad hasznos irányt az egyértelmű döntési pont a különböző aktivitású tagoknak?", en: "When does a clear decision point help members with different levels of social energy?" },
      tension: { hu: "Hogyan jutnak el a kezdeményező és a csendesebb tagok javaslatai a végső döntéshozóhoz?", en: "How do suggestions from both proactive and quieter members reach the final decision-maker?" },
    },
    right: {
      support: { hu: "Hogyan segít a megosztott döntési jog abban, hogy a tagok a saját területükön kezdeményezzenek?", en: "How does distributed authority help members take initiative in their own areas?" },
      tension: { hu: "A döntési jogot ténylegesen minden érintett használja, vagy főleg azok, akik hangosabban képviselik a véleményüket?", en: "Does everyone concerned use their decision authority, or mostly those who voice their views more loudly?" },
    },
  },
  execution: {
    left: {
      support: { hu: "Mely feladatoknál ad a rögzített munkamenet támaszt a különböző újdonságigényű tagoknak?", en: "On which tasks does a fixed workflow support members with different appetites for novelty?" },
      tension: { hu: "Hol fér bele egy új ötlet kipróbálása, és mikor szolgálja a feladatot a terv követése?", en: "Where is there room to try a new idea, and when does following the plan serve the task?" },
    },
    right: {
      support: { hu: "Hogyan fordítjátok a változó tapasztalatokat hasznos kísérletekké a nyitottság különböző szintjei mellett?", en: "How do you turn new experiences into useful experiments across different levels of openness?" },
      tension: { hu: "Mennyi változás követhető még jól, és milyen állandó kapaszkodók segítik a kiszámíthatóságot igénylő tagokat?", en: "How much change remains manageable, and which stable reference points help members who need predictability?" },
    },
  },
};

// Profile-specific questions make each pair meaningful without asserting a causal fit.
const PROFILE_SUPPORT: Record<OperatingAxis, Record<"left" | "right", Record<"high" | "low", Localized>>> = {
  information: {
    left: {
      high: { hu: "A személyiségprofilban erősebb rendszerezettségi hajlamot hogyan támogatja a közös, visszakereshető információ?", en: "How do shared, retrievable records support the stronger tendency toward organization in the personality profile?" },
      low: { hu: "Ad-e hasznos külső kapaszkodót a közös nyilvántartás ott, ahol a rendszerezettségi hajlam kevésbé hangsúlyos?", en: "Do shared records provide a useful external reference where the tendency toward organization is less pronounced?" },
    },
    right: {
      high: { hu: "Hogyan fér össze az erősebb rendszerezettségi hajlam a beszélgetésekre épülő információátadással? Mi segít utólag visszakeresni a lényeget?", en: "How does a stronger tendency toward organization coexist with conversation-based information sharing? What makes key details retrievable?" },
      low: { hu: "Megkönnyíti-e a közvetlen információcsere a közös munkát, amikor a rendszerezettség kevésbé hangsúlyos a profilban?", en: "Does direct information exchange support shared work when organization is less prominent in the profile?" },
    },
  },
  coordination: {
    left: {
      high: { hu: "Az erősebb együttműködési hajlam mellett hogyan segítik a kimondott felelősségek, hogy a segítőkészség konkrét feladattá váljon?", en: "Alongside a higher cooperative personality proxy, how do explicit responsibilities help turn willingness to help into concrete tasks?" },
      low: { hu: "A kevésbé hangsúlyos együttműködési hajlam mellett adnak-e közös alapot az egyértelmű feladat- és felelősséghatárok?", en: "Alongside a less pronounced cooperative personality proxy, do clear task boundaries provide common ground?" },
    },
    right: {
      high: { hu: "Az erősebb együttműködési hajlam mellett valóban közösen megtanult rutinok tartják-e össze a kevés egyeztetéssel zajló munkát?", en: "Alongside a higher cooperative personality proxy, do genuinely shared routines support work with little explicit coordination?" },
      low: { hu: "Mely közösen megtanult rutinok segítik az organikus koordinációt akkor is, ha az együttműködési hajlam kevésbé hangsúlyos?", en: "Which shared routines support organic coordination even when the cooperative personality proxy is less pronounced?" },
    },
  },
  decision: {
    left: {
      high: { hu: "A magasabb társas aktivitásból származó kezdeményezések hogyan jutnak el a központi döntéshozóhoz?", en: "How do initiatives associated with higher social activity reach the central decision-maker?" },
      low: { hu: "A visszafogottabb társas profil mellett segíti-e a központi döntési pont a haladást, miközben marad idő az egyéni átgondolásra?", en: "With a quieter social profile, does a central decision point help progress while leaving time for individual reflection?" },
    },
    right: {
      high: { hu: "A magasabb társas aktivitás hogyan fordul önálló döntési kezdeményezéssé a megosztott hatáskörökben?", en: "How does higher social activity translate into decision initiatives within distributed areas of authority?" },
      low: { hu: "Milyen előkészítés teszi könnyebbé, hogy a visszafogottabb társas profilú csapat is éljen az elosztott döntési joggal?", en: "What preparation helps a team with a quieter social profile use distributed decision authority?" },
    },
  },
  execution: {
    left: {
      high: { hu: "A magasabb személyiségbeli nyitottság mellett hogyan segít a rögzített terv abban, hogy az ötletekből megvalósult eredmény legyen?", en: "Alongside higher personality openness, how does a fixed plan help turn ideas into completed work?" },
      low: { hu: "A bevált megoldások felé hajló összetétel számára mikor ad hasznos kiszámíthatóságot a terv követése?", en: "For a composition leaning toward established approaches, when does following a plan provide useful predictability?" },
    },
    right: {
      high: { hu: "A magasabb személyiségbeli nyitottságot hogyan támogatja a visszajelzésekre módosuló munkamenet? Mely kísérlet hozott kézzelfogható eredményt?", en: "How does a feedback-responsive workflow support higher personality openness? Which experiment produced a tangible result?" },
      low: { hu: "A bevált megoldások felé hajló összetétel mellett milyen konkrét tapasztalat teszi elfogadhatóvá a munkamenet módosítását?", en: "Alongside a composition leaning toward established approaches, what concrete evidence makes a workflow change acceptable?" },
    },
  },
};

export function compareTeamPatterns(operating: OperatingResult | null, composition: CompositionSnapshot | null): TeamStyleSnapshot["comparison"] {
  if (!operating?.pattern || !composition) return null;
  return {
    operatingCode: operating.pattern.code, compositionCode: composition.code,
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
