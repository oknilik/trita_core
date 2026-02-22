import type { ProfileCategory } from "./profile-engine";

export type Locale = "hu" | "en" | "de";
type LocalizedText = Record<Locale, string>;

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
