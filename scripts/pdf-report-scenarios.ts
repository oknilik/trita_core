/**
 * pdf-report-scenarios.ts — a riport-PDF regressziós készletének forgatókönyvei.
 *
 * A készlet EGY helyen definiálja azokat a profilokat, amelyeken a PDF-nek
 * rendben kell renderelnie (PDF-audit 2026-08-18, P2/16):
 *
 *   · Start és Plus                       · magyar és angol
 *   · kiegyensúlyozott profil             · több magas / több alacsony dimenzió
 *   · hosszú magyar szövegek              · kiegészítő skála NÉLKÜL és valódival
 *   · observer-melléklettel                · hiányzó opcionális tartalmakkal
 *
 * A `withCareer` eset SZÁNDÉKOSAN benne marad: a karrier-felület parkolva van
 * (portfolio-parking), és azt is védeni akarjuk, hogy karrier-adat átadása
 * mellett SEM készül karrier-melléklet — ld. a szerkezeti tesztet.
 *
 * Használják:
 *   · scripts/pdf-report-snapshots.tsx        — PDF/PNG snapshotok emberi nézésre
 *   · tests/unit/results/pdf-report-*.test.ts — automatikus szerződés-ellenőrzés
 */

import { getTestConfig } from "../src/lib/questions";
import { buildWorkstyleContent } from "../src/lib/workstyle-content";
import { resolvePersonalityTypeFromScores } from "../src/lib/personality-type";
import { HEXACO_ORDER } from "../src/lib/hexaco";
import { t, type Locale } from "../src/lib/i18n";
import type { ProfileReportInput } from "../src/lib/profile-report-view-model";

export interface PdfScenario {
  id: string;
  /** Mit véd ez az eset — a snapshot-manifestbe és a teszt-üzenetekbe megy. */
  covers: string;
  input: ProfileReportInput;
}

type Scores = Record<string, number>;

const BALANCED: Scores = { H: 52, E: 48, X: 55, A: 51, C: 49, O: 53 };
const MANY_HIGH: Scores = { H: 88, E: 41, X: 84, A: 79, C: 91, O: 76 };
const MANY_LOW: Scores = { H: 24, E: 71, X: 18, A: 31, C: 27, O: 22 };
const MIXED: Scores = { H: 86, E: 52, X: 68, A: 48, C: 44, O: 30 };

function insightFor(score: number, insights: { low: string; mid: string; high: string }): string {
  return score < 40 ? insights.low : score < 70 ? insights.mid : insights.high;
}

/** Determinisztikus facet-pontszámok — a dimenzió körül szimmetrikus szórással. */
function facetScore(dimScore: number, index: number): number {
  const offsets = [-6, -2, 3, 7];
  return Math.max(0, Math.min(100, dimScore + (offsets[index % offsets.length] ?? 0)));
}

interface BuildOptions {
  locale: Locale;
  plan: "start" | "plus";
  scores: Scores;
  /** Valódi, kitöltésből származó kiegészítő („I") skála-érték. */
  altruismScore?: number;
  withFacets?: boolean;
  withObserver?: boolean;
  withCareer?: boolean;
  /** Csak a kötelező tartalom — nincs plusContent, nincs melléklet. */
  minimal?: boolean;
  userName?: string;
}

export function buildScenarioInput({
  locale,
  plan,
  scores,
  altruismScore,
  withFacets = true,
  withObserver = false,
  withCareer = false,
  minimal = false,
  userName = "Teszt Elemér",
}: BuildOptions): ProfileReportInput {
  const config = getTestConfig("TRITAN", locale);

  const dimensions = config.dimensions.flatMap((dim) => {
    // „Nincs mérve" ≠ 0 pont: az „I" skála CSAK akkor kerül a listába, ha az
    // eset kifejezetten valódi értéket ad neki (rövid formában nincs ilyen item).
    const score = dim.code === "I" ? altruismScore : scores[dim.code];
    if (typeof score !== "number") return [];
    const insights = (dim.insightsByLocale?.[locale] ?? dim.insights) as {
      low: string;
      mid: string;
      high: string;
    };
    return [
      {
        code: dim.code,
        label: (dim.labelByLocale?.[locale] ?? dim.label) as string,
        score,
        insight: insightFor(score, insights),
        description: (dim.descriptionByLocale?.[locale] ?? dim.description) as string,
        facets:
          withFacets && plan === "plus"
            ? (dim.facets ?? []).map((f, i) => ({
                code: f.code,
                label: (f.labelByLocale?.[locale] ?? f.label) as string,
                score: facetScore(score, i),
              }))
            : [],
        observerScore: withObserver
          ? Math.max(0, Math.min(100, score + (score > 50 ? -14 : 11)))
          : undefined,
      },
    ];
  });

  const mainDims = dimensions.filter((d) => d.code !== "I");
  const workstyle = buildWorkstyleContent(
    Object.fromEntries(mainDims.map((d) => [d.code, d.score])),
    "TRITAN",
    locale,
  );

  return {
    locale,
    plan,
    userName,
    completedAt: locale === "hu" ? "2026. augusztus 18." : "18 August 2026",
    personalityType:
      resolvePersonalityTypeFromScores(
        mainDims.map((d) => ({ code: d.code, score: d.score })),
        locale,
      ) ?? t("results.uniqueProfile", locale),
    heroInsight:
      locale === "hu"
        ? "A tisztaság és a kimondott elvek a fő tájékozódási pontjaid — a gyors, laza improvizáció kevésbé."
        : "Clarity and stated principles are your main reference points — quick, loose improvisation less so.",
    dimensions,
    teamRoleMeasuredScores: null,
    plusContent:
      plan === "plus" && !minimal
        ? {
            howYouWorkParts: workstyle.howYouWorkParts,
            pressure: workstyle.pressure,
            pressureParts: workstyle.pressureParts,
            growthTip: workstyle.growthTip,
            growthPlan: workstyle.growthPlan,
            collaboration: workstyle.collaboration,
            envItems: workstyle.envItems,
            roleFit: workstyle.roleFit,
            takeaways: workstyle.takeaways,
          }
        : undefined,
    observer: withObserver
      ? {
          count: 4,
          dimensions: mainDims.map((d) => ({
            name: d.label,
            self: d.score,
            observer: d.observerScore ?? d.score,
          })),
          summaryPoints: [],
        }
      : undefined,
    career: withCareer
      ? {
          roles: [
            {
              name: locale === "hu" ? "Compliance vezető" : "Compliance lead",
              industry: "",
              score: 74,
              bandLow: 68,
              bandHigh: 80,
              why:
                locale === "hu"
                  ? "Az elvek melletti kitartás és a rendszerezett munkamód együtt ritka kombináció ezen a pályán."
                  : "Sticking to principles paired with systematic work is a rare combination in this field.",
            },
            {
              name: locale === "hu" ? "Minőségbiztosítási vezető" : "Quality assurance lead",
              industry: "",
              score: 61,
              bandLow: 54,
              bandHigh: 68,
            },
          ],
          developNote:
            locale === "hu"
              ? "A top irányaidnál a leggyakoribb eltérés: Nyitottság — a tipikus sáv alatt."
              : "The most common gap across your top directions: Openness — below the typical range.",
        }
      : undefined,
  };
}

/**
 * Hosszú magyar szövegek: a tördelés, az árva címek és a levágás ellen.
 * A generált tartalmat felülírjuk terjengős, valósághűen hosszú mondatokkal.
 */
function withLongHungarianCopy(input: ProfileReportInput): ProfileReportInput {
  const long =
    "A visszajelzéseid alapján jellemzően akkor működsz a legjobban, amikor a döntési " +
    "szempontok kimondottan és írásban is rögzítve vannak, mert így nem a személyes " +
    "kapcsolatok súlya, hanem az előre egyeztetett elvek határozzák meg az irányt — " +
    "ez a működésmód hosszabb egyeztetéseket kíván, viszont lényegesen kiszámíthatóbb " +
    "eredményt ad, különösen összetett érdekviszonyú szervezetekben.";
  const pc = input.plusContent;
  if (!pc) return input;
  return {
    ...input,
    userName: "Kovácsné Szabó-Nagy Krisztina Boglárka",
    plusContent: {
      ...pc,
      howYouWorkParts: {
        ...pc.howYouWorkParts,
        main: long,
        watch: long,
        notes: [long],
        context: [long],
      },
      takeaways: [long, long],
      roleFit: { ...pc.roleFit, strong: long, might: long, prep: long },
    },
  };
}

export function buildPdfScenarios(): PdfScenario[] {
  const scenarios: PdfScenario[] = [
    {
      id: "plus-hu-mixed-full",
      covers:
        "Plus · HU · vegyes profil · alskálák · observer-melléklet " +
        "(karrier-adattal, ami parkolt felület mellett NEM kerül a riportba)",
      input: buildScenarioInput({
        locale: "hu",
        plan: "plus",
        scores: MIXED,
        withObserver: true,
        withCareer: true,
      }),
    },
    {
      id: "plus-en-mixed-full",
      covers:
        "Plus · EN · vegyes profil · alskálák · observer-melléklet " +
        "(karrier-adattal, ami parkolt felület mellett NEM kerül a riportba)",
      input: buildScenarioInput({
        locale: "en",
        plan: "plus",
        scores: MIXED,
        withObserver: true,
        withCareer: true,
        userName: "Alex Taylor",
      }),
    },
    {
      id: "start-hu-mixed",
      covers: "Start · HU · alskálák nélkül, upsell-blokkal",
      input: buildScenarioInput({ locale: "hu", plan: "start", scores: MIXED }),
    },
    {
      id: "start-en-mixed",
      covers: "Start · EN · alskálák nélkül, upsell-blokkal",
      input: buildScenarioInput({
        locale: "en",
        plan: "start",
        scores: MIXED,
        userName: "Alex Taylor",
      }),
    },
    {
      id: "plus-hu-balanced",
      covers: "Kiegyensúlyozott profil — nincs ≥70 és nincs <40 dimenzió",
      input: buildScenarioInput({ locale: "hu", plan: "plus", scores: BALANCED }),
    },
    {
      id: "plus-hu-many-high",
      covers: "Több magas dimenzió — hosszú erősség-listák",
      input: buildScenarioInput({ locale: "hu", plan: "plus", scores: MANY_HIGH }),
    },
    {
      id: "plus-hu-many-low",
      covers: "Több alacsony dimenzió — a fordított E pólus-szabályával együtt",
      input: buildScenarioInput({ locale: "hu", plan: "plus", scores: MANY_LOW }),
    },
    {
      id: "plus-hu-long-copy",
      covers: "Hosszú magyar szövegek — tördelés, árva cím, levágás",
      input: withLongHungarianCopy(
        buildScenarioInput({ locale: "hu", plan: "plus", scores: MIXED }),
      ),
    },
    {
      id: "plus-hu-no-supplementary-scale",
      covers: "Kiegészítő skála NÉLKÜL (rövid forma) — nem lehet 0%-os sor",
      input: buildScenarioInput({ locale: "hu", plan: "plus", scores: MIXED }),
    },
    {
      id: "plus-hu-with-supplementary-scale",
      covers: "Valódi, mért kiegészítő skálával",
      input: buildScenarioInput({
        locale: "hu",
        plan: "plus",
        scores: MIXED,
        altruismScore: 73,
      }),
    },
    {
      id: "plus-hu-minimal",
      covers: "Hiányzó opcionális tartalmak — nincs plusContent, nincs melléklet",
      input: buildScenarioInput({
        locale: "hu",
        plan: "plus",
        scores: MIXED,
        minimal: true,
        withFacets: false,
      }),
    },
  ];

  // Kanonikus dimenzió-rend ellenőrzése a készlet szintjén: minden eset a hat
  // fő dimenziót viszi (az „I" opcionális), különben a snapshotok nem
  // összehasonlíthatók.
  for (const scenario of scenarios) {
    const codes = scenario.input.dimensions.filter((d) => d.code !== "I").map((d) => d.code);
    if (codes.length !== HEXACO_ORDER.length) {
      throw new Error(`pdf-report-scenarios: ${scenario.id} nem hozza mind a hat dimenziót`);
    }
  }

  return scenarios;
}
