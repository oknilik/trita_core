import type { ProfileCategory } from "./profile-engine";

export type Locale = "hu" | "en" | "de";
type LocalizedText = Record<Locale, string>;

// ─── Section title ────────────────────────────────────────────────────────────

export const SECTION_TITLE: LocalizedText = {
  hu: "Hogyan dolgozol?",
  en: "How do you work?",
  de: "Wie arbeitest du?",
};

// ─── Block 1 – Bevezető framing ───────────────────────────────────────────────

export const BLOCK1: LocalizedText = {
  hu: "Ez a profil nem azt mutatja meg, ki vagy – hanem azt, hogyan működsz valószínűsíthetően munkakörnyezetben. Nem típus, nem diagnózis. A személyiség dinamikus: a kontextus, a tapasztalat és a tudatos fejlődés mind alakítja. Amit itt látsz, az a jelenlegi mintázataid valószínűségi leírása.",
  en: "This profile doesn't reveal who you are — it describes how you likely operate in a work environment. It is not a type, not a diagnosis. Personality is dynamic: context, experience, and intentional growth all shape it. What you see here is a probabilistic description of your current patterns.",
  de: "Dieses Profil zeigt nicht, wer du bist – sondern wie du wahrscheinlich in einem Arbeitsumfeld funktionierst. Es ist kein Typ, keine Diagnose. Persönlichkeit ist dynamisch: Kontext, Erfahrung und bewusstes Wachstum formen sie. Was du hier siehst, ist eine probabilistische Beschreibung deiner aktuellen Muster.",
};

// ─── Block 8 – Záró framing ───────────────────────────────────────────────────

export const BLOCK8: LocalizedText = {
  hu: "Ez a profil egy kiindulópont, nem ítélet. A személyiség nem határoz meg – de megmutatja, hol valószínűleg a legkevesebb súrlódással tudsz a legtöbbet adni. A többi rajtad múlik.",
  en: "This profile is a starting point, not a verdict. Personality doesn't define you — but it shows where you can likely contribute most with the least friction. The rest is up to you.",
  de: "Dieses Profil ist ein Ausgangspunkt, kein Urteil. Persönlichkeit definiert dich nicht – aber sie zeigt, wo du wahrscheinlich am meisten beitragen kannst, mit der geringsten Reibung. Der Rest liegt bei dir.",
};

// ─── Dimenzió nevek (Block 2 megjelenítőhöz) ─────────────────────────────────

export const DIM_LABELS: Record<string, LocalizedText> = {
  H: { hu: "Honesty-Humility", en: "Honesty-Humility", de: "Ehrlichkeit-Bescheidenheit" },
  E: { hu: "Érzelmi érzékenység", en: "Emotionality", de: "Emotionalität" },
  X: { hu: "Extraversion", en: "Extraversion", de: "Extraversion" },
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
    hu: "Kísérletezni vonz, de nem bármit. Amit nem tartasz etikailag helyesnek, azt meg sem próbálod. Ez a felelős innovátor profilja: ahol a kreativitás keretben zajlik, és a kereteket te magad húzod meg.",
    en: "You are drawn to experimentation, but not unconditionally. You won't pursue what you consider ethically wrong. This is the responsible innovator profile: creativity operating within boundaries you define yourself.",
    de: "Du bist von Experimenten angezogen, aber nicht bedingungslos. Du wirst nicht verfolgen, was du ethisch für falsch hältst. Dies ist das Profil des verantwortungsbewussten Innovators: Kreativität innerhalb von Grenzen, die du selbst ziehst.",
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
    de: "Du vermeidest nicht die Menge, sondern oberflächliche Interaktion. Du leistest in kleingruppenbasierter, langfristiger, vertrauensbasierter Zusammenarbeit — wo du nicht mit jedem befreundet sein musst, nur mit deinen Kollegen.",
  },
  solitaryInnovator: {
    hu: "Nem brainstormban dolgozod ki az ötleteidet, hanem egyedül. A belső világ gazdagsága és az újdonságkeresés különleges profilt ad: szoliter kutató, stratégiai elemző, architekt típusú szerepek.",
    en: "You don't develop your ideas in brainstorms — you do it alone. The richness of your inner world combined with a drive for novelty creates a distinctive profile: solitary researcher, strategic analyst, architect-type roles.",
    de: "Du entwickelst deine Ideen nicht in Brainstormings — sondern allein. Der Reichtum deiner inneren Welt kombiniert mit dem Drang nach Neuem schafft ein unverwechselbares Profil: Einzelforscher, strategischer Analytiker, Architekten-Rollen.",
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
    en: "You are drawn to novel problems, but you do your best work within structured frameworks. This is not a contradiction — it is the natural profile of framed innovation.",
    de: "Du wirst von neuartigen Problemen angezogen, aber du leistest deine beste Arbeit innerhalb strukturierter Rahmenbedingungen. Dies ist kein Widerspruch — es ist das natürliche Profil gerahmter Innovation.",
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
    de: "Deine Extraversion und hohe Verträglichkeit schaffen außergewöhnliche Teamdynamiken. Es ist selten, dass jemand zugleich energetisierend und aufnahmebereit ist — bei dir ist das natürlich, und es macht dich zum Bindemittel, das Teams zusammenhält.",
  },
  performanceDriver: {
    hu: "Ambiciózus és szervezett – kemény munkával, következetes végrehajtással érsz el célokat. A versenyszellem és a precizitás nálad nem zárja ki egymást, hanem összefogja az eredményorientált profilodat.",
    en: "Ambitious and organized — you achieve goals through hard work and consistent execution. Competitive drive and precision don't exclude each other in your profile; they combine into a results-focused identity.",
    de: "Ehrgeizig und organisiert — du erreichst Ziele durch harte Arbeit und konsequente Umsetzung. Wettbewerbsgeist und Präzision schließen sich in deinem Profil nicht aus; sie verbinden sich zu einer ergebnisorientierten Identität.",
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
    en: "High internal standards combined with sensitivity require intentional structure. In a well-framed environment, you can sustain high quality in a balanced way.",
    de: "Hohe innere Maßstäbe in Kombination mit Sensibilität erfordern bewusste Struktur. In einem klar gerahmten Umfeld kannst du dauerhaft hohe Qualität in Balance halten.",
  },
  safeExperimentation: {
    hu: "Az újdonság vonz, de kiszámítható támaszpontokra is szükséged van. Akkor működsz jól, ha a kísérletezésnek világos ritmusa és határa van.",
    en: "Novelty attracts you, but you also need reliable anchors. You work best when experimentation has a clear rhythm and boundaries.",
    de: "Neues zieht dich an, zugleich brauchst du verlässliche Anker. Am besten arbeitest du, wenn Experimentieren einen klaren Rhythmus und Grenzen hat.",
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
    hu: "Stressz alatt is kiegyensúlyozottan maradsz, és az energiádat a kapcsolatokból merítve fenntartod azt. Olyan helyzetekben vagy erős, ahol egyszerre kell emberi jelenlét és stabilitás.",
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
    hu: "Nem félsz kikezdeni a status quót, és új irányokat keresel. A konfrontáció eszköz, nem akadály – az újdonság és az egyenességed egyszerre jelenik meg.",
    en: "You are not afraid to challenge the status quo and seek new directions. Confrontation is a tool, not an obstacle — novelty and directness show up together in your profile.",
    de: "Du scheust dich nicht, den Status quo in Frage zu stellen und neue Richtungen zu suchen. Konfrontation ist ein Werkzeug, kein Hindernis — Neuheit und Direktheit treten in deinem Profil gemeinsam auf.",
  },
};

// ─── Block 6 – Kombináció-insight fejléc ─────────────────────────────────────

export const BLOCK6_TITLE: LocalizedText = {
  hu: "Amit érdemes tudnod a profilodról",
  en: "What's worth knowing about your profile",
  de: "Was du über dein Profil wissen solltest",
};

// ─── Block 7 – Kockázati jelzők szövegei ─────────────────────────────────────

export const BLOCK7_TITLE: LocalizedText = {
  hu: "Figyelj erre",
  en: "Pay attention to this",
  de: "Achte darauf",
};

export const RISK_TEXTS: Record<string, LocalizedText> = {
  supportedVisibility: {
    hu: "Korai jel: a sok társas inger után gyorsan csökken az energiád. Védő lépés: tervezz fix visszajelzési pontokat és tudatos regenerációs időablakokat.",
    en: "Early sign: your energy drops quickly after sustained social intensity. Protective step: schedule fixed feedback points and deliberate recovery windows.",
    de: "Frühes Signal: Deine Energie fällt nach längerer sozialer Intensität schnell ab. Schutzschritt: Plane feste Feedback-Punkte und bewusste Regenerationsfenster ein.",
  },
  structuredStability: {
    hu: "Korai jel: túlzott önellenőrzés és folyamatos készenléti érzés. Védő lépés: bontsd a munkát rövid, egyértelmű szakaszokra, és állíts be reális lezárási pontokat.",
    en: "Early sign: excessive self-monitoring and a constant sense of alertness. Protective step: break work into short, clear phases and set realistic closure points.",
    de: "Frühes Signal: übermäßige Selbstkontrolle und ein ständiges Alarmgefühl. Schutzschritt: Teile Arbeit in kurze, klare Phasen und setze realistische Abschlussmarker.",
  },
  safeExperimentation: {
    hu: "Korai jel: sok irány között ugrálsz, de nehéz lezárni a döntéseket. Védő lépés: egyszerre legfeljebb 1-2 kísérletet futtass, előre definiált stop/fallback szabályokkal.",
    en: "Early sign: you jump across many directions while decision closure gets harder. Protective step: run at most 1-2 experiments at a time with predefined stop/fallback rules.",
    de: "Frühes Signal: Du springst zwischen vielen Richtungen, während Entscheidungen schwerer abgeschlossen werden. Schutzschritt: Fahre maximal 1-2 Experimente gleichzeitig mit vorab definierten Stop/Fallback-Regeln.",
  },
};

// ─── Block 5 – Szerepkör-família ajánlások ────────────────────────────────────

export const BLOCK5_TITLE: LocalizedText = {
  hu: "Szerepkör-família ajánlás",
  en: "Role family recommendations",
  de: "Rollenfamilien-Empfehlungen",
};

export const BLOCK5_STRONG: LocalizedText = {
  hu: "Erős illeszkedés valószínűsége",
  en: "Strong fit likely",
  de: "Starke Passung wahrscheinlich",
};

export const BLOCK5_MEDIUM: LocalizedText = {
  hu: "Közepes illeszkedés – tudatos készüléssel elérhető",
  en: "Medium fit — achievable with intentional preparation",
  de: "Mittlere Passung — mit bewusster Vorbereitung erreichbar",
};

export const BLOCK5_WATCH: LocalizedText = {
  hu: "Ahol érdemes tudatosan felkészülni",
  en: "Where intentional preparation pays off",
  de: "Wo bewusste Vorbereitung sich lohnt",
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
      medium: "You can still perform in multi-interest organizations if your ethical mandate is explicit.",
      watchOut: "It can be hard to work in environments where values exist only at the communication level. It helps to define shared ethical decision principles at the start.",
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
      medium: "Gyorsabb tempójú csapatban is működhetsz, ha vannak előre rögzített etikai guardrail-ek.",
      watchOut: "Nehéz lehet olyan tempójú közegben dolgozni, ahol az etikai kompromisszum csendes elvárás. Érdemes előre tisztázni a no-go kritériumokat és ezek mentén dönteni.",
    },
    en: {
      strong: "Innovation contexts where novelty and responsibility are expected together, not traded off against each other.",
      medium: "You can perform in faster teams if ethical guardrails are defined in advance.",
      watchOut: "It can be difficult in fast environments where ethical compromise is an implicit expectation. Define no-go criteria in advance and use them consistently.",
    },
    de: {
      strong: "Innovationsumfelder, in denen Neuheit und Verantwortung gemeinsam erwartet werden und kein Gegenspiel sind.",
      medium: "Auch in schnelleren Teams kannst du gut wirken, wenn ethische Leitplanken vorab definiert sind.",
      watchOut: "Schwierig wird es in schnellen Umfeldern, in denen ethische Kompromisse stillschweigend erwartet werden. No-go-Kriterien sollten früh definiert und konsequent genutzt werden.",
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
      watchOut: "Continuous social intensity can be draining without enough recovery space. Plan quiet blocks and fixed feedback checkpoints in advance.",
    },
    de: {
      strong: "Sichtbare, menschennahe Rollen mit psychologischer Sicherheit und regelmäßigem, konstruktivem Feedback.",
      medium: "Auch in sozial intensiveren Kontexten kannst du gut sein, wenn Regenerationsrhythmus und Rollengrenzen geschützt sind.",
      watchOut: "Dauerhafte soziale Intensität kann ohne ausreichende Regeneration stark belasten. Plane früh ruhige Arbeitsblöcke und feste Feedback-Checkpoints ein.",
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
      watchOut: "It can be hard when expectations are high but the environment stays unpredictable. Work in short cycles with clear closure points and explicit load limits.",
    },
    de: {
      strong: "Vorhersehbare, strukturierte Abläufe, in denen hohe Qualität in gesundem Tempo gehalten werden kann.",
      medium: "Auch in dynamischeren Kontexten kannst du gut wirken, wenn Prioritäten und Fristen klar stabil bleiben.",
      watchOut: "Schwierig wird es, wenn hohe Erwartungen auf dauerhaft geringe Planbarkeit treffen. Hilfreich sind kurze Arbeitszyklen mit klaren Abschlussmarkern und expliziten Belastungsgrenzen.",
    },
  },
  safeExperimentation: {
    hu: {
      strong: "Kísérletező közegek, ahol van biztonsági háló: lehet újat próbálni, de kontrollált keretben.",
      medium: "Gyors változás mellett is jól működhetsz, ha a döntési ritmus és fallback opciók előre tisztázottak.",
      watchOut: "Megterhelő lehet, ha egyszerre túl sok irány nyílik meg és nincs kapaszkodó a döntésekhez. Érdemes egyszerre legfeljebb 1-2 prioritást futtatni, előre rögzített stop-szabályokkal.",
    },
    en: {
      strong: "Experimental environments with a safety net: room to try new things, inside controlled boundaries.",
      medium: "You can work well in fast change if decision cadence and fallback options are clarified upfront.",
      watchOut: "It becomes difficult when too many directions open at once without clear decision anchors. Keep active priorities to 1-2 and use predefined stop rules.",
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
      medium: "Csapatos környezetben is jól működhetsz, ha védett deep-work idő és aszinkron együttműködés biztosított.",
      watchOut: "Megterhelő lehet, ha a munka ritmusát folyamatos meetingek törik meg. Érdemes fix fókuszidőt és aszinkron döntéselőkészítést előre rögzíteni.",
    },
    en: {
      strong: "Work that allows deep focus, autonomy, and longer thinking cycles to build distinctive solutions.",
      medium: "You can still perform in team settings if protected deep-work time and async collaboration are in place.",
      watchOut: "It can be draining when continuous meetings keep breaking work rhythm. Protect fixed focus time and define async decision-preparation flows.",
    },
    de: {
      strong: "Arbeit mit tiefem Fokus, Autonomie und längeren Denkzyklen, in denen du eigenständige Lösungen entwickeln kannst.",
      medium: "Auch im Team kannst du gut arbeiten, wenn geschützte Deep-Work-Zeit und asynchrone Zusammenarbeit vorhanden sind.",
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
      medium: "Konszenzusosabb kultúrában is eredményes lehetsz, ha a sikerkritériumok és ownership tiszta.",
      watchOut: "Megterhelő lehet, ha a teljesítményelvárások homályosak vagy folyamatosan változnak. Érdemes közös sikerkritériumokat és döntési felelősségeket egyértelműen rögzíteni.",
    },
    en: {
      strong: "Competitive settings with measurable outcomes, explicit goals, and clear accountability layers.",
      medium: "You can also perform in consensus-leaning cultures if success criteria and ownership stay explicit.",
      watchOut: "It can be frustrating when performance expectations are ambiguous or keep shifting. Align early on shared success criteria and clear decision ownership.",
    },
    de: {
      strong: "Wettbewerbsumfelder mit messbaren Ergebnissen, klaren Zielen und eindeutigen Verantwortungsstufen.",
      medium: "Auch in konsensorientierten Kulturen kannst du gut wirken, wenn Erfolgskriterien und Ownership klar bleiben.",
      watchOut: "Schwierig wird es, wenn Leistungserwartungen unklar sind oder laufend wechseln. Legt früh gemeinsame Erfolgskriterien und klare Entscheidungsverantwortung fest.",
    },
  },
  structuredInnovator: {
    hu: {
      strong: "Komplex problémák, ahol egyszerre kell újítani és rendszerben tartani a megvalósítást.",
      medium: "Gyorsabb, kreatívabb közegben is jól működhetsz, ha vannak minimális folyamatkeretek és döntési kapuk.",
      watchOut: "Nehéz lehet, ha egyszerre túl sok irány fut nyitva, és a kivitelezés elveszíti a fókuszt. Segít, ha iterációnként fix scope-pal, priorizált backloggal és világos lezárási kritériumokkal dolgoztok.",
    },
    en: {
      strong: "Complex problems where you must innovate while keeping execution coherent and structured.",
      medium: "You can also do well in faster creative contexts if minimal process frames and decision gates exist.",
      watchOut: "It can become difficult when too many directions stay open and execution loses focus. Work with fixed per-iteration scope, a prioritized backlog, and clear closure criteria.",
    },
    de: {
      strong: "Komplexe Probleme, bei denen Innovation und strukturierte Umsetzung gleichzeitig nötig sind.",
      medium: "Auch in schnelleren kreativen Kontexten kannst du gut arbeiten, wenn minimale Prozessrahmen und Entscheidungs-Gates vorhanden sind.",
      watchOut: "Schwierig wird es, wenn zu viele Richtungen offen bleiben und die Umsetzung den Fokus verliert. Arbeitet mit fixem Scope pro Iteration, priorisiertem Backlog und klaren Abschlusskriterien.",
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
      medium: "Szabályozói, compliance vagy szakértői szerepek, ahol a megbízható, egyenletes teljesítmény tőke.",
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
      watchOut: "Megterhelő lehet, ha az eredményre nyomás nehezedik mielőtt az elemzés valóban méllyé válhat. Érdemes ciklus elején rögzíteni az elvárt mélységet és határidőt.",
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
      watchOut: "Schwierig kann es sein, wenn das Team weniger strukturiert arbeitet oder Ziele und Fristen sich laufend ändern. Bau einen minimalen Prozessrahmen auf, in den das Team eintauchen kann.",
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
      strong: "Teamaufbau, Moderation, Kundenbeziehungen, Coaching — wo Zusammenhalt, Vertrauen und Energiespenden der Hauptwert sind.",
      medium: "Vertrieb, Verhandlung und Partnerschaftsrollen sind ebenfalls starke Kontexte, wenn genügend echte Verbindung und Rückmeldung vorhanden sind.",
      watchOut: "Schwierig kann es werden, wenn du Konflikte eher harmonisierst als löst — das kann sich mit der Zeit ansammeln. Entwickle bewusst assertive Kommunikationsfähigkeiten.",
    },
  },
  performanceDriver: {
    hu: {
      strong: "Eredményalapú, versengő közegek – értékesítés, üzletfejlesztés, growth, teljesítményorientált vezető szerep.",
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
      medium: "Expertiseberatung und Forschungspositionen sind ebenfalls ein starkes Match, wenn du genug Autonomie hast und kritisches Denken die Norm ist.",
      watchOut: "Schwierig kann es sein, wenn das Team unter starken Harmonieerwartungen arbeitet oder Konfrontation den Zusammenhalt beschädigt. Kanalisiere Feedback konstruktiv — gegen Ideen, nicht gegen Menschen.",
    },
  },
};

// ─── Block 4 – Környezeti preferencia táblázat ────────────────────────────────

export const BLOCK4_TITLE: LocalizedText = {
  hu: "Valószínűleg kedvező környezeti jellemzők",
  en: "Likely favorable work environment characteristics",
  de: "Wahrscheinlich günstige Arbeitsumgebungsmerkmale",
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
      value: { hu: "Magas – egyértelmű scope, folyamatok, szabályok", en: "High – clear scope, processes, rules", de: "Hoch – klarer Scope, Prozesse, Regeln" },
    });
  } else if (categories.C === "low") {
    rows.push({
      label: { hu: "Struktúra", en: "Structure", de: "Struktur" },
      value: { hu: "Alacsony – rugalmas, önirányított", en: "Low – flexible, self-directed", de: "Niedrig – flexibel, selbstgeführt" },
    });
  } else {
    rows.push({
      label: { hu: "Struktúra", en: "Structure", de: "Struktur" },
      value: { hu: "Közepes – keretezett, de nem bürokratikus", en: "Medium – framed but not bureaucratic", de: "Mittel – gerahmt, aber nicht bürokratisch" },
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
      value: { hu: "Alacsony-közepes – önálló + kiscsapat", en: "Low to medium – independent + small team", de: "Niedrig bis mittel – eigenständig + kleines Team" },
    });
  }

  // Változásgyakoriság (O és C alapján)
  if (categories.O === "high" && categories.C === "high") {
    rows.push({
      label: { hu: "Változásgyakoriság", en: "Change frequency", de: "Veränderungshäufigkeit" },
      value: { hu: "Közepes – evolúció strukturált keretek közt", en: "Medium – evolution within structured frames", de: "Mittel – Evolution innerhalb strukturierter Rahmenbedingungen" },
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
      value: { hu: "Értékvezérelt, etikailag kongruens", en: "Values-driven, ethically congruent", de: "Werteorientiert, ethisch kongruent" },
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
      value: { hu: "Rövid-közepes – szeret felfedezni, nehezebben zár le", en: "Short to medium – enjoys exploring, struggles to close", de: "Kurz bis mittel – erkundet gern, fällt das Abschließen schwer" },
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
  hu: "A profilod dimenzióit nézve jól illeszkedő, kongruens mintázat rajzolódik ki. Nincs jellemző belső feszültség az egyes dimenziók között – ez azt jelenti, hogy a személyiséged különböző aspektusai általában erősítik egymást.",
  en: "Looking at your profile dimensions, a well-fitting, congruent pattern emerges. There is no notable internal tension between the dimensions — meaning the different aspects of your personality generally reinforce each other.",
  de: "Wenn man sich die Dimensionen deines Profils ansieht, zeichnet sich ein gut passendes, kongruentes Muster ab. Es gibt keine nennenswerte innere Spannung zwischen den Dimensionen — das bedeutet, die verschiedenen Aspekte deiner Persönlichkeit verstärken sich in der Regel gegenseitig.",
};

export const BLOCK3_TITLE: LocalizedText = {
  hu: "Működési mintázatok",
  en: "Operating patterns",
  de: "Verhaltensmuster",
};

export const BLOCK4_EMPTY: LocalizedText = {
  hu: "A pontozás alapján nem rajzolódik ki egyértelmű irány – a dimenziók többsége közepes sávban van.",
  en: "Based on your scores, no clear direction emerges — most dimensions fall in the medium range.",
  de: "Basierend auf deinen Werten zeichnet sich keine klare Richtung ab — die meisten Dimensionen liegen im mittleren Bereich.",
};

// ─── Solo dim narratives (Block 3 ha nincs tension pár) ──────────────────────

export const SOLO_DIM_NARRATIVES: Record<string, LocalizedText> = {
  H_high: {
    hu: "Az etikai integritás és az őszinteség az egyik legdominánsabb jellemződ. Igazra törekszik és hiteles akarsz lenni – ez a munkahelyi kapcsolataidban is erős, bizalomépítő alapot ad.",
    en: "Ethical integrity and honesty are among your most dominant traits. You seek truthfulness and strive to be authentic — this provides a strong, trust-building foundation in your professional relationships.",
    de: "Ethische Integrität und Ehrlichkeit gehören zu deinen dominantesten Merkmalen. Du strebst nach Wahrhaftigkeit und möchtest authentisch sein — das gibt dir eine starke, vertrauensbildende Grundlage in deinen beruflichen Beziehungen.",
  },
  H_low: {
    hu: "Ambiciózus és stratégiai gondolkodású, aki nem riad vissza a kihívásoktól és a versenytől. A célok elérése hajtóerő – a versengés és az önérvényesítés természetes közeg számodra.",
    en: "Ambitious and strategic, you don't shy away from challenges or competition. Achieving goals is what drives you — competition and self-assertion are your natural environment.",
    de: "Ehrgeizig und strategisch schreckt du nicht vor Herausforderungen oder Wettbewerb zurück. Ziele zu erreichen ist dein Antrieb — Konkurrenz und Selbstbehauptung sind dein natürliches Umfeld.",
  },
  E_high: {
    hu: "Az érzelmi érzékenység az egyik meghatározó jellemződ. Empátiás és könnyen reagálsz a körülötted zajló eseményekre – ez értéket ad kapcsolataidnak, de igényli a megfelelő, támogató keretet.",
    en: "Emotional sensitivity is one of your defining traits. You are empathetic and respond readily to events around you — this adds value to your relationships but calls for a supportive, well-structured environment.",
    de: "Emotionale Sensibilität ist eines deiner prägenden Merkmale. Du bist einfühlsam und reagierst leicht auf Ereignisse um dich herum — das bereichert deine Beziehungen, erfordert aber einen unterstützenden, gut strukturierten Rahmen.",
  },
  E_low: {
    hu: "Kiemelkedő érzelmi stabilitás jellemez. Nyomás és bizonytalanság alatt is megőrzöd az egyensúlyodat – ez ritka és nagy értékű képesség változékony közegekben.",
    en: "You are characterized by outstanding emotional stability. You maintain your balance even under pressure and uncertainty — a rare and highly valuable ability in volatile environments.",
    de: "Du zeichnest dich durch herausragende emotionale Stabilität aus. Auch unter Druck und Unsicherheit bewahrst du dein Gleichgewicht — eine seltene und wertvolle Fähigkeit in volatilen Umgebungen.",
  },
  X_high: {
    hu: "Erősen extravertált vagy – a kapcsolatokból és interakciókból nyersz energiát. Természetes elem a társas tér, és aktívan alakítod a közeg dinamikáját.",
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
      strong: "Etikai követelményszintű, magas bizalomigényű pozíciók – compliance, etikai tanácsadás, nonprofit, közszolgálat, szabályozói funkciók.",
      medium: "Bármely vezető vagy szakértői szerep, ahol az integritás és az átláthatóság nem csak kommunikáció, hanem tényleges elvárás.",
      watchOut: "Megterhelő lehet, ha a szervezeti kultúra más értékeket követ a valóságban. Érdemes már az elején etikai alapelveket rögzíteni közösen.",
    },
    en: {
      strong: "Positions requiring ethical standards and high trust — compliance, ethics consulting, nonprofit, public service, regulatory functions.",
      medium: "Any leadership or expert role where integrity and transparency are genuine expectations, not just communication.",
      watchOut: "It can be draining if the organizational culture follows different values in practice. Define shared ethical principles at the start.",
    },
    de: {
      strong: "Positionen mit ethischen Anforderungen und hohem Vertrauensbedarf — Compliance, Ethikberatung, Nonprofit, öffentlicher Dienst, Regulierungsfunktionen.",
      medium: "Jede Führungs- oder Expertenrolle, in der Integrität und Transparenz echte Erwartungen sind und nicht nur Kommunikation.",
      watchOut: "Belastend kann es sein, wenn die Organisationskultur in der Praxis andere Werte lebt. Legt gemeinsam ethische Grundprinzipien von Anfang an fest.",
    },
  },
  H_low: {
    hu: {
      strong: "Eredményfókuszú, versengő közegek – üzletfejlesztés, értékesítés, growth, vállalkozói szerepek, tárgyalásintenzív pozíciók.",
      medium: "Projektvezető, stratégiai tanácsadó, vezető szerep – ahol az önbizalom és az ambíció erőforrás, nem korlát.",
      watchOut: "Hosszú távon megterhelő lehet, ha az ambíció csapatdinamikát rombol. Érdemes a versengést inkább belső célokra irányítani.",
    },
    en: {
      strong: "Results-driven, competitive settings — business development, sales, growth, entrepreneurial roles, negotiation-heavy positions.",
      medium: "Project manager, strategic advisor, leadership role — where self-confidence and ambition are assets, not limitations.",
      watchOut: "Over time it can become draining if ambition damages team dynamics. Direct competitive energy toward internal goals rather than against people.",
    },
    de: {
      strong: "Ergebnisorientierte, wettbewerbsorientierte Umfelder — Geschäftsentwicklung, Vertrieb, Wachstum, unternehmerische Rollen, verhandlungsintensive Positionen.",
      medium: "Projektleiter, strategischer Berater, Führungsrolle — wo Selbstvertrauen und Ehrgeiz Ressourcen sind, keine Hindernisse.",
      watchOut: "Langfristig kann es zermürbend werden, wenn Ehrgeiz die Teamdynamik belastet. Richte Wettbewerbsenergie lieber auf interne Ziele aus, nicht gegen Personen.",
    },
  },
  E_high: {
    hu: {
      strong: "Támogató, emberközeli szerepek – HR, coaching, mentoring, egészségügyi vagy szociális szféra, ügyfélélmény-fókuszú pozíciók.",
      medium: "Vevőkapcsolat, tárgyalás, oktatás – ahol az empatikus jelenlét és az érzelmi hangolódás értéket teremt.",
      watchOut: "Magas nyomású, kiszámíthatatlan környezet tartósan megterhelő lehet. Tervezz be rendszeres regenerációs időt és alakíts ki stresszkezelési rutinokat.",
    },
    en: {
      strong: "Supportive, people-centered roles — HR, coaching, mentoring, healthcare or social sector, customer-experience-focused positions.",
      medium: "Customer relations, negotiation, teaching — where empathic presence and emotional attunement create value.",
      watchOut: "High-pressure, unpredictable environments can be chronically draining. Schedule regular recovery time and establish stress management routines.",
    },
    de: {
      strong: "Unterstützende, menschenzentrierte Rollen — HR, Coaching, Mentoring, Gesundheits- oder Sozialbereich, kundenerlebnisfokussierte Positionen.",
      medium: "Kundenbeziehungen, Verhandlung, Unterrichten — wo empathische Präsenz und emotionale Abstimmung Wert schaffen.",
      watchOut: "Hochdruckvolle, unvorhersehbare Umgebungen können dauerhaft zermürbend sein. Plane regelmäßige Erholungszeiten ein und entwickle Stressbewältigungsroutinen.",
    },
  },
  E_low: {
    hu: {
      strong: "Kríziskezelés, versenyhelyzetek, nagy nyomású döntési szerepek – ahol az érzelmi stabilitás az egyik legalapvetőbb tőke.",
      medium: "Változásvezetői, transzformációs szerepek, startupkörnyezet – ahol a bizonytalanság nem akadály, hanem munkaanyag.",
      watchOut: "Előfordulhat, hogy a stabilitásodat a csapat érzéketlenségként értelmezi. Érdemes tudatosan kommunikálni az empátiát, nemcsak a semlegességet.",
    },
    en: {
      strong: "Crisis management, competitive contexts, high-pressure decision-making roles — where emotional stability is one of the most fundamental assets.",
      medium: "Change leadership, transformation roles, startup environments — where uncertainty is not an obstacle but the working material.",
      watchOut: "Others may sometimes read your stability as insensitivity. Consciously communicate empathy, not just neutrality.",
    },
    de: {
      strong: "Krisenmanagement, wettbewerbsintensive Kontexte, Entscheidungsrollen unter hohem Druck — wo emotionale Stabilität eines der grundlegendsten Kapital ist.",
      medium: "Change-Leadership, Transformationsrollen, Startup-Umgebungen — wo Unsicherheit kein Hindernis ist, sondern das Arbeitsmaterial.",
      watchOut: "Andere könnten deine Stabilität manchmal als Unempfindlichkeit deuten. Kommuniziere Empathie bewusst, nicht nur Neutralität.",
    },
  },
  X_high: {
    hu: {
      strong: "Emberközeli, látható, kapcsolati fókuszú szerepek – vezető, értékesítés, közvetlen ügyfélmunka, facilitáció, közösségépítés.",
      medium: "Projektvezető, változáskezelő – ahol az aktiválás, motiválás és mozgósítás a fő feladat.",
      watchOut: "Tartós izolált munka vagy minimális emberi interakció demotiváló és kimerítő lehet. Gondoskodj rendszeres emberi kontaktról a munkarendedben.",
    },
    en: {
      strong: "People-facing, visible, relationship-focused roles — leadership, sales, direct client work, facilitation, community building.",
      medium: "Project management, change management — where activating, motivating, and mobilizing people is the primary task.",
      watchOut: "Sustained isolated work or minimal human interaction can be demotivating and draining. Build regular human contact into your work routine.",
    },
    de: {
      strong: "Menschennahe, sichtbare, beziehungsorientierte Rollen — Führung, Vertrieb, direkte Kundenkontakt, Moderation, Gemeinschaftsaufbau.",
      medium: "Projektmanagement, Change Management — wo Aktivieren, Motivieren und Mobilisieren von Menschen die Hauptaufgabe ist.",
      watchOut: "Anhaltende isolierte Arbeit oder minimaler menschlicher Kontakt kann demotivierend und erschöpfend sein. Baue regelmäßigen menschlichen Kontakt in deinen Arbeitsalltag ein.",
    },
  },
  X_low: {
    hu: {
      strong: "Mély fókuszt igénylő, autonóm munkakörök – elemzés, fejlesztés, kutatás, stratégia, technikai szakértői pozíciók.",
      medium: "Kiscsapatos együttműködések, mentoring, aszinkron projektek is erős közeg, ha van elegendő önálló tér.",
      watchOut: "Reprezentatív, láthatóság-igényes szerepek tartósan kimerítők lehetnek. Érdemes határokat húzni a nyilvános szereplések köré, és tudatosan regenerálódni.",
    },
    en: {
      strong: "Deep-focus, autonomous roles — analysis, development, research, strategy, technical expert positions.",
      medium: "Small-team collaboration, mentoring, asynchronous projects are also a strong fit if enough independent space is preserved.",
      watchOut: "Representative, high-visibility roles can be chronically draining. Set clear boundaries around public appearances and recharge deliberately.",
    },
    de: {
      strong: "Tiefenfokus-, autonome Rollen — Analyse, Entwicklung, Forschung, Strategie, technische Expertenpositionen.",
      medium: "Kleingruppenarbeit, Mentoring, asynchrone Projekte sind ebenfalls ein starkes Match, wenn genug eigenständiger Raum erhalten bleibt.",
      watchOut: "Repräsentative, sichtbarkeitsintensive Rollen können chronisch erschöpfend sein. Setze klare Grenzen um öffentliche Auftritte und erhol dich bewusst.",
    },
  },
  A_high: {
    hu: {
      strong: "Együttműködési és harmonizációs szerepek – facilitátor, csapatépítő, HR, tanácsadó, mediátor, ügyfélmenedzsment.",
      medium: "Long-term partnerségi pozíciók, vevőkapcsolat – ahol a bizalom és a stabilitás döntő tényező az eredményben.",
      watchOut: "Ahol direktebb konfrontációra lenne szükség, hajlamos lehetsz elkerülni azt – ez konfliktusok felhalmozódásához vezethet. Érdemes az asszertív kommunikációt tudatosan fejleszteni.",
    },
    en: {
      strong: "Collaborative and harmonizing roles — facilitator, team builder, HR, advisor, mediator, client management.",
      medium: "Long-term partnership positions, customer relationship management — where trust and stability are decisive factors in outcomes.",
      watchOut: "Where more direct confrontation is needed, you may tend to avoid it — this can lead to conflict accumulation. Consciously develop assertive communication.",
    },
    de: {
      strong: "Kooperative und harmonisierende Rollen — Moderator, Teamaufbau, HR, Berater, Mediator, Kundenmanagement.",
      medium: "Langfristige Partnerschaftspositionen, Kundenbeziehungsmanagement — wo Vertrauen und Stabilität entscheidende Faktoren für Ergebnisse sind.",
      watchOut: "Wo direktere Konfrontation nötig wäre, neigst du möglicherweise dazu, sie zu vermeiden — das kann zur Ansammlung von Konflikten führen. Entwickle assertive Kommunikation bewusst.",
    },
  },
  A_low: {
    hu: {
      strong: "Tárgyalások, vitás helyzetek, versenykörnyezetek – kritikus visszajelzést igénylő szakértői, jogi, stratégiai vagy audit szerepek.",
      medium: "Egyéni szakértői, vezető, stratégiai tanácsadói pozíciók, ahol az igazság kimondása több értéket teremt, mint a harmónia fenntartása.",
      watchOut: "A konfrontatív stílus csapatdinamikát feszíthet. Érdemes a visszajelzést strukturáltan és konstruktívan adni – ötletek és helyzetek ellen, ne személyek ellen.",
    },
    en: {
      strong: "Negotiations, disputes, competitive environments — expert, legal, strategic, or audit roles requiring critical feedback.",
      medium: "Individual expert, leadership, or strategic advisor positions where speaking truth creates more value than maintaining harmony.",
      watchOut: "A confrontational style can put strain on team dynamics. Structure and deliver feedback constructively — against ideas and situations, not against people.",
    },
    de: {
      strong: "Verhandlungen, Streitigkeiten, wettbewerbsorientierte Umgebungen — Experten-, Rechts-, Strategie- oder Auditrollen, die kritisches Feedback erfordern.",
      medium: "Einzelne Experten-, Führungs- oder strategische Beraterposition, wo die Wahrheit zu sagen mehr Wert schafft als Harmonie zu wahren.",
      watchOut: "Ein konfrontativer Stil kann Teamdynamiken belasten. Strukturiere und liefere Feedback konstruktiv — gegen Ideen und Situationen, nicht gegen Personen.",
    },
  },
  C_high: {
    hu: {
      strong: "Komplex, hosszabb futamidejű projektek – műveletek, programvezetés, minőségbiztosítás, szabályzati és compliance funkciók.",
      medium: "Bármely strukturált szakértői szerep, ahol a precizitás, az elmélyülés és a következetes kivitelezés elvárás.",
      watchOut: "Megterhelő lehet, ha a feladatok rendre nyitva maradnak, vagy ha a döntések tartósan bizonytalanok. Érdemes expliciten definiálni, mi számít lezártnak és mikorra.",
    },
    en: {
      strong: "Complex, longer-cycle projects — operations, program management, quality assurance, policy and compliance functions.",
      medium: "Any structured expert role where precision, depth, and consistent execution are expected.",
      watchOut: "It can be draining if tasks consistently remain open or decisions stay chronically uncertain. Explicitly define what counts as closed and by when.",
    },
    de: {
      strong: "Komplexe, längerfristige Projekte — Operations, Programmmanagement, Qualitätssicherung, Richtlinien- und Compliance-Funktionen.",
      medium: "Jede strukturierte Expertenrolle, in der Präzision, Tiefe und konsequente Ausführung erwartet werden.",
      watchOut: "Es kann zermürbend sein, wenn Aufgaben konsequent offen bleiben oder Entscheidungen dauerhaft ungewiss sind. Definiere explizit, was als abgeschlossen gilt und bis wann.",
    },
  },
  C_low: {
    hu: {
      strong: "Dinamikus, kísérletezős, kreatív közegek – startup, kreatív ipar, agilis csapatok, ahol a rugalmasság és az adaptivitás értékes.",
      medium: "Üzletfejlesztési, explorációs, ötletgeneráló szerepek, ahol a rugalmas iteráció és a gyors váltás a cél.",
      watchOut: "Hosszabb határidős, részletes kivitelezést igénylő feladatok megterhelők lehetnek. Érdemes párosítani magad valakivel, aki a strukturált végrehajtást viszi.",
    },
    en: {
      strong: "Dynamic, experimental, creative environments — startups, creative industries, agile teams where flexibility and adaptability create value.",
      medium: "Business development, exploratory, or idea-generation roles where flexible iteration and quick pivots are the goal.",
      watchOut: "Long-deadline, detail-intensive execution can be draining. Pair yourself with someone who carries the structured execution side.",
    },
    de: {
      strong: "Dynamische, experimentelle, kreative Umgebungen — Startups, Kreativwirtschaft, agile Teams, wo Flexibilität und Anpassungsfähigkeit Wert schaffen.",
      medium: "Geschäftsentwicklung, explorative oder Ideengenerierungsrollen, wo flexible Iteration und schnelle Schwenks das Ziel sind.",
      watchOut: "Aufgaben mit langen Fristen und detailintensiver Ausführung können zermürbend sein. Paare dich mit jemandem, der die strukturierte Ausführungsseite übernimmt.",
    },
  },
  O_high: {
    hu: {
      strong: "Kreatív és innovatív szerepkörök – stratéga, kutató, designer, vállalkozó, ahol az új gondolatok és a komplex kérdések értékesek.",
      medium: "Oktatás, tanácsadás, coaching – ahol a komplex gondolkodás, a kíváncsiság és a perspektívaváltás értéket teremt.",
      watchOut: "A befejezés és a fókuszált kivitelezés időnként nehezebb lehet, mint a felfedezés. Érdemes időhatáros, iteratív munkamódszert alkalmazni és a lezárási pontokat előre rögzíteni.",
    },
    en: {
      strong: "Creative and innovative roles — strategist, researcher, designer, entrepreneur, where new ideas and complex questions are valued.",
      medium: "Teaching, consulting, coaching — where complex thinking, curiosity, and perspective-shifting create value.",
      watchOut: "Finishing and focused execution can sometimes be harder than exploring. Use time-boxed, iterative work methods and define closure points in advance.",
    },
    de: {
      strong: "Kreative und innovative Rollen — Stratege, Forscher, Designer, Unternehmer, wo neue Ideen und komplexe Fragen geschätzt werden.",
      medium: "Unterrichten, Beratung, Coaching — wo komplexes Denken, Neugier und Perspektivenwechsel Wert schaffen.",
      watchOut: "Abschließen und fokussierte Ausführung können manchmal schwieriger sein als Erkunden. Nutze zeitlich begrenzte, iterative Arbeitsmethoden und definiere Abschlussmarker im Voraus.",
    },
  },
  O_low: {
    hu: {
      strong: "Végrehajtó, operatív, implementációs szerepek – ahol a bevált módszerek, a megbízható kivitelezés és a stabilitás a fő értékek.",
      medium: "Rendszerszintű problémamegoldás, optimalizálás, üzemeltetési fejlesztések – ahol a tapasztalat és a stabilitás az eredmény alapja.",
      watchOut: "Radikálisan új ötletekre és kísérleti irányokra nyomás esetén feszültség keletkezhet. Érdemes fokozatos, kontrollált közelítést alkalmazni az ismeretlen területekhez.",
    },
    en: {
      strong: "Execution, operational, and implementation roles — where proven methods, reliable delivery, and stability are the primary values.",
      medium: "System-level problem solving, optimization, operational improvements — where experience and stability are the foundation of results.",
      watchOut: "Pressure toward radically new ideas or experimental directions can create friction. Approach unfamiliar territory with a gradual, controlled method.",
    },
    de: {
      strong: "Ausführungs-, operative und Implementierungsrollen — wo bewährte Methoden, zuverlässige Lieferung und Stabilität die Hauptwerte sind.",
      medium: "Systemseitige Problemlösung, Optimierung, operative Verbesserungen — wo Erfahrung und Stabilität die Grundlage der Ergebnisse sind.",
      watchOut: "Druck in Richtung radikal neuer Ideen oder experimenteller Richtungen kann Spannungen erzeugen. Nähere dich unbekanntem Terrain mit einem schrittweisen, kontrollierten Ansatz.",
    },
  },
};
