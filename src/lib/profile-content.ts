import type { ProfileCategory } from "./profile-engine";

export type Locale = "hu" | "en" | "de";
type LocalizedText = Record<Locale, string>;

// ─── Section title ────────────────────────────────────────────────────────────

export const SECTION_TITLE: LocalizedText = {
  hu: "Munkastílusod",
  en: "Your work style",
  de: "Dein Arbeitsstil",
};

// ─── Block 1 – Bevezető framing ───────────────────────────────────────────────

export const BLOCK1: LocalizedText = {
  hu: "Nem címkézünk. Inkább rávilágítunk, hogyan működsz munkahelyi helyzetekben: mi visz előre, mi terhel, és mi ad stabilitást. Ez nem diagnózis, hanem egy letisztult összkép a jelenlegi mintázataidról.",
  en: "No labels. Instead, we highlight how you operate at work: what moves you forward, what weighs on you, and what keeps you steady. Not a diagnosis, but a clean snapshot of your current patterns.",
  de: "Keine Schubladen. Stattdessen zeigen wir, wie du im Arbeitsalltag funktionierst: was dich voranbringt, was dich belastet und was dir Stabilität gibt. Keine Diagnose, sondern eine klare Momentaufnahme deiner aktuellen Muster.",
};

// ─── Block 8 – Záró framing ───────────────────────────────────────────────────

export const BLOCK8: LocalizedText = {
  hu: "Gondolj rá iránytűként: segít tisztábban látni, hol működsz a legerősebben, és hol érdemes tudatosabban működni. A többi már rajtad múlik.",
  en: "Treat it as a compass: it helps you see where you’re strongest, and where being more deliberate pays off. The rest is up to you.",
  de: "Sieh es als Kompass: Er hilft dir zu erkennen, wo du am stärksten bist und wo es sich lohnt, bewusster zu handeln. Der Rest liegt bei dir.",
};

// ─── Dimenzió nevek (Block 2 megjelenítőhöz) ─────────────────────────────────

export const DIM_LABELS: Record<string, LocalizedText> = {
  H: { hu: "Őszinteség-Alázat", en: "Honesty-Humility", de: "Ehrlichkeit-Bescheidenheit" },
  E: { hu: "Érzelmi érzékenység", en: "Emotionality", de: "Emotionalität" },
  X: { hu: "Extraverzió", en: "Extraversion", de: "Extraversion" },
  A: { hu: "Együttműködés", en: "Agreeableness", de: "Verträglichkeit" },
  C: { hu: "Lelkiismeretesség", en: "Conscientiousness", de: "Gewissenhaftigkeit" },
  O: { hu: "Nyitottság", en: "Openness", de: "Offenheit" },
};

export const CATEGORY_LABELS: Record<ProfileCategory, LocalizedText> = {
  high: { hu: "magas", en: "high", de: "hoch" },
  medium: { hu: "közepes", en: "medium", de: "mittel" },
  low: { hu: "alacsony", en: "low", de: "niedrig" },
};

// ─── Block 3 – Működési narratíva (tension-specifikus szövegek) ───────────────

export const RESOLUTION_NARRATIVES: Record<string, LocalizedText> = {
  ethicalLeader: {
    hu: "Etikai elvhűséged és láthatóságigényed ritka, de erős kombináció. Nem a rivaldafény vonz, hanem az, hogy hitelesnek látjanak. Olyan szerepekben teljesítesz igazán, ahol a hitelesség maga a tőke.",
    en: "Your ethical integrity combined with a need for visibility is a rare but powerful combination. You are not drawn to the spotlight for its own sake, but to being seen as authentic. You thrive in roles where credibility is the currency.",
    de: "Deine ethische Integrität kombiniert mit dem Bedürfnis nach Sichtbarkeit ist eine seltene, aber starke Kombination. Nicht das Rampenlicht selbst zieht dich an, sondern als authentisch wahrgenommen zu werden. Du blühst in Rollen auf, in denen Glaubwürdigkeit die Währung ist.",
  },
  principledConfronter: {
    hu: "Elvhű vagy és konfrontatív – nem hazudsz, de nem is kerülöd a nehéz beszélgetéseket. Ez a profil természetes közege etikai vizsgálatoknál, szabályozói munkában vagy bárhol, ahol a kellemetlen igazságot ki kell mondani.",
    en: "You are principled and confrontational — you don't lie, and you don't avoid difficult conversations. This profile finds its natural home in ethical investigations, regulatory work, or anywhere the uncomfortable truth needs to be voiced.",
    de: "Du bist prinzipientreu und konfrontativ — du lügst nicht und vermeidest keine schwierigen Gespräche. Dieses Profil findet sein natürliches Zuhause in ethischen Untersuchungen, Regulierungsarbeit oder überall, wo die unbequeme Wahrheit ausgesprochen werden muss.",
  },
responsibleInnovator: {
  hu: "Nyitott vagy az új megközelítésekre, ugyanakkor döntéseidet egy erős belső értékrend vezérli. Számodra az innováció nem öncélú, hanem tudatos és felelősségteljesen megvalósított.",
  en: "You are open to new approaches, yet guided by a strong inner value system. For you, innovation is not self-serving but intentional and carried out with a sense of responsibility.",
  de: "Du bist offen für neue Ansätze, wirst jedoch von einem starken inneren Wertesystem geleitet. Für dich ist Innovation nicht Selbstzweck, sondern bewusst und verantwortungsvoll umgesetzt.",
},
  supportedVisibility: {
    hu: "A társas jelenlét energizál, de a stressz hamar megterhel. Olyan szerepek a legjobbak, ahol van visszajelzés, biztonság és megbecsülés – nem pusztán elvárás és nyomás.",
    en: "Social presence energizes you, but stress quickly takes its toll. Roles with feedback, psychological safety, and recognition work best — not just expectations and pressure.",
    de: "Soziale Präsenz gibt dir Energie, aber Stress zehrt schnell an dir. Rollen mit Rückmeldung, psychologischer Sicherheit und Anerkennung funktionieren am besten — nicht nur Erwartungen und Druck.",
  },
  structuredStability: {
    hu: "Magas önelvárásod és stresszérzékenységed kombinációja komoly energiagazdálkodást igényel. Kiszámítható, strukturált, támogató környezetben hozod ki a legjobbat magadból.",
    en: "The combination of high self-expectations and stress sensitivity requires careful energy management. You bring out the best in yourself in predictable, structured, supportive environments.",
    de: "Die Kombination aus hohen Selbsterwartungen und Stressempfindlichkeit erfordert sorgfältiges Energiemanagement. In vorhersehbaren, strukturierten, unterstützenden Umgebungen holst du das Beste aus dir heraus.",
  },
  safeExperimentation: {
    hu: "Az ismeretlen vonz, de szorongást is okozhat. A legjobban olyan innovációs környezetben működsz, ahol van biztonsági háló: nem kell mindent egyszerre kockáztatni.",
    en: "The unknown draws you in, but can also cause anxiety. You function best in innovation environments with a safety net — where not everything needs to be risked at once.",
    de: "Das Unbekannte zieht dich an, kann aber auch Angst auslösen. Du funktionierst am besten in Innovationsumgebungen mit einem Sicherheitsnetz — wo nicht alles auf einmal riskiert werden muss.",
  },
  deepCollaboration: {
    hu: "Nem a tömeget kerülöd, hanem a felszínes interakciót. Kiscsoportos, hosszú távú, bizalmi alapú együttműködésben teljesítesz – ahol nem kell mindenkivel barátkozni, csak a munkatársakkal.",
    en: "It's not crowds themselves you avoid — it's superficial interaction. You perform best in small-group, long-term, trust-based collaboration, where you don't need to befriend everyone, only your close collaborators.",
    de: "Du vermeidest nicht die Menge, sondern oberflächliche Interaktion. Du leistest am besten in langfristiger, vertrauensbasierter Zusammenarbeit in kleinen Gruppen — wo du nicht mit jedem befreundet sein musst, sondern nur mit den Menschen, mit denen du eng zusammenarbeitest.",
  },
  solitaryInnovator: {
    hu: "Nem a közös ötletelésben dolgozod ki az ötleteidet, hanem egyedül. A belső világ gazdagsága és az újdonságkeresés különleges profilt ad: szoliter kutató, stratégiai elemző, architekt típusú szerepek.",
    en: "You don't develop your ideas in brainstorms — you do it alone. The richness of your inner world combined with a drive for novelty creates a distinctive profile: solitary researcher, strategic analyst, architect-type roles.",
    de: "Du entwickelst deine Ideen nicht in Brainstorming-Runden, sondern allein. Der Reichtum deiner inneren Welt, kombiniert mit dem Drang nach Neuem, ergibt ein unverwechselbares Profil: Forschung im Alleingang, strategische Analyse, architektur-nahe Rollen.",
  },
  facilitatedInnovation: {
    hu: "Innoválsz, de konszenzussal. Nem tolod rá az ötleteidet, hanem bevonod a többieket. Design thinking, participatív tervezés, workshopvezetés – ahol az innováció közös munka.",
    en: "You innovate, but through consensus. You don't push your ideas on others; you involve them. Design thinking, participatory design, workshop facilitation — where innovation is a shared endeavor.",
    de: "Du innovierst, aber durch Konsens. Du drängst deine Ideen nicht auf andere; du bindest sie ein. Design Thinking, partizipatives Design, Workshop-Moderation — wo Innovation ein gemeinsames Unterfangen ist.",
  },
  structuredCompetitor: {
    hu: "Ambiciózus és fegyelmezett – a versengés strukturált közegben a legerősebb fegyver. Nem politikával, hanem teljesítménnyel nyersz.",
    en: "Ambitious and disciplined — competition is your strongest asset in a structured environment. You win not through politics, but through performance.",
    de: "Ehrgeizig und diszipliniert — Wettbewerb ist deine stärkste Waffe in einem strukturierten Umfeld. Du gewinnst nicht durch Politik, sondern durch Leistung.",
  },
  structuredInnovator: {
    hu: "Vonzódsz az újszerű problémákhoz, de a legjobb munkádat strukturált keretek között végzed. Ez nem ellentmondás – hanem a keretezett innováció természetes profilja.",
    en: "You are drawn to novel problems, but you do your best work within structured frameworks. This is not a contradiction — it is the natural profile of structured innovation.",
    de: "Du wirst von neuartigen Problemen angezogen, aber du leistest deine beste Arbeit innerhalb strukturierter Rahmenbedingungen. Dies ist kein Widerspruch — es ist das natürliche Profil strukturierter Innovation.",
  },
  resilientLeader: {
    hu: "Érzelmi stabilitásod és társas energiád ritka kombináció: magas nyomású, emberekkel teli helyzetekben akkor is tartod az irányt, amikor mások elbizonytalanodnak. A stressz nem rombolja a kapcsolataidat – éppen ellenkezőleg.",
    en: "Your emotional stability combined with social energy is a rare combination: in high-pressure, people-intensive situations, you hold direction when others waver. Stress doesn't damage your relationships — quite the contrary.",
    de: "Deine emotionale Stabilität kombiniert mit sozialer Energie ist eine seltene Kombination: In druckintensiven, menschenreichen Situationen behältst du die Richtung, wenn andere schwanken. Stress beschädigt deine Beziehungen nicht — ganz im Gegenteil.",
  },
  calmExecution: {
    hu: "Megbízhatóan, egyenletesen teljesítesz – a lelkiismeretességed és az érzelmi stabilitásod egymást erősíti. Ahol mások stresszben félresiklanának, te kiszámíthatóan hozod az eredményt.",
    en: "You deliver reliably and consistently — your conscientiousness and emotional stability reinforce each other. Where others might derail under stress, you produce results predictably.",
    de: "Du lieferst zuverlässig und gleichmäßig — deine Gewissenhaftigkeit und emotionale Stabilität verstärken sich gegenseitig. Wo andere unter Stress entgleisen, lieferst du vorhersehbar Ergebnisse.",
  },
  exploratoryAnalyst: {
    hu: "Nyitottságod és érzelmi stabilitásod különleges kombinációt ad: mélyen vizsgálod az ismeretlen területeket, miközben a bizonytalanság nem rendít meg. A kutatás, az elemzés és a feltárás természetes közeged.",
    en: "Your openness and emotional stability form a distinctive combination: you explore unknown territory deeply while uncertainty doesn't unsettle you. Research, analysis, and discovery are your natural domains.",
    de: "Deine Offenheit und emotionale Stabilität bilden eine unverwechselbare Kombination: Du erforschst unbekanntes Terrain tiefgründig, während Unsicherheit dich nicht erschüttert. Forschung, Analyse und Entdeckung sind deine natürlichen Bereiche.",
  },
  organizedLeader: {
    hu: "Társas aktivitásod és lelkiismeretességed egymást erősítik: hatékonyan szervezel, kommunikálsz és teljesítesz. Egyszerre tudod mozgósítani az embereket és végrehajtani a terveket.",
    en: "Your social activity and conscientiousness reinforce each other: you organize, communicate, and execute effectively. You can both mobilize people and follow through on plans simultaneously.",
    de: "Deine soziale Aktivität und Gewissenhaftigkeit verstärken sich gegenseitig: Du organisierst, kommunizierst und führst effektiv aus. Du kannst sowohl Menschen mobilisieren als auch Pläne gleichzeitig umsetzen.",
  },
  harmoniousConnector: {
    hu: "Extraverziód és magas együttműködési készséged kivételes csapatdinamikát teremt. Ritka, hogy valaki egyszerre energikus és befogadó – nálad ez természetes, és a csapat ragasztóanyagává tesz.",
    en: "Your extraversion and high agreeableness create exceptional team dynamics. It's rare for someone to be both energizing and receptive — for you this is natural, and it makes you the glue that holds teams together.",
    de: "Deine Extraversion und hohe Verträglichkeit schaffen außergewöhnliche Teamdynamiken. Es ist selten, dass jemand zugleich energetisierend und aufnahmebereit ist — bei dir ist das natürlich, und es macht dich zum Kitt, der Teams zusammenhält.",
  },
  performanceDriver: {
    hu: "Ambiciózus és szervezett – kemény munkával, következetes végrehajtással érsz el célokat. A versenyszellem és a precizitás nálad nem zárja ki egymást, hanem összefogja az eredményorientált profilodat.",
    en: "Ambitious and organized — you achieve goals through hard work and consistent execution. Competitive drive and precision don't exclude each other in your profile; they combine into a results-focused profile.",
    de: "Ehrgeizig und organisiert — du erreichst Ziele durch harte Arbeit und konsequente Umsetzung. Wettbewerbsgeist und Präzision schließen sich in deinem Profil nicht aus; sie verbinden sich zu einem ergebnisorientierten Profil.",
  },
  disruptiveInnovator: {
    hu: "Alacsony együttműködési hajlandóságod és magas nyitottságod kombinációja megkérdőjelező, önálló gondolkodót rajzol ki. Nem mész bele kompromisszumba pusztán a béke kedvéért – és ha megfelelő közegbe kerülsz, ez innovatív erővé válik.",
    en: "Your combination of low agreeableness and high openness creates a challenging, independent thinker. You don't compromise for the sake of peace alone — and in the right environment, this becomes a force for innovation.",
    de: "Deine Kombination aus geringer Verträglichkeit und hoher Offenheit zeichnet einen hinterfragenden, eigenständigen Denker. Du gehst keine Kompromisse allein um des Friedens willen ein — und im richtigen Umfeld wird das zu einer Kraft für Innovation.",
  },
};

// ─── Block 3 – Rövid működési összkép (ne ismételje a 6/7 blokkokat) ─────────

export const BLOCK3_SUMMARIES: Record<string, LocalizedText> = {
  ethicalLeader: {
    hu: "A hitelesség és a látható felelősségvállalás egyszerre fontos neked. Olyan helyzetekben vagy erős, ahol értékek mentén kell irányt mutatni.",
    en: "Authenticity and visible responsibility both matter to you. You are strongest in situations where direction must be set on clear values.",
    de: "Authentizität und sichtbare Verantwortungsübernahme sind dir beide wichtig. Am stärksten bist du in Situationen, in denen wertebasiert Richtung gegeben werden muss.",
  },
  principledConfronter: {
    hu: "Az egyenesség és a konfliktustűrés együtt jelenik meg nálad. Akkor működsz jól, ha tiszta határokat és kimondható feszültségeket kell kezelni.",
    en: "Directness and conflict tolerance show up together in your profile. You work well where clear boundaries and explicit tensions must be handled.",
    de: "Direktheit und Konflikttoleranz treten in deinem Profil gemeinsam auf. Du arbeitest gut dort, wo klare Grenzen und offene Spannungen bearbeitet werden müssen.",
  },
  responsibleInnovator: {
    hu: "Nyitott vagy az újra, de belső etikai iránytű mentén döntesz. Nálad az innováció és a felelősség nem ellentét, hanem közös működési elv.",
    en: "You are open to novelty, but you decide through an internal ethical compass. For you, innovation and responsibility are not opposites, but one operating principle.",
    de: "Du bist offen für Neues, entscheidest aber über einen inneren ethischen Kompass. Für dich sind Innovation und Verantwortung kein Gegensatz, sondern ein gemeinsames Arbeitsprinzip.",
  },
  supportedVisibility: {
    hu: "A társas jelenlét motivál, ha van biztonságos keret körülötte. A látható szerepekben akkor teljesítesz jól, ha kapsz stabil visszajelzést.",
    en: "Social visibility motivates you when it is supported by safety. You perform well in visible roles when feedback remains stable and constructive.",
    de: "Soziale Sichtbarkeit motiviert dich, wenn sie von Sicherheit getragen ist. In sichtbaren Rollen leistest du gut, wenn Rückmeldung stabil und konstruktiv bleibt.",
  },
  structuredStability: {
    hu: "A magas belső mérce és az érzelmi érzékenység együtt tudatos kereteket igényel. Strukturált közegben kiegyensúlyozottan tudsz magas színvonalat tartani.",
    en: "High internal standards combined with sensitivity require intentional structure. In a well-structured environment, you can sustain high quality at a healthy pace.",
    de: "Hohe innere Maßstäbe in Kombination mit Sensibilität erfordern bewusste Struktur. In einem klar strukturierten Umfeld kannst du dauerhaft hohe Qualität in einem gesunden Tempo halten.",
  },
  safeExperimentation: {
    hu: "Az újdonság vonz, de kiszámítható támaszpontokra is szükséged van. Akkor működsz jól, ha a kísérletezésnek világos ritmusa és határa van.",
    en: "Novelty attracts you, but you also need stable reference points. You work best when experimentation has a clear rhythm and boundaries.",
    de: "Neues zieht dich an, zugleich brauchst du stabile Orientierungspunkte. Am besten arbeitest du, wenn Experimentieren einen klaren Rhythmus und Grenzen hat.",
  },
  deepCollaboration: {
    hu: "A mély, bizalmi együttműködés többet ad neked, mint a széles láthatóság. Kisebb, stabil kapcsolati hálóban bontakozik ki legjobban a teljesítményed.",
    en: "Deep, trust-based collaboration gives you more than broad visibility. Your performance unfolds best in smaller, stable relationship networks.",
    de: "Tiefe, vertrauensbasierte Zusammenarbeit gibt dir mehr als breite Sichtbarkeit. Deine Leistung entfaltet sich am besten in kleineren, stabilen Beziehungsnetzwerken.",
  },
  solitaryInnovator: {
    hu: "Az ötleteidet elsősorban elmélyült, önálló munkában érleled. Erősséged a mély gondolkodás és az új perspektívák csendes felépítése.",
    en: "You mainly develop ideas through deep, independent work. Your strength is sustained thinking and building new perspectives quietly.",
    de: "Deine Ideen entwickelst du vor allem in vertiefter, eigenständiger Arbeit. Deine Stärke liegt im ausdauernden Denken und im stillen Aufbau neuer Perspektiven.",
  },
  facilitatedInnovation: {
    hu: "Úgy viszel be újat a rendszerbe, hogy közben bevonod az embereket. Az együttműködő változásépítés a természetes működési módod.",
    en: "You bring novelty into systems while bringing people with you. Collaborative change-building is your natural operating mode.",
    de: "Du bringst Neues in Systeme ein und nimmst Menschen dabei mit. Kollaborativer Veränderungsaufbau ist dein natürlicher Arbeitsmodus.",
  },
  structuredCompetitor: {
    hu: "A versenyt célfegyelemmel és következetes kivitelezéssel kezeled. Olyan környezetben vagy erős, ahol teljesítmény és mérhetőség tisztán jelen van.",
    en: "You approach competition with discipline and consistent execution. You are strong in environments where performance and measurability are explicit.",
    de: "Du gehst Wettbewerb mit Disziplin und konsequenter Umsetzung an. Stark bist du in Umfeldern, in denen Leistung und Messbarkeit klar sind.",
  },
  structuredInnovator: {
    hu: "Az új megoldásokat rendszerben gondolod végig, nem ad hoc módon. Akkor tudsz nagyot alkotni, ha a kreativitás és a struktúra egyszerre van jelen.",
    en: "You think through new solutions in systems, not ad hoc. You do your best work when creativity and structure are both present.",
    de: "Neue Lösungen denkst du systemisch statt ad hoc. Deine beste Arbeit entsteht, wenn Kreativität und Struktur gleichzeitig vorhanden sind.",
  },
  resilientLeader: {
    hu: "Stressz alatt is kiegyensúlyozott maradsz, és az energiádat a kapcsolatokból merítve fenntartod azt. Olyan helyzetekben vagy erős, ahol egyszerre kell emberi jelenlét és stabilitás.",
    en: "You stay balanced even under stress, drawing energy from relationships to sustain it. You are strongest in situations that call for both human presence and stability.",
    de: "Du bleibst auch unter Stress ausgeglichen und schöpfst daraus Energie aus Beziehungen. Am stärksten bist du in Situationen, in denen sowohl menschliche Präsenz als auch Stabilität gefragt sind.",
  },
  calmExecution: {
    hu: "Megbízhatóan és nyugodtan végzed el, amit vállalsz. Nem rendít meg a nyomás, és a feladatot következetesen zárod le.",
    en: "You complete what you take on reliably and calmly. Pressure doesn't unsettle you, and you close tasks consistently.",
    de: "Du erledigst, was du übernimmst, zuverlässig und ruhig. Druck bringt dich nicht aus der Ruhe, und du schließt Aufgaben konsequent ab.",
  },
  exploratoryAnalyst: {
    hu: "Az ismeretlent kíváncsian és nyugodtan közelíted meg. Mások szoronganának az újdonságtól – te energiát nyersz belőle, miközben megőrzöd az elemzői fókuszt.",
    en: "You approach the unknown with curiosity and calm. Others might feel anxious about novelty — you draw energy from it while maintaining analytical focus.",
    de: "Du gehst dem Unbekannten mit Neugier und Ruhe entgegen. Andere könnten sich von Neuem beunruhigt fühlen — du schöpfst Energie daraus und behältst dabei den analytischen Fokus.",
  },
  organizedLeader: {
    hu: "Emberekkel dolgozol és le is zársz. A csapatot mozgásban tartod, de mindig van kéznél terv és határidő.",
    en: "You work with people and you close things out. You keep the team moving while always having a plan and a deadline at hand.",
    de: "Du arbeitest mit Menschen und bringst Dinge zum Abschluss. Du hältst das Team in Bewegung, während du immer einen Plan und eine Frist parat hast.",
  },
  harmoniousConnector: {
    hu: "Kapcsolatokat építesz, összetartod a csapatot, és az együttműködés természetes közeged. A harmónia fenntartása aktív erőfeszítés nélkül is sikerül.",
    en: "You build relationships, hold the team together, and collaboration is your natural medium. Maintaining harmony comes naturally, without requiring active effort.",
    de: "Du baust Beziehungen auf, hältst das Team zusammen, und Zusammenarbeit ist dein natürliches Medium. Harmonie zu erhalten gelingt dir natürlich, ohne aktiven Aufwand.",
  },
  performanceDriver: {
    hu: "Ambiciózus és szervezett – kemény munkával, következetes végrehajtással érsz el célokat. A versenyszellem és a precizitás egyszerre jellemez.",
    en: "Ambitious and organized — you achieve goals through hard work and consistent execution. Competitive drive and precision characterize you simultaneously.",
    de: "Ehrgeizig und organisiert — du erreichst Ziele durch harte Arbeit und konsequente Umsetzung. Wettbewerbsgeist und Präzision kennzeichnen dich gleichzeitig.",
  },
  disruptiveInnovator: {
    hu: "Nem félsz kikezdeni a status quo-t, és új irányokat keresel. A konfrontáció eszköz, nem akadály – az újdonság és az egyenességed egyszerre jelenik meg.",
    en: "You are not afraid to challenge the status quo and seek new directions. Confrontation is a tool, not an obstacle — novelty and directness show up together in your profile.",
    de: "Du scheust dich nicht, den Status quo in Frage zu stellen und neue Richtungen zu suchen. Konfrontation ist ein Werkzeug, kein Hindernis — Neuheit und Direktheit treten in deinem Profil gemeinsam auf.",
  },
};

// ─── Block 6 – Kombináció-insight fejléc ─────────────────────────────────────

export const BLOCK6_TITLE: LocalizedText = {
  hu: "A legfontosabbak",
  en: "Key takeaways",
  de: "Das Wichtigste",
};

// ─── Block 7 – Kockázati jelzők szövegei ─────────────────────────────────────

export const BLOCK7_TITLE: LocalizedText = {
  hu: "Ami kihívás lehet",
  en: "Things to watch for",
  de: "Worauf du achten solltest",
};

export const RISK_TEXTS: Record<string, LocalizedText> = {
  supportedVisibility: {
    hu: "Ha sok a társas inger, gyorsan lemerülhetsz. Segíthet, ha előre beépítesz fix visszajelzési pontokat, és hagysz időt a feltöltődésre.",
    en: "If social intensity runs long, your energy may drop fast. Try scheduling regular feedback check-ins and leaving deliberate recovery time.",
    de: "Wenn soziale Intensität lange anhält, sinkt deine Energie oft schnell. Hilfreich: feste Feedback-Check-ins einplanen und bewusst Zeit zur Erholung lassen.",
  },
  structuredStability: {
    hu: "Néha túl sokat ellenőrzöd magad, és mintha állandó készenlétben lennél. Segíthet, ha a munkát rövid, tiszta szakaszokra bontod, és előre kijelölöd, mi számít késznek.",
    en: "You may find yourself over-monitoring and staying on constant alert. Try breaking work into short, clear phases and defining realistic endpoints.",
    de: "Vielleicht kontrollierst du dich zu stark und bist dauerhaft in Alarmbereitschaft. Hilfreich: Arbeit in kurze, klare Phasen teilen und realistische Endpunkte festlegen.",
  },
  safeExperimentation: {
    hu: "Könnyen ugrálsz a lehetőségek között, és nehéz lehet lezárni egy döntést. Segíthet, ha egyszerre csak 1-2 új irányt vagy megoldást próbálsz ki, és előre rögzíted magadnak, mi alapján állsz le vagy váltasz vissza egy-egy megoldásra.",
    en: "You may bounce between options and struggle to close decisions. Try running no more than 1–2 experiments at a time, with clear stop criteria and fallback rules.",
    de: "Vielleicht springst du zwischen Optionen hin und her und tust dich schwer, Entscheidungen zu schließen. Hilfreich: höchstens 1–2 Experimente gleichzeitig, mit klaren Stop-Kriterien und Fallback-Regeln.",
  },
};

// ─── Block 5 – Szerepkör-família ajánlások ────────────────────────────────────

export const BLOCK5_TITLE: LocalizedText = {
  hu: "Szerepkör-illeszkedés",
  en: "Role fit",
  de: "Rollenpassung",
};

export const BLOCK5_STRONG: LocalizedText = {
  hu: "Erős illeszkedés",
  en: "Strong fit",
  de: "Starke Passung",
};

export const BLOCK5_MEDIUM: LocalizedText = {
  hu: "Működhet, ha készülsz",
  en: "Can work with preparation",
  de: "Mit Vorbereitung möglich",
};

export const BLOCK5_WATCH: LocalizedText = {
  hu: "Ahol segít a felkészülés",
  en: "Where preparation helps",
  de: "Wo Vorbereitung hilft",
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
    de: {
      strong: "Werteorientierte Umfelder mit hohem Vertrauensanspruch, in denen transparente Entscheidungen und Glaubwürdigkeit zählen.",
      medium: "Auch in Organisationen mit gemischten Interessen kannst du gut wirken, wenn dein ethischer Auftrag klar ist.",
      watchOut: "Schwierig wird es in Umfeldern, in denen Werte nur kommunikativ, aber nicht praktisch gelebt werden. Hilfreich ist, gemeinsame ethische Entscheidungsprinzipien früh festzulegen.",
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
    de: {
      strong: "Kontexte mit Bedarf an Regelklarheit und direkter Kommunikation, auch bei unbequemen Themen.",
      medium: "In moderierenden oder Partner-Rollen kannst du stark sein, wenn Entscheidungsgrenzen und Verantwortung klar sind.",
      watchOut: "Belastend wird es, wenn Konflikte unausgesprochen bleiben und Themen sich unter der Oberfläche stauen. Regelmäßige, strukturierte Klärungsformate helfen.",
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
    de: {
      strong: "Innovationsumfelder, in denen Neuheit und Verantwortung gemeinsam erwartet werden und kein Gegenspiel sind.",
      medium: "Auch in schnelleren Teams kannst du gut wirken, wenn ethische Leitplanken vorab definiert sind.",
      watchOut: "Schwierig wird es in schnellen Umfeldern, in denen ethische Kompromisse stillschweigend erwartet werden. Kläre rote Linien früh und halte sie konsequent ein.",
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
    de: {
      strong: "Sichtbare, menschennahe Rollen mit psychologischer Sicherheit und regelmäßigem, konstruktivem Feedback.",
      medium: "Auch in sozial intensiveren Kontexten kannst du gut sein, wenn Regenerationsrhythmus und Rollengrenzen geschützt sind.",
      watchOut: "Dauerhafte soziale Intensität kann ohne ausreichende Regeneration stark belasten. Plane früh ruhige Arbeitsblöcke und regelmäßige Feedback-Termine ein.",
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
    de: {
      strong: "Vorhersehbare, strukturierte Abläufe, in denen hohe Qualität in gesundem Tempo gehalten werden kann.",
      medium: "Auch in dynamischeren Kontexten kannst du gut wirken, wenn Prioritäten und Fristen klar stabil bleiben.",
      watchOut: "Schwierig wird es, wenn hohe Erwartungen auf dauerhaft geringe Planbarkeit treffen. Hilfreich sind kurze Arbeitszyklen mit klaren Endpunkten und expliziten Belastungsgrenzen.",
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
    de: {
      strong: "Experimentelle Umfelder mit Sicherheitsnetz: Neues ausprobieren, aber in kontrollierten Grenzen.",
      medium: "Auch bei hohem Veränderungstempo kannst du gut arbeiten, wenn Entscheidungsrhythmus und Fallback-Optionen vorab geklärt sind.",
      watchOut: "Schwierig wird es, wenn zu viele Richtungen gleichzeitig offen sind und Entscheidungsanker fehlen. Begrenze aktive Prioritäten auf 1-2 und nutze vordefinierte Stop-Regeln.",
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
    de: {
      strong: "Kleine, vertrauensbasierte Zusammenarbeit, in der tiefe fachliche Beziehungen und ein stabiler Teamrhythmus entstehen können.",
      medium: "Auch in größeren Teams kannst du wirksam sein, wenn stabile Mikrokreise und klare Kommunikationskanäle bestehen.",
      watchOut: "Schwierig wird es in Umfeldern mit oberflächlicher und zersplitterter Kommunikation. Hilfreich ist der Aufbau stabiler Paar- oder Kleingruppenarbeit.",
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
    de: {
      strong: "Arbeit mit tiefem Fokus, Autonomie und längeren Denkzyklen, in denen du eigenständige Lösungen entwickeln kannst.",
      medium: "Auch im Team kannst du gut arbeiten, wenn geschützte Fokuszeit und asynchrone Zusammenarbeit vorhanden sind.",
      watchOut: "Schwierig wird es, wenn dauerhafte Meetings den Arbeitsrhythmus zerschneiden. Schütze feste Fokuszeiten und definiere asynchrone Entscheidungs-Vorbereitung.",
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
    de: {
      strong: "Veränderungskontexte, in denen Innovation durch Beteiligung und gemeinsames Lernen nachhaltig wird.",
      medium: "Auch in hierarchischeren Umfeldern kannst du wirksam sein, wenn Raum für moderierte Abstimmung und Iteration besteht.",
      watchOut: "Schwierig ist ein Umfeld, in dem Beteiligung symbolisch bleibt, während Entscheidungen geschlossen getroffen werden. Klärt früh, was tatsächlich entschieden werden kann und welche konkreten Workshop-Ergebnisse erwartet sind.",
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
    de: {
      strong: "Wettbewerbsumfelder mit messbaren Ergebnissen, klaren Zielen und eindeutigen Verantwortungsstufen.",
      medium: "Auch in konsensorientierten Kulturen kannst du gut wirken, wenn Erfolgskriterien und Zuständigkeiten klar bleiben.",
      watchOut: "Schwierig wird es, wenn Leistungserwartungen unklar sind oder laufend wechseln. Legt früh gemeinsame Erfolgskriterien und klare Entscheidungsverantwortung fest.",
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
    de: {
      strong: "Komplexe Probleme, bei denen Innovation und strukturierte Umsetzung gleichzeitig nötig sind.",
      medium: "Auch in schnelleren kreativen Kontexten kannst du gut arbeiten, wenn schlanke Prozesse und klare Entscheidungspunkte vorhanden sind.",
      watchOut: "Schwierig wird es, wenn zu viele Richtungen offen bleiben und die Umsetzung den Fokus verliert. Arbeitet mit fixem Rahmen pro Iteration, priorisierter Aufgabenliste und klaren Abschlusskriterien.",
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
    de: {
      strong: "Rollen mit intensiver Menschenarbeit in volatilen, anspruchsvollen Kontexten — Führung, Vertriebsleitung, Krisenkoordination, Change Management.",
      medium: "Projektleitung, kundenseitige Rollen, in denen soziale Energie und Stresstoleranz gleichermaßen zählen.",
      watchOut: "Schwierig kann es sein, wenn sozialer Aktivität echte Tiefe fehlt oder andere deine emotionale Stabilität als Unempfindlichkeit deuten. Kommuniziere Empathie auch bewusst.",
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
    de: {
      strong: "Hochkomplexe, langfristige Projekte, die sowohl Ausdauer als auch emotionale Belastbarkeit erfordern — Operations, Programmleitung, Qualitätssicherung.",
      medium: "Regulierungs-, Compliance- oder Expertenrollen, in denen zuverlässige, gleichmäßige Leistung einen Wettbewerbsvorteil darstellt.",
      watchOut: "Deine ruhige Präzision kann manchmal den Eindruck erwecken, du nimmst emotionale Signale nicht wahr. Hol dir aktiv Feedback vom Team, um dem entgegenzuwirken.",
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
    de: {
      strong: "Forschungs-, strategische Analyse- oder Innovatorrollen, in denen das Entdecken des Unbekannten tiefen, nachhaltigen Fokus erfordert.",
      medium: "Explorative Beratungs- oder Produktstrategiearbeit passt ebenfalls gut, wenn Raum für tiefes Denken vorhanden ist.",
      watchOut: "Es kann schwierig sein, wenn Ergebnisdruck entsteht, bevor die Analyse wirklich vertieft ist. Kläre zu Zyklusbeginn die erwartete Tiefe und den Zeitrahmen.",
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
    de: {
      strong: "Projektmanagement, Teamleitung, operative Steuerung — wo strukturierte Ausführung und menschliche Mobilisierung gleichzeitig erwartet werden.",
      medium: "Vertriebliche oder kundenzentrierte Rollen funktionieren ebenfalls gut, wenn ein vorhersehbarer Prozess dahintersteht.",
      watchOut: "Schwierig kann es sein, wenn das Team weniger strukturiert arbeitet oder Ziele und Fristen sich laufend ändern. Bau einen minimalen Prozessrahmen auf, an den das Team anknüpfen kann.",
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
    de: {
      strong: "Teamaufbau, Moderation, Kundenbeziehungen, Coaching — wo Zusammenhalt, Vertrauen und das Stärken anderer der Hauptwert sind.",
      medium: "Vertrieb, Verhandlung und Partnerschaftsrollen sind ebenfalls starke Kontexte, wenn genügend echte Verbindung und Rückmeldung vorhanden sind.",
      watchOut: "Schwierig kann es werden, wenn du Konflikte eher harmonisierst als löst — das kann sich mit der Zeit ansammeln. Entwickle bewusst assertive Kommunikationsfähigkeiten.",
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
    de: {
      strong: "Ergebnisorientierte, wettbewerbsorientierte Umgebungen — Vertrieb, Geschäftsentwicklung, Wachstum, leistungsorientierte Führung.",
      medium: "Verhandlungs-, strategische und unternehmerische Rollen passen ebenfalls gut, wenn Ziele messbar und Erfolg klar definiert sind.",
      watchOut: "Ergebnisfokus kann manchmal die Teamdynamik in den Hintergrund drängen. Investiere bewusst in die Pflege von Beziehungen und baue eine regelmäßige Feedbackkultur auf.",
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
    de: {
      strong: "Disruptions-orientierte Rollen — Innovationsleiter, Unternehmer, strategischer Berater, wo das Hinterfragen von Konventionen Wert schafft.",
      medium: "Expertiseberatung und Forschungspositionen passen ebenfalls gut, wenn du genug Autonomie hast und kritisches Denken die Norm ist.",
      watchOut: "Schwierig kann es sein, wenn das Team unter starken Harmonieerwartungen arbeitet oder Konfrontation den Zusammenhalt beschädigt. Kanalisiere Feedback konstruktiv — gegen Ideen, nicht gegen Menschen.",
    },
  },
};

// ─── Block 4 – Környezeti preferencia táblázat ────────────────────────────────

export const BLOCK4_TITLE: LocalizedText = {
  hu: "Ideális környezet",
  en: "Ideal environment",
  de: "Ideales Umfeld",
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
      label: { hu: "Struktúra", en: "Structure", de: "Struktur" },
      value: { hu: "Magas – egyértelmű keretek, folyamatok, szabályok", en: "High – clear structure, processes, rules", de: "Hoch – klare Struktur, Prozesse, Regeln" },
    });
  } else if (categories.C === "low") {
    rows.push({
      label: { hu: "Struktúra", en: "Structure", de: "Struktur" },
      value: { hu: "Alacsony – rugalmas, önirányított", en: "Low – flexible, self-directed", de: "Niedrig – flexibel, selbstgeführt" },
    });
  } else {
    rows.push({
      label: { hu: "Struktúra", en: "Structure", de: "Struktur" },
      value: { hu: "Közepes – keretezett, de nem bürokratikus", en: "Medium – structured, but not bureaucratic", de: "Mittel – strukturiert, aber nicht bürokratisch" },
    });
  }

  // Társas intenzitás (X alapján)
  if (categories.X === "high") {
    rows.push({
      label: { hu: "Társas intenzitás", en: "Social intensity", de: "Soziale Intensität" },
      value: { hu: "Magas – csapatmunka, sok interakció", en: "High – teamwork, frequent interaction", de: "Hoch – Teamarbeit, häufige Interaktion" },
    });
  } else if (categories.X === "low") {
    rows.push({
      label: { hu: "Társas intenzitás", en: "Social intensity", de: "Soziale Intensität" },
      value: { hu: "Alacsony – önálló munka, kiscsapat", en: "Low – independent work, small team", de: "Niedrig – unabhängige Arbeit, kleines Team" },
    });
  } else {
    rows.push({
      label: { hu: "Társas intenzitás", en: "Social intensity", de: "Soziale Intensität" },
      value: { hu: "Alacsony-közepes – önálló + kiscsapat", en: "Low to medium – mostly independent, small-team collaboration", de: "Niedrig bis mittel – überwiegend eigenständig, Zusammenarbeit im kleinen Team" },
    });
  }

  // Változásgyakoriság (O és C alapján)
  if (categories.O === "high" && categories.C === "high") {
    rows.push({
      label: { hu: "Változásgyakoriság", en: "Change frequency", de: "Veränderungshäufigkeit" },
      value: { hu: "Közepes – evolúció strukturált keretek közt", en: "Medium – gradual change within clear boundaries", de: "Mittel – schrittweise Veränderung innerhalb klarer Leitplanken" },
    });
  } else if (categories.O === "high") {
    rows.push({
      label: { hu: "Változásgyakoriság", en: "Change frequency", de: "Veränderungshäufigkeit" },
      value: { hu: "Magas – szívesen dolgozol változó, ismeretlen közegben", en: "High – comfortable with shifting, novel environments", de: "Hoch – wohl in wechselnden, neuen Umgebungen" },
    });
  } else {
    rows.push({
      label: { hu: "Változásgyakoriság", en: "Change frequency", de: "Veränderungshäufigkeit" },
      value: { hu: "Alacsony-közepes – stabilitás, kiszámítható folyamatok", en: "Low to medium – stability, predictable processes", de: "Niedrig bis mittel – Stabilität, vorhersehbare Prozesse" },
    });
  }

  // Döntési sebesség (C és O alapján)
  if (categories.C === "high" && categories.O === "low") {
    rows.push({
      label: { hu: "Döntési sebesség", en: "Decision pace", de: "Entscheidungstempo" },
      value: { hu: "Közepes – átgondolt, szabályalapú döntések", en: "Medium – deliberate, rule-based decisions", de: "Mittel – durchdachte, regelbasierte Entscheidungen" },
    });
  } else if (categories.C === "low" && categories.O === "high") {
    rows.push({
      label: { hu: "Döntési sebesség", en: "Decision pace", de: "Entscheidungstempo" },
      value: { hu: "Gyors – intuitív, rugalmas döntéshozatal", en: "Fast – intuitive, flexible decision-making", de: "Schnell – intuitives, flexibles Entscheidungsverhalten" },
    });
  } else {
    rows.push({
      label: { hu: "Döntési sebesség", en: "Decision pace", de: "Entscheidungstempo" },
      value: { hu: "Közepes – átgondolt, de nem bürokratikus", en: "Medium – deliberate but not bureaucratic", de: "Mittel – durchdacht, aber nicht bürokratisch" },
    });
  }

  // Kultúra (H alapján – ha elérhető)
  if (categories.H === "high") {
    rows.push({
      label: { hu: "Kultúra", en: "Culture", de: "Kultur" },
      value: { hu: "Értékvezérelt, etikailag következetes", en: "Values-driven, ethically consistent", de: "Werteorientiert, ethisch stimmig" },
    });
  } else if (categories.H === "low") {
    rows.push({
      label: { hu: "Kultúra", en: "Culture", de: "Kultur" },
      value: { hu: "Teljesítményalapú, versengős kultúra tolerálható", en: "Performance-based, competitive culture acceptable", de: "Leistungsbasierte, wettbewerbsorientierte Kultur tolerierbar" },
    });
  }

  // Projektciklus (C és O alapján)
  if (categories.C === "high") {
    rows.push({
      label: { hu: "Projektciklus", en: "Project cycle", de: "Projektzyklus" },
      value: { hu: "Hosszú, mélyülő – alapos kivitelezés", en: "Long, deepening – thorough execution", de: "Lang, vertiefend – gründliche Ausführung" },
    });
  } else if (categories.O === "high") {
    rows.push({
      label: { hu: "Projektciklus", en: "Project cycle", de: "Projektzyklus" },
      value: { hu: "Rövid-közepes – felfedező, nehezebben zár le", en: "Short to medium – enjoys exploring, struggles to close", de: "Kurz bis mittel – erkundet gern, fällt das Abschließen schwer" },
    });
  } else {
    rows.push({
      label: { hu: "Projektciklus", en: "Project cycle", de: "Projektzyklus" },
      value: { hu: "Közepes – elmélyülő, de határidőtudatos", en: "Medium – thorough but deadline-aware", de: "Mittel – tiefgehend, aber terminbewusst" },
    });
  }

  // Stressz-tolerancia (E alapján)
  if (categories.E === "high") {
    rows.push({
      label: { hu: "Stressztűrés", en: "Stress tolerance", de: "Stresstoleranz" },
      value: { hu: "Alacsony-közepes – kiszámítható, alacsony nyomású közeg szükséges", en: "Low to medium – predictable, low-pressure environment needed", de: "Niedrig bis mittel – vorhersehbares Umfeld mit geringem Druck benötigt" },
    });
  } else if (categories.E === "low") {
    rows.push({
      label: { hu: "Stressztűrés", en: "Stress tolerance", de: "Stresstoleranz" },
      value: { hu: "Magas – jól tűri a nyomást és a bizonytalanságot", en: "High – handles pressure and uncertainty well", de: "Hoch – verträgt Druck und Unsicherheit gut" },
    });
  }

  return rows;
}

// ─── Block 3 – Általános narratíva (ha nincs tension pár) ────────────────────

export const DEFAULT_NARRATIVE: LocalizedText = {
  hu: "A profilod dimenzióit nézve jól illeszkedő, összhangban lévő mintázat rajzolódik ki. Nincs jellemző belső feszültség az egyes dimenziók között – ez gyakran azt jelenti, hogy a személyiséged különböző aspektusai erősítik egymást.",
  en: "Looking across your profile dimensions, a coherent pattern emerges. There is no notable internal tension between the dimensions — meaning the different aspects of your personality often reinforce each other.",
  de: "Wenn man sich die Dimensionen deines Profils ansieht, zeichnet sich ein stimmiges Muster ab. Es gibt keine nennenswerte innere Spannung zwischen den Dimensionen — das bedeutet, die verschiedenen Aspekte deiner Persönlichkeit verstärken sich oft gegenseitig.",
};

export const BLOCK2_TITLE: LocalizedText = {
  hu: "Dimenzióprofil",
  en: "Dimension profile",
  de: "Dimensionsprofil",
};

export const BLOCK3_TITLE: LocalizedText = {
  hu: "Ahogy működsz",
  en: "How you operate",
  de: "So funktionierst du",
};

export const BLOCK4_EMPTY: LocalizedText = {
  hu: "Most nincs egyetlen domináns irány: a dimenziók többsége középen van.",
  en: "No single dominant direction yet: most dimensions sit in the middle.",
  de: "Kein klar dominanter Trend: die meisten Dimensionen liegen im Mittelfeld.",
};

// ─── Solo dim narratives (Block 3 ha nincs tension pár) ──────────────────────

export const SOLO_DIM_NARRATIVES: Record<string, LocalizedText> = {
  H_high: {
    hu: "Az etikai integritás és az őszinteség az egyik legdominánsabb jellemződ. Igazra törekszel és hiteles akarsz lenni – ez a munkahelyi kapcsolataidban is erős, bizalomépítő alapot ad.",
    en: "Ethical integrity and honesty are among your most dominant traits. You seek truthfulness and strive to be authentic — this provides a strong, trust-building foundation in your professional relationships.",
    de: "Ethische Integrität und Ehrlichkeit gehören zu deinen dominantesten Merkmalen. Du strebst nach Wahrhaftigkeit und möchtest authentisch sein — das gibt dir eine starke, vertrauensbildende Grundlage in deinen beruflichen Beziehungen.",
  },
  H_low: {
    hu: "Ambiciózus és stratégiai gondolkodású vagy: nem riadsz vissza a kihívásoktól és a versenytől. A célok elérése hajtóerő számodra – a versengés és az önérvényesítés természetes közeged.",
    en: "Ambitious and strategic, you don't shy away from challenges or competition. Achieving goals is what drives you — competition and self-assertion are your natural environment.",
    de: "Ehrgeizig und strategisch schreckt du nicht vor Herausforderungen oder Wettbewerb zurück. Ziele zu erreichen ist dein Antrieb — Konkurrenz und Selbstbehauptung sind dein natürliches Umfeld.",
  },
  E_high: {
    hu: "Az érzelmi érzékenység az egyik meghatározó jellemződ. Empatikus vagy, és könnyen reagálsz a körülötted zajló eseményekre – ez értéket ad kapcsolataidnak, de igényli a megfelelő, támogató keretet.",
    en: "Emotional sensitivity is one of your defining traits. You are empathetic and respond readily to events around you — this adds value to your relationships but calls for a supportive, well-structured environment.",
    de: "Emotionale Sensibilität ist eines deiner prägenden Merkmale. Du bist einfühlsam und reagierst leicht auf Ereignisse um dich herum — das bereichert deine Beziehungen, erfordert aber einen unterstützenden, gut strukturierten Rahmen.",
  },
  E_low: {
    hu: "Kiemelkedő érzelmi stabilitás jellemez. Nyomás és bizonytalanság alatt is megőrzöd az egyensúlyodat – ez ritka és nagy értékű képesség változékony közegekben.",
    en: "You are characterized by outstanding emotional stability. You maintain your balance even under pressure and uncertainty — a rare and highly valuable ability in volatile environments.",
    de: "Du zeichnest dich durch herausragende emotionale Stabilität aus. Auch unter Druck und Unsicherheit bewahrst du dein Gleichgewicht — eine seltene und wertvolle Fähigkeit in volatilen Umgebungen.",
  },
  X_high: {
    hu: "Erősen extravertált vagy – a kapcsolatokból és interakciókból nyersz energiát. A társas tér a természetes közeged, és aktívan alakítod a közeg dinamikáját.",
    en: "You are strongly extraverted — you draw energy from relationships and interactions. Social space is your natural element, and you actively shape the dynamics around you.",
    de: "Du bist stark extrovertiert — du schöpfst Energie aus Beziehungen und Interaktionen. Der soziale Raum ist dein natürliches Element, und du gestaltest die Dynamiken um dich herum aktiv.",
  },
  X_low: {
    hu: "Introvertált beállítottság jellemez – önálló vagy kiscsoportos munkában töltöd fel az energiáidat. A mély fókusz és az autonómia az erősséged tere.",
    en: "You have an introverted disposition — you recharge through independent or small-group work. Deep focus and autonomy are where your strengths unfold.",
    de: "Du bist introvertiert — du tankst Energie durch eigenständige oder kleingruppenbasierte Arbeit. Tiefer Fokus und Autonomie sind der Raum, in dem deine Stärken sich entfalten.",
  },
  A_high: {
    hu: "Együttműködő, alkalmazkodó és kapcsolatorientált. A csapatkohézió és a harmónia természetes értéked – aktívan dolgozol a jó kapcsolatok fenntartásán.",
    en: "Cooperative, adaptable, and relationship-oriented. Team cohesion and harmony are values that come naturally to you — you actively work at maintaining good relationships.",
    de: "Kooperativ, anpassungsfähig und beziehungsorientiert. Teamkohäsion und Harmonie sind Werte, die dir natürlich liegen — du arbeitest aktiv daran, gute Beziehungen zu pflegen.",
  },
  A_low: {
    hu: "Egyenes, elvhű és önálló. A döntéseket nem a béke, hanem az igazság alapján hozod – ez erős véleményvezér és tárgyalópartner-profilt ad.",
    en: "Direct, principled, and independent. You make decisions based on truth, not comfort — this creates a strong opinion-leader and negotiating-partner profile.",
    de: "Direkt, prinzipientreu und eigenständig. Du triffst Entscheidungen nach Wahrheit, nicht nach Bequemlichkeit — das schafft ein starkes Meinungsführer- und Verhandlungspartner-Profil.",
  },
  C_high: {
    hu: "Szervezett, megbízható és következetes – a lelkiismeretesség erős bázist ad a teljesítményhez. A vállalt feladatokat gondosan kivitelezed, és értékeled a tiszta struktúrát.",
    en: "Organized, reliable, and consistent — conscientiousness provides a strong foundation for performance. You execute your commitments carefully and value clear structure.",
    de: "Organisiert, zuverlässig und konsequent — Gewissenhaftigkeit bildet eine starke Grundlage für Leistung. Du führst deine Verpflichtungen sorgfältig aus und schätzt klare Struktur.",
  },
  C_low: {
    hu: "Rugalmas és adaptív, inkább intuitív irányítású. A spontán megközelítés és az improvizáció az erősségeid – a folyamatos struktúra kevésbé motivál.",
    en: "Flexible and adaptive, you tend to operate more intuitively. Spontaneous approaches and improvisation are your strengths — rigid ongoing structure motivates you less.",
    de: "Flexibel und anpassungsfähig, du neigst eher zu intuitivem Vorgehen. Spontane Ansätze und Improvisation sind deine Stärken — starre, fortlaufende Struktur motiviert dich weniger.",
  },
  O_high: {
    hu: "Az újdonságra és a komplex gondolkodásra nyitott, kíváncsi személyiség. Az ismeretlen nem riaszt, hanem vonz – az innováció, a kreativitás és a feltárás természetes közeged.",
    en: "Curious and open to novelty and complex thinking. The unknown doesn't discourage you — it draws you in. Innovation, creativity, and discovery are your natural domains.",
    de: "Neugierig und offen für Neues und komplexes Denken. Das Unbekannte schreckt dich nicht — es zieht dich an. Innovation, Kreativität und Entdeckung sind deine natürlichen Bereiche.",
  },
  O_low: {
    hu: "Kiszámítható, konkrét és pragmatikus beállítottságú. A bevált megoldásokat részesíted előnyben – a stabilitás, a megbízhatóság és az ismert módszerek az erősséged.",
    en: "Predictable, concrete, and pragmatic. You prefer proven solutions — stability, reliability, and familiar methods are your strengths.",
    de: "Vorhersehbar, konkret und pragmatisch. Du bevorzugst bewährte Lösungen — Stabilität, Zuverlässigkeit und vertraute Methoden sind deine Stärken.",
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
    de: {
      strong: "Rollen mit hohem Vertrauen und klaren ethischen Standards: Compliance, Ethikberatung, Nonprofit, öffentlicher Dienst, Regulierungsfunktionen.",
      medium: "Jede Führungs- oder Expertenrolle, in der Integrität und Transparenz echte Anforderungen sind, nicht nur Worte.",
      watchOut: "Belastend wird es, wenn Leitwerte und Alltagspraxis auseinanderlaufen. Klärt früh Grenzen und gemeinsame Grundprinzipien.",
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
    de: {
      strong: "Wettbewerbsorientierte, ergebnisgetriebene Umfelder: Geschäftsentwicklung, Vertrieb, Wachstum, Unternehmertum, verhandlungsintensive Rollen.",
      medium: "Führungs-, Projekt- oder Strategierollen, in denen Ehrgeiz und Selbstvertrauen Rückenwind geben.",
      watchOut: "Wenn Wettbewerb gegen Personen geht, leidet die Teamdynamik. Richte die Energie auf gemeinsame Ziele und klare Spielregeln.",
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
    de: {
      strong: "Unterstützende, menschenzentrierte Rollen: HR, Coaching/Mentoring, Gesundheits- oder Sozialbereich, Customer Experience.",
      medium: "Beziehungsnahe Rollen (Kundenarbeit, Unterrichten, Verhandlung), in denen Empathie spürbaren Wert schafft.",
      watchOut: "Dauerhafter Druck und Unvorhersehbarkeit können auslaugen. Plane Erholungszeiten und halte eine einfache Stressroutine ein.",
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
    de: {
      strong: "Entscheidungsrollen unter hohem Druck und Krisenkontexte, in denen Ruhe ein Vorteil ist.",
      medium: "Change-Leadership, Transformation, Startups: wo Unsicherheit zum Job gehört.",
      watchOut: "Deine Stabilität kann als Kälte wirken. Benenne Absicht und Empathie bewusst, nicht nur Fakten.",
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
    de: {
      strong: "Sichtbare, beziehungsorientierte Rollen: Führung, Vertrieb, Kundenarbeit, Moderation, Community-Building.",
      medium: "Projekt- und Change-Rollen, in denen Aktivieren und Motivieren entscheidend sind.",
      watchOut: "Zu viel isolierte Arbeit kann auslaugen. Plane regelmäßigen, qualitativ guten menschlichen Kontakt ein.",
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
    de: {
      strong: "Rollen mit tiefem Fokus und Autonomie: Analyse, Entwicklung, Forschung, Strategie, technische Expertise.",
      medium: "Kleines Team oder asynchrone Zusammenarbeit funktioniert gut, wenn geschützte Fokuszeit bleibt.",
      watchOut: "Sehr soziale, dauerpräsente Rollen können auslaugen. Setze Grenzen bei Meetings und Sichtbarkeit.",
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
    de: {
      strong: "Rollen für Zusammenarbeit und Vertrauensaufbau: Moderation, HR, Beratung, Mediation, Account Management.",
      medium: "Partnerschaftsnahe Rollen, in denen stabile Beziehungen Ergebnisse tragen.",
      watchOut: "In Konflikten kann Direktheit zu kurz kommen und Spannung baut sich auf. Übe kurze, respektvolle, assertive Check-ins.",
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
    de: {
      strong: "Debatten, Verhandlung und kritische Reviews: Recht, Audit, Strategie, Expert Review.",
      medium: "Experten- oder Führungsrollen, in denen Klartext mehr Wert schafft als Harmonie um jeden Preis.",
      watchOut: "Direktheit kann das Team belasten. Gib Feedback konkret und konstruktiv: kritisiere Situationen und Ideen, nicht Personen.",
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
    de: {
      strong: "Komplexe, längerfristige Arbeit: Operations, Programmmanagement, Qualitätssicherung, Richtlinien, Compliance.",
      medium: "Strukturierte Expertenrollen, in denen Präzision und konsequente Umsetzung zum Standard gehören.",
      watchOut: "Frustrierend ist es, wenn Arbeit nie wirklich „zu“ ist oder Entscheidungen sich ziehen. Kläre, was als erledigt gilt und bis wann.",
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
    de: {
      strong: "Schnelle, experimentelle Umgebungen: Startups, kreative Teams, agile Produktarbeit, Prototyping.",
      medium: "Exploration und Ideengenerierung, wo schnelle Iteration der Punkt ist.",
      watchOut: "Lange, detailintensive Umsetzung kann auslaugen. Kombiniere dich mit jemandem (oder einem Prozess), der Struktur bis zum Ende trägt.",
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
    de: {
      strong: "Rollen, die Neues und komplexes Denken belohnen: Forschung, Strategie, Design, Produkt/Innovation, Unternehmertum.",
      medium: "Unterrichten, Beratung, Coaching, wo Neugier und Reframing Wert schaffen.",
      watchOut: "Abschließen kann schwerer sein als Erkunden. Nutze Timeboxes und setze klare Endpunkte im Voraus.",
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
    de: {
      strong: "Umsetzungs- und Stabilitätsrollen: Operations, Implementierung, Betrieb, Prozessarbeit.",
      medium: "Optimierung und systemische Problemlösung, wo Erfahrung die Qualität trägt.",
      watchOut: "Druck zu radikalen Experimenten kann Reibung erzeugen. Bitte um ein schrittweises Vorgehen: Pilots, Meilensteine, kontrolliertes Risiko.",
    },
  },
};
