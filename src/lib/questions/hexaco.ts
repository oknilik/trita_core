import type { TestConfig } from "./types";

/**
 * Official HEXACO-PI-R (60 questions)
 */
export const hexacoConfig: TestConfig = {
  type: "HEXACO",
  name: "HEXACO-PI-R",
  description: "A hivatalos HEXACO személyiségteszt 60 kérdéssel.",
  format: "likert",
  dimensions: [
    {
      code: "H",
      label: "Őszinteség-Alázat",
      labelByLocale: {
        en: "Honesty–Humility",
        de: "Ehrlichkeit–Bescheidenheit",
      },
      color: "#818CF8",
      description: "Ez a dimenzió azt méri, mennyire vagy őszinte, szerény és igazságos másokkal szemben. A magas érték megbízhatóságot és etikus viselkedést jelöl, míg az alacsonyabb érték pragmatikusabb, versengőbb hozzáállást tükröz.",
      descriptionByLocale: {
        en: "Measures how honest, modest, and fair you are toward others. High scores indicate trustworthiness and ethical behavior, while lower scores reflect a more pragmatic, competitive approach.",
        de: "Misst, wie ehrlich, bescheiden und fair du anderen gegenüber bist. Hohe Werte stehen für Vertrauenswürdigkeit und ethisches Verhalten, niedrigere Werte für eine pragmatischere, wettbewerbsorientierte Haltung.",
      },
      insights: {
        low: "Pragmatikus megközelítés, hajlamos a saját érdekeid előtérbe helyezésére.",
        mid: "Kiegyensúlyozott hozzáállás az őszinteség és a gyakorlatiasság között.",
        high: "Megbízható, szerény hozzáállás, magas etikai érzékenységgel.",
      },
      insightsByLocale: {
        en: {
          low: "Pragmatic approach, often prioritizing your own interests.",
          mid: "Balanced between honesty and practicality.",
          high: "Reliable and modest, with strong ethical sensitivity.",
        },
        de: {
          low: "Pragmatischer Ansatz, häufig mit Fokus auf eigene Interessen.",
          mid: "Ausgewogen zwischen Ehrlichkeit und Praktikabilität.",
          high: "Zuverlässig und bescheiden, mit hoher ethischer Sensibilität.",
        },
      },
      facets: [
        { code: "sincerity", label: "Őszinteség", labelByLocale: { en: "Sincerity", de: "Aufrichtigkeit" } },
        { code: "fairness", label: "Igazságosság", labelByLocale: { en: "Fairness", de: "Fairness" } },
        { code: "greed_avoidance", label: "Kapzsiság-kerülés", labelByLocale: { en: "Greed Avoidance", de: "Genügsamkeit" } },
        { code: "modesty", label: "Szerénység", labelByLocale: { en: "Modesty", de: "Bescheidenheit" } },
      ],
    },
    {
      code: "E",
      label: "Érzelmi stabilitás",
      labelByLocale: {
        en: "Emotionality",
        de: "Emotionalität",
      },
      color: "#FB7185",
      description: "Az érzelmi reakciók intenzitását és az érzelmi sebezhetőséget méri. Magasabb értéknél erősebb az empátia és az érzelmi kötődés, míg alacsonyabb értéknél inkább a higgadtság és az érzelmi távolságtartás jellemző.",
      descriptionByLocale: {
        en: "Measures intensity of emotional reactions and vulnerability. Higher scores reflect stronger empathy and emotional bonding, while lower scores indicate calmness and emotional distance.",
        de: "Misst die Intensität emotionaler Reaktionen und Verletzlichkeit. Höhere Werte stehen für stärkere Empathie und Bindung, niedrigere Werte für mehr Ruhe und emotionale Distanz.",
      },
      insights: {
        low: "Érzelmileg stabil, ritkán aggódsz vagy idegeskedsz.",
        mid: "Önkontrollált, de stresszhelyzetben előfordulhat fokozott óvatosság.",
        high: "Mély érzelmi átélés, erős empátia és érzékenység jellemez.",
      },
      insightsByLocale: {
        en: {
          low: "Emotionally stable; you rarely worry or feel anxious.",
          mid: "Self-controlled, but may become more cautious under stress.",
          high: "Deep emotional experience with strong empathy and sensitivity.",
        },
        de: {
          low: "Emotional stabil; du sorgst dich selten oder bist selten nervös.",
          mid: "Selbstkontrolliert, aber in Stresssituationen vorsichtiger.",
          high: "Tiefes emotionales Erleben mit starker Empathie und Sensibilität.",
        },
      },
      facets: [
        { code: "fearfulness", label: "Félelem", labelByLocale: { en: "Fearfulness", de: "Ängstlichkeit" } },
        { code: "anxiety", label: "Szorongás", labelByLocale: { en: "Anxiety", de: "Besorgnis" } },
        { code: "dependence", label: "Függőség", labelByLocale: { en: "Dependence", de: "Abhängigkeit" } },
        { code: "sentimentality", label: "Érzelmesség", labelByLocale: { en: "Sentimentality", de: "Empfindsamkeit" } },
      ],
    },
    {
      code: "X",
      label: "Extraverzió",
      labelByLocale: {
        en: "Extraversion",
        de: "Extraversion",
      },
      color: "#F59E0B",
      description: "A társas energia szintjét és a szociális magabiztosságot méri. Magas értéknél élénk, társaságkedvelő személyiség rajzolódik ki, míg alacsonyabb értéknél az egyéni tevékenységek és a visszahúzódás a jellemzőbb.",
      descriptionByLocale: {
        en: "Measures social energy and confidence. High scores indicate a lively, sociable personality, while lower scores favor solitary activities and reservedness.",
        de: "Misst soziale Energie und Selbstsicherheit. Hohe Werte deuten auf eine lebhafte, gesellige Persönlichkeit hin, niedrigere Werte auf eher zurückgezogene, individuelle Aktivitäten.",
      },
      insights: {
        low: "Inkább introvertált, a nyugodt, egyéni tevékenységeket preferálod.",
        mid: "Kiegyensúlyozott társas energia: tudsz vezetni, de szeretsz fókuszálni is.",
        high: "Energikus, társaságkedvelő, magabiztos közösségi helyzetekben.",
      },
      insightsByLocale: {
        en: {
          low: "More introverted; you prefer calm, individual activities.",
          mid: "Balanced social energy: you can lead and also focus independently.",
          high: "Energetic, outgoing, confident in social situations.",
        },
        de: {
          low: "Eher introvertiert; du bevorzugst ruhige, individuelle Aktivitäten.",
          mid: "Ausgewogene soziale Energie: du kannst führen und dich zugleich gut fokussieren.",
          high: "Energisch, gesellig, selbstbewusst in sozialen Situationen.",
        },
      },
      facets: [
        { code: "social_self_esteem", label: "Társas önértékelés", labelByLocale: { en: "Social Self-Esteem", de: "Soziales Selbstwertgefühl" } },
        { code: "social_boldness", label: "Társas bátorság", labelByLocale: { en: "Social Boldness", de: "Soziale Kühnheit" } },
        { code: "sociability", label: "Társaságkedvelés", labelByLocale: { en: "Sociability", de: "Geselligkeit" } },
        { code: "liveliness", label: "Élénkség", labelByLocale: { en: "Liveliness", de: "Lebhaftigkeit" } },
      ],
    },
    {
      code: "A",
      label: "Barátságosság",
      labelByLocale: {
        en: "Agreeableness",
        de: "Verträglichkeit",
      },
      color: "#34D399",
      description: "Az együttműködési hajlandóságot és a mások iránti türelmet méri. Magas értéknél megbocsátó, kompromisszumkész természet jellemző, míg alacsonyabb értéknél kritikusabb, konfrontatívabb stílus.",
      descriptionByLocale: {
        en: "Measures cooperation and tolerance toward others. High scores indicate a forgiving, compromise-oriented nature, while lower scores reflect a more critical, confrontational style.",
        de: "Misst Kooperationsbereitschaft und Geduld gegenüber anderen. Hohe Werte stehen für eine verzeihende, kompromissbereite Art, niedrigere für einen kritischeren, konfrontativeren Stil.",
      },
      insights: {
        low: "Határozott, kritikus gondolkodás, nem félsz a konfrontációtól.",
        mid: "Rugalmas együttműködés, de meg tudod védeni az álláspontodat.",
        high: "Erős együttműködési készség, konfliktushelyzetben is empatikus.",
      },
      insightsByLocale: {
        en: {
          low: "Decisive and critical; you are not afraid of confrontation.",
          mid: "Flexible cooperation, while still defending your position.",
          high: "Strong cooperative spirit; empathetic even in conflict.",
        },
        de: {
          low: "Entschlossen und kritisch; du scheust keine Konfrontation.",
          mid: "Flexibel kooperativ, kannst aber deinen Standpunkt verteidigen.",
          high: "Hohe Kooperationsbereitschaft; empathisch auch in Konflikten.",
        },
      },
      facets: [
        { code: "forgiveness", label: "Megbocsátás", labelByLocale: { en: "Forgiveness", de: "Vergebung" } },
        { code: "gentleness", label: "Szelídség", labelByLocale: { en: "Gentleness", de: "Sanftmut" } },
        { code: "flexibility", label: "Rugalmasság", labelByLocale: { en: "Flexibility", de: "Flexibilität" } },
        { code: "patience", label: "Türelem", labelByLocale: { en: "Patience", de: "Geduld" } },
      ],
    },
    {
      code: "C",
      label: "Lelkiismeretesség",
      labelByLocale: {
        en: "Conscientiousness",
        de: "Gewissenhaftigkeit",
      },
      color: "#A78BFA",
      description: "A szervezettséget, kitartást és fegyelmet méri. Magas értéknél gondos, tervszerű munkavégzés jellemző, míg alacsonyabb értéknél rugalmasabb, spontánabb hozzáállás.",
      descriptionByLocale: {
        en: "Measures organization, persistence, and discipline. High scores reflect careful, structured work; lower scores indicate a more flexible, spontaneous approach.",
        de: "Misst Organisation, Ausdauer und Disziplin. Hohe Werte stehen für sorgfältiges, planvolles Arbeiten, niedrigere für einen flexibleren, spontanen Ansatz.",
      },
      insights: {
        low: "Spontán, rugalmas megközelítés, kevésbé kötött tervekhez.",
        mid: "Megbízható végrehajtás, de tudsz alkalmazkodni a változásokhoz.",
        high: "Rendszerezett, következetes munkastílus, magas felelősségtudat.",
      },
      insightsByLocale: {
        en: {
          low: "Spontaneous and flexible; you prefer fewer fixed plans.",
          mid: "Reliable execution, with the ability to adapt to change.",
          high: "Structured, consistent work style with strong responsibility.",
        },
        de: {
          low: "Spontan und flexibel; du bevorzugst weniger feste Pläne.",
          mid: "Zuverlässige Umsetzung, mit Anpassungsfähigkeit an Veränderungen.",
          high: "Strukturiert und konsequent mit hohem Verantwortungsbewusstsein.",
        },
      },
      facets: [
        { code: "organization", label: "Szervezettség", labelByLocale: { en: "Organization", de: "Organisation" } },
        { code: "diligence", label: "Szorgalom", labelByLocale: { en: "Diligence", de: "Fleiß" } },
        { code: "perfectionism", label: "Perfekcionizmus", labelByLocale: { en: "Perfectionism", de: "Perfektionismus" } },
        { code: "prudence", label: "Megfontoltság", labelByLocale: { en: "Prudence", de: "Besonnenheit" } },
      ],
    },
    {
      code: "O",
      label: "Nyitottság",
      labelByLocale: {
        en: "Openness",
        de: "Offenheit",
      },
      color: "#38BDF8",
      description: "A szellemi kíváncsiságot, kreativitást és az új élmények iránti nyitottságot méri. Magas értéknél vonzódás az absztrakt gondolkodáshoz, míg alacsonyabb értéknél a gyakorlatias, hagyományos megoldások preferálása.",
      descriptionByLocale: {
        en: "Measures intellectual curiosity, creativity, and openness to new experiences. High scores indicate attraction to abstract thinking, while lower scores prefer practical, traditional approaches.",
        de: "Misst intellektuelle Neugier, Kreativität und Offenheit für neue Erfahrungen. Hohe Werte zeigen eine Neigung zu abstraktem Denken, niedrigere bevorzugen praktische, traditionelle Lösungen.",
      },
      insights: {
        low: "Gyakorlatias, hagyományos megközelítés, bevált módszereket preferálsz.",
        mid: "Nyitott az új ötletekre, de a realitás talaján maradsz.",
        high: "Kíváncsi, kreatív gondolkodás, vonzzák az újító megoldások.",
      },
      insightsByLocale: {
        en: {
          low: "Practical and traditional; you prefer proven methods.",
          mid: "Open to new ideas while staying grounded in reality.",
          high: "Curious and creative; drawn to innovative solutions.",
        },
        de: {
          low: "Praktisch und traditionell; du bevorzugst bewährte Methoden.",
          mid: "Offen für neue Ideen, bleibst aber realitätsnah.",
          high: "Neugierig und kreativ; angezogen von innovativen Lösungen.",
        },
      },
      facets: [
        { code: "aesthetic_appreciation", label: "Esztétikai fogékonyság", labelByLocale: { en: "Aesthetic Appreciation", de: "Ästhetisches Empfinden" } },
        { code: "inquisitiveness", label: "Kíváncsiság", labelByLocale: { en: "Inquisitiveness", de: "Wissbegier" } },
        { code: "creativity", label: "Kreativitás", labelByLocale: { en: "Creativity", de: "Kreativität" } },
        { code: "unconventionality", label: "Eredetiség", labelByLocale: { en: "Unconventionality", de: "Unkonventionalität" } },
      ],
    },
  ],
  questions: [
    {
      id: 1,
      dimension: "O",
      facet: "aesthetic_appreciation",
      text: "Meglehetősen untatna egy képtár meglátogatása.",
      textByLocale: {
        hu: "Meglehetősen untatna egy képtár meglátogatása.",
        en: "I would be quite bored by a visit to an art gallery.",
        de: "Der Besuch einer Kunstausstellung würde mich ziemlich langweilen.",
      },
      textObserver: "He/she would be quite bored by a visit to an art gallery.",
      textObserverByLocale: {
        en: "He/she would be quite bored by a visit to an art gallery.",
      },
      reversed: true,
    },
    {
      id: 2,
      dimension: "C",
      facet: "organization",
      text: "A dolgaimat előre eltervezem, hogy elkerüljem az utolsó percben való kapkodást.",
      textByLocale: {
        hu: "A dolgaimat előre eltervezem, hogy elkerüljem az utolsó percben való kapkodást.",
        en: "I plan ahead and organize things, to avoid scrambling at the last minute.",
        de: "Ich plane im Voraus und organisiere, damit in letzter Minute kein Zeitdruck aufkommt.",
      },
      textObserver: "He/she plans ahead and organizes things, to avoid scrambling at the last minute.",
      textObserverByLocale: {
        en: "He/she plans ahead and organizes things, to avoid scrambling at the last minute.",
      },
    },
    {
      id: 3,
      dimension: "A",
      facet: "forgiveness",
      text: "Még azokkal szemben sem vagyok haragtartó, akik csúnyán megbántottak.",
      textByLocale: {
        hu: "Még azokkal szemben sem vagyok haragtartó, akik csúnyán megbántottak.",
        en: "I rarely hold a grudge, even against people who have badly wronged me.",
        de: "Ich habe selten Wut im Bauch, nicht mal gegen Leute, die mich sehr ungerecht behandelt haben.",
      },
      textObserver: "He/she rarely holds a grudge, even against people who have badly wronged him/her.",
      textObserverByLocale: {
        en: "He/she rarely holds a grudge, even against people who have badly wronged him/her.",
      },
    },
    {
      id: 4,
      dimension: "X",
      facet: "social_self_esteem",
      text: "Alapjában véve úgy érzem, hogy elégedett vagyok magammal.",
      textByLocale: {
        hu: "Alapjában véve úgy érzem, hogy elégedett vagyok magammal.",
        en: "I feel reasonably satisfied with myself overall.",
        de: "Im Allgemeinen bin ich mit mir ziemlich zufrieden.",
      },
      textObserver: "He/she feels reasonably satisfied with himself/herself overall.",
      textObserverByLocale: {
        en: "He/she feels reasonably satisfied with himself/herself overall.",
      },
    },
    {
      id: 5,
      dimension: "E",
      facet: "fearfulness",
      text: "Nyugtalansággal töltene el, ha rossz időjárási körülmények között kellene utazást vállalnom.",
      textByLocale: {
        hu: "Nyugtalansággal töltene el, ha rossz időjárási körülmények között kellene utazást vállalnom.",
        en: "I would feel afraid if I had to travel in bad weather conditions.",
        de: "Ich hätte Angst, wenn ich bei schlechten Wetterbedingungen verreisen müsste.",
      },
      textObserver: "He/she would feel afraid if he/she had to travel in bad weather conditions.",
      textObserverByLocale: {
        en: "He/she would feel afraid if he/she had to travel in bad weather conditions.",
      },
    },
    {
      id: 6,
      dimension: "H",
      facet: "sincerity",
      text: "Akkor sem hízelegnék a főnökömnek, ha tudnám, fizetésemelést vagy előrelépest érnék el vele.",
      textByLocale: {
        hu: "Akkor sem hízelegnék a főnökömnek, ha tudnám, fizetésemelést vagy előrelépest érnék el vele.",
        en: "I wouldn't use flattery to get a raise or promotion at work, even if I thought it would succeed.",
        de: "Ich würde keine Schmeicheleien benutzen, um eine Gehaltserhöhung zu bekommen oder befördert zu werden, auch wenn ich wüsste, dass es erfolgreich wäre. Bitte wenden…",
      },
      textObserver: "He/she wouldn't use flattery to get a raise or promotion at work, even if he/she thought it would succeed.",
      textObserverByLocale: {
        en: "He/she wouldn't use flattery to get a raise or promotion at work, even if he/she thought it would succeed.",
      },
    },
    {
      id: 7,
      dimension: "O",
      facet: "inquisitiveness",
      text: "Érdekelnek más országok történelmi és politikai sajátosságai.",
      textByLocale: {
        hu: "Érdekelnek más országok történelmi és politikai sajátosságai.",
        en: "I'm interested in learning about the history and politics of other countries.",
        de: "Ich bin daran interessiert, etwas über die Geschichte und Politik anderer Länder zu lernen.",
      },
      textObserver: "He/she is interested in learning about the history and politics of other countries.",
      textObserverByLocale: {
        en: "He/she is interested in learning about the history and politics of other countries.",
      },
    },
    {
      id: 8,
      dimension: "C",
      facet: "diligence",
      text: "Céljaim elérésére gyakran minden erőmet bevetem.",
      textByLocale: {
        hu: "Céljaim elérésére gyakran minden erőmet bevetem.",
        en: "I often push myself very hard when trying to achieve a goal.",
        de: "Ich treibe mich oft selbst sehr stark an, wenn ich versuche, ein Ziel zu erreichen.",
      },
      textObserver: "He/she often pushes himself/herself very hard when trying to achieve a goal.",
      textObserverByLocale: {
        en: "He/she often pushes himself/herself very hard when trying to achieve a goal.",
      },
    },
    {
      id: 9,
      dimension: "A",
      facet: "gentleness",
      text: "Az ismerőseim gyakran állítják, hogy túl kritikus vagyok másokhoz.",
      textByLocale: {
        hu: "Az ismerőseim gyakran állítják, hogy túl kritikus vagyok másokhoz.",
        en: "People sometimes tell me that I am too critical of others.",
        de: "Andere sagen mir manchmal, dass ich zu kritisch gegenüber anderen bin.",
      },
      textObserver: "People sometimes say that he/she is too critical of others.",
      textObserverByLocale: {
        en: "People sometimes say that he/she is too critical of others.",
      },
      reversed: true,
    },
    {
      id: 10,
      dimension: "X",
      facet: "social_boldness",
      text: "Csoportos megbeszéléseken ritkán adok hangot véleményemnek.",
      textByLocale: {
        hu: "Csoportos megbeszéléseken ritkán adok hangot véleményemnek.",
        en: "I rarely express my opinions in group meetings.",
        de: "Bei Gruppentreffen sage ich nur selten meine Meinung.",
      },
      textObserver: "He/she rarely expresses his/her opinions in group meetings.",
      textObserverByLocale: {
        en: "He/she rarely expresses his/her opinions in group meetings.",
      },
      reversed: true,
    },
    {
      id: 11,
      dimension: "E",
      facet: "anxiety",
      text: "Néha nem tudom megállni, hogy ne aggodalmaskodjak apróságokon.",
      textByLocale: {
        hu: "Néha nem tudom megállni, hogy ne aggodalmaskodjak apróságokon.",
        en: "I sometimes can't help worrying about little things.",
        de: "Ich kann manchmal nichts dagegen machen, dass ich mir über kleine Dinge Sorgen mache.",
      },
      textObserver: "He/she worries about little things.",
      textObserverByLocale: {
        en: "He/she worries about little things.",
      },
    },
    {
      id: 12,
      dimension: "H",
      facet: "fairness",
      text: "Ha tudnám, hogy sosem kapnak el, kész lennék egy millió dollárt vagy eurót ellopni.",
      textByLocale: {
        hu: "Ha tudnám, hogy sosem kapnak el, kész lennék egy millió dollárt vagy eurót ellopni.",
        en: "If I knew that I could never get caught, I would be willing to steal a million dollars.",
        de: "Wenn ich wüsste, dass ich niemals erwischt werde, wäre ich bereit, eine Million zu stehlen.",
      },
      textObserver: "If he/she knew that he/she could never get caught, he/she would be willing to steal a million dollars.",
      textObserverByLocale: {
        en: "If he/she knew that he/she could never get caught, he/she would be willing to steal a million dollars.",
      },
      reversed: true,
    },
    {
      id: 13,
      dimension: "O",
      facet: "creativity",
      text: "Szívesen alkotnék valami művészi munkát: egy regényt, zeneszámot, vagy festményt.",
      textByLocale: {
        hu: "Szívesen alkotnék valami művészi munkát: egy regényt, zeneszámot, vagy festményt.",
        en: "I would enjoy creating a work of art, such as a novel, a song, or a painting.",
        de: "Ich würde es genießen, ein Kunstwerk zu schaffen, etwa einen Roman, ein Lied oder ein Gemälde.",
      },
      textObserver: "He/she would enjoy creating a work of art, such as a novel, a song, or a painting.",
      textObserverByLocale: {
        en: "He/she would enjoy creating a work of art, such as a novel, a song, or a painting.",
      },
    },
    {
      id: 14,
      dimension: "C",
      facet: "perfectionism",
      text: "Ha dolgozom valamin, nem igazán fordítok különös figyelmet az apró részletekre.",
      textByLocale: {
        hu: "Ha dolgozom valamin, nem igazán fordítok különös figyelmet az apró részletekre.",
        en: "When working on something, I don't pay much attention to small details.",
        de: "Wenn ich an irgendetwas arbeite, beachte ich kleine Details nicht allzu sehr.",
      },
      textObserver: "When working on something, he/she doesn't pay much attention to small details.",
      textObserverByLocale: {
        en: "When working on something, he/she doesn't pay much attention to small details.",
      },
      reversed: true,
    },
    {
      id: 15,
      dimension: "A",
      facet: "flexibility",
      text: "Az ismerőseim néha azt mondják, hogy túlzottan makacs vagyok.",
      textByLocale: {
        hu: "Az ismerőseim néha azt mondják, hogy túlzottan makacs vagyok.",
        en: "People sometimes tell me that I'm too stubborn.",
        de: "Andere sagen mir manchmal, dass ich zu dickköpfig bin.",
      },
      textObserver: "People sometimes think that he/she is too stubborn.",
      textObserverByLocale: {
        en: "People sometimes think that he/she is too stubborn.",
      },
      reversed: true,
    },
    {
      id: 16,
      dimension: "X",
      facet: "sociability",
      text: "Inkább az olyan munkákat szeretem ahol emberekkel kell foglalkozni, mint ahol egyedül kell dolgozni.",
      textByLocale: {
        hu: "Inkább az olyan munkákat szeretem ahol emberekkel kell foglalkozni, mint ahol egyedül kell dolgozni.",
        en: "I prefer jobs that involve active social interaction to those that involve working alone.",
        de: "Ich ziehe Berufe, in denen man sich aktiv mit anderen Menschen auseinandersetzt solchen vor, in denen man alleine arbeitet.",
      },
      textObserver: "He/she prefers jobs that involve active social interaction to those that involve working alone.",
      textObserverByLocale: {
        en: "He/she prefers jobs that involve active social interaction to those that involve working alone.",
      },
    },
    {
      id: 17,
      dimension: "E",
      facet: "dependence",
      text: "Ha valami rossz történt velem, szükségem van valakire, aki megvígasztal.",
      textByLocale: {
        hu: "Ha valami rossz történt velem, szükségem van valakire, aki megvígasztal.",
        en: "When I suffer from a painful experience, I need someone to make me feel comfortable.",
        de: "Wenn ich wegen einer schmerzvollen Erfahrung leide, brauche ich jemanden, der mich tröstet.",
      },
      textObserver: "When he/she suffers from a painful experience, he/she needs someone to make him/her feel comfortable.",
      textObserverByLocale: {
        en: "When he/she suffers from a painful experience, he/she needs someone to make him/her feel comfortable.",
      },
    },
    {
      id: 18,
      dimension: "H",
      facet: "greed_avoidance",
      text: "Nem igazán fontos nekem, hogy sok pénzem legyen.",
      textByLocale: {
        hu: "Nem igazán fontos nekem, hogy sok pénzem legyen.",
        en: "Having a lot of money is not especially important to me.",
        de: "Viel Geld zu haben ist nicht besonders wichtig für mich.",
      },
      textObserver: "Having a lot of money is not especially important to him/her.",
      textObserverByLocale: {
        en: "Having a lot of money is not especially important to him/her.",
      },
    },
    {
      id: 19,
      dimension: "O",
      facet: "unconventionality",
      text: "A radikális nézetekkel való foglalkozás egyszerűen időpocsékolás.",
      textByLocale: {
        hu: "A radikális nézetekkel való foglalkozás egyszerűen időpocsékolás.",
        en: "I think that paying attention to radical ideas is a waste of time.",
        de: "Ich denke, dass es Zeitverschwendung ist, radikalen Ideen Aufmerksamkeit zu schenken.",
      },
      textObserver: "He/she thinks that paying attention to radical ideas is a waste of time.",
      textObserverByLocale: {
        en: "He/she thinks that paying attention to radical ideas is a waste of time.",
      },
      reversed: true,
    },
    {
      id: 20,
      dimension: "C",
      facet: "prudence",
      text: "Inkább a pillanatnyi érzelmeim, mint a gondos megfontolás vezet a döntéseimben.",
      textByLocale: {
        hu: "Inkább a pillanatnyi érzelmeim, mint a gondos megfontolás vezet a döntéseimben.",
        en: "I make decisions based on the feeling of the moment rather than on careful thought.",
        de: "Ich treffe Entscheidungen eher aus dem Bauch heraus als durch sorgfältiges Nachdenken.",
      },
      textObserver: "He/she makes decisions based on the feeling of the moment rather than on careful thought.",
      textObserverByLocale: {
        en: "He/she makes decisions based on the feeling of the moment rather than on careful thought.",
      },
      reversed: true,
    },
    {
      id: 21,
      dimension: "A",
      facet: "patience",
      text: "Az emberek robbanékony természetűnek tartanak.",
      textByLocale: {
        hu: "Az emberek robbanékony természetűnek tartanak.",
        en: "People think of me as someone who has a quick temper.",
        de: "Andere halten mich für jähzornig.",
      },
      textObserver: "People think of him/her as someone who has a quick temper.",
      textObserverByLocale: {
        en: "People think of him/her as someone who has a quick temper.",
      },
      reversed: true,
    },
    {
      id: 22,
      dimension: "X",
      facet: "liveliness",
      text: "Többnyire vidám és optimista vagyok.",
      textByLocale: {
        hu: "Többnyire vidám és optimista vagyok.",
        en: "On most days, I feel cheerful and optimistic.",
        de: "An den meisten Tagen bin ich fröhlich und optimistisch.",
      },
      textObserver: "On most days, he/she feels cheerful and optimistic.",
      textObserverByLocale: {
        en: "On most days, he/she feels cheerful and optimistic.",
      },
    },
    {
      id: 23,
      dimension: "E",
      facet: "sentimentality",
      text: "Úgy érzem engem is elkap a sírás, ha másokat sírni látok.",
      textByLocale: {
        hu: "Úgy érzem engem is elkap a sírás, ha másokat sírni látok.",
        en: "I feel like crying when I see other people crying.",
        de: "Ich könnte weinen, wenn ich andere Personen sehe, die weinen.",
      },
      textObserver: "He/she feels like crying when he/she sees other people crying.",
      textObserverByLocale: {
        en: "He/she feels like crying when he/she sees other people crying.",
      },
    },
    {
      id: 24,
      dimension: "H",
      facet: "modesty",
      text: "Úgy érzem, hogy több elismerés jár nekem mint egy átlagembernek.",
      textByLocale: {
        hu: "Úgy érzem, hogy több elismerés jár nekem mint egy átlagembernek.",
        en: "I think that I am entitled to more respect than the average person is.",
        de: "Ich denke, dass ich mehr Respekt verdiene als ein durchschnittlicher Mensch.",
      },
      textObserver: "He/she thinks that he/she is entitled to more respect than the average person is.",
      textObserverByLocale: {
        en: "He/she thinks that he/she is entitled to more respect than the average person is.",
      },
      reversed: true,
    },
    {
      id: 25,
      dimension: "O",
      facet: "aesthetic_appreciation",
      text: "Ha az alkalom úgy hozná, szívesen elmennék egy klasszikus koncertre.",
      textByLocale: {
        hu: "Ha az alkalom úgy hozná, szívesen elmennék egy klasszikus koncertre.",
        en: "If I had the opportunity, I would like to attend a classical music concert.",
        de: "Wenn ich die Gelegenheit dazu hätte, würde ich gerne ein Konzert mit klassischer Musik besuchen.",
      },
      textObserver: "If he/she had the opportunity, he/she would like to attend a classical music concert.",
      textObserverByLocale: {
        en: "If he/she had the opportunity, he/she would like to attend a classical music concert.",
      },
    },
    {
      id: 26,
      dimension: "C",
      facet: "organization",
      text: "A munkámban néha hátráltat, hogy nem vagyok jól organizált.",
      textByLocale: {
        hu: "A munkámban néha hátráltat, hogy nem vagyok jól organizált.",
        en: "When working, I sometimes have difficulties due to being disorganized.",
        de: "Wenn ich arbeite, habe ich manchmal Schwierigkeiten, weil ich unorganisiert bin.",
      },
      textObserver: "When working, he/she sometimes has difficulties due to being disorganized.",
      textObserverByLocale: {
        en: "When working, he/she sometimes has difficulties due to being disorganized.",
      },
      reversed: true,
    },
    {
      id: 27,
      dimension: "A",
      facet: "forgiveness",
      text: "Ha valaki rosszul bánt velem, képes vagyok megbocsátani és a feledés fátylát boritani a történtekre.",
      textByLocale: {
        hu: "Ha valaki rosszul bánt velem, képes vagyok megbocsátani és a feledés fátylát boritani a történtekre.",
        en: "My attitude toward people who have treated me badly is \"forgive and forget\".",
        de: "Meine Einstellung gegenüber Personen, die mich schlecht behandelt haben, ist \\\"vergeben und vergessen\\\".",
      },
      textObserver: "His/her attitude toward people who have treated him/her badly is \"forgive and forget\".",
      textObserverByLocale: {
        en: "His/her attitude toward people who have treated him/her badly is \"forgive and forget\".",
      },
    },
    {
      id: 28,
      dimension: "X",
      facet: "social_self_esteem",
      text: "Úgy érzem, hogy népszerűtlen vagyok.",
      textByLocale: {
        hu: "Úgy érzem, hogy népszerűtlen vagyok.",
        en: "I feel that I am an unpopular person.",
        de: "Ich bin der Meinung, dass ich nicht beliebt bin.",
      },
      textObserver: "He/she feels that he/she is an unpopular person.",
      textObserverByLocale: {
        en: "He/she feels that he/she is an unpopular person.",
      },
      reversed: true,
    },
    {
      id: 29,
      dimension: "E",
      facet: "fearfulness",
      text: "Testi épsegemet veszélyeztető helyzetekben nagyon félek.",
      textByLocale: {
        hu: "Testi épsegemet veszélyeztető helyzetekben nagyon félek.",
        en: "When it comes to physical danger, I am very fearful.",
        de: "Wenn es um körperliche Gefahren geht, bin ich sehr ängstlich.",
      },
      textObserver: "When it comes to physical danger, he/she is very fearful.",
      textObserverByLocale: {
        en: "When it comes to physical danger, he/she is very fearful.",
      },
    },
    {
      id: 30,
      dimension: "H",
      facet: "sincerity",
      text: "Ha valakitől valamit akarok, akkor még a faviccein is képes vagyok nevetni.",
      textByLocale: {
        hu: "Ha valakitől valamit akarok, akkor még a faviccein is képes vagyok nevetni.",
        en: "If I want something from someone, I will laugh at that person's worst jokes.",
        de: "Wenn ich von jemandem etwas will, lache ich auch noch über dessen schlechteste Witze.",
      },
      textObserver: "If he/she wants something from someone, he/she will laugh at that person's worst jokes.",
      textObserverByLocale: {
        en: "If he/she wants something from someone, he/she will laugh at that person's worst jokes.",
      },
      reversed: true,
    },
    {
      id: 31,
      dimension: "O",
      facet: "inquisitiveness",
      text: "Igazándiból még sohasem lapozgattam élvezettel egy lexikonban.",
      textByLocale: {
        hu: "Igazándiból még sohasem lapozgattam élvezettel egy lexikonban.",
        en: "I've never really enjoyed looking through an encyclopedia.",
        de: "Ich habe es noch nie wirklich gemocht, eine Enzyklopädie durchzublättern.",
      },
      textObserver: "He/she has never really enjoyed looking through an encyclopedia.",
      textObserverByLocale: {
        en: "He/she has never really enjoyed looking through an encyclopedia.",
      },
      reversed: true,
    },
    {
      id: 32,
      dimension: "C",
      facet: "diligence",
      text: "Ami a munkát illeti, csak a legszükségesebb erőbedobással dolgozom.",
      textByLocale: {
        hu: "Ami a munkát illeti, csak a legszükségesebb erőbedobással dolgozom.",
        en: "I do only the minimum amount of work needed to get by.",
        de: "Ich arbeite nur so viel wie nötig, um gerade so durchzukommen.",
      },
      textObserver: "He/she does only the minimum amount of work needed to get by.",
      textObserverByLocale: {
        en: "He/she does only the minimum amount of work needed to get by.",
      },
      reversed: true,
    },
    {
      id: 33,
      dimension: "A",
      facet: "gentleness",
      text: "Jobbára jóindulattal ítélkezem mások felett.",
      textByLocale: {
        hu: "Jobbára jóindulattal ítélkezem mások felett.",
        en: "I tend to be lenient in judging other people.",
        de: "Ich neige dazu, nachsichtig zu sein, wenn ich andere beurteile.",
      },
      textObserver: "He/she tends to be lenient in judging other people.",
      textObserverByLocale: {
        en: "He/she tends to be lenient in judging other people.",
      },
    },
    {
      id: 34,
      dimension: "X",
      facet: "social_boldness",
      text: "Társas helyzetekben általában én vagyok az, aki beszélgetést kezdeményez.",
      textByLocale: {
        hu: "Társas helyzetekben általában én vagyok az, aki beszélgetést kezdeményez.",
        en: "In social situations, I'm usually the one who makes the first move.",
        de: "In sozialen Situationen bin ich gewöhnlich der, der den ersten Schritt macht.",
      },
      textObserver: "In social situations, he/she is usually the one who makes the first move.",
      textObserverByLocale: {
        en: "In social situations, he/she is usually the one who makes the first move.",
      },
    },
    {
      id: 35,
      dimension: "E",
      facet: "anxiety",
      text: "Sokkal kevesebbet aggodalmaskodom mint általában a többi ember szokott.",
      textByLocale: {
        hu: "Sokkal kevesebbet aggodalmaskodom mint általában a többi ember szokott.",
        en: "I worry a lot less than most people do.",
        de: "Ich mache mir viel weniger Sorgen als die meisten Leute.",
      },
      textObserver: "He/she worries a lot less than most people do.",
      textObserverByLocale: {
        en: "He/she worries a lot less than most people do.",
      },
      reversed: true,
    },
    {
      id: 36,
      dimension: "H",
      facet: "fairness",
      text: "Sosem hagynám magam megvesztegetni, mindegy mekkora is lenne az az ajánlat.",
      textByLocale: {
        hu: "Sosem hagynám magam megvesztegetni, mindegy mekkora is lenne az az ajánlat.",
        en: "I would never accept a bribe, even if it were very large.",
        de: "Ich würde niemals Bestechungsgeld annehmen, auch wenn es sehr viel wäre. Bitte wenden…",
      },
      textObserver: "He/she would never accept a bribe, even if it were very large.",
      textObserverByLocale: {
        en: "He/she would never accept a bribe, even if it were very large.",
      },
    },
    {
      id: 37,
      dimension: "O",
      facet: "creativity",
      text: "Sokszor mondták már nekem, hogy jó a fantáziám.",
      textByLocale: {
        hu: "Sokszor mondták már nekem, hogy jó a fantáziám.",
        en: "People have often told me that I have a good imagination.",
        de: "Man hat mir schon oft gesagt, dass ich eine gute Vorstellungskraft habe.",
      },
      textObserver: "He/she has a good imagination.",
      textObserverByLocale: {
        en: "He/she has a good imagination.",
      },
    },
    {
      id: 38,
      dimension: "C",
      facet: "perfectionism",
      text: "A munkámban megpróbálok még akkor is mindig precíznek lenni, ha ez többletidőmbe kerül.",
      textByLocale: {
        hu: "A munkámban megpróbálok még akkor is mindig precíznek lenni, ha ez többletidőmbe kerül.",
        en: "I always try to be accurate in my work, even at the expense of time.",
        de: "Ich versuche immer, fehlerfrei zu arbeiten, auch wenn es Zeit kostet.",
      },
      textObserver: "He/she always tries to be accurate in his/her work, even at the expense of time.",
      textObserverByLocale: {
        en: "He/she always tries to be accurate in his/her work, even at the expense of time.",
      },
    },
    {
      id: 39,
      dimension: "A",
      facet: "flexibility",
      text: "Általában könnyen megváltoztatom a véleményem, ha az emberek nem értenek vele egyet.",
      textByLocale: {
        hu: "Általában könnyen megváltoztatom a véleményem, ha az emberek nem értenek vele egyet.",
        en: "I am usually quite flexible in my opinions when people disagree with me.",
        de: "Ich bin gewöhnlich ziemlich flexibel in meinen Ansichten, wenn andere Leute mir nicht zustimmen.",
      },
      textObserver: "He/she is usually quite flexible in his/her opinions when people disagree with him/her.",
      textObserverByLocale: {
        en: "He/she is usually quite flexible in his/her opinions when people disagree with him/her.",
      },
    },
    {
      id: 40,
      dimension: "X",
      facet: "sociability",
      text: "Ha egy új helyre kerülök, hamarosan új barátságokat is kötök.",
      textByLocale: {
        hu: "Ha egy új helyre kerülök, hamarosan új barátságokat is kötök.",
        en: "The first thing that I always do in a new place is to make friends.",
        de: "Das erste, was ich an einem neuen Ort tue, ist, Freundschaften zu schließen.",
      },
      textObserver: "The first thing that he/she always does in a new place is to make friends.",
      textObserverByLocale: {
        en: "The first thing that he/she always does in a new place is to make friends.",
      },
    },
    {
      id: 41,
      dimension: "E",
      facet: "dependence",
      text: "Nehezebb helyzetekkel is elboldogulok anélkül, hogy érzelmi támogatásra lenne szükségem.",
      textByLocale: {
        hu: "Nehezebb helyzetekkel is elboldogulok anélkül, hogy érzelmi támogatásra lenne szükségem.",
        en: "I can handle difficult situations without needing emotional support from anyone else.",
        de: "Ich kann mit schwierigen Situationen umgehen, ohne dass ich emotionale Unterstützung von irgendjemandem brauche.",
      },
      textObserver: "He/she can handle difficult situations without needing emotional support from anyone else.",
      textObserverByLocale: {
        en: "He/she can handle difficult situations without needing emotional support from anyone else.",
      },
      reversed: true,
    },
    {
      id: 42,
      dimension: "H",
      facet: "greed_avoidance",
      text: "Nagyon tudnék neki örülni, ha méregdrága, luxus cuccaim lennének.",
      textByLocale: {
        hu: "Nagyon tudnék neki örülni, ha méregdrága, luxus cuccaim lennének.",
        en: "I would get a lot of pleasure from owning expensive luxury goods.",
        de: "Es würde mir viel Freude bereiten, teure Luxusgüter zu besitzen. Bitte wenden…",
      },
      textObserver: "He/she would get a lot of pleasure from owning expensive luxury goods.",
      textObserverByLocale: {
        en: "He/she would get a lot of pleasure from owning expensive luxury goods.",
      },
      reversed: true,
    },
    {
      id: 43,
      dimension: "O",
      facet: "unconventionality",
      text: "Nekem szimpatikusak azok az emberek, akiknek eredeti, az átlagtól eltérő nézeteik vannak.",
      textByLocale: {
        hu: "Nekem szimpatikusak azok az emberek, akiknek eredeti, az átlagtól eltérő nézeteik vannak.",
        en: "I like people who have unconventional views.",
        de: "Ich mag Leute, die unkonventionelle Ideen haben.",
      },
      textObserver: "He/she likes people who have unconventional views.",
      textObserverByLocale: {
        en: "He/she likes people who have unconventional views.",
      },
    },
    {
      id: 44,
      dimension: "C",
      facet: "prudence",
      text: "Sok hibát követek el, mert előbb cselekszem és csak aztán gondolkodom.",
      textByLocale: {
        hu: "Sok hibát követek el, mert előbb cselekszem és csak aztán gondolkodom.",
        en: "I make a lot of mistakes because I don't think before I act.",
        de: "Ich mache viele Fehler, weil ich nicht nachdenke, bevor ich handele.",
      },
      textObserver: "He/she makes a lot of mistakes because he/she doesn't think before he/she acts.",
      textObserverByLocale: {
        en: "He/she makes a lot of mistakes because he/she doesn't think before he/she acts.",
      },
      reversed: true,
    },
    {
      id: 45,
      dimension: "A",
      facet: "patience",
      text: "A legtöbb embert könnyebb felbosszantani mint engem.",
      textByLocale: {
        hu: "A legtöbb embert könnyebb felbosszantani mint engem.",
        en: "Most people tend to get angry more quickly than I do.",
        de: "Die meisten Leute werden schneller ärgerlich als ich.",
      },
      textObserver: "Most people tend to get angry more quickly than he/she does.",
      textObserverByLocale: {
        en: "Most people tend to get angry more quickly than he/she does.",
      },
    },
    {
      id: 46,
      dimension: "X",
      facet: "liveliness",
      text: "A legtöbb ember dinamikusabb és élettelibb mint én vagyok.",
      textByLocale: {
        hu: "A legtöbb ember dinamikusabb és élettelibb mint én vagyok.",
        en: "Most people are more upbeat and dynamic than I generally am.",
        de: "Die meisten Leute sind aufgedrehter und dynamischer als ich es im Allgemeinen bin.",
      },
      textObserver: "Most people are more upbeat and dynamic than he/she generally is.",
      textObserverByLocale: {
        en: "Most people are more upbeat and dynamic than he/she generally is.",
      },
      reversed: true,
    },
    {
      id: 47,
      dimension: "E",
      facet: "sentimentality",
      text: "Nagyon megindít, ha hozzám közelálló személyektől kell hosszútávra elbúcsúznom.",
      textByLocale: {
        hu: "Nagyon megindít, ha hozzám közelálló személyektől kell hosszútávra elbúcsúznom.",
        en: "I feel strong emotions when someone close to me is going away for a long time.",
        de: "Ich fühle starke Emotionen, wenn jemand, der mir nahe steht, für eine längere Zeit weggeht.",
      },
      textObserver: "He/she feels strong emotions when someone close to him/her is going away for a long time.",
      textObserverByLocale: {
        en: "He/she feels strong emotions when someone close to him/her is going away for a long time.",
      },
    },
    {
      id: 48,
      dimension: "H",
      facet: "modesty",
      text: "Azt szeretném, ha mások fontos és magas pozicióban lévő embernek tartanának.",
      textByLocale: {
        hu: "Azt szeretném, ha mások fontos és magas pozicióban lévő embernek tartanának.",
        en: "I want people to know that I am an important person of high status.",
        de: "Ich will, dass alle wissen, dass ich eine wichtige angesehene Person bin.",
      },
      textObserver: "He/she wants people to know that he/she is an important person of high status.",
      textObserverByLocale: {
        en: "He/she wants people to know that he/she is an important person of high status.",
      },
      reversed: true,
    },
    {
      id: 49,
      dimension: "O",
      facet: "creativity",
      text: "Nem hiszem, hogy én egy kreatív vagy művészileg tehetséges típus vagyok.",
      textByLocale: {
        hu: "Nem hiszem, hogy én egy kreatív vagy művészileg tehetséges típus vagyok.",
        en: "I don't think of myself as the artistic or creative type.",
        de: "Ich halte mich nicht für einen künstlerischen oder kreativen Menschen.",
      },
      textObserver: "I don't think of him/her as the artistic or creative type.",
      textObserverByLocale: {
        en: "I don't think of him/her as the artistic or creative type.",
      },
      reversed: true,
    },
    {
      id: 50,
      dimension: "C",
      facet: "perfectionism",
      text: "Az emberek gyakran tartanak perfekcionistának.",
      textByLocale: {
        hu: "Az emberek gyakran tartanak perfekcionistának.",
        en: "People often call me a perfectionist.",
        de: "Andere nennen mich oft einen Perfektionisten.",
      },
      textObserver: "People often call him/her a perfectionist.",
      textObserverByLocale: {
        en: "People often call him/her a perfectionist.",
      },
    },
    {
      id: 51,
      dimension: "A",
      facet: "gentleness",
      text: "Még akkor sem nyilatkozom másokról negatívan, ha sok hibát követnek el.",
      textByLocale: {
        hu: "Még akkor sem nyilatkozom másokról negatívan, ha sok hibát követnek el.",
        en: "Even when people make a lot of mistakes, I rarely say anything negative.",
        de: "Selbst wenn Leute viele Fehler machen, sage ich nur selten etwas Negatives.",
      },
      textObserver: "Even when people make a lot of mistakes, he/she rarely says anything negative.",
      textObserverByLocale: {
        en: "Even when people make a lot of mistakes, he/she rarely says anything negative.",
      },
    },
    {
      id: 52,
      dimension: "X",
      facet: "social_self_esteem",
      text: "Néha az az érzésem, hogy értéktelen ember vagyok.",
      textByLocale: {
        hu: "Néha az az érzésem, hogy értéktelen ember vagyok.",
        en: "I sometimes feel that I am a worthless person.",
        de: "Manchmal habe ich den Eindruck, dass ich wertlos bin.",
      },
      textObserver: "He/she sometimes feels that he/she is a worthless person.",
      textObserverByLocale: {
        en: "He/she sometimes feels that he/she is a worthless person.",
      },
      reversed: true,
    },
    {
      id: 53,
      dimension: "E",
      facet: "fearfulness",
      text: "Még egy vészhelyzetben sem veszteném el a fejem.",
      textByLocale: {
        hu: "Még egy vészhelyzetben sem veszteném el a fejem.",
        en: "Even in an emergency I wouldn't feel like panicking.",
        de: "Selbst in einem Notfall würde ich nicht in Panik geraten.",
      },
      textObserver: "Even in an emergency he/she wouldn't feel like panicking.",
      textObserverByLocale: {
        en: "Even in an emergency he/she wouldn't feel like panicking.",
      },
      reversed: true,
    },
    {
      id: 54,
      dimension: "H",
      facet: "sincerity",
      text: "Nem tettetném, hogy kedvelek valakit csak azért, hogy rávegyem egy szívességre.",
      textByLocale: {
        hu: "Nem tettetném, hogy kedvelek valakit csak azért, hogy rávegyem egy szívességre.",
        en: "I wouldn't pretend to like someone just to get that person to do favors for me.",
        de: "Ich würde nicht vortäuschen, jemanden zu mögen, nur um diese Person dazu zu bringen, mir Gefälligkeiten zu erweisen.",
      },
      textObserver: "He/she wouldn't pretend to like someone just to get that person to do favors for him/her.",
      textObserverByLocale: {
        en: "He/she wouldn't pretend to like someone just to get that person to do favors for him/her.",
      },
    },
    {
      id: 55,
      dimension: "O",
      facet: "unconventionality",
      text: "A filozófiai eszmecseréket unalmasnak tartom.",
      textByLocale: {
        hu: "A filozófiai eszmecseréket unalmasnak tartom.",
        en: "I find it boring to discuss philosophy.",
        de: "Ich finde es langweilig, über Philosophie zu diskutieren.",
      },
      textObserver: "He/she finds it boring to discuss philosophy.",
      textObserverByLocale: {
        en: "He/she finds it boring to discuss philosophy.",
      },
      reversed: true,
    },
    {
      id: 56,
      dimension: "C",
      facet: "prudence",
      text: "Inkább spontán szeretek cselekedni, mint mindent előre eltervezni.",
      textByLocale: {
        hu: "Inkább spontán szeretek cselekedni, mint mindent előre eltervezni.",
        en: "I prefer to do whatever comes to mind, rather than stick to a plan.",
        de: "Ich ziehe es vor, das zu tun, was mir gerade in den Sinn kommt, anstatt an einem Plan festzuhalten.",
      },
      textObserver: "He/she prefers to do whatever comes to mind, rather than stick to a plan.",
      textObserverByLocale: {
        en: "He/she prefers to do whatever comes to mind, rather than stick to a plan.",
      },
      reversed: true,
    },
    {
      id: 57,
      dimension: "A",
      facet: "flexibility",
      text: "Ha azt mondják, hogy nincs igazam, az első reakciőm, hogy vitába szállok.",
      textByLocale: {
        hu: "Ha azt mondják, hogy nincs igazam, az első reakciőm, hogy vitába szállok.",
        en: "When people tell me that I'm wrong, my first reaction is to argue with them.",
        de: "Wenn mir andere sagen, dass ich falsch liege, ist meine erste Reaktion, mit ihnen zu streiten.",
      },
      textObserver: "When people tell him/her that he/she is wrong, his/her first reaction is to argue with them.",
      textObserverByLocale: {
        en: "When people tell him/her that he/she is wrong, his/her first reaction is to argue with them.",
      },
      reversed: true,
    },
    {
      id: 58,
      dimension: "X",
      facet: "social_boldness",
      text: "Ha egy csoport tagja vagyok, gyakran leszek a szovivője is.",
      textByLocale: {
        hu: "Ha egy csoport tagja vagyok, gyakran leszek a szovivője is.",
        en: "When I'm in a group of people, I'm often the one who speaks on behalf of the group.",
        de: "Wenn ich in einer Gruppe von Leuten bin, bin ich oft derjenige, der im Namen der Gruppe spricht.",
      },
      textObserver: "When he/she is in a group of people, he/she is often the one who speaks on behalf of the group.",
      textObserverByLocale: {
        en: "When he/she is in a group of people, he/she is often the one who speaks on behalf of the group.",
      },
    },
    {
      id: 59,
      dimension: "E",
      facet: "sentimentality",
      text: "Semleges maradok olyan helyzetekben is, ahol mások érzelmessé válnak.",
      textByLocale: {
        hu: "Semleges maradok olyan helyzetekben is, ahol mások érzelmessé válnak.",
        en: "I remain unemotional even in situations where most people get very sentimental.",
        de: "Ich bleibe emotionslos, selbst in Situationen, in denen die meisten Leute sehr sentimental werden.",
      },
      textObserver: "He/she remains unemotional even in situations where most people get very sentimental.",
      textObserverByLocale: {
        en: "He/she remains unemotional even in situations where most people get very sentimental.",
      },
      reversed: true,
    },
    {
      id: 60,
      dimension: "H",
      facet: "fairness",
      text: "Kísértésbe vinne, hogy hamisított pénzt használjak, ha tudnám, biztos nem buknék le vele.",
      textByLocale: {
        hu: "Kísértésbe vinne, hogy hamisított pénzt használjak, ha tudnám, biztos nem buknék le vele.",
        en: "I'd be tempted to use counterfeit money, if I were sure I could get away with it.",
        de: "Ich würde in die Versuchung geraten, Falschgeld zu benutzen, wenn ich sicher sein könnte, damit durchzukommen.",
      },
      textObserver: "He/she'd be tempted to use counterfeit money, if he/she were sure he/she could get away with it.",
      textObserverByLocale: {
        en: "He/she'd be tempted to use counterfeit money, if he/she were sure he/she could get away with it.",
      },
      reversed: true,
    },
  ],
};
