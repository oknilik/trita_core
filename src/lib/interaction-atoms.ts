// ─────────────────────────────────────────────────────────────────────
// Interakció-szimuláció F1 — reláció-atom content-készlet.
//
// NEM archetípus×archetípus mátrix, hanem dimenzió-pár relációs atomok:
// (én pólusom) × (ő pólusa) → rövid dinamika-szöveg három blokkban
// (ami magától megy · ahol súrlódás várható · mit beszéljetek meg előre).
// A kompozíciós motor (F2, interaction-engine.ts) válogat belőlük a
// FRICTION_WEIGHTS-súlyozott sorrend szerint.
//
// Minden kimenet hipotézis-keretezésű (P1/P5-elv): a szövegek a KETTŐTÖK
// dinamikájáról beszélnek, sosem címkézik a másikat.
// Terv: docs/product/riport-interakcio-szimulacio-terv.md
// ─────────────────────────────────────────────────────────────────────

import type { TritanDimCode } from "@/lib/tritan";

export type Pole = "high" | "low";

export interface LocalizedText {
  hu: string;
  en: string;
}

/** Egy atom szöveg-blokkjai. A discuss kötelező — az a funkció magja. */
export interface AtomBlocks {
  /** Ami magától megy — a pár természetes erőssége. */
  easy?: LocalizedText;
  /** Ahol súrlódás várható — hipotézisként keretezve. */
  friction?: LocalizedText;
  /** Mit beszéljetek meg előre — konkrét, cselekvő javaslat. */
  discuss: LocalizedText;
}

export interface AtomSide {
  dim: TritanDimCode;
  pole: Pole;
}

export interface RelationAtom {
  /** Stabil azonosító: "same-THOR-high-low" | "cross-OPEN-high-THOR-high" */
  id: string;
  kind: "same" | "cross";
  a: AtomSide;
  b: AtomSide;
  /**
   * A szövegek az A-oldali olvasó nézőpontjából szólnak ("te" = a pólus).
   * symmetric=true → a két oldal felcserélhető, a B-oldali olvasó ugyanazt
   * kapja (azonos dimenzió, azonos pólus). Aszimmetrikus atomnál a viewB
   * kötelező: ugyanaz a dinamika a másik fél szemszögéből, tükrözve.
   */
  symmetric?: boolean;
  view: AtomBlocks;
  viewB?: AtomBlocks;
}

// ─────────────────────────────────────────────────────────────────────
// Azonos dimenziós atomok — 6 dimenzió × {high–high, high–low, low–low}
// ─────────────────────────────────────────────────────────────────────

export const SAME_DIMENSION_ATOMS: RelationAtom[] = [
  // ── TEMP — extraverzió (X) ──────────────────────────────────────────
  {
    id: "same-TEMP-high-high",
    kind: "same",
    a: { dim: "TEMP", pole: "high" },
    b: { dim: "TEMP", pole: "high" },
    symmetric: true,
    view: {
      easy: {
        hu: "Közös lendület: gyors tempó, sok kommunikáció, egymást húzó energia — a kezdeményezés egyikőtöknél sem akad el.",
        en: "Shared momentum: fast pace, lots of communication, energy that pulls you both forward — initiative never stalls with either of you.",
      },
      friction: {
        hu: "Mindketten viszitek a szót — előfordulhat, hogy egymás mondataira vártok sort, és a csendesebb kollégák kiszorulnak a közös terekből.",
        en: "You both carry the conversation — you may end up talking over each other, and quieter colleagues can get crowded out of shared spaces.",
      },
      discuss: {
        hu: "Beszéljétek meg, ki moderál a közös egyeztetéseken, és hogyan kap teret a környezetetek — a kettőtök dinamikája könnyen betölti a szobát.",
        en: "Agree on who moderates your shared meetings and how the people around you get airtime — the dynamic between you can easily fill the room.",
      },
    },
  },
  {
    id: "same-TEMP-high-low",
    kind: "same",
    a: { dim: "TEMP", pole: "high" },
    b: { dim: "TEMP", pole: "low" },
    view: {
      easy: {
        hu: "Jó kiegészítő páros: te hozod a lendületet és a kifelé irányuló energiát, ő a nyugodt mélységet és a fókuszált munkát.",
        en: "A complementary pair: you bring momentum and outward energy, they bring calm depth and focused work.",
      },
      friction: {
        hu: "Te úgy érezheted, egyedül húzod a kapcsolatot; ő közben azt élheti meg, hogy a sok interakció lemeríti, és nem fér szóhoz melletted.",
        en: "You may feel you're pulling the relationship alone; meanwhile they may find the volume of interaction draining and struggle to get a word in.",
      },
      discuss: {
        hu: "Egyezzetek meg a kommunikáció adagolásában: mikor kell élő egyeztetés, mi mehet írásban, és mennyi felkészülési időt kap a közös döntések előtt.",
        en: "Agree on how to dose communication: what needs a live conversation, what can go async, and how much preparation time they get before joint decisions.",
      },
    },
    viewB: {
      easy: {
        hu: "Jó kiegészítő páros: te hozod a nyugodt mélységet és a fókuszt, ő a lendületet és a kifelé irányuló energiát.",
        en: "A complementary pair: you bring calm depth and focus, they bring momentum and outward energy.",
      },
      friction: {
        hu: "A tempója és a sok interakció fáraszthat — és ha nem jelzed, ő ezt nem veszi észre, csak azt látja, hogy visszahúzódsz.",
        en: "Their pace and the volume of interaction can wear you down — and if you don't say so, they won't notice, only that you're withdrawing.",
      },
      discuss: {
        hu: "Kérj feldolgozási időt a döntések előtt, és egyezzetek meg, mi mehet írásban — a csended neki nem adat, amíg ki nem mondod.",
        en: "Ask for processing time before decisions and agree on what can go async — your silence isn't data for them until you name it.",
      },
    },
  },
  {
    id: "same-TEMP-low-low",
    kind: "same",
    a: { dim: "TEMP", pole: "low" },
    b: { dim: "TEMP", pole: "low" },
    symmetric: true,
    view: {
      easy: {
        hu: "Nyugodt, fókuszált együttműködés: kevés felesleges kör, mindkettőtöknek jólesik a csendben végzett mély munka.",
        en: "Calm, focused collaboration: few unnecessary loops, and you both enjoy deep work done in quiet.",
      },
      friction: {
        hu: "A kommunikáció elakadhat: ha egyikőtök sem kezdeményez, a fontos dolgok kimondatlanul maradnak, és ezt kívülről senki nem veszi észre.",
        en: "Communication can stall: if neither of you initiates, important things stay unsaid — and nobody outside will notice.",
      },
      discuss: {
        hu: "Tegyetek be egy rendszeres, rövid szinkronpontot, és egyezzetek meg: ki jelez, ha elakadás van — magától egyik irányból sem fog megtörténni.",
        en: "Set a regular short sync point and agree on who raises a blocker — it won't happen spontaneously from either side.",
      },
    },
  },

  // ── RESO — emocionalitás (E) ──────────────────────────────────────────────
  {
    id: "same-RESO-high-high",
    kind: "same",
    a: { dim: "RESO", pole: "high" },
    b: { dim: "RESO", pole: "high" },
    symmetric: true,
    view: {
      easy: {
        hu: "Mély kölcsönös empátia: észreveszitek egymás terheit, és nem kell magyarázni, miért nehéz egy nap — ez ritka biztonságot ad.",
        en: "Deep mutual empathy: you notice each other's load, and a hard day needs no explanation — that's a rare kind of safety.",
      },
      friction: {
        hu: "Feszült időszakban egymás aggodalmait erősíthetitek fel: közös spirál, amelyben mindketten egyre nagyobbnak látjátok a kockázatot.",
        en: "Under pressure you can amplify each other's worries: a shared spiral where the risk looks bigger to both of you with every loop.",
      },
      discuss: {
        hu: "Egyezzetek meg egy jelben, amivel bármelyikőtök megállíthatja a közös aggodalom-kört, és keressetek egy külső, tárgyilagos viszonyítási pontot.",
        en: "Agree on a signal either of you can use to stop the shared worry loop, and pick an outside, matter-of-fact reference point.",
      },
    },
  },
  {
    id: "same-RESO-high-low",
    kind: "same",
    a: { dim: "RESO", pole: "high" },
    b: { dim: "RESO", pole: "low" },
    view: {
      easy: {
        hu: "Nehéz helyzetben ő a horgony: stabil marad, amikor benned hullámzik a feszültség — ez kettőtöknek jól kiosztott szerep lehet.",
        en: "In hard moments they're the anchor: steady while tension surges in you — a well-cast pairing if you use it deliberately.",
      },
      friction: {
        hu: "Te érzéketlennek láthatod a nyugalmát, ő túlzónak a reakcióidat — és mindkét olvasat igazságtalan a másikkal.",
        en: "You may read their calm as indifference; they may read your reactions as too much — and both readings are unfair.",
      },
      discuss: {
        hu: "Tisztázzátok, mit jelent nálatok a támogatás: meghallgatást vársz vagy megoldást — és ő melyiket tudja természetesen adni.",
        en: "Clarify what support means between you: are you looking to be heard or to get a fix — and which one comes naturally to them.",
      },
    },
    viewB: {
      easy: {
        hu: "Te hozod a stabilitást a párosba: nehéz helyzetben a te nyugalmad a közös kapaszkodó.",
        en: "You bring the stability: in hard moments your calm is what you both hold onto.",
      },
      friction: {
        hu: "Az ő érzelmi jelzései neked túlzásnak tűnhetnek — pedig gyakran korai figyelmeztetések arról, amit te még nem látsz.",
        en: "Their emotional signals may look like overreaction to you — yet they're often early warnings about something you don't see yet.",
      },
      discuss: {
        hu: "Kezeld az érzelmi jelzéseit adatként, ne zajként — és mondjátok ki, milyen helyzetben melyik reakció segít a másiknak.",
        en: "Treat their emotional signals as data, not noise — and spell out which response helps whom in which situation.",
      },
    },
  },
  {
    id: "same-RESO-low-low",
    kind: "same",
    a: { dim: "RESO", pole: "low" },
    b: { dim: "RESO", pole: "low" },
    symmetric: true,
    view: {
      easy: {
        hu: "Tárgyilagos, nyugodt munkakapcsolat: krízisben is hideg fejjel döntötök, és nem terhelitek egymást érzelmi hullámokkal.",
        en: "A matter-of-fact, calm working relationship: cool heads even in a crisis, with no emotional turbulence between you.",
      },
      friction: {
        hu: "Az érzelmi jelzések elsikkadhatnak: ha valamelyikőtökben feszültség gyűlik, az sokáig láthatatlan marad — kifelé és egymás felé is.",
        en: "Emotional signals can slip through: if tension builds in either of you, it stays invisible for a long time — to others and to each other.",
      },
      discuss: {
        hu: "Iktassatok be időnként egy explicit visszajelző kört arról, hogy vagytok — nálatok ez magától nem kerül szóba, pedig kellhet.",
        en: "Schedule an occasional explicit check-in on how you're doing — between you it won't come up on its own, and sometimes it needs to.",
      },
    },
  },

  // ── INTE — becsületesség-alázat (H) ──────────────────────────────────────────────
  {
    id: "same-INTE-high-high",
    kind: "same",
    a: { dim: "INTE", pole: "high" },
    b: { dim: "INTE", pole: "high" },
    symmetric: true,
    view: {
      easy: {
        hu: "Kölcsönös alap-bizalom: egyikőtöknek sem kell a másik hátsó szándékait fürkésznie, az adott szó nálatok tényleg szerződés.",
        en: "Baseline mutual trust: neither of you has to scan for hidden agendas — a given word really is a contract between you.",
      },
      friction: {
        hu: "Ha elvi kérdésben kerültök szembe, mindketten nehezen engedtek: az elv-elv viták nálatok tovább tarthatnak, mint az érdek-viták másoknál.",
        en: "When you clash on principle, neither of you yields easily: principle-vs-principle debates can outlast anyone else's interest disputes.",
      },
      discuss: {
        hu: "Beszéljétek meg előre, mi történik, ha két elv ütközik: ki dönt, milyen szempont alapján — mielőtt egy éles helyzet kikényszeríti.",
        en: "Agree in advance what happens when two principles collide: who decides, on what grounds — before a live situation forces it.",
      },
    },
  },
  {
    id: "same-INTE-high-low",
    kind: "same",
    a: { dim: "INTE", pole: "high" },
    b: { dim: "INTE", pole: "low" },
    view: {
      easy: {
        hu: "Erős munkamegosztás lehet: ő ügyesen navigál érdekek és emberek között, te őrzöd a kereteket — együtt hatékonyak ÉS hitelesek lehettek.",
        en: "A strong division of labour: they navigate interests and people deftly, you guard the boundaries — together you can be effective AND credible.",
      },
      friction: {
        hu: "Te taktikázásnak láthatod az ő pragmatizmusát, ő naivitásnak a te elvhűségedet — és ez a kölcsönös gyanú lassan mérgezi a bizalmat.",
        en: "You may read their pragmatism as scheming; they may read your principles as naivety — and that mutual suspicion slowly poisons trust.",
      },
      discuss: {
        hu: "Húzzátok meg együtt a közös vörös vonalat: mi az, ami nálatok soha nem alku tárgya — és azon belül engedjetek teret a másik stílusának.",
        en: "Draw the shared red line together: what is never up for negotiation between you — and inside that line, give each other's style room.",
      },
    },
    viewB: {
      easy: {
        hu: "Erős munkamegosztás lehet: te gyorsan mozogsz az érdekek terében, ő stabilan tartja a kereteket — a párosotok hatékony ÉS hiteles lehet.",
        en: "A strong division of labour: you move fast through the space of interests, they hold the frame steady — your pairing can be effective AND credible.",
      },
      friction: {
        hu: "Az ő elvhűsége neked időnként merevségnek tűnhet — közben pont ez adja a párosotok külső hitelét, amire te is építesz.",
        en: "Their principles may sometimes look like rigidity to you — yet that's exactly what gives your pairing the outside credibility you build on.",
      },
      discuss: {
        hu: "Kezeld az elveit horgonynak, ne féknek — és jelezd előre, ha egy megoldásod a kereteit súrolja, mielőtt kész tények elé állítod.",
        en: "Treat their principles as an anchor, not a brake — and flag in advance when a solution of yours grazes their boundaries, before presenting a fait accompli.",
      },
    },
  },
  {
    id: "same-INTE-low-low",
    kind: "same",
    a: { dim: "INTE", pole: "low" },
    b: { dim: "INTE", pole: "low" },
    symmetric: true,
    view: {
      easy: {
        hu: "Gyors, pragmatikus alkuk: közös nyelvet beszéltek az érdekekről, és egyikőtök sem sértődik meg egy kemény tárgyalástól.",
        en: "Fast, pragmatic deals: you speak the same language of interests, and neither of you is offended by hard bargaining.",
      },
      friction: {
        hu: "A bizalom törékeny maradhat: mindketten figyelitek a másik következő lépését, és egy be nem tartott alku sokáig visszhangzik.",
        en: "Trust can stay fragile: you both watch each other's next move, and one broken deal echoes for a long time.",
      },
      discuss: {
        hu: "Rögzítsétek a megállapodásaitokat explicit módon, lehetőleg írásban — a kimondatlan feltételezés nálatok a leggyorsabb út a konfliktushoz.",
        en: "Make your agreements explicit, preferably in writing — unstated assumptions are your fastest route to conflict.",
      },
    },
  },

  // ── THOR — lelkiismeretesség (C) ────────────────────────────────────────────
  {
    id: "same-THOR-high-high",
    kind: "same",
    a: { dim: "THOR", pole: "high" },
    b: { dim: "THOR", pole: "high" },
    symmetric: true,
    view: {
      easy: {
        hu: "Megbízható működés: közös a minőségi mérce, a határidő nálatok tartható ígéret — egymás munkájára nyugodtan építhettek.",
        en: "Reliable operation: a shared quality bar, deadlines that hold — you can build on each other's work with confidence.",
      },
      friction: {
        hu: "Két kiforrott rendszer ütközhet: mindkettőtöknek megvan a maga bevált módszere, és a túltervezés közösen is el tud hatalmasodni.",
        en: "Two mature systems can collide: you each have your proven method, and over-planning can take over even as a pair.",
      },
      discuss: {
        hu: "Egyezzetek meg, mikor „elég jó a jó”, és melyik területen kié a módszertani döntés — hogy a precizitás ne csússzon perfekcionizmusba.",
        en: "Agree when good is good enough, and whose method rules in which area — so precision doesn't slide into perfectionism.",
      },
    },
  },
  {
    id: "same-THOR-high-low",
    kind: "same",
    a: { dim: "THOR", pole: "high" },
    b: { dim: "THOR", pole: "low" },
    view: {
      easy: {
        hu: "Jó vészhelyzet-páros: te struktúrát és minőséget adsz, ő gyorsan mozdul és rögtönöz — együtt rugalmas ÉS megbízható a működésetek.",
        en: "A good crisis pair: you bring structure and quality, they move fast and improvise — together you're flexible AND reliable.",
      },
      friction: {
        hu: "Ez a munkahelyi súrlódás egyik legerősebb jóslója: neked káosznak tűnhet az ő spontaneitása, neki béklyónak a te rendszered.",
        en: "This is one of the strongest predictors of workplace friction: their spontaneity can look like chaos to you, your system like shackles to them.",
      },
      discuss: {
        hu: "Osszátok fel a terepet: hol kell a te precizitásod (és ott ő igazodik), hol elég az ő tempója — plusz egy közös határidő-protokoll.",
        en: "Divide the terrain: where your precision rules (and they adapt), where their pace is enough — plus a shared deadline protocol.",
      },
    },
    viewB: {
      easy: {
        hu: "Jó vészhelyzet-páros: te hozod a mozgékonyságot és a gyors reagálást, ő a struktúrát — együtt rugalmas ÉS megbízható a működésetek.",
        en: "A good crisis pair: you bring agility and fast response, they bring structure — together you're flexible AND reliable.",
      },
      friction: {
        hu: "Ez a munkahelyi súrlódás egyik legerősebb jóslója: az ő rendszere neked béklyónak tűnhet, neki a te spontaneitásod kockázatnak.",
        en: "This is one of the strongest predictors of workplace friction: their system can feel like shackles to you, your spontaneity like risk to them.",
      },
      discuss: {
        hu: "Kérd, hogy a kereteket együtt lőjétek be, ne készen kapd — az ő rendszere biztonsági háló is, amire vészhelyzetben te támaszkodsz.",
        en: "Ask to set the guardrails together rather than receiving them ready-made — their system is also the safety net you lean on in a crisis.",
      },
    },
  },
  {
    id: "same-THOR-low-low",
    kind: "same",
    a: { dim: "THOR", pole: "low" },
    b: { dim: "THOR", pole: "low" },
    symmetric: true,
    view: {
      easy: {
        hu: "Rugalmas, spontán együttműködés: gyorsan irányt váltotok, és egyikőtök sem akad fenn a részleteken vagy a formaságokon.",
        en: "Flexible, spontaneous collaboration: you change direction fast, and neither of you gets hung up on detail or formality.",
      },
      friction: {
        hu: "A részletek és határidők közösen is elcsúszhatnak — és mivel egyikőtök sem tartja számon őket, ez kifelé is látszani fog.",
        en: "Details and deadlines can slip even as a pair — and since neither of you tracks them, it will show on the outside too.",
      },
      discuss: {
        hu: "Állapodjatok meg egy minimális közös struktúrában (ki, mit, mikorra), és kérjetek külső horgonyt — naptárt, eszközt vagy harmadik embert.",
        en: "Agree on a minimal shared structure (who, what, by when) and get an external anchor — a calendar, a tool, or a third person.",
      },
    },
  },

  // ── ADAP — barátságosság (A) ───────────────────────────────────────────
  {
    id: "same-ADAP-high-high",
    kind: "same",
    a: { dim: "ADAP", pole: "high" },
    b: { dim: "ADAP", pole: "high" },
    symmetric: true,
    view: {
      easy: {
        hu: "Harmonikus, türelmes páros: könnyen engedtek egymásnak, ritka a nyílt konfliktus, és kellemes veletek egy térben dolgozni.",
        en: "A harmonious, patient pair: you yield to each other easily, open conflict is rare, and you're pleasant to share a room with.",
      },
      friction: {
        hu: "A valódi nézeteltérések a szőnyeg alá kerülhetnek: mindketten kerülitek az élt, ezért a döntések elodázódnak, a feszültség pedig gyűlik.",
        en: "Real disagreements can get swept under the rug: you both avoid the edge, so decisions get postponed and tension quietly builds.",
      },
      discuss: {
        hu: "Találjatok egy strukturált formát a vitának — pró-kontra kör, írásos érvelés —, hogy az ellenvélemény ne udvariasságból haljon el.",
        en: "Find a structured format for disagreement — a pro-con round, written arguments — so dissent doesn't die of politeness.",
      },
    },
  },
  {
    id: "same-ADAP-high-low",
    kind: "same",
    a: { dim: "ADAP", pole: "high" },
    b: { dim: "ADAP", pole: "low" },
    view: {
      easy: {
        hu: "Ő kimondja, amit te lenyelnél, te tompítod, amit ő élezne — jól kalibrálva ez a páros őszinte ÉS emberséges tud lenni.",
        en: "They say what you'd swallow; you soften what they'd sharpen — well calibrated, this pair can be honest AND humane.",
      },
      friction: {
        hu: "Az ő direktsége bántónak érződhet, miközben ő a te diplomáciádat érezheti kertelésnek — és mindketten a saját stílusotokat tartjátok normálisnak.",
        en: "Their directness can feel hurtful, while your diplomacy can feel evasive to them — and you each consider your own style the normal one.",
      },
      discuss: {
        hu: "Kössetek kritika-protokollt: mikor, milyen formában, milyen éllel — és mi az a mondat, amivel bármelyikőtök jelezheti, hogy ez most sok volt.",
        en: "Agree a feedback protocol: when, in what form, with how much edge — and the sentence either of you can use to say that was too much.",
      },
    },
    viewB: {
      easy: {
        hu: "Te hozod az egyenességet, ő a tapintatot — jól kalibrálva ez a páros őszinte ÉS emberséges tud lenni.",
        en: "You bring the directness, they bring the tact — well calibrated, this pair can be honest AND humane.",
      },
      friction: {
        hu: "Az ő visszafogottsága neked kertelésnek tűnhet — pedig a türelme kapcsolati tőke, amiből a párosotok is gazdálkodik.",
        en: "Their restraint can look like evasion to you — yet their patience is relational capital your pairing also spends.",
      },
      discuss: {
        hu: "Kérdezd meg, hogyan esik jól neki a kritika, és tartsd magad hozzá — az éles megfogalmazásod nála nem hatékonyabb, csak drágább.",
        en: "Ask how they best receive criticism and stick to it — with them, your sharpest phrasing isn't more effective, just more costly.",
      },
    },
  },
  {
    id: "same-ADAP-low-low",
    kind: "same",
    a: { dim: "ADAP", pole: "low" },
    b: { dim: "ADAP", pole: "low" },
    symmetric: true,
    view: {
      easy: {
        hu: "Egyenes beszéd mindkét irányban: gyorsan kimondjátok a bajt, nincs rejtett feszültség, a vitáitok legalább tiszták.",
        en: "Straight talk both ways: problems get named fast, there's no hidden tension, and your arguments are at least clean.",
      },
      friction: {
        hu: "A viták eszkalálódhatnak: mindketten élesen fogalmaztok és nehezen engedtek — a tárgyi vita könnyen presztízs-kérdéssé válik.",
        en: "Arguments can escalate: you both phrase things sharply and yield reluctantly — a factual debate easily turns into a matter of pride.",
      },
      discuss: {
        hu: "Vezessetek be vita-szabályokat: a téma és a személy szétválasztása, plusz egy time-out jel, amit bármelyikőtök bemondhat.",
        en: "Set debate rules: separate the issue from the person, plus a time-out signal either of you can call.",
      },
    },
  },

  // ── OPEN — nyitottság ──────────────────────────────────────────────
  {
    id: "same-OPEN-high-high",
    kind: "same",
    a: { dim: "OPEN", pole: "high" },
    b: { dim: "OPEN", pole: "high" },
    symmetric: true,
    view: {
      easy: {
        hu: "Pezsgő közös ötletelés: egymás gondolataira építkeztek, és a kísérletezés nálatok nem kockázat, hanem alapállapot.",
        en: "Sparkling co-ideation: you build on each other's thoughts, and experimenting isn't a risk for you — it's the default state.",
      },
      friction: {
        hu: "Sok indítás, kevés lezárás: az új ötlet mindig vonzóbb a befejezésnél, és egyikőtök sem tartja magától a fókuszt.",
        en: "Many launches, few landings: the new idea always beats finishing, and neither of you holds focus naturally.",
      },
      discuss: {
        hu: "Vezessetek ötlet-parkolót és egy explicit döntési pontot: mikor váltotok ötletelésből kivitelezésbe — és ki mondja ki a váltást.",
        en: "Keep an idea parking lot and an explicit decision point: when you switch from ideation to execution — and who calls the switch.",
      },
    },
  },
  {
    id: "same-OPEN-high-low",
    kind: "same",
    a: { dim: "OPEN", pole: "high" },
    b: { dim: "OPEN", pole: "low" },
    view: {
      easy: {
        hu: "Jó szűrőpáros: te hozod az új irányokat, ő a bevált módszerek erejét — ami kettőtök rostáján átmegy, az általában életképes.",
        en: "A good filtering pair: you bring new directions, they bring the strength of proven methods — what passes both your sieves tends to be viable.",
      },
      friction: {
        hu: "A szkepszise falnak érződhet, miközben ő a kísérletezésedet érezheti felesleges kockázatnak — és mindketten fárasztónak a másik reflexét.",
        en: "Their scepticism can feel like a wall, while your experimenting can feel like needless risk to them — and each finds the other's reflex tiring.",
      },
      discuss: {
        hu: "Jelöljetek ki kísérleti sávot: mekkora téttel szabad próbálkozni jóváhagyás nélkül — és mi az a bizonyíték, ami őt is meggyőzi.",
        en: "Mark out an experimentation lane: how much stake can be risked without sign-off — and what evidence would convince them too.",
      },
    },
    viewB: {
      easy: {
        hu: "Jó szűrőpáros: te a működő megoldások őre vagy, ő az új irányok forrása — ami kettőtök rostáján átmegy, az általában életképes.",
        en: "A good filtering pair: you guard what works, they source new directions — what passes both your sieves tends to be viable.",
      },
      friction: {
        hu: "Az ötletzuhataga fárasztó lehet, és úgy érezheted, a stabilitást egyedül te véded — miközben ő a kérdéseidet érzi falnak.",
        en: "Their cascade of ideas can be tiring, and you may feel you alone defend stability — while they experience your questions as a wall.",
      },
      discuss: {
        hu: "Kezeld az ötleteit nyersanyagnak, ne javaslatnak: közös szűrőt kérj, ne azonnali döntést — és mondd ki, milyen bizonyíték győzne meg.",
        en: "Treat their ideas as raw material, not proposals: ask for a shared filter rather than an instant verdict — and name the evidence that would win you over.",
      },
    },
  },
  {
    id: "same-OPEN-low-low",
    kind: "same",
    a: { dim: "OPEN", pole: "low" },
    b: { dim: "OPEN", pole: "low" },
    symmetric: true,
    view: {
      easy: {
        hu: "Kiszámítható, pragmatikus működés: bevált eszközökkel dolgoztok, és egyikőtök sem borítja fel a rendszert egy divatos ötlet miatt.",
        en: "Predictable, pragmatic operation: you work with proven tools, and neither of you upends the system for a fashionable idea.",
      },
      friction: {
        hu: "Az újítás elmaradhat: ha a környezetetek változik, kettőtök közül senki nem hozza be időben az új impulzust.",
        en: "Innovation can stall: when your environment shifts, neither of you brings in the new impulse in time.",
      },
      discuss: {
        hu: "Egyezzetek meg, honnan jön a friss input: kinek a dolga körülnézni — konferencia, versenytárs-figyelés, külső szem — és milyen ütemben.",
        en: "Agree where fresh input comes from: whose job it is to scan — conferences, competitor watch, an outside eye — and how often.",
      },
    },
  },
];

// ─────────────────────────────────────────────────────────────────────
// Kereszt-atomok — a súrlódás-modell (FRICTION_WEIGHTS) top-jóslói mentén
// válogatott kiemelt párok. Mindegyik aszimmetrikus: viewB kötelező.
// ─────────────────────────────────────────────────────────────────────

export const CROSS_DIMENSION_ATOMS: RelationAtom[] = [
  {
    id: "cross-OPEN-high-THOR-high",
    kind: "cross",
    a: { dim: "OPEN", pole: "high" },
    b: { dim: "THOR", pole: "high" },
    view: {
      easy: {
        hu: "Kettőtökben megvan a teljes lánc: te hozod az ötletet és az irányt, ő a kivitelezés fegyelmét — az ilyen párosok szállítanak.",
        en: "Between you the whole chain exists: you bring the idea and direction, they bring execution discipline — pairs like this ship.",
      },
      friction: {
        hu: "Az ötleteid az ő mércéjéhez képest félkészen érkeznek, az ő pontosító kérdései pedig neked fékként érződnek — pedig ugyanazt a célt szolgálják.",
        en: "By their bar your ideas arrive half-baked, and their clarifying questions feel like brakes to you — though both serve the same goal.",
      },
      discuss: {
        hu: "Definiáljátok az átadási pontot: mikor lép egy ötlet a rendszerébe — és addig milyen kidolgozottságot vár el tőled jogosan.",
        en: "Define the handover point: when an idea enters their system — and what level of polish they can fairly expect from you until then.",
      },
    },
    viewB: {
      easy: {
        hu: "Kettőtökben megvan a teljes lánc: ő hozza az irányt és a nyersanyagot, te teszed megvalósíthatóvá — az ilyen párosok szállítanak.",
        en: "Between you the whole chain exists: they bring direction and raw material, you make it buildable — pairs like this ship.",
      },
      friction: {
        hu: "A félkész ötletek zavarhatják a rendszeredet, és a kérdéseidet ő lelombozásnak élheti meg — pedig te épp komolyan veszed őket.",
        en: "Half-baked ideas can disturb your system, and they may experience your questions as deflating — when in fact you're taking them seriously.",
      },
      discuss: {
        hu: "Kérj korai bevonást a kész tervek helyett: ha az ötlet-fázisban ott vagy, a rendszered nem utólagos szűrő lesz, hanem közös eszköz.",
        en: "Ask for early involvement instead of finished plans: if you're there at idea stage, your system becomes a shared tool, not an after-the-fact filter.",
      },
    },
  },
  {
    id: "cross-OPEN-high-THOR-low",
    kind: "cross",
    a: { dim: "OPEN", pole: "high" },
    b: { dim: "THOR", pole: "low" },
    view: {
      easy: {
        hu: "Gyors, lelkes indulás: ő azonnal vevő az ötleteidre, és nem lassít adminisztrációval — minden új dolog könnyen elstartol nálatok.",
        en: "Fast, enthusiastic starts: they're instantly on board with your ideas and never slow things with admin — everything new launches easily.",
      },
      friction: {
        hu: "Senki nem zárja le a köröket: csupa nyitott szál marad utánatok, és a környezetetek tanulja meg, hogy nálatok az ígéret nem terv.",
        en: "Nobody closes the loops: you leave open threads behind, and people around you learn that with you two a promise isn't a plan.",
      },
      discuss: {
        hu: "Nevezzetek meg befejezés-felelőst minden közös kezdeményezéshez, és kössétek külső határidőhöz — belső magától nem lesz.",
        en: "Name a finishing owner for every joint initiative and tie it to an external deadline — an internal one won't emerge on its own.",
      },
    },
    viewB: {
      easy: {
        hu: "Gyors, lelkes indulás: az ötletei jó terepet adnak a rugalmasságodnak, és egyikőtök sem ragad le a formaságoknál.",
        en: "Fast, enthusiastic starts: their ideas give your flexibility good terrain, and neither of you gets stuck on formalities.",
      },
      friction: {
        hu: "Az irányok gyakran váltanak, és mivel te sem tartod számon a szálakat, a közös munkáitok könnyen félbe maradnak.",
        en: "Directions change often, and since you don't track the threads either, your joint work easily stays half-done.",
      },
      discuss: {
        hu: "Egyezzetek meg, melyik közös vállalás számít lezárandónak — és azt kicsiben tartsátok, hogy tényleg a végére érjetek.",
        en: "Agree which joint commitments count as must-finish — and keep those small enough that you actually reach the end.",
      },
    },
  },
  {
    id: "cross-THOR-high-ADAP-low",
    kind: "cross",
    a: { dim: "THOR", pole: "high" },
    b: { dim: "ADAP", pole: "low" },
    view: {
      easy: {
        hu: "Magas mérce találkozik egyenes visszajelzéssel: nála hamar megtudod, mi nem működik, és a minőség gyorsan javul körülöttetek.",
        en: "A high bar meets straight feedback: with them you learn fast what isn't working, and quality improves quickly around you.",
      },
      friction: {
        hu: "A kritikája időnként a rendszeredet is találja: te a kereteid megkérdőjelezésének érzed, ő feleslegesnek a szabályaidat.",
        en: "Their criticism sometimes hits your system too: you feel your framework challenged, they find your rules unnecessary.",
      },
      discuss: {
        hu: "Tisztázzátok, mi a kritika terepe: a kimenet vitatható, a futó folyamat kerete nem — utólagos retró igen, menet közbeni borítás nem.",
        en: "Clarify the arena for criticism: output is debatable, the frame of a running process is not — retro afterwards yes, mid-flight overturn no.",
      },
    },
    viewB: {
      easy: {
        hu: "Egyenes visszajelzésed jó helyre érkezik: ő komolyan veszi a minőséget, és a jelzéseidből tényleg javít — nem sértődik, dolgozik.",
        en: "Your straight feedback lands well: they take quality seriously and actually improve from your signals — no sulking, just work.",
      },
      friction: {
        hu: "A szabályai neked kontrollnak érződhetnek, és amikor a rendszerét kritizálod, ő azt személyes találatként éli meg.",
        en: "Their rules can feel like control to you, and when you criticise their system they experience it as a personal hit.",
      },
      discuss: {
        hu: "Válaszd szét a jelzéseidben a kimenetet és a módszert: a módszer-kritikát időzítsd retróra — ott nyitott rá, menet közben védekezik.",
        en: "Separate output from method in your feedback: schedule method critique for the retro — they're open to it there, defensive mid-flight.",
      },
    },
  },
  {
    id: "cross-THOR-high-TEMP-high",
    kind: "cross",
    a: { dim: "THOR", pole: "high" },
    b: { dim: "TEMP", pole: "high" },
    view: {
      easy: {
        hu: "Az ő lendülete a te szervezettségeddel párosulva ritka kombináció: nálatok az elindított dolgok célba is érnek.",
        en: "Their momentum paired with your organisation is a rare combination: with you two, what gets started actually arrives.",
      },
      friction: {
        hu: "Ő már három új dolgot elindított, mire te az elsőt lezárnád — a félkész szálak a te rendszeredben landolnak.",
        en: "They've launched three new things by the time you'd close the first — and the loose threads land in your system.",
      },
      discuss: {
        hu: "Vezessetek közös WIP-limitet: mennyi futhat párhuzamosan, és mit kell lezárni, mielőtt új indul — ezt neki is látnia kell, ne csak neked.",
        en: "Keep a shared WIP limit: how much runs in parallel, and what must close before something new starts — visible to them, not just you.",
      },
    },
    viewB: {
      easy: {
        hu: "A lendületed az ő szervezettségével párosulva ritka kombináció: nálatok az elindított dolgok célba is érnek.",
        en: "Your momentum paired with their organisation is a rare combination: with you two, what gets started actually arrives.",
      },
      friction: {
        hu: "A tempód az ő rendszerében torlódik: amit te új lehetőségnek látsz, az nála sorban álló, lezáratlan kötelezettség.",
        en: "Your pace queues up inside their system: what you see as a new opportunity is, for them, another open obligation in the backlog.",
      },
      discuss: {
        hu: "Kérdezd meg indítás előtt, mi fér bele a közös sávba — a lelkesedésed így szövetségest kap, nem szűk keresztmetszetet.",
        en: "Before launching, ask what fits the shared lane — that way your enthusiasm gains an ally instead of a bottleneck.",
      },
    },
  },
  {
    id: "cross-TEMP-high-RESO-high",
    kind: "cross",
    a: { dim: "TEMP", pole: "high" },
    b: { dim: "RESO", pole: "high" },
    view: {
      easy: {
        hu: "Élénk, érzelmileg jelenlévő kapcsolat: ő hamar észreveszi, ha valami nincs rendben — veled vagy a csapattal —, te pedig gyorsan tudsz rá mozdulni.",
        en: "A lively, emotionally present relationship: they quickly notice when something's off — with you or the team — and you can act on it fast.",
      },
      friction: {
        hu: "A tempód és az intenzitásod érzelmileg terhelheti: ő nem lassúbb nálad, csak több minden ér el hozzá — és visszajelzés nélkül ezt nem látod.",
        en: "Your pace and intensity can weigh on them emotionally: they're not slower than you, more just reaches them — and without feedback you won't see it.",
      },
      discuss: {
        hu: "Vezessetek be tempó-checket: egy egyszerű jelzést, amivel szólhat, hogy most sok — mielőtt a terhelés tünetekben jelentkezne.",
        en: "Introduce a pace check: a simple signal they can use to say it's too much right now — before the load shows up as symptoms.",
      },
    },
    viewB: {
      easy: {
        hu: "Élénk, érzelmileg jelenlévő kapcsolat: te hamar megérzed, ha valami nincs rendben, ő pedig gyorsan mozdul rá — jó korai-jelzőrendszer vagytok.",
        en: "A lively, emotionally present relationship: you sense early when something's off, and they move on it fast — you make a good early-warning system.",
      },
      friction: {
        hu: "Az energiája magával ragadó, de ki is meríthet — és ha nem jelzed, ő a visszahúzódásodat érdektelenségnek olvashatja.",
        en: "Their energy is infectious but can also drain you — and if you don't say so, they may read your withdrawal as disinterest.",
      },
      discuss: {
        hu: "Állapodjatok meg egy jelben, amivel kérhetsz lassítást vagy szünetet — nála ez működik, csak explicitté kell tenni.",
        en: "Agree on a signal you can use to ask for a slowdown or a break — it works with them, it just has to be explicit.",
      },
    },
  },
  {
    id: "cross-TEMP-low-RESO-high",
    kind: "cross",
    a: { dim: "TEMP", pole: "low" },
    b: { dim: "RESO", pole: "high" },
    view: {
      easy: {
        hu: "Figyelmes, kíméletes páros: te nem nyomasztod tempóval, ő pedig észreveszi és tiszteletben tartja a határaidat.",
        en: "An attentive, gentle pair: you don't press with pace, and they notice and respect your boundaries.",
      },
      friction: {
        hu: "Kimondatlan érzések találkoznak kevés kommunikációval: ő sokat érez, te keveset mondasz — a feszültség némán nőhet kettőtök között.",
        en: "Unspoken feelings meet sparse communication: they feel a lot, you say little — tension can grow silently between you.",
      },
      discuss: {
        hu: "Iktassatok be rendszeres kétszemélyes check-int: neki tér kell, hogy kimondja, amit érez, neked pedig keret, amiben ez nem teher.",
        en: "Schedule a regular one-on-one check-in: they need space to voice what they feel, you need a frame in which that isn't a burden.",
      },
    },
    viewB: {
      easy: {
        hu: "Figyelmes, kíméletes páros: ő nyugodt teret ad, amiben az érzékenységed nem túlinger, hanem erőforrás.",
        en: "An attentive, gentle pair: they give you calm space where your sensitivity is a resource, not an overload.",
      },
      friction: {
        hu: "A csendje kiszámíthatatlannak érződhet: keveset jelez vissza, te pedig hajlamos lehetsz a hallgatását rossz hírként olvasni.",
        en: "Their quiet can feel unreadable: they signal little back, and you may tend to read their silence as bad news.",
      },
      discuss: {
        hu: "Kérj tőle explicit visszajelzést fix pontokon — nála a csend nem elégedetlenség, de ezt hallanod is kell, nem csak tudnod.",
        en: "Ask them for explicit feedback at fixed points — with them silence isn't displeasure, but you need to hear that, not just know it.",
      },
    },
  },
  {
    id: "cross-INTE-high-ADAP-low",
    kind: "cross",
    a: { dim: "INTE", pole: "high" },
    b: { dim: "ADAP", pole: "low" },
    view: {
      easy: {
        hu: "Mindketten kimondjátok az igazat — nálad elvből, nála vérmérsékletből. A kettőtök közelében ritkán élnek meg hazugságok.",
        en: "You both speak the truth — you on principle, they by temperament. Lies rarely survive near the two of you.",
      },
      friction: {
        hu: "A kritikája időnként embereket talál, nem csak hibákat — és ez a te fair-play-mércédet sérti, akkor is, ha tartalmilag igaza van.",
        en: "Their criticism sometimes hits people, not just faults — and that violates your fair-play standard even when they're factually right.",
      },
      discuss: {
        hu: "Egyezzetek meg, hogyan marad a vita tényeknél: mi a megengedett él, és ki jelezheti, ha a kritika személybe fordult.",
        en: "Agree how debate stays factual: how much edge is allowed, and who may call it when criticism turns personal.",
      },
    },
    viewB: {
      easy: {
        hu: "Mindketten kimondjátok az igazat — te vérmérsékletből, ő elvből. A kettőtök közelében ritkán élnek meg hazugságok.",
        en: "You both speak the truth — you by temperament, they on principle. Lies rarely survive near the two of you.",
      },
      friction: {
        hu: "Az elvei neked időnként finomkodásnak tűnhetnek — pedig nem a konfliktust kerüli, hanem a méltánytalanságot; ez nála éles határ.",
        en: "Their principles may sometimes look like squeamishness to you — but they're not avoiding conflict, they're avoiding unfairness; for them that line is sharp.",
      },
      discuss: {
        hu: "Tartsd a kritikát a teljesítményen és a tényeken — nála így a legélesebb mondatod is partner marad, személyeskedve a leghalkabb is ellenfél.",
        en: "Keep criticism on performance and facts — that way even your sharpest sentence stays an ally with them; personal, even your quietest becomes an adversary.",
      },
    },
  },
  {
    id: "cross-INTE-high-OPEN-high",
    kind: "cross",
    a: { dim: "INTE", pole: "high" },
    b: { dim: "OPEN", pole: "high" },
    view: {
      easy: {
        hu: "Felelős kísérletezés: ő újít, te őrzöd a kereteket — a párosotok mer is, meg megbízható is marad.",
        en: "Responsible experimentation: they innovate, you guard the boundaries — your pairing dares and stays trustworthy at once.",
      },
      friction: {
        hu: "Egyes ötletei a szabály- és etikai kereteidet feszegetik: neki izgalmas szürkezóna, neked átléphetetlen határ.",
        en: "Some of their ideas push at your rules and ethical lines: an exciting grey zone for them, a hard boundary for you.",
      },
      discuss: {
        hu: "Rajzoljátok fel együtt a kísérletezés kereteit: mi a szabad sáv, mi az egyeztetés-köteles, és mi az, ami nálad soha nem játszik.",
        en: "Map the experimentation frame together: what's a free lane, what needs sign-off, and what is never in play for you.",
      },
    },
    viewB: {
      easy: {
        hu: "Felelős kísérletezés: te újítasz, ő a keretek őre — a párosotok mer is, meg megbízható is marad.",
        en: "Responsible experimentation: you innovate, they guard the boundaries — your pairing dares and stays trustworthy at once.",
      },
      friction: {
        hu: "A határai neked időnként lassítónak tűnhetnek — de a hitelesség, amit ő épít, pont az a tőke, amiből a merészebb ötleteid hitelt kapnak.",
        en: "Their limits may sometimes feel like drag — but the credibility they build is exactly the capital that gets your bolder ideas funded.",
      },
      discuss: {
        hu: "Vidd hozzá korán a határeseteket: ha az aggályát tervezési inputként kezeled, szövetséges lesz — utólag szembesítve vétójátékos.",
        en: "Bring edge cases to them early: treat their concern as design input and they're an ally — confront them after the fact and they're a veto player.",
      },
    },
  },
  {
    id: "cross-RESO-high-ADAP-low",
    kind: "cross",
    a: { dim: "RESO", pole: "high" },
    b: { dim: "ADAP", pole: "low" },
    view: {
      easy: {
        hu: "Ő gyorsan kimondja, amit te már régóta megérzel — a párosotok hamar felszínre hozza, ami másutt hónapokig lappangana.",
        en: "They quickly say out loud what you've long sensed — your pairing surfaces in days what would fester elsewhere for months.",
      },
      friction: {
        hu: "Az éles stílusa érzelmileg megterhelhet: ami neki „csak őszinteség”, az nálad napokig visszhangzik.",
        en: "Their sharp style can weigh on you emotionally: what's 'just honesty' to them echoes in you for days.",
      },
      discuss: {
        hu: "Kérj kritikát él nélkül, kontextussal — és mondd ki, hogy nálad nem a tartalom fáj, hanem a forma; ezen ő tud állítani, ha tudja, mit.",
        en: "Ask for criticism without the edge, with context — and say plainly that it's the form, not the content, that hurts; they can adjust it once they know what to adjust.",
      },
    },
    viewB: {
      easy: {
        hu: "Te kimondod, amit ő megérez — a párosotok hamar felszínre hozza, ami másutt hónapokig lappangana.",
        en: "You say out loud what they sense — your pairing surfaces in days what would fester elsewhere for months.",
      },
      friction: {
        hu: "A jelzéseid nála mélyebbre hatolnak, mint gondolnád: nem sértődékeny — érzékeny; a különbség neked apró, neki minden.",
        en: "Your signals land deeper with them than you think: they're not touchy — they're sensitive; a small difference to you, everything to them.",
      },
      discuss: {
        hu: "Puhítsd a formát, ne az üzenetet: nála a kímélet nem gyengíti a kritikát, hanem célba juttatja.",
        en: "Soften the form, not the message: with them, gentleness doesn't dilute criticism — it's what makes it land.",
      },
    },
  },
  {
    id: "cross-RESO-low-ADAP-high",
    kind: "cross",
    a: { dim: "RESO", pole: "low" },
    b: { dim: "ADAP", pole: "high" },
    view: {
      easy: {
        hu: "Nyugodt, kiegyensúlyozott működés: te stabil vagy, ő türelmes — a kettőtök közelében ritka a dráma.",
        en: "Calm, balanced operation: you're steady, they're patient — drama is rare anywhere near the two of you.",
      },
      friction: {
        hu: "Mindketten kerülitek a mély egyeztetést: te nem érzed szükségét, ő nem meri felhozni — a kényes témák így sosem kerülnek elő.",
        en: "You both avoid deeper alignment: you don't feel the need, they don't dare raise it — so the delicate topics never surface.",
      },
      discuss: {
        hu: "Nevezzétek meg, ki hozza fel a kényes témákat és milyen ritmusban — nálatok ez a szerep magától betöltetlen marad.",
        en: "Name who raises the delicate topics and at what rhythm — between you, that role stays vacant by default.",
      },
    },
    viewB: {
      easy: {
        hu: "Nyugodt, kiegyensúlyozott működés: ő stabil, te türelmes vagy — a kettőtök közelében ritka a dráma.",
        en: "Calm, balanced operation: they're steady, you're patient — drama is rare anywhere near the two of you.",
      },
      friction: {
        hu: "A tárgyilagossága miatt nehéz leolvasnod, hányadán álltok — te pedig rákérdezés helyett inkább alkalmazkodsz, így a bizonytalanság marad.",
        en: "Their matter-of-factness makes it hard to read where you stand — and you adapt rather than ask, so the uncertainty stays.",
      },
      discuss: {
        hu: "Kérdezz rá közvetlenül arra, amit sejtesz — nála a direkt kérdés nem konfliktus, hanem hatékonyság, és pontos választ kapsz.",
        en: "Ask directly about what you suspect — for them a direct question isn't conflict, it's efficiency, and you'll get a precise answer.",
      },
    },
  },
  {
    id: "cross-THOR-high-RESO-high",
    kind: "cross",
    a: { dim: "THOR", pole: "high" },
    b: { dim: "RESO", pole: "high" },
    view: {
      easy: {
        hu: "Az általad épített kiszámíthatóság neki biztonságot ad: a rendszered csökkenti a bizonytalanságot, amire ő a legérzékenyebb.",
        en: "The predictability you build gives them safety: your system reduces exactly the uncertainty they're most sensitive to.",
      },
      friction: {
        hu: "Határidő-nyomás alatt az aggodalma a te feszültségedet is emeli — és a te szigorodó kontrollod az övét: kölcsönösen pörgetitek egymást.",
        en: "Under deadline pressure their worry raises your tension — and your tightening control raises theirs: you wind each other up.",
      },
      discuss: {
        hu: "Készítsetek terv B-t nyugodt időben, és egyezzetek meg, ki mondja ki, hogy csúszunk — a kimondott csúszás nálatok kisebb kár, mint a néma pánik.",
        en: "Make a plan B in calm times and agree who calls the slip — a named delay costs you two less than silent panic.",
      },
    },
    viewB: {
      easy: {
        hu: "A rendszere neked biztonságot ad: kiszámítható keretek között az érzékenységed erőforrás, nem terhelés.",
        en: "Their system gives you safety: inside predictable frames your sensitivity is a resource, not a load.",
      },
      friction: {
        hu: "Amikor nála feszül a határidő, a kontrollja szigorodik — te ezt könnyen magadra veszed, pedig a helyzetnek szól, nem neked.",
        en: "When their deadline tightens, so does their control — you easily take that personally, though it's aimed at the situation, not you.",
      },
      discuss: {
        hu: "Kérdezd meg nyomás alatt, mi segít neki — és jelezd korán a saját terhelésed: az ő rendszere tud alkalmazkodni, ha időben kap adatot.",
        en: "Under pressure, ask what helps them — and flag your own load early: their system can adapt when it gets data in time.",
      },
    },
  },
  {
    id: "cross-TEMP-high-OPEN-high",
    kind: "cross",
    a: { dim: "TEMP", pole: "high" },
    b: { dim: "OPEN", pole: "high" },
    view: {
      easy: {
        hu: "Ti vagytok a kezdeményező motor: az ő ötletei a te lendületeddel párosulva gyorsan mozgásba hoznak bármit — és bárkit.",
        en: "You two are the initiative engine: their ideas paired with your momentum set anything — and anyone — in motion fast.",
      },
      friction: {
        hu: "Sok indítás, kevés érkezés: a környezetetek nem tudja követni a tempót, és a lelkesedésetek kifelé kapkodásnak tűnhet.",
        en: "Many launches, few landings: people around you can't track the pace, and your shared enthusiasm can read as scatter from outside.",
      },
      discuss: {
        hu: "Egyezzetek meg, mit kommunikáltok kifelé és mikor: mi a kísérlet és mi az elköteleződés — a környezetetek e kettőt nem tudja megkülönböztetni, ha ti nem mondjátok.",
        en: "Agree what you communicate outward and when: what's an experiment versus a commitment — people can't tell the two apart unless you say so.",
      },
    },
    viewB: {
      easy: {
        hu: "Ti vagytok a kezdeményező motor: a te ötleteid az ő lendületével párosulva gyorsan mozgásba hoznak bármit — és bárkit.",
        en: "You two are the initiative engine: your ideas paired with their momentum set anything — and anyone — in motion fast.",
      },
      friction: {
        hu: "Az energiája az éretlen ötleteidet is azonnal terjeszti — mire átgondolnád, már hárman dolgoznak rajta.",
        en: "Their energy broadcasts even your unripe ideas instantly — by the time you'd think it through, three people are already working on it.",
      },
      discuss: {
        hu: "Jelöld meg az ötleteidet: „hangosan gondolkodom” vagy „ezt tényleg csináljuk” — nála enélkül minden felvetés startjel.",
        en: "Label your ideas: 'thinking out loud' versus 'let's actually do this' — without the label, every musing is a starting gun to them.",
      },
    },
  },
];

// ─────────────────────────────────────────────────────────────────────
// Vezető-kiegészítők — mit jelent, ha a POLARIZÁLT dimenzió a vezetőnél
// van. Az olvasó a beosztott; a szöveg a vezető-mód kapcsolóval jelenik
// meg az atomok mellett.
// ─────────────────────────────────────────────────────────────────────

export const LEADER_SUPPLEMENTS: Record<
  TritanDimCode,
  Record<Pole, LocalizedText>
> = {
  TEMP: {
    high: {
      hu: "Energikus, gyors döntésű vezető: a meetingjei pörögnek, és aki hangosabb, könnyebben kap teret. Kérj strukturált szót — napirendi pontot, írásos felvezetést —, mert a csend nála könnyen egyetértésnek látszik.",
      en: "An energetic, fast-deciding leader: their meetings move quickly, and louder voices get the floor more easily. Ask for structured airtime — an agenda item, a written brief — because to them silence easily looks like agreement.",
    },
    low: {
      hu: "Csendes, visszafogott vezető: kevés spontán visszajelzést ad, és nem tölti ki a teret — ez nem távolságtartás. Kérdezz rá aktívan az értékelésére: nála a csend nem elégedetlenség, de a dicséret sem hangos.",
      en: "A quiet, reserved leader: little spontaneous feedback, and they don't fill the room — that's not distance. Ask actively for their read: with them silence isn't displeasure, but praise isn't loud either.",
    },
  },
  RESO: {
    high: {
      hu: "Érzelmileg jelenlévő vezető: a hangulata érződik a csapaton, és a terheket komolyan veszi — a tiédet is. Az őszinte jelzést értékeli, de időzítsd: feszült pillanatban a rossz hír nála felerősödik.",
      en: "An emotionally present leader: their mood carries through the team, and they take burdens seriously — including yours. They value honest signals, but time them: in a tense moment bad news amplifies with them.",
    },
    low: {
      hu: "Hűvös, tárgyilagos vezető: kevés érzelmi visszaigazolást ad, és a „nincs hír” nála általában jó hír. Ha megerősítésre van szükséged, kérd explicit módon — magától nem jut eszébe, de szívesen megadja.",
      en: "A cool, matter-of-fact leader: little emotional affirmation, and with them no news is usually good news. If you need reassurance, ask for it explicitly — it won't occur to them, but they'll gladly give it.",
    },
  },
  INTE: {
    high: {
      hu: "Elvhű vezető: kiszámítható, fair, és a szava kötelez — cserébe ugyanezt várja. A taktikázást és a szépített beszámolót bünteti, az őszinte hibabevallást díjazza: nála a rossz hír korai kimondása bizalomépítés.",
      en: "A principled leader: predictable, fair, and bound by their word — expecting the same in return. They punish manoeuvring and polished reports, and reward honest admission of error: with them, naming bad news early builds trust.",
    },
    low: {
      hu: "Érdekvezérelt, alkuképes vezető: gyors, rugalmas, és a prioritásai a helyzettel együtt mozognak. Figyeld a kimondatlan szempontjait, és a megállapodásaitokat rögzítsd írásban — nem rosszindulatból felejt, hanem mert továbblépett.",
      en: "An interest-driven, deal-making leader: fast, flexible, with priorities that move with the situation. Track their unstated considerations and put your agreements in writing — they forget not out of malice but because they've moved on.",
    },
  },
  THOR: {
    high: {
      hu: "Rendszerépítő vezető: a minőség és a határidő nála nem stílus, hanem szerződés. Meglepetés helyett korai jelzést vár — a csúszás önmagában megbocsátható, az eltitkolt csúszás nem.",
      en: "A system-building leader: quality and deadlines aren't style for them, they're contract. They expect early warning, not surprises — a slip is forgivable in itself; a hidden slip is not.",
    },
    low: {
      hu: "Spontán, nagyvonalú vezető: kevés keretet ad, és a részletek nála elsikkadnak — a szabadság valódi, a struktúráról viszont magadnak kell gondoskodnod. Kérdezd meg konkrétan: mit, mikorra, milyen mélységben.",
      en: "A spontaneous, big-picture leader: few frames, and details slip past them — the freedom is real, but you'll have to supply the structure yourself. Ask concretely: what, by when, at what depth.",
    },
  },
  ADAP: {
    high: {
      hu: "Harmóniakereső vezető: türelmes, konfliktuskerülő, és a kritikát ritkán mondja ki élesen — figyeld a finom jelzéseket, mert nála a „talán érdemes lenne” gyakran erős kérés. Kérj konkrét visszajelzést, különben csak a jót hallod.",
      en: "A harmony-seeking leader: patient, conflict-averse, rarely sharp in criticism — watch for subtle signals, because their 'perhaps it might be worth' is often a firm request. Ask for concrete feedback or you'll only ever hear the good part.",
    },
    low: {
      hu: "Kritikus, direkt vezető: az éle nem személyes, hanem üzemmód — a vitát jól bírja, sőt tiszteli, aki érvekkel visszaszól. Amit nehezen kezel: a megsértődés és a néma visszahúzódás; nála a nyílt ellentmondás a biztonságosabb út.",
      en: "A critical, direct leader: the edge is a mode, not personal — they handle debate well and respect those who push back with arguments. What they struggle with is sulking and silent withdrawal; open disagreement is the safer route with them.",
    },
  },
  OPEN: {
    high: {
      hu: "Újító vezető: az irányok nála gyakran váltanak, és a legutóbbi ötlet hangosabb, mint a tavalyi stratégia. Kérdezd meg rendszeresen, mi fix és mi kísérlet — enélkül minden felvetését elköteleződésnek hiheted.",
      en: "An innovating leader: directions change often, and the latest idea speaks louder than last year's strategy. Regularly ask what's fixed and what's an experiment — otherwise you'll mistake every musing for a commitment.",
    },
    low: {
      hu: "Pragmatikus vezető: a bevált módszert tiszteli, az újítást bizonyíték győzi meg, nem lelkesedés. Vidd az ötleteidet számokkal és kis téttel — a „próbáljuk ki kicsiben” nála kaput nyit, a „forradalmasítsuk” bezárja.",
      en: "A pragmatic leader: they respect what's proven, and evidence persuades them where enthusiasm won't. Bring your ideas with numbers and low stakes — 'let's pilot it small' opens their door, 'let's revolutionise' closes it.",
    },
  },
};

// ─────────────────────────────────────────────────────────────────────
// Teljes készlet + kényelmi lekérdezők (az F2 motor belépési pontjai)
// ─────────────────────────────────────────────────────────────────────

export const RELATION_ATOMS: RelationAtom[] = [
  ...SAME_DIMENSION_ATOMS,
  ...CROSS_DIMENSION_ATOMS,
];

/** Kulcs: rendezetlen pár — a keresés mindkét irányból ugyanazt az atomot adja. */
export function atomKey(a: AtomSide, b: AtomSide): string {
  const sideKey = (s: AtomSide) => `${s.dim}:${s.pole}`;
  return [sideKey(a), sideKey(b)].sort().join("|");
}

const ATOM_INDEX: Map<string, RelationAtom> = new Map(
  RELATION_ATOMS.map((atom) => [atomKey(atom.a, atom.b), atom]),
);

/**
 * Atom keresése egy pólus-párra, irányfüggetlenül. A visszaadott `mirrored`
 * jelzi, hogy a kérdező A-oldala az atom B-oldala — ilyenkor a viewB szól
 * hozzá (symmetric atomnál a view mindkét irányban érvényes).
 */
export function findAtom(
  a: AtomSide,
  b: AtomSide,
): { atom: RelationAtom; mirrored: boolean } | null {
  const atom = ATOM_INDEX.get(atomKey(a, b));
  if (!atom) return null;
  const direct = atom.a.dim === a.dim && atom.a.pole === a.pole;
  return { atom, mirrored: !direct };
}

/** A kérdező nézőpontjának szövegei (mirrored + aszimmetrikus → viewB). */
export function atomBlocksFor(
  atom: RelationAtom,
  mirrored: boolean,
): AtomBlocks {
  if (mirrored && !atom.symmetric && atom.viewB) return atom.viewB;
  return atom.view;
}
