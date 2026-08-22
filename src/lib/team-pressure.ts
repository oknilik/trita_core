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
      hu: "Ha sok tagnál magas az extraverzió, nyomás alatt tovább nőhet a tempó és a hangerő: a gyors reakció elnyomhatja a mérlegelést, a csendesebb jelzések pedig elveszhetnek. Döntés előtt érdemes rövid írásos kört tartani, hogy a halkabban megfogalmazott szempontok is teret kapjanak.",
      en: "With many high-Extraversion members, pressure can push pace and volume even higher: quick reactions may crowd out deliberation, and quieter signals can get lost. Before decisions, run a short written round so the quieter perspectives land too.",
    },
    low: {
      hu: "Ha a csapatban többségben vannak az alacsonyabb extraverziójú tagok, nyomás alatt a közös kommunikáció könnyen elcsendesedhet, a problémák pedig későn kerülhetnek felszínre. Rövid, rendszeres egyeztetések segítenek abban, hogy a jelzések időben megérkezzenek.",
      en: "With low Extraversion dominant, the team may go quiet under pressure: channels fall silent and problems surface late. Short, regular sync points help signals arrive on time.",
    },
  },
  E: {
    high: {
      hu: "Ha a többség érzelmileg fogékonyabb, a feszültség gyorsan átterjedhet egyik tagról a másikra, és az egész csapat túlpöröghet. Segít, ha korán nevén nevezitek a feszültséget, még mielőtt a döntéseket is befolyásolná.",
      en: "With an emotionally attuned majority, tension can spread quickly from one member to another — the team may over-rev together. It helps to name the tension early, before it turns into a decision problem.",
    },
    low: {
      hu: "Kiegyensúlyozottabb, tárgyilagos többségnél a terhelés jelei sokáig láthatatlanok maradhatnak, és csak későn válhatnak egyértelművé. Egy rövid terheltségi körkérdés, amelyben mindenki mond egy számot, már korán felszínre hozhatja azt, amit a napi működés elfed.",
      en: "With a calm, matter-of-fact majority, signs of overload can stay invisible for a long time — by the time they show, they run deep. An explicit load check-in (everyone gives a number) surfaces early what day-to-day behavior hides.",
    },
  },
  H: {
    high: {
      hu: "Ha sok tagnál erős az elvhűség, nyomás alatt csökkenhet a rugalmasság: a kompromisszum könnyen erkölcsi kérdéssé válhat, az egyeztetés pedig megmerevedhet. Segít különválasztani, mi szól az alapértékekről, és mi a lehetséges megoldásokról.",
      en: "With a strong integrity concentration, flexibility can drop under pressure: compromise starts to feel like a moral question, and alignment stiffens. Deliberately separating the values question from the solution question helps.",
    },
    low: {
      hu: "Ha sok tagnál alacsonyabb a Becsületesség–Alázat dimenzió értéke, nyomás alatt erősödhet az érdekvezérelt alku, az információk visszatartása és a státuszért folyó versengés. Az átlátható döntési napló és a nyílt prioritáslista csökkentheti a taktikázás terét.",
      en: "With a low Honesty-Humility concentration, pressure can amplify interest-driven bargaining, information hoarding and status games. A transparent decision log and an open priority list shrink the room for tactics.",
    },
  },
  A: {
    high: {
      hu: "Harmóniára törekvő többségnél nyomás alatt az indokolt vita is elmaradhat: látszólagos egyetértés alakulhat ki, a konfliktus pedig a felszín alá szorulhat. Egy vezetett kör, amelyben egy kijelölt tag tudatosan képviseli az ellenvéleményt, elfogadottá teheti a vitát.",
      en: "With a harmony-seeking majority, even legitimate debate may vanish under pressure — surface agreement forms while conflict moves underground. A structured dissent round (someone always argues the other side) legitimizes debate.",
    },
    low: {
      hu: "Konfrontatívabb többségnél nyomás alatt élesebbé válhat a kritika, a szakmai vita pedig könnyebben fordulhat személyeskedésbe. Az előre rögzített vitaszabályok — a témáról beszélünk, nem az emberről — segítenek mederben tartani a beszélgetést.",
      en: "With a more confrontational majority, criticism sharpens under pressure and professional debate slips into the personal more easily. Pre-agreed debate rules (we discuss the topic, not the person) keep the energy in its channel.",
    },
  },
  C: {
    high: {
      hu: "Ha sok tagnál magas a lelkiismeretesség, nyomás alatt összeadódhat az ellenőrzés iránti igény: több ellenőrzési pont, lassabb átadás és túlzott részletirányítás jelenhet meg. Segít tudatosan elengedni néhány ellenőrzési pontot, és előre rögzíteni, mi számít „elég jónak”.",
      en: "With a high Conscientiousness concentration, the need for control can compound under pressure: more checks, slower handoffs, a micromanagement spiral. Deliberately dropping checkpoints and pre-agreeing what \"good enough\" means helps.",
    },
    low: {
      hu: "Ha a csapatban többségben vannak az alacsonyabb lelkiismeretességű tagok, nyomás alatt tovább lazulhat a struktúra: megszokottá válhatnak a csúszó határidők, a felelősség pedig elmosódhat. Egy minimális közös keret — ki, mit és mikorra vállal, egyetlen listán — többet segíthet, mint a részletes folyamatszabályozás.",
      en: "With low Conscientiousness dominant, structure can loosen further under pressure: deadline slips normalize and ownership blurs. A minimal frame (who, what, by when — one single list) protects more than a full process would.",
    },
  },
  O: {
    high: {
      hu: "Ha a többség szívesen keresi az újdonságot, nyomás alatt az új ötlet menekülőúttá válhat a nehéz végrehajtás elől: a csapat nagy lendülettel dolgozik, de kevés feladatot zár le. Egy közös ötletlista és egyértelmű vállalás — „most ezt visszük végig” — segíthet megőrizni a fókuszt.",
      en: "With a novelty-seeking majority, new ideas can become an escape from hard execution under pressure — the team spins but doesn't close. An idea parking lot and a shared focus commitment (we finish this one now) protect completion.",
    },
    low: {
      hu: "Bevált módszerekhez ragaszkodó többségnél nyomás alatt a szükséges irányváltás is elmaradhat — a stabilitás merevséggé válhat. A kis léptékű, alacsony kockázatú kísérletek biztonságosabbá tehetik a változtatást.",
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
