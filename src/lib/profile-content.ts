import type { ProfileCategory } from "./profile-engine";

export type Locale = "hu" | "en";
type LocalizedText = Record<Locale, string>;

// ─── Section title ────────────────────────────────────────────────────────────

export const SECTION_TITLE: LocalizedText = {
  hu: "Munkastílusod",
  en: "Your work style",
};

// ─── Block 1 – Bevezető framing ───────────────────────────────────────────────

export const BLOCK1: LocalizedText = {
  hu: "Nem címkézünk. Inkább rávilágítunk, hogyan működsz munkahelyi helyzetekben: mi visz előre, mi terhel, és mi ad stabilitást. Ez nem diagnózis, hanem egy letisztult összkép a jelenlegi mintázataidról.",
  en: "No labels. Instead, we highlight how you operate at work: what moves you forward, what weighs on you, and what keeps you steady. Not a diagnosis, but a clean snapshot of your current patterns.",
};

// ─── Block 8 – Záró framing ───────────────────────────────────────────────────

export const BLOCK8: LocalizedText = {
  hu: "Gondolj rá iránytűként: segít tisztábban látni, miben vagy erős, és mire érdemes tudatosabban figyelned. Térj vissza hozzá bátran, amikor új helyzet vagy döntés előtt állsz.",
  en: "Treat it as a compass: it helps you see where you're strong and what deserves more deliberate attention. Come back to it whenever you're facing a new situation or decision.",
};

// ─── Dimenzió nevek (Block 2 megjelenítőhöz) ─────────────────────────────────

export const DIM_LABELS: Record<string, LocalizedText> = {
  INTE: { hu: "Becsületesség-Alázat", en: "Honesty-Humility" },
  RESO: { hu: "Emocionalitás", en: "Emotionality" },
  TEMP: { hu: "Extraverzió", en: "Extraversion" },
  ADAP: { hu: "Barátságosság", en: "Agreeableness" },
  THOR: { hu: "Lelkiismeretesség", en: "Conscientiousness" },
  OPEN: { hu: "Nyitottság", en: "Openness" },
};

export const CATEGORY_LABELS: Record<ProfileCategory, LocalizedText> = {
  high: { hu: "magas", en: "high" },
  medium: { hu: "közepes", en: "medium" },
  low: { hu: "alacsony", en: "low" },
};

// ─── Block 3 – Működési narratíva (tension-specifikus szövegek) ───────────────

export const RESOLUTION_NARRATIVES: Record<string, LocalizedText> = {
  ethicalLeader: {
    hu: "Ritka párosítás van benned: fontosak az elveid, és az is, hogy ez látsszon. Nem a rivaldafény vonz, hanem az, hogy hitelesnek lássanak — olyan szerepekben teljesítesz igazán, ahol a hitelesség maga a tőke.",
    en: "Your ethical integrity combined with a need for visibility is a rare but powerful combination. You are not drawn to the spotlight for its own sake, but to being seen as authentic. You thrive in roles where credibility is the currency.",
  },
  principledConfronter: {
    hu: "Elvhű vagy és konfrontatív – nem hazudsz, de nem is kerülöd a nehéz beszélgetéseket. Etikai vizsgálatokban, szabályozói munkában vagy elemedben — mindenhol, ahol a kellemetlen igazságot is ki kell mondani.",
    en: "You are principled and confrontational — you don't lie, and you don't avoid difficult conversations. This profile finds its natural home in ethical investigations, regulatory work, or anywhere the uncomfortable truth needs to be voiced.",
  },
responsibleInnovator: {
  hu: "Nyitott vagy az új megközelítésekre, ugyanakkor döntéseidet egy erős belső értékrend vezérli. Számodra az innováció nem öncélú, hanem átgondolt és felelősségteljesen megvalósított.",
  en: "You are open to new approaches, yet guided by a strong inner value system. For you, innovation is not self-serving but intentional and carried out with a sense of responsibility.",
},
  supportedVisibility: {
    hu: "A társas közeg feltölt, a stressz viszont hamar megterhel. Olyan szerepek a legjobbak, ahol van visszajelzés, biztonság és megbecsülés – nem pusztán elvárás és nyomás.",
    en: "Social presence energizes you, but stress quickly takes its toll. Roles with feedback, psychological safety, and recognition work best — not just expectations and pressure.",
  },
  structuredStability: {
    hu: "Sokat vársz el magadtól, és közben érzékenyen reagálsz a stresszre — ez a kettő együtt tudatos energiabeosztást kíván. Kiszámítható, strukturált, támogató környezetben hozod ki a legjobbat magadból.",
    en: "The combination of high self-expectations and stress sensitivity requires careful energy management. You bring out the best in yourself in predictable, structured, supportive environments.",
  },
  safeExperimentation: {
    hu: "Az ismeretlen vonz, de szorongást is okozhat. A legjobban olyan innovációs környezetben működsz, ahol van biztonsági háló: nem kell mindent egyszerre kockáztatni.",
    en: "The unknown draws you in, but can also cause anxiety. You function best in innovation environments with a safety net — where not everything needs to be risked at once.",
  },
  deepCollaboration: {
    hu: "Nem a társaságot kerülöd, hanem a felszínes csevegést. Kis létszámú, hosszú távú, bizalmi együttműködésben teljesítesz — ahol nem kell mindenkivel jóban lenni, elég azokkal, akikkel ténylegesen együtt dolgozol.",
    en: "It's not crowds themselves you avoid — it's superficial interaction. You perform best in small-group, long-term, trust-based collaboration, where you don't need to befriend everyone, only your close collaborators.",
  },
  solitaryInnovator: {
    hu: "Nem a közös ötletelésben dolgozod ki az ötleteidet, hanem egyedül. A belső világ gazdagsága és az újdonságkeresés különleges profilt ad: szoliter kutató, stratégiai elemző, rendszertervező típusú szerepek.",
    en: "You don't develop your ideas in brainstorms — you do it alone. The richness of your inner world combined with a drive for novelty creates a distinctive profile: solitary researcher, strategic analyst, architect-type roles.",
  },
  facilitatedInnovation: {
    hu: "Újító vagy, de nem egyedül viszed végig: bevonod a többieket, és közösen formáljátok az ötleteket. Design thinking, részvételi tervezés, workshopvezetés — olyan közegben vagy elemedben, ahol az innováció csapatmunka.",
    en: "You innovate, but through consensus. You don't push your ideas on others; you involve them. Design thinking, participatory design, workshop facilitation — where innovation is a shared endeavor.",
  },
  structuredCompetitor: {
    hu: "Ambiciózus vagy és fegyelmezett — strukturált közegben a versenyszellemed a legnagyobb erősséged. Nem politizálással nyersz, hanem teljesítménnyel.",
    en: "Ambitious and disciplined — competition is your strongest asset in a structured environment. You win not through politics, but through performance.",
  },
  structuredInnovator: {
    hu: "Vonzódsz az újszerű problémákhoz, de a legjobb munkádat strukturált keretek között végzed. Ez nem ellentmondás – hanem a keretezett innováció természetes profilja.",
    en: "You are drawn to novel problems, but you do your best work within structured frameworks. This is not a contradiction — it is the natural profile of structured innovation.",
  },
  resilientLeader: {
    hu: "Ritka párosítás: társaságban vagy elemedben, és közben a nyomás sem zökkent ki. Amikor mások elbizonytalanodnak, te tartod az irányt — a stressz nem rontja el a kapcsolataidat, sőt, ilyenkor válsz igazán támasszá.",
    en: "Your emotional stability combined with extraversion is a rare combination: in high-pressure, people-intensive situations, you hold direction when others waver. Stress doesn't damage your relationships — quite the contrary.",
  },
  calmExecution: {
    hu: "Megbízhatóan, egyenletesen teljesítesz — a lelkiismeretességed és az érzelmi stabilitásod erősíti egymást. Ahol mások a nyomás alatt hibáznának, te kiszámíthatóan hozod az eredményt.",
    en: "You deliver reliably and consistently — your conscientiousness and emotional stability reinforce each other. Where others might derail under stress, you produce results predictably.",
  },
  exploratoryAnalyst: {
    hu: "Kíváncsi vagy az ismeretlenre, és a bizonytalanság sem rendít meg — ez a kettő ritkán jár együtt. Nyugodtan, alaposan jársz körül új területeket; a kutatásban, az elemzésben és a felfedezésben érzed magad igazán otthon.",
    en: "Your openness and emotional stability form a distinctive combination: you explore unknown territory deeply while uncertainty doesn't unsettle you. Research, analysis, and discovery are your natural domains.",
  },
  organizedLeader: {
    hu: "Jól bánsz az emberekkel, és közben a feladatokban is rendet tartasz: szervezel, kommunikálsz, és le is szállítod, amit vállaltál. Egyszerre tudod mozgósítani a csapatot és végigvinni a terveket.",
    en: "Your social activity and conscientiousness reinforce each other: you organize, communicate, and execute effectively. You can both mobilize people and follow through on plans simultaneously.",
  },
  harmoniousConnector: {
    hu: "Ritka, hogy valakiben együtt van a lendület és a befogadó figyelem — benned igen. Energiát hozol a csapatba, közben mindenkire odafigyelsz, ezért gyakran te vagy az, aki összetartja a többieket.",
    en: "Your extraversion and high agreeableness create exceptional team dynamics. It's rare for someone to be both energizing and receptive — for you this is natural, and it makes you the glue that holds teams together.",
  },
  performanceDriver: {
    hu: "Ambiciózus és szervezett – kemény munkával, következetes végrehajtással érsz el célokat. A versenyszellem és a precizitás nálad nem zárja ki egymást — együtt adják az eredményességedet.",
    en: "Ambitious and organized — you achieve goals through hard work and consistent execution. Competitive drive and precision don't exclude each other in your profile; they combine into a results-focused profile.",
  },
  disruptiveInnovator: {
    hu: "Önálló, megkérdőjelező gondolkodó vagy: nem kötsz kompromisszumot pusztán a béke kedvéért, és közben nyitott vagy az új gondolatokra. Megfelelő közegben ez a kettő együtt komoly innovatív erő.",
    en: "Your combination of low agreeableness and high openness creates a challenging, independent thinker. You don't compromise for the sake of peace alone — and in the right environment, this becomes a force for innovation.",
  },
};

// ─── Block 3 – Rövid működési összkép (ne ismételje a 6/7 blokkokat) ─────────

export const BLOCK3_SUMMARIES: Record<string, LocalizedText> = {
  ethicalLeader: {
    hu: "A hitelesség és a látható felelősségvállalás egyszerre fontos neked. Olyan helyzetekben vagy erős, ahol értékek mentén kell irányt mutatni.",
    en: "Authenticity and visible responsibility both matter to you. You are strongest in situations where direction must be set on clear values.",
  },
  principledConfronter: {
    hu: "Az egyenesség és a konfliktustűrés együtt jelenik meg nálad. Akkor működsz jól, ha tiszta határokat és kimondható feszültségeket kell kezelni.",
    en: "Directness and conflict tolerance show up together in your profile. You work well where clear boundaries and explicit tensions must be handled.",
  },
  responsibleInnovator: {
    hu: "Nyitott vagy az újra, de belső etikai iránytű mentén döntesz. Nálad az innováció és a felelősség nem ellentét, hanem közös működési elv.",
    en: "You are open to novelty, but you decide through an internal ethical compass. For you, innovation and responsibility are not opposites, but one operating principle.",
  },
  supportedVisibility: {
    hu: "A társas jelenlét motivál, ha van biztonságos keret körülötte. A látható szerepekben akkor teljesítesz jól, ha kapsz stabil visszajelzést.",
    en: "Social visibility motivates you when it is supported by safety. You perform well in visible roles when feedback remains stable and constructive.",
  },
  structuredStability: {
    hu: "A magas belső mérce és az érzelmi érzékenység együtt tudatos kereteket igényel. Strukturált közegben kiegyensúlyozottan tudsz magas színvonalat tartani.",
    en: "High internal standards combined with sensitivity require intentional structure. In a well-structured environment, you can sustain high quality at a healthy pace.",
  },
  safeExperimentation: {
    hu: "Az újdonság vonz, de kiszámítható támaszpontokra is szükséged van. Akkor működsz jól, ha a kísérletezésnek világos ritmusa és határa van.",
    en: "Novelty attracts you, but you also need stable reference points. You work best when experimentation has a clear rhythm and boundaries.",
  },
  deepCollaboration: {
    hu: "A mély, bizalmi együttműködés többet ad neked, mint a széles láthatóság. Kisebb, stabil kapcsolati hálóban bontakozik ki legjobban a teljesítményed.",
    en: "Deep, trust-based collaboration gives you more than broad visibility. Your performance unfolds best in smaller, stable relationship networks.",
  },
  solitaryInnovator: {
    hu: "Az ötleteidet elsősorban elmélyült, önálló munkában érleled. Erősséged a mély gondolkodás és az új perspektívák csendes felépítése.",
    en: "You mainly develop ideas through deep, independent work. Your strength is sustained thinking and building new perspectives quietly.",
  },
  facilitatedInnovation: {
    hu: "Úgy viszel be újat a rendszerbe, hogy közben bevonod az embereket. Az együttműködő változásépítés a természetes működési módod.",
    en: "You bring novelty into systems while bringing people with you. Collaborative change-building is your natural operating mode.",
  },
  structuredCompetitor: {
    hu: "A versenyt célfegyelemmel és következetes kivitelezéssel kezeled. Olyan környezetben vagy erős, ahol teljesítmény és mérhetőség tisztán jelen van.",
    en: "You approach competition with discipline and consistent execution. You are strong in environments where performance and measurability are explicit.",
  },
  structuredInnovator: {
    hu: "Az új megoldásokat rendszerben gondolod végig, nem ad hoc módon. Akkor tudsz nagyot alkotni, ha a kreativitás és a struktúra egyszerre van jelen.",
    en: "You think through new solutions in systems, not ad hoc. You do your best work when creativity and structure are both present.",
  },
  resilientLeader: {
    hu: "Stressz alatt is kiegyensúlyozott maradsz, és az energiádat a kapcsolataidból merítve tartod fenn. Olyan helyzetekben vagy erős, ahol egyszerre kell emberi jelenlét és stabilitás.",
    en: "You stay balanced even under stress, drawing energy from relationships to sustain it. You are strongest in situations that call for both human presence and stability.",
  },
  calmExecution: {
    hu: "Megbízhatóan és nyugodtan végzed el, amit vállalsz. Nem rendít meg a nyomás, és a feladatot következetesen zárod le.",
    en: "You complete what you take on reliably and calmly. Pressure doesn't unsettle you, and you close tasks consistently.",
  },
  exploratoryAnalyst: {
    hu: "Az ismeretlent kíváncsian és nyugodtan közelíted meg. Mások szoronganának az újdonságtól – te energiát nyersz belőle, miközben megőrzöd az elemzői fókuszt.",
    en: "You approach the unknown with curiosity and calm. Others might feel anxious about novelty — you draw energy from it while maintaining analytical focus.",
  },
  organizedLeader: {
    hu: "Szeretsz emberekkel dolgozni, és végigvinni minden feladatot. A csapatot mozgásban tartod, de mindig van kéznél terv és határidő.",
    en: "You work with people and you close things out. You keep the team moving while always having a plan and a deadline at hand.",
  },
  harmoniousConnector: {
    hu: "Kapcsolatokat építesz, összetartod a csapatot, és az együttműködés természetes közeged. A harmóniát szinte erőfeszítés nélkül tartod fenn.",
    en: "You build relationships, hold the team together, and collaboration is your natural medium. Maintaining harmony comes naturally, without requiring active effort.",
  },
  performanceDriver: {
    hu: "Ambiciózus és szervezett – kemény munkával, következetes végrehajtással érsz el célokat. A versenyszellem és a precizitás egyszerre jellemez.",
    en: "Ambitious and organized — you achieve goals through hard work and consistent execution. Competitive drive and precision characterize you simultaneously.",
  },
  disruptiveInnovator: {
    hu: "Nem félsz kikezdeni a status quót, és új irányokat keresel. A konfrontáció eszköz, nem akadály – az újdonság és az egyenességed egyszerre jelenik meg.",
    en: "You are not afraid to challenge the status quo and seek new directions. Confrontation is a tool, not an obstacle — novelty and directness show up together in your profile.",
  },
};

// ─── Block 6 – Kombináció-insight fejléc ─────────────────────────────────────

export const BLOCK6_TITLE: LocalizedText = {
  hu: "A legfontosabbak",
  en: "Key takeaways",
};

// ─── Block 7 – Kockázati jelzők szövegei ─────────────────────────────────────

export const BLOCK7_TITLE: LocalizedText = {
  hu: "Ami kihívás lehet",
  en: "Things to watch for",
};

export const RISK_TEXTS: Record<string, LocalizedText> = {
  supportedVisibility: {
    hu: "Ha sok a társas inger, gyorsan lemerülhetsz. Segíthet, ha előre beépítesz fix visszajelzési pontokat, és hagysz időt a feltöltődésre.",
    en: "If social intensity runs long, your energy may drop fast. Try scheduling regular feedback check-ins and leaving deliberate recovery time.",
  },
  structuredStability: {
    hu: "Néha túlzottan ellenőrzöd magad, és mintha állandó készenlétben lennél. Segíthet, ha a munkát rövid, tiszta szakaszokra bontod, és előre kijelölöd, mi számít késznek.",
    en: "You may find yourself over-monitoring and staying on constant alert. Try breaking work into short, clear phases and defining realistic endpoints.",
  },
  safeExperimentation: {
    hu: "Könnyen ugrálsz a lehetőségek között, és nehéz lehet lezárni egy döntést. Segíthet, ha egyszerre csak 1-2 új irányt vagy megoldást próbálsz ki, és előre rögzíted magadnak, mi alapján állsz le vagy váltasz vissza egy-egy megoldásra.",
    en: "You may bounce between options and struggle to close decisions. Try running no more than 1–2 experiments at a time, with clear stop criteria and fallback rules.",
  },
};

// ─── Block 5 – Szerepkör-família ajánlások ────────────────────────────────────

export const BLOCK5_TITLE: LocalizedText = {
  hu: "Szerepkör-illeszkedés",
  en: "Role fit",
};

export const BLOCK5_STRONG: LocalizedText = {
  hu: "Erős illeszkedés",
  en: "Strong fit",
};

export const BLOCK5_MEDIUM: LocalizedText = {
  hu: "Működhet, ha készülsz",
  en: "Can work with preparation",
};

export const BLOCK5_WATCH: LocalizedText = {
  hu: "Ahol segít a felkészülés",
  en: "Where preparation helps",
};

export const ROLE_TEXTS: Record<string, Record<Locale, { strong: string; medium: string; watchOut: string }>> = {
  ethicalLeader: {
    hu: {
      strong: "Értékvezérelt, magas bizalmi elvárású közegek, ahol transzparens döntéshozatal és hitelesség számít.",
      medium: "Összetett érdekviszonyú szervezetben is jól működhetsz, ha egyértelműek az etikai kereteid.",
      watchOut: "Nehéz lehet olyan közegben dolgozni, ahol az értékek csak kommunikációs szinten jelennek meg. Érdemes már az elején közös etikai döntési elveket rögzíteni.",
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
      medium: "Változóbb környezetben is jól működhetsz, ha a prioritások és a határidők stabilak és egyértelműek.",
      watchOut: "Nehéz lehet, ha az elvárások magasak, de a működés tartósan kiszámíthatatlan. Segít, ha rövid ciklusokban dolgozol, egyértelmű lezárási pontokkal és terhelési limittel.",
    },
    en: {
      strong: "Predictable, structured operations where high quality can be sustained at a healthy pace.",
      medium: "You can also perform in more dynamic contexts if priorities and deadlines stay clearly stable.",
      watchOut: "It can be hard when expectations are high but the environment stays unpredictable. Work in short cycles with clear endpoints and explicit load limits.",
    },
  },
  safeExperimentation: {
    hu: {
      strong: "Kísérletező közegek, ahol van biztonsági háló: lehet újat próbálni, de kontrollált keretben.",
      medium: "Gyors változás mellett is jól működhetsz, ha a döntési ritmus és a visszalépési lehetőségek előre tisztázottak.",
      watchOut: "Megterhelő lehet, ha egyszerre túl sok irány nyílik meg és nincs kapaszkodó a döntésekhez. Érdemes egyszerre legfeljebb 1-2 prioritást futtatni, előre rögzített stop-szabályokkal.",
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
      medium: "Nagyobb csapatban is eredményes lehetsz, ha vannak állandó mikrokörök és tiszta kommunikációs csatornák.",
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
      strong: "Mély fókuszt, autonómiát és hosszabb gondolkodási ciklust adó feladatok, ahol egyedi megoldásokat építhetsz.",
      medium: "Csapatos környezetben is jól működhetsz, ha védett fókuszidő és aszinkron együttműködés biztosított.",
      watchOut: "Megterhelő lehet, ha a munka ritmusát folyamatos megbeszélések törik meg. Érdemes fix fókuszidőt és aszinkron döntéselőkészítést előre rögzíteni.",
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
      medium: "Hierarchikusabb közegben is működhetsz, ha van tér facilitált egyeztetésekre és iterációra.",
      watchOut: "Nehéz lehet olyan közegben dolgozni, ahol a bevonás csak formális, de a döntések zártan születnek. Érdemes a folyamat elején tisztázni, miről lehet ténylegesen dönteni, és mi a workshopok konkrét célja.",
    },
    en: {
      strong: "Change contexts where innovation becomes durable through inclusion and shared learning.",
      medium: "You can work in more hierarchical settings if there is room for facilitated alignment and iteration.",
      watchOut: "It can be difficult to work in environments where inclusion is symbolic while decisions remain closed. Clarify upfront what can actually be decided and what concrete outcomes workshops should produce.",
    },
  },
  structuredCompetitor: {
    hu: {
      strong: "Mérhető teljesítményt, egyértelmű célokat és felelősségi szinteket adó versengő közegek.",
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
      watchOut: "Nehéz lehet, ha egyszerre túl sok irány fut nyitva, és a kivitelezés elveszíti a fókuszt. Segít, ha iterációnként fix kerettel, priorizált feladatlistával és világos lezárási kritériumokkal dolgoztok.",
    },
    en: {
      strong: "Complex problems where you must innovate while keeping execution coherent and structured.",
      medium: "You can also do well in faster creative contexts if lightweight processes and clear decision points exist.",
      watchOut: "It can become difficult when too many directions stay open and execution loses focus. Work with fixed per-iteration scope, a prioritized backlog, and clear completion criteria.",
    },
  },
  resilientLeader: {
    hu: {
      strong: "Emberekkel intenzíven foglalkozó, változékony, magas elvárású szerepek – vezető, értékesítési vezető, kríziskoordinátor, változásmenedzsment.",
      medium: "Projektvezetés, ügyfélkapcsolati szerepkörök, ahol az extraverzió és a stressztűrés egyszerre számít.",
      watchOut: "Nehéz lehet, ha a társas aktivitás nem jár valódi mélységgel, vagy ha az érzelmi stabilitásodat mások érzéketlenségként értelmezik. Érdemes tudatosan kommunikálni az empátiát is.",
    },
    en: {
      strong: "Roles with intensive people work in volatile, high-expectation contexts — leadership, sales leadership, crisis coordination, change management.",
      medium: "Project leadership, client-facing roles where extraversion and stress tolerance both matter.",
      watchOut: "It can be difficult if social activity lacks real depth, or if others interpret your emotional stability as insensitivity. Make a conscious effort to also communicate empathy.",
    },
  },
  calmExecution: {
    hu: {
      strong: "Magas komplexitású, hosszú futamidejű projektek, ahol egyszerre szükséges kitartás és érzelmi állóképesség – üzemeltetés, programvezetés, minőségbiztosítás.",
      medium: "Szabályozói, megfelelőségi (compliance) vagy szakértői szerepek, ahol a megbízható, egyenletes teljesítmény tőke.",
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
      watchOut: "Megterhelő lehet, ha az eredményre nyomás nehezedik, mielőtt az elemzés valóban mélyebbé válhat. Érdemes a ciklus elején rögzíteni az elvárt mélységet és a határidőt.",
    },
    en: {
      strong: "Research, strategic analysis, or innovation roles where discovering the unknown calls for deep, sustained focus.",
      medium: "Exploratory consulting or product strategy work also fits well if there is room for deep thinking.",
      watchOut: "It can be challenging when results are demanded before the analysis can truly deepen. Agree up front on the expected depth and timeline at the start of each cycle.",
    },
  },
  organizedLeader: {
    hu: {
      strong: "Projektvezetés, csapatvezetés, operatív irányítás – ahol a strukturált végrehajtás és az emberi mozgósítás egyszerre elvárás.",
      medium: "Értékesítési vagy ügyfélközpontú szerepkörökben is jól működsz, ha van kiszámítható folyamat mögötte.",
      watchOut: "Nehéz lehet, ha a csapat kevésbé strukturáltan dolgozik, vagy a célok és határidők folyamatosan változnak. Érdemes minimális folyamatkeretet kialakítani, amibe a csapat bekapcsolódhat.",
    },
    en: {
      strong: "Project management, team leadership, operational direction — where structured execution and human mobilization are expected together.",
      medium: "Sales or customer-centric roles also work well if there is a predictable process underneath.",
      watchOut: "It can be hard if the team works less structurally, or if goals and deadlines keep shifting. Build a minimal process frame the team can plug into.",
    },
  },
  harmoniousConnector: {
    hu: {
      strong: "Csapatépítés, facilitáció, ügyfélkapcsolat, coaching – ahol az összetartás, a bizalom és az energizálás a fő érték.",
      medium: "Értékesítési, tárgyalási, partnerségi szerepek is erős közeg, ha van elegendő visszajelzés és valódi kapcsolat.",
      watchOut: "Nehéz lehet, ha a konfliktusokat inkább harmonizálod, ahelyett hogy megoldanád – ez hosszú távon gyűlhet. Érdemes az asszertív kommunikációt tudatosan fejleszteni.",
    },
    en: {
      strong: "Team building, facilitation, client relations, coaching — where cohesion, trust, and energizing others are the primary value.",
      medium: "Sales, negotiation, and partnership roles are also strong contexts if there is enough genuine connection and feedback.",
      watchOut: "It can be difficult if you tend to harmonize conflicts rather than resolve them — this can accumulate over time. Consciously develop assertive communication skills.",
    },
  },
  performanceDriver: {
    hu: {
      strong: "Eredményalapú, versengő közegek – értékesítés, üzletfejlesztés, növekedés (growth), teljesítményorientált vezetői szerep.",
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
      strong: "Felforgató, konvenciótörő szerepek – innovációs vezető, vállalkozó, stratégiai tanácsadó, ahol a konvenció megkérdőjelezése értéket jelent.",
      medium: "Szakértői tanácsadói, kutatói pozíciók is erős közeg, ha van elegendő autonómiád és a kritikus gondolkodás elvárás.",
      watchOut: "Nehéz lehet, ha a csapat erős harmónia-elvárással dolgozik, vagy ha a konfrontáció csapatkohéziót rombol. Érdemes a visszajelzést konstruktívan keretezni: ne a személy ellen, hanem az ötlet mellett szóljon.",
    },
    en: {
      strong: "Disruption-oriented roles — innovation leader, entrepreneur, strategic advisor, where challenging convention creates value.",
      medium: "Expert consulting and research positions are also a strong fit if you have sufficient autonomy and critical thinking is the norm.",
      watchOut: "It can be difficult if the team operates under strong harmony expectations, or if confrontation damages team cohesion. Channel feedback constructively — against ideas, not people.",
    },
  },
};

// ─── Block 4 – Környezeti preferencia táblázat ────────────────────────────────

export const BLOCK4_TITLE: LocalizedText = {
  hu: "Ideális környezet",
  en: "Ideal environment",
};

type EnvRow = { label: LocalizedText; value: LocalizedText };

// Dimenzió + kategória kombinációra visszaadja a megfelelő sort
export function getEnvRows(
  categories: Record<string, ProfileCategory>
): EnvRow[] {
  const rows: EnvRow[] = [];

  // Struktúra (THOR alapján)
  if (categories.THOR === "high") {
    rows.push({
      label: { hu: "Struktúra", en: "Structure" },
      value: { hu: "Magas – egyértelmű keretek, folyamatok, szabályok", en: "High – clear structure, processes, rules" },
    });
  } else if (categories.THOR === "low") {
    rows.push({
      label: { hu: "Struktúra", en: "Structure" },
      value: { hu: "Alacsony – rugalmas, önirányított", en: "Low – flexible, self-directed" },
    });
  } else {
    rows.push({
      label: { hu: "Struktúra", en: "Structure" },
      value: { hu: "Közepes – keretezett, de nem bürokratikus", en: "Medium – structured, but not bureaucratic" },
    });
  }

  // Társas intenzitás (TEMP alapján)
  if (categories.TEMP === "high") {
    rows.push({
      label: { hu: "Társas intenzitás", en: "Social intensity" },
      value: { hu: "Magas – csapatmunka, sok interakció", en: "High – teamwork, frequent interaction" },
    });
  } else if (categories.TEMP === "low") {
    rows.push({
      label: { hu: "Társas intenzitás", en: "Social intensity" },
      value: { hu: "Alacsony – önálló munka, kiscsapat", en: "Low – independent work, small team" },
    });
  } else {
    rows.push({
      label: { hu: "Társas intenzitás", en: "Social intensity" },
      value: { hu: "Alacsony-közepes – önálló + kiscsapat", en: "Low to medium – mostly independent, small-team collaboration" },
    });
  }

  // Változásgyakoriság (OPEN és THOR alapján)
  if (categories.OPEN === "high" && categories.THOR === "high") {
    rows.push({
      label: { hu: "Változásgyakoriság", en: "Change frequency" },
      value: { hu: "Közepes – evolúció strukturált keretek közt", en: "Medium – gradual change within clear boundaries" },
    });
  } else if (categories.OPEN === "high") {
    rows.push({
      label: { hu: "Változásgyakoriság", en: "Change frequency" },
      value: { hu: "Magas – szívesen dolgozol változó, ismeretlen közegben", en: "High – comfortable with shifting, novel environments" },
    });
  } else {
    rows.push({
      label: { hu: "Változásgyakoriság", en: "Change frequency" },
      value: { hu: "Alacsony-közepes – stabilitás, kiszámítható folyamatok", en: "Low to medium – stability, predictable processes" },
    });
  }

  // Döntési sebesség (THOR és OPEN alapján)
  if (categories.THOR === "high" && categories.OPEN === "low") {
    rows.push({
      label: { hu: "Döntési sebesség", en: "Decision pace" },
      value: { hu: "Közepes – átgondolt, szabályalapú döntések", en: "Medium – deliberate, rule-based decisions" },
    });
  } else if (categories.THOR === "low" && categories.OPEN === "high") {
    rows.push({
      label: { hu: "Döntési sebesség", en: "Decision pace" },
      value: { hu: "Gyors – intuitív, rugalmas döntéshozatal", en: "Fast – intuitive, flexible decision-making" },
    });
  } else {
    rows.push({
      label: { hu: "Döntési sebesség", en: "Decision pace" },
      value: { hu: "Közepes – átgondolt, de nem bürokratikus", en: "Medium – deliberate but not bureaucratic" },
    });
  }

  // Kultúra (INTE alapján)
  if (categories.INTE === "high") {
    rows.push({
      label: { hu: "Kultúra", en: "Culture" },
      value: { hu: "Értékvezérelt, etikailag következetes", en: "Values-driven, ethically consistent" },
    });
  } else if (categories.INTE === "low") {
    rows.push({
      label: { hu: "Kultúra", en: "Culture" },
      value: { hu: "Teljesítményalapú, versengős kultúra tolerálható", en: "Performance-based, competitive culture acceptable" },
    });
  }

  // Projektciklus (THOR és OPEN alapján)
  if (categories.THOR === "high") {
    rows.push({
      label: { hu: "Projektciklus", en: "Project cycle" },
      value: { hu: "Hosszú, mélyülő – alapos kivitelezés", en: "Long, deepening – thorough execution" },
    });
  } else if (categories.OPEN === "high") {
    rows.push({
      label: { hu: "Projektciklus", en: "Project cycle" },
      value: { hu: "Rövid-közepes – felfedező, nehezebben zár le", en: "Short to medium – enjoys exploring, struggles to close" },
    });
  } else {
    rows.push({
      label: { hu: "Projektciklus", en: "Project cycle" },
      value: { hu: "Közepes – elmélyülő, de határidőtudatos", en: "Medium – thorough but deadline-aware" },
    });
  }

  // Stressz-tolerancia (RESO alapján)
  if (categories.RESO === "high") {
    rows.push({
      label: { hu: "Stressztűrés", en: "Stress tolerance" },
      value: { hu: "Alacsony-közepes – kiszámítható, alacsony nyomású közeg szükséges", en: "Low to medium – predictable, low-pressure environment needed" },
    });
  } else if (categories.RESO === "low") {
    rows.push({
      label: { hu: "Stressztűrés", en: "Stress tolerance" },
      value: { hu: "Magas – jól tűri a nyomást és a bizonytalanságot", en: "High – handles pressure and uncertainty well" },
    });
  }

  return rows;
}

// ─── Block 3 – Általános narratíva (ha nincs tension pár) ────────────────────

export const DEFAULT_NARRATIVE: LocalizedText = {
  hu: "A profilod dimenzióit nézve jól illeszkedő, összhangban lévő mintázat rajzolódik ki. Nincs jellemző belső feszültség az egyes dimenziók között – ez gyakran azt jelenti, hogy a személyiséged különböző aspektusai erősítik egymást.",
  en: "Looking across your profile dimensions, a coherent pattern emerges. There is no notable internal tension between the dimensions — meaning the different aspects of your personality often reinforce each other.",
};

export const BLOCK2_TITLE: LocalizedText = {
  hu: "Dimenzióprofil",
  en: "Dimension profile",
};

export const BLOCK3_TITLE: LocalizedText = {
  hu: "Ahogy működsz",
  en: "How you operate",
};

export const BLOCK4_EMPTY: LocalizedText = {
  hu: "Most nincs egyetlen domináns irány: a dimenziók többsége középen van.",
  en: "No single dominant direction yet: most dimensions sit in the middle.",
};

// ─── Solo dim narratives (Block 3 ha nincs tension pár) ──────────────────────

export const SOLO_DIM_NARRATIVES: Record<string, LocalizedText> = {
  INTE_high: {
    hu: "Válaszaid alapján a nyílt, játszmamentes működés az egyik legdominánsabb preferenciád: az egyenes kommunikációt választod akkor is, amikor a taktikázás kifizetődőbb lenne – ez a munkakapcsolataidban erős, bizalomépítő alapot ad.",
    en: "Based on your responses, open, game-free operation is one of your most dominant preferences: you choose direct communication even when manoeuvring would pay better — a strong, trust-building foundation in your working relationships.",
  },
  INTE_low: {
    hu: "Ambiciózus és stratégiai gondolkodású vagy: nem riadsz vissza a kihívásoktól és a versenytől. A célok elérése hajtóerő számodra – a versengés és az önérvényesítés természetes közeged.",
    en: "Ambitious and strategic, you don't shy away from challenges or competition. Achieving goals is what drives you — competition and self-assertion are your natural environment.",
  },
  RESO_high: {
    hu: "Az érzelmi érzékenység az egyik meghatározó jellemződ. Empatikus vagy, és könnyen reagálsz a körülötted zajló eseményekre – ez értéket ad kapcsolataidnak, de igényli a megfelelő, támogató keretet.",
    en: "Emotional sensitivity is one of your defining traits. You are empathetic and respond readily to events around you — this adds value to your relationships but calls for a supportive, well-structured environment.",
  },
  RESO_low: {
    hu: "Válaszaid kiemelkedő érzelmi stabilitást jeleznek. Nyomás és bizonytalanság alatt is jellemzően megőrzöd az egyensúlyodat – ez ritka és értékes képesség változékony közegekben.",
    en: "Your responses point to outstanding emotional stability. You typically maintain your balance even under pressure and uncertainty — a rare and highly valuable ability in volatile environments.",
  },
  TEMP_high: {
    hu: "Erősen extravertált mintázat jellemez – a kapcsolatokból és interakciókból nyersz energiát. A társas tér a természetes közeged, és aktívan alakítod a közeg dinamikáját.",
    en: "Your pattern is strongly extraverted — you draw energy from relationships and interactions. Social space is your natural element, and you actively shape the dynamics around you.",
  },
  TEMP_low: {
    hu: "Introvertált beállítottság jellemez – önálló vagy kiscsoportos munkában töltöd fel az energiáidat. A mély fókusz és az autonómia az erősséged tere.",
    en: "You have an introverted disposition — you recharge through independent or small-group work. Deep focus and autonomy are where your strengths unfold.",
  },
  ADAP_high: {
    hu: "Együttműködő, alkalmazkodó és kapcsolatorientált. A csapatkohézió és a harmónia természetes értéked – aktívan dolgozol a jó kapcsolatok fenntartásán.",
    en: "Cooperative, adaptable, and relationship-oriented. Team cohesion and harmony are values that come naturally to you — you actively work at maintaining good relationships.",
  },
  ADAP_low: {
    hu: "Egyenes, elvhű és önálló. A döntéseket nem a béke, hanem az igazság alapján hozod – ez erős véleményvezér és tárgyalópartner-profilt ad.",
    en: "Direct, principled, and independent. You make decisions based on truth, not comfort — this creates a strong opinion-leader and negotiating-partner profile.",
  },
  THOR_high: {
    hu: "Szervezett, megbízható és következetes – a lelkiismeretesség erős bázist ad a teljesítményhez. A vállalt feladatokat gondosan kivitelezed, és értékeled a tiszta struktúrát.",
    en: "Organized, reliable, and consistent — conscientiousness provides a strong foundation for performance. You execute your commitments carefully and value clear structure.",
  },
  THOR_low: {
    hu: "Rugalmas és adaptív, inkább intuitív irányítású. A spontán megközelítés és az improvizáció az erősségeid – a folyamatos struktúra kevésbé motivál.",
    en: "Flexible and adaptive, you tend to operate more intuitively. Spontaneous approaches and improvisation are your strengths — rigid ongoing structure motivates you less.",
  },
  OPEN_high: {
    hu: "Az újdonságra és a komplex gondolkodásra nyitott, kíváncsi személyiség. Az ismeretlen nem riaszt, hanem vonz – az innováció, a kreativitás és a feltárás természetes közeged.",
    en: "Curious and open to novelty and complex thinking. The unknown doesn't discourage you — it draws you in. Innovation, creativity, and discovery are your natural domains.",
  },
  OPEN_low: {
    hu: "Kiszámítható, konkrét és pragmatikus beállítottságú. A bevált megoldásokat részesíted előnyben – a stabilitás, a megbízhatóság és az ismert módszerek az erősséged.",
    en: "Predictable, concrete, and pragmatic. You prefer proven solutions — stability, reliability, and familiar methods are your strengths.",
  },
};

// ─── Solo dim summaries (Kulcs-tanulságok, ha nincs tension pár) ─────────────
// Korábban a takeaways ugyanazokat a SOLO_DIM_NARRATIVES szövegeket kapta,
// mint az „Ahogy működsz" blokk → szó szerinti duplikáció a riportban
// (javítási terv 2026-07, P1.3). Ez a készlet rövid, tanulság-műfajú:
// egy erőforrás + egy hipotézisként keretezett figyelő-pont (vakfolt-csíra).

export const SOLO_DIM_SUMMARIES: Record<string, LocalizedText> = {
  INTE_high: {
    hu: "Erőforrásod a kiszámíthatóság és a nyílt kommunikáció — mások gyorsan tudják, hányadán állnak veled. Figyeld meg: nehezebb közegben hajlamos lehetsz túl sokáig engedékeny maradni ott, ahol már határt kellene húzni.",
    en: "Your asset is predictability and open communication — people quickly know where they stand with you. Worth watching: in tougher settings you may stay accommodating a beat too long where a firm boundary is needed.",
  },
  INTE_low: {
    hu: "Erőforrásod az ambíció és az érdekérvényesítés. Figyeld meg: éles versenyben a kapcsolati bizalom könnyen sérülhet — a közösen rögzített játékszabályok védik.",
    en: "Your asset is ambition and self-assertion. Worth watching: in sharp competition relational trust can erode — shared ground rules protect it.",
  },
  RESO_high: {
    hu: "Erőforrásod az érzelmi ráhangolódás és a mély kapcsolódás. Figyeld meg: tartós nyomás alatt gyorsabban merülhetsz ki — a stresszkezelő rutin nálad nem extra, hanem alapfelszerelés.",
    en: "Your asset is emotional attunement and deep connection. Worth watching: sustained pressure may drain you faster — a stress routine is core equipment for you, not an extra.",
  },
  RESO_low: {
    hu: "Erőforrásod a nyugalom nyomás alatt. Figyeld meg: mások ezt megélhetik távolságtartásnak — a támogató visszajelzést néha ki is kell mondanod, nem elég érezni.",
    en: "Your asset is calm under pressure. Worth watching: others may read it as distance — supportive feedback sometimes needs to be said out loud, not just felt.",
  },
  TEMP_high: {
    hu: "Erőforrásod az energia és a társas jelenlét. Figyeld meg: a csendesebb hangok melletted elhalkulhatnak — tudatosan érdemes teret nyitnod nekik.",
    en: "Your asset is energy and social presence. Worth watching: quieter voices can fade around you — opening space for them takes intention.",
  },
  TEMP_low: {
    hu: "Erőforrásod a mély fókusz és az önállóság. Figyeld meg: a kisebb láthatóság alulértékeltséghez vezethet — az eredményeidnek néha hangot kell adni.",
    en: "Your asset is deep focus and autonomy. Worth watching: low visibility can lead to being undervalued — results sometimes need a voice.",
  },
  ADAP_high: {
    hu: "Erőforrásod a harmónia és a kohézió építése. Figyeld meg: a nehéz konfrontációk halogatása hosszabb távon többe kerülhet, mint maga a konfliktus.",
    en: "Your asset is building harmony and cohesion. Worth watching: postponing hard confrontations can cost more over time than the conflict itself.",
  },
  ADAP_low: {
    hu: "Erőforrásod az egyenesség és a vitaképesség. Figyeld meg: az éles reakciók csökkenthetik a biztonságérzetet körülötted — a tempó lassítása gyakran többet hoz.",
    en: "Your asset is directness and willingness to debate. Worth watching: sharp reactions can reduce the sense of safety around you — slowing the tempo often gains more.",
  },
  THOR_high: {
    hu: "Erőforrásod a megbízható végrehajtás. Figyeld meg: a struktúra iránti igény rugalmatlanságba fordulhat, amikor a terep gyorsabban változik, mint a terv.",
    en: "Your asset is dependable execution. Worth watching: the need for structure can turn rigid when the terrain changes faster than the plan.",
  },
  THOR_low: {
    hu: "Erőforrásod az improvizáció és az adaptivitás. Figyeld meg: a részletek és határidők könnyebben csúszhatnak — egy külső struktúra (rendszer vagy társ) sokat segít.",
    en: "Your asset is improvisation and adaptivity. Worth watching: details and deadlines slip more easily — external structure (a system or a partner) helps a lot.",
  },
  OPEN_high: {
    hu: "Erőforrásod a kíváncsiság és az újító gondolkodás. Figyeld meg: az új ötletek vonzása elviheti a fókuszt a befejezésről — a lezárás tudatosságot igényel.",
    en: "Your asset is curiosity and inventive thinking. Worth watching: the pull of new ideas can draw focus away from finishing — closure takes intention.",
  },
  OPEN_low: {
    hu: "Erőforrásod a stabilitás és a bevált módszerek ismerete. Figyeld meg: gyors változás idején a megszokotthoz ragaszkodás lassíthat — kis, biztonságos kísérletek segítenek.",
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
  INTE_high: {
    hu: {
      stress: "Nyomás alatt hajlamos lehetsz még szigorúbban ragaszkodni az elvekhez, és nehezebben kötsz praktikus kompromisszumot.",
      blindspot: "Mások rugalmasabb megoldásait elvtelenségként olvashatod, pedig gyakran csak más a prioritásuk.",
    },
    en: {
      stress: "Under pressure you may hold to principles even more rigidly and find practical compromise harder.",
      blindspot: "You may read others' more flexible solutions as unprincipled, when they often just weigh priorities differently.",
    },
  },
  INTE_low: {
    hu: {
      stress: "Nyomás alatt az eredmény-fókusz felerősödhet, és a kapcsolati költségek könnyebben kicsúszhatnak a látóteredből.",
      blindspot: "A környezeted óvatosabbá válhat veled, mielőtt ezt bármi jelezné.",
    },
    en: {
      stress: "Under pressure the focus on results can intensify, and relational costs slip out of view more easily.",
      blindspot: "People may grow guarded around you before anything signals it.",
    },
  },
  RESO_high: {
    hu: {
      stress: "Nyomás alatt az érzelmi terhelés gyorsabban összeadódik: a feszültség alvásban, döntéshalogatásban vagy túlpörgésben jelenhet meg.",
      blindspot: "Mások problémáit is a válladra veszed, és ez kívülről sokáig nem látszik.",
    },
    en: {
      stress: "Under pressure emotional load compounds quickly: tension may show up as poor sleep, delayed decisions, or overdrive.",
      blindspot: "You may carry others' problems as well — often invisible from the outside for a long time.",
    },
  },
  RESO_low: {
    hu: {
      stress: "Nyomás alatt a nyugalmad stabil marad, de a kommunikációd tömörebbé, tárgyszerűbbé válhat.",
      blindspot: "A körülötted lévők ilyenkor több megnyugtatást igényelnének, mint amennyit magadtól adnál.",
    },
    en: {
      stress: "Under pressure your calm holds, but your communication can turn terse and purely factual.",
      blindspot: "People around you may need more reassurance than you would naturally give.",
    },
  },
  TEMP_high: {
    hu: {
      stress: "Nyomás alatt felpöröghet a tempód: több beszéd, gyorsabb döntés, kevesebb meghallgatás.",
      blindspot: "A csend a csapatban ilyenkor nem egyetértés, hanem visszahúzódás is lehet.",
    },
    en: {
      stress: "Under pressure your tempo can spike: more talking, faster decisions, less listening.",
      blindspot: "Silence in the team may mean withdrawal rather than agreement.",
    },
  },
  TEMP_low: {
    hu: {
      stress: "Nyomás alatt hajlamos lehetsz még inkább befelé fordulni és egyedül megoldani a dolgokat.",
      blindspot: "A környezeted ezt távolságtartásnak vagy érdektelenségnek olvashatja.",
    },
    en: {
      stress: "Under pressure you may turn further inward and solve things alone.",
      blindspot: "Others can read this as distance or disinterest.",
    },
  },
  ADAP_high: {
    hu: {
      stress: "Nyomás alatt a béke megőrzése kerülhet előtérbe: engedhetsz ott is, ahol a saját határaid védelme lenne a dolgod.",
      blindspot: "A felgyülemlett, ki nem mondott feszültség később váratlan helyen jön elő.",
    },
    en: {
      stress: "Under pressure keeping the peace can take over: you may yield even where guarding your own boundary is the job.",
      blindspot: "Unspoken tension accumulates and surfaces later in unexpected places.",
    },
  },
  ADAP_low: {
    hu: {
      stress: "Nyomás alatt a reakcióid élesebbé válhatnak, és a vita hamarabb személyessé fordulhat, mint szeretnéd.",
      blindspot: "Amit te őszinteségnek élsz meg, azt mások támadásként dekódolhatják.",
    },
    en: {
      stress: "Under pressure your reactions can sharpen, and debate may turn personal sooner than you would like.",
      blindspot: "What you experience as honesty, others may decode as attack.",
    },
  },
  THOR_high: {
    hu: {
      stress: "Nyomás alatt a kontroll-igény nőhet: több ellenőrzés, nehezebb delegálás, merevebb tervek.",
      blindspot: "A tökéletesítés gyakran az „elég jó, időben” rovására megy.",
    },
    en: {
      stress: "Under pressure the need for control can grow: more checking, harder delegation, stiffer plans.",
      blindspot: "Polishing often comes at the cost of 'good enough, on time'.",
    },
  },
  THOR_low: {
    hu: {
      stress: "Nyomás alatt a struktúra tartása még nehezebbé válhat: a határidők és részletek könnyebben csúsznak.",
      blindspot: "A környezeted megbízhatósági kérdésként olvashatja azt, ami nálad prioritás-kérdés.",
    },
    en: {
      stress: "Under pressure holding structure gets even harder: deadlines and details slip more easily.",
      blindspot: "Others may read as a reliability issue what is, for you, a matter of priorities.",
    },
  },
  OPEN_high: {
    hu: {
      stress: "Nyomás alatt vonzó menekülőút lehet egy új ötlet vagy irányváltás a nehéz végrehajtás helyett.",
      blindspot: "A csapat számára a gyakori irányváltás bizonytalanságként csapódhat le.",
    },
    en: {
      stress: "Under pressure a new idea or pivot can become an appealing escape from hard execution.",
      blindspot: "For the team, frequent pivots can land as instability.",
    },
  },
  OPEN_low: {
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
  INTE: {
    hu: "Az értékőr ritkán a leghangosabb ember a szobában — inkább az, akiben a többiek ösztönösen megbíznak. Számára a nyílt lapok és a kapcsolatok minősége többet ér, mint a gyors győzelem.",
    en: "The Value Guardian is rarely the loudest person in the room — more often the one others instinctively trust. Open cards and the quality of relationships matter more to them than a quick win.",
  },
  RESO: {
    hu: "Az empata az, aki előbb veszi észre a feszültséget, mint hogy bárki kimondaná. A csapat érzelmi térképe nála van — akkor is, ha ezt senki nem kérte tőle.",
    en: "The Empath notices tension before anyone says it out loud. They hold the team's emotional map — even when nobody asked them to.",
  },
  TEMP: {
    hu: "A hajtóerő az, aki mellett beindulnak a dolgok: ahol ő van, ott tempó van. Az energiája ragadós — a csapat gyakran róla veszi a ritmust.",
    en: "The Driving Force is the person things start moving around: where they are, there is tempo. Their energy is contagious — teams often take their rhythm from them.",
  },
  ADAP: {
    hu: "A hídépítő ott dolgozik, ahol mások falakat látnak: emberek és álláspontok között. Ritkán övé a színpad — de nélküle sok megállapodás létre sem jönne.",
    en: "The Bridge-Builder works where others see walls: between people and positions. The stage is rarely theirs — but without them many agreements would never happen.",
  },
  THOR: {
    hu: "A rendszerépítő az, akinél a dolgok nem elvesznek, hanem elkészülnek. Ahol ő dolgozik, ott a káoszból folyamat lesz — és a folyamatból eredmény.",
    en: "The Architect is the one with whom things don't get lost — they get done. Where they work, chaos becomes process, and process becomes results.",
  },
  OPEN: {
    hu: "Az újító az, aki a „miért így csináljuk?” kérdést akkor is felteszi, amikor mindenki más már megszokta. A lehetőségeket hamarabb látja meg, mint a korlátokat.",
    en: "The Innovator keeps asking 'why do we do it this way?' long after everyone else stopped. They see possibilities sooner than limits.",
  },
};

export const ARCHETYPE_STORY_ADJ: Record<string, LocalizedText> = {
  INTE: {
    hu: "Nálad ezt erős belső iránytű egészíti ki: a hogyan legalább annyira számít, mint a mennyi.",
    en: "In you this is paired with a strong inner compass: the how matters as much as the how much.",
  },
  RESO: {
    hu: "Nálad ezt erős érzelmi ráhangolódás színezi: nemcsak látod a helyzeteket, érzed is, mi történik a másikkal.",
    en: "In you this is coloured by strong emotional attunement: you don't just see situations, you feel what's happening in the other person.",
  },
  TEMP: {
    hu: "Nálad ehhez lendület társul: nemcsak képviseled, amit fontosnak tartasz — energiát is adsz köré.",
    en: "In you this comes with momentum: you don't just stand for what matters — you energise it.",
  },
  ADAP: {
    hu: "Nálad ezt türelmes, együttműködő stílus egészíti ki: a közös nevező megtalálása nem engedmény, hanem módszer.",
    en: "In you this is paired with a patient, collaborative style: finding common ground isn't a concession, it's a method.",
  },
  THOR: {
    hu: "Nálad ehhez módszeresség társul: amit elkezdesz, annak szerkezete és vége is van.",
    en: "In you this comes with method: what you start has structure — and an ending.",
  },
  OPEN: {
    hu: "Nálad ezt kísérletező szemlélet színezi: a bevált mellé mindig odateszed a „mi lenne, ha” kérdést.",
    en: "In you this is coloured by an experimental streak: next to the proven, you always place the 'what if'.",
  },
};

/** Archetípus-történet a domináns + második dimenzióból (P5.6). */
export function buildArchetypeStory(
  primaryCode: string,
  secondaryCode: string,
  lang: Locale,
): string | null {
  const noun = ARCHETYPE_STORY_NOUN[primaryCode]?.[lang];
  const adj = ARCHETYPE_STORY_ADJ[secondaryCode]?.[lang];
  if (!noun || !adj) return null;
  return `${noun} ${adj}`;
}

// ─── Együttműködés-fejezet (P4.2 v1) ─────────────────────────────────────────
// „Csapatban működve" oldal tartalma — dimenzió-szintű, nem archetípus-
// mátrix (terv: docs/product/riport-egyuttmukodes-fejezet-terv.md).
// A súrlódás-logika a team-stats FRICTION_WEIGHTS modelljének egyszemélyes
// vetülete (THOR > ADAP > INTE a legerősebb súrlódás-jóslók). Hangnem:
// hipotézis + puha ajánlás („sokat segíthet, ha…"), nem előírás.

/** Kivel/milyen működés mellett erősödsz — a top-2 markáns dimenzióból. */
export const COLLAB_CLICK: Record<string, LocalizedText> = {
  INTE_high: {
    hu: "Természetes közeged azok mellett van, akik kimondják, amit gondolnak, és tartják, amit vállalnak — a nyílt lapokkal játszott együttműködés gyorsan kölcsönös bizalommá válik. Az erősen taktikázó működés mellett viszont sok energiád megy el a motívumok fürkészésére.",
    en: "You're in your element alongside people who say what they think and honour what they commit to — collaboration played with open cards quickly becomes mutual trust. Next to highly tactical operators, much of your energy goes into second-guessing motives.",
  },
  INTE_low: {
    hu: "Jól kattansz az ambiciózus, eredményre hajtó kollégákkal — a közös célszám és a gyors tempó összekapcsol. Egy elvhűbb társ jó ellensúly lehet: ő tartja a hosszú távú bizalmat, amíg te a lehetőségekre ugrasz.",
    en: "You click with ambitious, results-driven colleagues — shared targets and fast tempo connect you. A more principled partner can be a good counterweight: they hold long-term trust while you jump on opportunities.",
  },
  RESO_high: {
    hu: "Azok mellett működsz természetesen, akik odafigyelnek a másikra: ahol az emberi rezdüléseknek helye van, ott a ráhangolódásod erőforrás. Egy nyugodtabb, stabilabb társ jó kiegészítőd — ő adja a horgonyt, te a kapcsolati radart.",
    en: "You work naturally alongside people who pay attention to others: where human signals matter, your attunement is an asset. A calmer, steadier partner complements you well — they provide the anchor, you the relational radar.",
  },
  RESO_low: {
    hu: "Krízisben és nyomás alatt te vagy az, aki mellett mások megnyugszanak — a hasonlóan higgadt kollégákkal gyors, tárgyszerű munkakapcsolatod lesz. Az érzelmileg ráhangolódóbb társak azt hozzák, amit te ritkábban: a korai emberi jelzéseket.",
    en: "In crisis and under pressure you're the one others calm down next to — with similarly composed colleagues you build fast, matter-of-fact working relationships. More emotionally attuned partners bring what you surface less often: early human signals.",
  },
  TEMP_high: {
    hu: "Ott vagy elemedben, ahol pörög a közös munka: workshopok, gyors egyeztetések, közös terek. A csendesebb, mélyfókuszú kollégák jó párjaid — ők viszik a hosszú koncentrációt igénylő szálakat, te tartod a lendületet és a kapcsolatokat.",
    en: "You're in your element where collaboration has tempo: workshops, quick alignments, shared spaces. Quieter, deep-focus colleagues pair well with you — they carry the long-concentration threads while you keep momentum and connections.",
  },
  TEMP_low: {
    hu: "A legjobb párosaid azok, akikkel kevés, de tartalmas az egyeztetés — írásban is jól működő, önállóan dolgozó kollégák. Egy társasabb partner jól kiegészít: ő tartja a szervezet felé a kapcsolatokat, te a mélységet.",
    en: "Your best pairings are people with whom alignment is infrequent but substantive — colleagues who work well in writing and independently. A more social partner complements you: they maintain organisation-facing connections, you bring the depth.",
  },
  ADAP_high: {
    hu: "Te vagy az, aki mellett a nehéz emberekkel is működik a munka — a legtöbb stílussal összeférsz. Leginkább az egyenes, döntésre gyors társak mellett erősödsz: ők hozzák az élt, te a hidat.",
    en: "You're the one work keeps functioning next to, even with difficult people — you fit most styles. You grow strongest alongside direct, decision-quick partners: they bring the edge, you bring the bridge.",
  },
  ADAP_low: {
    hu: "Jól működsz azokkal, akik bírják az egyenes vitát, és nem sértődnek bele a kemény kérdésekbe — náluk vita után tisztább a levegő, nem nehezebb. A diplomatikusabb kollégák ott egészítenek ki, ahol a kapcsolat ápolása maga a feladat.",
    en: "You work well with people who can take a straight debate and don't bruise from hard questions — with them the air is clearer after an argument, not heavier. More diplomatic colleagues complement you where maintaining the relationship is itself the job.",
  },
  THOR_high: {
    hu: "Jól működsz azok mellett, akik tartják, amit vállalnak: a strukturáltan dolgozó, határidő-tartó kollégákkal gyorsan kialakul a kölcsönös bizalom. Jót tesz melléd egy-egy improvizatívabb társ is — ő hozza a fordulatot, te a végigvitelt, ha a szerepek kimondottak.",
    en: "You work well alongside people who keep their commitments: with structured, deadline-honouring colleagues mutual trust forms quickly. An improvisational partner also does you good — they bring the twist, you bring the follow-through, as long as roles are explicit.",
  },
  THOR_low: {
    hu: "A rugalmas, menet közben alakuló munkában vagy jó társ — a hasonlóan adaptív kollégákkal könnyen találjátok a ritmust. Egy rendszerezettebb partner sokat ad hozzád: ő fogja a szálakat, te hozod a mozgékonyságot.",
    en: "You're a good partner in flexible, evolving work — with similarly adaptive colleagues you find rhythm easily. A more systematic partner adds a lot: they hold the threads, you bring the agility.",
  },
  OPEN_high: {
    hu: "A kíváncsi, gondolkodni szerető emberekkel gyullad be nálad a közös munka — a jó vita neked nem konfliktus, hanem üzemanyag. A pragmatikusabb társak azt adják hozzá, amit az ötletek önmagukban nem: a földet érést.",
    en: "Collaboration ignites for you with curious people who like to think — a good debate is fuel for you, not conflict. More pragmatic partners add what ideas alone don't: the landing.",
  },
  OPEN_low: {
    hu: "A kiszámíthatóan, bevált módon dolgozó kollégákkal vagy a legjobb párban — közös nyelvetek a megbízhatóság. Az újító típusok mellett is jól működsz, ha te lehetsz az, aki a jó ötletet stabil gyakorlattá alakítja.",
    en: "You pair best with colleagues who work predictably, in proven ways — reliability is your shared language. You also work well next to innovators, when you can be the one who turns a good idea into stable practice.",
  },
};

/** Hol éleződhet — kétirányú megfogalmazás + egy oldó fél mondat. */
export const COLLAB_FRICTION: Record<string, LocalizedText> = {
  THOR_high: {
    hu: "A legvalószínűbb súrlódásod a tempó és a minőség körül van: a lazábban tervező kollégák munkáját megbízhatatlannak érezheted, ők pedig merevnek a rendhez való ragaszkodásod. Sokat old, ha nem a módszert kéred számon, hanem közösen rögzített határidőt és minőségi minimumot.",
    en: "Your most likely friction is around tempo and quality: looser planners can feel unreliable to you, while your hold on order can feel rigid to them. It defuses a lot to agree on shared deadlines and a quality minimum, rather than policing the method.",
  },
  THOR_low: {
    hu: "Súrlódás ott keletkezhet, ahol a struktúra maga az elvárás: a rendszerezett kollégáknak a csúszó részletek bizalmi kérdéssé válhatnak, számodra az ő folyamataik fölösleges féknek tűnhetnek. Segíthet egy közös, minimális keret — kevés, de tényleg tartott vállalás.",
    en: "Friction can arise where structure itself is the expectation: to systematic colleagues slipping details can become a trust issue, while their processes can feel like needless brakes to you. A shared minimal frame helps — few commitments, but truly kept.",
  },
  ADAP_high: {
    hu: "Nálad a súrlódás gyakran láthatatlan: kerülöd az éles vitát, de a ki nem mondott feszültség felgyűlik, és a versengőbb kollégák dominálhatják a döntéseket. Sokaknak segít egy előre kért kör: „mielőtt döntünk, hadd mondjam el az ellenvetésem”.",
    en: "Your friction is often invisible: you avoid sharp debate, but unspoken tension accumulates, and more competitive colleagues may dominate decisions. Many find it helps to request a turn in advance: 'before we decide, let me state my objection'.",
  },
  ADAP_low: {
    hu: "A leggyakoribb súrlódási pont nálad a stílus: az egyenes, gyors visszajelzéseidet a harmónia-orientált kollégák élesnek érezhetik, te pedig az ő kerülgetésüket időhúzásnak. Sokat old, ha a vita elején elhangzik: a kritika a munkának szól, nem a személynek.",
    en: "Your most common friction point is style: harmony-oriented colleagues can read your direct, fast feedback as sharp, while their circling can feel like stalling to you. It defuses a lot when the debate opens with: the critique is about the work, not the person.",
  },
  INTE_high: {
    hu: "Súrlódás ott keletkezhet, ahol a játszma a norma: a taktikázó közegben a korrektséged kihasználhatónak tűnhet, te pedig gyanakvóvá válhatsz azokkal, akik csak rugalmasabban navigálnak. Segít a különbségtétel: nem minden érdekérvényesítés manipuláció.",
    en: "Friction can arise where games are the norm: in tactical settings your fairness can look exploitable, and you may grow suspicious of people who simply navigate more flexibly. It helps to distinguish: not all self-advocacy is manipulation.",
  },
  INTE_low: {
    hu: "A versengő működésed a bizalomra érzékeny kollégáknál válthat ki súrlódást: amit te egészséges harcnak élsz meg, ők átgázolásként olvashatják. Sokat számít a látható korrektség a kis dolgokban — az tartja meg a szövetségeseket a nagy helyzetekre.",
    en: "Your competitive style can create friction with trust-sensitive colleagues: what you experience as healthy contest, they may read as steamrolling. Visible fairness in small things matters a lot — it keeps allies for the big moments.",
  },
  RESO_high: {
    hu: "Feszültség ott keletkezhet, ahol a tárgyszerű, gyors működés a norma: a hűvösebb stílusú kollégák visszajelzés-hiánya bizonytalanságot szülhet nálad, ők pedig nem értik, mi hiányzik. Sokat segít, ha az igényed konkrét formát kap: rövid, rendszeres visszajelzési pontok.",
    en: "Tension can arise where brisk, matter-of-fact operation is the norm: cooler colleagues' lack of feedback can breed uncertainty in you, while they don't see what's missing. It helps when the need takes concrete form: short, regular feedback moments.",
  },
  RESO_low: {
    hu: "Az érzelmileg intenzívebb kollégáknak a nyugalmad távolságtartásnak tűnhet, az ő reakcióik neked túlzásnak. Ritkán maga a tartalom a vita — inkább az intenzitás-különbség; segít, ha ezt ki is mondjátok.",
    en: "To more emotionally intense colleagues your calm can read as distance, while their reactions can look like overreaction to you. The dispute is rarely the content itself — more often the intensity gap; naming that helps.",
  },
  TEMP_high: {
    hu: "A csendesebb kollégák melletti súrlódásod ritkán hangos: ők egyszerűen kikapcsolnak, ha minden szóban és gyorsan történik. Sokat segít az aszinkron tér — ha írásban is lehet hozzászólni, a legjobb gondolataik is megérkeznek.",
    en: "Your friction next to quieter colleagues is rarely loud: they simply disengage when everything happens verbally and fast. Asynchronous space helps a lot — when input can come in writing, their best thinking arrives too.",
  },
  TEMP_low: {
    hu: "A pörgős, meeting-vezérelt közeg neked energiavesztés, a társasabb kollégáknak viszont a visszahúzódásod tűnhet távolságtartásnak. Segíthet egy kimondott működési megállapodás: mikor vagy elérhető élőben, és mi megy írásban.",
    en: "A fast, meeting-driven environment drains you, while to more social colleagues your withdrawal can look like distance. An explicit working agreement can help: when you're available live, and what goes in writing.",
  },
  OPEN_high: {
    hu: "A pragmatikus végrehajtókkal ott súrlódhatsz, ahol az ötleteid az ő stabil folyamataikat borítják — számukra a gyakori irányváltás kockázat, számodra az állandóság stagnálás. Segít a kettéválasztás: kísérleti sáv az újnak, védett sáv a működőnek.",
    en: "You may grate against pragmatic executors where your ideas upset their stable processes — to them frequent pivots are risk, to you constancy is stagnation. Separating lanes helps: an experimental track for the new, a protected track for what works.",
  },
  OPEN_low: {
    hu: "Az újító kollégák tempója ellenállást válthat ki nálad — te a bizonyítottat véded, ők a lehetőséget. A súrlódás akkor csökken, ha a „miért váltsunk?” kérdésre valódi választ kapsz, nem lelkesedést.",
    en: "The tempo of innovator colleagues can trigger resistance in you — you defend the proven, they the possible. Friction drops when 'why change?' gets a real answer, not just enthusiasm.",
  },
};

/** Pszichológiai biztonság + vezetői közeg — puha framinggel („sokat segíthet, ha…"). */
export const COLLAB_NEEDS: Record<string, LocalizedText> = {
  INTE_high: {
    hu: "Akkor hozod a legjobb formád, ahol a kimondott értékek és a napi gyakorlat egybeesnek. Sokaknak, akiknél ilyen erős a becsületesség-alázat, az segít, ha a vezetőjük átláthatóan dönt, és a kényes ügyek nem a folyosón dőlnek el.",
    en: "You're at your best where stated values and daily practice match. For many with integrity this strong, it helps when their leader decides transparently and sensitive matters aren't settled in the corridor.",
  },
  INTE_low: {
    hu: "Neked a tiszta célok és a valódi tét adják a hajtóerőt. Sokat segíthet egy olyan vezető, aki egyértelmű játékteret jelöl ki — mit szabad, hol a határ —, és az eredményt ismeri el, nem a látszatot.",
    en: "Clear goals and real stakes are what drive you. A leader who marks out the playing field — what's allowed, where the line is — and recognises results over appearances can help a lot.",
  },
  RESO_high: {
    hu: "Akkor hozod a legjobb formád, ha a hibázás nem jár megszégyenítéssel: a biztonságos, kiszámítható légkör nálad nem komfort, hanem teljesítmény-feltétel. Sokaknak hasonló profillal a rendszeres, rövid visszajelzési pontok válnak be — nyomás alatt is.",
    en: "You're at your best when mistakes don't come with shaming: a safe, predictable climate isn't comfort for you, it's a performance condition. For many with a similar profile, regular short feedback moments work best — even under pressure.",
  },
  RESO_low: {
    hu: "Neked a bizalom jele az önállóság: akkor működsz jól, ha nem kell folyamatos érzelmi visszaigazolást adnod vagy kapnod. Sokat segíthet, ha a környezeted tudja: a nyugalmad nem közöny — így nem olvassák félre.",
    en: "For you, autonomy is the signal of trust: you work well when constant emotional reassurance isn't required in either direction. It helps when those around you know your calm isn't indifference — so it doesn't get misread.",
  },
  TEMP_high: {
    hu: "Az energiád a közös térből jön: akkor virulsz, ha van élő munka, látható szerep és gyors visszacsatolás. Sokaknak hasonló profillal az segít, ha a vezetőjük teret ad a színpadra — miközben a csendes munkát is elismeri, nem csak a hangosat.",
    en: "Your energy comes from shared space: you thrive with live collaboration, a visible role, and fast feedback. For many with this profile it helps when their leader gives stage room — while also recognising quiet work, not just the loud kind.",
  },
  TEMP_low: {
    hu: "A mély fókusz a te üzemmódod: akkor teljesítesz, ha vannak megszakítás-mentes sávjaid, és nem a jelenlét számít, hanem az eredmény. Sokat segíthet, ha a láthatóság alacsony küszöbű formát kap — írásos összefoglaló, nem színpad.",
    en: "Deep focus is your operating mode: you perform when you have uninterrupted stretches and results count over presence. It helps when visibility comes in low-threshold forms — a written summary, not a stage.",
  },
  ADAP_high: {
    hu: "Akkor vagy elemedben, ahol az együttműködés nem harc: a kollegiális, egymást kisegítő közeg megsokszoroz. Sokaknak hasonló profillal az segít, ha a vezetőjük észreveszi a csendes engedményeket — és nem hagyja, hogy mindig ugyanaz engedjen.",
    en: "You're in your element where collaboration isn't combat: a collegial, mutually supportive setting multiplies you. For many with this profile it helps when their leader notices the quiet concessions — and doesn't let the same person always be the one to yield.",
  },
  ADAP_low: {
    hu: "Neked az őszinte vita a normális üzemmód: ott működsz jól, ahol az ellentmondás nem szentségtörés. Sokat segíthet egy olyan közeg, ahol a döntési szabályok tiszták — így az éles vita a döntésnél le tud zárulni.",
    en: "Honest debate is your normal mode: you work well where disagreement isn't sacrilege. A setting with clear decision rules helps a lot — so a sharp debate can actually close at the decision.",
  },
  THOR_high: {
    hu: "Akkor hozod a maximumod, ha a célok, felelősségek és határidők kimondottak — a homály neked nem szabadság, hanem kockázat. Sokaknak hasonló profillal az válik be, ha a változásokat indoklással kapják, nem kész tényként.",
    en: "You deliver your best when goals, responsibilities, and deadlines are explicit — ambiguity isn't freedom to you, it's risk. For many with this profile, changes land best with reasoning attached, not as fait accompli.",
  },
  THOR_low: {
    hu: "Neked a mozgástér a teljesítmény-feltétel: mikromenedzsment alatt gyorsan kopsz. Sokat segíthet, ha az elvárás eredmény-szinten rögzül — a hogyan maradhat nálad.",
    en: "Room to manoeuvre is your performance condition: you wear down fast under micromanagement. It helps when expectations are fixed at the outcome level — leaving the how with you.",
  },
  OPEN_high: {
    hu: "Akkor virulsz, ha van mit tanulni és van mit alakítani: a befagyott működés neked lassú kiégés. Sokaknak hasonló profillal az segít, ha a szerepükben van egy védett kísérleti sáv — akár kicsi, de valódi.",
    en: "You thrive when there's something to learn and something to shape: frozen routines are slow burnout for you. For many with this profile it helps to have a protected experimental lane in the role — small, but real.",
  },
  OPEN_low: {
    hu: "Neked a stabil alapok adják a biztonságot: akkor teljesítesz, ha a változás bevezetése átgondolt, nem hirtelen. Sokat segíthet, ha az újdonság lépcsőzetesen érkezik — idő a begyakorlásra, mielőtt a következő jön.",
    en: "Stable foundations are your safety: you perform when change is introduced deliberately, not abruptly. It helps when novelty arrives in steps — time to consolidate before the next wave.",
  },
};

/** Kiegyensúlyozott profil — nincs pólusos dimenzió. */
export const COLLAB_BALANCED_CLICK: LocalizedText = {
  hu: "Kiegyensúlyozott profillal sokféle működésmód mellett megtalálod a ritmust — az illeszkedésed kevésbé személyiség-, inkább szerep- és célfüggő.",
  en: "With a balanced profile you find rhythm next to many working styles — your fit depends less on personality and more on role and goals.",
};

export const COLLAB_BALANCED_FRICTION: LocalizedText = {
  hu: "Nálad ritkán a személyiség a súrlódás fő forrása — a profilod egyik irányban sem szélsőséges. Ha mégis feszültség keletkezik, érdemes először a szerepek és elvárások tisztaságát megnézni: az ilyen profiloknál többnyire ott a gyökér.",
  en: "Personality is rarely the main source of friction for you — your profile isn't extreme in any direction. When tension does arise, look first at role and expectation clarity: for profiles like yours, that's usually where the root is.",
};

// ─── Growth tips (P2.4, P5.5-ben háromlépcsőssé bővítve) ─────────────────────
// A legalacsonyabb dimenzióhoz konkrét, kipróbálható fejlődési ív:
// viselkedés (mit próbálj ki) → reflexiós kérdés (mit figyelj meg magadon)
// → mérhető kihívás (miből látod, hogy változott valami). Kis szokások,
// nem személyiség-átalakítás; a hangnem meghívó, nem előíró.

export type GrowthPlan = { behavior: string; reflection: string; challenge: string };

export const DIMENSION_GROWTH_TIPS: Record<string, Record<Locale, GrowthPlan>> = {
  INTE: {
    hu: {
      behavior: "A következő versenyhelyzet előtt rögzítsd magadnak írásban, mi az a határ, amin nem mész túl. Egy mondat elég.",
      reflection: "Hol húztad meg utoljára a határt egy éles helyzetben — és utólag megérte?",
      challenge: "Egy hónapon át vezesd: hány helyzetben tartottad a saját határodat. A cél nem a tökéletesség, hanem hogy lásd a mintát.",
    },
    en: {
      behavior: "Before your next competitive situation, write down the line you won't cross. One sentence is enough.",
      reflection: "Where did you last draw the line in a heated situation — and was it worth it in hindsight?",
      challenge: "For one month, track how often you held your own line. The goal isn't perfection — it's seeing the pattern.",
    },
  },
  RESO: {
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
  TEMP: {
    hu: {
      behavior: "Vállalj havonta egy kis láthatósági alkalmat: rövid demó, csapat-összefoglaló vagy írásos státusz — a formát te választod.",
      reflection: "Mi az a munkád, amiről a csapat nem is tud, pedig büszke vagy rá?",
      challenge: "A következő hónapban egyszer mutasd meg a munkád 5 percben — és számold, hány visszajelzést, kérdést hoz.",
    },
    en: {
      behavior: "Take on one small visibility moment per month: a short demo, a team recap, or a written status — you choose the format.",
      reflection: "What work are you proud of that your team doesn't even know about?",
      challenge: "Once next month, show your work in 5 minutes — and count the feedback and questions it brings.",
    },
  },
  ADAP: {
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
  THOR: {
    hu: {
      behavior: "Válassz egyetlen visszatérő bosszúságot (pl. csúszó határidő), és építs rá egy minimális rendszert: heti 15 perc tervezés vagy egy közös checklist.",
      reflection: "Melyik elmaradt részlet okozta a legtöbb utómunkát az elmúlt hónapban?",
      challenge: "Két hétig tartsd a heti 15 perces tervezőt — a végén nézd meg, hány vállalás csúszott a korábbi időszakhoz képest.",
    },
    en: {
      behavior: "Pick one recurring annoyance (e.g. slipping deadlines) and build a minimal system around it: 15 minutes of weekly planning or a shared checklist.",
      reflection: "Which missed detail caused the most rework last month?",
      challenge: "Keep the 15-minute weekly planning slot for two weeks — then compare how many commitments slipped versus before.",
    },
  },
  OPEN: {
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
  INTE_high: {
    hu: "A magas becsületesség-alázat pontszámod emellett azt jelzi: hosszú távon olyan közegben maradsz meg, ahol a kimondott értékek és a napi gyakorlat egybeesnek.",
    en: "Your high integrity adds a nuance: long term, you stay in settings where stated values and daily practice actually match.",
  },
  INTE_low: {
    hu: "Az erős eredmény-orientációd emellé versengő, célszámokkal dolgozó közeget kíván — a tisztán konszenzusos kultúra lassú lehet neked.",
    en: "Your strong results-orientation calls for a competitive, target-driven setting alongside this — purely consensus-based cultures may feel slow.",
  },
  RESO_high: {
    hu: "Az erős rezonanciád emberközeli, támogató kultúrát igényel emellé — pusztán tranzakcionális közegben gyorsabban kopsz.",
    en: "Your high emotionality needs a people-centred, supportive culture alongside this — in purely transactional settings you wear down faster.",
  },
  RESO_low: {
    hu: "Az érzelmi stabilitásod miatt a magas téttel, nyomással járó változatok is jól működhetnek nálad.",
    en: "Thanks to your emotional stability, high-stakes, high-pressure variants of these roles can also work well for you.",
  },
  TEMP_high: {
    hu: "A magas társas energiád a látható, emberekkel sűrűn dolgozó változatok felé billent — a hosszú, izolált munka kevésbé táplál.",
    en: "Your high extraversion tilts this toward visible, people-facing variants — long isolated work feeds you less.",
  },
  TEMP_low: {
    hu: "Az alacsonyabb társas energiád miatt a mély, önálló fókuszt engedő változatok illenek jobban, mint a folyamatos reprezentáció.",
    en: "With lower extraversion, variants that allow deep, independent focus fit better than constant representation.",
  },
  ADAP_high: {
    hu: "Az erős barátságosság pontszámod az együttműködés-intenzív, sok egyeztetéssel járó változatok felé billent.",
    en: "Your strong agreeableness tilts this toward collaboration-heavy, coordination-rich variants.",
  },
  ADAP_low: {
    hu: "Az egyenes, konfrontációt vállaló stílusod ott érték, ahol vitatkozni és dönteni kell — harmónia-központú közegben súrlódhat.",
    en: "Your direct, confrontation-ready style is an asset where debate and decisions are the job — it may grate in harmony-centred settings.",
  },
  THOR_high: {
    hu: "A magas lelkiismeretességed a strukturált, végigvihető folyamatokra épülő változatokban kamatozik leginkább.",
    en: "Your high orderliness pays off most in structured variants built on processes you can see through to the end.",
  },
  THOR_low: {
    hu: "Az alacsonyabb lelkiismeretesség pontszámod miatt a rugalmas, improvizációt engedő változatok természetesebbek, mint a szigorú folyamatkövetés.",
    en: "With lower orderliness, flexible variants that allow improvisation feel more natural than strict process-following.",
  },
  OPEN_high: {
    hu: "A magas nyitottságod az újdonságot és tanulást kínáló változatok felé húz — a tisztán rutin-alapú szerepek hamar szűkösek lehetnek.",
    en: "Your high openness pulls toward variants offering novelty and learning — purely routine-based roles can feel narrow quickly.",
  },
  OPEN_low: {
    hu: "A bevált módszerek iránti preferenciád a kiszámítható, stabil működésű változatokban erőforrás.",
    en: "Your preference for proven methods is an asset in predictable, stable variants of these roles.",
  },
};

// ─── Solo dim role texts (Block 5 ha nincs tension pár) ──────────────────────

export const SOLO_DIM_ROLE_TEXTS: Record<string, Record<Locale, { strong: string; medium: string; watchOut: string }>> = {
  INTE_high: {
    hu: {
      strong: "Magas bizalmi elvárású, átláthatóságra épülő területek: megfelelőség (compliance), etikai tanácsadás, szabályozás, közszféra, nonprofit.",
      medium: "Bármely vezetői vagy szakértői szerep, ahol az átláthatóság és a feddhetetlenség tényleges elvárás.",
      watchOut: "Fárasztó lehet, ha a kimondott értékek és a napi gyakorlat eltér. Már az elején érdemes tisztázni a határokat és alapelveket.",
    },
    en: {
      strong: "High-trust roles with clear ethical standards: compliance, ethics advisory, nonprofit, public service, regulatory functions.",
      medium: "Any leadership or expert role where integrity and transparency are real requirements, not just messaging.",
      watchOut: "It can be draining when stated values and day-to-day practice don't match. Align early on boundaries and shared principles.",
    },
  },
  INTE_low: {
    hu: {
      strong: "Versengő, eredményorientált közegek: üzletfejlesztés, értékesítés, növekedés (growth), vállalkozás, tárgyalásintenzív szerepek.",
      medium: "Vezetői, projekt- vagy stratégiai szerepek, ahol az ambíció és az önbizalom húzóerő.",
      watchOut: "Ha a verseny „ember ellen” megy, romolhat a csapatdinamika. Tartsd fókuszban a közös célokat és játékszabályokat.",
    },
    en: {
      strong: "Competitive, outcome-driven settings: business development, sales, growth, entrepreneurship, negotiation-heavy roles.",
      medium: "Leadership, project, or strategy roles where ambition and confidence are a tailwind.",
      watchOut: "If competition turns into people-versus-people, team dynamics can suffer. Keep it aimed at shared goals and clear rules of play.",
    },
  },
  RESO_high: {
    hu: {
      strong: "Emberközeli, támogató szerepek: HR, coaching/mentoring, egészségügy vagy szociális terület, ügyfélélmény.",
      medium: "Kapcsolati szerepek (ügyfélmunka, oktatás, tárgyalás), ahol az empátia kézzelfogható értéket teremt.",
      watchOut: "Tartós nyomás és kiszámíthatatlanság kimerítő lehet. Számolj tudatos pihenőkkel, és legyen stabil stresszkezelési rutinod.",
    },
    en: {
      strong: "Supportive, people-centered roles: HR, coaching/mentoring, healthcare or social services, customer experience.",
      medium: "Relationship-heavy roles (customer work, teaching, negotiation) where empathy creates tangible value.",
      watchOut: "Sustained pressure and unpredictability can wear you down. Plan recovery time and keep a simple stress-management routine.",
    },
  },
  RESO_low: {
    hu: {
      strong: "Nagy nyomású döntési és krízishelyzetek, ahol a nyugalom versenyelőny.",
      medium: "Változásvezetés, transzformáció, startup: ahol a bizonytalanság a munka része.",
      watchOut: "A stabilitásod néha ridegségnek tűnhet. Mondd ki aktívan a szándékaidat és az együttérzést is, ne csak a tényeket.",
    },
    en: {
      strong: "High-pressure decision roles and crisis contexts where calm is an advantage.",
      medium: "Change leadership, transformation, startups, where uncertainty is part of the job.",
      watchOut: "Your steadiness can be read as coldness. Name your intent and empathy explicitly, not only the facts.",
    },
  },
  TEMP_high: {
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
  TEMP_low: {
    hu: {
      strong: "Mély fókuszt adó, önálló szerepek: elemzés, fejlesztés, kutatás, stratégia, technikai szakértői munka.",
      medium: "Kis csapat, aszinkron együttműködés is jól működhet, ha marad elég csendes/időzített fókuszidő.",
      watchOut: "Sok szerepléssel és állandó kapcsolatépítéssel járó szerepek kimeríthetnek. Legyenek határaid a megbeszélések és a nyilvános jelenlét körül.",
    },
    en: {
      strong: "Deep-focus, autonomous roles: analysis, engineering, research, strategy, technical expertise.",
      medium: "Small-team or async collaboration works well when you still have protected focus time.",
      watchOut: "Highly social, always-on visibility roles can exhaust you. Set boundaries around meetings and public-facing moments.",
    },
  },
  ADAP_high: {
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
  ADAP_low: {
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
  THOR_high: {
    hu: {
      strong: "Hosszabb, komplex projektek és üzemeltetés: programvezetés, minőségbiztosítás, szabályozás/compliance.",
      medium: "Strukturált szakértői szerepek, ahol a pontosság és a következetes kivitelezés alap.",
      watchOut: "Frusztráló, ha a munka „sosem záródik le”, vagy a döntések húzódnak. Tisztázd előre, mi számít késznek és mi a határidő.",
    },
    en: {
      strong: "Complex, longer-cycle work: operations, program management, QA, policy, compliance.",
      medium: "Structured expert roles where precision and consistent execution are the baseline.",
      watchOut: "It's frustrating when work never closes or decisions drag on. Define what done means and by when.",
    },
  },
  THOR_low: {
    hu: {
      strong: "Gyors, kísérletezős közegek: startup, kreatív ipar, agilis csapatok, prototípus-készítés.",
      medium: "Felfedező, ötletelő szerepek, ahol a gyors iteráció és a váltás érték.",
      watchOut: "Hosszú, részletes kivitelezés megterhelő lehet. Jó párosítás egy strukturáltabb társ vagy egy erős folyamatkeret.",
    },
    en: {
      strong: "Fast-moving, experimental environments: startups, creative teams, agile product work, prototyping.",
      medium: "Exploration and idea-generation roles where quick iteration is the point.",
      watchOut: "Long, detail-heavy execution can be draining. Pair with someone (or a process) that carries structure to the finish.",
    },
  },
  OPEN_high: {
    hu: {
      strong: "Új ötleteket és komplex gondolkodást igénylő szerepek: kutatás, stratégia, design, termék/innováció, vállalkozás.",
      medium: "Oktatás, tanácsadás, coaching, ahol a perspektívaváltás és kíváncsiság hozza a pluszt.",
      watchOut: "A lezárás néha nehezebb, mint a felfedezés. Segít az időkeret (timebox) és a „kész” kritériumainak előre rögzítése.",
    },
    en: {
      strong: "Roles that reward novelty and complex thinking: research, strategy, design, product/innovation, entrepreneurship.",
      medium: "Teaching, consulting, coaching where curiosity and reframing create value.",
      watchOut: "Closing can be harder than exploring. Use timeboxes and set clear endpoints upfront.",
    },
  },
  OPEN_low: {
    hu: {
      strong: "Stabil, végrehajtás- és megbízhatóság-központú szerepek: üzemeltetés, bevezetés, folyamatműködtetés.",
      medium: "Optimalizálás és rendszerszintű problémamegoldás, ahol a tapasztalatból jön a minőség.",
      watchOut: "Radikálisan új irányoknál könnyen nő a feszültség. Kérj fokozatos bevezetést: pilot, mérföldkövek, kontrollált kockázat.",
    },
    en: {
      strong: "Execution and stability-focused roles: operations, implementation, maintenance, process work.",
      medium: "Optimization and system-level problem solving where experience drives quality.",
      watchOut: "Pressure for radical experimentation can create friction. Ask for a gradual approach: pilots, milestones, controlled risk.",
    },
  },
};
