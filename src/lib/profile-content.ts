import type { ProfileCategory } from "./profile-engine";
import { getDimensionTier, DIMENSION_LEVEL_LABELS } from "./dimension-utils";

export type Locale = "hu" | "en";
type LocalizedText = Record<Locale, string>;

// A korábbi `poleAwareDimensionLabel` 2026-08-18-án KIVEZETVE. Azért létezett,
// mert a valenciás tier-címke („figyelendő") a fordított kódolású
// Emocionalitás alacsony sávján hamis volt, és „stabil"-ra kellett foltozni.
// A címke azóta valencia-mentes szint-szó (dimension-utils.getDimensionLabel:
// magas/közepes/alacsony), amelyik minden dimenzión igaz — a folt tárgytalan.
// A hívási helyek közvetlenül a `getDimensionLabel`-t használják.

// ─── Block 1 – Bevezető framing ───────────────────────────────────────────────

export const BLOCK1: LocalizedText = {
  hu: "A válaszaid alapján azt nézzük meg, hogyan dolgozhatsz különböző munkahelyi helyzetekben: mi ösztönöz, mi terhelhet, és mi segíthet megőrizni az egyensúlyodat. A riport önjellemzésen alapuló értelmezés, nem diagnózis.",
  en: "No labels. Instead, we highlight how you operate at work: what moves you forward, what weighs on you, and what keeps you steady. Not a diagnosis, but a clean snapshot of your current patterns.",
};

// ─── Block 8 – Záró framing: KIVEZETVE (2026-08-11) ──────────────────────────
//
// A záró „iránytű"-bekezdés (a kulcs-tanulságok kártya alján, a felületen és
// a PDF-ben is) tulajdonosi döntéssel törölve — zavaró volt. A `closingText`
// prop-lánc a KeyTakeawaysSection / PdfTakeaways felől is kivezetve, hogy ne
// maradjon holt vezeték. Ha valaha visszakerül, a kulcs-tanulságok kártya a
// helye — nem új szekció.

// ─── Dimenzió nevek (Block 2 megjelenítőhöz) ─────────────────────────────────

export const DIM_LABELS: Record<string, LocalizedText> = {
  H: { hu: "Becsületesség-Alázat", en: "Honesty-Humility" },
  E: { hu: "Emocionalitás", en: "Emotionality" },
  X: { hu: "Extraverzió", en: "Extraversion" },
  A: { hu: "Barátságosság", en: "Agreeableness" },
  C: { hu: "Lelkiismeretesség", en: "Conscientiousness" },
  O: { hu: "Nyitottság", en: "Openness" },
};

// Ugyanaz a három szint-szó, mint a pontszám melletti címkéé — a kanonikus
// térképből származtatva (dimension-utils DIMENSION_LEVEL_LABELS), hogy ne
// fusson kétféle szóhasználat ugyanarra a sávra. A kulcsnév tér csak el:
// ProfileCategory „medium", DimensionTier „mid".
export const CATEGORY_LABELS: Record<ProfileCategory, LocalizedText> = {
  high: DIMENSION_LEVEL_LABELS.high,
  medium: DIMENSION_LEVEL_LABELS.mid,
  low: DIMENSION_LEVEL_LABELS.low,
};

// ─── Block 3 – Működési narratíva (tension-specifikus szövegek) ───────────────

export const RESOLUTION_NARRATIVES: Record<string, LocalizedText> = {
  ethicalLeader: {
    hu: "Válaszaid alapján szívesen vállalsz szerepet a közös munkában, és fontos neked, hogy azt képviseld, amiben hiszel. Egy megbeszélésen fontos lehet neked, hogy a javaslatod mellett azt is elmondd, miért tartod tisztességesnek. Olyan feladatok állhatnak közel hozzád, ahol nyíltan kell állást foglalni és felelősséget vállalni.",
    en: "Your responses suggest a rarer pattern: your principles matter to you, and so does being seen living them. It's not the spotlight that seems to draw you, but being seen as authentic – you're likely to thrive in roles where credibility is the currency.",
  },
  principledConfronter: {
    hu: "Válaszaid alapján akkor is kiállhatsz az elveid mellett, ha ez nehéz beszélgetéssel jár. Közel állhatnak hozzád azok a feladatok, ahol kényes ügyeket kell kivizsgálni, szabályokat betartatni vagy kellemetlen tényeket kimondani.",
    en: "Your pattern leans principled and willing to confront – you rarely avoid difficult conversations. Ethical investigations, regulatory work, or anywhere the uncomfortable truth needs voicing are likely natural ground for you.",
  },
responsibleInnovator: {
  hu: "Válaszaid alapján szívesen próbálsz ki új megoldásokat, közben azt is mérlegeled, összeegyeztethetők-e az elveiddel. Egy új ötletnél például az is fontos lehet neked, hogyan hat másokra a megvalósítása.",
  en: "Your responses suggest you are open to new approaches, while your decisions are typically guided by a strong inner value system. For you, innovation is rarely an end in itself – more often deliberate and responsibly executed.",
},
  supportedVisibility: {
    hu: "A válaszaid alapján szívesen vagy emberek között, a tartós nyomás viszont hamar megterhelhet. Sokat számíthat, hogy világos elvárások mellett dolgozz, rendszeresen kapj visszajelzést, és legyen kitől segítséget kérned.",
    en: "Your responses suggest social settings typically energize you, while sustained pressure can wear on you quickly. Roles with feedback, psychological safety, and recognition are likely to fit you best – not just expectations and pressure.",
  },
  structuredStability: {
    hu: "Válaszaid alapján sokat vársz el magadtól, és érzékenyen reagálhatsz a terhelésre. Könnyebb lehet tartanod a számodra fontos színvonalat, ha kiszámíthatóan dolgozhatsz, és előre hagysz időt a pihenésre is.",
    en: "Your responses suggest you expect a lot of yourself while responding more sensitively to load – together these call for deliberate energy management. A predictable, structured, supportive environment is where you're likely to bring out your best.",
  },
  safeExperimentation: {
    hu: "Az új lehetőségek vonzhatnak, miközben az ismeretlen feszültséget is kelthet benned. Segíthet, ha kisebb lépésekben próbálhatsz ki valamit, és előre tudod, mihez térhetsz vissza, ha nem válik be.",
    en: "The unknown draws you in, but can also create tension. You typically function best in innovation environments with a safety net – where not everything needs to be risked at once.",
  },
  deepCollaboration: {
    hu: "Válaszaid alapján közel állhat hozzád, ha néhány emberrel hosszabb ideig dolgozhatsz együtt. Így van időtök megismerni egymást, és kevesebb energiát kérhet tőled, hogy újra és újra új társasághoz alkalmazkodj.",
    en: "Your responses suggest it's not company you avoid – it's superficial interaction. You tend to perform best in small-group, long-term, trust-based collaboration, where you don't need to befriend everyone, only your close collaborators.",
  },
  solitaryInnovator: {
    hu: "Válaszaid alapján az új ötleteket szívesen gondolod végig önállóan, zavartalanul. Közel állhatnak hozzád például a kutatói, elemzői vagy rendszertervezői feladatok, ahol időt kapsz a lehetőségek alapos vizsgálatára.",
    en: "You tend to develop your ideas alone rather than in brainstorms. The richness of your inner world combined with a drive for novelty makes a rarer profile: solitary researcher, strategic analyst, architect-type roles are likely close to you.",
  },
  facilitatedInnovation: {
    hu: "Válaszaid alapján szívesen keresel új megoldásokat másokkal együtt. Például egy közös tervezés vagy műhelymunka során fontos lehet neked, hogy a többiek javaslatai is alakítsák az eredményt.",
    en: "Your responses point to an innovating pattern you typically don't carry alone: you involve others and shape ideas together. Design thinking, participatory design, workshop facilitation – you're likely in your element where innovation is teamwork.",
  },
  structuredCompetitor: {
    hu: "Válaszaid alapján ösztönözhet a verseny, és a céljaidért következetesen dolgozhatsz. Segíthet, ha világos, milyen eredményt várnak tőled, hogyan mérik a teljesítményt, és milyen szabályok szerint versenyeztek.",
    en: "Your responses show an ambitious, disciplined pattern – in a structured environment your competitive drive can be your greatest asset. You tend to win through performance, not politics.",
  },
  structuredInnovator: {
    hu: "Válaszaid alapján szívesen keresel új megoldásokat, és meg is tervezed, hogyan valósítanád meg őket. A világos cél és munkamenet segíthet abban, hogy az ötletelés után a részleteket is végigvidd.",
    en: "You are drawn to novel problems, but you typically do your best work within structured frameworks. This is not a contradiction – it is the natural profile of structured innovation.",
  },
  resilientLeader: {
    hu: "Válaszaid alapján szívesen vállalsz szerepet mások mellett, és nyomás alatt is többnyire megőrzöd a nyugalmadat. Egy bizonytalan helyzetben ez segíthet abban, hogy kezdeményezz, és a többieknek is támpontot adj.",
    en: "Your responses point to a rarer pairing: you're in your element among people, and pressure rarely throws you off. When others waver, you tend to hold direction – stress rarely damages your relationships; if anything, that's when you can become a real support.",
  },
  calmExecution: {
    hu: "Válaszaid alapján általában gondosan dolgozol, és a nyomás sem zökkent ki könnyen. Egy nehezebb időszakban is segíthet, ha követni tudod a megszokott munkamenetet, és sorra lezárod a feladataidat.",
    en: "Your responses suggest you deliver reliably and consistently – your conscientiousness and emotional stability reinforce each other. Where others might derail under pressure, you tend to produce results predictably.",
  },
  exploratoryAnalyst: {
    hu: "Válaszaid alapján kíváncsian fordulsz az ismeretlen felé, és a bizonytalanság sem feltétlenül feszélyez. Közel állhatnak hozzád azok a kutatói vagy elemzői feladatok, amelyekben még nincs kész válasz, és neked kell utánajárnod a kérdéseknek.",
    en: "Your responses suggest curiosity about the unknown, with uncertainty rarely unsettling you – a combination that doesn't often go together. You tend to explore new territory calmly and thoroughly; research, analysis, and discovery are likely where you feel most at home.",
  },
  organizedLeader: {
    hu: "Válaszaid alapján szívesen szervezed a közös munkát: egyeztetsz a többiekkel, feladatokat és határidőket tisztázol. Olyan helyzetek állhatnak közel hozzád, ahol az emberek bevonására és a terv követésére egyaránt szükség van.",
    en: "Your responses suggest you're good with people while keeping tasks in order: you organize, communicate, and typically deliver what you commit to. You can mobilize the team and follow plans through at the same time.",
  },
  harmoniousConnector: {
    hu: "Válaszaid alapján szívesen kezdeményezel kapcsolatot, és közben mások szempontjaira is figyelsz. Egy csapatban például hozzájárulhatsz ahhoz, hogy az emberek megszólaljanak, és könnyebben megegyezzenek egymással.",
    en: "Momentum and receptive attention appear together in your profile – a rarer combination. You bring energy to the team while staying attentive to others, which is why you're often the one holding the team together.",
  },
  performanceDriver: {
    hu: "Válaszaid alapján fontos lehet neked az eredmény, és szívesen dolgozol érte terv szerint. A verseny ösztönözhet, a gondos előkészítés pedig segíthet abban, hogy végigvidd, amit vállaltál.",
    en: "Your responses show an ambitious, organized pattern – you tend to reach goals through hard work and consistent execution. Competitive drive and precision don't cancel each other out in your profile; together they can power your results.",
  },
  disruptiveInnovator: {
    hu: "Válaszaid alapján szívesen megkérdőjelezed a megszokott megoldásokat, és vitában is kiállhatsz az új ötleteid mellett. Ez olyan feladatoknál lehet hasznos, ahol a változtatáshoz a kényelmetlen kérdéseket is fel kell tenni.",
    en: "Your responses point to independent, questioning thinking: you rarely compromise just for the sake of peace, while staying open to new ideas. In the right environment, the two together can be a serious innovative force.",
  },
};

// ─── Block 3 – Rövid működési összkép (ne ismételje a 6/7 blokkokat) ─────────

export const BLOCK3_SUMMARIES: Record<string, LocalizedText> = {
  ethicalLeader: {
    hu: "Fontos neked, hogy a szavaid és a tetteid összhangban legyenek. Ezt akkor is szem előtt tarthatod, amikor közös döntésben vállalsz szerepet.",
    en: "Authenticity and visible responsibility both matter to you. You tend to be strongest in situations where direction must be set on clear values.",
  },
  principledConfronter: {
    hu: "Jellemzően kimondod, ha valamit nem tartasz helyesnek, akkor is, ha ebből vita lehet. Fontos neked, hogy a kényes kérdések megbeszélhetők legyenek.",
    en: "Directness and conflict tolerance show up together in your responses. You tend to work well where clear boundaries and explicit tensions must be handled.",
  },
  responsibleInnovator: {
    hu: "Az új ötleteknél jellemzően azt is mérlegeled, összhangban vannak-e az elveiddel, és milyen következménnyel járhatnak másokra nézve.",
    en: "You are open to novelty, but you typically decide through an internal ethical compass. For you, innovation and responsibility are not opposites, but one operating principle.",
  },
  supportedVisibility: {
    hu: "Szívesen dolgozhatsz emberekkel, ha közben biztonságban érzed magad, és tudod, mire számíthatsz. A rendszeres visszajelzés ebben támpontot adhat.",
    en: "Social visibility typically motivates you when it is supported by safety. You perform well in visible roles when feedback remains stable and constructive.",
  },
  structuredStability: {
    hu: "A magas elvárások és a terhelésre adott érzékenyebb reakció együtt kimeríthetnek. Segíthet, ha előre eldöntöd, mire jut időd, és mikor állsz meg.",
    en: "High internal standards combined with sensitivity require intentional structure. In a well-structured environment, you can sustain high quality at a healthy pace.",
  },
  safeExperimentation: {
    hu: "Az újdonság vonzhat, de könnyebb lehet belevágnod, ha előre látod a kockázatot és a következő lépést.",
    en: "Novelty attracts you, but you also need stable reference points. You work best when experimentation has a clear rhythm and boundaries.",
  },
  deepCollaboration: {
    hu: "Jellemzően közelebb áll hozzád néhány tartós munkakapcsolat, mint az, hogy sok új emberrel kelljen egyszerre kapcsolatot építened.",
    en: "Deep, trust-based collaboration gives you more than broad visibility. Your performance typically unfolds best in smaller, stable relationship networks.",
  },
  solitaryInnovator: {
    hu: "Az új ötletekhez jellemzően egyedül szeretsz eljutni. Ehhez időre és megszakítások nélküli munkára lehet szükséged.",
    en: "You mainly develop ideas through deep, independent work. Your strength is sustained thinking and building new perspectives quietly.",
  },
  facilitatedInnovation: {
    hu: "Válaszaid alapján szívesen vonod be a többieket, amikor valamin változtatnál. Az ötleteiket a megoldás kialakításához is felhasználhatod.",
    en: "You bring novelty into systems while bringing people with you. Based on your responses, collaborative change-building is your natural operating mode.",
  },
  structuredCompetitor: {
    hu: "Versenyhelyzetben jellemzően kitartóan dolgozol a célodért. Könnyebb lehet haladnod, ha egyértelmű, milyen eredmény számít sikernek.",
    en: "You typically approach competition with discipline and consistent execution. You're likely strongest in environments where performance and measurability are explicit.",
  },
  structuredInnovator: {
    hu: "Az ötletelés mellett jellemzően a megvalósítás lépéseit is szereted átgondolni. A terv segíthet, hogy az új megoldásból befejezett munka legyen.",
    en: "You typically think through new solutions in systems, not ad hoc. You do your best work when creativity and structure are both present.",
  },
  resilientLeader: {
    hu: "Társas helyzetekben jellemzően szívesen kezdeményezel, és stressz alatt is többnyire nyugodt maradsz. Ez a közös döntésekben is segíthet.",
    en: "You typically stay balanced even under stress, drawing energy from relationships to sustain it. You're likely strongest in situations that call for both human presence and stability.",
  },
  calmExecution: {
    hu: "Jellemzően következetesen dolgozol, és a terhelés sem könnyen zökkent ki. Nehezebb helyzetben is támaszkodhatsz a megszokott munkamenetedre.",
    en: "You typically complete what you take on reliably and calmly. Pressure rarely unsettles you, and you close tasks consistently.",
  },
  exploratoryAnalyst: {
    hu: "Az ismeretlen feladatokhoz jellemzően kíváncsian közelítesz. A bizonytalanság mellett is tudsz időt hagyni a kérdések alapos vizsgálatára.",
    en: "You approach the unknown with curiosity and calm. Novelty unsettles many – you typically find it energizing while maintaining analytical focus.",
  },
  organizedLeader: {
    hu: "Szeretsz másokkal dolgozni, és jellemzően a feladatok rendjére is figyelsz: ki mit vállalt, mikorra készül el, és mi következik utána.",
    en: "You work with people and you close things out. You keep the team moving while typically having a plan and a deadline at hand.",
  },
  harmoniousConnector: {
    hu: "Válaszaid alapján könnyen kezdeményezel beszélgetést, és keresed a megegyezés lehetőségét. Így a közös munkában az egyeztetést is segítheted.",
    en: "You build relationships, hold the team together, and collaboration is your natural medium. You typically maintain harmony with little visible effort.",
  },
  performanceDriver: {
    hu: "Válaszaid alapján a verseny és a konkrét eredmény ösztönözhet. A céljaidért jellemzően megtervezed és végig is viszed a feladataidat.",
    en: "An ambitious, organized pattern – you tend to reach goals through hard work and consistent execution. Competitive drive and precision characterize you together.",
  },
  disruptiveInnovator: {
    hu: "Válaszaid alapján nem feltétlenül fogadod el, hogy valamit csak azért csináljatok ugyanúgy, mert eddig is így volt. Az új ötleteid mellett vitában is kiállhatsz.",
    en: "Your responses suggest you rarely shy away from challenging the status quo, and you look for new directions. Confrontation is more tool than obstacle for you – novelty and directness appear together in your profile.",
  },
};

// ─── Block 7 – Kockázati jelzők szövegei ─────────────────────────────────────

export const RISK_TEXTS: Record<string, LocalizedText> = {
  supportedVisibility: {
    hu: "A sok beszélgetés és szereplés idővel lemeríthet. Hagyj köztük időt a pihenésre, és beszéld meg, kitől kérhetsz visszajelzést, ha elbizonytalanodsz.",
    en: "If social intensity runs long, your energy may drop fast. Try scheduling regular feedback check-ins and leaving deliberate recovery time.",
  },
  structuredStability: {
    hu: "Előfordulhat, hogy a szükségesnél többször ellenőrzöd a munkádat, és úgy érzed, mintha állandó készenlétben lennél. Segíthet, ha a munkát rövid, világos szakaszokra bontod, és előre kijelölöd, mi számít késznek.",
    en: "You may find yourself over-monitoring and staying on constant alert. Try breaking work into short, clear phases and defining realistic endpoints.",
  },
  safeExperimentation: {
    hu: "Könnyen válthatsz a lehetőségek között, ezért nehezebb lehet lezárni egy döntést. Segíthet, ha egyszerre csak 1–2 új irányt próbálsz ki, és előre rögzíted, milyen feltételnél állsz le vagy térsz vissza a korábbi megoldáshoz.",
    en: "You may bounce between options and struggle to close decisions. Try running no more than 1–2 experiments at a time, with clear stop criteria and fallback rules.",
  },
};

// ─── Block 5 – Szerepkör-família ajánlások ────────────────────────────────────

export const ROLE_TEXTS: Record<string, Record<Locale, { strong: string; medium: string; watchOut: string }>> = {
  ethicalLeader: {
    hu: {
      strong: "Olyan szerepek állhatnak közel hozzád, ahol világos elvek alapján dönthettek, és egymásnak is elmondjátok a döntéseitek okát.",
      medium: "Eltérő érdekeket képviselő emberekkel is jól dolgozhatsz együtt, ha tisztázzátok, miben lehet engedni, és mihez ragaszkodtok.",
      watchOut: "Feszültséget okozhat, ha mást mondanak arról, mi fontos, mint amit a döntésekben tapasztalsz. Ilyenkor érdemes egy konkrét példáról beszélni, és tisztázni, milyen elvek szerint döntötök.",
    },
    en: {
      strong: "Values-driven environments with high trust expectations, where transparent decisions and credibility matter.",
      medium: "You can still perform in organizations with competing interests if your ethical mandate is explicit.",
      watchOut: "It can be hard to work in environments where values are talked about but not lived. It helps to agree on shared ethical decision principles early on.",
    },
  },
  principledConfronter: {
    hu: {
      strong: "Közel állhatnak hozzád azok a feladatok, ahol világos szabályokat kell követni, és kényes kérdésekről is nyíltan kell beszélni.",
      medium: "Közvetítőként vagy partnerként is jól dolgozhatsz, ha tisztázott, miről dönthetsz, és miért felelsz.",
      watchOut: "Megterhelhet, ha a konfliktusokról nem lehet beszélni, és a problémák megoldatlanul maradnak. Kezdeményezz rendszeres egyeztetést arról, mi okoz feszültséget, és hogyan tudnátok változtatni rajta.",
    },
    en: {
      strong: "Contexts that require rule clarity and direct communication, including difficult but necessary conversations.",
      medium: "You can excel in mediation or partner roles when decision boundaries and ownership are explicit.",
      watchOut: "It can become draining when conflicts stay unspoken and issues accumulate below the surface. Regular, structured conflict-resolution checkpoints help.",
    },
  },
  responsibleInnovator: {
    hu: {
      strong: "Közel állhat hozzád az újítás, ha közben a megoldások következményeit is gondosan mérlegelhetitek.",
      medium: "Gyorsan dolgozó csapatban is boldogulhatsz, ha előre megbeszélitek, mely elvekből nem engedtek a határidő kedvéért sem.",
      watchOut: "Nehéz lehet olyan közegben dolgozni, ahol a gyors eredmény kedvéért hallgatólagosan elvárják az etikai kompromisszumot. Érdemes előre tisztázni, mely elvekből nem engedsz, és ehhez tartani magad a döntéseidben.",
    },
    en: {
      strong: "Innovation contexts where novelty and responsibility are expected together, not traded off against each other.",
      medium: "You can perform in faster teams if ethical guardrails are defined in advance.",
      watchOut: "It can be difficult in fast environments where ethical compromise is an implicit expectation. Define your red lines in advance and use them consistently.",
    },
  },
  supportedVisibility: {
    hu: {
      strong: "Közel állhatnak hozzád az emberekkel végzett, szereplést is kívánó feladatok, ha szabad kérdezni, segítséget kérni és hibákról beszélni.",
      medium: "A sok egyeztetéssel járó munkát könnyebb lehet bírnod, ha világos, mi a feladatod, és rendszeresen jut időd feltöltődni.",
      watchOut: "A folyamatos társas érintkezés megterhelhet, ha nincs elég időd feltöltődni. Érdemes előre időt hagyni a zavartalan munkára és a rendszeres visszajelzésre.",
    },
    en: {
      strong: "Visible, people-facing roles with psychological safety and regular, constructive feedback.",
      medium: "You can also do well in higher social-intensity contexts if recovery rhythm and role boundaries are protected.",
      watchOut: "Continuous social intensity can be draining without enough recovery space. Plan quiet blocks and regular feedback check-ins in advance.",
    },
  },
  structuredStability: {
    hu: {
      strong: "Közel állhat hozzád a kiszámítható munka, ahol a gondos feladatvégzésre tartósan is jut idő.",
      medium: "Változó körülmények között is boldogulhatsz, ha egyértelmű, melyik feladat az első, és nem változnak folyton a határidők.",
      watchOut: "Megterhelhet, ha egyszerre magasak az elvárások és kiszámíthatatlanok a feladatok. Dolgozz rövidebb szakaszokban, és előre egyeztesd, mi fér bele egy-egy időszakba.",
    },
    en: {
      strong: "Predictable, structured operations where high quality can be sustained at a healthy pace.",
      medium: "You can also perform in more dynamic contexts if priorities and deadlines stay clearly stable.",
      watchOut: "It can be hard when expectations are high but the environment stays unpredictable. Work in short cycles with clear endpoints and explicit load limits.",
    },
  },
  safeExperimentation: {
    hu: {
      strong: "Közel állhat hozzád, ha új megoldásokat próbálhatsz ki kisebb, előre megbeszélt kockázattal.",
      medium: "Gyors változás mellett segíthet, ha tudod, mikor kell dönteni, és mihez térhettek vissza, ha az új megoldás nem válik be.",
      watchOut: "Megterhelhet, ha egyszerre túl sok lehetőség közül kell választanod. Jelöljetek ki egy-két kipróbálandó irányt, és beszéljétek meg, mi alapján folytatjátok vagy hagyjátok abba a próbát.",
    },
    en: {
      strong: "Experimental environments with a safety net: room to try new things, within clear boundaries.",
      medium: "You can work well in fast change if decision cadence and fallback options are clarified upfront.",
      watchOut: "It becomes difficult when too many directions open at once without clear decision criteria. Keep active priorities to 1-2 and use predefined stop rules.",
    },
  },
  deepCollaboration: {
    hu: {
      strong: "Közel állhat hozzád, ha kisebb csapatban, tartós munkakapcsolatokban és kiszámítható munkarendben dolgozhatsz.",
      medium: "Nagyobb csapatban is segíthet, ha van néhány állandó munkatársad, és tudjátok, mikor, hogyan egyeztettek.",
      watchOut: "Nehézséget okozhat, ha sok emberrel kell beszélned, de a fontos kérdésekre nem jut idő. Próbáljatok állandó párokban vagy kisebb csoportokban is dolgozni.",
    },
    en: {
      strong: "Small, trust-based collaboration where deep professional relationships and steady team rhythm can form.",
      medium: "You can still be effective in larger teams if stable micro-groups and clear communication channels are maintained.",
      watchOut: "It can be challenging in environments where communication stays superficial and fragmented. It helps to build stable pair or small-group collaboration patterns.",
    },
  },
  solitaryInnovator: {
    hu: {
      strong: "Elmélyült, önálló munkát és hosszabb gondolkodási időt adó feladatok, amelyekben egyedi megoldásokat dolgozhatsz ki.",
      medium: "Csapatban is jól dolgozhatsz, ha marad időd zavartalan munkára, és nem kell minden kérdést azonnal, közösen megbeszélni.",
      watchOut: "Megterhelő lehet, ha a munka ritmusát folyamatos megbeszélések törik meg. Érdemes előre rögzíteni a zavartalan munka időszakait, a döntések előkészítését pedig írásban is lehetővé tenni.",
    },
    en: {
      strong: "Work that allows deep focus, autonomy, and longer thinking cycles to build distinctive solutions.",
      medium: "You can still perform in team settings if protected focus time and async collaboration are in place.",
      watchOut: "It can be draining when continuous meetings keep breaking work rhythm. Protect fixed focus time and define async decision-preparation flows.",
    },
  },
  facilitatedInnovation: {
    hu: {
      strong: "Közel állhatnak hozzád azok a változtatások, amelyeket az érintettekkel együtt tervezhettek meg és próbálhattok ki.",
      medium: "Hierarchikus szervezetben is boldogulhatsz, ha a döntések előtt jut idő a közös egyeztetésre és a javaslatok átdolgozására.",
      watchOut: "Feszültséget okozhat, ha kikérik a véleményeteket, de az már nem hat a döntésre. A közös munka elején tisztázzátok, miről dönthettek, és mi az, ami már eldőlt.",
    },
    en: {
      strong: "Change contexts where innovation becomes durable through inclusion and shared learning.",
      medium: "You can work in more hierarchical settings if there is room for facilitated alignment and iteration.",
      watchOut: "It can be difficult to work in environments where inclusion is symbolic while decisions remain closed. Clarify upfront what can actually be decided and what concrete outcomes workshops should produce.",
    },
  },
  structuredCompetitor: {
    hu: {
      strong: "Közel állhat hozzád az olyan verseny, amelyben mérhető az eredmény, és világos, ki miért felel.",
      medium: "A közös megegyezésre építő csapatban is boldogulhatsz, ha tisztázzátok, mit tekintetek sikernek, és ki milyen feladatot vállal.",
      watchOut: "Megterhelhet, ha homályosak vagy folyton változnak az elvárások. Egyeztessétek, milyen eredményt vártok, és melyik döntésért ki felel.",
    },
    en: {
      strong: "Competitive settings with measurable outcomes, explicit goals, and clear accountability layers.",
      medium: "You can also perform in consensus-leaning cultures if success criteria and ownership stay explicit.",
      watchOut: "It can be frustrating when performance expectations are ambiguous or keep shifting. Align early on shared success criteria and clear decision ownership.",
    },
  },
  structuredInnovator: {
    hu: {
      strong: "Összetett problémák, amelyeknél egyszerre van szükség új ötletekre és a megvalósítás gondos megszervezésére.",
      medium: "Gyors ötletelés mellett is segíthet, ha megállapodtok a munka lépéseiben és abban, mikor döntötök a folytatásról.",
      watchOut: "Nehéz lehet haladnod, ha túl sok lehetőség marad nyitva. Minden munkaszakasz elején jelöljétek ki a legfontosabb feladatokat, és azt is, mikor tekintitek őket késznek.",
    },
    en: {
      strong: "Complex problems where you must innovate while keeping execution coherent and structured.",
      medium: "You can also do well in faster creative contexts if lightweight processes and clear decision points exist.",
      watchOut: "It can become difficult when too many directions stay open and execution loses focus. Work with fixed per-iteration scope, a prioritized backlog, and clear completion criteria.",
    },
  },
  resilientLeader: {
    hu: {
      strong: "Közel állhatnak hozzád azok a vezetői vagy szervezői feladatok, amelyekben sok emberrel kell együtt dolgozni változó, megterhelő helyzetekben.",
      medium: "A projektvezetés és az ügyfelekkel végzett munka is szóba jöhet, ha a társas magabiztosság és a nyomás elviselése egyaránt fontos a feladatban.",
      watchOut: "Mások érzéketlenségnek láthatják, ha nehéz helyzetben is nyugodt maradsz. Mondd el azt is, hogyan látod az ő helyzetüket, és miben szeretnél segíteni.",
    },
    en: {
      strong: "Roles with intensive people work in volatile, high-expectation contexts – leadership, sales leadership, crisis coordination, change management.",
      medium: "Project leadership, client-facing roles where extraversion and stress tolerance both matter.",
      watchOut: "It can be difficult if social activity lacks real depth, or if others interpret your emotional stability as insensitivity. Make a point of voicing your intent, not just the facts.",
    },
  },
  calmExecution: {
    hu: {
      strong: "Közel állhatnak hozzád az olyan hosszabb projektek, amelyekben gondos, kitartó munkára van szükség, időnként nyomás alatt is.",
      medium: "Szabályozói, megfelelőségi és szakértői feladatokban is hasznos lehet, ha következetesen, egyenletes tempóban dolgozol.",
      watchOut: "Mások a nyugalmadból arra következtethetnek, hogy nem veszed észre, mi terheli őket. Kérdezz rá, hogyan élik meg a közös munkát, és mire lenne szükségük.",
    },
    en: {
      strong: "High-complexity, long-cycle projects requiring both endurance and emotional resilience – operations, program management, quality assurance.",
      medium: "Regulatory, compliance, or expert roles where reliable, steady performance is a competitive advantage.",
      watchOut: "Your calm precision may sometimes give the impression you're not picking up on emotional signals. Actively seek feedback from your team to counter this.",
    },
  },
  exploratoryAnalyst: {
    hu: {
      strong: "Kutatói, stratégiai elemzői és újítással járó szerepek, ahol az ismeretlen feltárásához elmélyült, tartós figyelemre van szükség.",
      medium: "Tanácsadói vagy termékstratégiai feladatok is közel állhatnak hozzád, ha időt kapsz a kérdések alapos vizsgálatára.",
      watchOut: "Megterhelhet, ha már azelőtt eredményt várnak, hogy kellően utánajárhatnál a kérdésnek. Előre egyeztessétek, milyen mélységű elemzés fér bele a rendelkezésre álló időbe.",
    },
    en: {
      strong: "Research, strategic analysis, or innovation roles where discovering the unknown calls for deep, sustained focus.",
      medium: "Exploratory consulting or product strategy work also fits well if there is room for deep thinking.",
      watchOut: "It can be challenging when results are demanded before the analysis can truly deepen. Agree up front on the expected depth and timeline at the start of each cycle.",
    },
  },
  organizedLeader: {
    hu: {
      strong: "Közel állhat hozzád a projektvezetés, a csapatvezetés vagy a napi munka irányítása, ahol az emberekkel és a feladatokkal is foglalkozni kell.",
      medium: "Értékesítési vagy ügyfélkapcsolati feladatokban is segíthet, ha kiszámítható munkamenetre támaszkodhatsz.",
      watchOut: "Nehézséget okozhat, ha nem egyértelmű, ki min dolgozik, vagy folyton változnak a célok és a határidők. Állapodjatok meg egy egyszerű, mindenki számára követhető munkamenetben.",
    },
    en: {
      strong: "Project management, team leadership, operational direction – where structured execution and human mobilization are expected together.",
      medium: "Sales or customer-centric roles also work well if there is a predictable process underneath.",
      watchOut: "It can be hard if the team works less structurally, or if goals and deadlines keep shifting. Build a minimal process frame the team can plug into.",
    },
  },
  harmoniousConnector: {
    hu: {
      strong: "Közel állhat hozzád a közös megbeszélések vezetése, a csapatépítés, az ügyfelekkel végzett munka vagy a coaching, ahol a kölcsönös bizalom is fontos.",
      medium: "Értékesítési és tárgyalási feladatokban is boldogulhatsz, ha megismerheted a partnereidet, és rendszeresen kaptok visszajelzést egymástól.",
      watchOut: "Ha csak elsimítod a vitákat, az okai megmaradhatnak. Gyakorold, hogyan mondhatod el egyértelműen és tisztelettel, mivel nem értesz egyet, és mit szeretnél helyette.",
    },
    en: {
      strong: "Team building, facilitation, client relations, coaching – where cohesion, trust, and energizing others are the primary value.",
      medium: "Sales, negotiation, and partnership roles are also strong contexts if there is enough genuine connection and feedback.",
      watchOut: "It can be difficult if you tend to harmonize conflicts rather than resolve them – this can accumulate over time. Consciously develop assertive communication skills.",
    },
  },
  performanceDriver: {
    hu: {
      strong: "Közel állhat hozzád az értékesítés, az üzletfejlesztés vagy a vállalkozás, ahol konkrét eredményért dolgozhatsz és versenyhelyzetbe is kerülhetsz.",
      medium: "Tárgyalási, stratégiai vagy vezetői feladatokban is segíthet, ha mérhető célok alapján dolgozhatsz.",
      watchOut: "A cél követése közben háttérbe szorulhat, hogyan élik meg a többiek a közös munkát. Rendszeresen kérdezz rá a tapasztalataikra, és mondd el a sajátjaidat is.",
    },
    en: {
      strong: "Results-driven, competitive environments – sales, business development, growth, performance-oriented leadership.",
      medium: "Negotiation, strategic, and entrepreneurial roles also fit well when goals are measurable and success is clearly defined.",
      watchOut: "Results focus can sometimes overshadow team dynamics. Consciously invest in maintaining relationships and building a regular feedback culture.",
    },
  },
  disruptiveInnovator: {
    hu: {
      strong: "Közel állhat hozzád az újítások vezetése, a vállalkozás vagy a stratégiai tanácsadás, ahol a megszokott megoldásokat is felül lehet vizsgálni.",
      medium: "Szakértői, tanácsadói és kutatói feladatokban is boldogulhatsz, ha önállóan gondolkodhatsz, és a kritikus kérdéseket is szabad feltenni.",
      watchOut: "Feszültséget okozhat, ha a többiek kerülik a vitát, vagy személyes támadásnak veszik a kritikádat. Nevezd meg a konkrét problémát, és azt, min változtatnál.",
    },
    en: {
      strong: "Disruption-oriented roles – innovation leader, entrepreneur, strategic advisor, where challenging convention creates value.",
      medium: "Expert consulting and research positions are also a strong fit if you have sufficient autonomy and critical thinking is the norm.",
      watchOut: "It can be difficult if the team operates under strong harmony expectations, or if confrontation damages team cohesion. Channel feedback constructively – against ideas, not people.",
    },
  },
};

// ─── Block 4 – Környezeti preferencia táblázat ────────────────────────────────

// Stabil, lokalizációtól független sor-azonosító + szint. A megjelenítő
// (IdealEnvironmentSection) ezekből teszi a markert és választja a pólus-
// feliratokat — NEM a lokalizált címke/érték-string parse-olásából, ami a
// korábbi EN üres-pólus és a E-inverzió hibát okozta.
export type EnvRowKey =
  | "structure"
  | "social"
  | "change"
  | "decision"
  | "culture"
  | "cycle"
  | "load";

export type EnvLevel = "low" | "mid" | "high";

// Kanonikus sor-címkék kulcsonként. A getEnvRows címkéi ÉS a megjelenítő
// címke→kulcs visszakeresése is EBBŐL dolgozik, így nincs drift a kettő közt
// (a korábbi hibában az EN „Load management" címke nem talált POLES-kulcsot).
export const ENV_ROW_LABELS: Record<EnvRowKey, LocalizedText> = {
  structure: { hu: "Struktúra", en: "Structure" },
  social: { hu: "Társas intenzitás", en: "Social intensity" },
  change: { hu: "Változásgyakoriság", en: "Change frequency" },
  decision: { hu: "Döntési sebesség", en: "Decision pace" },
  culture: { hu: "Kultúra", en: "Culture" },
  cycle: { hu: "Projektciklus", en: "Project cycle" },
  load: { hu: "Terhelhetőség", en: "Load management" },
};

// Kanonikus pólus-feliratok kulcsonként (a track két vége) — mindkét nyelv
// egy helyen, a megjelenítő a kulcs alapján olvassa.
export const ENV_ROW_POLES: Record<EnvRowKey, { low: LocalizedText; high: LocalizedText }> = {
  structure: { low: { hu: "szabad", en: "flexible" }, high: { hu: "strukturált", en: "structured" } },
  social: { low: { hu: "egyéni", en: "solo" }, high: { hu: "csapatmunka", en: "teamwork" } },
  change: { low: { hu: "stabil", en: "stable" }, high: { hu: "változó", en: "dynamic" } },
  decision: { low: { hu: "lassú", en: "slow" }, high: { hu: "gyors", en: "fast" } },
  culture: { low: { hu: "pragmatikus", en: "pragmatic" }, high: { hu: "értékvezérelt", en: "values-driven" } },
  cycle: { low: { hu: "rövid", en: "short" }, high: { hu: "hosszú", en: "long" } },
  load: { low: { hu: "alacsony", en: "low" }, high: { hu: "magas", en: "high" } },
};

// Kanonikus RÖVID (kiemelt) címke kulcs+szint szerint — a megjelenítő ebből
// oldja fel a sor bold szint-szavát, NEM az érték-szöveg prefix-parse-olásából.
// A korábbi parser szűkebb leképezése a Kultúra-sor „Értékvezérelt /
// Teljesítményalapú" kezdetét nem ismerte, és tévesen „Közepes"-t mutatott
// (motor-audit v3 #11). A kultúra címkéi a sor pólus-szókincsét követik
// (ENV_ROW_POLES.culture), így a bold szó és a track-vég felirata egybevág.
export const ENV_ROW_SHORT_LABELS: Record<EnvRowKey, Record<EnvLevel, LocalizedText>> = {
  structure: { low: { hu: "Alacsony", en: "Low" }, mid: { hu: "Közepes", en: "Medium" }, high: { hu: "Magas", en: "High" } },
  social: { low: { hu: "Alacsony", en: "Low" }, mid: { hu: "Közepes", en: "Medium" }, high: { hu: "Magas", en: "High" } },
  change: { low: { hu: "Alacsony", en: "Low" }, mid: { hu: "Közepes", en: "Medium" }, high: { hu: "Magas", en: "High" } },
  decision: { low: { hu: "Lassú", en: "Slow" }, mid: { hu: "Közepes", en: "Medium" }, high: { hu: "Gyors", en: "Fast" } },
  culture: { low: { hu: "Pragmatikus", en: "Pragmatic" }, mid: { hu: "Közepes", en: "Medium" }, high: { hu: "Értékvezérelt", en: "Values-driven" } },
  cycle: { low: { hu: "Rövid", en: "Short" }, mid: { hu: "Közepes", en: "Medium" }, high: { hu: "Hosszú", en: "Long" } },
  load: { low: { hu: "Alacsony", en: "Low" }, mid: { hu: "Közepes", en: "Medium" }, high: { hu: "Magas", en: "High" } },
};

export type EnvRow = {
  key: EnvRowKey;
  level: EnvLevel;
  label: LocalizedText;
  value: LocalizedText;
  /**
   * F3-hedge (motor-audit v9): a sort kiváltó dimenzió-pólus a 65/35-ös
   * profile-engine küszöbön már túl van, de a 70/40-es vizuális tieren még
   * nem (magas pólus: 65<score<70; alacsony pólus: 30≤score<35 tükör-sáv) —
   * a kemény szint-szó („Magas") itt ellentmondana az egy görgetésre lévő
   * strip „mérsékelt" címkéjének, ezért a megjelenítő „Inkább …" alakot ad.
   */
  hedged?: boolean;
};

// ─── Sor-érték változatok ────────────────────────────────────────────────────
// MINDEN kiadható érték-szöveg itt él, a szintjéhez kötve — a getEnvRows
// ebből választ, és a megjelenítő-oldali visszafejtés (érték → szint,
// resolveEnvLevel) is ebből épül, így a kettő szerkezetileg nem tud
// széttartani. Egy szinthez több szövegváltozat is tartozhat (pl. a social
// „low" két árnyalata).
type EnvRowVariant = { level: EnvLevel; value: LocalizedText };

const ENV_ROW_VARIANTS: Record<EnvRowKey, Record<string, EnvRowVariant>> = {
  structure: {
    high: { level: "high", value: { hu: "Magas – segítenek az egyértelmű szabályok és munkafolyamatok", en: "High – you work best within clear frameworks and processes" } },
    low: { level: "low", value: { hu: "Alacsony – szívesen választod meg önállóan, hogyan dolgozol", en: "Low – you work best flexibly and self-directed" } },
    mid: { level: "mid", value: { hu: "Közepes – segítenek a világos keretek, ha marad mozgástered is", en: "Medium – you do well with structure, but not bureaucracy" } },
  },
  social: {
    high: { level: "high", value: { hu: "Magas – szívesen dolgozol másokkal, és gyakran egyeztetsz velük", en: "High – you thrive on teamwork and frequent interaction" } },
    low: { level: "low", value: { hu: "Alacsony – az önálló vagy kis csapatban végzett munkát kedveled", en: "Low – you work best independently or in a small team" } },
    lowMix: { level: "low", value: { hu: "Alacsony–közepes – szívesen váltogatod az önálló és a kis csapatban végzett munkát", en: "Low to medium – a mix of independent and small-team work suits you" } },
  },
  change: {
    framed: { level: "mid", value: { hu: "Közepes – segít, ha a változás fokozatos és előre átlátható", en: "Medium – gradual change within clear boundaries suits you" } },
    high: { level: "high", value: { hu: "Magas – szívesen dolgozol változó, ismeretlen közegben", en: "High – you enjoy working in shifting, novel environments" } },
    stable: { level: "low", value: { hu: "Alacsony–közepes – a kiszámítható munkamenetet kedveled", en: "Low to medium – you work well with stable, predictable processes" } },
  },
  decision: {
    deliberate: { level: "mid", value: { hu: "Közepes – szívesen mérlegelsz előre tisztázott szempontok alapján", en: "Medium – you prefer deliberate, rule-based decisions" } },
    fast: { level: "high", value: { hu: "Gyors – gyakran a megérzésedre támaszkodsz, és menet közben alakítod a döntést", en: "Fast – you decide intuitively and flexibly" } },
    balanced: { level: "mid", value: { hu: "Közepes – szeretsz időt hagyni a mérlegelésre, majd dönteni", en: "Medium – you decide deliberately, without dragging it out" } },
  },
  // A kultúra-értékek a többi sorral azonos „Szint-szó – leírás" szerkezetet
  // követik (a szint-szó a pólus-szókincs) — így a leírás-levágás és a bold
  // címke minden soron ugyanúgy működik.
  culture: {
    high: { level: "high", value: { hu: "Értékvezérelt – fontos neked, hogy a közös elveket a gyakorlatban is kövessétek", en: "Values-driven – an ethically consistent culture is where you're at home" } },
    low: { level: "low", value: { hu: "Gyakorlatias – ösztönözhet a verseny és a mérhető eredmény", en: "Pragmatic – a performance-based, competitive culture also works fine for you" } },
  },
  cycle: {
    long: { level: "high", value: { hu: "Hosszú – szeretsz elmélyülni, és alaposan végigviszed a munkát", en: "Long, deepening – you carry work through thoroughly" } },
    exploratory: { level: "low", value: { hu: "Rövid–közepes – szívesen kezdesz új feladatba, a befejezéshez több figyelem kellhet", en: "Short to medium – you love exploring; closing takes more deliberate effort" } },
    balanced: { level: "mid", value: { hu: "Közepes – szeretsz elmélyülni a munkában, közben a határidőre is figyelsz", en: "Medium – you go deep while keeping deadlines" } },
  },
  load: {
    protected: { level: "low", value: { hu: "Alacsony – segít a kiszámítható terhelés és a rendszeres visszajelzés", en: "Low – you're at your best with a predictable rhythm and regular feedback" } },
    resilient: { level: "high", value: { hu: "Magas – többnyire jól viseled a nyomást és a bizonytalanságot", en: "High – you handle pressure and uncertainty well" } },
  },
};

function envRow(key: EnvRowKey, variant: EnvRowVariant, hedged = false): EnvRow {
  return {
    key,
    level: variant.level,
    label: ENV_ROW_LABELS[key],
    value: variant.value,
    ...(hedged ? { hedged: true } : {}),
  };
}

// Dimenzió + kategória kombinációra visszaadja a megfelelő sorokat. A `level`
// a sor tengelyén elfoglalt pozíciót (low/mid/high) jelöli; a megjelenített
// érték-szöveg a tanácsadó nyelvezet marad.
//
// dimScores (opcionális, F3-hedge): a nyers pontszámokból dől el, hogy a sort
// kiváltó pólus-ítélet a 65/35↔70/40 egyet-nem-értési sávba esik-e — ilyenkor
// a sor `hedged` jelzést kap, és a megjelenítő „Inkább …" szint-szót ír a
// kemény („Magas") helyett. Pontszámok nélkül a viselkedés változatlan.
export function getEnvRows(
  categories: Record<string, ProfileCategory>,
  dimScores?: Record<string, number>,
): EnvRow[] {
  const rows: EnvRow[] = [];
  const v = ENV_ROW_VARIANTS;

  // Hedge-sávok: magas pólus 65<score<70 (a strip ott még „mérsékelt");
  // alacsony pólus a tükör-sáv 30≤score<35 (épphogy pólusos ítélet). A sáv a
  // sort KIVÁLTÓ dimenzió-pólusra vonatkozik — a fordított tengelyű soroknál
  // (cycle exploratory, load) is a kiváltó pólus sávja dönt.
  const inHighBand = (code: string) => {
    const score = dimScores?.[code];
    return typeof score === "number" && score > 65 && getDimensionTier(score) !== "high";
  };
  const inLowBand = (code: string) => {
    const score = dimScores?.[code];
    return typeof score === "number" && score < 35 && score >= 30;
  };

  // Struktúra (C alapján)
  if (categories.C === "high") {
    rows.push(envRow("structure", v.structure.high, inHighBand("C")));
  } else if (categories.C === "low") {
    rows.push(envRow("structure", v.structure.low, inLowBand("C")));
  } else {
    rows.push(envRow("structure", v.structure.mid));
  }

  // Társas intenzitás (X alapján)
  if (categories.X === "high") {
    rows.push(envRow("social", v.social.high, inHighBand("X")));
  } else if (categories.X === "low") {
    rows.push(envRow("social", v.social.low, inLowBand("X")));
  } else {
    rows.push(envRow("social", v.social.lowMix));
  }

  // Változásgyakoriság (O és C alapján)
  if (categories.O === "high" && categories.C === "high") {
    rows.push(envRow("change", v.change.framed));
  } else if (categories.O === "high") {
    rows.push(envRow("change", v.change.high, inHighBand("O")));
  } else {
    rows.push(envRow("change", v.change.stable));
  }

  // Döntési sebesség (C és O alapján) — a „Gyors" ítélet két pólusból
  // következik; bármelyik kiváltó a sávban → hedge.
  if (categories.C === "high" && categories.O === "low") {
    rows.push(envRow("decision", v.decision.deliberate));
  } else if (categories.C === "low" && categories.O === "high") {
    rows.push(
      envRow("decision", v.decision.fast, inLowBand("C") || inHighBand("O")),
    );
  } else {
    rows.push(envRow("decision", v.decision.balanced));
  }

  // Kultúra (H alapján) — csak pólusos H-nél jelenik meg.
  if (categories.H === "high") {
    rows.push(envRow("culture", v.culture.high, inHighBand("H")));
  } else if (categories.H === "low") {
    rows.push(envRow("culture", v.culture.low, inLowBand("H")));
  }

  // Projektciklus (C és O alapján)
  if (categories.C === "high") {
    rows.push(envRow("cycle", v.cycle.long, inHighBand("C")));
  } else if (categories.O === "high") {
    rows.push(envRow("cycle", v.cycle.exploratory, inHighBand("O")));
  } else {
    rows.push(envRow("cycle", v.cycle.balanced));
  }

  // Terhelés-kezelés (E alapján) — erőforrás-nyelv, nem deficit-keret.
  // A tengely a terhelhetőség: E low (érzelmileg stabil) → magas
  // terhelhetőség (high pólus, „jól viseled a nyomást"); E high
  // (érzékenyebb) → védettebb, kiszámíthatóbb ritmust igényel (low pólus).
  // Így a marker, a pólus-feliratok és a szöveg egy irányba mutat — a korábbi
  // verzióban a E high szint-szó nélkül tévesen középre esett.
  if (categories.E === "high") {
    rows.push(envRow("load", v.load.protected, inHighBand("E")));
  } else if (categories.E === "low") {
    rows.push(envRow("load", v.load.resilient, inLowBand("E")));
  }

  return rows;
}

// ─── Megjelenítő-oldali visszafejtés ─────────────────────────────────────────
// A megjelenítő (IdealEnvironmentSection) lokalizált {label, value} párokat
// kap (a workstyle-content így adja tovább) — a kanonikus kulcs és szint az
// alábbi regiszterekből fejthető vissza. Mindkét nyelv szerepel bennük, így a
// feloldás nyelvfüggetlen; és mivel a regiszterek a getEnvRows-szal KÖZÖS
// forrásból (ENV_ROW_LABELS, ENV_ROW_VARIANTS) épülnek, nem driftelhetnek —
// a korábbi EN üres-pólus és a Kultúra téves „Közepes" címkéje pont a
// megjelenítőben duplikált, részleges leképezésekből fakadt.

const LABEL_TO_ENV_KEY: Record<string, EnvRowKey> = Object.fromEntries(
  (Object.entries(ENV_ROW_LABELS) as Array<[EnvRowKey, LocalizedText]>).flatMap(
    ([key, label]) => [
      [label.hu, key] as [string, EnvRowKey],
      [label.en, key] as [string, EnvRowKey],
    ],
  ),
);

const ENV_VALUE_TO_LEVEL: Record<EnvRowKey, Record<string, EnvLevel>> = Object.fromEntries(
  (Object.entries(ENV_ROW_VARIANTS) as Array<[EnvRowKey, Record<string, EnvRowVariant>]>).map(
    ([key, variants]) => [
      key,
      Object.fromEntries(
        Object.values(variants).flatMap((variant) => [
          [variant.value.hu, variant.level] as [string, EnvLevel],
          [variant.value.en, variant.level] as [string, EnvLevel],
        ]),
      ),
    ],
  ),
) as Record<EnvRowKey, Record<string, EnvLevel>>;

/** Lokalizált sor-címke (hu VAGY en) → kanonikus sor-kulcs; ismeretlenre null. */
export function resolveEnvRowKey(label: string): EnvRowKey | null {
  return LABEL_TO_ENV_KEY[label] ?? null;
}

/** Lokalizált érték-szöveg (hu VAGY en) → a sor kanonikus szintje; ismeretlenre null. */
export function resolveEnvLevel(key: EnvRowKey, value: string): EnvLevel | null {
  return ENV_VALUE_TO_LEVEL[key]?.[value] ?? null;
}

// ─── Block 3 – Általános narratíva (ha nincs tension pár) ────────────────────

export const DEFAULT_NARRATIVE: LocalizedText = {
  hu: "A pontszámaid alapján egyik jellemződ sem emelkedik ki annyira, hogy önmagában meghatározná az összképet. Gondold végig, hogyan változik a viselkedésed a feladattól, a helyzettől és a munkatársaidtól függően.",
  en: "Looking across your profile dimensions, a coherent pattern emerges. There is no notable internal tension between the dimensions – meaning the different aspects of your personality often reinforce each other.",
};

// ─── Solo dim narratives (Block 3 ha nincs tension pár) ──────────────────────

export const SOLO_DIM_NARRATIVES: Record<string, LocalizedText> = {
  H_high: {
    hu: "Válaszaid alapján fontos neked, hogy nyíltan beszélj, és tisztességesen járj el másokkal. Akkor is ezt választhatod, ha a taktikázás rövid távon előnyösebbnek tűnik. Ezzel hozzájárulhatsz ahhoz, hogy a munkatársaid megbízzanak benned.",
    en: "Based on your responses, open, game-free operation is one of your most dominant preferences: you choose direct communication even when manoeuvring would pay better – a strong, trust-building foundation in your working relationships.",
  },
  H_low: {
    hu: "Válaszaid alapján erősen ösztönözhet az eredmény és a verseny. Szívesen képviselheted a saját érdekeidet, és keresheted, hogyan kerülhetnél kedvezőbb helyzetbe.",
    en: "Your responses point to ambitious, strategic thinking: you rarely shy away from challenges or competition. Achieving goals drives you – competition and self-assertion may well be your natural environment.",
  },
  // 2026-08-11, valencia-revízió (kanonikus kapu: score-valence.ts): az
  // Emocionalitás egyik pólusa sem erény és nem is hiány. A korábbi HU/EN
  // szöveg empátiát tulajdonított a magas pólusnak („empatikusan reagálsz…
  // ez értéket ad a kapcsolataidnak") — ezt a skála (Félelem / Szorongás /
  // Dependencia / Érzelmi kötődés) nem méri. Mindkét pólus két oldallal
  // íródik: mit hoz ÉS mibe kerül.
  E_high: {
    hu: "Válaszaid alapján hamar hatnak rád a helyzetek érzelmi jelzései, és a feszültség később is megmaradhat benned. Ez segíthet korán észrevenned, ha valami nincs rendben, ugyanakkor nagyobb terhet is jelenthet. Sokat számíthat, jut-e időd megnyugodni egy nehéz helyzet után.",
    en: "Your responses suggest emotional sensitivity is one of your defining traits: you register the charge of a situation early, and it stays with you for a while. That brings you a lot of early information – and a lot of load, which is why the setting you work in matters.",
  },
  E_low: {
    hu: "Válaszaid alapján nyomás alatt és bizonytalan helyzetben is többnyire nyugodt maradsz. Közben könnyebben elkerülhetik a figyelmedet mások érzelmi jelzései, és a nyugalmadat távolságtartásként is értelmezhetik.",
    en: "Your responses point to marked emotional stability. You typically keep your balance under pressure and uncertainty – in exchange, others' emotional signals reach you less often, and your calm can be read as distance.",
  },
  X_high: {
    hu: "Válaszaid alapján szívesen vagy emberek között, kezdeményezel beszélgetést és vállalsz szerepet a közös munkában. A gyakori egyeztetés vagy egy közös feladat feltölthet.",
    en: "Your responses show a strongly extraverted pattern – you draw energy from relationships and interactions. Social space is likely your natural element, where you actively shape the dynamics.",
  },
  X_low: {
    hu: "Válaszaid alapján kevesebb társas ingerre lehet szükséged. Közel állhat hozzád, ha egyedül vagy kisebb csoportban dolgozhatsz, és jut időd nyugodtan végiggondolni a feladatot.",
    en: "Your responses suggest an introverted disposition – you typically recharge through independent or small-group work. Deep focus and autonomy are where your strengths unfold.",
  },
  A_high: {
    hu: "Válaszaid alapján fontos neked, hogy jól kijöjj a többiekkel. Vitában jellemzően keresed a megegyezés lehetőségét, és kész lehetsz engedni azért, hogy folytatni tudjátok a közös munkát.",
    en: "Your responses point to a cooperative, adaptable, relationship-oriented way of working. Team cohesion and harmony tend to be important values for you – you actively work at maintaining good relationships.",
  },
  A_low: {
    hu: "Válaszaid alapján vitában is kiállhatsz az álláspontod mellett, és nem feltétlenül engedsz pusztán a béke kedvéért. Ez segíthet kimondani a kényes kérdéseket, miközben a hangnemre több figyelmet kellhet fordítanod.",
    en: "Your responses point to a direct, principled, independent way of working. You tend to base decisions on truth rather than comfort – which can make for a strong opinion-leader and negotiating-partner profile.",
  },
  C_high: {
    hu: "Válaszaid alapján szereted átlátni és megtervezni a feladataidat. Jellemzően gondosan dolgozol, és figyelsz arra, hogy betartsd, amit vállaltál.",
    en: "Your responses point to an organized, reliable, consistent way of working – conscientiousness gives your performance a strong base. You typically execute your commitments carefully and value clear structure.",
  },
  C_low: {
    hu: "Válaszaid alapján szívesen alakítod menet közben, hogyan dolgozol. A kötött munkamenetet kevésbé kedvelheted; a részletek és határidők követéséhez külön segítségre lehet szükséged.",
    en: "Your responses point to a flexible, adaptive, more intuitive way of working. Spontaneity and improvisation may be your strengths – rigid structure typically motivates you less.",
  },
  O_high: {
    hu: "Válaszaid alapján érdekelnek az új ötletek és az összetett kérdések. Szívesen tanulhatsz, próbálhatsz ki más megközelítéseket, vagy keresheted a még ismeretlen lehetőségeket.",
    en: "Your responses point to a curious way of working, open to novelty and complex thinking. The unknown typically draws you in rather than putting you off – innovation, creativity, and discovery may well be your natural domains.",
  },
  O_low: {
    hu: "Válaszaid alapján jellemzően a bevált megoldásokra támaszkodsz, és a kézzelfogható kérdéseket kedveled. Közel állhat hozzád, ha ismert módszerekkel, kiszámítható feladatokon dolgozhatsz.",
    en: "Your responses point to a predictable, concrete, pragmatic way of working. You tend to prefer proven solutions – stability, reliability, and familiar methods can be your strengths.",
  },
};

// ─── Solo dim summaries (Kulcs-tanulságok, ha nincs tension pár) ─────────────
// Korábban a takeaways ugyanazokat a SOLO_DIM_NARRATIVES szövegeket kapta,
// mint az „Ahogy működsz" blokk → szó szerinti duplikáció a riportban
// (javítási terv 2026-07, P1.3). Ez a készlet rövid, tanulság-műfajú:
// egy erőforrás + egy hipotézisként keretezett figyelő-pont (vakfolt-csíra).

export const SOLO_DIM_SUMMARIES: Record<string, LocalizedText> = {
  H_high: {
    hu: "A nyílt beszéd segíthet, hogy mások tudják, mire számíthatnak tőled. Figyeld meg, van-e olyan helyzet, amikor a saját érdekeidet is egyértelműbben kellene képviselned.",
    en: "Your asset is predictability and open communication – people quickly know where they stand with you. Worth watching: in tougher settings you may stay accommodating a beat too long where a firm boundary is needed.",
  },
  H_low: {
    hu: "Az eredmény és a saját érdekeid képviselete ösztönözhet. Versenyhelyzetben figyeld meg azt is, hogyan hatnak a lépéseid a kölcsönös bizalomra.",
    en: "Your asset is ambition and self-assertion. Worth watching: in sharp competition relational trust can erode – shared ground rules protect it.",
  },
  // A két E-sor SZÁNDÉKOSAN nem az „Erőforrásod…" nyitóformulát viszi,
  // amit a többi dimenzió (2026-08-11-i valencia-döntés): az Emocionalitás
  // egyik pólusa sem erőforrás-állítás, hanem jellemző. A műfaj (egy
  // megfigyelés + egy figyelő-pont) ugyanaz marad.
  E_high: {
    hu: "Korán észreveheted a feszültséget, de tartós nyomás alatt nagyobb teher nehezedhet rád. Figyeld meg, miből veszed észre, hogy elfáradtál, és mi segít ilyenkor megnyugodni.",
    en: "A defining trait of yours is early attunement: you register tension before it's said out loud. Worth watching: sustained pressure may drain you faster – a stress routine is core equipment for you, not an extra.",
  },
  E_low: {
    hu: "Jellemzően nyomás alatt is nyugodt maradsz. Figyeld meg, ezt hogyan értik a többiek, és szükség esetén mondd el, hogy komolyan veszed, ami foglalkoztatja őket.",
    en: "A defining trait of yours is calm under pressure. Worth watching: others may read it as distance – supportive feedback sometimes needs to be said out loud, not just felt.",
  },
  X_high: {
    hu: "Szívesen kezdeményezhetsz a közös munkában. Figyeld meg, jut-e szó a csendesebb résztvevőknek is, és hagyj időt a válaszukra.",
    en: "Your asset is energy and social presence. Worth watching: quieter voices can fade around you – opening space for them takes intention.",
  },
  X_low: {
    hu: "Közel állhat hozzád az önálló, elmélyült munka. Figyeld meg, tudnak-e a többiek az eredményeidről; egy rövid összefoglalóval segíthetsz nekik ebben.",
    en: "Your asset is deep focus and autonomy. Worth watching: low visibility can lead to being undervalued – results sometimes need a voice.",
  },
  A_high: {
    hu: "Jellemzően keresed a megegyezést. Figyeld meg, nem marad-e emiatt kimondatlanul valami, amiről fontos lenne beszélnetek.",
    en: "Your asset is building harmony and cohesion. Worth watching: postponing hard confrontations can cost more over time than the conflict itself.",
  },
  A_low: {
    hu: "Jellemzően nyíltan képviseled az álláspontodat. Figyeld meg, hogyan hat másokra a hangnemed; egy rövid szünet segíthet, hogy azt mondd el, amiről valóban beszélni szeretnél.",
    en: "Your asset is directness and willingness to debate. Worth watching: sharp reactions can reduce the sense of safety around you – slowing the tempo often gains more.",
  },
  C_high: {
    hu: "Jellemzően következetesen végzed a feladataidat. Ha változik a helyzet, nézd meg, a terv melyik részét érdemes megtartani, és min kellene módosítani.",
    en: "Your asset is dependable execution. Worth watching: the need for structure can turn rigid when the terrain changes faster than the plan.",
  },
  C_low: {
    hu: "Szívesen alkalmazkodhatsz menet közben a feladathoz. Figyeld meg, nem maradnak-e el közben részletek vagy határidők; egy közös feladatlista segíthet követni őket.",
    en: "Your asset is improvisation and adaptivity. Worth watching: details and deadlines slip more easily – external structure (a system or a partner) helps a lot.",
  },
  O_high: {
    hu: "Jellemzően szívesen foglalkozol új ötletekkel. Figyeld meg, nem vonják-e el a figyelmedet a megkezdett munkától, és előre jelöld ki, mit szeretnél befejezni.",
    en: "Your asset is curiosity and inventive thinking. Worth watching: the pull of new ideas can draw focus away from finishing – closure takes intention.",
  },
  O_low: {
    hu: "A bevált módszerekre szívesen támaszkodsz. Ha változnak a körülmények, próbálj ki egy kisebb módosítást, és vesd össze az eredményét a korábbi megoldással.",
    en: "Your asset is stability and command of proven methods. Worth watching: in fast change, sticking to the familiar can slow you down – small, safe experiments help.",
  },
};

// ─── Solo dim pressure/blind-spot texts (P2.1, P3.1-ben strukturálva) ────────
// Nyomás alatti működés + vakfolt, HIPOTÉZISKÉNT keretezve („hajlamos
// lehetsz", „vakfolt lehet") — a top-2 solo dimenzióból épül. A stress és
// blindspot KÜLÖN mező, hogy a részletes kártya ÉS az executive summary
// oldal is a saját formájában használhassa (parszolás nélkül).

export type PressureText = { stress: string; blindspot: string };

export const PRESSURE_BLINDSPOT_PREFIX: LocalizedText = {
  hu: "Amire érdemes figyelned:",
  en: "Possible blind spot:",
};

export const SOLO_DIM_PRESSURE: Record<string, Record<Locale, PressureText>> = {
  H_high: {
    hu: {
      stress: "Nyomás alatt még erősebben ragaszkodhatsz az elveidhez, és nehezebben engedhetsz egy vitában.",
      blindspot: "Mások kompromisszumát elvtelenségnek láthatod, miközben lehet, hogy nekik más szempont fontosabb.",
    },
    en: {
      stress: "Under pressure you may hold to principles even more rigidly and find practical compromise harder.",
      blindspot: "You may read others' more flexible solutions as unprincipled, when they often just weigh priorities differently.",
    },
  },
  H_low: {
    hu: {
      stress: "Nyomás alatt még fontosabbá válhat neked az eredmény, és kevésbé figyelhetsz arra, hogyan hatnak a döntéseid a kapcsolataidra.",
      blindspot: "A környezeted már azelőtt óvatosabbá válhat veled, hogy nyíltan jelezné a feszültséget.",
    },
    en: {
      stress: "Under pressure the focus on results can intensify, and relational costs slip out of view more easily.",
      blindspot: "People may grow guarded around you before anything signals it.",
    },
  },
  E_high: {
    hu: {
      stress: "Nyomás alatt az érzelmi terhelés gyorsabban összeadódhat: a feszültség hatással lehet az alvásodra, és a döntések halogatásához vagy túlpörgéshez vezethet.",
      blindspot: "Mások problémái is hosszan foglalkoztathatnak, miközben kívülről nem feltétlenül látszik, mennyire megterhelnek.",
    },
    en: {
      stress: "Under pressure emotional load compounds quickly: tension may show up as poor sleep, delayed decisions, or overdrive.",
      blindspot: "You may carry others' problems as well – often invisible from the outside for a long time.",
    },
  },
  E_low: {
    hu: {
      stress: "Nyomás alatt is többnyire nyugodt maradhatsz, de rövidebben és tárgyszerűbben beszélhetsz.",
      blindspot: "A többiek ilyenkor több megnyugtatást várhatnak, mint amennyit magadtól adnál.",
    },
    en: {
      stress: "Under pressure your calm holds, but your communication can turn terse and purely factual.",
      blindspot: "People around you may need more reassurance than you would naturally give.",
    },
  },
  X_high: {
    hu: {
      stress: "Nyomás alatt felpöröghet a tempód: többet beszélhetsz, gyorsabban dönthetsz, és kevesebb figyelem juthat mások meghallgatására.",
      blindspot: "A csend a csapatban ilyenkor nem egyetértés, hanem visszahúzódás is lehet.",
    },
    en: {
      stress: "Under pressure your tempo can spike: more talking, faster decisions, less listening.",
      blindspot: "Silence in the team may mean withdrawal rather than agreement.",
    },
  },
  X_low: {
    hu: {
      stress: "Nyomás alatt még inkább befelé fordulhatsz, és megpróbálhatsz mindent egyedül megoldani.",
      blindspot: "A környezeted ezt távolságtartásként vagy érdektelenségként értelmezheti.",
    },
    en: {
      stress: "Under pressure you may turn further inward and solve things alone.",
      blindspot: "Others can read this as distance or disinterest.",
    },
  },
  A_high: {
    hu: {
      stress: "Nyomás alatt a béke megőrzése kerülhet előtérbe: ott is engedhetsz, ahol fontosabb lenne megvédened a saját határaidat.",
      blindspot: "A ki nem mondott feszültség később más helyzetben is előjöhet.",
    },
    en: {
      stress: "Under pressure keeping the peace can take over: you may yield even where guarding your own boundary is the job.",
      blindspot: "Unspoken tension accumulates and surfaces later in unexpected places.",
    },
  },
  A_low: {
    hu: {
      stress: "Nyomás alatt a reakcióid élesebbé válhatnak, és a vita hamarabb személyessé fordulhat, mint szeretnéd.",
      blindspot: "Amit te őszinteségnek élsz meg, azt mások támadásként értelmezhetik.",
    },
    en: {
      stress: "Under pressure your reactions can sharpen, and debate may turn personal sooner than you would like.",
      blindspot: "What you experience as honesty, others may decode as attack.",
    },
  },
  C_high: {
    hu: {
      stress: "Nyomás alatt nőhet az ellenőrzési igényed: újra és újra átnézheted a munkát, nehezebben adhatsz át feladatokat, és merevebben ragaszkodhatsz a tervekhez.",
      blindspot: "A tökéletesítés késleltetheti a befejezést akkor is, amikor a megoldás már megfelelő lenne.",
    },
    en: {
      stress: "Under pressure the need for control can grow: more checking, harder delegation, stiffer plans.",
      blindspot: "Polishing often comes at the cost of 'good enough, on time'.",
    },
  },
  C_low: {
    hu: {
      stress: "Nyomás alatt nehezebb lehet rendben tartanod a feladatokat: könnyebben csúszhatnak a határidők, és elmaradhatnak részletek.",
      blindspot: "Mások megbízhatatlanságnak láthatják, ha olyan feladatot hagysz későbbre, amelyet ők fontosnak tartanak.",
    },
    en: {
      stress: "Under pressure holding structure gets even harder: deadlines and details slip more easily.",
      blindspot: "Others may read as a reliability issue what is, for you, a matter of priorities.",
    },
  },
  O_high: {
    hu: {
      stress: "Nyomás alatt csábítóbb lehet új ötletbe kezdeni, mint végigvinni az elakadt feladatot.",
      blindspot: "A gyakori irányváltás bizonytalanságot kelthet a csapatban.",
    },
    en: {
      stress: "Under pressure a new idea or pivot can become an appealing escape from hard execution.",
      blindspot: "For the team, frequent pivots can land as instability.",
    },
  },
  O_low: {
    hu: {
      stress: "Nyomás alatt még inkább ragaszkodhatsz a bevált módszerhez, akkor is, ha az már nem segít megoldani a feladatot.",
      blindspot: "Könnyen elkerülheti a figyelmedet, hogy a körülmények megváltoztak, és már máshogy érdemes dolgozni.",
    },
    en: {
      stress: "Under pressure reliance on proven methods can intensify – even when the situation calls for a new kind of answer.",
      blindspot: "The safety of 'we've always done it this way' can mean slow response in fast change.",
    },
  },
};

// ─── Archetípus-történet (P5.6) ──────────────────────────────────────────────
// Storytelling-felütés az executive summary tetejére: „az emberek
// történeteket jegyeznek meg, nem adatokat" (2. külső kör). Moduláris:
// a DOMINÁNS dimenzió adja a főnévi archetípus 2 mondatos karakterképét,
// a MÁSODIK a személyes színezetet — 6+6 építőelem, nem 30 kézi szöveg.
// Harmadik személyben indul (a típusról szól), majd másodikra vált (rólad).

export const ARCHETYPE_STORY_NOUN: Record<string, LocalizedText> = {
  H: {
    hu: "Az értékőr számára fontos, hogy tisztességesen járjon el másokkal. Jellemzően akkor is az egyenes beszédet választja, ha taktikázással gyorsabban érhetne célt.",
    en: "The Value Guardian is rarely the loudest person in the room – more often the one others instinctively trust. Open cards and the quality of relationships matter more to them than a quick win.",
  },
  // 2026-08-11, valencia-revízió: a MEGFIGYELÉS marad (korán észreveszi a
  // feszültséget), a CÍMKE („empata") és az erény-keretezés megy — az
  // Emocionalitás facetjei (Félelem/Szorongás/Dependencia/Érzelmi kötődés)
  // nem empátiát mérnek. A második mondat ezért az árát is kimondja, nem
  // erényt tulajdonít.
  E: {
    hu: "A ráhangolódó hamar megérezheti a helyzetek feszültségét. Ez segíthet észrevenni a problémát, de terhet is jelenthet: egy nehéz helyzet hatása hosszan megmaradhat benne.",
    en: "The Signal Reader notices tension before anyone says it out loud. That yields a lot of information – and a lot of load: what's in the room stays with them too.",
  },
  X: {
    hu: "A hajtóerő jellemzően szívesen kezdeményez, beszélget és vállal szerepet a közös munkában. A lelkesedése a többieket is ösztönözheti.",
    en: "The Driving Force is the person things start moving around: where they are, there is tempo. Their energy is contagious – teams often take their rhythm from them.",
  },
  A: {
    hu: "A hídépítő jellemzően türelmesen keresi a megegyezés lehetőségét. Akkor is próbálhat közös megoldást találni, ha a résztvevők eleinte mást szeretnének.",
    en: "The Bridge-Builder works where others see walls: between people and positions. The stage is rarely theirs – but without them many agreements would never happen.",
  },
  C: {
    hu: "A rendszerépítő jellemzően számon tartja a feladatokat, és gondosan megtervezi a munkát. Szereti látni, mi készült el, és mi van még hátra.",
    en: "The Architect is the one with whom things don't get lost – they get done. Where they work, chaos becomes process, and process becomes results.",
  },
  O: {
    hu: "Az újító jellemzően szívesen kérdez rá a megszokott megoldásokra. Érdekelheti, mi történne, ha másképp közelítenétek meg a feladatot.",
    en: "The Innovator keeps asking 'why do we do it this way?' long after everyone else stopped. They see possibilities sooner than limits.",
  },
};

export const ARCHETYPE_STORY_ADJ: Record<string, LocalizedText> = {
  H: {
    hu: "Emellett jellemzően azt is mérlegeled, összeegyeztethető-e az elveiddel, ahogyan eléred a célodat.",
    en: "In you this is typically paired with a strong inner compass: the how matters as much as the how much.",
  },
  // A korábbi „érzed is, mi történik a másikkal" burkolt empátia-állítás volt
  // (a skála nem mér mások-olvasási pontosságot) — a helyére a saját
  // oldalról leírt ráhangolódás került, az árával együtt.
  E: {
    hu: "Emellett jellemzően érzékenyen reagálsz a helyzetek érzelmi jelzéseire. A feszültség később is megmaradhat benned, és megterhelhet.",
    en: "In you this is typically coloured by strong emotional attunement: the charge of a situation doesn't pass you by – and it stays with you for a while afterwards.",
  },
  X: {
    hu: "Emellett jellemzően szívesen kezdeményezel és veszel részt a közös munkában.",
    en: "In you this typically comes with momentum: you don't just stand for what matters – you energise it.",
  },
  A: {
    hu: "Emellett jellemzően türelmesen egyeztetsz, és keresed, miben tudtok megegyezni.",
    en: "In you this is typically paired with a patient, collaborative style: finding common ground isn't a concession, it's a method.",
  },
  C: {
    hu: "Emellett jellemzően megtervezed a feladataidat, és figyelsz rá, hogy végig is vidd őket.",
    en: "In you this typically comes with method: what you start has structure – and an ending.",
  },
  O: {
    hu: "Emellett jellemzően szívesen próbálsz ki új megoldásokat, és megkérdezed, lehetne-e másképp csinálni valamit.",
    en: "In you this is typically coloured by an experimental streak: next to the proven, you keep placing the 'what if'.",
  },
};

/**
 * Archetípus-történet a domináns + második dimenzióból (P5.6).
 *
 * S3-hedge (motor-audit v4, FIX 5): ha a top-2 sorrend a mérési hibán belül
 * van (isTopPairUncertain), a hívó `null` secondaryCode-dal hívja — ilyenkor
 * csak a főnévi karakterkép megy ki, a második dimenziót színező mondat nem
 * állítható (a címke is főnév-only ilyenkor, a próza nem mondhat többet).
 */
export function buildArchetypeStory(
  primaryCode: string,
  secondaryCode: string | null,
  lang: Locale,
): string | null {
  const noun = ARCHETYPE_STORY_NOUN[primaryCode]?.[lang];
  if (!noun) return null;
  if (!secondaryCode) return noun;
  const adj = ARCHETYPE_STORY_ADJ[secondaryCode]?.[lang];
  if (!adj) return null;
  return `${noun} ${adj}`;
}

// ─── Együttműködés-fejezet (P4.2 v1) ─────────────────────────────────────────
// „Csapatban működve" oldal tartalma – dimenzió-szintű, nem archetípus-
// mátrix (terv: docs/product/riport-egyuttmukodes-fejezet-terv.md).
// A súrlódás-logika a team-stats FRICTION_WEIGHTS modelljének egyszemélyes
// vetülete (C > A > H a legerősebb súrlódás-jóslók). Hangnem:
// hipotézis + puha ajánlás („sokat segíthet, ha…"), nem előírás.

/** Kivel/milyen működés mellett erősödsz – a top-2 markáns dimenzióból. */
export const COLLAB_CLICK: Record<string, LocalizedText> = {
  H_high: {
    hu: "Könnyen megtalálhatod a hangot azokkal, akik nyíltan beszélnek, és betartják az ígéreteiket. Így kevesebbet kell találgatnod, mire számíthatsz tőlük, és könnyebben megbízhatsz bennük.",
    en: "You're in your element alongside people who say what they think and honour what they commit to – collaboration played with open cards quickly becomes mutual trust. Next to highly tactical operators, much of your energy goes into second-guessing motives.",
  },
  H_low: {
    hu: "Könnyen megtalálhatod a hangot azokkal, akiket szintén ösztönöz az eredmény és a verseny. Egy elveihez erősebben ragaszkodó kolléga pedig segíthet észrevenni, hogyan hatnak a döntéseitek a hosszabb távú bizalomra.",
    en: "You click with ambitious, results-driven colleagues – shared targets and fast tempo connect you. A more principled partner can be a good counterweight: they hold long-term trust while you jump on opportunities.",
  },
  E_high: {
    hu: "Könnyebben dolgozhatsz együtt azokkal, akiknek elmondhatod, ha valami megterhel. Egy nyugodtabb társ segíthet higgadtan mérlegelni, miközben te olyan érzelmi jelzésekre is felhívhatod a figyelmét, amelyeket kevésbé vesz észre.",
    en: "You work naturally alongside people who pay attention to others: where human signals matter, your attunement is an asset. A calmer, steadier partner complements you well – they provide the anchor, you the relational radar.",
  },
  E_low: {
    hu: "A hasonlóan higgadt kollégákkal könnyen összpontosíthattok a feladatra nyomás alatt is. Az érzelmi jelzésekre érzékenyebb társak pedig segíthetnek észrevenni, ha a helyzet másokat jobban megterhel.",
    en: "In crisis and under pressure you're the one others calm down next to – with similarly composed colleagues you build fast, matter-of-fact working relationships. More emotionally attuned partners bring what you surface less often: early human signals.",
  },
  X_high: {
    hu: "Közel állhat hozzád, ha sokat egyeztethettek és közösen ötletelhettek. Egy csendesebb társ más munkaritmust hozhat: beszéljétek meg, mikor dolgoztok együtt, és mikor van szükségetek önálló gondolkodásra.",
    en: "You're in your element where collaboration has tempo: workshops, quick alignments, shared spaces. Quieter, deep-focus colleagues pair well with you – they carry the long-concentration threads while you keep momentum and connections.",
  },
  X_low: {
    hu: "Könnyebben dolgozhatsz azokkal, akikkel nem kell minden kérdést azonnal megbeszélni, és írásban is lehet egyeztetni. Egy társasabb kollégával megoszthatjátok a feladatokat, ha neki a kapcsolattartás, neked az elmélyült munka áll közelebb.",
    en: "Your best pairings are people with whom alignment is infrequent but substantive – colleagues who work well in writing and independently. A more social partner complements you: they maintain organisation-facing connections, you bring the depth.",
  },
  A_high: {
    hu: "Jellemzően kész vagy alkalmazkodni, és keresni, miben tudtok megegyezni. Egy határozottabb kolléga segíthet döntésre jutni, te pedig abban segíthetsz, hogy a döntésnél a többiek szempontjai is szóba kerüljenek.",
    en: "You're the one work keeps functioning next to, even with difficult people – you fit most styles. You grow strongest alongside direct, decision-quick partners: they bring the edge, you bring the bridge.",
  },
  A_low: {
    hu: "Könnyen megtalálhatod a hangot azokkal, akikkel nyíltan lehet vitázni a feladatról. Egy diplomatikusabb kolléga pedig segíthet úgy megfogalmazni a kritikát, hogy a másik fél könnyebben meghallja.",
    en: "You work well with people who can take a straight debate and don't bruise from hard questions – with them the air is clearer after an argument, not heavier. More diplomatic colleagues complement you where maintaining the relationship is itself the job.",
  },
  C_high: {
    hu: "Közel állhat hozzád, ha a kollégáid is követik a tervet és a megbeszélt határidőket. Egy rugalmasabban dolgozó társsal is kiegészíthetitek egymást, ha világos, ki mit vállal, és mihez kell mindenképpen tartanotok magatokat.",
    en: "You work well alongside people who keep their commitments: with structured, deadline-honouring colleagues mutual trust forms quickly. An improvisational partner also does you good – they bring the twist, you bring the follow-through, as long as roles are explicit.",
  },
  C_low: {
    hu: "Könnyen dolgozhatsz olyan kollégákkal, akik menet közben is készek módosítani a terven. Egy rendszerezettebb társ segíthet követni a részleteket, miközben te abban segíthetsz, hogy a megváltozott helyzethez igazítsátok a munkát.",
    en: "You're a good partner in flexible, evolving work – with similarly adaptive colleagues you find rhythm easily. A more systematic partner adds a lot: they hold the threads, you bring the agility.",
  },
  O_high: {
    hu: "Szívesen dolgozhatsz olyanokkal, akikkel új ötleteket lehet megvitatni. A gyakorlatiasabb kollégák abban segíthetnek, hogy közösen eldöntsétek, melyik ötletet hogyan lehetne kipróbálni.",
    en: "Collaboration ignites for you with curious people who like to think – a good debate is fuel for you, not conflict. More pragmatic partners add what ideas alone don't: the landing.",
  },
  O_low: {
    hu: "Közel állhat hozzád, ha a kollégáid is bevált módszerekkel dolgoznak. Egy sok új ötlettel érkező társ mellett pedig abban segíthetsz, hogy közösen végiggondoljátok, mi válna be a mindennapi munkában.",
    en: "You pair best with colleagues who work predictably, in proven ways – reliability is your shared language. You also work well next to innovators, when you can be the one who turns a good idea into stable practice.",
  },
};

/** Hol éleződhet – kétirányú megfogalmazás + egy oldó fél mondat. */
export const COLLAB_FRICTION: Record<string, LocalizedText> = {
  C_high: {
    hu: "Feszültséget okozhat, ha mások lazábban kezelik a tervet vagy a határidőt. Ők közben túl merevnek láthatják az elvárásaidat. Egyezzetek meg abban, mikorra és milyen minőségben kell elkészülni, és hol választhat mindenki saját módszert.",
    en: "Your most likely friction is around tempo and quality: looser planners can feel unreliable to you, while your hold on order can feel rigid to them. It defuses a lot to agree on shared deadlines and a quality minimum, rather than policing the method.",
  },
  C_low: {
    hu: "A kötött munkamenet fölöslegesnek tűnhet számodra, a többiek viszont az elmaradt részfeladatok miatt aggódhatnak. Válasszatok néhány olyan közös szabályt, amelyet mindannyian vállalni és követni tudtok.",
    en: "Friction can arise where structure itself is the expectation: to systematic colleagues slipping details can become a trust issue, while their processes can feel like needless brakes to you. A shared minimal frame helps – few commitments, but truly kept.",
  },
  A_high: {
    hu: "Ha kerülöd a vitát, az ellenvetésed kimondatlan maradhat, és a határozottabb kollégák dönthetnek helyetted. Már az egyeztetés elején jelezheted: „Mielőtt döntünk, szeretném elmondani, mivel nem értek egyet.”",
    en: "Your friction is often invisible: you avoid sharp debate, but unspoken tension accumulates, and more competitive colleagues may dominate decisions. Many find it helps to request a turn in advance: 'before we decide, let me state my objection'.",
  },
  A_low: {
    hu: "Az egyenes visszajelzésed élesnek tűnhet annak, aki óvatosabban fogalmaz. Te pedig az ő kerülő mondatait érezheted időhúzásnak. Mondjátok ki, mi a konkrét kérdés, és a kifogásotokat a konkrét feladatról vagy döntésről mondjátok el.",
    en: "Your most common friction point is style: harmony-oriented colleagues can read your direct, fast feedback as sharp, while their circling can feel like stalling to you. It defuses a lot when the debate opens with: the critique is about the work, not the person.",
  },
  H_high: {
    hu: "Nehezen viselheted, ha valaki nem mondja ki, mit akar, és kerülő úton próbál érvényesülni. Ilyenkor könnyen gyanakvóvá válhatsz azzal szemben is, aki egyszerűen más érdeket képvisel. Mielőtt következtetnél a szándékára, kérdezz rá, mit szeretne elérni.",
    en: "Friction can arise where games are the norm: in tactical settings your fairness can look exploitable, and you may grow suspicious of people who simply navigate more flexibly. It helps to distinguish: not all self-advocacy is manipulation.",
  },
  H_low: {
    hu: "Amit te versenynek élsz meg, azt mások az érdekeik figyelmen kívül hagyásaként értelmezhetik. Beszéljétek meg előre a szabályokat, és a kisebb vállalásokat is tartsd be, hogy legyen mire építenetek a bizalmat.",
    en: "Your competitive style can create friction with trust-sensitive colleagues: what you experience as healthy contest, they may read as steamrolling. Visible fairness in small things matters a lot – it keeps allies for the big moments.",
  },
  E_high: {
    hu: "Bizonytalanná tehet, ha egy tárgyszerűen, röviden kommunikáló kollégától kevés visszajelzést kapsz. Mondd el neki, miről szeretnél rendszeresen egyeztetni; nem biztos, hogy magától észreveszi, mire van szükséged.",
    en: "Tension can arise where brisk, matter-of-fact operation is the norm: cooler colleagues' lack of feedback can breed uncertainty in you, while they don't see what's missing. It helps when the need takes concrete form: short, regular feedback moments.",
  },
  E_low: {
    hu: "A nyugalmad távolságtartásnak tűnhet annak, akit jobban megvisel a helyzet, miközben te túlzónak láthatod a reakcióját. Beszéljétek meg, kit mi foglalkoztat, mielőtt egymás szándékára következtetnétek.",
    en: "To more emotionally intense colleagues your calm can read as distance, while their reactions can look like overreaction to you. The dispute is rarely the content itself – more often the intensity gap; naming that helps.",
  },
  X_high: {
    hu: "Ha gyorsan követik egymást a hozzászólások, a csendesebb kollégák nehezebben kaphatnak szót. Hagyj időt a válaszra, és adj lehetőséget arra is, hogy valaki később, írásban ossza meg a gondolatait.",
    en: "Your friction next to quieter colleagues is rarely loud: they simply disengage when everything happens verbally and fast. Asynchronous space helps a lot – when input can come in writing, their best thinking arrives too.",
  },
  X_low: {
    hu: "A sok megbeszélés lemeríthet, a visszahúzódásodat pedig mások távolságtartásnak láthatják. Egyezzetek meg, mikor beszéltek személyesen, és mit intéztek inkább írásban.",
    en: "A fast, meeting-driven environment drains you, while to more social colleagues your withdrawal can look like distance. An explicit working agreement can help: when you're available live, and what goes in writing.",
  },
  O_high: {
    hu: "Az új ötleteid feszültséget okozhatnak, ha felborítják mások bevált munkamenetét. Válasszátok külön, mit próbáltok ki, és mi marad egyelőre a megszokott módon, hogy követni lehessen a változást.",
    en: "You may grate against pragmatic executors where your ideas upset their stable processes – to them frequent pivots are risk, to you constancy is stagnation. Separating lanes helps: an experimental track for the new, a protected track for what works.",
  },
  O_low: {
    hu: "Ellenállást érezhetsz, ha a többiek gyorsabban változtatnának a bevált módszeren. Kérdezd meg, milyen problémát oldana meg a változás, és hogyan tudnátok kisebb lépésben kipróbálni.",
    en: "The tempo of innovator colleagues can trigger resistance in you – you defend the proven, they the possible. Friction drops when 'why change?' gets a real answer, not just enthusiasm.",
  },
};

/** Pszichológiai biztonság + vezetői közeg – puha framinggel („sokat segíthet, ha…"). */
export const COLLAB_NEEDS: Record<string, LocalizedText> = {
  H_high: {
    hu: "Segíthet a munkádban, ha a vezetőd elmondja, mi alapján döntött, és a kényes kérdéseket is meg lehet beszélni. Így könnyebben látod, hogy a napi döntések összhangban vannak-e a közösen vállalt elvekkel.",
    en: "You're at your best where stated values and daily practice match. For many with integrity this strong, it helps when their leader decides transparently and sensitive matters aren't settled in the corridor.",
  },
  H_low: {
    hu: "Ösztönözhet, ha világos célt kapsz, és az eredményedet elismerik. Segíthet, ha a vezetőddel előre megbeszélitek, miben dönthetsz önállóan, és milyen határokat kell betartanod.",
    en: "Clear goals and real stakes are what drive you. A leader who marks out the playing field – what's allowed, where the line is – and recognises results over appearances can help a lot.",
  },
  E_high: {
    hu: "Sokat számíthat, hogy kérdezhess, segítséget kérhess, és egy hiba miatt ne kelljen megszégyenítéstől tartanod. A kiszámítható elvárások és a rendszeres, rövid visszajelzések csökkenthetik a terhelést.",
    en: "You're at your best when mistakes don't come with shaming: a safe, predictable climate isn't comfort for you, it's a performance condition. For many with a similar profile, regular short feedback moments work best – even under pressure.",
  },
  E_low: {
    hu: "Közel állhat hozzád, ha önállóan dolgozhatsz, és nem kell folyton megnyugtató visszajelzést adnod vagy kérned. Közben mondd el, ha fontos neked valami: a nyugalmadból ez nem feltétlenül derül ki.",
    en: "For you, autonomy is the signal of trust: you work well when constant emotional reassurance isn't required in either direction. It helps when those around you know your calm isn't indifference – so it doesn't get misread.",
  },
  X_high: {
    hu: "Feltölthet, ha részt vehetsz közös megbeszéléseken, bemutathatod az ötleteidet, és hamar kapsz visszajelzést. Segíthet, ha a szereplést és a csendesebb munkát is be tudod illeszteni a napodba.",
    en: "Your energy comes from shared space: you thrive with live collaboration, a visible role, and fast feedback. For many with this profile it helps when their leader gives stage room – while also recognising quiet work, not just the loud kind.",
  },
  X_low: {
    hu: "Segíthetnek a megszakítások nélküli időszakok, amikor önállóan dolgozhatsz. Az eredményeidet írásban is összefoglalhatod, így a többiek akkor is követhetik a munkádat, ha ritkábban szólalsz meg.",
    en: "Deep focus is your operating mode: you perform when you have uninterrupted stretches and results count over presence. It helps when visibility comes in low-threshold forms – a written summary, not a stage.",
  },
  A_high: {
    hu: "Közel állhat hozzád, ha a kollégák segítik egymást, és nem kell minden kérdésben megküzdeni a többiekkel. Sokat számíthat, ha a vezető figyel arra, hogy kompromisszumnál ne mindig ugyanaz az ember engedjen.",
    en: "You're in your element where collaboration isn't combat: a collegial, mutually supportive setting multiplies you. For many with this profile it helps when their leader notices the quiet concessions – and doesn't let the same person always be the one to yield.",
  },
  A_low: {
    hu: "Segíthet, ha a nyílt vitát elfogadják, és világos, ki hogyan hozza meg a végső döntést. Így az eltérő álláspontok megbeszélése után folytathatjátok a közös munkát.",
    en: "Honest debate is your normal mode: you work well where disagreement isn't sacrilege. A setting with clear decision rules helps a lot – so a sharp debate can actually close at the decision.",
  },
  C_high: {
    hu: "Segíthet, ha világos a cél, a felelős és a határidő. Ha változik a terv, kérdezz rá az okára, hogy könnyebben el tudd dönteni, hogyan alakítsd át a feladataidat.",
    en: "You deliver your best when goals, responsibilities, and deadlines are explicit – ambiguity isn't freedom to you, it's risk. For many with this profile, changes land best with reasoning attached, not as fait accompli.",
  },
  C_low: {
    hu: "Közel állhat hozzád, ha magad választhatod meg a munka módját. Egyeztessétek az elvárt eredményt és a határidőt, majd beszéljétek meg, mekkora önállóságot kapsz a megvalósításban.",
    en: "Room to manoeuvre is your performance condition: you wear down fast under micromanagement. It helps when expectations are fixed at the outcome level – leaving the how with you.",
  },
  O_high: {
    hu: "Ösztönözhet, ha új dolgokat tanulhatsz, vagy alakíthatsz a munkameneten. Segíthet, ha a feladataid között van olyan kisebb próba is, amelynek az eredményéből tanulhatsz.",
    en: "You thrive when there's something to learn and something to shape: frozen routines are slow burnout for you. For many with this profile it helps to have a protected experimental lane in the role – small, but real.",
  },
  O_low: {
    hu: "Könnyebb lehet alkalmazkodnod a változáshoz, ha előre tudsz róla, és érted az okát. Segíthet, ha van időd begyakorolni az új munkamenetet, mielőtt újabb változás következik.",
    en: "Stable foundations are your safety: you perform when change is introduced deliberately, not abruptly. It helps when novelty arrives in steps – time to consolidate before the next wave.",
  },
};

/** Kiegyensúlyozott profil – nincs pólusos dimenzió. */
export const COLLAB_BALANCED_CLICK: LocalizedText = {
  hu: "A pontszámaid alapján nem emelkedik ki egyetlen, az együttműködésedet meghatározó jellemző. A közös munkában figyeljétek meg, milyen feladatmegosztás és egyeztetési mód válik be nektek.",
  en: "With a balanced profile you typically find rhythm next to many working styles – your fit depends less on personality and more on role and goals.",
};

export const COLLAB_BALANCED_FRICTION: LocalizedText = {
  hu: "A profilod alapján nem nevezhető meg egyetlen kiugró jellemző, amelyhez a feszültséget köthetnénk. Ha elakadtok, beszéljétek meg, ki mit várt a helyzettől, és miben tértek el az elképzeléseitek.",
  en: "Personality is rarely the main source of friction for you – your profile isn't extreme in any direction. When tension does arise, look first at role and expectation clarity: for profiles like yours, that's usually where the root is.",
};

// ─── Growth tips (P2.4, P5.5-ben háromlépcsőssé bővítve) ─────────────────────
// A legalacsonyabb dimenzióhoz konkrét, kipróbálható fejlődési ív:
// viselkedés (mit próbálj ki) → reflexiós kérdés (mit figyelj meg magadon)
// → mérhető kihívás (miből látod, hogy változott valami). Kis szokások,
// nem személyiség-átalakítás; a hangnem meghívó, nem előíró.

export type GrowthPlan = { behavior: string; reflection: string; challenge: string };

export const DIMENSION_GROWTH_TIPS: Record<string, Record<Locale, GrowthPlan>> = {
  H: {
    hu: {
      behavior: "A következő versenyhelyzet előtt rögzítsd magadnak írásban, mi az a határ, amin nem mész túl. Egy mondat elég.",
      reflection: "Legutóbb mikor tartottál ki egy fontos elved mellett versenyhelyzetben? Milyen következménye volt?",
      challenge: "Egy hónapon át jegyezd fel, mely helyzetekben tudtad tartani ezt a határt, és mikor volt nehéz. Nézd meg, mi segített vagy akadályozott benne.",
    },
    en: {
      behavior: "Before your next competitive situation, write down the line you won't cross. One sentence is enough.",
      reflection: "Where did you last draw the line in a heated situation – and was it worth it in hindsight?",
      challenge: "For one month, track how often you held your own line. The goal isn't perfection – it's seeing the pattern.",
    },
  },
  // A E-sor a valencia-kapun (score-valence.deficitSlotEligible,
  // workstyle-content growth-választó) NEM érhető el: az alacsony
  // Emocionalitás nem fejlesztendő hiány. A sor a térkép teljessége miatt
  // marad, és szándékosan viselkedés-javaslat („mondd ki"), nem
  // jellem-ítélet – ha egy jövőbeli felület mégis feloldja, ne hiányt
  // állítson.
  E: {
    hu: {
      behavior: "Zárj le hetente egy beszélgetést azzal, hogy elismered a másik munkáját („örülök, hogy…”, „köszönöm, hogy…”).",
      reflection: "Kinek jelezted vissza utoljára, hogy számít neked a munkája?",
      challenge: "Két héten át hetente egyszer mondd el valakinek, mit értékelsz a munkájában. Figyeld meg, változik-e, ahogyan hozzád fordulnak.",
    },
    en: {
      behavior: "Once a week, close a conversation with an explicit acknowledgement (\"I'm glad that…\", \"thank you for…\").",
      reflection: "Who did you last tell that their work matters to you?",
      challenge: "One spoken acknowledgement per week for two weeks – and notice whether the way people approach you changes.",
    },
  },
  X: {
    hu: {
      behavior: "Ebben a hónapban egyszer mutasd meg a többieknek, min dolgozol: tarts rövid bemutatót, készíts csapatösszefoglalót vagy írj helyzetjelentést. Válaszd azt a formát, amelyik közel áll hozzád.",
      reflection: "Mi az a munkád, amiről a csapat nem is tud, pedig büszke vagy rá?",
      challenge: "A következő hónapban egyszer mutasd be a munkádat öt percben, és figyeld meg, hány kérdést vagy visszajelzést kapsz.",
    },
    en: {
      behavior: "Take on one small visibility moment per month: a short demo, a team recap, or a written status – you choose the format.",
      reflection: "What work are you proud of that your team doesn't even know about?",
      challenge: "Once next month, show your work in 5 minutes – and count the feedback and questions it brings.",
    },
  },
  A: {
    hu: {
      behavior: "Egy nehéz vita előtt kérj gondolkodási időt, és írd le a másik fél legerősebb érvét.",
      reflection: "Mikor változott meg legutóbb az álláspontod, miután jobban megértetted a másik érveit?",
      challenge: "A következő éles vitában előbb foglald össze a másik álláspontját, és kérdezd meg, pontos volt-e – csak utána érvelj.",
    },
    en: {
      behavior: "Before a heated debate, ask for a day and write down the other side's best argument first.",
      reflection: "When did it last turn out that the other side's argument was better than your first reaction?",
      challenge: "In your next sharp debate, summarise the other position first and ask if you got it right – argue only after.",
    },
  },
  C: {
    hu: {
      behavior: "Válassz egy visszatérő gondot, például a csúszó határidőket. Próbálj ki hozzá heti 15 perc tervezést vagy egy közös ellenőrzőlistát.",
      reflection: "Melyik elmaradt részlet okozta a legtöbb utómunkát az elmúlt hónapban?",
      challenge: "Két hétig tartsd meg a heti 15 perces tervezési időt, majd nézd meg, hány vállalás csúszott a korábbi időszakhoz képest.",
    },
    en: {
      behavior: "Pick one recurring annoyance (e.g. slipping deadlines) and build a minimal system around it: 15 minutes of weekly planning or a shared checklist.",
      reflection: "Which missed detail caused the most rework last month?",
      challenge: "Keep the 15-minute weekly planning slot for two weeks – then compare how many commitments slipped versus before.",
    },
  },
  O: {
    hu: {
      behavior: "Válassz ebben a hónapban egy kisebb feladatot, és próbálj ki hozzá egy számodra új módszert vagy eszközt. Olyat válassz, ahol belefér, ha elsőre nem sikerül.",
      reflection: "Mikor jártál legutóbb jobban azzal, hogy máshogy oldottál meg egy feladatot, mint korábban?",
      challenge: "A feladat végén írd le, jobb lett-e az eredmény az új módszerrel, és mennyi időt vagy erőfeszítést igényelt. Ez alapján döntsd el, használnád-e újra.",
    },
    en: {
      behavior: "Once a month, try a method or tool you have no ready recipe for, on a low-stakes task.",
      reflection: "When did a new approach last get you a better result than the proven route?",
      challenge: "Within a month, take one small task through a new method – and note what it gained and what it cost.",
    },
  },
};

// ─── Solo dim role-fit modifiers (P2.2) ──────────────────────────────────────
// A szerepkör-illeszkedést eddig csak a DOMINÁNS dimenzió hajtotta, ezért
// egy archetípus-családon belül (pl. Empatikus/Együttműködő/Módszeres
// értékőr) szó szerint azonos volt a blokk. Ez a készlet a MÁSODIK
// legerősebb dimenzió árnyaló mondatát adja hozzá.

export const SOLO_DIM_ROLE_MODIFIERS: Record<string, LocalizedText> = {
  H_high: {
    hu: "A Becsületesség-Alázat dimenzión elért magas pontszámod alapján fontos lehet neked, hogy a közösen vállalt elveket a napi döntésekben is kövessétek.",
    en: "Your high integrity adds a nuance: long term, you stay in settings where stated values and daily practice actually match.",
  },
  H_low: {
    hu: "A verseny és a mérhető eredmény ösztönözhet. Egy sok egyeztetésre építő csapatban viszont lassúnak érezheted a haladást.",
    en: "Your strong results-orientation calls for a competitive, target-driven setting alongside this – purely consensus-based cultures may feel slow.",
  },
  E_high: {
    hu: "Sokat számíthat, hogy legyen kitől segítséget kérned, és meg lehessen beszélni, ha valami megterhel. Tartós nyomás mellett hamarabb kimerülhetsz.",
    en: "Your high emotionality needs a people-centred, supportive culture alongside this – in purely transactional settings you wear down faster.",
  },
  E_low: {
    hu: "Az érzelmi stabilitásod olyan feladatokban is segíthet, amelyekben nagyobb nyomás alatt kell döntened.",
    en: "Thanks to your emotional stability, high-stakes, high-pressure variants of these roles can also work well for you.",
  },
  X_high: {
    hu: "Közel állhatnak hozzád a sok beszélgetéssel és szerepléssel járó feladatok. A tartósan elszigetelt munka kevésbé tölthet fel.",
    en: "Your high extraversion tilts this toward visible, people-facing variants – long isolated work feeds you less.",
  },
  X_low: {
    hu: "Közel állhatnak hozzád az önálló gondolkodást engedő feladatok. A folyamatos szereplés több energiát kérhet tőled.",
    en: "With lower extraversion, variants that allow deep, independent focus fit better than constant representation.",
  },
  A_high: {
    hu: "A Barátságosság dimenzión elért magas pontszámod alapján közel állhatnak hozzád azok a feladatok, ahol egyeztetéssel kell közös megoldást találni.",
    en: "Your strong agreeableness tilts this toward collaboration-heavy, coordination-rich variants.",
  },
  A_low: {
    hu: "Hasznos lehet a határozott állásfoglalásod, ha vitás kérdésben kell dönteni. Közben figyelj arra is, hogyan hat a hangnemed a többiekre.",
    en: "Your direct, confrontation-ready style is an asset where debate and decisions are the job – it may grate in harmony-centred settings.",
  },
  C_high: {
    hu: "A Lelkiismeretesség dimenzión elért magas pontszámod olyan feladatokban segíthet, amelyeknél fontos a tervezés és a részletek követése.",
    en: "Your high orderliness pays off most in structured variants built on processes you can see through to the end.",
  },
  C_low: {
    hu: "Közel állhat hozzád, ha menet közben is alakíthatod a munkát. A szigorúan kötött munkafolyamat követése több figyelmet kérhet tőled.",
    en: "With lower orderliness, flexible variants that allow improvisation feel more natural than strict process-following.",
  },
  O_high: {
    hu: "A Nyitottság dimenzión elért magas pontszámod alapján vonzhatnak az új feladatok és a tanulás. A kizárólag ismétlődő teendőkből álló munka idővel unalmassá válhat.",
    en: "Your high openness pulls toward variants offering novelty and learning – purely routine-based roles can feel narrow quickly.",
  },
  O_low: {
    hu: "A bevált módszerek iránti bizalmad a kiszámítható feladatokkal és állandó munkafolyamatokkal járó szerepekben lehet előny.",
    en: "Your preference for proven methods is an asset in predictable, stable variants of these roles.",
  },
};

// ─── Solo dim role texts (Block 5 ha nincs tension pár) ──────────────────────

export const SOLO_DIM_ROLE_TEXTS: Record<string, Record<Locale, { strong: string; medium: string; watchOut: string }>> = {
  H_high: {
    hu: {
      strong: "Közel állhat hozzád a megfelelőség, az etikai tanácsadás, a szabályozás, a közszféra vagy a nonprofit munka, ahol fontos a kölcsönös bizalom és az átlátható döntés.",
      medium: "Vezetői vagy szakértői feladatok is szóba jöhetnek, ha az egyenes beszédet és a tisztességes eljárást a gyakorlatban is elvárják.",
      watchOut: "Fárasztó lehet, ha a kimondott értékek és a napi gyakorlat eltér. Már az elején érdemes tisztázni a határokat és alapelveket.",
    },
    en: {
      strong: "High-trust roles with clear ethical standards: compliance, ethics advisory, nonprofit, public service, regulatory functions.",
      medium: "Any leadership or expert role where integrity and transparency are real requirements, not just messaging.",
      watchOut: "It can be draining when stated values and day-to-day practice don't match. Align early on boundaries and shared principles.",
    },
  },
  H_low: {
    hu: {
      strong: "Közel állhat hozzád az üzletfejlesztés, az értékesítés, a vállalkozás vagy a tárgyalás, ahol ösztönözhet a verseny és az eredmény.",
      medium: "Vezetői, projekt- vagy stratégiai feladatokban is segíthet, ha határozottan képviseled a célokat.",
      watchOut: "Ha a versengés személyeskedésbe fordul, romolhat a csapat együttműködése. Összpontosíts a közös célokra és a közösen elfogadott szabályokra.",
    },
    en: {
      strong: "Competitive, outcome-driven settings: business development, sales, growth, entrepreneurship, negotiation-heavy roles.",
      medium: "Leadership, project, or strategy roles where ambition and confidence are a tailwind.",
      watchOut: "If competition turns into people-versus-people, team dynamics can suffer. Keep it aimed at shared goals and clear rules of play.",
    },
  },
  E_high: {
    hu: {
      strong: "Közel állhatnak hozzád az emberekkel végzett támogató feladatok, például a HR, a mentorálás vagy a szociális munka. Ezekben az érzelmi terheléssel is számolnod kell.",
      medium: "Ügyfélmunkában, oktatásban vagy tárgyaláskor is hasznos lehet, ha észreveszed a hangulat változását, és rá tudsz kérdezni az okára.",
      watchOut: "A tartós nyomás és a kiszámíthatatlanság kimeríthet. Hagyj időt a pihenésre, és figyeld meg, mely szokások segítenek megnyugodni egy nehéz nap után.",
    },
    en: {
      strong: "Supportive, people-centered roles: HR, coaching/mentoring, healthcare or social services, customer experience.",
      medium: "Relationship-heavy roles (customer work, teaching, negotiation) where picking up a shift in mood early matters.",
      watchOut: "Sustained pressure and unpredictability can wear you down. Plan recovery time and keep a simple stress-management routine.",
    },
  },
  E_low: {
    hu: {
      strong: "A nyugalmad segíthet olyan feladatokban, amelyeknél nyomás alatt vagy válsághelyzetben kell dönteni.",
      medium: "Szervezeti változások vezetése és induló vállalkozások feladatai is szóba jöhetnek, ha a bizonytalanság a munka része.",
      watchOut: "A stabilitásod néha ridegségnek tűnhet. Mondd ki a szándékaidat is, ne csak a tényeket – a nyugalmadból magától nem derül ki, hogyan látod a másik helyzetét.",
    },
    en: {
      strong: "High-pressure decision roles and crisis contexts where calm is an advantage.",
      medium: "Change leadership, transformation, startups, where uncertainty is part of the job.",
      watchOut: "Your steadiness can be read as coldness. Say your intent out loud, not only the facts – your calm alone doesn't convey how you read the other person's situation.",
    },
  },
  X_high: {
    hu: {
      strong: "Közel állhatnak hozzád a vezetői, értékesítési, ügyfélkapcsolati vagy közösségszervező feladatok, ahol sok emberrel találkozol.",
      medium: "Projektvezetésben és változások szervezésében is segíthet, ha szívesen kezdeményezel és vonod be a többieket.",
      watchOut: "A túl sok elszigetelt, önálló munka lemeríthet. Hagyj időt a munkanapjaidban rendszeres, tartalmas beszélgetésekre.",
    },
    en: {
      strong: "Visible, relationship-driven roles: leadership, sales, client-facing work, facilitation, community building.",
      medium: "Project and change leadership where mobilizing and energizing others matters.",
      watchOut: "Too much isolated work can drain you. Build regular, high-quality human contact into your week.",
    },
  },
  X_low: {
    hu: {
      strong: "Közel állhatnak hozzád az elmélyült, önálló munkát igénylő elemzői, fejlesztői, kutatói vagy műszaki szakértői feladatok.",
      medium: "Kis csapatban is segíthet, ha nem kell mindig egyszerre jelen lennetek, és marad időd zavartalan munkára.",
      watchOut: "A sok szereplés és állandó kapcsolatépítés kimeríthet. Egyeztesd, mennyi megbeszélés fér bele a napodba a többi feladat mellett.",
    },
    en: {
      strong: "Deep-focus, autonomous roles: analysis, engineering, research, strategy, technical expertise.",
      medium: "Small-team or async collaboration works well when you still have protected focus time.",
      watchOut: "Highly social, always-on visibility roles can exhaust you. Set boundaries around meetings and public-facing moments.",
    },
  },
  A_high: {
    hu: {
      strong: "Közel állhat hozzád a közös egyeztetések vezetése, a HR, a tanácsadás, a mediáció vagy az ügyfelekkel végzett munka, ahol fontos a megegyezés.",
      medium: "Hosszabb távú partnerekkel is jól dolgozhatsz, ha a feladatban sokat számít a kapcsolat ápolása.",
      watchOut: "Ha halogatod a nehéz beszélgetést, a feszültség megmaradhat. Gyakorold, hogyan mondhatod el röviden és tisztelettel, mi zavar, és min szeretnél változtatni.",
    },
    en: {
      strong: "Collaboration and trust-building roles: facilitation, HR, consulting, mediation, account management.",
      medium: "Partnership-focused roles where stable relationships drive results.",
      watchOut: "In conflict, you may delay directness and tensions can accumulate. Practice short, respectful, assertive check-ins.",
    },
  },
  A_low: {
    hu: {
      strong: "Közel állhatnak hozzád a tárgyalások és a kritikus felülvizsgálatok, például jogi, ellenőrzési vagy stratégiai feladatokban.",
      medium: "Szakértőként vagy vezetőként is hasznos lehet, ha egyértelműen elmondod az álláspontodat.",
      watchOut: "A határozott stílusod feszültséget kelthet. Nevezd meg a konkrét helyzetet és azt, mit szeretnél másképp; kerüld a másik személyének minősítését.",
    },
    en: {
      strong: "Debate, negotiation, and critical-review contexts: legal, audit, strategy, expert review.",
      medium: "Expert or leadership roles where plainspoken feedback creates more value than keeping harmony.",
      watchOut: "Directness can strain the team. Keep feedback specific and constructive: critique situations and ideas, not people.",
    },
  },
  C_high: {
    hu: {
      strong: "Közel állhatnak hozzád a hosszabb, összetett projektek, az üzemeltetés, a programvezetés vagy a minőségbiztosítás feladatai.",
      medium: "Szakértői munkában is segíthet, ha fontos a pontosság, és jól követhető lépésekben dolgozhatsz.",
      watchOut: "Feszültséget okozhat, ha a munka végére mindig újabb feladatok kerülnek, vagy halogatják a döntést. Előre tisztázzátok, mi számít késznek, és mikorra kell elkészülnie.",
    },
    en: {
      strong: "Complex, longer-cycle work: operations, program management, QA, policy, compliance.",
      medium: "Structured expert roles where precision and consistent execution are the baseline.",
      watchOut: "It's frustrating when work never closes or decisions drag on. Define what done means and by when.",
    },
  },
  C_low: {
    hu: {
      strong: "Közel állhat hozzád a gyors kipróbálás, például egy induló vállalkozásban, kreatív csapatban vagy prototípus készítésekor.",
      medium: "Olyan feladatokban is boldogulhatsz, ahol több lehetőséget kell kipróbálni, és szükség szerint irányt váltani.",
      watchOut: "Hosszú, részletes kivitelezés megterhelő lehet. Segíthet egy rendszerezettebben dolgozó társ vagy egy világos munkafolyamat.",
    },
    en: {
      strong: "Fast-moving, experimental environments: startups, creative teams, agile product work, prototyping.",
      medium: "Exploration and idea-generation roles where quick iteration is the point.",
      watchOut: "Long, detail-heavy execution can be draining. Pair with someone (or a process) that carries structure to the finish.",
    },
  },
  O_high: {
    hu: {
      strong: "Közel állhat hozzád a kutatás, a tervezés vagy a termékfejlesztés, ahol új ötletekkel és összetett kérdésekkel foglalkozhatsz.",
      medium: "Oktatásban, tanácsadásban vagy coachingban is hasznos lehet, ha kíváncsian keresel más nézőpontokat.",
      watchOut: "A lezárás néha nehezebb lehet, mint a felfedezés. Segít, ha előre rögzíted az időkeretet és azt, hogy mi számít késznek.",
    },
    en: {
      strong: "Roles that reward novelty and complex thinking: research, strategy, design, product/innovation, entrepreneurship.",
      medium: "Teaching, consulting, coaching where curiosity and reframing create value.",
      watchOut: "Closing can be harder than exploring. Use timeboxes and set clear endpoints upfront.",
    },
  },
  O_low: {
    hu: {
      strong: "Közel állhatnak hozzád a kiszámítható, bevált munkamenetre épülő feladatok, például az üzemeltetés vagy egy ismert megoldás bevezetése.",
      medium: "A meglévő munkafolyamatok javításában és a visszatérő problémák megoldásában is támaszkodhatsz a tapasztalatodra.",
      watchOut: "Egy nagyobb változás feszültséget kelthet benned. Kérj kisebb próbát, megbeszélt ellenőrzési pontokkal, mielőtt teljesen átálltok az új megoldásra.",
    },
    en: {
      strong: "Execution and stability-focused roles: operations, implementation, maintenance, process work.",
      medium: "Optimization and system-level problem solving where experience drives quality.",
      watchOut: "Pressure for radical experimentation can create friction. Ask for a gradual approach: pilots, milestones, controlled risk.",
    },
  },
};
