// Irány-tudatos fejlődési tartalom.
//
// A v1 hibája: a "figyelendő dimenzió" nem hordozta az IRÁNYT, ezért egy nagyon
// barátságos embernek egy kemény alkupozíciójú szerepnél azt tanácsolta, hogy
// legyen még engedékenyebb. Itt minden dimenzióhoz KÉT szöveg tartozik:
// "under" = a szerep tipikus sávja alatt vagy, "over" = fölötte.

import type { DimCode } from "./types";

export type Pole = "under" | "over";

interface GrowthText {
  hu: { headline: string; action: string };
  en: { headline: string; action: string };
}

export const GROWTH_BY_POLE: Record<DimCode, Record<Pole, GrowthText>> = {
  H: {
    under: {
      hu: {
        headline: "Egyértelmű megállapodások",
        action:
          "Egy hónapig írd fel, mit vállaltál, és jelöld, ha teljesült. Ha csúszás várható, szólj időben annak, aki számít rád.",
      },
      en: {
        headline: "Predictability and transparency",
        action:
          "For a month, write down every commitment and mark whether you kept it. Where it slips, raise it first – trust is built there.",
      },
    },
    over: {
      hu: {
        headline: "Az érdekeid képviselete",
        action:
          "Havonta egyszer foglald össze írásban, mit végeztél el, és milyen eredménye lett. Ebből mások is könnyebben láthatják, mivel járultál hozzá a közös munkához.",
      },
      en: {
        headline: "Speaking for your own interests",
        action:
          "Modesty is a strength, but someone has to name your results. Once a month, write down what you delivered – factually, without apology.",
      },
    },
  },
  E: {
    under: {
      hu: {
        headline: "Figyelem az érzelmi jelzésekre",
        action:
          "Egy nehéz beszélgetésben kérdezz rá, hogyan érinti a helyzet a másikat. Például: „Mi a legnehezebb most ebben neked?” Hagyd végigmondani a válaszát.",
      },
      en: {
        headline: "Tuning in to how others feel",
        action:
          "Before a hard conversation, ask yourself what the other person might be feeling – and say your guess out loud: “this seems frustrating for you”.",
      },
    },
    over: {
      hu: {
        headline: "Higgadtabb reakció nyomás alatt",
        action:
          "Ha van rá idő egy feszült helyzetben, tarts rövid szünetet a válasz előtt. Írd le, mitől tartasz, mennyire valószínű, és mit tudnál tenni, ha bekövetkezne.",
      },
      en: {
        headline: "Steadiness under pressure",
        action:
          "In a heated moment, give yourself a 10-minute delay before responding. Write down the realistic worst case – it is usually smaller than it first feels.",
      },
    },
  },
  X: {
    under: {
      hu: {
        headline: "Megszólalás és kezdeményezés",
        action:
          "Hetente egyszer szólj hozzá olyan megbeszélésen, ahol eddig inkább hallgattál. Készíts elő egy kérdést vagy javaslatot, hogy legyen mire támaszkodnod.",
      },
      en: {
        headline: "Visibility and initiative",
        action:
          "Once a week, speak up in a forum where you usually stay quiet. Prepare one sentence in advance – spontaneity is not a prerequisite.",
      },
    },
    over: {
      hu: {
        headline: "Másokat is meghallgatni",
        action:
          "A következő megbeszélésen próbáld ki, hogy csak néhány másik hozzászóló után beszélsz. Figyeld meg, elhangzik-e olyan szempont, amelyre magadtól nem gondoltál.",
      },
      en: {
        headline: "Leaving room for others",
        action:
          "In meetings, count how often you speak first. Try deliberately speaking last in one round – your energy then stops crowding out quieter people.",
      },
    },
  },
  A: {
    under: {
      hu: {
        headline: "Együttműködés éles helyzetben",
        action:
          "Vita előtt írd le a másik fél legjobb érvét, és a beszélgetést azzal kezdd, hogy összefoglalod. Csak utána érvelj.",
      },
      en: {
        headline: "Cooperation when it gets sharp",
        action:
          "Before an argument, write down the other side's best point and open by summarising it. Argue only after that.",
      },
    },
    over: {
      hu: {
        headline: "Határok és nemet mondás",
        action:
          "Egy tárgyalás előtt írd le, miben tudsz engedni, és miben nem. Gyakorold egy mondatban elmondani, hol húzódik a határod.",
      },
      en: {
        headline: "Boundaries and saying no",
        action:
          "Your accommodating style slows you here: the role calls for bargaining. Decide your limits in advance and state in one sentence where you won't move.",
      },
    },
  },
  C: {
    under: {
      hu: {
        headline: "A feladatok végigvitele",
        action:
          "Válassz egy visszatérő feladatot, és készíts hozzá két perc alatt átnézhető ellenőrzőlistát. Egy hónapig minden alkalommal használd. A lista akkor is segít végigvinni a munkát, amikor kevésbé vagy lendületben.",
      },
      en: {
        headline: "Consistency and finishing",
        action:
          "Pick one recurring task and build a two-minute checklist for it. Use it every time for a month – the system substitutes for momentum.",
      },
    },
    over: {
      hu: {
        headline: "A tökéletesség ára",
        action:
          "Egy kisebb feladatnál előre írd le, milyen követelményeknek kell megfelelned. Ha ezek teljesültek, ellenőrizd és zárd le a munkát. Figyeld meg, mennyi időt fordítanál még olyan részletekre, amelyeket senki nem kért.",
      },
      en: {
        headline: "The cost of perfection",
        action:
          "This role rewards fast, good decisions over flawless ones. Define “good enough” up front for one task, stop there, and measure the time you gained.",
      },
    },
  },
  O: {
    under: {
      hu: {
        headline: "Kísérletezés és új nézőpontok",
        action:
          "Havonta egyszer próbálj ki más módszert egy megszokott feladatnál, ahol kevés kockázattal jár a változtatás. A cél nem feltétlenül a jobb megoldás, hanem az, hogy legyen összehasonlítási alapod.",
      },
      en: {
        headline: "Experimenting and new angles",
        action:
          "Once a month, run one proven process a different way, at low stakes. The goal isn't a better result – it's having something to compare against.",
      },
    },
    over: {
      hu: {
        headline: "Az ötletek megvalósítása",
        action:
          "Válassz ki egy megvalósítható ötletet, és tervezd meg a következő három hét lépéseit. A közben felmerülő új ötleteket írd fel későbbre, hogy a megkezdett feladatra is jusson idő.",
      },
      en: {
        headline: "Landing the ideas",
        action:
          "This role needs stability. Pick your best idea and run only that for three weeks – park the rest on a “later” list so nothing is lost.",
      },
    },
  },
};

/** Egy összegyűjtött eltérés: dimenzió + irány + hány top-szerepnél fordul elő. */
export interface GrowthGap {
  dim: DimCode;
  pole: Pole;
  count: number;
  weight: number;
}

/**
 * A felső klaszterek leggyakoribb ELTÉRÉSEI, irány-tudatosan — a
 * CareerGrowthPlan bemenete (itt él, hogy prisma nélkül tesztelhető legyen).
 *
 * H-PADLÓ-KIZÁRÁS (2026-08-11, fix): a motor a H-padlós (note === "h-floor")
 * komponenst az above-target jelzésből is kizárja — az alignment ott 100, a
 * geometriai position viszont "over" marad. A gyűjtés ugyanezt a kizárást
 * alkalmazza: nélküle a magas becsületesség-alázatú felhasználó fejlődési
 * kártyát kapott arra, hogy legyen KEVÉSBÉ őszinte — pont a kimondott
 * invariáns ellen.
 */
export function collectGrowthGaps(
  sections: {
    atLevel: Array<Array<{ components: FitComponentLike[] }>>;
    afterTraining: Array<Array<{ components: FitComponentLike[] }>>;
  },
  max = 2,
): GrowthGap[] {
  const buckets = new Map<string, GrowthGap>();
  const top = [...sections.atLevel, ...sections.afterTraining].slice(0, 2).flat();
  for (const fit of top) {
    for (const component of fit.components) {
      if (component.position === "in" || component.weight < 0.15) continue;
      // A H-padlós komponens nem eltérés: a magas H-t szándékosan nem büntetjük.
      if (component.note === "h-floor") continue;
      const key = `${component.dim}:${component.position}`;
      const existing = buckets.get(key);
      if (existing) {
        existing.count += 1;
        existing.weight += component.weight;
      } else {
        buckets.set(key, {
          dim: component.dim,
          pole: component.position,
          count: 1,
          weight: component.weight,
        });
      }
    }
  }
  return [...buckets.values()]
    .sort((a, b) => b.count - a.count || b.weight - a.weight)
    .slice(0, max);
}

/** A gyűjtéshez szükséges komponens-alak (a FitComponent szűkítése). */
export interface FitComponentLike {
  dim: DimCode;
  position: "under" | "in" | "over";
  weight: number;
  note?: "h-floor";
}
