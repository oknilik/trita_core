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
  hu: "Nem címkézünk. Inkább megmutatjuk, hogyan működsz munkahelyi helyzetekben: mi visz előre, mi terhel, és mi ad stabilitást. Ez nem diagnózis, hanem egy letisztult kép a jelenlegi működésedről.",
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
    hu: "Válaszaid alapján fontosak számodra az elveid, és az is, hogy a működésed összhangban legyen velük. Úgy tűnik, nem önmagában a rivaldafény vonz, hanem az, hogy hitelesen képviselhess valamit — olyan szerepekben teljesíthetsz igazán, ahol a hitelességnek valódi súlya van.",
    en: "Your responses suggest a rarer pattern: your principles matter to you, and so does being seen living them. It's not the spotlight that seems to draw you, but being seen as authentic — you're likely to thrive in roles where credibility is the currency.",
  },
  principledConfronter: {
    hu: "Válaszaid elvhű, a konfrontációt is vállaló működésre utalnak: a nehéz beszélgetéseket ritkán kerülöd el. Etikai vizsgálatokban, szabályozói munkában vagy más olyan helyzetekben lehetsz elemedben, ahol a kellemetlen igazságot is ki kell mondani.",
    en: "Your pattern leans principled and willing to confront — you rarely avoid difficult conversations. Ethical investigations, regulatory work, or anywhere the uncomfortable truth needs voicing are likely natural ground for you.",
  },
responsibleInnovator: {
  hu: "Válaszaid szerint nyitott vagy az új megközelítésekre, ugyanakkor a döntéseidet jellemzően egy erős belső értékrend vezérli. Az innováció nálad ritkán öncélú — inkább átgondolt és felelősen megvalósított.",
  en: "Your responses suggest you are open to new approaches, while your decisions are typically guided by a strong inner value system. For you, innovation is rarely an end in itself — more often deliberate and responsibly executed.",
},
  supportedVisibility: {
    hu: "A válaszaid alapján a társas közeg jellemzően feltölt, a tartós nyomás viszont hamar megterhelhet. Olyan szerepek illenek hozzád leginkább, amelyekben az elvárások mellett rendszeres visszajelzést, biztonságot és megbecsülést is kapsz.",
    en: "Your responses suggest social settings typically energize you, while sustained pressure can wear on you quickly. Roles with feedback, psychological safety, and recognition are likely to fit you best — not just expectations and pressure.",
  },
  structuredStability: {
    hu: "Válaszaid szerint sokat vársz el magadtól, miközben érzékenyebben reagálsz a terhelésre. Ez a kettő együtt tudatos energiabeosztást kíván. Kiszámítható, rendezett és támogató környezetben hozhatod ki magadból a legtöbbet.",
    en: "Your responses suggest you expect a lot of yourself while responding more sensitively to load — together these call for deliberate energy management. A predictable, structured, supportive environment is where you're likely to bring out your best.",
  },
  safeExperimentation: {
    hu: "Az ismeretlen vonz, de feszültséget is kelthet benned. Jellemzően olyan innovációs környezetben működsz a legjobban, ahol van biztonsági háló: nem kell mindent egyszerre kockáztatni.",
    en: "The unknown draws you in, but can also create tension. You typically function best in innovation environments with a safety net — where not everything needs to be risked at once.",
  },
  deepCollaboration: {
    hu: "Válaszaid arra utalnak, hogy nem a társaságot kerülöd, hanem a felszínes kapcsolódást. Jellemzően kisebb létszámú, hosszú távú, bizalmi együttműködésben teljesítesz jól, ahol valóban megismerheted azokat, akikkel együtt dolgozol.",
    en: "Your responses suggest it's not company you avoid — it's superficial interaction. You tend to perform best in small-group, long-term, trust-based collaboration, where you don't need to befriend everyone, only your close collaborators.",
  },
  solitaryInnovator: {
    hu: "Az ötleteidet jellemzően nem közös ötletelésben, hanem önállóan dolgozod ki. Az elmélyült gondolkodás és az újdonságkeresés együtt olyan szerepekhez vihet közel, mint a kutatás, a stratégiai elemzés vagy a rendszertervezés.",
    en: "You tend to develop your ideas alone rather than in brainstorms. The richness of your inner world combined with a drive for novelty makes a rarer profile: solitary researcher, strategic analyst, architect-type roles are likely close to you.",
  },
  facilitatedInnovation: {
    hu: "Válaszaid újító működésre utalnak, de az ötleteket jellemzően nem egyedül viszed végig: bevonod a többieket, és közösen formáljátok őket. A részvételi tervezésben, a műhelymunkák vezetésében és más olyan helyzetekben lehetsz elemedben, ahol az innováció csapatmunka.",
    en: "Your responses point to an innovating pattern you typically don't carry alone: you involve others and shape ideas together. Design thinking, participatory design, workshop facilitation — you're likely in your element where innovation is teamwork.",
  },
  structuredCompetitor: {
    hu: "Válaszaid ambiciózus és fegyelmezett működésre utalnak. Rendezett, világos szabályok szerint működő közegben a versenyszellemed komoly erőforrás lehet. Jellemzően nem helyezkedéssel, hanem teljesítménnyel akarsz érvényesülni.",
    en: "Your responses show an ambitious, disciplined pattern — in a structured environment your competitive drive can be your greatest asset. You tend to win through performance, not politics.",
  },
  structuredInnovator: {
    hu: "Vonzódsz az újszerű problémákhoz, de a legjobb munkádat jellemzően rendezett keretek között végzed. A kreativitás és a struktúra nálad nem ellentét: a világos keretek segítenek abban, hogy az ötletekből megvalósítható megoldások szülessenek.",
    en: "You are drawn to novel problems, but you typically do your best work within structured frameworks. This is not a contradiction — it is the natural profile of structured innovation.",
  },
  resilientLeader: {
    hu: "Válaszaid arra utalnak, hogy társas helyzetekben vagy elemedben, miközben a nyomás sem könnyen zökkent ki. Amikor mások elbizonytalanodnak, jellemzően tartod az irányt, és ilyenkor támaszt is adhatsz a környezetednek.",
    en: "Your responses point to a rarer pairing: you're in your element among people, and pressure rarely throws you off. When others waver, you tend to hold direction — stress rarely damages your relationships; if anything, that's when you can become a real support.",
  },
  calmExecution: {
    hu: "Válaszaid szerint megbízhatóan és egyenletesen teljesítesz: a lelkiismeretességedet az érzelmi stabilitás egészíti ki. Nyomás alatt is jellemzően kiszámíthatóan végzed a feladataidat.",
    en: "Your responses suggest you deliver reliably and consistently — your conscientiousness and emotional stability reinforce each other. Where others might derail under pressure, you tend to produce results predictably.",
  },
  exploratoryAnalyst: {
    hu: "Válaszaid alapján kíváncsi vagy az ismeretlenre, és a bizonytalanság sem könnyen rendít meg. Jellemzően nyugodtan és alaposan jársz körül új területeket; a kutatásban, az elemzésben és a felfedezésben érezheted magad igazán otthon.",
    en: "Your responses suggest curiosity about the unknown, with uncertainty rarely unsettling you — a combination that doesn't often go together. You tend to explore new territory calmly and thoroughly; research, analysis, and discovery are likely where you feel most at home.",
  },
  organizedLeader: {
    hu: "Válaszaid szerint jól bánsz az emberekkel, miközben a feladatokban is rendet tartasz: szervezel, kommunikálsz, és jellemzően teljesíted, amit vállaltál. Egyszerre tudod mozgósítani a csapatot és végigvinni a terveket.",
    en: "Your responses suggest you're good with people while keeping tasks in order: you organize, communicate, and typically deliver what you commit to. You can mobilize the team and follow plans through at the same time.",
  },
  harmoniousConnector: {
    hu: "A profilodban a lendület és a befogadó figyelem együtt jelenik meg — ez ritkább kombináció. Energiát hozol a csapatba, közben a többiekre is odafigyelsz, ezért gyakran te lehetsz az, aki összetartja a többieket.",
    en: "Momentum and receptive attention appear together in your profile — a rarer combination. You bring energy to the team while staying attentive to others, which is why you're often the one holding the team together.",
  },
  performanceDriver: {
    hu: "Válaszaid ambiciózus és szervezett működésre utalnak: jellemzően kitartó munkával és következetes végrehajtással éred el a céljaidat. A versenyszellem és a precizitás nálad jól kiegészítheti egymást.",
    en: "Your responses show an ambitious, organized pattern — you tend to reach goals through hard work and consistent execution. Competitive drive and precision don't cancel each other out in your profile; together they can power your results.",
  },
  disruptiveInnovator: {
    hu: "Válaszaid önálló, megkérdőjelező gondolkodásra utalnak: ritkán kötsz kompromisszumot pusztán a béke kedvéért, és közben nyitott vagy az új gondolatokra. Megfelelő közegben ez a kettő együtt jelentős újító erő lehet.",
    en: "Your responses point to independent, questioning thinking: you rarely compromise just for the sake of peace, while staying open to new ideas. In the right environment, the two together can be a serious innovative force.",
  },
};

// ─── Block 3 – Rövid működési összkép (ne ismételje a 6/7 blokkokat) ─────────

export const BLOCK3_SUMMARIES: Record<string, LocalizedText> = {
  ethicalLeader: {
    hu: "A hitelesség és a látható felelősségvállalás egyszerre fontos neked. Jellemzően olyan helyzetekben vagy erős, ahol értékek mentén kell irányt mutatni.",
    en: "Authenticity and visible responsibility both matter to you. You tend to be strongest in situations where direction must be set on clear values.",
  },
  principledConfronter: {
    hu: "Az egyenesség és a konfliktustűrés együtt jelenik meg a válaszaidban. Jellemzően akkor működsz jól, ha tiszta határokat és kimondható feszültségeket kell kezelni.",
    en: "Directness and conflict tolerance show up together in your responses. You tend to work well where clear boundaries and explicit tensions must be handled.",
  },
  responsibleInnovator: {
    hu: "Nyitott vagy az újra, de jellemzően belső etikai iránytű mentén döntesz. Nálad az innováció és a felelősség nem ellentét, hanem közös működési elv.",
    en: "You are open to novelty, but you typically decide through an internal ethical compass. For you, innovation and responsibility are not opposites, but one operating principle.",
  },
  supportedVisibility: {
    hu: "A társas jelenlét jellemzően motivál, ha van biztonságos keret körülötte. A látható szerepekben akkor teljesítesz jól, ha kapsz stabil visszajelzést.",
    en: "Social visibility typically motivates you when it is supported by safety. You perform well in visible roles when feedback remains stable and constructive.",
  },
  structuredStability: {
    hu: "A magas belső mérce és az érzelmi érzékenység együtt tudatos kereteket igényel. Rendezett közegben kiegyensúlyozottabban tudod tartani a magas színvonalat.",
    en: "High internal standards combined with sensitivity require intentional structure. In a well-structured environment, you can sustain high quality at a healthy pace.",
  },
  safeExperimentation: {
    hu: "Az újdonság vonz, de kiszámítható támaszpontokra is szükséged van. Akkor működsz jól, ha a kísérletezésnek világos ritmusa és határa van.",
    en: "Novelty attracts you, but you also need stable reference points. You work best when experimentation has a clear rhythm and boundaries.",
  },
  deepCollaboration: {
    hu: "A mély, bizalmi együttműködés többet ad neked, mint a széles körű láthatóság. Jellemzően egy kisebb, stabil kapcsolati hálóban tudsz a legjobban teljesíteni.",
    en: "Deep, trust-based collaboration gives you more than broad visibility. Your performance typically unfolds best in smaller, stable relationship networks.",
  },
  solitaryInnovator: {
    hu: "Az ötleteidet elsősorban elmélyült, önálló munkában érleled. Erősséged a mély gondolkodás és az új perspektívák csendes felépítése.",
    en: "You mainly develop ideas through deep, independent work. Your strength is sustained thinking and building new perspectives quietly.",
  },
  facilitatedInnovation: {
    hu: "Úgy kezdeményezel változást, hogy közben bevonod az érintetteket. Válaszaid alapján akkor működsz természetesen, ha az új megoldásokat másokkal együtt formálhatod.",
    en: "You bring novelty into systems while bringing people with you. Based on your responses, collaborative change-building is your natural operating mode.",
  },
  structuredCompetitor: {
    hu: "A versenyt jellemzően célfegyelemmel és következetes kivitelezéssel kezeled. Olyan környezetben lehetsz erős, ahol a teljesítmény és a mérhetőség tisztán jelen van.",
    en: "You typically approach competition with discipline and consistent execution. You're likely strongest in environments where performance and measurability are explicit.",
  },
  structuredInnovator: {
    hu: "Az új megoldásokat jellemzően rendszerben, nem alkalomszerűen gondolod végig. Akkor végzed a legjobb munkádat, ha a kreativitás és a struktúra egyszerre van jelen.",
    en: "You typically think through new solutions in systems, not ad hoc. You do your best work when creativity and structure are both present.",
  },
  resilientLeader: {
    hu: "Stressz alatt is jellemzően kiegyensúlyozott maradsz, miközben a társas kapcsolatok energiát adnak neked. Olyan helyzetekben lehetsz erős, ahol egyszerre van szükség emberi jelenlétre és stabilitásra.",
    en: "You typically stay balanced even under stress, drawing energy from relationships to sustain it. You're likely strongest in situations that call for both human presence and stability.",
  },
  calmExecution: {
    hu: "Jellemzően megbízhatóan és nyugodtan végzed el, amit vállalsz. A nyomás ritkán rendít meg, és következetesen végigviszed a feladatokat.",
    en: "You typically complete what you take on reliably and calmly. Pressure rarely unsettles you, and you close tasks consistently.",
  },
  exploratoryAnalyst: {
    hu: "Az ismeretlenhez kíváncsian és nyugodtan közelítesz. Ami másokat feszélyez, az téged jellemzően inkább ösztönöz, miközben megőrzöd az elemzői fókuszt.",
    en: "You approach the unknown with curiosity and calm. Novelty unsettles many — you typically find it energizing while maintaining analytical focus.",
  },
  organizedLeader: {
    hu: "Szeretsz emberekkel dolgozni, és végigvinni a feladatokat. A csapatot mozgásban tartod, és jellemzően van kéznél terv és határidő.",
    en: "You work with people and you close things out. You keep the team moving while typically having a plan and a deadline at hand.",
  },
  harmoniousConnector: {
    hu: "Kapcsolatokat építesz, összetartod a csapatot, és az együttműködés természetes közeged. Válaszaid alapján természetesen törekszel a harmónia fenntartására.",
    en: "You build relationships, hold the team together, and collaboration is your natural medium. You typically maintain harmony with little visible effort.",
  },
  performanceDriver: {
    hu: "Válaszaid ambiciózus és szervezett működésre utalnak: jellemzően kitartó munkával és következetes végrehajtással éred el a céljaidat. A versenyszellem és a precizitás egyszerre jellemez.",
    en: "An ambitious, organized pattern — you tend to reach goals through hard work and consistent execution. Competitive drive and precision characterize you together.",
  },
  disruptiveInnovator: {
    hu: "Válaszaid szerint ritkán riadsz vissza a bevett gyakorlat megkérdőjelezésétől, és szívesen keresel új irányokat. A konfrontáció nálad inkább eszköz, mint akadály: az újdonságkeresés és az egyenesség együtt jelenik meg a profilodban.",
    en: "Your responses suggest you rarely shy away from challenging the status quo, and you look for new directions. Confrontation is more tool than obstacle for you — novelty and directness appear together in your profile.",
  },
};

// ─── Block 7 – Kockázati jelzők szövegei ─────────────────────────────────────

export const RISK_TEXTS: Record<string, LocalizedText> = {
  supportedVisibility: {
    hu: "Ha sok a társas inger, gyorsan lemerülhetsz. Segíthet, ha előre beépítesz fix visszajelzési pontokat, és hagysz időt a feltöltődésre.",
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
      strong: "Értékvezérelt, magas bizalmi elvárású közegek, ahol az átlátható döntéshozatal és a hitelesség valóban számít.",
      medium: "Összetett érdekekkel működő szervezetben is jól boldogulhatsz, ha egyértelműek számodra az etikai keretek.",
      watchOut: "Nehéz lehet olyan közegben dolgozni, ahol az értékek csak a kommunikációban jelennek meg. Érdemes már az elején közös etikai döntési elveket rögzíteni.",
    },
    en: {
      strong: "Values-driven environments with high trust expectations, where transparent decisions and credibility matter.",
      medium: "You can still perform in organizations with competing interests if your ethical mandate is explicit.",
      watchOut: "It can be hard to work in environments where values are talked about but not lived. It helps to agree on shared ethical decision principles early on.",
    },
  },
  principledConfronter: {
    hu: {
      strong: "Tiszta szabályokat és egyenes kommunikációt igénylő helyzetek, ahol kényes kérdéseket is ki kell mondani.",
      medium: "Mediáló vagy partneri szerepekben is erős lehetsz, ha világosak a döntési határok és felelősségek.",
      watchOut: "Megterhelő lehet, ha a konfliktusok tabusítva maradnak, és a problémák csak a felszín alatt gyűlnek. Érdemes rendszeres, strukturált konfliktuskezelési teret kialakítani.",
    },
    en: {
      strong: "Contexts that require rule clarity and direct communication, including difficult but necessary conversations.",
      medium: "You can excel in mediation or partner roles when decision boundaries and ownership are explicit.",
      watchOut: "It can become draining when conflicts stay unspoken and issues accumulate below the surface. Regular, structured conflict-resolution checkpoints help.",
    },
  },
  responsibleInnovator: {
    hu: {
      strong: "Innovációs közegek, ahol újdonság és felelősség egyszerre elvárás, nem egymás alternatívája.",
      medium: "Gyorsabb tempójú csapatban is működhetsz, ha előre rögzítitek az etikai kereteket.",
      watchOut: "Nehéz lehet olyan tempójú közegben dolgozni, ahol az etikai kompromisszum csendes elvárás. Érdemes előre tisztázni a vörös vonalakat, és ezek mentén dönteni.",
    },
    en: {
      strong: "Innovation contexts where novelty and responsibility are expected together, not traded off against each other.",
      medium: "You can perform in faster teams if ethical guardrails are defined in advance.",
      watchOut: "It can be difficult in fast environments where ethical compromise is an implicit expectation. Define your red lines in advance and use them consistently.",
    },
  },
  supportedVisibility: {
    hu: {
      strong: "Látható, emberekkel dolgozó szerepek, ahol van pszichológiai biztonság és rendszeres, építő visszajelzés.",
      medium: "Nagyobb társas intenzitású közegben is jól teljesíthetsz, ha van regenerációs ritmusod, és világosak a szerephatárok.",
      watchOut: "Megterhelő lehet a folyamatos társas intenzitás, ha nincs elég regenerációs tér. Érdemes előre beépíteni csendes blokkokat és fix visszajelzési pontokat.",
    },
    en: {
      strong: "Visible, people-facing roles with psychological safety and regular, constructive feedback.",
      medium: "You can also do well in higher social-intensity contexts if recovery rhythm and role boundaries are protected.",
      watchOut: "Continuous social intensity can be draining without enough recovery space. Plan quiet blocks and regular feedback check-ins in advance.",
    },
  },
  structuredStability: {
    hu: {
      strong: "Kiszámítható, strukturált működés, ahol magas minőséget lehet fenntartható tempóban hozni.",
      medium: "Változékonyabb környezetben is jól működhetsz, ha a prioritások és a határidők világosak és kellően állandók.",
      watchOut: "Nehéz lehet, ha az elvárások magasak, de a működés tartósan kiszámíthatatlan. Segít, ha rövid szakaszokban dolgozol, egyértelmű lezárási pontokkal és előre meghatározott terhelési határral.",
    },
    en: {
      strong: "Predictable, structured operations where high quality can be sustained at a healthy pace.",
      medium: "You can also perform in more dynamic contexts if priorities and deadlines stay clearly stable.",
      watchOut: "It can be hard when expectations are high but the environment stays unpredictable. Work in short cycles with clear endpoints and explicit load limits.",
    },
  },
  safeExperimentation: {
    hu: {
      strong: "Kísérletező közegek, ahol van biztonsági háló: lehet újat próbálni, de ellenőrzött keretek között.",
      medium: "Gyors változás mellett is jól működhetsz, ha előre tisztázott, mikor kell dönteni, és milyen lehetőségekhez térhettek vissza.",
      watchOut: "Megterhelő lehet, ha egyszerre túl sok irány nyílik meg, és nincs világos szempont a döntéshez. Érdemes egyszerre legfeljebb 1–2 prioritással dolgozni, előre rögzített leállási feltételekkel.",
    },
    en: {
      strong: "Experimental environments with a safety net: room to try new things, within clear boundaries.",
      medium: "You can work well in fast change if decision cadence and fallback options are clarified upfront.",
      watchOut: "It becomes difficult when too many directions open at once without clear decision criteria. Keep active priorities to 1-2 and use predefined stop rules.",
    },
  },
  deepCollaboration: {
    hu: {
      strong: "Kis létszámú, bizalmi együttműködés, ahol mély szakmai kapcsolat és stabil csapatritmus épülhet.",
      medium: "Nagyobb csapatban is eredményes lehetsz, ha vannak állandó kisebb munkacsoportok és világos kommunikációs csatornák.",
      watchOut: "Nehéz lehet olyan közegben, ahol a kommunikáció felszínes és széttartó marad. Segít, ha stabil páros vagy kis csoportos együttműködéseket alakítotok ki.",
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
      medium: "Csapatban is jól működhetsz, ha van védett fókuszidőd, és az együttműködés nem kíván mindenkitől folyamatos, egyidejű jelenlétet.",
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
      strong: "Olyan változáshelyzetek, ahol az újítás csak bevonással és közös tanulással lesz tartós.",
      medium: "Hierarchikusabb közegben is működhetsz, ha van tér a vezetett egyeztetésekre és a közös finomításra.",
      watchOut: "Nehéz lehet olyan közegben dolgozni, ahol a bevonás csak formális, a döntések pedig zártan születnek. Érdemes a folyamat elején tisztázni, miről lehet ténylegesen dönteni, és mi a közös műhelymunkák konkrét célja.",
    },
    en: {
      strong: "Change contexts where innovation becomes durable through inclusion and shared learning.",
      medium: "You can work in more hierarchical settings if there is room for facilitated alignment and iteration.",
      watchOut: "It can be difficult to work in environments where inclusion is symbolic while decisions remain closed. Clarify upfront what can actually be decided and what concrete outcomes workshops should produce.",
    },
  },
  structuredCompetitor: {
    hu: {
      strong: "Versengő közegek, amelyekben mérhető a teljesítmény, és egyértelműek a célok és a felelősségek.",
      medium: "Konszenzusosabb kultúrában is eredményes lehetsz, ha a sikerkritériumok és a felelősségek tiszták.",
      watchOut: "Megterhelő lehet, ha a teljesítményelvárások homályosak vagy folyamatosan változnak. Érdemes közös sikerkritériumokat és döntési felelősségeket egyértelműen rögzíteni.",
    },
    en: {
      strong: "Competitive settings with measurable outcomes, explicit goals, and clear accountability layers.",
      medium: "You can also perform in consensus-leaning cultures if success criteria and ownership stay explicit.",
      watchOut: "It can be frustrating when performance expectations are ambiguous or keep shifting. Align early on shared success criteria and clear decision ownership.",
    },
  },
  structuredInnovator: {
    hu: {
      strong: "Komplex problémák, ahol egyszerre kell újítani és rendszerben tartani a megvalósítást.",
      medium: "Gyorsabb, kreatívabb közegben is jól működhetsz, ha vannak minimális folyamatkeretek és döntési pontok.",
      watchOut: "Nehéz lehet, ha egyszerre túl sok irány marad nyitva, és a kivitelezés elveszíti a fókuszt. Segít, ha minden munkaszakasznak rögzített kerete, fontossági sorrendbe tett feladatlistája és világos lezárási feltétele van.",
    },
    en: {
      strong: "Complex problems where you must innovate while keeping execution coherent and structured.",
      medium: "You can also do well in faster creative contexts if lightweight processes and clear decision points exist.",
      watchOut: "It can become difficult when too many directions stay open and execution loses focus. Work with fixed per-iteration scope, a prioritized backlog, and clear completion criteria.",
    },
  },
  resilientLeader: {
    hu: {
      strong: "Emberekkel végzett, változékony és magas elvárású munka: vezetés, értékesítési vezetés, kríziskoordináció vagy változásmenedzsment.",
      medium: "Projektvezetés és ügyfélkapcsolati szerepek, amelyekben a társas magabiztosság és a nyomástűrés egyszerre számít.",
      watchOut: "Nehéz lehet, ha a sok társas érintkezésből hiányzik a valódi kapcsolódás, vagy ha az érzelmi stabilitásodat mások érzéketlenségként értelmezik. Érdemes a szándékaidat is kimondani, nemcsak a tényeket.",
    },
    en: {
      strong: "Roles with intensive people work in volatile, high-expectation contexts — leadership, sales leadership, crisis coordination, change management.",
      medium: "Project leadership, client-facing roles where extraversion and stress tolerance both matter.",
      watchOut: "It can be difficult if social activity lacks real depth, or if others interpret your emotional stability as insensitivity. Make a point of voicing your intent, not just the facts.",
    },
  },
  calmExecution: {
    hu: {
      strong: "Összetett, hosszú futamidejű projektek, amelyekhez kitartás és érzelmi állóképesség is kell: üzemeltetés, programvezetés vagy minőségbiztosítás.",
      medium: "Szabályozói, megfelelőségi vagy szakértői szerepek, ahol különösen értékes a megbízható, egyenletes teljesítmény.",
      watchOut: "Előfordulhat, hogy a precizitás és a nyugalom másokban azt a benyomást kelti, hogy nem érzékeled az érzelmi jeleket. Érdemes aktívan visszajelzést kérni a csapattól.",
    },
    en: {
      strong: "High-complexity, long-cycle projects requiring both endurance and emotional resilience — operations, program management, quality assurance.",
      medium: "Regulatory, compliance, or expert roles where reliable, steady performance is a competitive advantage.",
      watchOut: "Your calm precision may sometimes give the impression you're not picking up on emotional signals. Actively seek feedback from your team to counter this.",
    },
  },
  exploratoryAnalyst: {
    hu: {
      strong: "Kutató, stratégiai elemző, innovátor szerepek, ahol az ismeretlen felfedezése mély, kitartó fókuszt igényel.",
      medium: "Feltáró jellegű tanácsadói vagy termékstratégiai munkák is jól illeszkednek, ha van tér a mély gondolkodásra.",
      watchOut: "Megterhelő lehet, ha már azelőtt eredményt várnak, hogy az elemzés kellő mélységűvé válhatna. Érdemes a munkaszakasz elején rögzíteni az elvárt mélységet és a határidőt.",
    },
    en: {
      strong: "Research, strategic analysis, or innovation roles where discovering the unknown calls for deep, sustained focus.",
      medium: "Exploratory consulting or product strategy work also fits well if there is room for deep thinking.",
      watchOut: "It can be challenging when results are demanded before the analysis can truly deepen. Agree up front on the expected depth and timeline at the start of each cycle.",
    },
  },
  organizedLeader: {
    hu: {
      strong: "Projektvezetés, csapatvezetés és operatív irányítás, ahol a rendezett végrehajtás és az emberek mozgósítása egyszerre elvárás.",
      medium: "Értékesítési vagy ügyfélközpontú szerepekben is jól működhetsz, ha kiszámítható folyamat támogatja a munkát.",
      watchOut: "Nehéz lehet, ha a csapat kevésbé rendezetten dolgozik, vagy a célok és határidők folyamatosan változnak. Érdemes egy egyszerű, közösen követhető működési keretet kialakítani.",
    },
    en: {
      strong: "Project management, team leadership, operational direction — where structured execution and human mobilization are expected together.",
      medium: "Sales or customer-centric roles also work well if there is a predictable process underneath.",
      watchOut: "It can be hard if the team works less structurally, or if goals and deadlines keep shifting. Build a minimal process frame the team can plug into.",
    },
  },
  harmoniousConnector: {
    hu: {
      strong: "Csapatépítés, facilitáció, ügyfélkapcsolat, coaching – ahol az összetartás, a bizalom és a közös lendület megteremtése a fő érték.",
      medium: "Értékesítési, tárgyalási és partnerségi szerepekben is jól működhetsz, ha van elegendő visszajelzés és valódi kapcsolódás.",
      watchOut: "Nehéz lehet, ha a konfliktusokat inkább elsimítod, mintsem megoldod: a kimondatlan feszültség hosszú távon felgyűlhet. Érdemes tudatosan fejlesztened az asszertív kommunikációdat.",
    },
    en: {
      strong: "Team building, facilitation, client relations, coaching — where cohesion, trust, and energizing others are the primary value.",
      medium: "Sales, negotiation, and partnership roles are also strong contexts if there is enough genuine connection and feedback.",
      watchOut: "It can be difficult if you tend to harmonize conflicts rather than resolve them — this can accumulate over time. Consciously develop assertive communication skills.",
    },
  },
  performanceDriver: {
    hu: {
      strong: "Eredményalapú, versengő közegek: értékesítés, üzletfejlesztés, növekedés vagy teljesítményközpontú vezetői szerep.",
      medium: "Tárgyalási, stratégiai, vállalkozói szerepek is jól illeszkednek, ha a célok mérhetőek és a siker egyértelmű.",
      watchOut: "Az eredményfókusz időnként háttérbe szoríthatja a csapatdinamikát. Érdemes tudatosan fenntartani a kapcsolatokat, és rendszeres visszajelzési kultúrát kialakítani.",
    },
    en: {
      strong: "Results-driven, competitive environments — sales, business development, growth, performance-oriented leadership.",
      medium: "Negotiation, strategic, and entrepreneurial roles also fit well when goals are measurable and success is clearly defined.",
      watchOut: "Results focus can sometimes overshadow team dynamics. Consciously invest in maintaining relationships and building a regular feedback culture.",
    },
  },
  disruptiveInnovator: {
    hu: {
      strong: "A bevett megoldásokat megkérdőjelező szerepek: innovációs vezetés, vállalkozás vagy stratégiai tanácsadás, ahol értéket teremt a konvenciók felülvizsgálata.",
      medium: "Szakértői, tanácsadói és kutatói szerepekben is jól működhetsz, ha van elegendő önállóságod, és elvárás a kritikus gondolkodás.",
      watchOut: "Nehéz lehet, ha a csapat mindenáron a harmóniát keresi, vagy ha a konfrontáció rontja az összetartást. Érdemes a visszajelzést úgy keretezni, hogy az ne a személy ellen, hanem a jobb megoldás mellett szóljon.",
    },
    en: {
      strong: "Disruption-oriented roles — innovation leader, entrepreneur, strategic advisor, where challenging convention creates value.",
      medium: "Expert consulting and research positions are also a strong fit if you have sufficient autonomy and critical thinking is the norm.",
      watchOut: "It can be difficult if the team operates under strong harmony expectations, or if confrontation damages team cohesion. Channel feedback constructively — against ideas, not people.",
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
    high: { level: "high", value: { hu: "Magas – egyértelmű keretek és folyamatok között dolgozol a legjobban", en: "High – you work best within clear frameworks and processes" } },
    low: { level: "low", value: { hu: "Alacsony – rugalmasan, nagy önállósággal dolgozol a legjobban", en: "Low – you work best flexibly and self-directed" } },
    mid: { level: "mid", value: { hu: "Közepes – igényled a kereteket, de a bürokráciát nem", en: "Medium – you do well with structure, but not bureaucracy" } },
  },
  social: {
    high: { level: "high", value: { hu: "Magas – csapatmunkában, sok kapcsolódással vagy a legjobb formádban", en: "High – you thrive on teamwork and frequent interaction" } },
    low: { level: "low", value: { hu: "Alacsony – önálló munkában vagy kis csapatban dolgozol a legjobban", en: "Low – you work best independently or in a small team" } },
    lowMix: { level: "low", value: { hu: "Alacsony–közepes – az önálló és a kis csapatban végzett munka váltakozása illik hozzád", en: "Low to medium – a mix of independent and small-team work suits you" } },
  },
  change: {
    framed: { level: "mid", value: { hu: "Közepes – a fokozatos, világos keretek között zajló változás illik hozzád", en: "Medium – gradual change within clear boundaries suits you" } },
    high: { level: "high", value: { hu: "Magas – szívesen dolgozol változó, ismeretlen közegben", en: "High – you enjoy working in shifting, novel environments" } },
    stable: { level: "low", value: { hu: "Alacsony–közepes – stabil, kiszámítható folyamatok között működsz jól", en: "Low to medium – you work well with stable, predictable processes" } },
  },
  decision: {
    deliberate: { level: "mid", value: { hu: "Közepes – átgondoltan, szabályok mentén döntesz szívesen", en: "Medium – you prefer deliberate, rule-based decisions" } },
    fast: { level: "high", value: { hu: "Gyors – intuitívan, rugalmasan döntesz", en: "Fast – you decide intuitively and flexibly" } },
    balanced: { level: "mid", value: { hu: "Közepes – átgondoltan döntesz, de nem húzod az időt", en: "Medium – you decide deliberately, without dragging it out" } },
  },
  // A kultúra-értékek a többi sorral azonos „Szint-szó – leírás" szerkezetet
  // követik (a szint-szó a pólus-szókincs) — így a leírás-levágás és a bold
  // címke minden soron ugyanúgy működik.
  culture: {
    high: { level: "high", value: { hu: "Értékvezérelt – etikailag következetes közegben vagy otthon", en: "Values-driven – an ethically consistent culture is where you're at home" } },
    low: { level: "low", value: { hu: "Gyakorlatias – teljesítményalapú, versengő kultúrában is jól működhetsz", en: "Pragmatic – a performance-based, competitive culture also works fine for you" } },
  },
  cycle: {
    long: { level: "high", value: { hu: "Hosszú – szeretsz elmélyülni, és alaposan végigviszed a munkát", en: "Long, deepening – you carry work through thoroughly" } },
    exploratory: { level: "low", value: { hu: "Rövid–közepes – szívesen fedezel fel új irányokat, a lezárás viszont több tudatosságot kíván", en: "Short to medium – you love exploring; closing takes more deliberate effort" } },
    balanced: { level: "mid", value: { hu: "Közepes – elmélyülsz, de tartod a határidőket", en: "Medium – you go deep while keeping deadlines" } },
  },
  load: {
    protected: { level: "low", value: { hu: "Alacsony – kiszámítható terhelés és rendszeres visszajelzés mellett vagy a legjobb formádban", en: "Low – you're at your best with a predictable rhythm and regular feedback" } },
    resilient: { level: "high", value: { hu: "Magas – jól viseled a nyomást és a bizonytalanságot", en: "High – you handle pressure and uncertainty well" } },
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
  hu: "A profilod dimenziói kiegyensúlyozott, egymással összhangban lévő képet adnak. Nem látszik köztük markáns belső feszültség; a működésed különböző oldalai inkább kiegészíthetik egymást.",
  en: "Looking across your profile dimensions, a coherent pattern emerges. There is no notable internal tension between the dimensions — meaning the different aspects of your personality often reinforce each other.",
};

// ─── Solo dim narratives (Block 3 ha nincs tension pár) ──────────────────────

export const SOLO_DIM_NARRATIVES: Record<string, LocalizedText> = {
  H_high: {
    hu: "Válaszaid alapján erősen törekszel a nyílt, játszmamentes működésre. Az egyenes kommunikációt akkor is előnyben részesíted, amikor a taktikázás rövid távon kifizetődőbb lenne; ez stabil alapot adhat a bizalomhoz a munkakapcsolataidban.",
    en: "Based on your responses, open, game-free operation is one of your most dominant preferences: you choose direct communication even when manoeuvring would pay better — a strong, trust-building foundation in your working relationships.",
  },
  H_low: {
    hu: "A válaszaid ambiciózus, stratégiai gondolkodásra utalnak: ritkán riadsz vissza a kihívásoktól és a versenytől. Erősen motiválhat a célok elérése, a versengés és az önérvényesítés pedig természetesebb lehet számodra.",
    en: "Your responses point to ambitious, strategic thinking: you rarely shy away from challenges or competition. Achieving goals drives you — competition and self-assertion may well be your natural environment.",
  },
  // 2026-08-11, valencia-revízió (kanonikus kapu: score-valence.ts): az
  // Emocionalitás egyik pólusa sem erény és nem is hiány. A korábbi HU/EN
  // szöveg empátiát tulajdonított a magas pólusnak („empatikusan reagálsz…
  // ez értéket ad a kapcsolataidnak") — ezt a skála (Félelem / Szorongás /
  // Dependencia / Érzelmi kötődés) nem méri. Mindkét pólus két oldallal
  // íródik: mit hoz ÉS mibe kerül.
  E_high: {
    hu: "A válaszaid alapján az érzelmi érzékenység az egyik meghatározó jellemződ: hamar megérzed a helyzetek érzelmi töltetét, és a hatásuk sokáig veled maradhat. Így korán észlelheted a feszültséget, de nagyobb terhet is vihetsz magaddal, ezért különösen számít, milyen körülmények között dolgozol.",
    en: "Your responses suggest emotional sensitivity is one of your defining traits: you register the charge of a situation early, and it stays with you for a while. That brings you a lot of early information — and a lot of load, which is why the setting you work in matters.",
  },
  E_low: {
    hu: "Válaszaid kifejezett érzelmi stabilitást jeleznek. Nyomás és bizonytalanság alatt is jellemzően megőrzöd az egyensúlyodat – cserébe mások érzelmi jelzései ritkábban jutnak el hozzád, és a nyugalmadat távolságtartásnak is olvashatják.",
    en: "Your responses point to marked emotional stability. You typically keep your balance under pressure and uncertainty — in exchange, others' emotional signals reach you less often, and your calm can be read as distance.",
  },
  X_high: {
    hu: "A válaszaid erősen extravertált működésre utalnak: a kapcsolatokból és a közös helyzetekből nyersz energiát. A társas közeg lehet a természetes tereped, ahol aktívan alakítod a közös munkát.",
    en: "Your responses show a strongly extraverted pattern — you draw energy from relationships and interactions. Social space is likely your natural element, where you actively shape the dynamics.",
  },
  X_low: {
    hu: "A válaszaid introvertáltabb beállítottságra utalnak: jellemzően önállóan vagy kisebb csoportban tudsz feltöltődni. A mély fókusz és az önállóság kedvezhet a legjobb teljesítményednek.",
    en: "Your responses suggest an introverted disposition — you typically recharge through independent or small-group work. Deep focus and autonomy are where your strengths unfold.",
  },
  A_high: {
    hu: "A válaszaid együttműködő, alkalmazkodó, kapcsolatorientált működésre utalnak. A csapatkohézió és a harmónia jellemzően fontos értéked – aktívan dolgozol a jó kapcsolatok fenntartásán.",
    en: "Your responses point to a cooperative, adaptable, relationship-oriented way of working. Team cohesion and harmony tend to be important values for you — you actively work at maintaining good relationships.",
  },
  A_low: {
    hu: "A válaszaid egyenes, önálló működésre utalnak. Döntéskor jellemzően fontosabb számodra a szakmailag helyesnek tartott álláspont, mint a béke mindenáron való megőrzése; ez határozott vitapartnerként és tárgyalóként lehet előnyöd.",
    en: "Your responses point to a direct, principled, independent way of working. You tend to base decisions on truth rather than comfort — which can make for a strong opinion-leader and negotiating-partner profile.",
  },
  C_high: {
    hu: "A válaszaid szervezett, megbízható és következetes működésre utalnak. A vállalt feladatokat jellemzően gondosan végzed el, és értékeled a világos kereteket.",
    en: "Your responses point to an organized, reliable, consistent way of working — conscientiousness gives your performance a strong base. You typically execute your commitments carefully and value clear structure.",
  },
  C_low: {
    hu: "A válaszaid rugalmas, alkalmazkodó és inkább intuitív működésre utalnak. A spontán megközelítés és az improvizáció az erősséged lehet, a merev struktúra viszont jellemzően kevésbé motivál.",
    en: "Your responses point to a flexible, adaptive, more intuitive way of working. Spontaneity and improvisation may be your strengths — rigid structure typically motivates you less.",
  },
  O_high: {
    hu: "A válaszaid kíváncsi, az újdonságokra és az összetett gondolkodásra nyitott működésre utalnak. Az ismeretlen jellemzően inkább vonz, mint riaszt; az innováció, a kreativitás és a feltáró munka természetes közeged lehet.",
    en: "Your responses point to a curious way of working, open to novelty and complex thinking. The unknown typically draws you in rather than putting you off — innovation, creativity, and discovery may well be your natural domains.",
  },
  O_low: {
    hu: "A válaszaid konkrét és gyakorlatias működésre utalnak. Jellemzően a bevált megoldásokat részesíted előnyben; a stabilitás, a megbízhatóság és az ismert módszerek biztos használata az erősséged lehet.",
    en: "Your responses point to a predictable, concrete, pragmatic way of working. You tend to prefer proven solutions — stability, reliability, and familiar methods can be your strengths.",
  },
};

// ─── Solo dim summaries (Kulcs-tanulságok, ha nincs tension pár) ─────────────
// Korábban a takeaways ugyanazokat a SOLO_DIM_NARRATIVES szövegeket kapta,
// mint az „Ahogy működsz" blokk → szó szerinti duplikáció a riportban
// (javítási terv 2026-07, P1.3). Ez a készlet rövid, tanulság-műfajú:
// egy erőforrás + egy hipotézisként keretezett figyelő-pont (vakfolt-csíra).

export const SOLO_DIM_SUMMARIES: Record<string, LocalizedText> = {
  H_high: {
    hu: "Erőforrásod a kiszámíthatóság és a nyílt kommunikáció: mások gyorsan tudják, hányadán állnak veled. Figyeld meg, hogy nehezebb helyzetekben nem maradsz-e túl sokáig engedékeny ott, ahol már határt kellene húznod.",
    en: "Your asset is predictability and open communication — people quickly know where they stand with you. Worth watching: in tougher settings you may stay accommodating a beat too long where a firm boundary is needed.",
  },
  H_low: {
    hu: "Erőforrásod az ambíció és az érdekérvényesítés. Figyeld meg, hogy éles versenyben nem sérül-e a kapcsolati bizalom; ezt közösen rögzített játékszabályokkal védhetitek.",
    en: "Your asset is ambition and self-assertion. Worth watching: in sharp competition relational trust can erode — shared ground rules protect it.",
  },
  // A két E-sor SZÁNDÉKOSAN nem az „Erőforrásod…" nyitóformulát viszi,
  // amit a többi dimenzió (2026-08-11-i valencia-döntés): az Emocionalitás
  // egyik pólusa sem erőforrás-állítás, hanem jellemző. A műfaj (egy
  // megfigyelés + egy figyelő-pont) ugyanaz marad.
  E_high: {
    hu: "Jellemződ a korai ráhangolódás: hamarabb érzed meg a feszültséget, mint hogy kimondanák. Figyeld meg, hogyan változik a terhelhetőséged tartós nyomás alatt; egy bevált stresszkezelési rutin nálad alapvető támasz lehet.",
    en: "A defining trait of yours is early attunement: you register tension before it's said out loud. Worth watching: sustained pressure may drain you faster — a stress routine is core equipment for you, not an extra.",
  },
  E_low: {
    hu: "Jellemződ a nyugalom nyomás alatt. Figyeld meg, hogy mások nem élik-e meg ezt távolságtartásként; a támogató visszajelzést néha ki is kell mondanod, nem elég érezni.",
    en: "A defining trait of yours is calm under pressure. Worth watching: others may read it as distance — supportive feedback sometimes needs to be said out loud, not just felt.",
  },
  X_high: {
    hu: "Erőforrásod az energia és a társas jelenlét. Figyeld meg, hogy a csendesebb résztvevők nem szorulnak-e háttérbe melletted; érdemes tudatosan teret nyitnod nekik.",
    en: "Your asset is energy and social presence. Worth watching: quieter voices can fade around you — opening space for them takes intention.",
  },
  X_low: {
    hu: "Erőforrásod a mély fókusz és az önállóság. Figyeld meg, hogy a kisebb láthatóság miatt nem maradnak-e észrevétlenek az eredményeid; néha neked kell láthatóvá tenned őket.",
    en: "Your asset is deep focus and autonomy. Worth watching: low visibility can lead to being undervalued — results sometimes need a voice.",
  },
  A_high: {
    hu: "Erőforrásod a harmónia és az összetartás építése. Figyeld meg, hogy nem halogatod-e a nehéz beszélgetéseket: ez hosszabb távon többe kerülhet, mint maga a konfliktus.",
    en: "Your asset is building harmony and cohesion. Worth watching: postponing hard confrontations can cost more over time than the conflict itself.",
  },
  A_low: {
    hu: "Erőforrásod az egyenesség és a vitakészség. Figyeld meg, hogy az éles reakciók nem csökkentik-e a biztonságérzetet körülötted; a válasz előtti rövid szünet gyakran többet segít.",
    en: "Your asset is directness and willingness to debate. Worth watching: sharp reactions can reduce the sense of safety around you — slowing the tempo often gains more.",
  },
  C_high: {
    hu: "Erőforrásod a megbízható végrehajtás. Figyeld meg, hogy a struktúra iránti igény nem fordul-e rugalmatlanságba, amikor a helyzet gyorsabban változik, mint a terv.",
    en: "Your asset is dependable execution. Worth watching: the need for structure can turn rigid when the terrain changes faster than the plan.",
  },
  C_low: {
    hu: "Erőforrásod az improvizáció és az alkalmazkodóképesség. Figyeld meg, hogy nem csúsznak-e könnyebben a részletek és a határidők; egy külső rendszer vagy egy rendezettebben dolgozó társ sokat segíthet.",
    en: "Your asset is improvisation and adaptivity. Worth watching: details and deadlines slip more easily — external structure (a system or a partner) helps a lot.",
  },
  O_high: {
    hu: "Erőforrásod a kíváncsiság és az újító gondolkodás. Figyeld meg, hogy az új ötletek vonzereje nem tereli-e el a figyelmedet a befejezésről; a lezárás tudatosságot igényelhet.",
    en: "Your asset is curiosity and inventive thinking. Worth watching: the pull of new ideas can draw focus away from finishing — closure takes intention.",
  },
  O_low: {
    hu: "Erőforrásod a stabilitás és a bevált módszerek ismerete. Figyeld meg, hogy gyors változás idején nem lassít-e a megszokotthoz való ragaszkodás; kis, biztonságos kísérletek segíthetnek.",
    en: "Your asset is stability and command of proven methods. Worth watching: in fast change, sticking to the familiar can slow you down — small, safe experiments help.",
  },
};

// ─── Solo dim pressure/blind-spot texts (P2.1, P3.1-ben strukturálva) ────────
// Nyomás alatti működés + vakfolt, HIPOTÉZISKÉNT keretezve („hajlamos
// lehetsz", „vakfolt lehet") — a top-2 solo dimenzióból épül. A stress és
// blindspot KÜLÖN mező, hogy a részletes kártya ÉS az executive summary
// oldal is a saját formájában használhassa (parszolás nélkül).

export type PressureText = { stress: string; blindspot: string };

export const PRESSURE_BLINDSPOT_PREFIX: LocalizedText = {
  hu: "Vakfolt lehet:",
  en: "Possible blind spot:",
};

export const SOLO_DIM_PRESSURE: Record<string, Record<Locale, PressureText>> = {
  H_high: {
    hu: {
      stress: "Nyomás alatt még szigorúbban ragaszkodhatsz az elvekhez, és nehezebben köthetsz gyakorlati kompromisszumot.",
      blindspot: "Mások rugalmasabb megoldásait elvtelenségként olvashatod, pedig gyakran csak más a prioritásuk.",
    },
    en: {
      stress: "Under pressure you may hold to principles even more rigidly and find practical compromise harder.",
      blindspot: "You may read others' more flexible solutions as unprincipled, when they often just weigh priorities differently.",
    },
  },
  H_low: {
    hu: {
      stress: "Nyomás alatt felerősödhet az eredményközpontúságod, és könnyebben kicsúszhatnak a látóteredből a kapcsolati következmények.",
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
      blindspot: "Mások problémáit is a válladra veszed, és ez kívülről sokáig nem látszik.",
    },
    en: {
      stress: "Under pressure emotional load compounds quickly: tension may show up as poor sleep, delayed decisions, or overdrive.",
      blindspot: "You may carry others' problems as well — often invisible from the outside for a long time.",
    },
  },
  E_low: {
    hu: {
      stress: "Nyomás alatt a nyugalmad stabil marad, de a kommunikációd tömörebbé, tárgyszerűbbé válhat.",
      blindspot: "A körülötted lévők ilyenkor több megnyugtatást igényelnének, mint amennyit magadtól adnál.",
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
      blindspot: "A felgyülemlett, ki nem mondott feszültség később váratlan helyen jön elő.",
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
      blindspot: "A tökéletesítés eltolhatja a lezárást akkor is, amikor a megoldás már megfelelő lenne.",
    },
    en: {
      stress: "Under pressure the need for control can grow: more checking, harder delegation, stiffer plans.",
      blindspot: "Polishing often comes at the cost of 'good enough, on time'.",
    },
  },
  C_low: {
    hu: {
      stress: "Nyomás alatt még nehezebbé válhat a rendezettség megtartása: a határidők és a részletek könnyebben csúszhatnak.",
      blindspot: "A környezeted megbízhatósági problémának láthatja azt, ami számodra csupán fontossági sorrend kérdése.",
    },
    en: {
      stress: "Under pressure holding structure gets even harder: deadlines and details slip more easily.",
      blindspot: "Others may read as a reliability issue what is, for you, a matter of priorities.",
    },
  },
  O_high: {
    hu: {
      stress: "Nyomás alatt vonzó menekülőút lehet egy új ötlet vagy irányváltás a nehéz végrehajtás helyett.",
      blindspot: "A gyakori irányváltás bizonytalanságot kelthet a csapatban.",
    },
    en: {
      stress: "Under pressure a new idea or pivot can become an appealing escape from hard execution.",
      blindspot: "For the team, frequent pivots can land as instability.",
    },
  },
  O_low: {
    hu: {
      stress: "Nyomás alatt a bevált módszerekhez való ragaszkodás felerősödhet — akkor is, ha a helyzet újfajta választ kívánna.",
      blindspot: "A „mindig így csináltuk” biztonsága lassú reakciót adhat gyors változásban.",
    },
    en: {
      stress: "Under pressure reliance on proven methods can intensify — even when the situation calls for a new kind of answer.",
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
    hu: "Az értékőr ritkán a leghangosabb ember a szobában — inkább az, akiben a többiek ösztönösen megbíznak. Számára a nyílt lapok és a kapcsolatok minősége többet ér, mint a gyors győzelem.",
    en: "The Value Guardian is rarely the loudest person in the room — more often the one others instinctively trust. Open cards and the quality of relationships matter more to them than a quick win.",
  },
  // 2026-08-11, valencia-revízió: a MEGFIGYELÉS marad (korán észreveszi a
  // feszültséget), a CÍMKE („empata") és az erény-keretezés megy — az
  // Emocionalitás facetjei (Félelem/Szorongás/Dependencia/Érzelmi kötődés)
  // nem empátiát mérnek. A második mondat ezért az árát is kimondja, nem
  // erényt tulajdonít.
  E: {
    hu: "A Ráhangolódó gyakran előbb észleli a feszültséget, mint hogy bárki kimondaná. Ez sok információt adhat, de terhet is jelenthet: a környezet feszültsége nála is tovább maradhat.",
    en: "The Signal Reader notices tension before anyone says it out loud. That yields a lot of information — and a lot of load: what's in the room stays with them too.",
  },
  X: {
    hu: "A Hajtóerő körül gyorsan mozgásba lendülnek a dolgok. Az energiája átragadhat másokra is, a csapat pedig gyakran az ő tempójához igazodik.",
    en: "The Driving Force is the person things start moving around: where they are, there is tempo. Their energy is contagious — teams often take their rhythm from them.",
  },
  A: {
    hu: "A hídépítő ott dolgozik, ahol mások falakat látnak: emberek és álláspontok között. Ritkán övé a színpad — de nélküle sok megállapodás létre sem jönne.",
    en: "The Bridge-Builder works where others see walls: between people and positions. The stage is rarely theirs — but without them many agreements would never happen.",
  },
  C: {
    hu: "A Rendszerépítő mellett a dolgok nem vesznek el: elkészülnek. Ahol ő dolgozik, ott a káoszból folyamat, a folyamatból pedig eredmény lesz.",
    en: "The Architect is the one with whom things don't get lost — they get done. Where they work, chaos becomes process, and process becomes results.",
  },
  O: {
    hu: "Az újító az, aki a „miért így csináljuk?” kérdést akkor is felteszi, amikor mindenki más már megszokta. A lehetőségeket hamarabb látja meg, mint a korlátokat.",
    en: "The Innovator keeps asking 'why do we do it this way?' long after everyone else stopped. They see possibilities sooner than limits.",
  },
};

export const ARCHETYPE_STORY_ADJ: Record<string, LocalizedText> = {
  H: {
    hu: "Ezt nálad jellemzően erős belső iránytű egészíti ki: a célhoz vezető út legalább annyira számít, mint maga az eredmény.",
    en: "In you this is typically paired with a strong inner compass: the how matters as much as the how much.",
  },
  // A korábbi „érzed is, mi történik a másikkal" burkolt empátia-állítás volt
  // (a skála nem mér mások-olvasási pontosságot) — a helyére a saját
  // oldalról leírt ráhangolódás került, az árával együtt.
  E: {
    hu: "Ezt nálad jellemzően erős érzelmi ráhangolódás színezi: a helyzetek érzelmi töltete könnyen hat rád, és a hatása később is veled maradhat egy ideig.",
    en: "In you this is typically coloured by strong emotional attunement: the charge of a situation doesn't pass you by — and it stays with you for a while afterwards.",
  },
  X: {
    hu: "Ehhez nálad jellemzően lendület társul: nemcsak képviseled, amit fontosnak tartasz, hanem energiát is adsz a megvalósításához.",
    en: "In you this typically comes with momentum: you don't just stand for what matters — you energise it.",
  },
  A: {
    hu: "Ezt nálad jellemzően türelmes, együttműködő stílus egészíti ki: a közös nevező megtalálása nem engedmény, hanem módszer.",
    en: "In you this is typically paired with a patient, collaborative style: finding common ground isn't a concession, it's a method.",
  },
  C: {
    hu: "Ehhez nálad jellemzően módszeresség társul: amit elkezdesz, annak szerkezete és vége is van.",
    en: "In you this typically comes with method: what you start has structure — and an ending.",
  },
  O: {
    hu: "Ezt nálad jellemzően kísérletező szemlélet színezi: a bevált megoldások mellett rendre felteszed a „mi lenne, ha?” kérdést.",
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
// „Csapatban működve" oldal tartalma — dimenzió-szintű, nem archetípus-
// mátrix (terv: docs/product/riport-egyuttmukodes-fejezet-terv.md).
// A súrlódás-logika a team-stats FRICTION_WEIGHTS modelljének egyszemélyes
// vetülete (C > A > H a legerősebb súrlódás-jóslók). Hangnem:
// hipotézis + puha ajánlás („sokat segíthet, ha…"), nem előírás.

/** Kivel/milyen működés mellett erősödsz — a top-2 markáns dimenzióból. */
export const COLLAB_CLICK: Record<string, LocalizedText> = {
  H_high: {
    hu: "Azokkal dolgozol a legtermészetesebben, akik kimondják, amit gondolnak, és tartják, amit vállalnak. A nyílt együttműködésből gyorsan kölcsönös bizalom épülhet. Erősen taktikázó kollégák mellett viszont sok energiád mehet el a szándékaik megfejtésére.",
    en: "You're in your element alongside people who say what they think and honour what they commit to — collaboration played with open cards quickly becomes mutual trust. Next to highly tactical operators, much of your energy goes into second-guessing motives.",
  },
  H_low: {
    hu: "Jól működhetsz ambiciózus, eredményre törekvő kollégákkal: a közös célok és a gyors tempó könnyen összehangolnak benneteket. Egy elvhűbb társ jó ellensúly lehet: ő a hosszú távú bizalomra figyel, miközben te gyorsan felismered a lehetőségeket.",
    en: "You click with ambitious, results-driven colleagues — shared targets and fast tempo connect you. A more principled partner can be a good counterweight: they hold long-term trust while you jump on opportunities.",
  },
  E_high: {
    hu: "Azokkal dolgozhatsz a legtermészetesebben, akik odafigyelnek a másikra. Ahol az emberi jelzéseknek helye van, ott a ráhangolódásod erőforrás lehet. Egy nyugodtabb, stabilabb társ jól kiegészíthet: ő segít megtartani az irányt, te pedig korán észleled a kapcsolati feszültségeket.",
    en: "You work naturally alongside people who pay attention to others: where human signals matter, your attunement is an asset. A calmer, steadier partner complements you well — they provide the anchor, you the relational radar.",
  },
  E_low: {
    hu: "Krízisben és nyomás alatt a nyugalmad másokra is átragadhat. A hasonlóan higgadt kollégákkal gyors, tárgyszerű munkakapcsolatot alakíthatsz ki. Az érzelmi jelzésekre érzékenyebb társak pedig olyan változásokat is korán észrevehetnek, amelyek neked kevésbé feltűnőek.",
    en: "In crisis and under pressure you're the one others calm down next to — with similarly composed colleagues you build fast, matter-of-fact working relationships. More emotionally attuned partners bring what you surface less often: early human signals.",
  },
  X_high: {
    hu: "Ott vagy elemedben, ahol élénk a közös munka: műhelyekben, gyors egyeztetéseken és közös munkaterekben. A csendesebb, elmélyülten dolgozó kollégák jól kiegészíthetnek: ők viszik a hosszan tartó figyelmet igénylő feladatokat, te pedig lendületet adhatsz a csapatnak és fenntarthatod a kapcsolatokat.",
    en: "You're in your element where collaboration has tempo: workshops, quick alignments, shared spaces. Quieter, deep-focus colleagues pair well with you — they carry the long-concentration threads while you keep momentum and connections.",
  },
  X_low: {
    hu: "Azokkal dolgozhatsz jól, akikkel ritkábbak, de tartalmasak az egyeztetések, és akik önállóan, írásban is hatékonyan működnek. Egy társasabb partner jól kiegészíthet: ő tarthatja a kapcsolatot a szervezet többi részével, te pedig az elmélyült munkát viheted.",
    en: "Your best pairings are people with whom alignment is infrequent but substantive — colleagues who work well in writing and independently. A more social partner complements you: they maintain organisation-facing connections, you bring the depth.",
  },
  A_high: {
    hu: "Jellemzően sokféle munkastílushoz tudsz alkalmazkodni, és nehezebb természetű kollégákkal is megtalálhatod a közös hangot. Az egyenes, gyorsan döntő társak különösen jól kiegészíthetnek: ők határozottságot, te együttműködő megközelítést hozol.",
    en: "You're the one work keeps functioning next to, even with difficult people — you fit most styles. You grow strongest alongside direct, decision-quick partners: they bring the edge, you bring the bridge.",
  },
  A_low: {
    hu: "Jól működhetsz azokkal, akik bírják az egyenes vitát, és nem veszik személyes támadásnak a kemény kérdéseket. Velük a vita tisztázhatja a helyzetet anélkül, hogy tartósan megterhelné a kapcsolatot. A diplomatikusabb kollégák ott egészíthetnek ki, ahol a kapcsolat ápolása maga a feladat.",
    en: "You work well with people who can take a straight debate and don't bruise from hard questions — with them the air is clearer after an argument, not heavier. More diplomatic colleagues complement you where maintaining the relationship is itself the job.",
  },
  C_high: {
    hu: "Jól működsz azok mellett, akik tartják, amit vállalnak: a rendezetten dolgozó, határidőket betartó kollégákkal gyorsan kialakulhat a kölcsönös bizalom. Egy improvizatívabb társ is jól kiegészíthet: ő hozza a váratlan ötleteket, te a következetes megvalósítást, ha a szerepek világosak.",
    en: "You work well alongside people who keep their commitments: with structured, deadline-honouring colleagues mutual trust forms quickly. An improvisational partner also does you good — they bring the twist, you bring the follow-through, as long as roles are explicit.",
  },
  C_low: {
    hu: "Rugalmas, menet közben alakuló munkában lehetsz jó társ, és a hasonlóan alkalmazkodó kollégákkal könnyen megtalálhatjátok a közös ritmust. Egy rendszerezettebb partner jól kiegészíthet: ő összefogja a részleteket, te pedig mozgékonyságot hozol.",
    en: "You're a good partner in flexible, evolving work — with similarly adaptive colleagues you find rhythm easily. A more systematic partner adds a lot: they hold the threads, you bring the agility.",
  },
  O_high: {
    hu: "Kíváncsi, gondolkodni szerető emberekkel könnyen lendületet kap nálad a közös munka: a tartalmas vita nem konfliktus, hanem ösztönző erő. A gyakorlatiasabb társak pedig abban segíthetnek, hogy az ötletekből megvalósítható megoldások szülessenek.",
    en: "Collaboration ignites for you with curious people who like to think — a good debate is fuel for you, not conflict. More pragmatic partners add what ideas alone don't: the landing.",
  },
  O_low: {
    hu: "A kiszámíthatóan, bevált módon dolgozó kollégákkal vagy a legjobb párban — közös nyelvetek a megbízhatóság. Az újító típusok mellett is jól működsz, ha te lehetsz az, aki a jó ötletet stabil gyakorlattá alakítja.",
    en: "You pair best with colleagues who work predictably, in proven ways — reliability is your shared language. You also work well next to innovators, when you can be the one who turns a good idea into stable practice.",
  },
};

/** Hol éleződhet — kétirányú megfogalmazás + egy oldó fél mondat. */
export const COLLAB_FRICTION: Record<string, LocalizedText> = {
  C_high: {
    hu: "A legvalószínűbb súrlódásod a tempó és a minőség körül van: a lazábban tervező kollégák munkáját megbízhatatlannak érezheted, ők pedig merevnek a rendhez való ragaszkodásod. Sokat segíthet, ha nem a módszert kéred számon, hanem közösen rögzített határidőt és minőségi minimumot.",
    en: "Your most likely friction is around tempo and quality: looser planners can feel unreliable to you, while your hold on order can feel rigid to them. It defuses a lot to agree on shared deadlines and a quality minimum, rather than policing the method.",
  },
  C_low: {
    hu: "Súrlódás ott keletkezhet, ahol a struktúra maga az elvárás: a rendszerezett kollégáknak a csúszó részletek bizalmi kérdéssé válhatnak, számodra az ő folyamataik fölösleges féknek tűnhetnek. Segíthet egy közös, minimális keret — kevés, de tényleg tartott vállalás.",
    en: "Friction can arise where structure itself is the expectation: to systematic colleagues slipping details can become a trust issue, while their processes can feel like needless brakes to you. A shared minimal frame helps — few commitments, but truly kept.",
  },
  A_high: {
    hu: "A súrlódás nálad könnyen rejtve maradhat: kerülöd az éles vitát, miközben a ki nem mondott feszültség felgyűlik, és a versengőbb kollégák nagyobb teret kaphatnak a döntésekben. Segíthet, ha már az egyeztetés elején jelzed: „Mielőtt döntünk, szeretném elmondani az ellenvetésemet.”",
    en: "Your friction is often invisible: you avoid sharp debate, but unspoken tension accumulates, and more competitive colleagues may dominate decisions. Many find it helps to request a turn in advance: 'before we decide, let me state my objection'.",
  },
  A_low: {
    hu: "Gyakori súrlódási pont lehet a stílus: az egyenes, gyors visszajelzéseidet a harmóniára törekvő kollégák élesnek érezhetik, te pedig az ő óvatosságukat időhúzásnak. Sokat oldhat, ha a vita elején elhangzik: a kritika a munkának szól, nem a személynek.",
    en: "Your most common friction point is style: harmony-oriented colleagues can read your direct, fast feedback as sharp, while their circling can feel like stalling to you. It defuses a lot when the debate opens with: the critique is about the work, not the person.",
  },
  H_high: {
    hu: "Súrlódás ott keletkezhet, ahol a taktikázás a megszokott: egy ilyen közegben az egyenességed sebezhetővé tehet, te pedig gyanakvóvá válhatsz azokkal szemben is, akik csupán rugalmasabban érvényesítik az érdekeiket. Segít különválasztani a kettőt: nem minden érdekérvényesítés manipuláció.",
    en: "Friction can arise where games are the norm: in tactical settings your fairness can look exploitable, and you may grow suspicious of people who simply navigate more flexibly. It helps to distinguish: not all self-advocacy is manipulation.",
  },
  H_low: {
    hu: "A versengő működésed a bizalomra érzékeny kollégáknál válthat ki súrlódást: amit te egészséges küzdelemnek élsz meg, ők átgázolásként értelmezhetik. Sokat számít, ha a kisebb helyzetekben is egyértelműen korrekt maradsz; ez alapozza meg a bizalmat a nagyobb téttel járó döntésekhez.",
    en: "Your competitive style can create friction with trust-sensitive colleagues: what you experience as healthy contest, they may read as steamrolling. Visible fairness in small things matters a lot — it keeps allies for the big moments.",
  },
  E_high: {
    hu: "Feszültség ott keletkezhet, ahol a tárgyszerű, gyors működés a megszokott: a hűvösebb stílusú kollégák visszajelzéseinek hiánya bizonytalanságot kelthet benned, ők pedig nem feltétlenül értik, mi hiányzik. Sokat segít, ha rövid, rendszeres visszajelzéseket kérsz.",
    en: "Tension can arise where brisk, matter-of-fact operation is the norm: cooler colleagues' lack of feedback can breed uncertainty in you, while they don't see what's missing. It helps when the need takes concrete form: short, regular feedback moments.",
  },
  E_low: {
    hu: "Az érzelmileg intenzívebb kollégáknak a nyugalmad távolságtartásnak tűnhet, az ő reakcióik pedig számodra túlzónak hathatnak. A vita tárgya ilyenkor gyakran nem maga a tartalom, hanem az eltérő érzelmi intenzitás; segít, ha ezt ki is mondjátok.",
    en: "To more emotionally intense colleagues your calm can read as distance, while their reactions can look like overreaction to you. The dispute is rarely the content itself — more often the intensity gap; naming that helps.",
  },
  X_high: {
    hu: "A csendesebb kollégákkal kialakuló súrlódás ritkán látványos: könnyen kivonódhatnak a beszélgetésből, ha minden gyorsan és szóban történik. Sokat segít, ha nem kell mindenkinek azonnal szóban reagálnia, és írásban is van lehetőség hozzászólni.",
    en: "Your friction next to quieter colleagues is rarely loud: they simply disengage when everything happens verbally and fast. Asynchronous space helps a lot — when input can come in writing, their best thinking arrives too.",
  },
  X_low: {
    hu: "A pörgős, sok megbeszélésre épülő közeg könnyen lemeríthet, a társasabb kollégáknak viszont távolságtartásnak tűnhet a visszahúzódásod. Segíthet egy világos működési megállapodás arról, mikor vagy elérhető személyesen, és mit intéztek inkább írásban.",
    en: "A fast, meeting-driven environment drains you, while to more social colleagues your withdrawal can look like distance. An explicit working agreement can help: when you're available live, and what goes in writing.",
  },
  O_high: {
    hu: "A pragmatikus végrehajtókkal ott súrlódhatsz, ahol az ötleteid az ő stabil folyamataikat borítják — számukra a gyakori irányváltás kockázat, számodra az állandóság stagnálás. Segít a kettéválasztás: kísérleti sáv az újnak, védett sáv a működőnek.",
    en: "You may grate against pragmatic executors where your ideas upset their stable processes — to them frequent pivots are risk, to you constancy is stagnation. Separating lanes helps: an experimental track for the new, a protected track for what works.",
  },
  O_low: {
    hu: "Az újító kollégák tempója ellenállást válthat ki nálad — te a bizonyítottat véded, ők a lehetőséget. A súrlódás akkor csökken, ha a „miért váltsunk?” kérdésre valódi választ kapsz, nem lelkesedést.",
    en: "The tempo of innovator colleagues can trigger resistance in you — you defend the proven, they the possible. Friction drops when 'why change?' gets a real answer, not just enthusiasm.",
  },
};

/** Pszichológiai biztonság + vezetői közeg — puha framinggel („sokat segíthet, ha…"). */
export const COLLAB_NEEDS: Record<string, LocalizedText> = {
  H_high: {
    hu: "Akkor hozod a legjobb formádat, ha a kimondott értékek és a napi gyakorlat összhangban vannak. Ha erősen törekszel a tisztességes, elvhű működésre, sokat segíthet, ha a vezetőd átláthatóan dönt, és a kényes ügyek nem informális alkukban dőlnek el.",
    en: "You're at your best where stated values and daily practice match. For many with integrity this strong, it helps when their leader decides transparently and sensitive matters aren't settled in the corridor.",
  },
  H_low: {
    hu: "Neked az egyértelmű célok és a valódi tét adják a hajtóerőt. Sokat segíthet egy olyan vezető, aki világos játékteret jelöl ki — mit szabad, hol a határ —, és az eredményt ismeri el, nem a látszatot.",
    en: "Clear goals and real stakes are what drive you. A leader who marks out the playing field — what's allowed, where the line is — and recognises results over appearances can help a lot.",
  },
  E_high: {
    hu: "Akkor hozod a legjobb formádat, ha a hibázás nem jár megszégyenítéssel: a biztonságos, kiszámítható légkör számodra nem puszta kényelmi szempont, hanem a jó teljesítmény egyik feltétele. Hasonló profillal sokaknak beválnak a rendszeres, rövid visszajelzések, nyomás alatt is.",
    en: "You're at your best when mistakes don't come with shaming: a safe, predictable climate isn't comfort for you, it's a performance condition. For many with a similar profile, regular short feedback moments work best — even under pressure.",
  },
  E_low: {
    hu: "Neked a bizalom jele az önállóság: akkor működsz jól, ha nem kell folyamatos érzelmi visszaigazolást adnod vagy kapnod. Sokat segíthet, ha a környezeted tudja: a nyugalmad nem közöny — így nem olvassák félre.",
    en: "For you, autonomy is the signal of trust: you work well when constant emotional reassurance isn't required in either direction. It helps when those around you know your calm isn't indifference — so it doesn't get misread.",
  },
  X_high: {
    hu: "A közös munka ad energiát: akkor vagy a legjobb formádban, ha van élő együttműködés, látható szerep és gyors visszajelzés. Hasonló profillal sokaknak segít, ha a vezetőjük teret ad a szereplésre, miközben a csendben végzett munkát is elismeri.",
    en: "Your energy comes from shared space: you thrive with live collaboration, a visible role, and fast feedback. For many with this profile it helps when their leader gives stage room — while also recognising quiet work, not just the loud kind.",
  },
  X_low: {
    hu: "A mély fókusz a természetes üzemmódod: akkor teljesítesz jól, ha vannak megszakításmentes időszakaid, és nem a folyamatos jelenlét, hanem az eredmény számít. Sokat segíthet, ha kisebb társas terheléssel is láthatóvá teheted a munkádat, például írásos összefoglalóval.",
    en: "Deep focus is your operating mode: you perform when you have uninterrupted stretches and results count over presence. It helps when visibility comes in low-threshold forms — a written summary, not a stage.",
  },
  A_high: {
    hu: "Akkor vagy elemedben, ha az együttműködés nem állandó küzdelem: a kollegiális, egymást segítő közeg erősítheti a teljesítményedet. Hasonló profillal sokaknak segít, ha a vezetőjük észreveszi a csendes engedményeket, és nem hagyja, hogy mindig ugyanaz az ember engedjen.",
    en: "You're in your element where collaboration isn't combat: a collegial, mutually supportive setting multiplies you. For many with this profile it helps when their leader notices the quiet concessions — and doesn't let the same person always be the one to yield.",
  },
  A_low: {
    hu: "Számodra természetes az őszinte vita: ott működsz jól, ahol az ellentmondást nem tekintik támadásnak. Sokat segíthet egy olyan közeg, ahol a döntési szabályok tiszták, így az éles vita a döntéssel le is zárulhat.",
    en: "Honest debate is your normal mode: you work well where disagreement isn't sacrilege. A setting with clear decision rules helps a lot — so a sharp debate can actually close at the decision.",
  },
  C_high: {
    hu: "Akkor hozod a legjobb formádat, ha a célok, felelősségek és határidők világosak: a bizonytalanság számodra nem szabadság, hanem kockázat. Hasonló profillal sokaknak az válik be, ha a változások okait is megértik, és nem csupán kész tényekkel szembesülnek.",
    en: "You deliver your best when goals, responsibilities, and deadlines are explicit — ambiguity isn't freedom to you, it's risk. For many with this profile, changes land best with reasoning attached, not as fait accompli.",
  },
  C_low: {
    hu: "A jó teljesítményedhez mozgástérre van szükséged: a mikromenedzsment gyorsan kimeríthet. Sokat segíthet, ha az elvárt eredményt közösen rögzítitek, a megvalósítás módját viszont rád bízzák.",
    en: "Room to manoeuvre is your performance condition: you wear down fast under micromanagement. It helps when expectations are fixed at the outcome level — leaving the how with you.",
  },
  O_high: {
    hu: "Akkor vagy a legjobb formádban, ha van mit tanulni és alakítani: a tartósan változatlan működés könnyen lemeríthet. Hasonló profillal sokaknak segít, ha a szerepükben van egy kisebb, de valódi és védett tér a kísérletezésre.",
    en: "You thrive when there's something to learn and something to shape: frozen routines are slow burnout for you. For many with this profile it helps to have a protected experimental lane in the role — small, but real.",
  },
  O_low: {
    hu: "A stabil alapok adnak biztonságot: akkor teljesítesz jól, ha a változást átgondoltan, nem hirtelen vezetik be. Sokat segíthet a fokozatosság, vagyis ha van időd begyakorolni az újat, mielőtt megérkezik a következő változás.",
    en: "Stable foundations are your safety: you perform when change is introduced deliberately, not abruptly. It helps when novelty arrives in steps — time to consolidate before the next wave.",
  },
};

/** Kiegyensúlyozott profil — nincs pólusos dimenzió. */
export const COLLAB_BALANCED_CLICK: LocalizedText = {
  hu: "Kiegyensúlyozott profillal jellemzően többféle működésmód mellett megtalálod a ritmust. Az, hogy kivel dolgozol jól, nálad kevésbé a személyiségkülönbségeken, inkább a szerepek és a közös célok tisztaságán múlhat.",
  en: "With a balanced profile you typically find rhythm next to many working styles — your fit depends less on personality and more on role and goals.",
};

export const COLLAB_BALANCED_FRICTION: LocalizedText = {
  hu: "Nálad ritkán a személyiség a súrlódás fő forrása, mert a profilod egyik irányban sem szélsőséges. Ha mégis feszültség keletkezik, érdemes először a szerepek és az elvárások tisztaságát megvizsgálni: az ok gyakran ezek körül keresendő.",
  en: "Personality is rarely the main source of friction for you — your profile isn't extreme in any direction. When tension does arise, look first at role and expectation clarity: for profiles like yours, that's usually where the root is.",
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
      reflection: "Hol húztad meg utoljára a határt egy éles helyzetben — és utólag megérte?",
      challenge: "Egy hónapon át jegyezd fel, hány helyzetben tartottad meg a saját határodat. A cél nem a tökéletesség, hanem az, hogy lásd a mintát.",
    },
    en: {
      behavior: "Before your next competitive situation, write down the line you won't cross. One sentence is enough.",
      reflection: "Where did you last draw the line in a heated situation — and was it worth it in hindsight?",
      challenge: "For one month, track how often you held your own line. The goal isn't perfection — it's seeing the pattern.",
    },
  },
  // A E-sor a valencia-kapun (score-valence.deficitSlotEligible,
  // workstyle-content growth-választó) NEM érhető el: az alacsony
  // Emocionalitás nem fejlesztendő hiány. A sor a térkép teljessége miatt
  // marad, és szándékosan viselkedés-javaslat („mondd ki"), nem
  // jellem-ítélet — ha egy jövőbeli felület mégis feloldja, ne hiányt
  // állítson.
  E: {
    hu: {
      behavior: "Zárj le hetente egy beszélgetést egy kimondott elismeréssel („örülök, hogy…”, „köszönöm, hogy…”).",
      reflection: "Kinek jelezted vissza utoljára, hogy számít neked a munkája?",
      challenge: "Két héten át heti egy kimondott elismerés — és figyeld meg, változik-e, ahogyan hozzád fordulnak.",
    },
    en: {
      behavior: "Once a week, close a conversation with an explicit acknowledgement (\"I'm glad that…\", \"thank you for…\").",
      reflection: "Who did you last tell that their work matters to you?",
      challenge: "One spoken acknowledgement per week for two weeks — and notice whether the way people approach you changes.",
    },
  },
  X: {
    hu: {
      behavior: "Vállalj havonta egy rövid alkalmat, amikor láthatóvá teszed a munkádat: tarts bemutatót, készíts csapatösszefoglalót vagy írj helyzetjelentést. A formát te választod.",
      reflection: "Mi az a munkád, amiről a csapat nem is tud, pedig büszke vagy rá?",
      challenge: "A következő hónapban egyszer mutasd be a munkádat öt percben, és figyeld meg, hány kérdést vagy visszajelzést kapsz.",
    },
    en: {
      behavior: "Take on one small visibility moment per month: a short demo, a team recap, or a written status — you choose the format.",
      reflection: "What work are you proud of that your team doesn't even know about?",
      challenge: "Once next month, show your work in 5 minutes — and count the feedback and questions it brings.",
    },
  },
  A: {
    hu: {
      behavior: "Éles vita előtt kérj egy napot, és írd le előre a másik fél legjobb érvét.",
      reflection: "Legutóbb mikor derült ki, hogy a másik fél érve jobb volt, mint az első reakciód?",
      challenge: "A következő éles vitában előbb foglald össze a másik álláspontját, és kérdezd meg, pontos volt-e — csak utána érvelj.",
    },
    en: {
      behavior: "Before a heated debate, ask for a day and write down the other side's best argument first.",
      reflection: "When did it last turn out that the other side's argument was better than your first reaction?",
      challenge: "In your next sharp debate, summarise the other position first and ask if you got it right — argue only after.",
    },
  },
  C: {
    hu: {
      behavior: "Válassz egyetlen visszatérő bosszúságot (például a csúszó határidőket), és építs rá egy egyszerű rendszert: heti 15 perc tervezést vagy egy közös ellenőrzőlistát.",
      reflection: "Melyik elmaradt részlet okozta a legtöbb utómunkát az elmúlt hónapban?",
      challenge: "Két hétig tartsd meg a heti 15 perces tervezési időt, majd nézd meg, hány vállalás csúszott a korábbi időszakhoz képest.",
    },
    en: {
      behavior: "Pick one recurring annoyance (e.g. slipping deadlines) and build a minimal system around it: 15 minutes of weekly planning or a shared checklist.",
      reflection: "Which missed detail caused the most rework last month?",
      challenge: "Keep the 15-minute weekly planning slot for two weeks — then compare how many commitments slipped versus before.",
    },
  },
  O: {
    hu: {
      behavior: "Próbálj ki havonta egy alacsony tétű feladatban egy módszert vagy eszközt, amihez nincs kész recepted.",
      reflection: "Mikor hozott utoljára egy új megközelítés jobb eredményt nálad, mint a bevált út?",
      challenge: "Egy hónapon belül vigyél végig egy kis feladatot új módszerrel — és írd fel, mit adott és mibe került.",
    },
    en: {
      behavior: "Once a month, try a method or tool you have no ready recipe for, on a low-stakes task.",
      reflection: "When did a new approach last get you a better result than the proven route?",
      challenge: "Within a month, take one small task through a new method — and note what it gained and what it cost.",
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
    hu: "A Becsületesség–Alázat dimenzión elért magas pontszámod arra utal, hogy hosszú távon olyan közegben érezheted jól magad, ahol a kimondott értékek és a napi gyakorlat összhangban vannak.",
    en: "Your high integrity adds a nuance: long term, you stay in settings where stated values and daily practice actually match.",
  },
  H_low: {
    hu: "Az erős eredményközpontúságod miatt jól illeszkedhet hozzád egy versengő, mérhető célokkal dolgozó közeg; a kizárólag konszenzusra épülő kultúra lassúnak tűnhet.",
    en: "Your strong results-orientation calls for a competitive, target-driven setting alongside this — purely consensus-based cultures may feel slow.",
  },
  E_high: {
    hu: "Az erős érzelmi érzékenységed miatt emberközeli, támogató kultúrára lehet szükséged; egy pusztán feladat- és teljesítményközpontú közegben hamarabb kimerülhetsz.",
    en: "Your high emotionality needs a people-centred, supportive culture alongside this — in purely transactional settings you wear down faster.",
  },
  E_low: {
    hu: "Az érzelmi stabilitásod miatt az adott szerep nagyobb téttel és nyomással járó változatai is jól illeszkedhetnek hozzád.",
    en: "Thanks to your emotional stability, high-stakes, high-pressure variants of these roles can also work well for you.",
  },
  X_high: {
    hu: "A magas társas energiád miatt inkább a látható, sok emberi kapcsolódással járó szerepváltozatok illenek hozzád; a hosszan tartó, elszigetelt munka kevésbé tölt fel.",
    en: "Your high extraversion tilts this toward visible, people-facing variants — long isolated work feeds you less.",
  },
  X_low: {
    hu: "Az alacsonyabb társas energia miatt jobban illenek hozzád az elmélyült, önálló munkát engedő szerepváltozatok, mint azok, amelyek folyamatos nyilvános jelenlétet kívánnak.",
    en: "With lower extraversion, variants that allow deep, independent focus fit better than constant representation.",
  },
  A_high: {
    hu: "A Barátságosság dimenzión elért magas pontszámod alapján inkább az együttműködésre épülő, sok egyeztetéssel járó szerepváltozatok illeszkedhetnek hozzád.",
    en: "Your strong agreeableness tilts this toward collaboration-heavy, coordination-rich variants.",
  },
  A_low: {
    hu: "Az egyenes, konfrontációt is vállaló stílusod ott lehet érték, ahol vitatkozni és dönteni kell; harmóniaközpontú közegben viszont súrlódást okozhat.",
    en: "Your direct, confrontation-ready style is an asset where debate and decisions are the job — it may grate in harmony-centred settings.",
  },
  C_high: {
    hu: "A magas lelkiismeretességed olyan szerepváltozatokban kamatozhat leginkább, amelyek rendezett, elejétől a végéig követhető folyamatokra épülnek.",
    en: "Your high orderliness pays off most in structured variants built on processes you can see through to the end.",
  },
  C_low: {
    hu: "A rugalmas, improvizációt engedő szerepváltozatok természetesebbek lehetnek számodra, mint a szigorú folyamatkövetést kívánók.",
    en: "With lower orderliness, flexible variants that allow improvisation feel more natural than strict process-following.",
  },
  O_high: {
    hu: "A magas nyitottságod miatt inkább az újdonságot és tanulást kínáló szerepváltozatok vonzhatnak; a kizárólag rutinszerű feladatokra épülő munkakörök hamar szűkössé válhatnak.",
    en: "Your high openness pulls toward variants offering novelty and learning — purely routine-based roles can feel narrow quickly.",
  },
  O_low: {
    hu: "A bevált módszerek iránti preferenciád a kiszámítható, stabil működésű szerepváltozatokban lehet erőforrás.",
    en: "Your preference for proven methods is an asset in predictable, stable variants of these roles.",
  },
};

// ─── Solo dim role texts (Block 5 ha nincs tension pár) ──────────────────────

export const SOLO_DIM_ROLE_TEXTS: Record<string, Record<Locale, { strong: string; medium: string; watchOut: string }>> = {
  H_high: {
    hu: {
      strong: "Magas bizalmi elvárású, átláthatóságra épülő területek: megfelelőség, etikai tanácsadás, szabályozás, közszféra vagy nonprofit szektor.",
      medium: "Bármely vezetői vagy szakértői szerep, ahol az átláthatóság és a feddhetetlenség tényleges elvárás.",
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
      strong: "Versengő, eredményorientált közegek: üzletfejlesztés, értékesítés, növekedés, vállalkozás vagy sok tárgyalással járó szerepek.",
      medium: "Vezetői, projekt- vagy stratégiai szerepek, ahol az ambíció és az önbizalom húzóerő.",
      watchOut: "Ha a verseny „ember ellen” megy, romolhat a csapatdinamika. Tartsd fókuszban a közös célokat és játékszabályokat.",
    },
    en: {
      strong: "Competitive, outcome-driven settings: business development, sales, growth, entrepreneurship, negotiation-heavy roles.",
      medium: "Leadership, project, or strategy roles where ambition and confidence are a tailwind.",
      watchOut: "If competition turns into people-versus-people, team dynamics can suffer. Keep it aimed at shared goals and clear rules of play.",
    },
  },
  E_high: {
    hu: {
      strong: "Emberközeli, támogató szerepek: HR, coaching vagy mentorálás, egészségügy, szociális terület, ügyfélélmény.",
      medium: "Kapcsolati szerepek – például ügyfélmunka, oktatás vagy tárgyalás –, amelyekben érték a hangulat változásainak korai észlelése.",
      watchOut: "Tartós nyomás és kiszámíthatatlanság kimerítő lehet. Számolj tudatos pihenőkkel, és legyen stabil stresszkezelési rutinod.",
    },
    en: {
      strong: "Supportive, people-centered roles: HR, coaching/mentoring, healthcare or social services, customer experience.",
      medium: "Relationship-heavy roles (customer work, teaching, negotiation) where picking up a shift in mood early matters.",
      watchOut: "Sustained pressure and unpredictability can wear you down. Plan recovery time and keep a simple stress-management routine.",
    },
  },
  E_low: {
    hu: {
      strong: "Nagy nyomású döntési és krízishelyzetek, ahol a nyugalom versenyelőny.",
      medium: "Változások vezetése, szervezeti átalakítás, induló vállalkozások: olyan területek, ahol a bizonytalanság a munka része.",
      watchOut: "A stabilitásod néha ridegségnek tűnhet. Mondd ki a szándékaidat is, ne csak a tényeket — a nyugalmadból magától nem derül ki, hogyan látod a másik helyzetét.",
    },
    en: {
      strong: "High-pressure decision roles and crisis contexts where calm is an advantage.",
      medium: "Change leadership, transformation, startups, where uncertainty is part of the job.",
      watchOut: "Your steadiness can be read as coldness. Say your intent out loud, not only the facts — your calm alone doesn't convey how you read the other person's situation.",
    },
  },
  X_high: {
    hu: {
      strong: "Kapcsolati és „látható” szerepek: vezetés, értékesítés, ügyfélmunka, facilitáció, közösségépítés.",
      medium: "Projekt- és változásvezetés, ahol a mozgósítás és a motiválás kulcs.",
      watchOut: "Túl sok izolált, egyedüli munka lemeríthet. Építs be rendszeres, minőségi emberi kapcsolatot a munkanapokba.",
    },
    en: {
      strong: "Visible, relationship-driven roles: leadership, sales, client-facing work, facilitation, community building.",
      medium: "Project and change leadership where mobilizing and energizing others matters.",
      watchOut: "Too much isolated work can drain you. Build regular, high-quality human contact into your week.",
    },
  },
  X_low: {
    hu: {
      strong: "Mély fókuszt adó, önálló szerepek: elemzés, fejlesztés, kutatás, stratégia, technikai szakértői munka.",
      medium: "Kis csapatban vagy olyan együttműködésben is jól működhetsz, ahol nem kell mindenkinek egyszerre jelen lennie, és marad elegendő védett fókuszidőd.",
      watchOut: "Sok szerepléssel és állandó kapcsolatépítéssel járó szerepek kimeríthetnek. Legyenek határaid a megbeszélések és a nyilvános jelenlét körül.",
    },
    en: {
      strong: "Deep-focus, autonomous roles: analysis, engineering, research, strategy, technical expertise.",
      medium: "Small-team or async collaboration works well when you still have protected focus time.",
      watchOut: "Highly social, always-on visibility roles can exhaust you. Set boundaries around meetings and public-facing moments.",
    },
  },
  A_high: {
    hu: {
      strong: "Együttműködés- és bizalomépítő szerepek: facilitáció, HR, tanácsadás, mediáció, ügyfélmenedzsment.",
      medium: "Partnerségi szerepek, ahol a stabil kapcsolat hozza az eredményt.",
      watchOut: "Konfliktus esetén könnyen halogatod a konfrontációt, amitől felgyűlik a feszültség. Gyakorold a rövid, tiszteletteljes, asszertív jelzéseket.",
    },
    en: {
      strong: "Collaboration and trust-building roles: facilitation, HR, consulting, mediation, account management.",
      medium: "Partnership-focused roles where stable relationships drive results.",
      watchOut: "In conflict, you may delay directness and tensions can accumulate. Practice short, respectful, assertive check-ins.",
    },
  },
  A_low: {
    hu: {
      strong: "Tárgyalások, vitás helyzetek, kritikus felülvizsgálatok: jog, audit, stratégia, szakértői ellenőrzés.",
      medium: "Egyéni szakértői vagy vezetői szerepek, ahol az egyenes visszajelzés kifejezetten érték.",
      watchOut: "A direkt stílus feszítheti a csapatot. Fogalmazz konkrétan és építően: a helyzetre reagálj, ne a személyre.",
    },
    en: {
      strong: "Debate, negotiation, and critical-review contexts: legal, audit, strategy, expert review.",
      medium: "Expert or leadership roles where plainspoken feedback creates more value than keeping harmony.",
      watchOut: "Directness can strain the team. Keep feedback specific and constructive: critique situations and ideas, not people.",
    },
  },
  C_high: {
    hu: {
      strong: "Hosszabb, összetett projektek és üzemeltetési feladatok: programvezetés, minőségbiztosítás, szabályozás vagy megfelelőség.",
      medium: "Strukturált szakértői szerepek, ahol a pontosság és a következetes kivitelezés alap.",
      watchOut: "Frusztráló, ha a munka „sosem záródik le”, vagy a döntések húzódnak. Tisztázd előre, mi számít késznek és mi a határidő.",
    },
    en: {
      strong: "Complex, longer-cycle work: operations, program management, QA, policy, compliance.",
      medium: "Structured expert roles where precision and consistent execution are the baseline.",
      watchOut: "It's frustrating when work never closes or decisions drag on. Define what done means and by when.",
    },
  },
  C_low: {
    hu: {
      strong: "Gyors, kísérletező közegek: induló vállalkozás, kreatív ipar, agilis csapatok vagy prototípuskészítés.",
      medium: "Felfedező, ötletelő szerepek, amelyekben érték a gyors kipróbálás és az irányváltás.",
      watchOut: "Hosszú, részletes kivitelezés megterhelő lehet. Jó párosítás egy strukturáltabb társ vagy egy erős folyamatkeret.",
    },
    en: {
      strong: "Fast-moving, experimental environments: startups, creative teams, agile product work, prototyping.",
      medium: "Exploration and idea-generation roles where quick iteration is the point.",
      watchOut: "Long, detail-heavy execution can be draining. Pair with someone (or a process) that carries structure to the finish.",
    },
  },
  O_high: {
    hu: {
      strong: "Új ötleteket és összetett gondolkodást igénylő szerepek: kutatás, stratégia, tervezés, termékfejlesztés, innováció vagy vállalkozás.",
      medium: "Oktatás, tanácsadás, coaching, ahol a perspektívaváltás és kíváncsiság hozza a pluszt.",
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
      strong: "Stabil, végrehajtás- és megbízhatóság-központú szerepek: üzemeltetés, bevezetés, folyamatműködtetés.",
      medium: "Optimalizálás és rendszerszintű problémamegoldás, ahol a tapasztalatból jön a minőség.",
      watchOut: "Jelentősen új irányoknál könnyen nőhet a feszültség. Kérj fokozatos bevezetést: kis léptékű próba, mérföldkövek és ellenőrzött kockázat.",
    },
    en: {
      strong: "Execution and stability-focused roles: operations, implementation, maintenance, process work.",
      medium: "Optimization and system-level problem solving where experience drives quality.",
      watchOut: "Pressure for radical experimentation can create friction. Ask for a gradual approach: pilots, milestones, controlled risk.",
    },
  },
};
