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
  INTE: {
    under: {
      hu: {
        headline: "Kiszámíthatóság és átláthatóság",
        action:
          "Egy hónapig minden ígéretedet írd fel, és jelöld, teljesült-e. Ahol csúszik, te szólj előbb — a bizalom ebből épül.",
      },
      en: {
        headline: "Predictability and transparency",
        action:
          "For a month, write down every commitment and mark whether you kept it. Where it slips, raise it first — trust is built there.",
      },
    },
    over: {
      hu: {
        headline: "Az érdekeid képviselete",
        action:
          "A szerénységed erő, de az érdemeidet valakinek ki kell mondania. Havonta egyszer foglald össze írásban, mit vittél véghez — tényszerűen, mentegetőzés nélkül.",
      },
      en: {
        headline: "Speaking for your own interests",
        action:
          "Modesty is a strength, but someone has to name your results. Once a month, write down what you delivered — factually, without apology.",
      },
    },
  },
  RESO: {
    under: {
      hu: {
        headline: "Ráhangolódás mások érzéseire",
        action:
          "Nehéz beszélgetés előtt kérdezd meg magadtól: mit érezhet most a másik? A találgatást mondd is ki — „úgy tűnik, ez frusztráló neked”.",
      },
      en: {
        headline: "Tuning in to how others feel",
        action:
          "Before a hard conversation, ask yourself what the other person might be feeling — and say your guess out loud: “this seems frustrating for you”.",
      },
    },
    over: {
      hu: {
        headline: "Nyomás alatti stabilitás",
        action:
          "Éles helyzetben adj magadnak 10 perc késleltetést, mielőtt reagálsz. Írd le, mi a legrosszabb reális kimenet — általában kezelhetőbb, mint amilyennek elsőre tűnik.",
      },
      en: {
        headline: "Steadiness under pressure",
        action:
          "In a heated moment, give yourself a 10-minute delay before responding. Write down the realistic worst case — it is usually smaller than it first feels.",
      },
    },
  },
  TEMP: {
    under: {
      hu: {
        headline: "Láthatóság és kezdeményezés",
        action:
          "Hetente egyszer szólalj meg olyan fórumon, ahol eddig hallgattál. Készíts elő egy mondatot — a spontaneitás nem előfeltétel.",
      },
      en: {
        headline: "Visibility and initiative",
        action:
          "Once a week, speak up in a forum where you usually stay quiet. Prepare one sentence in advance — spontaneity is not a prerequisite.",
      },
    },
    over: {
      hu: {
        headline: "Teret hagyni másoknak",
        action:
          "Megbeszéléseken számold, hányszor szólaltál meg elsőként. Próbáld ki, hogy egy körben szándékosan utolsóként beszélsz — a lendületed így nem nyomja el a csendesebbeket.",
      },
      en: {
        headline: "Leaving room for others",
        action:
          "In meetings, count how often you speak first. Try deliberately speaking last in one round — your energy then stops crowding out quieter people.",
      },
    },
  },
  ADAP: {
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
          "Az engedékenységed itt fékez: a szerep alkuhelyzeteket kíván. Gyakorold, hogy előre eldöntöd a határaidat, és egy mondatban kimondod, mi az, amiben nem engedsz.",
      },
      en: {
        headline: "Boundaries and saying no",
        action:
          "Your accommodating style slows you here: the role calls for bargaining. Decide your limits in advance and state in one sentence where you won't move.",
      },
    },
  },
  THOR: {
    under: {
      hu: {
        headline: "Következetesség és lezárás",
        action:
          "Válassz egy visszatérő feladatot, és készíts hozzá kétperces ellenőrzőlistát. Egy hónapig minden alkalommal használd — a rendszer pótolja a lendületet.",
      },
      en: {
        headline: "Consistency and finishing",
        action:
          "Pick one recurring task and build a two-minute checklist for it. Use it every time for a month — the system substitutes for momentum.",
      },
    },
    over: {
      hu: {
        headline: "A tökéletesség ára",
        action:
          "A szerep gyors, jó döntéseket kíván, nem hibátlanokat. Egy feladatnál előre írd le, mi a „elég jó”, és állj meg ott — mérd, mennyi időt nyertél.",
      },
      en: {
        headline: "The cost of perfection",
        action:
          "This role rewards fast, good decisions over flawless ones. Define “good enough” up front for one task, stop there, and measure the time you gained.",
      },
    },
  },
  OPEN: {
    under: {
      hu: {
        headline: "Kísérletezés és új nézőpontok",
        action:
          "Havonta egy bevált folyamatodat próbáld ki másképp, kis téttel. A cél nem a jobb megoldás, hanem hogy legyen összehasonlítási alapod.",
      },
      en: {
        headline: "Experimenting and new angles",
        action:
          "Once a month, run one proven process a different way, at low stakes. The goal isn't a better result — it's having something to compare against.",
      },
    },
    over: {
      hu: {
        headline: "Az ötletek földet érése",
        action:
          "A szerep stabilitást kíván. Válaszd ki a legjobb ötletedet, és három hétig CSAK azt vidd — a többit írd egy „később” listára, hogy ne vesszen el.",
      },
      en: {
        headline: "Landing the ideas",
        action:
          "This role needs stability. Pick your best idea and run only that for three weeks — park the rest on a “later” list so nothing is lost.",
      },
    },
  },
};
