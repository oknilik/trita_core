// ─────────────────────────────────────────────────────────────────────
// „Csapat nyomás alatt" — kollektív pressure-minták a riporthoz.
//
// Az egyéni SOLO_DIM_PRESSURE (profile-content.ts) csapat-szintű párja:
// ha egy dimenzió-pólus a csapatban KONCENTRÁLÓDIK (az értékelt tagok
// legalább fele ugyanazon a póluson), az egyéni túlpörgések nyomás alatt
// kollektív mintává adódhatnak össze. Hipotézis-nyelv kötelező (a minta
// önértékelésekből becsült), minden állítás 1 akció-mondattal zárul —
// a riport-értelmezési sablonok elve: megfigyelés akció nélkül = zaj.
// ─────────────────────────────────────────────────────────────────────

import {
  PROFILE_HIGH_THRESHOLD,
  PROFILE_LOW_THRESHOLD,
} from "@/lib/profile-engine";
import type { HexacoCode } from "@/lib/hexaco";

export type PressurePole = "high" | "low";
/**
 * Találat-pólus: ha egy dimenziónál MINDKÉT pólus eléri a koncentráció-
 * küszöböt, egyetlen "polarized" találat születik a két (egymásnak
 * ellentmondó) pólus-találat helyett.
 */
export type PressureFindingPole = PressurePole | "polarized";

interface PressureText {
  hu: string;
  en: string;
}

// Pólus-küszöbök — az egyéni profilmotor HIGH/LOW határaiból, SZIGORÚ
// (>/<) összehasonlítással, a profile-engine categorize()-zal azonosan.
// Korábban ≥/≤ volt: a pontosan 65-ös tag egyénileg „medium"-nak számított,
// itt viszont magas-pólusú koncentráció-taggá vált — a két felület
// ellentmondott egymásnak.
export const PRESSURE_HIGH_THRESHOLD = PROFILE_HIGH_THRESHOLD;
export const PRESSURE_LOW_THRESHOLD = PROFILE_LOW_THRESHOLD;
// Koncentráció: az értékelt tagok legalább fele + legalább 2 fő.
export const PRESSURE_SHARE_THRESHOLD = 0.5;
export const PRESSURE_MIN_COUNT = 2;
// Max. ennyi állítás kerül a riportba — a több nem hajtódik végre.
export const PRESSURE_MAX_FINDINGS = 3;

export const TEAM_PRESSURE_CONTENT: Record<
  HexacoCode,
  Record<PressurePole, PressureText>
> = {
  X: {
    high: {
      hu: "A profilok alapján sokan szívesen szólaltok meg társas helyzetekben. Nyomás alatt könnyen felgyorsulhat a beszélgetés, és a csendesebb jelzések kimaradhatnak. Döntés előtt adjatok rövid időt arra, hogy mindenki leírja a szempontjait, majd ezeket is vegyétek sorra.",
      en: "With many high-Extraversion members, pressure can push pace and volume even higher: quick reactions may crowd out deliberation, and quieter signals can get lost. Before decisions, run a short written round so the quieter perspectives land too.",
    },
    low: {
      hu: "A profilok alapján sokan visszafogottabbak lehettek társas helyzetekben. Terhelés alatt emiatt később kerülhet szóba egy elakadás. Tartsatok rövid egyeztetést, amelyben mindenki elmondhatja, hol tart, és mire van szüksége.",
      en: "With low Extraversion dominant, the team may go quiet under pressure: channels fall silent and problems surface late. Short, regular sync points help signals arrive on time.",
    },
  },
  E: {
    high: {
      hu: "A profilok alapján sokan érzékenyebben reagálhattok a feszültségre. Egy sűrű időszakban érdemes korán megbeszélnetek, kit mi terhel, és miben tudtok segíteni egymásnak. A pontszámokból nem derül ki, hogyan élitek meg az adott helyzetet.",
      en: "With an emotionally attuned majority, tension can spread quickly from one member to another – the team may over-rev together. It helps to name the tension early, before it turns into a decision problem.",
    },
    low: {
      hu: "A profilok alapján sokan nyugodtabban reagálhattok a feszültségre. Ettől még lehet túl sok a feladat. Kérdezzetek rá rendszeresen, kinek mennyire férnek bele a vállalásai, és mit kellene átütemezni.",
      en: "With a calm, matter-of-fact majority, signs of overload can stay invisible for a long time – by the time they show, they run deep. An explicit load check-in (everyone gives a number) surfaces early what day-to-day behavior hides.",
    },
  },
  H: {
    high: {
      hu: "A profilok alapján sokaknak fontos lehet a méltányos eljárás. Terhelés alatt nehéz lehet engedni abból, amit igazságosnak tartotok. Egy vita során válasszátok külön a közös elveket és azokat a részleteket, amelyekben több megoldás is elfogadható.",
      en: "With a strong integrity concentration, flexibility can drop under pressure: compromise starts to feel like a moral question, and alignment stiffens. Deliberately separating the values question from the solution question helps.",
    },
    low: {
      hu: "A profilokban sokaknál kevésbé hangsúlyos a Becsületesség-Alázat dimenzió. Terhelés alatt érdemes külön figyelnetek arra, hogyan egyeztetitek az egyéni és a közös érdekeket. Rögzítsétek a döntések szempontjait, hogy minden érintett követni tudja őket.",
      en: "With a low Honesty-Humility concentration, pressure can amplify interest-driven bargaining, information hoarding and status games. A transparent decision log and an open priority list shrink the room for tactics.",
    },
  },
  A: {
    high: {
      hu: "A profilok alapján sokan törekedhettek az egyetértésre. Nyomás alatt emiatt elmaradhat egy fontos ellenvetés. Döntés előtt kérjetek mindenkitől egy szempontot, amelyet még érdemes mérlegelni.",
      en: "With a harmony-seeking majority, even legitimate debate may vanish under pressure – surface agreement forms while conflict moves underground. A structured dissent round (someone always argues the other side) legitimizes debate.",
    },
    low: {
      hu: "A profilok alapján sokan határozottan ragaszkodhattok a saját álláspontotokhoz. Terhelés alatt emiatt élesebbé válhat egy vita. Előre egyezzetek meg abban, hogyan hallgatjátok végig egymást, és a konkrét feladatról beszéljetek.",
      en: "With a more confrontational majority, criticism sharpens under pressure and professional debate slips into the personal more easily. Pre-agreed debate rules (we discuss the topic, not the person) keep the energy in its channel.",
    },
  },
  C: {
    high: {
      hu: "A profilok alapján sokaknak fontos lehet a gondos ellenőrzés. Nyomás alatt nehéz lehet eldönteni, mikor készült el egy feladat. Előre egyezzetek meg a szükséges minőségben és az ellenőrzés lépéseiben.",
      en: "With a high Conscientiousness concentration, the need for control can compound under pressure: more checks, slower handoffs, a micromanagement spiral. Deliberately dropping checkpoints and pre-agreeing what \"good enough\" means helps.",
    },
    low: {
      hu: "A profilokban sokaknál kevésbé hangsúlyos a részletes tervezés. Terhelés alatt emiatt nehezebb lehet követni a vállalásokat. Egy közös listán rögzítsétek, ki mit és mikorra végez el, és jelezzétek rajta a csúszásokat is.",
      en: "With low Conscientiousness dominant, structure can loosen further under pressure: deadline slips normalize and ownership blurs. A minimal frame (who, what, by when – one single list) protects more than a full process would.",
    },
  },
  O: {
    high: {
      hu: "A profilok alapján sokan szívesen kereshettek új megoldásokat. Nyomás alatt egy új ötlet elvonhatja a figyelmet a már elkezdett feladatról. Írjátok fel a későbbre szánt ötleteket, és egyezzetek meg, mit fejeztek be először.",
      en: "With a novelty-seeking majority, new ideas can become an escape from hard execution under pressure – the team spins but doesn't close. An idea parking lot and a shared focus commitment (we finish this one now) protect completion.",
    },
    low: {
      hu: "A profilok alapján sokan a bevált megoldásokat kedvelhetitek. Nyomás alatt nehezebb lehet más módszert választani akkor is, ha a régi már nem segít. Próbáljatok ki egy kisebb változtatást, és előre beszéljétek meg, miből látjátok majd, hogy bevált-e.",
      en: "With a proven-methods majority, even a necessary course change may not happen under pressure – stability can turn into rigidity. A frame of small, low-risk experiments makes change safe.",
    },
  },
};

/**
 * Generikus polarizációs szöveg — dimenziófüggetlen, mert a kettéosztottság
 * dinamikája (két csoport, két reakciómód) minden dimenzióra azonos.
 */
export const TEAM_PRESSURE_POLARIZED_TEXT: PressureText = {
  hu: "Ebben a dimenzióban sok egyéni pontszám esik mindkét szélső sávba. Terhelés alatt emiatt eltérő igényeitek lehetnek. Beszéljétek át egy konkrét helyzeten, kinek mi segítene; a profilokból önmagukban nem következik konfliktus.",
  en: "On this dimension the team splits into two opposite poles: under pressure the two groups may react in different – even clashing – ways, and the gap can widen further. It helps to name the two styles openly and agree in advance which one leads in which situation.",
};

export interface PressureConcentration {
  dim: HexacoCode;
  pole: PressureFindingPole;
  /** Hány értékelt tag van ezen a póluson (polarizáltnál a két pólus összege). */
  count: number;
  /** Az értékelt tagok száma (a nevező). */
  assessedCount: number;
}

/**
 * Pólus-koncentrációk az értékelt tagok pontszámaiból. Egyéni adat nem
 * kerül ki: csak dimenzió + pólus + darabszám. Legfeljebb
 * PRESSURE_MAX_FINDINGS találat, a legerősebb arány szerint csökkenő
 * sorrendben (holtversenynél dimenziókód szerint stabil).
 */
export function computeTeamPressure(
  members: ReadonlyArray<{ scores: Partial<Record<HexacoCode, number>> | null }>,
): PressureConcentration[] {
  const assessed = members.filter(
    (m): m is { scores: Partial<Record<HexacoCode, number>> } => m.scores !== null,
  );
  if (assessed.length === 0) return [];

  const findings: Array<PressureConcentration & { share: number }> = [];

  for (const dim of Object.keys(TEAM_PRESSURE_CONTENT) as HexacoCode[]) {
    const values = assessed
      .map((m) => m.scores[dim])
      .filter((v): v is number => typeof v === "number");
    if (values.length < PRESSURE_MIN_COUNT) continue;

    // Szigorú összehasonlítás — a profile-engine categorize() vágásával
    // azonos: a pontosan küszöbön álló érték "medium", nem pólus-tag.
    const highCount = values.filter((v) => v > PRESSURE_HIGH_THRESHOLD).length;
    const lowCount = values.filter((v) => v < PRESSURE_LOW_THRESHOLD).length;
    const qualifies = (count: number) =>
      count >= PRESSURE_MIN_COUNT && count / values.length >= PRESSURE_SHARE_THRESHOLD;

    if (qualifies(highCount) && qualifies(lowCount)) {
      // Kettőspólus: egy polarizált találat a két ellentmondó bekezdés helyett.
      const count = highCount + lowCount;
      findings.push({
        dim,
        pole: "polarized",
        count,
        assessedCount: values.length,
        share: count / values.length,
      });
    } else if (qualifies(highCount)) {
      findings.push({ dim, pole: "high", count: highCount, assessedCount: values.length, share: highCount / values.length });
    } else if (qualifies(lowCount)) {
      findings.push({ dim, pole: "low", count: lowCount, assessedCount: values.length, share: lowCount / values.length });
    }
  }

  return findings
    .sort((a, b) => b.share - a.share || a.dim.localeCompare(b.dim))
    .slice(0, PRESSURE_MAX_FINDINGS)
    .map(({ dim, pole, count, assessedCount }) => ({ dim, pole, count, assessedCount }));
}
