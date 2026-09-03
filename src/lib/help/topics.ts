// Vezetett segítő (HelpWidget) tudásbázisa — statikus, LLM nélkül.
// A válaszok kézzel karbantartott tények; ha a termék változik, ezt is
// frissíteni kell. Későbbi AI-asszisztens ugyanezt használhatja forrásként.

export type HelpAudience = "public" | "member" | "manager" | "admin";

interface LocalizedText {
  hu: string;
  en: string;
}

export interface HelpEntry {
  id: string;
  question: LocalizedText;
  answer: LocalizedText;
  /** Rövid, cselekvésre fordított lépések a válasznézetben. */
  steps?: LocalizedText[];
  /** Keresési szinonimák; nem jelennek meg a felületen. */
  keywords?: LocalizedText;
  /** Kapcsolódó válaszok azonosítói. */
  related?: string[];
  link?: { href: string; label: LocalizedText };
  audiences: HelpAudience[];
}

export interface HelpTopic {
  id: string;
  label: LocalizedText;
  entries: HelpEntry[];
}

const ALL: HelpAudience[] = ["public", "member", "manager", "admin"];
const SIGNED_IN: HelpAudience[] = ["member", "manager", "admin"];
const MANAGING: HelpAudience[] = ["manager", "admin"];

const TOPICS: HelpTopic[] = [
  {
    id: "about",
    label: { hu: "Mi a trita?", en: "What is trita?" },
    entries: [
      {
        id: "what-is-trita",
        question: {
          hu: "Mi is az a trita és kinek tud segíteni?",
          en: "What exactly is trita, and who can it help?",
        },
        answer: {
          hu: "A trita személyiség- és csapatintelligencia platform: önértékelés, külső visszajelzések és csapatszintű elemzések egy helyen. Egyéni szinten ingyenes önismereti eszköz, csapatoknak és cégeknek tanácsadói kísérettel zajló fejlesztési program alapja.",
          en: "trita is a personality and team intelligence platform: self-assessment, external feedback, and team-level analyses in one place. For individuals, it is a free self-awareness tool; for teams and companies, it serves as the foundation of a consultant-guided development program.",
        },
        audiences: ["public"],
      },
      {
        id: "try-free",
        question: {
          hu: "Kipróbálhatom ingyen?",
          en: "Can I try it for free?",
        },
        answer: {
          hu: "Igen. Az egyéni felmérés ingyenesen kitölthető, ami körülbelül 8–10 percet vesz igénybe. A végén azonnal kapsz egy teljes személyiségképet.",
          en: "Yes. The individual assessment is free to complete and takes approximately 8–10 minutes. At the end, you will immediately receive a complete personality profile.",
        },
        link: {
          href: "/try",
          label: { hu: "Vendégteszt indítása", en: "Start the guest test" },
        },
        audiences: ["public"],
      },
      {
        id: "how-assessment-works",
        question: {
          hu: "Hogyan működik a személyiségteszt?",
          en: "How does the personality test work?",
        },
        answer: {
          hu: "A felmérés hat személyiségdimenziót mér és körülbelül 8–10 perc alatt kitölthető. Az önértékelést opcionálisan külső visszajelzésekkel egészítheted ki, így az önképed és a külső kép összevethetővé válik.",
          en: "The assessment measures six personality dimensions and takes approximately 8–10 minutes to complete. You can optionally supplement your self-assessment with external feedback, making it possible to compare your self-image with how others see you.",
        },
        audiences: ["public"],
      },
    ],
  },
  {
    id: "teams-companies",
    label: { hu: "Csapatoknak és cégeknek", en: "For teams and companies" },
    entries: [
      {
        id: "what-teams-get",
        question: {
          hu: "Mit kap egy csapat?",
          en: "What does a team get?",
        },
        answer: {
          hu: "A csapat tagjai végigmennek a trita folyamatán, majd közös csapatprofil készül. Többek között személyiségdimenziókat, csapatmintázatokat, csapatszerep-eloszlást és pszichológiai biztonságot vizsgálunk. Az eredményeket egy tanácsadó értékeli, rendszerezi és validálja, a személyes interjúk tanulságaival kiegészítve – egyéni eredmény soha nem kerül a csapatképbe. Az elkészült anyaggal dolgozunk tovább a workshopokon.",
          en: "Team members go through the trita process, after which a shared team profile is created. Among other areas, we examine personality dimensions, team patterns, team role distribution, and psychological safety. A consultant evaluates, organizes, and validates the results, supplementing them with insights from personal interviews – individual results never appear in the team profile. We then use the completed material as the basis for the workshops.",
        },
        audiences: ["public"],
      },
      {
        id: "how-to-start",
        question: {
          hu: "Hogyan indulunk el csapattal?",
          en: "How do we get started with a team?",
        },
        answer: {
          hu: "Vedd fel velünk a kapcsolatot, és egyeztetünk egy rövid bevezető beszélgetést, kötelezettségek nélkül. A program mindig tanácsadói kísérettel zajlik, ezért az indulás első lépése egy személyes egyeztetés.",
          en: "Get in touch and we will arrange a short introductory conversation, with no obligation. The program always runs with consultant guidance, so the first step is a personal consultation.",
        },
        link: {
          href: "/contact",
          label: { hu: "Kapcsolatfelvétel", en: "Contact us" },
        },
        audiences: ["public"],
      },
      {
        id: "pilot-program",
        question: {
          hu: "Mi a pilotprogram, és hogyan csatlakozhatunk?",
          en: "What is the pilot program, and how can our team join?",
        },
        answer: {
          hu: "A 90 napos pilotprogram cégeknek kínál kedvezményes lehetőséget és a szokásosnál szorosabb együttműködést a trita core csapatával. Közös, mérhető képet készítünk a csapat működéséről: megnézzük, mire lehet építeni, hol érdemes változtatni, majd kijelölünk és visszamérünk egy konkrét vezetői lépést. A teljes folyamat során személyesen dolgozunk veletek, az első beszélgetés pedig kötelezettségmentes.",
          en: "The 90-day pilot program offers companies discounted terms and closer collaboration with trita's core team. Together, we build a shared, measurable picture of how your team works: we identify what you can build on, where change would help, then select and remeasure one concrete leadership action. We work with you personally throughout the process, and the initial conversation comes with no obligation.",
        },
        link: {
          href: "/pilot",
          label: { hu: "Megnézem a pilotprogramot", en: "Explore the pilot program" },
        },
        keywords: {
          hu: "pilot program kedvezmény cégek core csapat 90 nap jelentkezés",
          en: "pilot program discount companies core team 90 days apply",
        },
        related: ["what-teams-get", "how-to-start"],
        audiences: ["public"],
      },
      {
        id: "pricing",
        question: {
          hu: "Mennyibe kerül?",
          en: "How much does it cost?",
        },
        answer: {
          hu: "Az ár a csapat méretétől és a program terjedelmétől függ, ezért egyedi ajánlatot adunk. Az ajánlat kereteiről az árak oldalon olvashatsz, a pontos számokhoz írj nekünk.",
          en: "Pricing depends on team size and program scope, so we prepare an individual quote. The pricing page outlines the framework; for exact numbers, contact us.",
        },
        link: {
          href: "/how-we-work",
          label: { hu: "Együttműködés és árazás", en: "How we work and pricing" },
        },
        audiences: ["public"],
      },
    ],
  },
  {
    id: "assessment",
    label: { hu: "Felmérés kitöltése", en: "Taking the assessment" },
    entries: [
      {
        id: "duration-pause",
        question: {
          hu: "Mennyi ideig tart? Megszakíthatom?",
          en: "How long does it take? Can I pause?",
        },
        answer: {
          hu: "A kitöltés kb. 8-10 perc. A válaszaid automatikusan mentődnek, így bármikor megszakíthatod és később ugyanonnan folytathatod.",
          en: "It takes about 8-10 minutes. Your answers are saved automatically, so you can pause anytime and continue later from where you left off.",
        },
        link: {
          href: "/assessment",
          label: { hu: "Felmérés folytatása", en: "Continue the assessment" },
        },
        audiences: SIGNED_IN,
      },
      {
        id: "honest-answers",
        question: {
          hu: "Hogyan érdemes válaszolni?",
          en: "How should I answer?",
        },
        answer: {
          hu: "Nincsenek jó vagy rossz válaszok. Az első benyomásod alapján, őszintén válaszolj – ne azt jelöld, aminek látszani szeretnél, hanem ami valóban jellemző rád. Így lesz a kép pontos és használható.",
          en: "There are no right or wrong answers. Answer honestly based on your first impression – mark what is actually true of you, not what you would like to appear. That is what makes the picture accurate and useful.",
        },
        audiences: SIGNED_IN,
      },
    ],
  },
  {
    id: "results",
    label: { hu: "Eredményeim", en: "My results" },
    entries: [
      {
        id: "where-results",
        question: {
          hu: "Hol találom az eredményeimet?",
          en: "Where do I find my results?",
        },
        answer: {
          hu: "A kitöltés után az Eredményeim oldalon látod a személyiségképedet dimenziónként, magyarázatokkal. Ugyanitt éred el az összehasonlítást és az ismerősi visszajelzések kezelését is.",
          en: "After completing the assessment, the My Results page shows your personality profile by dimension, with explanations. Comparison and peer feedback management live on the same page.",
        },
        link: {
          href: "/profile/results",
          label: { hu: "Eredményeim megnyitása", en: "Open my results" },
        },
        steps: [
          { hu: "Kezdd az Összképpel: itt látod a legerősebb mintázatokat.", en: "Start with Overview to see your strongest patterns." },
          { hu: "A Részletek nézetben dimenziónként olvashatod az értelmezést.", en: "Use Details to read the interpretation dimension by dimension." },
          { hu: "A Külső kép megmutatja, hol egyezik vagy tér el mások benyomása.", en: "Outside view shows where other people's impressions align with or differ from yours." },
        ],
        keywords: { hu: "értelmezés dimenzió összkép részletek profil", en: "interpret dimensions overview details profile" },
        related: ["comparison", "who-sees-results"],
        audiences: SIGNED_IN,
      },
      {
        id: "who-sees-results",
        question: {
          hu: "Ki látja az egyéni eredményeimet?",
          en: "Who can see my individual results?",
        },
        answer: {
          hu: "Az egyéni eredményedet alapesetben csak te látod. Szervezeti programban a tanácsadó a munkája részeként hozzáfér, a vezetők és a csapattagok viszont csak aggregált, névtelenített csapatképet látnak – a te egyéni értékeid abban nem jelennek meg.",
          en: "By default only you can see your individual results. In an organizational program the consultant has access as part of their work, but managers and teammates only see an aggregated, anonymized team picture – your individual values never appear in it.",
        },
        keywords: { hu: "adatvédelem vezető tanácsadó láthatóság", en: "privacy manager consultant visibility" },
        related: ["data-handling", "when-team-results"],
        audiences: SIGNED_IN,
      },
      {
        id: "comparison",
        question: {
          hu: "Mit mutat az összehasonlítás?",
          en: "What does the comparison show?",
        },
        answer: {
          hu: "Az összehasonlítás az önértékelésedet veti össze az ismerőseid visszajelzésével: hol egyezik az önképed a külső képpel, és hol térnek el. Az eltérések gyakran a legérdekesebb önismereti tanulságok.",
          en: "The comparison contrasts your self-assessment with your peers' feedback: where your self-image matches how others see you, and where they differ. The gaps are often the most interesting insights.",
        },
        link: {
          href: "/profile/results?tab=comparison",
          label: { hu: "Összehasonlítás megnyitása", en: "Open comparison" },
        },
        keywords: { hu: "külső kép vakfolt eltérés observer", en: "outside view blind spot difference observer" },
        related: ["how-invite", "who-sees-results"],
        audiences: SIGNED_IN,
      },
    ],
  },
  {
    id: "observers",
    label: { hu: "Ismerősi visszajelzés", en: "Peer feedback" },
    entries: [
      {
        id: "how-invite",
        question: {
          hu: "Hogyan kérek visszajelzést ismerőstől?",
          en: "How do I request feedback from someone?",
        },
        answer: {
          hu: "Az Eredményeim oldal Külső kép fülén, a Meghívások résznél tudsz linket készíteni és elküldeni. Egyszerre legfeljebb 5 aktív meghívód lehet, és minden link 30 napig érvényes. A kitöltéshez az ismerősödnek nem kell regisztrálnia.",
          en: "On the Outside view tab of My Results, use the Invitations section to create and send a link. You can have up to 5 active invites at a time, and each link is valid for 30 days. Your peer does not need to register to fill it out.",
        },
        link: {
          href: "/profile/results?tab=comparison#invitations",
          label: { hu: "Meghívók kezelése", en: "Manage invites" },
        },
        steps: [
          { hu: "Nyisd meg az Eredményeim oldal Külső kép fülét.", en: "Open the Outside view tab on My Results." },
          { hu: "A Meghívások résznél adj meg emailcímet, vagy készíts megosztható linket.", en: "In Invitations, enter an email address or create a shareable link." },
          { hu: "A beérkezett visszajelzések állapotát ugyanitt követheted.", en: "Track incoming feedback in the same place." },
        ],
        keywords: { hu: "meghívás meghívó link email külső kép", en: "invite invitation link email outside view" },
        related: ["whom-to-ask", "comparison"],
        audiences: SIGNED_IN,
      },
      {
        id: "whom-to-ask",
        question: {
          hu: "Kit érdemes megkérni?",
          en: "Whom should I ask?",
        },
        answer: {
          hu: "Olyanokat, akik különböző közegből ismernek: kolléga, barát, családtag. Minél változatosabb a kör, annál árnyaltabb a külső kép – egy-egy visszajelzés önmagában csak egy nézőpont.",
          en: "People who know you from different contexts: a colleague, a friend, a family member. The more varied the circle, the more nuanced the external picture – a single response is just one perspective.",
        },
        audiences: SIGNED_IN,
      },
    ],
  },
  {
    id: "my-team",
    label: { hu: "Csapatom", en: "My team" },
    entries: [
      {
        id: "when-team-results",
        question: {
          hu: "Mikor látom a csapatom eredményeit?",
          en: "When will I see my team's results?",
        },
        answer: {
          hu: "A csapatkép akkor válik láthatóvá, amikor elegen kitöltötték a felmérést, és a tanácsadó értékelte és publikálta a riportot. Addig a csapatoldalon a kitöltés haladása látszik. A publikált kép aggregált: egyéni eredményeket nem tartalmaz.",
          en: "The team picture becomes visible once enough members have completed the assessment and the consultant has reviewed and published the report. Until then, the team page shows completion progress. The published picture is aggregated: it contains no individual results.",
        },
        audiences: SIGNED_IN,
      },
      {
        id: "membership",
        question: {
          hu: "Melyik szervezethez tartozom?",
          en: "Which organization do I belong to?",
        },
        answer: {
          hu: "A fejlécben, a profilmenüben látod, melyik szervezet tagja vagy és milyen szerepben. Ha több szervezethez tartozol, ugyanitt tudsz köztük váltani.",
          en: "The profile menu in the header shows which organization you belong to and in what role. If you belong to several organizations, you can switch between them there.",
        },
        audiences: SIGNED_IN,
      },
    ],
  },
  {
    id: "team-management",
    label: { hu: "Csapat vezetése", en: "Managing a team" },
    entries: [
      {
        id: "track-progress",
        question: {
          hu: "Hogyan követem a kitöltés haladását?",
          en: "How do I track completion progress?",
        },
        answer: {
          hu: "A vezérlőn és a csapatoldalon látod, hányan töltötték ki a felmérést és kik vannak még hátra. A kitöltés alatt szándékosan csak a haladás látszik – a tartalmi eredmények a tanácsadói validálás után nyílnak meg.",
          en: "The cockpit and the team page show how many members have completed the assessment and who is still pending. During collection only progress is shown by design – content results open up after consultant validation.",
        },
        link: {
          href: "/dashboard",
          label: { hu: "Vezérlő megnyitása", en: "Open cockpit" },
        },
        audiences: MANAGING,
      },
      {
        id: "why-gated",
        question: {
          hu: "Miért nem látom a csapateredményeket azonnal?",
          en: "Why can't I see team results immediately?",
        },
        answer: {
          hu: "Két okból: a részleges adat félrevezető képet adna a csapatról, és a nyers számok tanácsadói értelmezés nélkül könnyen félreérthetők. Ezért a csapatképet a tanácsadó validálja és publikálja – aggregált formában, az interjúk tanulságaival együtt.",
          en: "Two reasons: partial data would paint a misleading picture of the team, and raw numbers are easy to misread without consultant interpretation. That is why the team picture is validated and published by the consultant – in aggregate form, together with interview insights.",
        },
        audiences: MANAGING,
      },
      {
        id: "start-campaign",
        question: {
          hu: "Hogyan indul új csapatmérés?",
          en: "How is a new team measurement started?",
        },
        answer: {
          hu: "Új mérést a program tanácsadója indít a szervezet Mérések felületén. A mérés vázlatként készül el, aktiválás után gyűjti a válaszokat, lezárás után pedig nem nyitható újra. Ha új kört szeretnél, jelezd a tanácsadódnak vagy írj nekünk.",
          en: "A new measurement is launched by the program consultant from the organization's Measurements area. It starts as a draft, collects responses after activation, and cannot be reopened after closing. To start a new round, contact your consultant or get in touch with us.",
        },
        link: {
          href: "/contact",
          label: { hu: "Új mérés egyeztetése", en: "Discuss a new measurement" },
        },
        keywords: { hu: "kampány kör indítás mérés tanácsadó", en: "campaign round launch measurement consultant" },
        audiences: MANAGING,
      },
      {
        id: "invite-members",
        question: {
          hu: "Hogyan hívok meg tagokat?",
          en: "How do I invite members?",
        },
        answer: {
          hu: "A csapatoldal Tagok fülén tudsz meghívó linket készíteni. A meghívott a link megnyitásával regisztrál és automatikusan a csapathoz kerül.",
          en: "On the team page's Members tab you can create an invite link. Invitees register by opening the link and are added to the team automatically.",
        },
        audiences: MANAGING,
      },
    ],
  },
  {
    id: "org-admin",
    label: { hu: "Szervezet kezelése", en: "Organization admin" },
    entries: [
      {
        id: "manage-org",
        question: {
          hu: "Hol kezelem a szervezetet és a csapatokat?",
          en: "Where do I manage the organization and teams?",
        },
        answer: {
          hu: "A szervezeti felületen éred el a csapatokat és a tagokat. Új csapatot a Csapatok fülön hozhatsz létre, a tagok szerepét a Tagok fülön módosíthatod. A méréseket a program tanácsadója kezeli.",
          en: "The organization area gives you access to teams and members. Create new teams on the Teams tab and manage member roles on the Members tab. Measurements are managed by the program consultant.",
        },
        link: {
          href: "/dashboard",
          label: { hu: "Vezérlő megnyitása", en: "Open cockpit" },
        },
        audiences: ["admin"],
      },
      {
        id: "access-seats",
        question: {
          hu: "Hogyan bővíthetem a hozzáférést?",
          en: "How do I extend our access?",
        },
        answer: {
          hu: "A hozzáférés a tanácsadói együttműködés része, ezért bővítést, hosszabbítást vagy új csapatok bevonását velünk egyeztetve tudod intézni. Írj nekünk, és javaslatot teszünk a következő lépésre.",
          en: "Access is part of the consulting engagement, so extensions, renewals or onboarding new teams are arranged with us. Get in touch and we will propose the next step.",
        },
        link: {
          href: "/contact",
          label: { hu: "Kapcsolatfelvétel", en: "Contact us" },
        },
        audiences: ["admin"],
      },
    ],
  },
  {
    id: "privacy",
    label: { hu: "Adatkezelés", en: "Privacy" },
    entries: [
      {
        id: "data-handling",
        question: {
          hu: "Hogyan kezelitek az adataimat?",
          en: "How is my data handled?",
        },
        answer: {
          hu: "A válaszaidat és az eredményeidet bizalmasan kezeljük, harmadik félnek nem adjuk át. A részleteket az adatkezelési tájékoztatóban találod.",
          en: "Your answers and results are treated confidentially and never shared with third parties. Full details are in our privacy policy.",
        },
        link: {
          href: "/privacy",
          label: { hu: "Adatkezelési tájékoztató", en: "Privacy policy" },
        },
        audiences: ALL,
      },
    ],
  },
];

/** A megadott közönségnek szóló témák, üres témák nélkül. */
export function getHelpTopics(audience: HelpAudience): HelpTopic[] {
  return TOPICS.map((topic) => ({
    ...topic,
    entries: topic.entries.filter((entry) => entry.audiences.includes(audience)),
  })).filter((topic) => topic.entries.length > 0);
}
