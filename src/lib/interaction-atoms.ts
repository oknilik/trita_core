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

import type { HexacoCode } from "@/lib/hexaco";

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
  dim: HexacoCode;
  pole: Pole;
}

export interface RelationAtom {
  /** Stabil azonosító: "same-C-high-low" | "cross-O-high-C-high" */
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
  // ── X — extraverzió (X) ──────────────────────────────────────────
  {
    id: "same-X-high-high",
    kind: "same",
    a: { dim: "X", pole: "high" },
    b: { dim: "X", pole: "high" },
    symmetric: true,
    view: {
      easy: {
        hu: "Közös lendület alakulhat ki: gyors tempó, sok kommunikáció, egymást húzó energia – a kezdeményezés jellemzően egyikőtöknél sem akad el.",
        en: "Shared momentum can build: fast pace, lots of communication, energy that pulls you both forward – initiative rarely stalls with either of you.",
      },
      friction: {
        hu: "Mindketten viszitek a szót – előfordulhat, hogy egymás szavába vágtok, a csendesebb kollégáknak pedig kevés tér marad a közös beszélgetésekben.",
        en: "You both carry the conversation – you may end up talking over each other, and quieter colleagues can get crowded out of shared spaces.",
      },
      discuss: {
        hu: "Beszéljétek meg, ki moderálja a közös egyeztetéseket, és hogyan adtok teret másoknak – a kettőtök lendülete könnyen betöltheti a szobát.",
        en: "Agree on who moderates your shared meetings and how the people around you get airtime – the dynamic between you can easily fill the room.",
      },
    },
  },
  {
    id: "same-X-high-low",
    kind: "same",
    a: { dim: "X", pole: "high" },
    b: { dim: "X", pole: "low" },
    view: {
      easy: {
        hu: "Jól kiegészíthetitek egymást: jellemzően te hozod a társas lendületet, ő pedig a nyugodt, elmélyült figyelmet.",
        en: "You may make a complementary pair: you typically bring momentum and outward energy, they bring calm depth and focused work.",
      },
      friction: {
        hu: "Te úgy érezheted, egyedül húzod a kapcsolatot; ő közben azt élheti meg, hogy a sok interakció lemeríti, és nem fér szóhoz melletted.",
        en: "You may feel you're pulling the relationship alone; meanwhile they may find the volume of interaction draining and struggle to get a word in.",
      },
      discuss: {
        hu: "Egyezzetek meg a kommunikáció ritmusában: mikor kell élő egyeztetés, mi intézhető írásban, és mennyi felkészülési időre van szüksége a közös döntések előtt.",
        en: "Agree on how to dose communication: what needs a live conversation, what can go async, and how much preparation time they get before joint decisions.",
      },
    },
    viewB: {
      easy: {
        hu: "Jól kiegészíthetitek egymást: jellemzően te hozod a nyugodt, elmélyült figyelmet, ő pedig a társas lendületet.",
        en: "You may make a complementary pair: you typically bring calm depth and focus, they bring momentum and outward energy.",
      },
      friction: {
        hu: "A tempója és a sok interakció fáraszthat – és ha nem jelzed, ő ezt nem veszi észre, csak azt látja, hogy visszahúzódsz.",
        en: "Their pace and the volume of interaction can wear you down – and if you don't say so, they won't notice, only that you're withdrawing.",
      },
      discuss: {
        hu: "Kérj gondolkodási időt a döntések előtt, és egyezzetek meg, mi intézhető írásban – a hallgatásodból önmagában nem tudja, mire van szükséged.",
        en: "Ask for processing time before decisions and agree on what can go async – your silence isn't data for them until you name it.",
      },
    },
  },
  {
    id: "same-X-low-low",
    kind: "same",
    a: { dim: "X", pole: "low" },
    b: { dim: "X", pole: "low" },
    symmetric: true,
    view: {
      easy: {
        hu: "Nyugodt, fókuszált együttműködés alakulhat: kevés felesleges kör, és jellemzően mindkettőtöknek jólesik a csendben végzett mély munka.",
        en: "Calm, focused collaboration can develop: few unnecessary loops, and you both typically enjoy deep work done in quiet.",
      },
      friction: {
        hu: "A kommunikáció elakadhat: ha egyikőtök sem kezdeményez, a fontos dolgok kimondatlanul maradnak, és ezt kívülről senki nem veszi észre.",
        en: "Communication can stall: if neither of you initiates, important things stay unsaid – and nobody outside will notice.",
      },
      discuss: {
        hu: "Tartsatok rendszeres, rövid egyeztetést, és beszéljétek meg, ki jelez, ha elakadás van – különben könnyen mindketten a másik kezdeményezésére várhattok.",
        en: "Set a regular short sync point and agree on who raises a blocker – it won't happen spontaneously from either side.",
      },
    },
  },

  // ── E — emocionalitás (E) ──────────────────────────────────────────────
  {
    id: "same-E-high-high",
    kind: "same",
    a: { dim: "E", pole: "high" },
    b: { dim: "E", pole: "high" },
    symmetric: true,
    view: {
      easy: {
        // Diádikus dinamika-leírás (két magas pólus egymás mellett), nem
        // erény-állítás: a korábbi „empátia" szó ezt a skálát empátia-mérőnek
        // olvastatta (2026-08-11 valencia-döntés). A HU is hedge-elve, az
        // EN-nel egyezően („alakulhat" / „can develop").
        hu: "Mély kölcsönös ráhangolódás alakulhat ki: észreveszitek egymás terheit, és nem kell magyarázni, miért nehéz egy nap – ez ritka biztonságot ad.",
        en: "Deep mutual attunement can develop: you typically notice each other's load, and a hard day rarely needs explaining – a valuable kind of safety.",
      },
      friction: {
        hu: "Feszült időszakban egymás aggodalmait erősíthetitek fel: közös spirál, amelyben mindketten egyre nagyobbnak látjátok a kockázatot.",
        en: "Under pressure you can amplify each other's worries: a shared spiral where the risk looks bigger to both of you with every loop.",
      },
      discuss: {
        hu: "Egyezzetek meg egy jelben, amellyel bármelyikőtök megszakíthatja az egymást erősítő aggodalmak körét, és keressetek egy külső, tárgyilagos viszonyítási pontot.",
        en: "Agree on a signal either of you can use to stop the shared worry loop, and pick an outside, matter-of-fact reference point.",
      },
    },
  },
  {
    id: "same-E-high-low",
    kind: "same",
    a: { dim: "E", pole: "high" },
    b: { dim: "E", pole: "low" },
    view: {
      easy: {
        hu: "Nehéz helyzetben ő lehet a biztos pont: nyugodt maradhat, amikor benned erősödik a feszültség. Ez jól működő szerepmegosztást adhat kettőtöknek.",
        en: "In hard moments they can be the anchor: steady while tension surges in you – a well-cast pairing if you use it deliberately.",
      },
      friction: {
        hu: "Te érzéketlennek láthatod a nyugalmát, ő túlzónak a reakcióidat – és mindkét olvasat igazságtalan a másikkal.",
        en: "You may read their calm as indifference; they may read your reactions as too much – and both readings are unfair.",
      },
      discuss: {
        hu: "Tisztázzátok, mit jelent nálatok a támogatás: meghallgatást vagy megoldást vársz-e, és neki melyik jön könnyebben.",
        en: "Clarify what support means between you: are you looking to be heard or to get a fix – and which one comes naturally to them.",
      },
    },
    viewB: {
      easy: {
        hu: "Te hozhatod a stabilitást a párosba: nehéz helyzetben jellemzően a te nyugalmad lesz a közös kapaszkodó.",
        en: "You may bring the stability: in hard moments your calm can be what you both hold onto.",
      },
      friction: {
        hu: "Az ő érzelmi jelzései neked túlzásnak tűnhetnek – pedig gyakran korai figyelmeztetések arról, amit te még nem látsz.",
        en: "Their emotional signals may look like overreaction to you – yet they're often early warnings about something you don't see yet.",
      },
      discuss: {
        hu: "Kezeld az érzelmi jelzéseit adatként, ne zajként – és mondjátok ki, milyen helyzetben melyik reakció segít a másiknak.",
        en: "Treat their emotional signals as data, not noise – and spell out which response helps whom in which situation.",
      },
    },
  },
  {
    id: "same-E-low-low",
    kind: "same",
    a: { dim: "E", pole: "low" },
    b: { dim: "E", pole: "low" },
    symmetric: true,
    view: {
      easy: {
        hu: "Tárgyilagos, nyugodt munkakapcsolat alakulhat: krízisben is jellemzően hideg fejjel döntötök, és ritkán terhelitek egymást érzelmi hullámokkal.",
        en: "A matter-of-fact, calm working relationship can form: typically cool heads even in a crisis, with little emotional turbulence between you.",
      },
      friction: {
        hu: "Az érzelmi jelzések elsikkadhatnak: ha valamelyikőtökben feszültség gyűlik, az sokáig láthatatlan marad – kifelé és egymás felé is.",
        en: "Emotional signals can slip through: if tension builds in either of you, it stays invisible for a long time – to others and to each other.",
      },
      discuss: {
        hu: "Időnként tartsatok tudatos visszajelző kört arról, hogy vagytok – ez nálatok könnyen kimaradhat, pedig szükség lehet rá.",
        en: "Schedule an occasional explicit check-in on how you're doing – between you it won't come up on its own, and sometimes it needs to.",
      },
    },
  },

  // ── H — becsületesség-alázat (H) ──────────────────────────────────────────────
  {
    id: "same-H-high-high",
    kind: "same",
    a: { dim: "H", pole: "high" },
    b: { dim: "H", pole: "high" },
    symmetric: true,
    view: {
      easy: {
        hu: "Kölcsönös alapbizalom épülhet ki: ritkán kell a másik hátsó szándékait keresnetek, és jellemzően számíthattok egymás szavára.",
        en: "Baseline mutual trust can form: you rarely have to scan for hidden agendas, and a given word typically works as a contract between you.",
      },
      friction: {
        hu: "Ha elvi kérdésben kerültök szembe, mindketten nehezen engedhettek: az elvekről szóló vita nálatok tovább tarthat, mint egy egyszerű érdekellentét rendezése.",
        en: "When you clash on principle, neither of you yields easily: principle-vs-principle debates can outlast anyone else's interest disputes.",
      },
      discuss: {
        hu: "Beszéljétek meg előre, mi történik, ha két elv ütközik: ki dönt, milyen szempont alapján – mielőtt egy éles helyzet kikényszeríti.",
        en: "Agree in advance what happens when two principles collide: who decides, on what grounds – before a live situation forces it.",
      },
    },
  },
  {
    id: "same-H-high-low",
    kind: "same",
    a: { dim: "H", pole: "high" },
    b: { dim: "H", pole: "low" },
    view: {
      easy: {
        hu: "Erős munkamegosztás alakulhat ki: ő ügyesen igazodik el az eltérő érdekek között, te pedig őrzöd a kereteket – együtt egyszerre lehettek hatékonyak és hitelesek.",
        en: "A strong division of labour: they navigate interests and people deftly, you guard the boundaries – together you can be effective AND credible.",
      },
      friction: {
        hu: "Te taktikázásnak láthatod az ő gyakorlatias szemléletét, ő pedig naivitásnak a te elvhűségedet – ez a kölcsönös gyanú lassan ronthatja a bizalmat.",
        en: "You may read their pragmatism as scheming; they may read your principles as naivety – and that mutual suspicion slowly poisons trust.",
      },
      discuss: {
        hu: "Húzzátok meg együtt a közös vörös vonalat: mi az, ami nálatok nem alku tárgya – és azon belül engedjetek teret a másik stílusának.",
        en: "Draw the shared red line together: what isn't up for negotiation between you – and inside that line, give each other's style room.",
      },
    },
    viewB: {
      easy: {
        hu: "Erős munkamegosztás alakulhat ki: te gyorsan igazodsz el az eltérő érdekek között, ő pedig stabilan tartja a kereteket – a párosotok egyszerre lehet hatékony és hiteles.",
        en: "A strong division of labour: you move fast through the space of interests, they hold the frame steady – your pairing can be effective AND credible.",
      },
      friction: {
        hu: "Az ő elvhűsége neked időnként merevségnek tűnhet – közben éppen ez adja a párosotok külső hitelességét, amelyre te is építhetsz.",
        en: "Their principles may sometimes look like rigidity to you – yet that's exactly what gives your pairing the outside credibility you build on.",
      },
      discuss: {
        hu: "Tekints az elveire horgonyként, ne fékként, és jelezd előre, ha egy megoldásod a határait súrolja – még mielőtt kész tények elé állítod.",
        en: "Treat their principles as an anchor, not a brake – and flag in advance when a solution of yours grazes their boundaries, before presenting a fait accompli.",
      },
    },
  },
  {
    id: "same-H-low-low",
    kind: "same",
    a: { dim: "H", pole: "low" },
    b: { dim: "H", pole: "low" },
    symmetric: true,
    view: {
      easy: {
        hu: "Gyors, pragmatikus alkuk születhetnek: jellemzően közös nyelvet beszéltek az érdekekről, és ritkán sértődtök meg egy kemény tárgyalástól.",
        en: "Fast, pragmatic deals can follow: you typically speak the same language of interests, and hard bargaining rarely offends either of you.",
      },
      friction: {
        hu: "A bizalom törékeny maradhat: mindketten figyelitek a másik következő lépését, és egy be nem tartott alku sokáig visszhangzik.",
        en: "Trust can stay fragile: you both watch each other's next move, and one broken deal echoes for a long time.",
      },
      discuss: {
        hu: "Rögzítsétek egyértelműen, lehetőleg írásban a megállapodásaitokat – a ki nem mondott feltételezések könnyen konfliktushoz vezethetnek.",
        en: "Make your agreements explicit, preferably in writing – unstated assumptions are your fastest route to conflict.",
      },
    },
  },

  // ── C — lelkiismeretesség (C) ────────────────────────────────────────────
  {
    id: "same-C-high-high",
    kind: "same",
    a: { dim: "C", pole: "high" },
    b: { dim: "C", pole: "high" },
    symmetric: true,
    view: {
      easy: {
        hu: "Megbízható együttműködés alakulhat ki: közös a minőségi mércétek, a határidőt pedig mindketten komoly vállalásnak tekintitek. Nyugodtan építhettek egymás munkájára.",
        en: "Reliable operation: a shared quality bar, deadlines that hold – you can build on each other's work with confidence.",
      },
      friction: {
        hu: "Két kiforrott rendszer ütközhet: mindkettőtöknek megvan a maga bevált módszere, és a túltervezés közösen is el tud hatalmasodni.",
        en: "Two mature systems can collide: you each have your proven method, and over-planning can take over even as a pair.",
      },
      discuss: {
        hu: "Egyezzetek meg, mikor „elég jó a jó”, és melyik területen kié a módszertani döntés – hogy a precizitás ne csússzon perfekcionizmusba.",
        en: "Agree when good is good enough, and whose method rules in which area – so precision doesn't slide into perfectionism.",
      },
    },
  },
  {
    id: "same-C-high-low",
    kind: "same",
    a: { dim: "C", pole: "high" },
    b: { dim: "C", pole: "low" },
    view: {
      easy: {
        hu: "Sürgető helyzetben jól kiegészíthetitek egymást: te struktúrát és minőséget adsz, ő gyorsan reagál és rögtönöz – együtt rugalmas és megbízható lehet a működésetek.",
        en: "You may make a good crisis pair: you typically bring structure and quality, they move fast and improvise – together you can be flexible AND reliable.",
      },
      friction: {
        hu: "Ez a munkahelyi súrlódás egyik legerősebb jóslója: neked káosznak tűnhet az ő spontaneitása, neki béklyónak a te rendszered.",
        en: "This is one of the strongest predictors of workplace friction: their spontaneity can look like chaos to you, your system like shackles to them.",
      },
      discuss: {
        hu: "Osszátok fel a feladatokat aszerint, hol van szükség a te precizitásodra, és hol elég az ő tempója. A határidők kezelésében is alakítsatok ki közös szabályokat.",
        en: "Divide the terrain: where your precision rules (and they adapt), where their pace is enough – plus a shared deadline protocol.",
      },
    },
    viewB: {
      easy: {
        hu: "Sürgető helyzetben jól kiegészíthetitek egymást: te hozod a gyors reagálást, ő pedig a struktúrát – együtt rugalmas és megbízható lehet a működésetek.",
        en: "You may make a good crisis pair: you typically bring agility and fast response, they bring structure – together you can be flexible AND reliable.",
      },
      friction: {
        hu: "Ez a munkahelyi súrlódás egyik legerősebb jóslója: az ő rendszere neked béklyónak tűnhet, neki a te spontaneitásod kockázatnak.",
        en: "This is one of the strongest predictors of workplace friction: their system can feel like shackles to you, your spontaneity like risk to them.",
      },
      discuss: {
        hu: "Kérd, hogy együtt alakítsátok ki a kereteket, ne készen kapd őket – az ő rendszere biztonsági háló is lehet, amelyre vészhelyzetben te is támaszkodhatsz.",
        en: "Ask to set the guardrails together rather than receiving them ready-made – their system is also the safety net you lean on in a crisis.",
      },
    },
  },
  {
    id: "same-C-low-low",
    kind: "same",
    a: { dim: "C", pole: "low" },
    b: { dim: "C", pole: "low" },
    symmetric: true,
    view: {
      easy: {
        hu: "Rugalmas, spontán együttműködés alakulhat: gyorsan irányt tudtok váltani, és jellemzően egyikőtök sem akad fenn a részleteken vagy a formaságokon.",
        en: "Flexible, spontaneous collaboration can develop: you typically change direction fast, and detail or formality rarely hangs either of you up.",
      },
      friction: {
        hu: "A részletek és határidők közösen is elcsúszhatnak – és mivel egyikőtök sem tartja számon őket, ez kifelé is látszani fog.",
        en: "Details and deadlines can slip even as a pair – and since neither of you tracks them, it will show on the outside too.",
      },
      discuss: {
        hu: "Állapodjatok meg egy minimális közös struktúrában (ki, mit, mikorra), és kérjetek külső horgonyt – naptárt, eszközt vagy harmadik embert.",
        en: "Agree on a minimal shared structure (who, what, by when) and get an external anchor – a calendar, a tool, or a third person.",
      },
    },
  },

  // ── A — barátságosság (A) ───────────────────────────────────────────
  {
    id: "same-A-high-high",
    kind: "same",
    a: { dim: "A", pole: "high" },
    b: { dim: "A", pole: "high" },
    symmetric: true,
    view: {
      easy: {
        hu: "Harmonikus, türelmes párost alkothattok: könnyen engedtek egymásnak, ritka lehet a nyílt konfliktus, és másoknak is kellemes lehet veletek együtt dolgozni.",
        en: "You may make a harmonious, patient pair: you typically yield to each other easily, open conflict stays rare, and you can be pleasant to share a room with.",
      },
      friction: {
        hu: "A valódi nézeteltérések a szőnyeg alá kerülhetnek: mindketten kerülhetitek a nyílt ütközést, ezért a döntések elodázódhatnak, a feszültség pedig felgyűlhet.",
        en: "Real disagreements can get swept under the rug: you both avoid the edge, so decisions get postponed and tension quietly builds.",
      },
      discuss: {
        hu: "Adjatok keretet a vitának – például az érvek és ellenérvek külön körével vagy írásos véleményezéssel –, hogy az ellenvélemény ne maradjon ki puszta udvariasságból.",
        en: "Find a structured format for disagreement – a pro-con round, written arguments – so dissent doesn't die of politeness.",
      },
    },
  },
  {
    id: "same-A-high-low",
    kind: "same",
    a: { dim: "A", pole: "high" },
    b: { dim: "A", pole: "low" },
    view: {
      easy: {
        hu: "Ő gyakran kimondja, amit te inkább magadban tartanál, te pedig tompíthatod, amit ő élesen fogalmazna meg – jól összehangolva ez a páros egyszerre lehet őszinte és emberséges.",
        en: "They say what you'd swallow; you soften what they'd sharpen – well calibrated, this pair can be honest AND humane.",
      },
      friction: {
        hu: "Az ő direktsége bántónak érződhet, miközben ő a te diplomáciádat érezheti kertelésnek – és mindketten a saját stílusotokat tartjátok normálisnak.",
        en: "Their directness can feel hurtful, while your diplomacy can feel evasive to them – and you each consider your own style the normal one.",
      },
      discuss: {
        hu: "Állapodjatok meg a visszajelzés szabályaiban: mikor, milyen formában és milyen hangnemben szóltok egymásnak, illetve hogyan jelzitek, ha egy megfogalmazás túl éles volt.",
        en: "Agree a feedback protocol: when, in what form, with how much edge – and the sentence either of you can use to say that was too much.",
      },
    },
    viewB: {
      easy: {
        hu: "Jellemzően te hozod az egyenességet, ő pedig a tapintatot – jól összehangolva ez a páros egyszerre lehet őszinte és emberséges.",
        en: "You bring the directness, they bring the tact – well calibrated, this pair can be honest AND humane.",
      },
      friction: {
        hu: "Az ő visszafogottsága neked kertelésnek tűnhet – pedig a türelme segíthet megőrizni a kapcsolatotok egyensúlyát.",
        en: "Their restraint can look like evasion to you – yet their patience is relational capital your pairing also spends.",
      },
      discuss: {
        hu: "Kérdezd meg, milyen formában tudja jól fogadni a kritikát, és tartsd magad ehhez – az élesebb megfogalmazás nála nem feltétlenül hatékonyabb, viszont nagyobb terhet róhat a kapcsolatra.",
        en: "Ask how they best receive criticism and stick to it – with them, your sharpest phrasing isn't more effective, just more costly.",
      },
    },
  },
  {
    id: "same-A-low-low",
    kind: "same",
    a: { dim: "A", pole: "low" },
    b: { dim: "A", pole: "low" },
    symmetric: true,
    view: {
      easy: {
        hu: "Egyenes kommunikáció alakulhat ki köztetek: jellemzően gyorsan kimondjátok, ha baj van, így kevés rejtett feszültség marad, a vitáitok pedig átláthatóbbak lehetnek.",
        en: "Straight talk can go both ways: problems typically get named fast, hidden tension stays rare, and your arguments are at least clean.",
      },
      friction: {
        hu: "A viták elmérgesedhetnek: mindketten élesen fogalmaztok és nehezen engedtek – a tárgyi nézeteltérés könnyen presztízskérdéssé válhat.",
        en: "Arguments can escalate: you both phrase things sharply and yield reluctantly – a factual debate easily turns into a matter of pride.",
      },
      discuss: {
        hu: "Vezessetek be közös vitaszabályokat: válasszátok szét a témát és a személyt, és legyen egy szünetjelzés, amelyet bármelyikőtök használhat.",
        en: "Set debate rules: separate the issue from the person, plus a time-out signal either of you can call.",
      },
    },
  },

  // ── O — nyitottság ──────────────────────────────────────────────
  {
    id: "same-O-high-high",
    kind: "same",
    a: { dim: "O", pole: "high" },
    b: { dim: "O", pole: "high" },
    symmetric: true,
    view: {
      easy: {
        hu: "Pezsgő közös ötletelés indulhat: jellemzően egymás gondolataira építkeztek, és a kísérletezés nálatok inkább alapállapot, mint kockázat.",
        en: "Lively co-ideation can start: you typically build on each other's thoughts, and experimenting tends to be the default rather than a risk.",
      },
      friction: {
        hu: "Sok indítás, kevés lezárás: az új ötlet gyakran vonzóbb a befejezésnél, és a fókuszt jellemzően egyikőtök sem tartja magától.",
        en: "Many launches, few landings: the new idea often beats finishing, and neither of you tends to hold focus naturally.",
      },
      discuss: {
        hu: "Vezessetek közös ötletlistát, és jelöljetek ki egy döntési pontot: mikor váltotok ötletelésből megvalósításba, és ki mondja ki a váltást.",
        en: "Keep an idea parking lot and an explicit decision point: when you switch from ideation to execution – and who calls the switch.",
      },
    },
  },
  {
    id: "same-O-high-low",
    kind: "same",
    a: { dim: "O", pole: "high" },
    b: { dim: "O", pole: "low" },
    view: {
      easy: {
        hu: "Jó szűrőpáros lehettek: te hozod az új irányokat, ő pedig a bevált módszerek erejét – ami átmegy a közös szűrőtökön, az általában életképes.",
        en: "A good filtering pair: you bring new directions, they bring the strength of proven methods – what passes both your sieves tends to be viable.",
      },
      friction: {
        hu: "Az ő fenntartásai falnak érződhetnek, miközben ő felesleges kockázatnak láthatja a kísérletezésedet – és mindkettőtöket fáraszthatja a másik ösztönös reakciója.",
        en: "Their scepticism can feel like a wall, while your experimenting can feel like needless risk to them – and each finds the other's reflex tiring.",
      },
      discuss: {
        hu: "Jelöljétek ki a kísérletezés kereteit: mekkora téttel próbálkozhattok külön jóváhagyás nélkül, és milyen bizonyíték győzné meg őt is.",
        en: "Mark out an experimentation lane: how much stake can be risked without sign-off – and what evidence would convince them too.",
      },
    },
    viewB: {
      easy: {
        hu: "Jó szűrőpáros lehettek: te a működő megoldásokat őrzöd, ő pedig az új irányokat hozza – ami átmegy a közös szűrőtökön, az általában életképes.",
        en: "A good filtering pair: you guard what works, they source new directions – what passes both your sieves tends to be viable.",
      },
      friction: {
        hu: "A sok ötlete fárasztó lehet, és úgy érezheted, egyedül te őrzöd a stabilitást – miközben ő a kérdéseidet élheti meg akadályként.",
        en: "Their cascade of ideas can be tiring, and you may feel you alone defend stability – while they experience your questions as a wall.",
      },
      discuss: {
        hu: "Kezeld az ötleteit nyersanyagként, ne kész javaslatként: azonnali döntés helyett kérjetek közös szűrést, és mondd ki, milyen bizonyíték győzne meg.",
        en: "Treat their ideas as raw material, not proposals: ask for a shared filter rather than an instant verdict – and name the evidence that would win you over.",
      },
    },
  },
  {
    id: "same-O-low-low",
    kind: "same",
    a: { dim: "O", pole: "low" },
    b: { dim: "O", pole: "low" },
    symmetric: true,
    view: {
      easy: {
        hu: "Kiszámítható, pragmatikus működés: bevált eszközökkel dolgoztok, és egyikőtök sem borítja fel a rendszert egy divatos ötlet miatt.",
        en: "Predictable, pragmatic operation is likely: you typically work with proven tools, and a fashionable idea rarely makes either of you upend the system.",
      },
      friction: {
        hu: "Az újítás elmaradhat: ha a környezetetek változik, kettőtök közül senki nem hozza be időben az új impulzust.",
        en: "Innovation can stall: when your environment shifts, neither of you brings in the new impulse in time.",
      },
      discuss: {
        hu: "Egyezzetek meg, honnan érkeznek új nézőpontok: kinek és milyen rendszerességgel a feladata körülnézni – például konferenciákon, a versenytársaknál vagy külső szakértők bevonásával.",
        en: "Agree where fresh input comes from: whose job it is to scan – conferences, competitor watch, an outside eye – and how often.",
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
    id: "cross-O-high-C-high",
    kind: "cross",
    a: { dim: "O", pole: "high" },
    b: { dim: "C", pole: "high" },
    view: {
      easy: {
        hu: "Együtt végigvihetitek az ötlettől a megvalósításig tartó teljes folyamatot: jellemzően te hozod az irányt, ő pedig a kivitelezés fegyelmét. Az ilyen párosok gyakran érnek el kézzelfogható eredményt.",
        en: "Between you the whole chain can exist: you typically bring the idea and direction, they bring execution discipline – pairs like this often ship.",
      },
      friction: {
        hu: "Az ötleteid az ő mércéjéhez képest könnyen félkészen érkezhetnek, az ő pontosító kérdései pedig neked fékként érződhetnek – pedig ugyanazt a célt szolgálják.",
        en: "By their bar your ideas may arrive half-baked, and their clarifying questions can feel like brakes to you – though both serve the same goal.",
      },
      discuss: {
        hu: "Határozzátok meg az átadási pontot: mikor kerül egy ötlet az ő rendszerébe, és addig milyen kidolgozottságra van szüksége tőled.",
        en: "Define the handover point: when an idea enters their system – and what level of polish they can fairly expect from you until then.",
      },
    },
    viewB: {
      easy: {
        hu: "Együtt végigvihetitek az ötlettől a megvalósításig tartó teljes folyamatot: jellemzően ő hozza az irányt és a nyersanyagot, te pedig megvalósíthatóvá teszed. Az ilyen párosok gyakran érnek el kézzelfogható eredményt.",
        en: "Between you the whole chain can exist: they typically bring direction and raw material, you make it buildable – pairs like this often ship.",
      },
      friction: {
        hu: "A félkész ötletek zavarhatják a rendszeredet, és a kérdéseidet ő lelombozásnak élheti meg – pedig te épp komolyan veszed őket.",
        en: "Half-baked ideas can disturb your system, and they may experience your questions as deflating – when in fact you're taking them seriously.",
      },
      discuss: {
        hu: "Kérd, hogy már az ötletelésbe vonjon be, ne csak a kész terveket hozza eléd. Így a rendszered nem utólagos szűrő, hanem a közös gondolkodás eszköze lesz.",
        en: "Ask for early involvement instead of finished plans: if you're there at idea stage, your system becomes a shared tool, not an after-the-fact filter.",
      },
    },
  },
  {
    id: "cross-O-high-C-low",
    kind: "cross",
    a: { dim: "O", pole: "high" },
    b: { dim: "C", pole: "low" },
    view: {
      easy: {
        hu: "Gyors, lelkes indulás alakulhat ki: ő hamar lendületet ad az ötleteidnek, és ritkán lassít benneteket adminisztrációval, így az új kezdeményezések könnyen elindulhatnak.",
        en: "Fast, enthusiastic starts are likely: they typically get on board with your ideas and rarely slow things with admin – new things can launch easily.",
      },
      friction: {
        hu: "Könnyen előfordulhat, hogy egyikőtök sem zárja le a megkezdett feladatokat: nyitott szálak maradhatnak utánatok, a környezetetek pedig azt tapasztalhatja, hogy a közös ígéret még nem jelent kész tervet.",
        en: "Nobody may close the loops: open threads can pile up behind you, and people around you learn that with you two a promise isn't a plan.",
      },
      discuss: {
        hu: "Minden közös kezdeményezésnél nevezzetek meg valakit, aki felel a lezárásért, és rendeljetek hozzá mások számára is látható határidőt – a csak kettőtök között rögzített időpont könnyebben elcsúszhat.",
        en: "Name a finishing owner for every joint initiative and tie it to an external deadline – an internal one won't emerge on its own.",
      },
    },
    viewB: {
      easy: {
        hu: "Gyors, lelkes indulás lehet belőle: az ötletei jó terepet adhatnak a rugalmasságodnak, és jellemzően egyikőtök sem ragad le a formaságoknál.",
        en: "Fast, enthusiastic starts are likely: their ideas can give your flexibility good terrain, and formalities rarely stall either of you.",
      },
      friction: {
        hu: "Az irányok gyakran váltanak, és mivel te sem tartod számon a szálakat, a közös munkáitok könnyen félbe maradnak.",
        en: "Directions change often, and since you don't track the threads either, your joint work easily stays half-done.",
      },
      discuss: {
        hu: "Egyezzetek meg, melyik közös vállalás számít lezárandónak – és azt kicsiben tartsátok, hogy tényleg a végére érjetek.",
        en: "Agree which joint commitments count as must-finish – and keep those small enough that you actually reach the end.",
      },
    },
  },
  {
    id: "cross-C-high-A-low",
    kind: "cross",
    a: { dim: "C", pole: "high" },
    b: { dim: "A", pole: "low" },
    view: {
      easy: {
        hu: "Magas mérce találkozhat egyenes visszajelzéssel: nála jellemzően hamar megtudod, mi nem működik, és a minőség gyorsan javulhat körülöttetek.",
        en: "A high bar can meet straight feedback: with them you typically learn fast what isn't working, and quality may improve quickly around you.",
      },
      friction: {
        hu: "A kritikája időnként a rendszeredet is találhatja: te a kereteid megkérdőjelezésének érezheted, ő feleslegesnek a szabályaidat.",
        en: "Their criticism sometimes hits your system too: you feel your framework challenged, they find your rules unnecessary.",
      },
      discuss: {
        hu: "Tisztázzátok, mire terjedhet ki a kritika: az eredmény menet közben is vitatható, a már elindult folyamat kereteit viszont csak közös döntéssel írjátok felül. A módszert utólag külön is tekintsétek át.",
        en: "Clarify the arena for criticism: output is debatable, the frame of a running process is not – retro afterwards yes, mid-flight overturn no.",
      },
    },
    viewB: {
      easy: {
        hu: "Egyenes visszajelzésed jó helyre érkezhet: jellemzően komolyan veszi a minőséget, és a jelzéseidből tényleg javít – ritkán sértődik meg rajta.",
        en: "Your straight feedback may land well: they typically take quality seriously and improve from your signals rather than sulking.",
      },
      friction: {
        hu: "A szabályai neked túlzott korlátozásnak érződhetnek, a rendszerét érő kritikát pedig ő személyes támadásként élheti meg.",
        en: "Their rules can feel like control to you, and when you criticise their system they experience it as a personal hit.",
      },
      discuss: {
        hu: "Válaszd szét a visszajelzésedben az eredményt és a módszert. A módszer kritikáját az utólagos áttekintésre időzítsd – ott várhatóan nyitottabb lesz rá, mint munka közben.",
        en: "Separate output from method in your feedback: schedule method critique for the retro – they're open to it there, defensive mid-flight.",
      },
    },
  },
  {
    id: "cross-C-high-X-high",
    kind: "cross",
    a: { dim: "C", pole: "high" },
    b: { dim: "X", pole: "high" },
    view: {
      easy: {
        hu: "Az ő lendülete a te szervezettségeddel párosulva ritka kombináció: nálatok az elindított dolgok célba is érnek.",
        en: "Their momentum paired with your organisation can be a strong combination: with you two, what gets started often actually arrives.",
      },
      friction: {
        hu: "Könnyen ott tarthattok, hogy ő már három új dolgot elindított, mire te az elsőt lezárnád – a félkész szálak jellemzően a te rendszeredben landolnak.",
        en: "They may launch three new things by the time you'd close the first – and the loose threads typically land in your system.",
      },
      discuss: {
        hu: "Szabjátok meg közösen, hány feladat futhat párhuzamosan, és mit kell lezárni, mielőtt újba kezdtek. Ez a korlát mindkettőtök számára legyen látható.",
        en: "Keep a shared WIP limit: how much runs in parallel, and what must close before something new starts – visible to them, not just you.",
      },
    },
    viewB: {
      easy: {
        hu: "A lendületed az ő szervezettségével párosulva ritka kombináció: nálatok az elindított dolgok célba is érnek.",
        en: "Your momentum paired with their organisation can be a strong combination: with you two, what gets started often actually arrives.",
      },
      friction: {
        hu: "A tempód az ő rendszerében torlódik: amit te új lehetőségnek látsz, az nála sorban álló, lezáratlan kötelezettség.",
        en: "Your pace can queue up inside their system: what you see as a new opportunity may be, for them, another open obligation in the backlog.",
      },
      discuss: {
        hu: "Mielőtt új feladatot indítasz, kérdezd meg, mi fér bele a közös munkába – így a lelkesedésed támogatást kaphat, nem akadályba ütközik.",
        en: "Before launching, ask what fits the shared lane – that way your enthusiasm gains an ally instead of a bottleneck.",
      },
    },
  },
  {
    id: "cross-X-high-E-high",
    kind: "cross",
    a: { dim: "X", pole: "high" },
    b: { dim: "E", pole: "high" },
    view: {
      easy: {
        hu: "Élénk, érzelmileg jelen lévő kapcsolat alakulhat ki: ő jellemzően hamar észreveszi, ha veled vagy a csapattal valami nincs rendben, te pedig gyorsan tudsz cselekedni.",
        en: "A lively, emotionally present relationship can form: they typically notice quickly when something's off – with you or the team – and you can act on it fast.",
      },
      friction: {
        hu: "A tempód és az intenzitásod érzelmileg terhelheti: ő nem lassúbb nálad, csak több minden ér el hozzá – és visszajelzés nélkül ezt nem látod.",
        en: "Your pace and intensity can weigh on them emotionally: they're not slower than you, more just reaches them – and without feedback you won't see it.",
      },
      discuss: {
        hu: "Vezessetek be egy egyszerű terhelésjelzést, amellyel szólhat, ha túl gyors a tempó vagy túl sok az inger – még mielőtt kimerülne.",
        en: "Introduce a pace check: a simple signal they can use to say it's too much right now – before the load shows up as symptoms.",
      },
    },
    viewB: {
      easy: {
        hu: "Élénk, érzelmileg jelen lévő kapcsolat alakulhat ki: te jellemzően hamar megérzed, ha valami nincs rendben, ő pedig gyorsan reagálhat rá – együtt korán jelezhetitek a problémákat.",
        en: "A lively, emotionally present relationship can form: you typically sense early when something's off, and they move on it fast – together you may make a good early-warning system.",
      },
      friction: {
        hu: "Az energiája magával ragadó, de ki is meríthet – és ha nem jelzed, ő a visszahúzódásodat érdektelenségnek olvashatja.",
        en: "Their energy is infectious but can also drain you – and if you don't say so, they may read your withdrawal as disinterest.",
      },
      discuss: {
        hu: "Állapodjatok meg egy jelben, amellyel lassítást vagy szünetet kérhetsz – ezt elég előre egyértelművé tenni.",
        en: "Agree on a signal you can use to ask for a slowdown or a break – it works with them, it just has to be explicit.",
      },
    },
  },
  {
    id: "cross-X-low-E-high",
    kind: "cross",
    a: { dim: "X", pole: "low" },
    b: { dim: "E", pole: "high" },
    view: {
      easy: {
        hu: "Figyelmes, kíméletes páros lehettek: jellemzően nem nyomasztod tempóval, ő pedig észreveheti és tiszteletben tarthatja a határaidat.",
        en: "You may make an attentive, gentle pair: you typically don't press with pace, and they can notice and respect your boundaries.",
      },
      friction: {
        hu: "Kimondatlan érzések találkozhatnak kevés kommunikációval: ő jellemzően sokat érez, te keveset mondasz – a feszültség némán nőhet kettőtök között.",
        en: "Unspoken feelings meet sparse communication: they feel a lot, you say little – tension can grow silently between you.",
      },
      discuss: {
        hu: "Tartsatok rendszeres négyszemközti egyeztetést: neki tér kellhet ahhoz, hogy kimondja, amit érez, neked pedig kiszámítható alkalom, amikor valóban rá tudsz figyelni.",
        en: "Schedule a regular one-on-one check-in: they need space to voice what they feel, you need a frame in which that isn't a burden.",
      },
    },
    viewB: {
      easy: {
        hu: "Figyelmes, kíméletes páros lehettek: ő nyugodt teret adhat, amiben az érzékenységed inkább erőforrás, mint túlinger.",
        en: "You may make an attentive, gentle pair: they can give you calm space where your sensitivity works as a resource rather than an overload.",
      },
      friction: {
        hu: "A csendje kiszámíthatatlannak érződhet: keveset jelez vissza, te pedig a hallgatását könnyen rossz hírként értelmezheted.",
        en: "Their quiet can feel unreadable: they signal little back, and you may tend to read their silence as bad news.",
      },
      discuss: {
        hu: "Kérj tőle egyértelmű visszajelzést előre egyeztetett pontokon – nála a csend nem feltétlenül elégedetlenség, de ezt időnként hallanod is kell, nem elég csupán feltételezned.",
        en: "Ask them for explicit feedback at fixed points – with them silence isn't displeasure, but you need to hear that, not just know it.",
      },
    },
  },
  {
    id: "cross-H-high-A-low",
    kind: "cross",
    a: { dim: "H", pole: "high" },
    b: { dim: "A", pole: "low" },
    view: {
      easy: {
        hu: "Mindketten kimondhatjátok, amit igaznak tartotok – te inkább elvből, ő inkább vérmérsékletből. A mellébeszélés ritkán marad észrevétlen kettőtök között.",
        en: "You both speak the truth – you on principle, they by temperament. Lies rarely survive near the two of you.",
      },
      friction: {
        hu: "A kritikája időnként nemcsak a hibákat, hanem az embereket is célozhatja – ez akkor is sértheti a méltányosságérzetedet, ha tartalmilag igaza van.",
        en: "Their criticism sometimes hits people, not just faults – and that violates your fair-play standard even when they're factually right.",
      },
      discuss: {
        hu: "Egyezzetek meg, hogyan tartjátok a vitát a tényeknél: milyen hangnem fér bele, és hogyan jelzitek, ha a kritika személyeskedővé vált.",
        en: "Agree how debate stays factual: how much edge is allowed, and who may call it when criticism turns personal.",
      },
    },
    viewB: {
      easy: {
        hu: "Mindketten kimondhatjátok, amit igaznak tartotok – te inkább vérmérsékletből, ő inkább elvből. A mellébeszélés ritkán marad észrevétlen kettőtök között.",
        en: "You both speak the truth – you by temperament, they on principle. Lies rarely survive near the two of you.",
      },
      friction: {
        hu: "Az elvei neked időnként finomkodásnak tűnhetnek – pedig nem a konfliktust kerüli, hanem a méltánytalanságot; ez nála éles határ.",
        en: "Their principles may sometimes look like squeamishness to you – but they're not avoiding conflict, they're avoiding unfairness; for them that line is sharp.",
      },
      discuss: {
        hu: "Tartsd a kritikát a teljesítmény és a tények szintjén – így az együttműködést szolgálhatja, míg a személyeskedés könnyen védekezést válthat ki belőle.",
        en: "Keep criticism on performance and facts – that way even your sharpest sentence stays an ally with them; personal, even your quietest becomes an adversary.",
      },
    },
  },
  {
    id: "cross-H-high-O-high",
    kind: "cross",
    a: { dim: "H", pole: "high" },
    b: { dim: "O", pole: "high" },
    view: {
      easy: {
        hu: "Felelős kísérletezés alakulhat ki: ő újít, te pedig őrzöd a kereteket – a párosotok egyszerre lehet bátor és megbízható.",
        en: "Responsible experimentation: they innovate, you guard the boundaries – your pairing dares and stays trustworthy at once.",
      },
      friction: {
        hu: "Egyes ötletei a szabály- és etikai kereteidet feszegetik: neki izgalmas szürkezóna, neked átléphetetlen határ.",
        en: "Some of their ideas may push at your rules and ethical lines: an exciting grey zone for them can be a hard boundary for you.",
      },
      discuss: {
        hu: "Határozzátok meg együtt a kísérletezés kereteit: miben dönthettek szabadon, mi igényel előzetes egyeztetést, és mi az, ami számodra nem fér bele.",
        en: "Map the experimentation frame together: what's a free lane, what needs sign-off, and what isn't in play for you.",
      },
    },
    viewB: {
      easy: {
        hu: "Felelős kísérletezés alakulhat ki: te újítasz, ő pedig őrzi a kereteket – a párosotok egyszerre lehet bátor és megbízható.",
        en: "Responsible experimentation: you innovate, they guard the boundaries – your pairing dares and stays trustworthy at once.",
      },
      friction: {
        hu: "A határai neked időnként lassítónak tűnhetnek – de a hitelesség, amit ő épít, pont az a tőke, amiből a merészebb ötleteid hitelt kapnak.",
        en: "Their limits may sometimes feel like drag – but the credibility they build is exactly the capital that gets your bolder ideas funded.",
      },
      discuss: {
        hu: "A határeseteket már korán beszéld át vele. Ha az aggályait tervezési szempontként kezeled, szövetségessé válhat; ha csak utólag szembesíted a döntéssel, könnyen ellenállást válthatsz ki belőle.",
        en: "Bring edge cases to them early: treat their concern as design input and they're an ally – confront them after the fact and they're a veto player.",
      },
    },
  },
  {
    id: "cross-E-high-A-low",
    kind: "cross",
    a: { dim: "E", pole: "high" },
    b: { dim: "A", pole: "low" },
    view: {
      easy: {
        hu: "Ő jellemzően gyorsan kimondja, amit te már régóta megérzel – a párosotok hamar felszínre hozhatja, ami másutt hónapokig lappangana.",
        en: "They typically say out loud what you've long sensed – your pairing can surface in days what would fester elsewhere for months.",
      },
      friction: {
        hu: "Az éles stílusa érzelmileg megterhelhet: ami neki „csak őszinteség”, az nálad napokig visszhangzik.",
        en: "Their sharp style can weigh on you emotionally: what's 'just honesty' to them echoes in you for days.",
      },
      discuss: {
        hu: "Kérj kritikát él nélkül, kontextussal – és mondd ki, hogy nálad nem a tartalom fáj, hanem a forma; ezen ő tud állítani, ha tudja, mit.",
        en: "Ask for criticism without the edge, with context – and say plainly that it's the form, not the content, that hurts; they can adjust it once they know what to adjust.",
      },
    },
    viewB: {
      easy: {
        hu: "Te jellemzően kimondod, amit ő megérez – a párosotok hamar felszínre hozhatja, ami másutt hónapokig lappangana.",
        en: "You typically say out loud what they sense – your pairing can surface in days what would fester elsewhere for months.",
      },
      friction: {
        hu: "A jelzéseid erősebben hathatnak rá, mint gondolnád. Nem feltétlenül sértődékeny, egyszerűen érzékenyebben reagálhat a megfogalmazásodra.",
        en: "Your signals may land deeper with them than you think: they're not touchy – they're sensitive; a small difference to you, everything to them.",
      },
      discuss: {
        hu: "Puhítsd a formát, ne az üzenetet: nála a kímélet nem gyengíti a kritikát, hanem célba juttatja.",
        en: "Soften the form, not the message: with them, gentleness doesn't dilute criticism – it's what makes it land.",
      },
    },
  },
  {
    id: "cross-E-low-A-high",
    kind: "cross",
    a: { dim: "E", pole: "low" },
    b: { dim: "A", pole: "high" },
    view: {
      easy: {
        hu: "Nyugodt, kiegyensúlyozott működés: te stabil vagy, ő türelmes – a kettőtök közelében ritka a dráma.",
        en: "Calm, balanced operation is likely: you tend to be steady, they patient – drama stays rare anywhere near the two of you.",
      },
      friction: {
        hu: "Mindketten kerülhetitek a mélyebb egyeztetést: te kevésbé érzed szükségét, ő pedig nehezebben hozhatja fel a kényes témákat. Így ezek a beszélgetések könnyen elmaradhatnak.",
        en: "You both avoid deeper alignment: you don't feel the need, they don't dare raise it – so delicate topics can stay buried.",
      },
      discuss: {
        hu: "Beszéljétek meg, ki és milyen rendszerességgel hozza fel a kényes témákat – különben könnyen egyikőtök sem vállalja ezt a szerepet.",
        en: "Name who raises the delicate topics and at what rhythm – between you, that role stays vacant by default.",
      },
    },
    viewB: {
      easy: {
        hu: "Nyugodt, kiegyensúlyozott működés: ő stabil, te türelmes vagy – a kettőtök közelében ritka a dráma.",
        en: "Calm, balanced operation is likely: they tend to be steady, you patient – drama stays rare anywhere near the two of you.",
      },
      friction: {
        hu: "A tárgyilagossága miatt nehéz leolvasnod, hányadán álltok – te pedig rákérdezés helyett inkább alkalmazkodsz, így a bizonytalanság marad.",
        en: "Their matter-of-factness can make it hard to read where you stand – and you may adapt rather than ask, so the uncertainty tends to stay.",
      },
      discuss: {
        hu: "Kérdezz rá közvetlenül arra, amit sejtesz – nála a direkt kérdés nem konfliktus, hanem hatékonyság, és pontos választ kapsz.",
        en: "Ask directly about what you suspect – for them a direct question isn't conflict, it's efficiency, and you'll get a precise answer.",
      },
    },
  },
  {
    id: "cross-C-high-E-high",
    kind: "cross",
    a: { dim: "C", pole: "high" },
    b: { dim: "E", pole: "high" },
    view: {
      easy: {
        hu: "Az általad épített kiszámíthatóság neki biztonságot ad: a rendszered csökkenti a bizonytalanságot, amire ő a legérzékenyebb.",
        en: "The predictability you build can give them safety: your system typically reduces the very uncertainty they're most sensitive to.",
      },
      friction: {
        hu: "Szoros határidő mellett az ő aggodalma a te feszültségedet is növelheti, a te egyre szorosabb ellenőrzésed pedig az övét – így könnyen tovább erősíthetitek egymás feszültségét.",
        en: "Under deadline pressure their worry can raise your tension – and your tightening control theirs: you may wind each other up.",
      },
      discuss: {
        hu: "Nyugodt időszakban készítsetek tartaléktervet, és egyezzetek meg, ki jelzi a csúszást – a korán kimondott késés kevesebb kárt okozhat, mint a felgyűlő, kimondatlan feszültség.",
        en: "Make a plan B in calm times and agree who calls the slip – a named delay costs you two less than silent panic.",
      },
    },
    viewB: {
      easy: {
        hu: "A rendszere neked biztonságot ad: kiszámítható keretek között az érzékenységed erőforrás, nem terhelés.",
        en: "Their system can give you safety: inside predictable frames your sensitivity tends to work as a resource rather than a load.",
      },
      friction: {
        hu: "Amikor szorossá válik a határidő, ő szigorúbban ellenőrizhet – te ezt könnyen magadra veheted, pedig jellemzően a helyzetnek szól, nem neked.",
        en: "When their deadline tightens, so can their control – you may easily take that personally, though it's typically aimed at the situation, not you.",
      },
      discuss: {
        hu: "Kérdezd meg nyomás alatt, mi segít neki – és jelezd korán a saját terhelésed: az ő rendszere tud alkalmazkodni, ha időben kap adatot.",
        en: "Under pressure, ask what helps them – and flag your own load early: their system can adapt when it gets data in time.",
      },
    },
  },
  {
    id: "cross-X-high-O-high",
    kind: "cross",
    a: { dim: "X", pole: "high" },
    b: { dim: "O", pole: "high" },
    view: {
      easy: {
        hu: "Ti lehettek a kezdeményező páros: az ő ötletei a te lendületeddel együtt gyorsan mozgásba hozhatnak új ügyeket és embereket.",
        en: "You two can be the initiative engine: their ideas paired with your momentum may set anything – and anyone – in motion fast.",
      },
      friction: {
        hu: "Sok kezdeményezés és kevés lezárás alakulhat ki: a környezetetek nehezen követheti a tempót, a közös lelkesedésetek pedig kívülről kapkodásnak tűnhet.",
        en: "Many launches, few landings: people around you can't track the pace, and your shared enthusiasm can read as scatter from outside.",
      },
      discuss: {
        hu: "Egyezzetek meg, mit kommunikáltok kifelé és mikor: mi a kísérlet és mi az elköteleződés – a környezetetek e kettőt nem tudja megkülönböztetni, ha ti nem mondjátok.",
        en: "Agree what you communicate outward and when: what's an experiment versus a commitment – people can't tell the two apart unless you say so.",
      },
    },
    viewB: {
      easy: {
        hu: "Ti lehettek a kezdeményező páros: a te ötleteid az ő lendületével együtt gyorsan mozgásba hozhatnak új ügyeket és embereket.",
        en: "You two can be the initiative engine: your ideas paired with their momentum may set anything – and anyone – in motion fast.",
      },
      friction: {
        hu: "Az energiája a még kiforratlan ötleteidet is gyorsan továbbviheti – mire alaposabban átgondolnád őket, könnyen már többen dolgozhatnak rajtuk.",
        en: "Their energy can broadcast even your unripe ideas instantly – by the time you'd think it through, three people may already be working on it.",
      },
      discuss: {
        hu: "Jelöld egyértelműen az ötleteidet: „hangosan gondolkodom” vagy „ezt valóban megcsináljuk”. Enélkül ő minden felvetést indítási jelzésnek vehet.",
        en: "Label your ideas: 'thinking out loud' versus 'let's actually do this' – without the label, every musing is a starting gun to them.",
      },
    },
  },
];

// ─────────────────────────────────────────────────────────────────────
// RÉS-ATOMOK — a mérési hibát meghaladó, de nem pólusos eltérésre.
//
// MIÉRT KELL: a fenti atomok PÓLUS-alapúak — csak akkor szólalnak meg, ha
// MINDKÉT fél a szélső sávban van (>65 / <35). Egy 62 vs 38 pár viszont
// 24 pontra van egymástól, ami a dimenzió-szintű mérési hiba (√2·SEM = 11)
// több mint kétszerese — valós, elmondható különbség, amiről ma néma volt a
// motor. A lefedettség-mérés szerint emiatt a valós párok ~35%-a EGYETLEN
// mondatot sem kapott (docs/audits/interaction-pair-coverage-2026-08-18.md).
//
// MIÉRT KÜLÖN SZÖVEG, nem a `same-*-high-low` atom újrahasznosítása: az a
// szöveg két SZÉLSŐ értékre íródott („te hozod a lendületet, ő a nyugalmat"),
// és egy 58 vs 44 résre hamisan erős. Ezek a változatok szándékosan
// halkabbak: RELATÍV állítást tesznek („a kettőtök közül te vagy a …-abb"),
// nem sávba sorolnak, és sosem címkézik a másikat.
//
// EPISZTEMIKUS STÁTUSZ: gyengébb, mint a pólus-atomé. A motor `basis: "gap"`
// jelöléssel adja tovább, a felület pedig ennek megfelelően jelöli — a
// becsült/mért megkülönböztetés a termék hitelességi alapelve (CLAUDE.md).
//
// CSAK KÉT VALÓS PROFILRA: az archetípus-úton a prototípus négy dimenziója
// szerkezetileg 50 (`ARCHETYPE_NEUTRAL_SCORE`), tehát a „rés" ott a kitalált
// középértékhez képest mérődne. A motor ezért a rés-atomokat kizárólag
// `profile-profile` / `measured` szinten aktiválja.
// ─────────────────────────────────────────────────────────────────────

export interface GapAtom {
  /** Stabil azonosító: "gap-C". */
  id: string;
  dim: HexacoCode;
  /** Az olvasó a MAGASABB pontszámú fél. */
  view: AtomBlocks;
  /** Az olvasó az ALACSONYABB pontszámú fél. */
  viewB: AtomBlocks;
}

export const GAP_ATOMS: Record<HexacoCode, GapAtom> = {
  H: {
    id: "gap-H",
    dim: "H",
    view: {
      easy: {
        hu: "A kettőtök közül jellemzően te igazodsz szigorúbb belső szabályokhoz – ez kiszámítható keretet adhat a közös munkának.",
        en: "Of the two of you, you typically move by stricter internal rules – in shared work this can give a predictable, straight line.",
      },
      friction: {
        hu: "Ahol ő rugalmasan taktikázna, ott te már határt érzékelhetsz – és ez ítélkezésnek tűnhet, ha nem beszélitek ki.",
        en: "Where they would manoeuvre flexibly, you may already sense a boundary – and that can read as judgement if you don't talk it through.",
      },
      discuss: {
        hu: "Járjátok körbe előre, hol húzódik nálatok a határ az érdekérvényesítés és a megalkuvás között – utólag ez nehezebb beszélgetés.",
        en: "Map out in advance where each of you draws the line between pushing your interest and compromising – that conversation is harder after the fact.",
      },
    },
    viewB: {
      easy: {
        hu: "A kettőtök közül jellemzően te vagy a pragmatikusabb az érdekérvényesítésben – versengő helyzetben ez a párosnak előnyt adhat.",
        en: "Of the two of you, you typically take the more pragmatic line on advancing your interests – in a competitive setting this can be an advantage for the pair.",
      },
      friction: {
        hu: "Ami neked természetes taktika, azt ő könnyen elvi kérdésként élheti meg – a súrlódás ilyenkor nem a szándékról szól, hanem a mércéről.",
        en: "What feels like natural tactics to you, they may readily experience as a matter of principle – the friction is then about the standard, not the intent.",
      },
      discuss: {
        hu: "Tisztázzátok előre, mi az, amiben nem alkusztok – így nem menet közben derül ki, hogy máshol van a határotok.",
        en: "Clarify up front what neither of you will trade away – so it doesn't surface mid-task that your lines sit in different places.",
      },
    },
  },
  E: {
    id: "gap-E",
    dim: "E",
    view: {
      easy: {
        hu: "A kettőtök közül jellemzően te reagálsz érzékenyebben a helyzetek emberi oldalára – ez korán jelezheti, ha valami nem stimmel körülöttetek.",
        en: "Of the two of you, you typically respond more sensitively to the human side of a situation – this can flag early when something is off around you.",
      },
      friction: {
        hu: "Ami neked jelzés, az nála még lehet, hogy csak zaj: előfordulhat, hogy túlreagálásnak látja, amit te jogos aggodalomnak.",
        en: "What reads as a signal to you may still be noise to them: they might see as overreaction what you experience as warranted concern.",
      },
      discuss: {
        hu: "Beszéljétek meg, hogyan jelzitek egymásnak a nyugtalanságot úgy, hogy az ne minősítés legyen – és mikor van szükség tényleg gyors megnyugtatásra.",
        en: "Agree on how you flag unease to each other without it landing as a verdict – and when quick reassurance is genuinely what's needed.",
      },
    },
    viewB: {
      easy: {
        hu: "A kettőtök közül jellemzően te viseled nyugodtabban a bizonytalan helyzeteket – feszült pillanatokban ez horgony lehet a párosnak.",
        en: "Of the two of you, you typically carry uncertainty more calmly – in tense moments this can be an anchor for the pair.",
      },
      friction: {
        hu: "A nyugalmad kívülről közömbösségnek is látszhat: előfordulhat, hogy ő azt éli meg, nem veszed komolyan, ami őt nyomasztja.",
        en: "Your calm can look like indifference from the outside: they may experience it as you not taking seriously what weighs on them.",
      },
      discuss: {
        hu: "Egyezzetek meg abban, hogy nem kell azonnal megoldani, amit ő felvet – sokszor elég visszajelezni, hogy hallottad.",
        en: "Agree that what they raise doesn't need solving on the spot – often it's enough to signal that you heard it.",
      },
    },
  },
  X: {
    id: "gap-X",
    dim: "X",
    view: {
      easy: {
        hu: "A kettőtök közül jellemzően te viszed inkább a szót és a lendületet – így a közös kezdeményezések könnyebben kapnak kezdő lendületet.",
        en: "Of the two of you, you typically carry more of the talking and the momentum – so shared starts rarely need a separate push.",
      },
      friction: {
        hu: "Könnyen előfordulhat, hogy a közös egyeztetéseken te töltöd ki a csendeket, és emiatt kevesebb tér marad annak, amit ő gondol.",
        en: "You may readily end up filling the silences in your shared conversations, leaving less room for what they're thinking.",
      },
      discuss: {
        hu: "Időnként kérdezz rá, jut-e neki elég tér a közös beszélgetésekben, és mely témákat lenne jobb előre, írásban körbejárni.",
        en: "Check in once: is there enough room for them in your shared conversations, or would some topics be better circled in writing beforehand?",
      },
    },
    viewB: {
      easy: {
        hu: "A kettőtök közül jellemzően te hozod a nyugodtabb, fókuszáltabb tempót – a mély munka általában nálad talál helyet.",
        en: "Of the two of you, you typically bring the calmer, more focused pace – deep work usually finds its place with you.",
      },
      friction: {
        hu: "Ha nem jelzed, hogy több feldolgozási időre van szükséged, ő ezt könnyen nem veszi észre – csak azt látja, hogy kevesebbet szólsz hozzá.",
        en: "If you don't say that you need more processing time, they may easily miss it – they only see that you speak up less.",
      },
      discuss: {
        hu: "Mondd ki, mikor van szükséged előzetes felkészülésre, és egyezzetek meg, mi mehet írásban a közös döntések előtt.",
        en: "Name when you need preparation time, and agree on what can go in writing ahead of joint decisions.",
      },
    },
  },
  A: {
    id: "gap-A",
    dim: "A",
    view: {
      easy: {
        hu: "A kettőtök közül jellemzően te vagy a megengedőbb: könnyebben adsz második esélyt, és ritkábban viszed konfliktusba a nézeteltérést.",
        en: "Of the two of you, you're typically the more accommodating: you give second chances more readily and less often take a disagreement into conflict.",
      },
      friction: {
        hu: "Előfordulhat, hogy elnyeled azt, ami zavar – ő pedig ebből keveset érzékel, mert nála inkább a nyílt kimondás a természetes út.",
        en: "You may swallow what bothers you – and they'll sense little of it, because naming things openly tends to be their natural route.",
      },
      discuss: {
        hu: "Beszéljétek meg, hogyan jeleztek egymásnak, ha valami nem stimmel – nálad ez könnyen csendben marad, és utólag nehezebb elővenni.",
        en: "Agree on how you'll flag it when something isn't right – with you it can easily stay unsaid, and it's harder to raise later.",
      },
    },
    viewB: {
      easy: {
        hu: "A kettőtök közül jellemzően te vagy az egyenesebb: kimondod, ha valami nem stimmel, és ettől a dolgok gyorsabban tisztázódhatnak.",
        en: "Of the two of you, you're typically the more direct: you say when something isn't right, and things can clear up faster for it.",
      },
      friction: {
        hu: "Ami neked tárgyszerű visszajelzés, azt ő élesebbnek hallhatja, mint ahogy szántad – és inkább visszahúzódik, mint hogy visszaszóljon.",
        en: "What is matter-of-fact feedback to you, they may hear as sharper than you meant – and they'll tend to withdraw rather than push back.",
      },
      discuss: {
        hu: "Kérdezzetek rá időnként, hogyan érkezik meg a visszajelzésetek – a szándék és a hatás itt könnyen elválik egymástól.",
        en: "Check now and then how your feedback actually lands – intent and effect can easily come apart here.",
      },
    },
  },
  C: {
    id: "gap-C",
    dim: "C",
    view: {
      easy: {
        hu: "A kettőtök közül jellemzően te viszed inkább a szervezettséget és a végrehajtást – a közös munkában valószínűleg nálad futnak össze a szálak.",
        en: "Of the two of you, you typically carry more of the structure and follow-through – in shared work the threads are likely to meet at your end.",
      },
      friction: {
        hu: "Előfordulhat, hogy a részletek és a határidők rendre nálad landolnak, miközben ő lazábban kezeli őket – ez idővel fárasztó egyoldalúságot hozhat.",
        en: "Details and deadlines may keep landing with you while they hold them more loosely – over time that can build a tiring one-sidedness.",
      },
      discuss: {
        hu: "Rögzítsétek, mit jelent nálatok a „kész”, és ki mit visz végig – a ki nem mondott mérce gyakran a súrlódás fő forrása.",
        en: "Write down what “done” means between you and who carries what to the end – an unspoken standard is the most common source of friction.",
      },
    },
    viewB: {
      easy: {
        hu: "A kettőtök közül jellemzően te vagy a rugalmasabb: könnyebben módosítasz menet közben, és ritkábban akadsz fenn a részleteken.",
        en: "Of the two of you, you're typically the more flexible: you adjust more easily mid-course and get caught on details less often.",
      },
      friction: {
        hu: "Ami neked elég jó, az nála még lehet, hogy nincs kész – és ha nem beszélitek ki, könnyen csendben átveszi a maradékot.",
        en: "What's good enough for you may not yet be finished for them – and if you don't talk about it, they may quietly pick up the remainder.",
      },
      discuss: {
        hu: "Egyezzetek meg egy közös „kész” definícióban, és abban, mikor szóltok, ha valami csúszik – a jelzés hiánya általában többet ront, mint maga a csúszás.",
        en: "Agree on a shared definition of “done” and on when you'll speak up if something slips – the missing signal usually does more damage than the slip.",
      },
    },
  },
  O: {
    id: "gap-O",
    dim: "O",
    view: {
      easy: {
        hu: "A kettőtök közül jellemzően te hozod inkább az új ötleteket és a másféle megközelítések lehetőségét.",
        en: "Of the two of you, you typically bring more of the new ideas and the option of doing it differently.",
      },
      friction: {
        hu: "Ami neked izgalmas irányváltás, az nála könnyen felesleges kör lehet – főleg, ha a meglévő megoldás még működik.",
        en: "What is an exciting change of direction to you may easily be a needless detour to them – especially while the current solution still works.",
      },
      discuss: {
        hu: "Egyezzetek meg, mikor van tere a kísérletezésnek és mikor a bevált útnak – a kettő ritkán jó ugyanabban a fázisban.",
        en: "Agree on when there's room for experimenting and when for the proven path – the two are rarely right in the same phase.",
      },
    },
    viewB: {
      easy: {
        hu: "A kettőtök közül jellemzően te ragaszkodsz inkább a bevált megoldásokhoz – ez tarthatja földön a közös munkát.",
        en: "Of the two of you, you typically hold more to proven solutions – this can keep the shared work grounded.",
      },
      friction: {
        hu: "Ami neked felesleges kör, az nála lehet, hogy a lényeg – és ha rendre lezárod, könnyen azt élheti meg, hogy nincs helye a gondolkodásnak.",
        en: "What is a needless detour to you may be the point for them – and if you keep closing it down, they may experience it as having no room to think.",
      },
      discuss: {
        hu: "Adjatok külön időt az ötletelésnek és a döntésnek – így nem a döntés pillanatában ütközik a két üzemmód.",
        en: "Give ideation and decision-making separate time – so the two modes don't collide at the moment of deciding.",
      },
    },
  },
};

// ─────────────────────────────────────────────────────────────────────
// Vezető-kiegészítők — mit jelent, ha a POLARIZÁLT dimenzió a vezetőnél
// van. Az olvasó a beosztott; a szöveg a vezető-mód kapcsolóval jelenik
// meg az atomok mellett.
//
// A vezetőt NEM mértük — ezért minden blokk hipotézis-keretben szól
// („Ha a vezetőd erősen…, jellemzően…"), viselkedéses, nem-ítélkező
// címkékkel. Guardrail: interaction-language.test.ts (hedge kötelező,
// abszolutizálás tilos) ezt a mapet is fedi.
// ─────────────────────────────────────────────────────────────────────

export const LEADER_SUPPLEMENTS: Record<
  HexacoCode,
  Record<Pole, LocalizedText>
> = {
  X: {
    high: {
      hu: "Ha a vezetőd erősen extravertált, a megbeszélései jellemzően gyors tempójúak, és aki hangosabb, könnyebben kap teret. Kérj előre biztosított megszólalási lehetőséget – például külön napirendi pontot vagy írásos felvezetést –, mert a csendet könnyen egyetértésnek értelmezheti.",
      en: "If your leader is strongly extraverted, their meetings typically move fast, and louder voices get the floor more easily. Ask for structured airtime – an agenda item, a written brief – because silence can easily look like agreement to them.",
    },
    low: {
      hu: "Ha a vezetőd inkább introvertált, jellemzően kevés spontán visszajelzést ad, és nem tölti ki a teret – ez ritkán távolságtartás. Kérdezz rá aktívan az értékelésére: nála a csend általában nem elégedetlenség, de a dicséret sem hangos.",
      en: "If your leader leans introverted, they typically give little spontaneous feedback and don't fill the room – that's rarely distance. Ask actively for their read: with them, silence usually isn't displeasure, but praise isn't loud either.",
    },
  },
  E: {
    high: {
      hu: "Ha a vezetőd érzelmileg erősen ráhangolódó, a hangulata jellemzően érződik a csapaton, és a terheket komolyan veszi – a tiédet is. Az őszinte jelzést általában értékeli, de időzítsd: feszült pillanatban a rossz hír nála felerősödhet.",
      en: "If your leader is highly emotionally attuned, their mood typically carries through the team, and they take burdens seriously – including yours. They usually value honest signals, but time them: in a tense moment, bad news can amplify with them.",
    },
    low: {
      hu: "Ha a vezetőd érzelmileg visszafogottabb, jellemzően kevés érzelmi megerősítést ad, és a „nincs hír” nála általában jó hír. Ha megerősítésre van szükséged, kérd egyértelműen – magától ritkán jut eszébe, de jellemzően szívesen megadja.",
      en: "If your leader is more emotionally reserved, they typically give little emotional affirmation, and with them no news is usually good news. If you need reassurance, ask for it explicitly – it rarely occurs to them on their own, but they'll usually give it gladly.",
    },
  },
  H: {
    high: {
      hu: "Ha a vezetőd erősen elvhű, jellemzően kiszámítható és méltányos, tartja a szavát, és általában ugyanezt várja tőled is. A taktikázás és a szépített beszámoló könnyen rombolhatja a bizalmát, míg a hiba vagy a rossz hír korai, őszinte jelzése erősítheti azt.",
      en: "If your leader is strongly principled, they tend to be predictable and fair, bound by their word – usually expecting the same in return. Manoeuvring and polished reports risk a lot with them, while honest admission of error earns points: naming bad news early can build trust.",
    },
    low: {
      hu: "Ha a vezetőd pragmatikusan és rugalmasan kezeli a prioritásokat, jellemzően gyorsan dönt, a hangsúlyai pedig a helyzettel együtt változhatnak. Érdemes írásban rögzíteni a megállapodásaitokat, és rákérdezni a ki nem mondott szempontokra is.",
      en: "If your leader has flexible priorities and a deal-making style, they tend to decide fast and pragmatically, with emphases that move with the situation. It's worth putting your agreements in writing, because their focus can move on quickly – and watch for their unstated considerations too.",
    },
  },
  C: {
    high: {
      hu: "Ha a vezetőd erősen strukturált, a minőség és a határidő nála jellemzően nem stílus, hanem megállapodás kérdése. Meglepetés helyett korai jelzést vár – a csúszás önmagában általában megbocsátható, az eltitkolt csúszás sokkal kevésbé.",
      en: "If your leader is highly structured, quality and deadlines typically aren't a matter of style for them but of agreement. They expect early warning rather than surprises – a slip in itself is usually forgivable; a hidden slip far less so.",
    },
    low: {
      hu: "Ha a vezetőd kevésbé strukturált, jellemzően kevés keretet ad, és a részletek elsikkadhatnak nála – a szabadság valódi, a struktúráról viszont jó eséllyel magadnak kell gondoskodnod. Kérdezd meg konkrétan: mit, mikorra, milyen mélységben.",
      en: "If your leader is less structured, they typically set few frames, and details can slip past them – the freedom is real, but you'll likely have to supply the structure yourself. Ask concretely: what, by when, at what depth.",
    },
  },
  A: {
    high: {
      hu: "Ha a vezetőd erősen harmóniakereső, jellemzően türelmes, és a kritikát ritkán mondja ki élesen – figyeld a finom jelzéseket, mert nála a „talán érdemes lenne” gyakran erős kérés. Kérj konkrét visszajelzést, különben könnyen csak a jót hallod.",
      en: "If your leader leans strongly toward harmony, they tend to be patient and rarely sharp in criticism – watch for subtle signals, because their 'perhaps it might be worth' is often a firm request. Ask for concrete feedback, or you may only ever hear the good part.",
    },
    low: {
      hu: "Ha a vezetőd nagyon közvetlen stílusú, az éles hangnem jellemzően nem személyes, hanem a működésmódja része. A vitát általában jól bírja, és sokra tarthatja, ha érvekkel vitatkozol vele. A ki nem mondott sérelmet és a csendes visszahúzódást nehezebben érzékeli, ezért a nyílt ellentmondás lehet a biztonságosabb út.",
      en: "If your leader has a very direct style, the edge is typically a mode, not personal – they usually handle debate well and respect those who push back with arguments. What they handle less well is unspoken hurt and silent withdrawal; open disagreement may be the safer route with them.",
    },
  },
  O: {
    high: {
      hu: "Ha a vezetőd erősen újító, az irányok nála gyakran változhatnak, és a legfrissebb ötlet könnyen előtérbe kerülhet a korábbi stratégiához képest. Kérdezd meg rendszeresen, mi rögzített irány és mi csupán kísérlet – különben a hangos gondolkodást is elköteleződésként értelmezheted.",
      en: "If your leader is a strong innovator, directions tend to change often, and the latest idea can speak louder than last year's strategy. Regularly ask what's fixed and what's an experiment – otherwise you may hear every musing as a commitment.",
    },
    low: {
      hu: "Ha a vezetőd inkább a bevált utakat követi, az újításról jellemzően a bizonyíték győzi meg, nem a lelkesedés. Az ötleteidet adatokkal és kis léptékű próbával vidd elé – a „próbáljuk ki kicsiben” várhatóan nyitottságot teremt, a „forradalmasítsuk” inkább ellenállást válthat ki.",
      en: "If your leader prefers proven paths, evidence typically persuades them where enthusiasm won't. Bring your ideas with numbers and low stakes – 'let's pilot it small' tends to open their door, while 'let's revolutionise' tends to close it.",
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
 * jelzi, hogy a kérdező A-oldala az atom B-oldala – ilyenkor a viewB szól
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
