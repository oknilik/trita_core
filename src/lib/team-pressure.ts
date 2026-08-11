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
      hu: "Sok magas Extraverzió mellett nyomás alatt a tempó és a hangerő tovább nőhet: a gyors reakció elnyomhatja a mérlegelést, a csendesebb jelzések pedig elveszhetnek. Döntés előtt érdemes egy rövid írásos kört tartani, hogy a halkabb szempontok is beérjenek.",
      en: "With many high-Extraversion members, pressure can push pace and volume even higher: quick reactions may crowd out deliberation, and quieter signals can get lost. Before decisions, run a short written round so the quieter perspectives land too.",
    },
    low: {
      hu: "Túlsúlyban lévő alacsony Extraverzió mellett nyomás alatt a csapat elcsendesedhet: a csatornák elnémulnak, a problémák későn kerülnek felszínre. Rövid, rendszeres szinkron-pontok segítenek, hogy a jelzések időben megérkezzenek.",
      en: "With low Extraversion dominant, the team may go quiet under pressure: channels fall silent and problems surface late. Short, regular sync points help signals arrive on time.",
    },
  },
  E: {
    high: {
      hu: "Érzelmileg hangolt többségnél a feszültség gyorsan átterjedhet egyik tagról a másikra — a csapat együtt pöröghet túl. Segít, ha a feszültséget korán nevén nevezitek, mielőtt döntési kérdéssé válna.",
      en: "With an emotionally attuned majority, tension can spread quickly from one member to another — the team may over-rev together. It helps to name the tension early, before it turns into a decision problem.",
    },
    low: {
      hu: "Kiegyensúlyozott, tárgyilagos többségnél a terhelés jelei sokáig láthatatlanok maradhatnak — mire észrevehetővé válnak, már mélyek. Egy explicit terhelés-kör (mindenki mond egy számot) korán felszínre hozza, amit a működés elrejt.",
      en: "With a calm, matter-of-fact majority, signs of overload can stay invisible for a long time — by the time they show, they run deep. An explicit load check-in (everyone gives a number) surfaces early what day-to-day behavior hides.",
    },
  },
  H: {
    high: {
      hu: "Erős elvhűség-koncentrációnál nyomás alatt a rugalmasság csökkenhet: a kompromisszum könnyen morális kérdésnek tűnik, és az egyeztetés megmerevedik. Segít az érték-kérdés és a megoldás-kérdés tudatos szétválasztása.",
      en: "With a strong integrity concentration, flexibility can drop under pressure: compromise starts to feel like a moral question, and alignment stiffens. Deliberately separating the values question from the solution question helps.",
    },
    low: {
      hu: "Alacsony Becsületesség-Alázat koncentrációnál nyomás alatt erősödhet az érdek-vezérelt alku, az információ-visszatartás és a státuszjáték. Átlátható döntési napló és nyílt prioritás-lista csökkenti a taktikázás terét.",
      en: "With a low Honesty-Humility concentration, pressure can amplify interest-driven bargaining, information hoarding and status games. A transparent decision log and an open priority list shrink the room for tactics.",
    },
  },
  A: {
    high: {
      hu: "Harmónia-kereső többségnél nyomás alatt a jogos vita is elmaradhat — látszat-egyetértés alakulhat ki, a konfliktus a felszín alá szorul. Egy strukturált ellenvélemény-kör (kijelölt tag tudatosan a másik oldalt képviseli) legitimálja a vitát.",
      en: "With a harmony-seeking majority, even legitimate debate may vanish under pressure — surface agreement forms while conflict moves underground. A structured dissent round (someone always argues the other side) legitimizes debate.",
    },
    low: {
      hu: "Konfrontatívabb többségnél nyomás alatt a kritika éle élesedhet, és a szakmai vita könnyebben válik személyessé. Előre rögzített vita-szabályok (témáról beszélünk, nem emberről) tartják mederben az energiát.",
      en: "With a more confrontational majority, criticism sharpens under pressure and professional debate slips into the personal more easily. Pre-agreed debate rules (we discuss the topic, not the person) keep the energy in its channel.",
    },
  },
  C: {
    high: {
      hu: "Magas Lelkiismeretesség-koncentrációnál nyomás alatt a kontroll-igény összeadódhat: több ellenőrzés, lassuló átadások, mikromenedzsment-spirál. Segít tudatosan elengedni ellenőrzési pontokat, és előre rögzíteni, mi a „elég jó\".",
      en: "With a high Conscientiousness concentration, the need for control can compound under pressure: more checks, slower handoffs, a micromanagement spiral. Deliberately dropping checkpoints and pre-agreeing what \"good enough\" means helps.",
    },
    low: {
      hu: "Alacsony Lelkiismeretesség-túlsúlynál nyomás alatt a struktúra tovább lazulhat: a határidő-csúszás normalizálódik, a felelősség elmosódik. Egy minimál-keret (ki, mit, mikorra — egyetlen lista) többet véd, mint egy teljes folyamatrend.",
      en: "With low Conscientiousness dominant, structure can loosen further under pressure: deadline slips normalize and ownership blurs. A minimal frame (who, what, by when — one single list) protects more than a full process would.",
    },
  },
  O: {
    high: {
      hu: "Újdonság-kereső többségnél nyomás alatt az új ötlet menekülőúttá válhat a nehéz végrehajtás elől — a csapat pörög, de nem zár le. Ötlet-parkoló és egy közös fókusz-fogadalom (most ezt visszük végig) védi a befejezést.",
      en: "With a novelty-seeking majority, new ideas can become an escape from hard execution under pressure — the team spins but doesn't close. An idea parking lot and a shared focus commitment (we finish this one now) protect completion.",
    },
    low: {
      hu: "Bevált módszerekhez ragaszkodó többségnél nyomás alatt a szükséges irányváltás is elmaradhat — a stabilitás merevséggé válhat. Kis, alacsony kockázatú kísérletek kerete teszi biztonságossá a változtatást.",
      en: "With a proven-methods majority, even a necessary course change may not happen under pressure — stability can turn into rigidity. A frame of small, low-risk experiments makes change safe.",
    },
  },
};

/**
 * Generikus polarizációs szöveg — dimenziófüggetlen, mert a kettéosztottság
 * dinamikája (két csoport, két reakciómód) minden dimenzióra azonos.
 */
export const TEAM_PRESSURE_POLARIZED_TEXT: PressureText = {
  hu: "Ebben a dimenzióban a csapat két ellentétes pólusra oszlik: nyomás alatt a két csoport eltérő — akár egymásnak feszülő — módon reagálhat, és a különbség tovább mélyülhet. Segít, ha a kétféle működést nyíltan kimondjátok, és előre megállapodtok, melyik helyzetben melyik kapjon teret.",
  en: "On this dimension the team splits into two opposite poles: under pressure the two groups may react in different — even clashing — ways, and the gap can widen further. It helps to name the two styles openly and agree in advance which one leads in which situation.",
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
