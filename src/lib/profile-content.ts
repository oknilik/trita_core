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
  hu: "Gondolj rá iránytűként: segít tisztábban látni, hol működsz a legerősebben, és hol érdemes tudatosabban működni. A többi már rajtad múlik.",
  en: "Treat it as a compass: it helps you see where you’re strongest, and where being more deliberate pays off. The rest is up to you.",
};

// ─── Dimenzió nevek (Block 2 megjelenítőhöz) ─────────────────────────────────

export const DIM_LABELS: Record<string, LocalizedText> = {
  H: { hu: "Őszinteség-Alázat", en: "Honesty-Humility" },
  E: { hu: "Érzelmi érzékenység", en: "Emotionality" },
  X: { hu: "Extraverzió", en: "Extraversion" },
  A: { hu: "Együttműködés", en: "Agreeableness" },
  C: { hu: "Lelkiismeretesség", en: "Conscientiousness" },
  O: { hu: "Nyitottság", en: "Openness" },
};

export const CATEGORY_LABELS: Record<ProfileCategory, LocalizedText> = {
  high: { hu: "magas", en: "high" },
  medium: { hu: "közepes", en: "medium" },
  low: { hu: "alacsony", en: "low" },
};

// ─── Block 3 – Működési narratíva (tension-specifikus szövegek) ───────────────

export const RESOLUTION_NARRATIVES: Record<string, LocalizedText> = {
  ethicalLeader: {
    hu: "Etikai elvhűséged és láthatóságigényed ritka, de erős kombináció. Nem a rivaldafény vonz, hanem az, hogy hitelesnek látjanak. Olyan szerepekben teljesítesz igazán, ahol a hitelesség maga a tőke.",
    en: "Your ethical integrity combined with a need for visibility is a rare but powerful combination. You are not drawn to the spotlight for its own sake, but to being seen as authentic. You thrive in roles where credibility is the currency.",
  },
  principledConfronter: {
    hu: "Elvhű vagy és konfrontatív – nem hazudsz, de nem is kerülöd a nehéz beszélgetéseket. Ez a profil természetes közege etikai vizsgálatoknál, szabályozói munkában vagy bárhol, ahol a kellemetlen igazságot ki kell mondani.",
    en: "You are principled and confrontational — you don't lie, and you don't avoid difficult conversations. This profile finds its natural home in ethical investigations, regulatory work, or anywhere the uncomfortable truth needs to be voiced.",
  },
responsibleInnovator: {
  hu: "Nyitott vagy az új megközelítésekre, ugyanakkor döntéseidet egy erős belső értékrend vezérli. Számodra az innováció nem öncélú, hanem tudatos és felelősségteljesen megvalósított.",
  en: "You are open to new approaches, yet guided by a strong inner value system. For you, innovation is not self-serving but intentional and carried out with a sense of responsibility.",
},
  supportedVisibility: {
    hu: "A társas jelenlét energizál, de a stressz hamar megterhel. Olyan szerepek a legjobbak, ahol van visszajelzés, biztonság és megbecsülés – nem pusztán elvárás és nyomás.",
    en: "Social presence energizes you, but stress quickly takes its toll. Roles with feedback, psychological safety, and recognition work best — not just expectations and pressure.",
  },
  structuredStability: {
    hu: "Magas önelvárásod és stresszérzékenységed kombinációja komoly energiagazdálkodást igényel. Kiszámítható, strukturált, támogató környezetben hozod ki a legjobbat magadból.",
    en: "The combination of high self-expectations and stress sensitivity requires careful energy management. You bring out the best in yourself in predictable, structured, supportive environments.",
  },
  safeExperimentation: {
    hu: "Az ismeretlen vonz, de szorongást is okozhat. A legjobban olyan innovációs környezetben működsz, ahol van biztonsági háló: nem kell mindent egyszerre kockáztatni.",
    en: "The unknown draws you in, but can also cause anxiety. You function best in innovation environments with a safety net — where not everything needs to be risked at once.",
  },
  deepCollaboration: {
    hu: "Nem a tömeget kerülöd, hanem a felszínes interakciót. Kiscsoportos, hosszú távú, bizalmi alapú együttműködésben teljesítesz – ahol nem kell mindenkivel barátkozni, csak a munkatársakkal.",
    en: "It's not crowds themselves you avoid — it's superficial interaction. You perform best in small-group, long-term, trust-based collaboration, where you don't need to befriend everyone, only your close collaborators.",
  },
  solitaryInnovator: {
    hu: "Nem a közös ötletelésben dolgozod ki az ötleteidet, hanem egyedül. A belső világ gazdagsága és az újdonságkeresés különleges profilt ad: szoliter kutató, stratégiai elemző, architekt típusú szerepek.",
    en: "You don't develop your ideas in brainstorms — you do it alone. The richness of your inner world combined with a drive for novelty creates a distinctive profile: solitary researcher, strategic analyst, architect-type roles.",
  },
  facilitatedInnovation: {
    hu: "Innoválsz, de konszenzussal. Nem tolod rá az ötleteidet, hanem bevonod a többieket. Design thinking, participatív tervezés, workshopvezetés – ahol az innováció közös munka.",
    en: "You innovate, but through consensus. You don't push your ideas on others; you involve them. Design thinking, participatory design, workshop facilitation — where innovation is a shared endeavor.",
  },
  structuredCompetitor: {
    hu: "Ambiciózus és fegyelmezett – a versengés strukturált közegben a legerősebb fegyver. Nem politikával, hanem teljesítménnyel nyersz.",
    en: "Ambitious and disciplined — competition is your strongest asset in a structured environment. You win not through politics, but through performance.",
  },
  structuredInnovator: {
    hu: "Vonzódsz az újszerű problémákhoz, de a legjobb munkádat strukturált keretek között végzed. Ez nem ellentmondás – hanem a keretezett innováció természetes profilja.",
    en: "You are drawn to novel problems, but you do your best work within structured frameworks. This is not a contradiction — it is the natural profile of structured innovation.",
  },
  resilientLeader: {
    hu: "Érzelmi stabilitásod és társas energiád ritka kombináció: magas nyomású, emberekkel teli helyzetekben akkor is tartod az irányt, amikor mások elbizonytalanodnak. A stressz nem rombolja a kapcsolataidat – éppen ellenkezőleg.",
    en: "Your emotional stability combined with social energy is a rare combination: in high-pressure, people-intensive situations, you hold direction when others waver. Stress doesn't damage your relationships — quite the contrary.",
  },
  calmExecution: {
    hu: "Megbízhatóan, egyenletesen teljesítesz – a lelkiismeretességed és az érzelmi stabilitásod egymást erősíti. Ahol mások stresszben félresiklanának, te kiszámíthatóan hozod az eredményt.",
    en: "You deliver reliably and consistently — your conscientiousness and emotional stability reinforce each other. Where others might derail under stress, you produce results predictably.",
  },
  exploratoryAnalyst: {
    hu: "Nyitottságod és érzelmi stabilitásod különleges kombinációt ad: mélyen vizsgálod az ismeretlen területeket, miközben a bizonytalanság nem rendít meg. A kutatás, az elemzés és a feltárás természetes közeged.",
    en: "Your openness and emotional stability form a distinctive combination: you explore unknown territory deeply while uncertainty doesn't unsettle you. Research, analysis, and discovery are your natural domains.",
  },
  organizedLeader: {
    hu: "Társas aktivitásod és lelkiismeretességed egymást erősítik: hatékonyan szervezel, kommunikálsz és teljesítesz. Egyszerre tudod mozgósítani az embereket és végrehajtani a terveket.",
    en: "Your social activity and conscientiousness reinforce each other: you organize, communicate, and execute effectively. You can both mobilize people and follow through on plans simultaneously.",
  },
  harmoniousConnector: {
    hu: "Extraverziód és magas együttműködési készséged kivételes csapatdinamikát teremt. Ritka, hogy valaki egyszerre energikus és befogadó – nálad ez természetes, és a csapat ragasztóanyagává tesz.",
    en: "Your extraversion and high agreeableness create exceptional team dynamics. It's rare for someone to be both energizing and receptive — for you this is natural, and it makes you the glue that holds teams together.",
  },
  performanceDriver: {
    hu: "Ambiciózus és szervezett – kemény munkával, következetes végrehajtással érsz el célokat. A versenyszellem és a precizitás nálad nem zárja ki egymást, hanem összefogja az eredményorientált profilodat.",
    en: "Ambitious and organized — you achieve goals through hard work and consistent execution. Competitive drive and precision don't exclude each other in your profile; they combine into a results-focused profile.",
  },
  disruptiveInnovator: {
    hu: "Alacsony együttműködési hajlandóságod és magas nyitottságod kombinációja megkérdőjelező, önálló gondolkodót rajzol ki. Nem mész bele kompromisszumba pusztán a béke kedvéért – és ha megfelelő közegbe kerülsz, ez innovatív erővé válik.",
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
    hu: "Stressz alatt is kiegyensúlyozott maradsz, és az energiádat a kapcsolatokból merítve fenntartod azt. Olyan helyzetekben vagy erős, ahol egyszerre kell emberi jelenlét és stabilitás.",
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
    hu: "Emberekkel dolgozol és le is zársz. A csapatot mozgásban tartod, de mindig van kéznél terv és határidő.",
    en: "You work with people and you close things out. You keep the team moving while always having a plan and a deadline at hand.",
  },
  harmoniousConnector: {
    hu: "Kapcsolatokat építesz, összetartod a csapatot, és az együttműködés természetes közeged. A harmónia fenntartása aktív erőfeszítés nélkül is sikerül.",
    en: "You build relationships, hold the team together, and collaboration is your natural medium. Maintaining harmony comes naturally, without requiring active effort.",
  },
  performanceDriver: {
    hu: "Ambiciózus és szervezett – kemény munkával, következetes végrehajtással érsz el célokat. A versenyszellem és a precizitás egyszerre jellemez.",
    en: "Ambitious and organized — you achieve goals through hard work and consistent execution. Competitive drive and precision characterize you simultaneously.",
  },
  disruptiveInnovator: {
    hu: "Nem félsz kikezdeni a status quo-t, és új irányokat keresel. A konfrontáció eszköz, nem akadály – az újdonság és az egyenességed egyszerre jelenik meg.",
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
    hu: "Néha túl sokat ellenőrzöd magad, és mintha állandó készenlétben lennél. Segíthet, ha a munkát rövid, tiszta szakaszokra bontod, és előre kijelölöd, mi számít késznek.",
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
      medium: "Összetett érdekű szervezetekben is jól működhetsz, ha az etikai mandátumod egyértelmű.",
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
      strong: "Szabálytisztaságot és egyenes kommunikációt igénylő helyzetek, ahol kényes kérdéseket is ki kell mondani.",
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
      medium: "Nagyobb társas intenzitású közegben is jól teljesíthetsz, ha van regenerációs ritmus és szerephatár.",
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
      medium: "Változóbb környezetben is jól működhetsz, ha a prioritások és határidők egyértelműen stabilak.",
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
      medium: "Projektvezetés, ügyfélkapcsolati szerepkörök, ahol a társas energia és a stressztűrés egyszerre számít.",
      watchOut: "Nehéz lehet, ha a társas aktivitás nem jár valódi mélységgel, vagy ha az érzelmi stabilitásodat mások érzéketlenségként értelmezik. Érdemes tudatosan kommunikálni az empátiát is.",
    },
    en: {
      strong: "Roles with intensive people work in volatile, high-expectation contexts — leadership, sales leadership, crisis coordination, change management.",
      medium: "Project leadership, client-facing roles where social energy and stress tolerance both matter.",
      watchOut: "It can be difficult if social activity lacks real depth, or if others interpret your emotional stability as insensitivity. Make a conscious effort to also communicate empathy.",
    },
  },
  calmExecution: {
    hu: {
      strong: "Magas komplexitású, hosszú futamidejű projektek, ahol egyszerre szükséges kitartás és érzelmi állóképesség – műveletek, programvezetés, minőségbiztosítás.",
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
      watchOut: "Nehéz lehet, ha a csapat kevésbé strukturáltan dolgozik, vagy a célok és határidők folyamatosan változnak. Érdemes minimális folyamat-keretet kialakítani, amibe a csapat bekapcsolódhat.",
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
      strong: "Disruption-orientált szerepek – innovációs vezető, vállalkozó, stratégiai tanácsadó, ahol a konvenció megkérdőjelezése értéket jelent.",
      medium: "Szakértői tanácsadói, kutatói pozíciók is erős közeg, ha van elegendő autonómiád és a kritikus gondolkodás elvárás.",
      watchOut: "Nehéz lehet, ha a csapat erős harmónia-elvárással dolgozik, vagy ha a konfrontáció csapatkohéziót rombol. Érdemes a visszajelzést konstruktívan csatornázni, ne ellenük, hanem az ötletért.",
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

  // Struktúra (C alapján)
  if (categories.C === "high") {
    rows.push({
      label: { hu: "Struktúra", en: "Structure" },
      value: { hu: "Magas – egyértelmű keretek, folyamatok, szabályok", en: "High – clear structure, processes, rules" },
    });
  } else if (categories.C === "low") {
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

  // Társas intenzitás (X alapján)
  if (categories.X === "high") {
    rows.push({
      label: { hu: "Társas intenzitás", en: "Social intensity" },
      value: { hu: "Magas – csapatmunka, sok interakció", en: "High – teamwork, frequent interaction" },
    });
  } else if (categories.X === "low") {
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

  // Változásgyakoriság (O és C alapján)
  if (categories.O === "high" && categories.C === "high") {
    rows.push({
      label: { hu: "Változásgyakoriság", en: "Change frequency" },
      value: { hu: "Közepes – evolúció strukturált keretek közt", en: "Medium – gradual change within clear boundaries" },
    });
  } else if (categories.O === "high") {
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

  // Döntési sebesség (C és O alapján)
  if (categories.C === "high" && categories.O === "low") {
    rows.push({
      label: { hu: "Döntési sebesség", en: "Decision pace" },
      value: { hu: "Közepes – átgondolt, szabályalapú döntések", en: "Medium – deliberate, rule-based decisions" },
    });
  } else if (categories.C === "low" && categories.O === "high") {
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

  // Kultúra (H alapján – ha elérhető)
  if (categories.H === "high") {
    rows.push({
      label: { hu: "Kultúra", en: "Culture" },
      value: { hu: "Értékvezérelt, etikailag következetes", en: "Values-driven, ethically consistent" },
    });
  } else if (categories.H === "low") {
    rows.push({
      label: { hu: "Kultúra", en: "Culture" },
      value: { hu: "Teljesítményalapú, versengős kultúra tolerálható", en: "Performance-based, competitive culture acceptable" },
    });
  }

  // Projektciklus (C és O alapján)
  if (categories.C === "high") {
    rows.push({
      label: { hu: "Projektciklus", en: "Project cycle" },
      value: { hu: "Hosszú, mélyülő – alapos kivitelezés", en: "Long, deepening – thorough execution" },
    });
  } else if (categories.O === "high") {
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

  // Stressz-tolerancia (E alapján)
  if (categories.E === "high") {
    rows.push({
      label: { hu: "Stressztűrés", en: "Stress tolerance" },
      value: { hu: "Alacsony-közepes – kiszámítható, alacsony nyomású közeg szükséges", en: "Low to medium – predictable, low-pressure environment needed" },
    });
  } else if (categories.E === "low") {
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
  H_high: {
    hu: "Az etikai integritás és az őszinteség az egyik legdominánsabb jellemződ. Igazra törekszel és hiteles akarsz lenni – ez a munkahelyi kapcsolataidban is erős, bizalomépítő alapot ad.",
    en: "Ethical integrity and honesty are among your most dominant traits. You seek truthfulness and strive to be authentic — this provides a strong, trust-building foundation in your professional relationships.",
  },
  H_low: {
    hu: "Ambiciózus és stratégiai gondolkodású vagy: nem riadsz vissza a kihívásoktól és a versenytől. A célok elérése hajtóerő számodra – a versengés és az önérvényesítés természetes közeged.",
    en: "Ambitious and strategic, you don't shy away from challenges or competition. Achieving goals is what drives you — competition and self-assertion are your natural environment.",
  },
  E_high: {
    hu: "Az érzelmi érzékenység az egyik meghatározó jellemződ. Empatikus vagy, és könnyen reagálsz a körülötted zajló eseményekre – ez értéket ad kapcsolataidnak, de igényli a megfelelő, támogató keretet.",
    en: "Emotional sensitivity is one of your defining traits. You are empathetic and respond readily to events around you — this adds value to your relationships but calls for a supportive, well-structured environment.",
  },
  E_low: {
    hu: "Kiemelkedő érzelmi stabilitás jellemez. Nyomás és bizonytalanság alatt is megőrzöd az egyensúlyodat – ez ritka és nagy értékű képesség változékony közegekben.",
    en: "You are characterized by outstanding emotional stability. You maintain your balance even under pressure and uncertainty — a rare and highly valuable ability in volatile environments.",
  },
  X_high: {
    hu: "Erősen extravertált vagy – a kapcsolatokból és interakciókból nyersz energiát. A társas tér a természetes közeged, és aktívan alakítod a közeg dinamikáját.",
    en: "You are strongly extraverted — you draw energy from relationships and interactions. Social space is your natural element, and you actively shape the dynamics around you.",
  },
  X_low: {
    hu: "Introvertált beállítottság jellemez – önálló vagy kiscsoportos munkában töltöd fel az energiáidat. A mély fókusz és az autonómia az erősséged tere.",
    en: "You have an introverted disposition — you recharge through independent or small-group work. Deep focus and autonomy are where your strengths unfold.",
  },
  A_high: {
    hu: "Együttműködő, alkalmazkodó és kapcsolatorientált. A csapatkohézió és a harmónia természetes értéked – aktívan dolgozol a jó kapcsolatok fenntartásán.",
    en: "Cooperative, adaptable, and relationship-oriented. Team cohesion and harmony are values that come naturally to you — you actively work at maintaining good relationships.",
  },
  A_low: {
    hu: "Egyenes, elvhű és önálló. A döntéseket nem a béke, hanem az igazság alapján hozod – ez erős véleményvezér és tárgyalópartner-profilt ad.",
    en: "Direct, principled, and independent. You make decisions based on truth, not comfort — this creates a strong opinion-leader and negotiating-partner profile.",
  },
  C_high: {
    hu: "Szervezett, megbízható és következetes – a lelkiismeretesség erős bázist ad a teljesítményhez. A vállalt feladatokat gondosan kivitelezed, és értékeled a tiszta struktúrát.",
    en: "Organized, reliable, and consistent — conscientiousness provides a strong foundation for performance. You execute your commitments carefully and value clear structure.",
  },
  C_low: {
    hu: "Rugalmas és adaptív, inkább intuitív irányítású. A spontán megközelítés és az improvizáció az erősségeid – a folyamatos struktúra kevésbé motivál.",
    en: "Flexible and adaptive, you tend to operate more intuitively. Spontaneous approaches and improvisation are your strengths — rigid ongoing structure motivates you less.",
  },
  O_high: {
    hu: "Az újdonságra és a komplex gondolkodásra nyitott, kíváncsi személyiség. Az ismeretlen nem riaszt, hanem vonz – az innováció, a kreativitás és a feltárás természetes közeged.",
    en: "Curious and open to novelty and complex thinking. The unknown doesn't discourage you — it draws you in. Innovation, creativity, and discovery are your natural domains.",
  },
  O_low: {
    hu: "Kiszámítható, konkrét és pragmatikus beállítottságú. A bevált megoldásokat részesíted előnyben – a stabilitás, a megbízhatóság és az ismert módszerek az erősséged.",
    en: "Predictable, concrete, and pragmatic. You prefer proven solutions — stability, reliability, and familiar methods are your strengths.",
  },
};

// ─── Solo dim role texts (Block 5 ha nincs tension pár) ──────────────────────

export const SOLO_DIM_ROLE_TEXTS: Record<string, Record<Locale, { strong: string; medium: string; watchOut: string }>> = {
  H_high: {
    hu: {
      strong: "Magas bizalmat és etikai tisztaságot igénylő területek: megfelelőség (compliance), etikai tanácsadás, szabályozás, közszféra, nonprofit.",
      medium: "Bármely vezetői vagy szakértői szerep, ahol az átláthatóság és az integritás tényleges elvárás.",
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
      strong: "Versengő, eredményorientált közegek: üzletfejlesztés, értékesítés, growth, vállalkozás, tárgyalásintenzív szerepek.",
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
  E_low: {
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
      strong: "Mély fókuszt adó, önálló szerepek: elemzés, fejlesztés, kutatás, stratégia, technikai szakértés.",
      medium: "Kis csapat, aszinkron együttműködés is jól működhet, ha marad elég csendes/időzített fókuszidő.",
      watchOut: "Sok szerepléssel és állandó kapcsolatépítéssel járó szerepek kimeríthetnek. Legyenek határaid a meetingek és a nyilvános jelenlét körül.",
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
      watchOut: "Konfliktnál könnyen halaszthatod a konfrontációt, amitől felgyűlik a feszültség. Gyakorold a rövid, tiszteletteljes, asszertív jelzéseket.",
    },
    en: {
      strong: "Collaboration and trust-building roles: facilitation, HR, consulting, mediation, account management.",
      medium: "Partnership-focused roles where stable relationships drive results.",
      watchOut: "In conflict, you may delay directness and tensions can accumulate. Practice short, respectful, assertive check-ins.",
    },
  },
  A_low: {
    hu: {
      strong: "Tárgyalások, vitás helyzetek, kritikus review-k: jog, audit, stratégia, szakértői ellenőrzés.",
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
      strong: "Hosszabb, komplex projektek és operáció: programvezetés, minőségbiztosítás, szabályozás/compliance, működés (ops).",
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
      strong: "Gyors, kísérletezős közegek: startup, kreatív ipar, agilis csapatok, prototipizálás.",
      medium: "Exploratív/ötletelő szerepek, ahol a gyors iteráció és a váltás érték.",
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
      strong: "Új ötleteket és komplex gondolkodást igénylő szerepek: kutatás, stratégia, design, termék/innováció, vállalkozás.",
      medium: "Oktatás, tanácsadás, coaching, ahol a perspektívaváltás és kíváncsiság hozza a pluszt.",
      watchOut: "A lezárás néha nehezebb, mint a felfedezés. Segít a timebox, és a „kész” kritériumok előre rögzítése.",
    },
    en: {
      strong: "Roles that reward novelty and complex thinking: research, strategy, design, product/innovation, entrepreneurship.",
      medium: "Teaching, consulting, coaching where curiosity and reframing create value.",
      watchOut: "Closing can be harder than exploring. Use timeboxes and set clear endpoints upfront.",
    },
  },
  O_low: {
    hu: {
      strong: "Stabil, végrehajtás- és megbízhatóság-központú szerepek: operáció, implementáció, üzemeltetés, folyamatok.",
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
