import { t } from "@/lib/i18n/public";
import { PILOT_TOTAL_TEAMS, PILOT_SPOTS_LEFT } from "@/lib/pilot-config";

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
          hu: "A trita segít jobban megérteni, hogyan működsz te, és hogyan működtök együtt egy csapatban. Egyénileg ingyenesen kitöltheted a személyiségfelmérést, és ismerősöktől is kérhetsz visszajelzést. Csapatként tanácsadóval beszélhetitek át az eredményeket és a következő lépéseket.",
          en: "trita helps you understand yourself and how your team works together. As an individual, you can take the free personality assessment and ask people you know for feedback. As a team, you discuss the results and next steps with a consultant.",
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
          hu: "Igen, az egyéni személyiségfelmérés ingyenes, és körülbelül 8–10 perc alatt kitöltheted. A végén rögtön megnézheted az eredményeidet és a hozzájuk tartozó magyarázatokat.",
          en: "Yes. The individual personality assessment is free and takes about 8–10 minutes. You can see your results and explanations as soon as you finish.",
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
          hu: "A kérdésekre azt válaszold, ami általában jellemző rád. A felmérés hat személyiségdimenzió mentén mutatja meg az eredményeidet, érthető magyarázatokkal. Később ismerősöktől is kérhetsz visszajelzést, és összevetheted, hogyan látod magad, és ők hogyan látnak téged.",
          en: "Answer based on what is usually true of you. The assessment shows your results across six personality dimensions, with explanations. Later, you can ask people you know for feedback and compare how you see yourself with how they see you.",
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
        answer: { hu: t("pricing.faqA2", "hu"), en: t("pricing.faqA2", "en") },
        audiences: ["public"],
      },
      {
        id: "how-to-start",
        question: {
          hu: "Hogyan indulunk el csapattal?",
          en: "How do we get started with a team?",
        },
        answer: { hu: t("pricing.faqA3", "hu"), en: t("pricing.faqA3", "en") },
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
          hu: `A pilotban az elsők között próbálhatjátok ki a Csapatprogramot, kedvezményes áron. Személyesen kísérünk benneteket, cserébe őszinte visszajelzést kérünk. Összesen ${PILOT_TOTAL_TEAMS} csapattal indulunk, ebből ${PILOT_TOTAL_TEAMS - PILOT_SPOTS_LEFT} hely már foglalt. A részleteket és az aktuális partneri árat a pilotprogram oldalán találjátok.`,
          en: `The pilot lets your team be among the first to try Team Program at a reduced price. We work closely with you and ask for honest feedback. There are ${PILOT_TOTAL_TEAMS} team places, with ${PILOT_TOTAL_TEAMS - PILOT_SPOTS_LEFT} already taken. The pilot page has the details and current partner price.`,
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
        id: "payment",
        question: { hu: t("pricing.faqQ10", "hu"), en: t("pricing.faqQ10", "en") },
        answer: { hu: t("pricing.faqA10", "hu"), en: t("pricing.faqA10", "en") },
        link: { href: "/pricing", label: { hu: "Árak és kalkulátor", en: "Pricing and calculator" } },
        keywords: { hu: "részletfizetés részletek fizetés átutalás áfa", en: "instalments payment transfer VAT" },
        audiences: ["public"],
      },
      {
        id: "pricing",
        question: {
          hu: "Mennyibe kerül?",
          en: "How much does it cost?",
        },
        answer: { hu: t("pricing.faqA1", "hu"), en: t("pricing.faqA1", "en") },
        link: {
          href: "/pricing",
          label: { hu: "Árak és kalkulátor", en: "Pricing and calculator" },
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
          hu: "Az egyéni személyiségfelmérés körülbelül 8–10 perc. A válaszaidat folyamatosan mentjük, így tarthatsz szünetet, és később ugyanonnan folytathatod. Ha csapatprogramban több kérdőívet töltesz ki, összesen körülbelül 30 perccel számolj.",
          en: "The individual personality assessment takes about 8–10 minutes. We save your answers as you go, so you can take a break and pick up where you left off. If you are completing the questionnaires for a team program, allow about 30 minutes in total.",
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
          hu: "A saját eredményeidet te látod. Csapatprogramban a tanácsadó is hozzáfér, hogy ellenőrizze és értelmezze a csapat eredményeit. A vezető és a csapattársaid az összesített csapatriportot látják, az egyéni személyiségértékeidet nem.",
          en: "You can see your own results. In a team program, the consultant also has access to review and interpret the team's results. Your manager and teammates see the combined team report, not your individual personality scores.",
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
          hu: "A csapat eredményeit akkor láthatod, amikor a tanácsadó átnézte és megosztotta a riportot. Addig a csapatoldalon követheted, hogyan halad a kitöltés. A riport a csapat egészéről szól, egyéni személyiségértékeket nem mutat.",
          en: "You can see the team's results once the consultant has reviewed and shared the report. Until then, the team page shows how completion is progressing. The report describes the team as a whole, without individual personality scores.",
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
          hu: "A vezérlőn és a csapatoldalon megnézheted, ki töltötte már ki a felmérést, és kire vártok még. Az eredményeket akkor látjátok, amikor a tanácsadó átnézte és megosztotta a csapatriportot.",
          en: "On the dashboard and team page, you can see who has completed the assessment and who is still to finish. Results become available once the consultant has reviewed and shared the team report.",
        },
        link: {
          href: "/dashboard",
          label: { hu: "Vezérlő megnyitása", en: "Open dashboard" },
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
          hu: "Előbb megvárjuk a válaszokat, majd a tanácsadó átnézi, mit mutatnak együtt. Így az eredmények mellé magyarázatot is kaptok: mire támaszkodhattok, és hol érdemes óvatosabban következtetni. Ezután osztjuk meg veletek a csapatriportot.",
          en: "We first collect the responses, then the consultant reviews what they show together. You receive explanations alongside the results: what you can rely on and where conclusions need more care. We then share the team report with you.",
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
          label: { hu: "Vezérlő megnyitása", en: "Open dashboard" },
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
          hu: "A válaszaidat és az eredményeidet bizalmasan kezeljük. Az adatkezelési tájékoztatóban elolvashatod, milyen adatokat tárolunk, kik férhetnek hozzájuk, és hogyan kérheted a törlésüket.",
          en: "We treat your answers and results confidentially. Our privacy notice explains what we store, who can access it and how you can ask for it to be deleted.",
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
