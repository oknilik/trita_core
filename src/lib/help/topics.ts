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
    label: { hu: "Mi a Trita?", en: "What is Trita?" },
    entries: [
      {
        id: "what-is-trita",
        question: {
          hu: "Mi a Trita és kinek való?",
          en: "What is Trita and who is it for?",
        },
        answer: {
          hu: "A Trita személyiség- és csapatintelligencia platform: önértékelő felmérés, ismerősi visszajelzés és csapatszintű elemzések egy helyen. Egyéneknek önismereti eszköz, csapatoknak és cégeknek tanácsadói kísérettel zajló fejlesztési program alapja.",
          en: "Trita is a personality and team intelligence platform: self-assessment, peer feedback and team-level analytics in one place. For individuals it is a self-awareness tool; for teams and companies it is the foundation of a consultant-guided development program.",
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
          hu: "Igen. A vendégteszt regisztráció nélkül kitölthető, kb. 15 percet vesz igénybe, és a végén azonnal kapsz egy első személyiségképet.",
          en: "Yes. The guest test requires no registration, takes about 15 minutes, and gives you a first personality profile right away.",
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
          hu: "Hogyan működik a felmérés?",
          en: "How does the assessment work?",
        },
        answer: {
          hu: "A felmérés egy hatfaktoros személyiségmodellre épül, és kb. 15 perc alatt kitölthető. Az önértékelést opcionálisan ismerősi visszajelzésekkel egészítheted ki, így az önkép és a külső kép összevethető.",
          en: "The assessment is based on a six-factor personality model and takes about 15 minutes. You can optionally complement your self-assessment with peer feedback, so your self-image and how others see you can be compared.",
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
          hu: "A csapat tagjai kitöltik a felmérést, majd aggregált csapatprofil készül: dimenzió-átlagok, csapatmintázat és csapatszerep-eloszlás. Az eredményeket tanácsadó értékeli és validálja, személyes interjúk tanulságaival kiegészítve — egyéni eredmény soha nem kerül a csapatképbe.",
          en: "Team members complete the assessment, then an aggregate team profile is built: dimension averages, team pattern and team role distribution. A consultant reviews and validates the results, enriched with insights from personal interviews — individual results never appear in the team picture.",
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
          hu: "Vedd fel velünk a kapcsolatot, és egyeztetünk egy rövid bevezető beszélgetést. A program mindig tanácsadói kísérettel zajlik, ezért az indulás első lépése egy személyes egyeztetés.",
          en: "Get in touch and we will schedule a short introductory call. The program always runs with consultant guidance, so the first step is a personal conversation.",
        },
        link: {
          href: "/contact",
          label: { hu: "Kapcsolatfelvétel", en: "Contact us" },
        },
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
          href: "/pricing",
          label: { hu: "Árak és csomagok", en: "Pricing" },
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
          hu: "A kitöltés kb. 15 perc. A válaszaid automatikusan mentődnek, így bármikor megszakíthatod és később ugyanonnan folytathatod.",
          en: "It takes about 15 minutes. Your answers are saved automatically, so you can pause anytime and continue later from where you left off.",
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
          hu: "Nincsenek jó vagy rossz válaszok. Az első benyomásod alapján, őszintén válaszolj — ne azt jelöld, aminek látszani szeretnél, hanem ami valóban jellemző rád. Így lesz a kép pontos és használható.",
          en: "There are no right or wrong answers. Answer honestly based on your first impression — mark what is actually true of you, not what you would like to appear. That is what makes the picture accurate and useful.",
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
        audiences: SIGNED_IN,
      },
      {
        id: "who-sees-results",
        question: {
          hu: "Ki látja az egyéni eredményeimet?",
          en: "Who can see my individual results?",
        },
        answer: {
          hu: "Az egyéni eredményedet alapesetben csak te látod. Szervezeti programban a tanácsadó a munkája részeként hozzáfér, a vezetők és a csapattagok viszont csak aggregált, névtelenített csapatképet látnak — a te egyéni értékeid abban nem jelennek meg.",
          en: "By default only you can see your individual results. In an organizational program the consultant has access as part of their work, but managers and teammates only see an aggregated, anonymized team picture — your individual values never appear in it.",
        },
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
          hu: "Az Eredményeim oldal Meghívók fülén tudsz meghívó linket készíteni és elküldeni. Egyszerre legfeljebb 5 aktív meghívód lehet, és minden link 30 napig érvényes. A kitöltéshez az ismerősödnek nem kell regisztrálnia.",
          en: "On the Invites tab of My Results you can create and send invite links. You can have up to 5 active invites at a time, and each link is valid for 30 days. Your peer does not need to register to fill it out.",
        },
        link: {
          href: "/profile/results?tab=invites",
          label: { hu: "Meghívók kezelése", en: "Manage invites" },
        },
        audiences: SIGNED_IN,
      },
      {
        id: "whom-to-ask",
        question: {
          hu: "Kit érdemes megkérni?",
          en: "Whom should I ask?",
        },
        answer: {
          hu: "Olyanokat, akik különböző közegből ismernek: kolléga, barát, családtag. Minél változatosabb a kör, annál árnyaltabb a külső kép — egy-egy visszajelzés önmagában csak egy nézőpont.",
          en: "People who know you from different contexts: a colleague, a friend, a family member. The more varied the circle, the more nuanced the external picture — a single response is just one perspective.",
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
          hu: "A vezérlőn és a csapatoldalon látod, hányan töltötték ki a felmérést és kik vannak még hátra. A kitöltés alatt szándékosan csak a haladás látszik — a tartalmi eredmények a tanácsadói validálás után nyílnak meg.",
          en: "The cockpit and the team page show how many members have completed the assessment and who is still pending. During collection only progress is shown by design — content results open up after consultant validation.",
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
          hu: "Két okból: a részleges adat félrevezető képet adna a csapatról, és a nyers számok tanácsadói értelmezés nélkül könnyen félreérthetők. Ezért a csapatképet a tanácsadó validálja és publikálja — aggregált formában, az interjúk tanulságaival együtt.",
          en: "Two reasons: partial data would paint a misleading picture of the team, and raw numbers are easy to misread without consultant interpretation. That is why the team picture is validated and published by the consultant — in aggregate form, together with interview insights.",
        },
        audiences: MANAGING,
      },
      {
        id: "start-campaign",
        question: {
          hu: "Hogyan indítok visszajelzés-kampányt?",
          en: "How do I launch a feedback campaign?",
        },
        answer: {
          hu: "A kampányok felületen tudsz visszajelzés-kört indítani a csapatnak. A kampány vázlatként indul, aktiválás után gyűjti a válaszokat, lezárás után pedig nem nyitható újra — a lezárással várj, amíg mindenki végzett.",
          en: "You can launch a feedback round for your team on the campaigns screen. A campaign starts as a draft, collects responses once activated, and cannot be reopened after closing — wait to close until everyone is done.",
        },
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
          hu: "A szervezeti vezérlőn éred el a csapatokat, a tagokat és a kampányokat. Új csapatot a Csapatok fülön hozhatsz létre, a tagok szerepét a Tagok fülön módosíthatod.",
          en: "The organization cockpit gives you access to teams, members and campaigns. Create new teams on the Teams tab and manage member roles on the Members tab.",
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
