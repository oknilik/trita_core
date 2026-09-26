export const orgTranslations = {
  programTrust: {
    optional: { hu: "Opcionális", en: "Optional" },
    title: { hu: "Bizalmi háló mérése", en: "Measure trust network" },
    description: { hu: "Választható kiegészítő mérés. A riportban külön jelezzük, a csapat mekkora részét fedi le. Az alapriport akkor is elkészülhet, ha nem érkezik be minden válasz. A kör létrehozása után ez a beállítás nem módosítható.", en: "Optional addition with separate report coverage. Incomplete responses do not block the core report. This choice cannot be changed after creating the round." },
    coverage: { hu: "Bizalmi háló · mért párok: {measured}/{possible} · lefedettség: {coverage}%.", en: "Trust network · measured pairs: {measured}/{possible} · coverage: {coverage}%." },
    empty: { hu: "Nincs értékelhető hálóadat ebben a körben. Az alapriport ettől függetlenül elkészülhet.", en: "No usable network data in this round. The core report can still be prepared." },
    note: { hu: "Csak ennek a körnek az adatait mutatjuk. Ha a lefedettség részleges, a kép nem jellemzi a teljes csapat kapcsolatait. A korábbi körrel nem készül automatikus összehasonlítás.", en: "Data from this round only; partial coverage does not represent the whole team network. No automatic comparison with previous rounds." },
  },
  advisory: {
    eyebrow: {
      hu: "tanácsadói konzultáció",
      en: "advisory consultation",
    },
    headingAdvisory: {
      hu: ", a csapataid készen állnak a következő lépésre.",
      en: ", your teams are ready for the next step.",
    },
    headingUpgrade: {
      hu: "Lásd, amit az adatok nem mondanak el.",
      en: "See what the data doesn't tell you.",
    },
    subtitleAdvisory: {
      hu: "A negyedéves tanácsadói konzultáción személyesen értelmezzük a csapataid mintázatait, és konkrét cselekvési terveket dolgozunk ki.",
      en: "In the quarterly advisory consultation we personally interpret your team patterns and develop concrete action plans.",
    },
    subtitleUpgrade: {
      hu: "A személyiségmérés megmutatja a csapat jellemző mintázatait. A konzultáción közösen értelmezzük őket, és megtervezzük a következő lépéseket.",
      en: "The personality assessment data shows the pattern. The advisory consultation helps you understand why – and plan what to do next.",
    },
    teamsNow: {
      hu: "Így állnak most a csapataid",
      en: "Your teams right now",
    },
    members: {
      hu: "fő",
      en: "members",
    },
    details: {
      hu: "Részletek",
      en: "Details",
    },
    whatYouGet: {
      hu: "Mit kapsz a tanácsadói konzultáción?",
      en: "What you get in the advisory consultation",
    },
    whatYouGetSubtitle: {
      hu: "A konzultáción azt tekintjük át, hogyan működnek a csapataid külön-külön és egymással együttműködve.",
      en: "The consultation is org-level – not about one team, but how your teams work together and individually.",
    },
    feature1Title: {
      hu: "Szervezeti hőtérkép",
      en: "Organisational heat map",
    },
    feature1Desc: {
      hu: "Együtt tekintjük át az összes csapatod mintázatát: hol működnek jól együtt, hol jelentkezhet feszültség, és melyik működésmód nehezítheti a szervezeti célok elérését.",
      en: "We review all your team patterns together: where there is alignment, where there are org-level tensions, and which pattern poses a strategic risk.",
    },
    feature1ExampleTwo: {
      hu: "Például: a \u201E{first}\u201D és a \u201E{second}\u201D csapatok közötti dinamika értelmezése.",
      en: "E.g.: interpreting the dynamics between the \u201C{first}\u201D and \u201C{second}\u201D teams.",
    },
    feature1ExampleOne: {
      hu: "Például: a \u201E{pattern}\u201D mintázat szervezeti hatásai és rejtett kockázatai.",
      en: "E.g.: the organisational impact and hidden risks of the \u201C{pattern}\u201D pattern.",
    },
    feature2Title: {
      hu: "Csapatok közötti feszültségek",
      en: "Cross-team tensions",
    },
    feature2Desc: {
      hu: "Azonosítjuk, hol ütköznek a csapatok működési mintázatai – és hol éppen a különbözőség az erő. Ez az, amit a platform önmagában nem tud megmutatni.",
      en: "We identify where team operating patterns clash – and where the difference is actually a strength. This is what the platform alone can't show.",
    },
    feature2Example: {
      hu: "Például: mi nehezíti az értékesítési és a termékfejlesztési csapat közötti kommunikációt, és mit tehetsz vezetőként.",
      en: "E.g.: why the sales and product teams struggle to communicate, and what you can do as a leader.",
    },
    feature3Title: {
      hu: "Szervezeti cselekvési terv",
      en: "Organisational action plan",
    },
    feature3Desc: {
      hu: "3–5 konkrét lépést tervezünk a következő negyedévre: hogyan oszd el a feladatokat a csapatok között, mely folyamatokon változtass, és hol van szükség személyes vezetői közreműködésre.",
      en: "3-5 concrete, executable steps for the next quarter – not team-level tips, but organisational decisions: who goes where, where to change process, where to intervene personally.",
    },
    feature3ExamplePrefix: {
      hu: "Például",
      en: "E.g.",
    },
    feature4Title: {
      hu: "Írásos összefoglaló és csapatriportok",
      en: "Written summary + team reports",
    },
    feature4Desc: {
      hu: "48 órán belül PDF-ben küldjük el a szervezeti hőtérképet, a csapatonkénti 2–3 soros értékelést és a megbeszélt teendőket, felelősökkel és határidőkkel. A következő mérés időpontjára is javaslatot teszünk.",
      en: "Within 48 hours you receive a PDF: org heat map visualisation, 2-3 sentence team-by-team evaluation, action list with owners and deadlines, and next measurement point recommendation.",
    },
    howItWorks: {
      hu: "Hogyan zajlik a negyedéves konzultáció?",
      en: "How the quarterly consultation works",
    },
    step1Title: {
      hu: "Felkészülés a konzultációra",
      en: "Preparation (async)",
    },
    step1Body: {
      hu: "Áttekintjük a csapataid mintázatait, a közöttük jelentkező feszültségeket és az előző negyedév óta történt változásokat. Ebből készítjük el a szervezeti hőtérképet, amely a konzultáció kiindulópontja lesz.",
      en: "We review all your org's team patterns, cross-team tensions, and changes since the last quarter. This produces the org heat map that serves as the consultation's starting point.",
    },
    step2Title: {
      hu: "Konzultációs hívás (60–90 perc)",
      en: "Consultation call (60–90 minutes)",
    },
    step2Body: {
      hu: "Vezetőként vagy HR-munkatársként videóhíváson vehetsz részt a konzultáción. Együtt értelmezzük a szervezeti mintázatokat, a csapatok együttműködését és a feszültségek lehetséges okait. A következő negyedévre 3–5 konkrét lépést tervezünk, és a kérdéseidet is részletesen átbeszéljük.",
      en: "Personal video call with you (leader / HR). Org-level pattern interpretation, cross-team dynamics, root causes of tension points, 3-5 concrete actions for the next quarter. If you have a specific question – we go deep.",
    },
    step3Title: {
      hu: "Írásos összefoglaló (48 órán belül)",
      en: "Written summary (within 48 hours)",
    },
    step3Body: {
      hu: "A PDF-ben megtalálod a szervezeti hőtérképet, a csapatok rövid értékelését és a megbeszélt teendőket, felelősökkel és határidőkkel. Javaslatot adunk a következő mérés időpontjára is. Az összefoglalót a vezetőségi megbeszélésen is felhasználhatod.",
      en: "PDF document: org heat map, short team-by-team evaluation, action list with owners and deadlines, next measurement point recommendation. Ready to share in your next management meeting.",
    },
    // Időtartam-állítás szándékosan nincs a címben: az ajánlat egyedi
    // („egyedi ajánlat szerint" ár), a korábbi 60 perc vs 2–3 óra
    // ellentmondást így oldjuk fel.
    deepDiveTitle: {
      hu: "Műhelymunka a csapat alaposabb megismeréséhez",
      en: "Team deep-dive workshop",
    },
    deepDiveDesc: {
      hu: "Ha egy csapat működését alaposabban szeretnéd megérteni, személyre szabott műhelymunkát tartunk a csapat vezetőjével.",
      en: "If a specific team needs deeper analysis – a personalised workshop with the team manager.",
    },
    deepDivePrice: { hu: "egyedi ajánlat szerint", en: "individually quoted" },
    ctaCustomEyebrow: {
      hu: "egyedi program",
      en: "custom programme",
    },
    ctaAdvisoryEyebrow: {
      hu: "tanácsadói csomag",
      en: "advisory plan",
    },
    ctaCustomHeading: {
      hu: "Egyeztessünk időpontot",
      en: "Let's schedule a session",
    },
    ctaAdvisoryHeading: {
      hu: "Kérd a következő negyedéves konzultációt",
      en: "Request your next quarterly consultation",
    },
    ctaCustomBody: {
      hu: "Az egyedi programodhoz személyre szabott ütemtervet készítünk. Jelezd az igényed az alábbi gombbal, és egyeztetünk a részletekről.",
      en: "Within your custom programme we create a bespoke schedule – click and we'll coordinate.",
    },
    ctaAdvisoryBody: {
      hu: "A programodhoz tartozik szervezeti szintű tanácsadói konzultáció. Kattints az alábbi gombra, és 24 órán belül egyeztetünk időpontot. A csapataid adatai automatikusan rendelkezésre állnak – nem kell semmit előkészítened.",
      en: "Your programme includes org-level advisory consultations. Click and we'll confirm a time within 24 hours. Your team data is automatically available – no preparation needed.",
    },
    sending: {
      hu: "Küldés…",
      en: "Sending...",
    },
    requestConsultation: {
      hu: "Konzultációt kérek",
      en: "Request consultation",
    },
    requestReceived: {
      hu: "Megkaptuk a kérésed!",
      en: "We received your request!",
    },
    requestFollowUp: {
      hu: "24 órán belül felvesszük veled a kapcsolatot az időpont egyeztetéséhez.",
      en: "We'll reach out within 24 hours to schedule a time.",
    },
    upgradeDesc: {
      hu: "Negyedéves személyes tanácsadói konzultáció és teljes hozzáférés a platformhoz. A csapatod adatai alapján közösen készítünk megvalósítható cselekvési tervet.",
      en: "Quarterly personal advisory consultation + full platform access. We build concrete, executable action plans from your team data together.",
    },
    upgradeFeature1: {
      hu: "Negyedéves 90 perces szervezeti szintű tanácsadói konzultáció",
      en: "Quarterly 90-minute org-level advisory consultation",
    },
    upgradeFeature2: {
      hu: "Szervezeti hőtérkép + csapatonkénti írásos értékelés (PDF)",
      en: "Org heat map + written team-by-team evaluation (PDF)",
    },
    upgradeFeature3: {
      hu: "A csapatok közötti együttműködés és feszültségek elemzése",
      en: "Cross-team dynamics and tension point analysis",
    },
    upgradeFeature4: {
      hu: "3–5 konkrét szervezeti cselekvési terv negyedévenként",
      en: "3-5 concrete org-level action plans per quarter",
    },
    upgradeFeature5: {
      hu: "Teljes hozzáférés a platformhoz (hőtérkép, csapatmintázat, feszültségpárok)",
      en: "Full platform access (heat map, team patterns, tension pairs)",
    },
    upgradeFeature6: {
      hu: "A csapat részletes elemzése kérésre, egyedi ajánlat szerint",
      en: "Optional team deep-dive session (individually quoted)",
    },
    pricePerMonth: { hu: "Egyedi ajánlat – a program terjedelme szerint", en: "Individual quote – based on program scope" },
    foundingCustomer: {
      hu: "A pilotprogram partnerei kiemelt feltételekkel indulnak.",
      en: "Pilot program partners start with preferential terms.",
    },
    upgradeButton: {
      hu: "Váltás Advisory-ra",
      en: "Upgrade to Advisory",
    },
    testimonial: {
      hu: "\u201EA konzultáción végre megértettem, miért van feszültség az értékesítési és a termékfejlesztési csapat között – és kaptam 3 konkrét lépést, amit azonnal elkezdtünk.\u201D",
      en: "\u201CAt the consultation I finally understood why there was tension between the sales and product teams – and I got 3 concrete steps we started immediately.\u201D",
    },
    testimonialAuthor: {
      hu: "– Egy leendő pilotpartner",
      en: "– A future founding customer",
    },
    faqTitle: {
      hu: "Gyakori kérdések",
      en: "Frequently asked questions",
    },
    faqQ1: {
      hu: "Kell valamit előkészítenem a konzultáció előtt?",
      en: "Do I need to prepare anything?",
    },
    faqA1: {
      hu: "Nem – a szervezeted összes csapatának mérési adatai, mintázatai és feszültségpárjai automatikusan rendelkezésre állnak. Ha van konkrét kérdésed vagy helyzeted, azt előre jelezheted, de nem kötelező.",
      en: "No – all your org's teams' assessment data, patterns and tension pairs are automatically available. If you have a specific question or situation, you can flag it in advance, but it's not required.",
    },
    faqQ2: {
      hu: "A konzultáció az egész szervezetről szól, vagy egy csapatról?",
      en: "Is the consultation about the whole org or one team?",
    },
    faqA2: {
      hu: "A negyedéves konzultáción az egész szervezetet áttekintjük: a csapatok mintázatait, az együttműködésüket és a szükséges szervezeti lépéseket. Egy-egy csapat részletesebb elemzése külön is kérhető, egyedi ajánlat alapján.",
      en: "The quarterly consultation is org-level: we review all team patterns, cross-team dynamics, and create org-level action plans. If a specific team needs deeper analysis, a separate team deep-dive can be requested (individually quoted).",
    },
    faqQ3: {
      hu: "Ki vesz részt a konzultáción?",
      en: "Who participates in the consultation?",
    },
    faqA3: {
      hu: "Általában te veszel részt vezetőként, HR-munkatársként vagy ügyvezetőként, a Trita tanácsadójával együtt. A csapatvezetőknek nem szükséges jelen lenniük: a saját csapatuk elemzését a platformon érik el.",
      en: "Usually you (leader, HR, or CEO) and the trita advisor. Team managers don't need to join – they receive their team's insights directly through the platform.",
    },
    faqQ4: {
      hu: "Mit kapok a konzultáció után?",
      en: "What do I receive after the consultation?",
    },
    faqA4: {
      hu: "48 órán belül írásos összefoglalót és cselekvési tervet küldünk PDF-ben. Ez tartalmazza a szervezeti hőtérképet, a csapatok rövid értékelését, valamint a megbeszélt teendőket, felelősökkel és határidőkkel. Javaslatot adunk a következő mérés időpontjára is. Az anyagot a vezetőségi megbeszélésen is felhasználhatod.",
      en: "Within 48 hours we send a written summary and action plan PDF: org heat map, short team-by-team evaluation, action list with owners and deadlines, and next measurement point recommendation. Ready to share in your next management meeting.",
    },
    faqQ5: {
      hu: "Milyen gyakran van konzultáció?",
      en: "How often is the consultation?",
    },
    faqA5: {
      hu: "A programod terjedelmétől függ – jellemzően negyedévente egy szervezeti szintű alkalom. Ezen felül csapatszintű mélyelemzés és extra alkalmak igény szerint egyeztethetők.",
      en: "It depends on your programme – typically one org-level session per quarter. Team-level deep dives and extra sessions can be arranged on request.",
    },
    faqQ6: {
      hu: "Konzultáció nélkül is használható a platform?",
      en: "Can I use the platform without consultations?",
    },
    faqA6: {
      hu: "Igen. A platform önmagában is teljes képet ad – csapatminta, hőtérkép, feszültségpárok. A tanácsadói konzultáció ezt értelmezi és fordítja le lépésekre; bármikor kérheted, külön egyeztetéssel.",
      en: "Yes. The platform alone gives the full picture – team pattern, heatmap, tension pairs. Advisory consultations interpret it and turn it into concrete steps; you can request them at any time.",
    },
  },
  admin: {
    title: { hu: "Adminisztrátori áttekintés", en: "Admin Dashboard" },
    subtitle: {
      hu: "Rendszerstatisztikák és elemzések",
      en: "System statistics and analytics",
    },
    totalUsers: { hu: "Összes felhasználó", en: "Total users" },
    totalAssessments: { hu: "Összes teszt", en: "Total assessments" },
    totalInvitations: { hu: "Összes meghívó", en: "Total invitations" },
    totalFeedback: { hu: "Visszajelzések", en: "Feedback submissions" },
    usersTitle: { hu: "Felhasználók", en: "Users" },
    assessmentsTitle: { hu: "Tesztkitöltések", en: "Test completions" },
    invitationsTitle: { hu: "Meghívók", en: "Invitations" },
    feedbackTitle: { hu: "Visszajelzések", en: "Feedback" },
    new7days: { hu: "Új (7 nap)", en: "New (7 days)" },
    new30days: { hu: "Új (30 nap)", en: "New (30 days)" },
    byTestType: { hu: "Teszttípusonként", en: "By test type" },
    conversionRate: { hu: "Konverzió", en: "Conversion rate" },
    avgAge: { hu: "Átlagéletkor", en: "Avg age" },
    medianAge: { hu: "Medián életkor", en: "Median age" },
    ageRange: { hu: "Életkori tartomány", en: "Age range" },
  },

  // ── Org detail page (/org/[id]) ──────────────────────────────────────────
  org: {
    eyebrow: { hu: "szervezet", en: "organization" },

    // ── /org/suspended — inaktív szervezet zsákutca-oldala ───────────────
    suspended: {
      eyebrow: { hu: "inaktív", en: "inactive" },
      title: { hu: "A szervezet inaktív", en: "Organization inactive" },
      body1: {
        hu: "A szervezet, amelyhez tartozol, jelenleg inaktív.",
        en: "The organization you belong to is currently inactive.",
      },
      body2: {
        hu: "Ha úgy gondolod, ez hiba, keresd a szervezet adminisztrátorát – vagy írj nekünk, és segítünk.",
        en: "If you think this is a mistake, contact your organization's administrator – or write to us and we'll help.",
      },
      ctaResults: { hu: "Vissza az eredményeimhez", en: "Back to my results" },
      ctaContact: { hu: "Kapcsolatfelvétel", en: "Contact us" },
    },

    setupPending: { hu: "Beállítás folyamatban", en: "Setup pending" },
    settingsLink: { hu: "Beállítások", en: "Settings" },
    membersLabel: { hu: "Tagok", en: "Members" },
    pendingSuffix: { hu: "függőben", en: "pending" },
    teamsLabel: { hu: "Csapatok", en: "Teams" },
    activeCampaigns: { hu: "Aktív mérés", en: "Active measurements" },
    closedSuffix: { hu: "lezárt", en: "closed" },
    completionRate: { hu: "Befejezési arány", en: "Completion rate" },

    // ── Org story dashboard ──────────────────────────────────────────────
    heroSub: { hu: "A szervezeted pillanatképe", en: "Your organization at a glance" },
    heroCta1: { hu: "Új értékelés indítása", en: "Start new assessment" },
    heroCta2: { hu: "Csapatok áttekintése", en: "View teams" },

    insightEyebrow: { hu: "Most érdemes figyelni", en: "Worth your attention" },
    insightActivityTitle: { hu: "Legfrissebb aktivitás", en: "Latest activity" },
    insightActivityNone: { hu: "Még nincs rögzített aktivitás", en: "No recorded activity yet" },
    insightFeedbackTitle: { hu: "Visszajelzési körök", en: "Feedback rounds" },
    insightFeedbackActive: { hu: "{count} aktív visszajelzési kör fut", en: "{count} active feedback round(s) running" },
    insightFeedbackNone: { hu: "Nincs futó visszajelzési kör – érdemes újat indítani", en: "No active feedback round – consider starting one" },
    insightActionTitle: { hu: "Következő lépés", en: "Next step" },
    insightActionInvite: { hu: "Meghívóra váró tagok: {count}", en: "Members awaiting invitation: {count}" },
    insightActionStart: { hu: "Indíts új mérést vagy hívj meg tagokat", en: "Start a new measurement or invite members" },

    stateEyebrow: { hu: "Szervezeti állapot", en: "Organization status" },
    stateMembersTitle: { hu: "Aktív tagok", en: "Active members" },
    stateMembersSub: { hu: "{count} tag a szervezetben", en: "{count} members in the organization" },
    stateTeamsTitle: { hu: "Csapatok", en: "Teams" },
    stateTeamsSub: { hu: "{count} csapat regisztrálva", en: "{count} teams registered" },
    stateCompletionTitle: { hu: "Kitöltöttség", en: "Completion" },
    stateCompletionSub: { hu: "{done}/{total} tag fejezte be az értékelést", en: "{done}/{total} members completed their assessment" },
    stateCampaignsTitle: { hu: "Mérések", en: "Measurements" },
    stateCampaignsSub: { hu: "{active} aktív, {closed} lezárt", en: "{active} active, {closed} closed" },

    teamsEyebrow: { hu: "Csapatok áttekintése", en: "Teams overview" },
    teamCardMembers: { hu: "{count} tag", en: "{count} members" },
    teamCardOpen: { hu: "Megnyitás", en: "Open" },
    teamCardNoTeams: { hu: "Még nincs csapat. A Csapatok oldalon hozhatsz létre egyet.", en: "No teams yet – create one on the teams page." },

    ctaBandTitle: { hu: "Készen álltok a következő körre?", en: "Ready for the next round?" },
    ctaBandSub: { hu: "Indíts új visszajelzési kört vagy adj hozzá új csapatot.", en: "Start a new feedback round or add a new team." },
    ctaBandCta1: { hu: "Új kör indítása", en: "Start new round" },
    ctaBandCta2: { hu: "Új csapat", en: "New team" },

    // ── Org settings page (/org/[id]/settings) ────────────────────────────
    backToOrg: { hu: "Vissza a szervezethez", en: "Back to organization" },
    settings: {
      eyebrow: { hu: "beállítások", en: "settings" },
      orgNameEyebrow: { hu: "szervezet neve", en: "organization name" },
      orgNameTitle: { hu: "Szervezet neve", en: "Organization name" },
      subscriptionEyebrow: { hu: "előfizetés", en: "subscription" },
      subscriptionTitle: { hu: "Előfizetés", en: "Subscription" },
      statusActive: { hu: "Aktív", en: "Active" },
      statusPastDue: { hu: "Fizetési hiba", en: "Past due" },
      statusCanceled: { hu: "Lemondva", en: "Canceled" },
      statusNone: { hu: "Nincs előfizetés", en: "No subscription" },
      trialDaysLeft: { hu: "{days} nap van hátra", en: "{days} days left" },
      trialExpiresToday: { hu: "Ma jár le", en: "Expires today" },
      accessActive: { hu: "A hozzáférés aktív.", en: "Access is active." },
      trialInfo: { hu: "14 napos próbaidőszak – kártyaadat nélkül.", en: "14-day trial – no credit card required." },
      activatePrompt: { hu: "Az előfizetés aktiválásához kattints az alábbi gombra.", en: "Activate your subscription using the button below." },
      activateBtn: { hu: "Aktiválás", en: "Activate" },
      reactivateBtn: { hu: "Újraaktiválás", en: "Reactivate" },
      seatsEyebrow: { hu: "létszám", en: "seats" },
      seatsTitle: { hu: "Aktív helyek", en: "Active seats" },
      includedSeats: { hu: "alapcsomagban foglalt hely", en: "included seats" },
      extraSeatsInfo: { hu: "+{extra} extra hely", en: "+{extra} extra seat{plural}" },
      seatsAvailable: { hu: "{available} hely elérhető", en: "{available} seat{plural} available" },
      pendingInvites: { hu: "+{count} meghívás függőben", en: "+{count} invitation{plural} pending" },
      needMoreSeats: { hu: "Több hely kell?", en: "Need more seats?" },
      upgradeHint: { hu: "Az Org csomag 40 helyet tartalmaz – a feltételekről egyeztess a tanácsadóddal.", en: "The Org plan includes 40 seats – discuss terms with your consultant." },
      upgradeLink: { hu: "Csomagváltás", en: "Upgrade" },
      rolesEyebrow: { hu: "szerepkörök", en: "roles" },
      rolesTitle: { hu: "Tagok szerepkörei", en: "Member roles" },
      // CJ-CREDITS — jelöltkeret-blokk (consulting-led: a tanácsadó kezeli)
      creditsEyebrow: { hu: "jelöltkeretek", en: "candidate credits" },
      creditsTitle: { hu: "Jelöltkeretek", en: "Candidate credits" },
      creditsUsage: {
        hu: "{used} felhasznált · {total} összesen jóváírt",
        en: "{used} used · {total} granted in total",
      },
      creditsConsultantNote: {
        hu: "A jelöltfelmérésekhez felhasználható keretet a Trita tanácsadója kezeli az együttműködésetek részeként. Ha további felmérésekre van szükségetek, vagy kérdésed van a keretről, jelezd nekünk.",
        en: "Candidate assessment credits are managed by your trita consultant – they are set up and topped up as part of the consulting engagement. If you need more credits or have a question about the balance, get in touch.",
      },
      creditsContactCta: { hu: "Kapcsolatfelvétel", en: "Contact us" },
      dangerEyebrow: { hu: "veszélyes zóna", en: "danger zone" },
      dangerTitle: { hu: "Veszélyes zóna", en: "Danger zone" },
      dangerDescription: { hu: "A szervezet inaktiválása után a tagok nem férnek hozzá a szervezethez tartozó felületekhez.", en: "Deactivating the organization will block members from accessing org-scoped pages." },
      alreadyInactive: { hu: "A szervezet már inaktív.", en: "Organization is already inactive." },
    },

    // ── Campaign pages ────────────────────────────────────────────────────
    campaign: {
      // New campaign page
      backWithName: { hu: "Vissza · {orgName}", en: "Back · {orgName}" },
      newEyebrow: { hu: "új mérés", en: "new measurement" },
      newTitle: { hu: "Mérés létrehozása", en: "Create measurement" },

      // Campaign detail page
      eyebrowActive: { hu: "aktív mérés", en: "active measurement" },
      eyebrowClosed: { hu: "lezárt mérés", en: "closed measurement" },
      eyebrowDraft: { hu: "mérés – tervezés alatt", en: "measurement – draft" },
      statusActive: { hu: "Aktív", en: "Active" },
      statusClosed: { hu: "Lezárva", en: "Closed" },
      statusDraft: { hu: "Vázlat", en: "Draft" },
      createdAt: { hu: "Létrehozva:", en: "Created:" },
      closedAt: { hu: "Lezárva:", en: "Closed:" },
      participant: { hu: "résztvevő", en: "participant" },
      participants: { hu: "résztvevő", en: "participants" },
      complete: { hu: "kitöltve", en: "complete" },
      selfAssessment: { hu: "Önértékelés", en: "Self-assessment" },
      completed: { hu: "befejezett", en: "completed" },
      observerDone: { hu: "Külső visszajelzés kész", en: "Observer done" },
      receivedFeedback: { hu: "kapott visszajelzést", en: "received feedback" },
      fullyComplete: { hu: "Minden lépés kész", en: "Fully complete" },
      bothDone: { hu: "mindkettő kész", en: "both done" },

      // Pszichológiai biztonság pulse (anonim aggregátum)
      psEyebrow: { hu: "Pszichológiai biztonság", en: "Psychological safety" },
      psIndexTitle: { hu: "Biztonságindex", en: "Safety index" },
      psCompleted: { hu: "kitöltötte", en: "completed" },
      psAnonNote: {
        hu: "A válaszok névtelenek: csak a csapatszintű összesítés látszik, egyéni válasz nem kereshető vissza. Az eredmény legalább 3 kitöltéstől jelenik meg.",
        en: "Responses are anonymous: only the team-level aggregate is shown, individual answers cannot be traced back. Results appear from at least 3 responses.",
      },
      psBelowThreshold: {
        hu: "Az eredmény legalább {min} kitöltés után jelenik meg – így senki válasza nem beazonosítható. Emlékeztesd a csapatot, ha megakadt a kitöltés.",
        en: "Results appear after at least {min} responses – so nobody's answers can be identified. Remind the team if completion has stalled.",
      },
      psBandHigh: { hu: "Erős biztonságérzet", en: "Strong sense of safety" },
      psBandMid: { hu: "Közepes biztonságérzet", en: "Moderate sense of safety" },
      psBandLow: { hu: "Törékeny biztonságérzet", en: "Fragile sense of safety" },
      psResponses: { hu: "{count} válasz", en: "{count} responses" },
      // ±-jel nélkül (2026-08-11 termékdöntés: ± jelölés nem kerül a UI-ra).
      psSpread: { hu: "szóródás: {spread} pont", en: "spread: {spread} points" },
      psItemsTitle: { hu: "Állításonként", en: "By statement" },
      devArcEyebrow: { hu: "fejlődési ív", en: "development arc" },
      devArcTitle: { hu: "Fejlődési ív", en: "Development arc" },
      devArcCompare: { hu: "Összehasonlítás: \"{name}\" kampányhoz képest", en: "Compared to: \"{name}\" campaign" },
      participantsEyebrow: { hu: "résztvevők", en: "participants" },
      participantsTitle: { hu: "Résztvevők", en: "Participants" },
      noParticipants: { hu: "Még nincs résztvevő.", en: "No participants yet." },
      participantDone: { hu: "Kész", en: "Done" },
      participantSelfDone: { hu: "Önértékelés kész", en: "Self done" },
      participantNotStarted: { hu: "Még nem kezdte el", en: "Not started" },
      statusEyebrow: { hu: "státusz", en: "status" },
      managementTitle: { hu: "Mérés kezelése", en: "Measurement management" },
      activateDescription: { hu: "Az aktiválás után a résztvevők értesítést kapnak és megkezdhetik az értékeléseket.", en: "After activation, participants will be notified and can begin evaluations." },
      editDraftEyebrow: { hu: "piszkozat", en: "draft" },
      editDraftTitle: { hu: "Mérések és részt vevő csapat szerkesztése", en: "Edit measurements and targeting" },
      editDraftHint: {
        hu: "Amíg a mérés vázlat, módosíthatod a lépéseket, a részt vevő csapatot és az ütemezést. Aktiválás után ezek már nem változtathatók.",
        en: "While the campaign is a draft, its measurement steps, target team and pacing can be changed freely. After activation the campaign composition is locked.",
      },
      editPresetDraftHint: {
        hu: "Az előre összeállított csomag mérési lépései rögzítettek. Amíg vázlatként szerepel, a részt vevő csapat és az ütemezés még módosítható.",
        en: "The named package has fixed measurement steps; its target team and pacing can still be changed while it is a draft.",
      },
      editTypesLabel: { hu: "Mérések (rögzített sorrendben)", en: "Measurements (canonical order)" },
      editTeamLabel: { hu: "Részt vevő csapat", en: "Target team" },
      editNoTeam: { hu: "Egyénileg kiválasztott résztvevők, csapat kijelölése nélkül", en: "No team targeting (individually selected participants)" },
      editTeamNote: {
        hu: "A kiválasztott csapat módosításával a résztvevők névsora nem változik. Az új tagokat a Résztvevők résznél adhatod hozzá.",
        en: "Changing the team does not rewrite the participant list – add members in the Participants block.",
      },
      editSave: { hu: "Módosítások mentése", en: "Save changes" },
      editSaved: { hu: "Elmentve.", en: "Saved." },
      editFailed: { hu: "Mentés sikertelen – próbáld újra.", en: "Save failed – try again." },
      discardDraft: { hu: "Vázlat elvetése", en: "Discard draft" },
      discarding: { hu: "Elvetés…", en: "Discarding…" },
      discardConfirm: {
        hu: "Biztosan elveted a mérés vázlatát? A vázlat és a hozzáadott résztvevők listája véglegesen törlődik.",
        en: "Discard this measurement draft? The draft and its participant list will be permanently deleted.",
      },
      discardFailed: { hu: "Az elvetés nem sikerült – próbáld újra.", en: "Discard failed – try again." },
      discardConfirmCta: { hu: "Végleges elvetés", en: "Discard permanently" },
      discardCancel: { hu: "Mégse", en: "Cancel" },
      deleteCampaign: { hu: "Mérés törlése", en: "Delete measurement" },
      deleting: { hu: "Törlés…", en: "Deleting…" },
      deleteConfirm: {
        hu: "Biztosan törlöd ezt a mérést? A kör MINDEN beadott értékelése (bizalmi, szerep-visszajelzés, elismerés, pulzusmérés) véglegesen törlődik, és a mérés a lezárt körök közt sem jelenik meg többé. A tagok saját eredményei (személyiségteszt, szerepkérdőív) megmaradnak.",
        en: "Delete this measurement? ALL submitted ratings in this round (trust, role feedback, recognition, pulse) are permanently deleted, and the round will no longer appear among closed rounds. Members' own results (personality test, role questionnaire) are kept.",
      },
      deleteConfirmCta: { hu: "Végleges törlés", en: "Delete permanently" },
      deleteFailed: { hu: "A törlés nem sikerült – próbáld újra.", en: "Delete failed – try again." },
      deleteHint: {
        hu: "Végleges: a kör beadott értékelései is törlődnek, és a mérés a lezárt listából is eltűnik.",
        en: "Permanent: the round's submitted ratings are deleted too, and the measurement disappears from the closed list.",
      },
      discardHint: {
        hu: "Csak vázlat vethető el – aktivált mérést lezárni lehet, törölni nem.",
        en: "Only drafts can be discarded – an activated measurement can be closed, not deleted.",
      },
      peerFbStatsEyebrow: { hu: "kollégák visszajelzései", en: "peer feedback round" },
      peerFbStatsTitle: { hu: "Részvétel", en: "Participation" },
      peerFbStatsBody: {
        hu: "{givers} tag összesen {items} javaslatot küldött be. {covered} címzett kapott javaslatot legalább 3 csapattárstól.",
        en: "{givers} members submitted, {items} suggestions in total; {covered} recipients have reached the 3-sender threshold.",
      },
      peerFbStatsNote: {
        hu: "A tartalmat a tanácsadói felület nem mutatja – a visszajelzés a tagok közti kommunikáció, itt csak a részvétel követhető.",
        en: "Content is not shown on the consultant surface – feedback is member-to-member communication; only participation is tracked here.",
      },
      editTeamRequired: {
        hu: "A kiválasztott mérésekhez jelölj ki egy csapatot. A csapatszerep-kör, a bizalmi kör és a pulzusmérés csapaton belül végezhető el.",
        en: "The selected measurements need a target team (role, trust and pulse rounds live on a team).",
      },
      closeDescription: { hu: "A lezárás végleges – az értékelések leállnak és az eredmények rögzülnek.", en: "Closing is permanent – evaluations stop and results are recorded." },
      activateCampaign: { hu: "Mérés aktiválása", en: "Activate measurement" },
      closeCampaign: { hu: "Mérés lezárása", en: "Close measurement" },

      // Personality dimension labels (campaign detail)
      tritanINTE: { hu: "Becsületesség-Alázat", en: "Honesty-Humility" },
      tritanRESO: { hu: "Emocionalitás", en: "Emotionality" },
      tritanTEMP: { hu: "Extraverzió", en: "Extraversion" },
      tritanADAP: { hu: "Barátságosság", en: "Agreeableness" },
      tritanTHOR: { hu: "Lelkiismeretesség", en: "Conscientiousness" },
      tritanOPEN: { hu: "Nyitottság", en: "Openness" },
    },

    // ── Shell / tabs ───────────────────────────────────────────────────────
    shell: {
      tabOverview: { hu: "Áttekintés", en: "Overview" },
      tabCampaigns: { hu: "Mérések", en: "Measurements" },
      tabTeams: { hu: "Csapatok", en: "Teams" },
      tabMembers: { hu: "Tagok", en: "Members" },
      tabInquiries: { hu: "Kérdések", en: "Inquiries" },
      tabCandidates: { hu: "Jelöltek", en: "Candidates" },
      tabBilling: { hu: "Számlázás", en: "Billing" },
    },

    // ── Billing tab ─────────────────────────────────────────────────────
    billing: {
      statusActive: { hu: "Aktív", en: "Active" },
      statusCanceled: { hu: "Lemondva", en: "Canceled" },
      trialDays: { hu: "{days} nap van hátra", en: "{days} days remaining" },

      monthly: { hu: "Havi", en: "Monthly" },



      readOnly: { hu: "A számlázási adatokat csak adminisztrátor kezelheti.", en: "Billing management requires admin access." },


    },

    // ── Overview tab ─────────────────────────────────────────────────────
    overview: {
      activeCampaignSingle: { hu: "Aktív mérés: {name}", en: "Active measurement: {name}" },
      activeCampaignMultiple: { hu: "{count} aktív mérés folyamatban", en: "{count} active measurements in progress" },
      selfAssessmentsDone: { hu: "önértékelés kész", en: "self-assessments done" },
      participantsAllStepsDone: { hu: "résztvevő végzett minden lépéssel", en: "participants finished all steps" },
      campaignsLink: { hu: "Mérések", en: "Measurements" },
      profileEyebrow: { hu: "szervezeti profil", en: "org profile" },
      profileTitle: { hu: "Szervezeti személyiség", en: "Org personality" },
      completionProgress: { hu: "{count} / 3 kitöltés", en: "{count} / 3 completions" },
      profileHint: { hu: "A szervezeti személyiségprofil 3 befejezett értékelés után jelenik meg.", en: "The org personality profile appears after 3 completed assessments." },
      teamsEyebrow: { hu: "csapatok", en: "teams" },
      teamsTitle: { hu: "Csapatok", en: "Teams" },
      noTeams: { hu: "Még nincs csapat. Hozz létre egyet a Csapatok fülön!", en: "No teams yet. Create one in the Teams tab!" },
      teamMemberCount: { hu: "tag", en: "member" },
      teamMembersCount: { hu: "tag", en: "members" },
    },

    // ── Members tab ──────────────────────────────────────────────────────
    members: {
      eyebrow: { hu: "tagok", en: "members" },
      title: { hu: "Tagok", en: "Members" },
      invitePending: { hu: "Meghívó függőben", en: "Invite pending" },
      pendingBadge: { hu: "Függőben", en: "Pending" },
      noMembers: { hu: "Még nincs tag.", en: "No members yet." },
      inviteEyebrow: { hu: "meghívás", en: "invite" },
      inviteTitle: { hu: "Tag hozzáadása", en: "Add a member" },
      inviteDescription: { hu: "Add meg a leendő tag e-mail-címét. Ha már regisztrált, azonnal csatlakozik. Az új felhasználók e-mailben kapnak meghívót, és regisztráció után csatlakozhatnak.", en: "Enter the email address. A registered user joins immediately; a new user gets an invite email and joins after signing up." },
      roleAdmin: { hu: "Admin", en: "Admin" },
      roleConsultant: { hu: "Tanácsadó", en: "Consultant" },
      roleManager: { hu: "Menedzser", en: "Manager" },
      roleMember: { hu: "Tag", en: "Member" },
    },

    // ── Teams tab ────────────────────────────────────────────────────────
    teams: {
      noTeams: { hu: "Még nincs csapat. Hozz létre egyet lentebb!", en: "No teams yet. Create one below!" },
      memberCount: { hu: "tag", en: "member" },
      membersCount: { hu: "tag", en: "members" },
      newEyebrow: { hu: "új csapat", en: "new team" },
      newTitle: { hu: "Új csapat létrehozása", en: "Create a new team" },
    },

    // ── Campaigns tab ────────────────────────────────────────────────────
    campaigns: {
      activeEyebrow: { hu: "aktív mérések", en: "active measurements" },
      activeTitle: { hu: "Aktív mérések", en: "Active measurements" },
      noActive: { hu: "Nincs aktív mérés. Indíts egy vázlatból, vagy hozz létre újat!", en: "No active measurements. Activate a draft or create a new one!" },
      draftsDivider: { hu: "vázlatok", en: "drafts" },
      closedDivider: { hu: "lezárt körök", en: "closed rounds" },
      newCta: { hu: "Új mérés", en: "New measurement" },
      newCtaDesc: { hu: "Szervezett 360°-os visszajelzési kör indítása a csapatban", en: "Launch a structured 360° feedback round for your team" },
      createLink: { hu: "Létrehozás", en: "Create" },
      newEyebrow: { hu: "új mérés", en: "new measurement" },
      createTitle: { hu: "Mérés létrehozása", en: "Create measurement" },
      nameLabel: { hu: "Mérés neve", en: "Measurement name" },
      namePlaceholder: { hu: "pl. 2026. I. negyedévi értékelés", en: "e.g. Q1 2026 review" },
      descLabel: { hu: "Leírás (opcionális)", en: "Description (optional)" },
      descPlaceholder: { hu: "Rövid leírás a mérésről…", en: "Brief description…" },
      creating: { hu: "Létrehozás…", en: "Creating…" },
      createButton: { hu: "Mérés létrehozása", en: "Create measurement" },
      cancel: { hu: "Mégse", en: "Cancel" },
      networkError: { hu: "Hálózati hiba. Próbáld újra.", en: "Network error. Please try again." },
    },

    // ── Campaign card ────────────────────────────────────────────────────
    card: {
      closed: { hu: "Lezárt", en: "Closed" },
      freshRound: { hu: "Újrafelvételi kör", en: "Re-measurement round" },
      complete: { hu: "teljes", en: "complete" },
      summaryLink: { hu: "Összesítő", en: "Summary" },
      draft: { hu: "Vázlat", en: "Draft" },
      participantsAdded: { hu: "résztvevő hozzáadva", en: "participant added" },
      participantsAddedPlural: { hu: "résztvevő hozzáadva", en: "participants added" },
      editLink: { hu: "Szerkesztés", en: "Edit" },
      active: { hu: "Aktív", en: "Active" },
      started: { hu: "Indítva:", en: "Started:" },
      participantSingular: { hu: "résztvevő", en: "participant" },
      participantPlural: { hu: "résztvevő", en: "participants" },
      selfDone: { hu: "Önértékelés kész", en: "Self-assessment done" },
      observerDone: { hu: "Külső visszajelzés kész", en: "Observer done" },
      fullyComplete: { hu: "Minden lépés kész", en: "Fully complete" },
      fullyDoneLabel: { hu: "teljes", en: "complete" },
      inProgress: { hu: "folyamatban", en: "in progress" },
      notStarted: { hu: "még nem kezdte el", en: "not started" },
      viewLink: { hu: "Mérés megnyitása", en: "Open measurement" },
      sending: { hu: "Küldés…", en: "Sending…" },
      remindButton: { hu: "Emlékeztető ({count})", en: "Remind ({count})" },
      remindedResult: { hu: "{count} személynek küldtünk emlékeztetőt", en: "Reminded {count} participant" },
      remindedResultPlural: { hu: "{count} személynek küldtünk emlékeztetőt", en: "Reminded {count} participants" },
      remindError: { hu: "Hiba történt", en: "Something went wrong" },
      remindNetworkError: { hu: "Hálózati hiba", en: "Network error" },
    },

    // ── Campaign list (legacy) ───────────────────────────────────────────
    list: {
      noCampaigns: { hu: "Még nincs mérés. Hozz létre egyet lentebb!", en: "No measurements yet. Create one below!" },
      participantCount: { hu: "résztvevő", en: "participant" },
      participantsCount: { hu: "résztvevő", en: "participants" },
      manageTitle: { hu: "Résztvevők kezelése", en: "Manage participants" },
      addEyebrow: { hu: "résztvevők hozzáadása", en: "add participants" },
      noMembers: { hu: "Nincsenek tagok.", en: "No members." },
      adding: { hu: "Hozzáadás…", en: "Adding…" },
      addButton: { hu: "Hozzáadás ({count})", en: "Add ({count})" },
      cancel: { hu: "Mégse", en: "Cancel" },
      newEyebrow: { hu: "új mérés", en: "new measurement" },
      newTitle: { hu: "Új mérés", en: "New measurement" },
      namePlaceholder: { hu: "Mérés neve", en: "Measurement name" },
      descPlaceholder: { hu: "Leírás (opcionális)", en: "Description (optional)" },
      creating: { hu: "Létrehozás…", en: "Creating…" },
      createButton: { hu: "Mérés létrehozása", en: "Create measurement" },
      statusActive: { hu: "Aktív", en: "Active" },
      statusClosed: { hu: "Lezárva", en: "Closed" },
      statusDraft: { hu: "Vázlat", en: "Draft" },
    },

    // ── Setup wizard ─────────────────────────────────────────────────────
    setup: {
      step1Eyebrow: { hu: "1. lépés", en: "step 1" },
      step1Title: { hu: "Szervezet neve", en: "Organization name" },
      step1Subtitle: { hu: "Erősítsd meg vagy módosítsd a szervezet nevét.", en: "Confirm or update your organization name." },
      nameLabel: { hu: "Szervezet neve", en: "Name" },
      nameSaveError: { hu: "Nem sikerült menteni a nevet.", en: "Failed to save name." },
      next: { hu: "Tovább", en: "Next" },
      step2Title: { hu: "Válassz avatart", en: "Choose an avatar" },
      showAll: { hu: "+ Összes megjelenítése ({count})", en: "+ Show all ({count})" },
      back: { hu: "Vissza", en: "Back" },
      step3Eyebrow: { hu: "2. lépés", en: "step 2" },
      step3Title: { hu: "Tagok meghívása", en: "Invite members" },
      step3Subtitle: { hu: "Az induláshoz már most is meghívhatsz tagokat. Akik még nem regisztráltak, e-mailben kapnak meghívót.", en: "Invite members to get started (optional). Unregistered emails will receive an invite." },
      finish: { hu: "Befejezés", en: "Finish setup" },
      networkError: { hu: "Hálózati hiba.", en: "Network error." },
    },

    // ── Forms ────────────────────────────────────────────────────────────
    forms: {
      // OrgCreateForm
      createOrgName: { hu: "Szervezet neve", en: "Organization name" },
      createPlaceholder: { hu: "pl. trita Kft.", en: "e.g. Acme Corp" },
      createLoading: { hu: "Létrehozás…", en: "Creating..." },
      createButton: { hu: "Létrehozás", en: "Create" },
      alreadyInOrg: { hu: "Már tagja vagy egy szervezetnek.", en: "You already belong to an organization." },
      createGenericError: { hu: "Hiba történt. Próbáld újra.", en: "Something went wrong. Please try again." },
      createNetworkError: { hu: "Hálózati hiba. Próbáld újra.", en: "Network error. Please try again." },

      // OrgInviteForm
      emailLabel: { hu: "E-mail-cím", en: "Email address" },
      emailPlaceholder: { hu: "nev@email.hu", en: "name@email.com" },
      roleLabel: { hu: "Szerepkör", en: "Role" },
      roleMember: { hu: "Tag", en: "Member" },
      roleManager: { hu: "Menedzser", en: "Manager" },
      inviteLoading: { hu: "Hozzáadás…", en: "Adding..." },
      inviteButton: { hu: "Hozzáadás", en: "Add" },
      memberAdded: { hu: "Tag hozzáadva!", en: "Member added!" },
      inviteSent: { hu: "Meghívó elküldve – amint regisztrálnak, automatikusan csatlakoznak.", en: "Invite sent – they'll join automatically once they register." },
      alreadyMember: { hu: "Az e-mail-címhez tartozó felhasználó már tag.", en: "This email is already a member." },
      alreadyInOrgInvite: { hu: "Ez a felhasználó már tagja egy szervezetnek.", en: "This user already belongs to an organization." },
      selfInvite: { hu: "Saját magadat nem hívhatod meg.", en: "You cannot invite yourself." },
      inviteGenericError: { hu: "Hiba történt. Próbáld újra.", en: "Something went wrong. Please try again." },
      inviteNetworkError: { hu: "Hálózati hiba. Próbáld újra.", en: "Network error. Please try again." },

      // Tömeges meghívás (BulkInviteForm). A pilot 200–500 kitöltője
      // egyesével felvive a program legdrágább kézi munkaóráját jelentette.
      bulkToggleOn: { hu: "Több cím egyszerre", en: "Invite several at once" },
      bulkToggleOff: { hu: "Egy cím megadása", en: "Invite a single address" },
      bulkLabel: { hu: "E-mail-címek", en: "Email addresses" },
      bulkPlaceholder: {
        hu: "Illeszd be a címeket soronként, vesszővel elválasztva vagy a levelezőből másolva.\n\nanna@ceg.hu\nKovács Béla <bela@ceg.hu>",
        en: "Paste the addresses – one per line, comma-separated, or copied from your mail client.\n\nanna@company.com\nBella Smith <bella@company.com>",
      },
      bulkHint: {
        hu: "Bármilyen elválasztó jó (sortörés, vessző, pontosvessző). Az ismétlődő címeket kiszűrjük.",
        en: "Any separator works (line break, comma, semicolon). Duplicate addresses are filtered out.",
      },
      bulkParsed: { hu: "{count} cím felismerve", en: "{count} addresses recognized" },
      bulkInvalid: { hu: "{count} nem értelmezhető: {list}", en: "{count} could not be read: {list}" },
      bulkSubmit: { hu: "{count} meghívó küldése", en: "Invite {count} addresses" },
      bulkProgress: { hu: "Küldés… {done}/{total}", en: "Sending… {done}/{total}" },
      bulkDone: { hu: "Kész – {total} cím feldolgozva.", en: "Done – {total} addresses processed." },
      // Az összegzés sorai. Csak a nem nulla tételek jelennek meg.
      bulkAdded: { hu: "{count} felhasználó azonnal csatlakozott (már volt fiókja)", en: "{count} joined immediately (they already had an account)" },
      bulkInvited: { hu: "{count} meghívót kapott e-mailben", en: "{count} received an email invite" },
      bulkNoEmail: {
        hu: "{count} meghívó létrejött, de az e-mailt nem sikerült elküldeni. Küldd el a meghívólinkeket az érintetteknek.",
        en: "{count} invites created, but the email did NOT go out – send them a link manually",
      },
      bulkAlready: { hu: "{count} már tag volt", en: "{count} were already members" },
      bulkSelf: { hu: "{count} a saját címed volt", en: "{count} was your own address" },
      bulkFailed: { hu: "{count} címnél hiba történt", en: "{count} addresses failed" },

      // OrgRenameForm
      renameLabel: { hu: "Szervezet neve", en: "Organization name" },
      save: { hu: "Mentés", en: "Save" },
      saved: { hu: "Mentve.", en: "Saved." },
      renameError: { hu: "Hiba történt.", en: "Something went wrong." },
      renameNetworkError: { hu: "Hálózati hiba.", en: "Network error." },

      // OrgMemberRoleEditor
      lastAdminError: { hu: "Nem módosítható – utolsó admin.", en: "Cannot change – last admin." },
      roleChangeError: { hu: "Hiba történt.", en: "Something went wrong." },
      roleNetworkError: { hu: "Hálózati hiba.", en: "Network error." },
      teamPermissionsHint: { hu: "A csapaton belüli jogosultságok külön állíthatók.", en: "Team permissions set per team." },
    },

    // ── Action buttons ───────────────────────────────────────────────────
    actions: {
      // OrgRemoveMemberButton
      removeButton: { hu: "Eltávolít", en: "Remove" },
      removeLastAdmin: { hu: "Nem távolítható el – utolsó admin.", en: "Cannot remove – last admin." },
      removeError: { hu: "Hiba történt.", en: "Something went wrong." },
      removeNetworkError: { hu: "Hálózati hiba.", en: "Network error." },

      // OrgDeactivateButton
      deactivateButton: { hu: "Szervezet deaktiválása", en: "Deactivate organization" },
      deactivateConfirm: { hu: "Biztosan deaktiválod a szervezetet?", en: "Are you sure you want to deactivate?" },
      deactivateYes: { hu: "Igen, deaktiválás", en: "Yes, deactivate" },
      deactivateCancel: { hu: "Mégse", en: "Cancel" },
      deactivateError: { hu: "Hiba történt.", en: "Something went wrong." },
      deactivateNetworkError: { hu: "Hálózati hiba.", en: "Network error." },

      // OrgPendingInviteCancelButton
      cancelInviteYes: { hu: "Igen", en: "Yes" },
      cancelInviteNo: { hu: "Nem", en: "No" },
      cancelInviteButton: { hu: "Törlés", en: "Cancel" },

      // RemindPendingButton
      reminderSent: { hu: "Emlékeztető elküldve", en: "Reminders sent" },
      reminderSending: { hu: "Küldés…", en: "Sending..." },
      reminderButton: { hu: "Emlékeztető küldése", en: "Send reminders" },

      // AddParticipantButton
      addParticipants: { hu: "+ Résztvevők hozzáadása", en: "+ Add participants" },
      selectEyebrow: { hu: "résztvevők kiválasztása", en: "select participants" },
      addingParticipants: { hu: "Hozzáadás…", en: "Adding…" },
      addCount: { hu: "Hozzáadás ({count})", en: "Add ({count})" },
      addCancel: { hu: "Mégse", en: "Cancel" },
    },

    // ── NextStepBanner ───────────────────────────────────────────────────
    nextStep: {
      inviteTitle: { hu: "Hívj meg legalább 3 tagot a szervezetbe", en: "Invite at least 3 members to your org" },
      inviteSub: { hu: "Minimum 3 kitöltés szükséges a szervezeti profil megjelenítéséhez.", en: "At least 3 completions are needed to display the org personality profile." },
      inviteCta: { hu: "Tagok", en: "Members" },
      campaignTitle: { hu: "Hozz létre egy mérést", en: "Create your first measurement" },
      campaignSub: { hu: "Indíts egy mérést, hogy a tagok megkezdhessék a kitöltést.", en: "Start a measurement so members can begin their assessments." },
      campaignCta: { hu: "Mérés", en: "Measurement" },
      awaitTitle: { hu: "Várakozás kitöltésekre · {completed}/3", en: "Waiting for completions · {completed}/3" },
      awaitSub: { hu: "A szervezeti profil 3 befejezett értékelés után jelenik meg.", en: "The org personality profile appears after 3 completed assessments." },
    },
  },

  // ── Org detail page: remaining hardcoded strings ────────────────────────
  orgRisk: {
    pendingTitle: { hu: "Függőben lévő meghívások", en: "Pending invites" },
    pendingDesc: { hu: "{count} meghívás még visszaigazolásra vár.", en: "{count} invites are still awaiting acceptance." },
    pendingCta: { hu: "Tagok kezelése", en: "Manage members" },
    noActiveTitle: { hu: "Nincs aktív kör", en: "No active round" },
    noActiveDesc: { hu: "A szervezeti változások követéséhez érdemes visszajelzési kört indítani.", en: "Run an active feedback round to track org-level trends." },
    noActiveCta: { hu: "Kör indítása", en: "Start round" },
    recommendedTitle: { hu: "Ajánlott következő lépés", en: "Recommended next step" },
    recommendedPendingDesc: { hu: "Tekintsd át a függőben lévő meghívásokat, hogy teljesebb képet kapj a szervezetről.", en: "Close pending invites to improve org-level signal quality." },
    recommendedPendingPrimary: { hu: "Tagok kezelése", en: "Manage members" },
    recommendedPendingSecondary: { hu: "Csapatok áttekintése", en: "Review teams" },
    recommendedCampaignDesc: { hu: "A következő szervezeti mérési ciklushoz indíts új mérést.", en: "Launch a new measurement for the next org insight cycle." },
    recommendedCampaignPrimary: { hu: "Új mérés indítása", en: "Start new measurement" },
    recommendedCampaignSecondary: { hu: "Csapatok áttekintése", en: "Review teams" },
    teamUpdated: { hu: "Csapat frissítve: {name}", en: "Team updated: {name}" },
    teamMembersMeta: { hu: "{count} tag", en: "{count} members" },
  },
  orgHero: {
    liveSnapshot: { hu: "Élő pillanatkép", en: "Live snapshot" },
    membersLabel: { hu: "Tag", en: "Members" },
    teamsLabel: { hu: "Csapat", en: "Teams" },
    activeLabel: { hu: "Aktív kör", en: "Active" },
    orgCompletion: { hu: "Szervezeti kitöltés", en: "Org completion" },
    done: { hu: "kész", en: "done" },
    remaining: { hu: "hátra", en: "remaining" },
    activeCampaignCompletion: { hu: "Az aktív mérés kitöltöttsége", en: "Active measurement completion" },
  },
  orgLayers: {
    eyebrow: { hu: "A 4+2 mérési terület állapota", en: "4+2 layer readiness" },
    layersTitle: { hu: "A szervezet részletesebb megismerése", en: "Org deepening layers" },
    statusCompleted: { hu: "Kész", en: "Completed" },
    statusInProgress: { hu: "Folyamatban", en: "In progress" },
    statusAvailable: { hu: "Elérhető", en: "Available" },
    statusLocked: { hu: "Zárolt", en: "Locked" },
  },

  // ── Admin dashboard (/dashboard AdminDashboard.tsx) ─────────────────────
  dashboard: {
    loading: { hu: "Betöltés…", en: "Loading..." },
    loadError: { hu: "Nem sikerült betölteni az adatokat.", en: "Could not load data." },
    retry: { hu: "Újrapróbálom", en: "Retry" },
    missingAssessments: { hu: "Hiányzó kitöltések", en: "Missing assessments" },
    sendReminder: { hu: "Emlékeztető küldése", en: "Send reminder" },
    feedbackNotStarted: { hu: "Visszajelzési kör nem indult", en: "Feedback round not started" },
    feedbackNotStartedDesc: { hu: "Csapatkép után indítható", en: "Available after team pattern unlock" },
    teamPatternAvailable: { hu: "Csapatkép megtekinthető", en: "Team pattern available" },
    teamPatternAvailableCount: { hu: "{count} csapatnál elérhető", en: "Available for {count} team(s)" },
    teamPatternView: { hu: "Csapatkép megnyitása", en: "Open team insight" },
    activityCompleted: { hu: "kitöltötte a személyiségtesztet", en: "completed the assessment" },
    activityJoined: { hu: "csatlakozott", en: "joined" },
    bestNextStep: { hu: "Most ez a legfontosabb", en: "Most important now" },
    reminderFallbackDesc: { hu: "Emlékeztesd a kitöltéssel még nem végzett tagokat, hogy elkészülhessen a csapatkép. Érintett csapat: {teamName}.", en: "Right now, remind missing members in {teamName} so the team insight can be completed." },
    reminderFallbackPrimary: { hu: "Tagok emlékeztetése", en: "Remind members" },
    snapshotFallbackDesc: { hu: "A csapatkép már elérhető. Nyisd meg, és beszéljétek át az eredményeket a csapattal.", en: "Team insight is available. Next step: open it and align with the team." },
    snapshotFallbackPrimary: { hu: "Csapatkép megnyitása", en: "Open team insight" },
    campaignFallbackDesc: { hu: "Már indíthatsz új visszajelzési kört.", en: "The next round can be launched now. Next step: start a new feedback round." },
    campaignFallbackPrimary: { hu: "Kör indítása", en: "Start round" },
    recommendedNextStep: { hu: "Következő lépés", en: "Next step" },
    openOrgCockpit: { hu: "Szervezeti nézet", en: "Open organization view" },
    firstTeamCreated: { hu: "Első csapat létrehozva", en: "First team created" },
    teamCreatedDetail: { hu: "{name} létrehozva", en: "{name} created" },
    teamCreateNeeded: { hu: "Csapat létrehozása szükséges", en: "Create your first team" },
    openTeam: { hu: "Csapat megnyitása", en: "Open team" },
    createTeam: { hu: "Csapat létrehozása", en: "Create team" },
    completeProfile: { hu: "Saját profil kitöltése", en: "Complete your profile" },
    profileDone: { hu: "Kész", en: "Done" },
    profileMissing: { hu: "A vezetői profil még hiányzik", en: "Leader profile is still missing" },
    viewProfile: { hu: "Megtekintés", en: "View" },
    startAssessment: { hu: "Kitöltés indítása", en: "Start assessment" },
    inviteMembers: { hu: "Tagok meghívása", en: "Invite members" },
    activeMembersCount: { hu: "Jelenleg {count} aktív tag", en: "Currently {count} active members" },
    manageMembers: { hu: "Tagok kezelése", en: "Manage members" },
    unlockTeamPattern: { hu: "Az első csapatkép elkészítése", en: "Unlock first team pattern" },
    completionCount: { hu: "{count}/3 kitöltés", en: "{count}/3 completed" },
    trackProgress: { hu: "Haladás követése", en: "Track progress" },
    updated: { hu: "Frissítve", en: "Updated" },
    openAttentionPoints: { hu: "{count} nyitott teendő", en: "{count} open task(s)" },
    inviteMembersForPattern: { hu: "Tagok meghívása a csapatképhez", en: "Invite members for team pattern" },
    openOrgReport: { hu: "Szervezeti riport megnyitása", en: "Open organization report" },
    liveSnapshot: { hu: "Élő pillanatkép", en: "Live snapshot" },
    membersLabel: { hu: "Tag", en: "Members" },
    teamsLabel: { hu: "Csapat", en: "Teams" },
    doneLabel: { hu: "Kész", en: "Done" },
    orgCompletion: { hu: "Szervezeti kitöltés", en: "Org completion" },
    teamPatternReadiness: { hu: "A csapatkép készültsége", en: "Team pattern readiness" },
    onboardingEyebrow: { hu: "bevezetés", en: "onboarding" },
    firstTeamKickoff: { hu: "Első csapat indulása", en: "First team kickoff" },
    onboardingDesc: { hu: "Az első csapat már létrejött. Ezen a listán végighaladva gyorsan eljuttok az első értelmezhető csapatképig.", en: "Your first team is already created. Follow this checklist to quickly unlock the first meaningful team pattern." },
    nextStep: { hu: "Következő lépés", en: "Next step" },
    upcomingModules: { hu: "Következő modulok (hamarosan)", en: "Upcoming modules (soon)" },
    onboardingFocus: { hu: "bevezetési fókusz", en: "onboarding focus" },
    onboardingFocusDesc: { hu: "Amíg a bevezető lépések nincsenek kész, a többi modul előnézet módban marad.", en: "Until the starter onboarding steps are done, the remaining dashboard modules stay in preview mode." },
    recommendedStep: { hu: "Következő lépés", en: "Next step" },
    secondaryStep: { hu: "Másodlagos lépés", en: "Secondary step" },
    moreActionsOrg: { hu: "További műveletek a szervezeti oldalon", en: "More actions on organization page" },
    activeMembersTitle: { hu: "Aktív tagok", en: "Active members" },
    notStartedCount: { hu: "{count} fő még nem kezdte el", en: "{count} members have not started" },
    everyoneStarted: { hu: "Mindenki elindult", en: "Everyone has started" },
    layerReadiness: { hu: "A 4+2 mérési terület állapota", en: "4+2 layer readiness" },
    layerStatusCompleted: { hu: "Kész", en: "Completed" },
    layerStatusInProgress: { hu: "Folyamatban", en: "In progress" },
    layerStatusAvailable: { hu: "Elérhető", en: "Available" },
    layerStatusLocked: { hu: "Zárolt", en: "Locked" },
    leadershipFocus: { hu: "Vezetői fókusz", en: "Leadership focus" },
    orgPersonalityProfile: { hu: "Szervezeti személyiségprofil", en: "Organization personality profile" },
    assessedMembersAvg: { hu: "{count} értékelt tag · szervezeti átlag", en: "{count} assessed members · organization average" },
    detailedView: { hu: "Részletes nézet", en: "Detailed view" },
    dominantPattern: { hu: "Domináns csapatminta", en: "Dominant team pattern" },
    structuredInnovator: { hu: "Strukturált Innovátor", en: "Structured Innovator" },
    patternDesc: { hu: "Nyitott, de keretek között működő csapat. Magas {top} és {conscientiousness}, alacsonyabb {low}.", en: "An open but structured team dynamic. Higher {top} and {conscientiousness}, with lower {low}." },
    openTeamPattern: { hu: "Csapatkép megnyitása", en: "Open team pattern" },
    watchNow: { hu: "Most érdemes figyelni", en: "Watch now" },
    highLow: { hu: "Magas {top}, alacsony {low}", en: "Higher {top}, lower {low}" },
    frictionDesc: { hu: "A szervezetet kreatív lendület jellemzi. Alacsonyabb dimenzióérték: {low} ({pct}%). Ez több súrlódással járhat a csapatok együttműködésében.", en: "The organization works with strong creative momentum, but lower {low} ({pct}%) may increase friction in cross-team situations." },
    detailedAnalysis: { hu: "Részletes elemzés", en: "Detailed analysis" },
    needsAttention: { hu: "Figyelmet igényel", en: "Needs attention" },
    noOpenActions: { hu: "Nincs azonnali teendő.", en: "No immediate actions." },
    teamMovement: { hu: "Csapatmozgás", en: "Team movement" },
    teamStatus: { hu: "Csapatok állapota", en: "Team status" },
    teamStatusDesc: { hu: "Itt láthatod, hol tartanak a csapatok a felmérésben.", en: "See where each team currently stands in the shared journey" },
    allTeams: { hu: "Minden csapat", en: "All teams" },
    teamMemberCount: { hu: "{count} tag", en: "{count} members" },
    insightAlmostReady: { hu: "A csapatkép majdnem kész. Még {count} tagot érdemes emlékeztetni a kitöltésre.", en: "Team pattern is almost ready – {count} reminder(s) are still needed to complete it." },
    insightReady: { hu: "A csapatkép elérhető: minden tag végzett a kitöltéssel.", en: "Team pattern is available – every member has completed assessment." },
    insightNeeded: { hu: "{count} kitöltés szükséges a csapatképhez.", en: "{count} completion(s) needed for team pattern." },
    patternReady: { hu: "Csapatkép kész", en: "Pattern ready" },
    patternBuilding: { hu: "Csapatkép épül", en: "Pattern building" },
    pending: { hu: "Függőben", en: "Pending" },
    open: { hu: "Megnyitás", en: "Open" },
    recentActivity: { hu: "Legutóbbi aktivitás", en: "Recent activity" },
    last2Weeks: { hu: "Elmúlt 2 hét", en: "Last 2 weeks" },
    noActivity: { hu: "Még nincs aktivitás.", en: "No activity yet." },
  },

  billing: {
    checkoutMetaTitle: { hu: "Előfizetés | trita", en: "Subscription | trita" },
    checkoutEyebrow: { hu: "előfizetés", en: "subscription" },
    checkoutTitle: { hu: "Előfizetés aktiválása", en: "Activate subscription" },
    checkoutSubtitle: {
      hu: "A fizetés biztonságos – a Stripe kezeli az adataidat.",
      en: "Payment is secure – handled by Stripe.",
    },
    returnMetaTitle: { hu: "Fizetés eredménye | trita", en: "Payment result | trita" },
    returnSuccessEyebrow: { hu: "siker", en: "success" },
    returnSuccessTitle: { hu: "Köszönjük!", en: "Thank you!" },
    returnCandidateBody: {
      hu: "A jelöltkereteket hozzáadtuk. Meghívhatod a következő jelölteket.",
      en: "Candidate credits have been added. You can now invite new candidates.",
    },
    returnCandidateCta: { hu: "Vissza a felvételhez", en: "Back to hiring" },
    returnSubBody: {
      hu: "Az előfizetés aktiválva. A csapatod most már hozzáfér az összes funkcióhoz.",
      en: "Your subscription is now active. Your team has access to all features.",
    },
    returnSubCta: { hu: "Vissza a vezérlőre", en: "Go to dashboard" },
    returnExpiredTitle: { hu: "A munkamenet lejárt", en: "Session expired" },
    returnExpiredBody: {
      hu: "Próbáld újra az előfizetés aktiválását.",
      en: "Please try activating your subscription again.",
    },
    returnExpiredCta: { hu: "Újrapróbálom", en: "Try again" },
  },
  candidate: {
    metaTitle: { hu: "Személyiségfelmérés | trita", en: "Personality Assessment | trita" },
    introEyebrow: { hu: "személyiségfelmérés", en: "personality assessment" },
    introTitlePosition: { hu: "{position} pozíció", en: "{position} position" },
    introTitleGeneric: { hu: "Személyiségfelmérés", en: "Personality Assessment" },
    introBody: {
      hu: "Ez a felmérés {count} kérdésből áll, kb. {minutes} percet vesz igénybe. Válaszolj őszintén, az első benyomásod alapján.",
      en: "This assessment contains {count} questions and takes about {minutes} minutes. Please answer honestly, based on your first impression.",
    },
    introAutoSave: {
      hu: "A válaszaidat automatikusan mentjük – ha megszakad a kitöltés, onnan folytathatod, ahol abbahagytad.",
      en: "Your answers are saved automatically – if you stop and return, you can continue where you left off.",
    },
    introNoReg: { hu: "Regisztráció nem szükséges", en: "No registration required" },
    introScale: {
      hu: "{count} kérdés, 1–5-ös skálán",
      en: "{count} questions, rated on a 1–5 scale",
    },
    introConfidential: { hu: "Bizalmas adatkezelés", en: "Confidential data handling" },
    introStartCta: { hu: "Felmérés megkezdése", en: "Start assessment" },
    // Intro — lépéskártyák (2026-08-05 vizuális frissítés)
    introStepsLabel: { hu: "Így zajlik", en: "How it works" },
    introStep1Title: { hu: "Kérdőív kitöltése", en: "Fill in the questionnaire" },
    introStep1Sub: {
      hu: "{count} állítás, 1–5-ös skálán értékelve. A kitöltés körülbelül {minutes} perc.",
      en: "{count} statements on a 1–5 scale, about {minutes} minutes.",
    },
    introStepTeamRoleTitle: { hu: "Rövid csapatszerep-kérdőív", en: "Short team-role questionnaire" },
    introStepTeamRoleSub: {
      hu: "Opcionális második lépés (~3 perc) – ki is hagyhatod.",
      en: "Optional second step (~3 min) – you can skip it.",
    },
    introStepSubmitTitle: { hu: "Beküldés", en: "Submit" },
    introStepSubmitSub: {
      hu: "A kitöltést a meghívó szervezet kapja meg.",
      en: "Your responses go to the inviting organisation.",
    },
    // Híd a felmérés és az opcionális csapatszerep-lépés között
    teamRoleBridge: {
      hu: "Köszönjük – a felmérésed megérkezett! Egy opcionális lépés maradt: egy rövid csapatszerep-kérdőív (~3 perc). Ki is hagyhatod.",
      en: "Thanks – your assessment is in! One optional step remains: a short team-role questionnaire (~3 minutes). You can skip it.",
    },
    answeredCounter: { hu: "{answered}/{total} megválaszolva", en: "{answered}/{total} answered" },
    doneTitle: { hu: "Köszönjük a kitöltést!", en: "Thank you for completing the assessment!" },
    doneBody: {
      hu: "A válaszaidat beküldtük. A szervező hamarosan értesítést kap az eredményekről.",
      en: "Your answers have been successfully submitted. The organiser will be notified of the results shortly.",
    },
    revokedTitle: { hu: "A meghívó visszavonva", en: "Invitation revoked" },
    revokedBody: {
      hu: "Ezt a meghívót visszavonták. Ha kérdésed van, vedd fel a kapcsolatot a szervezővel.",
      en: "This invitation has been revoked. Please contact the organiser if you have any questions.",
    },
    etaRemaining: { hu: "~{minutes} perc hátra", en: "~{minutes} min remaining" },
    answerHint: {
      hu: "Válaszolj úgy, ahogy általában gondolkodsz és viselkedsz.",
      en: "Answer based on how you generally think and behave.",
    },
    autoAdvance: { hu: "Automatikus továbblépés", en: "Auto-advance" },
    back: { hu: "Vissza", en: "Back" },
    next: { hu: "Tovább", en: "Next" },
    submitting: { hu: "Beküldés…", en: "Submitting..." },
    submit: { hu: "Beküldés", en: "Submit" },
    scaleHint: {
      hu: "Az 1–5-ös skálán: 1 = Egyáltalán nem értek egyet, 5 = Teljes mértékben egyetértek",
      en: "On the 1–5 scale: 1 = Strongly disagree, 5 = Strongly agree",
    },
    answerAllError: {
      hu: "Válaszolj minden kérdésre.",
      en: "Please answer all questions.",
    },
    submitError: {
      hu: "Hiba történt a beküldés során. Próbáld újra.",
      en: "An error occurred while submitting. Please try again.",
    },
    pageCompletedTitle: { hu: "Már kitöltötted!", en: "Already completed!" },
    pageCompletedBody: {
      hu: "Ezt a felmérést már korábban beküldted. Köszönjük a részvételt!",
      en: "You have already submitted this assessment. Thank you for your participation!",
    },
    pageCanceledTitle: { hu: "A meghívó visszavonva", en: "Invitation revoked" },
    pageCanceledBody: {
      hu: "Ezt a meghívót visszavonták. Ha kérdésed van, vedd fel a kapcsolatot a szervezővel.",
      en: "This invitation has been revoked. Please contact the organiser if you have any questions.",
    },
    pageExpiredTitle: { hu: "A meghívó lejárt", en: "Invitation expired" },
    pageExpiredBody: {
      hu: "Ez a meghívólink sajnos már nem érvényes. Kérj új linket a szervezőtől.",
      en: "This invitation link is no longer valid. Please request a new link from the organiser.",
    },
  },

  // ── Campaign Wizard ─────────────────────────────────────────────────────
  peerFb: {
    title: { hu: "Elismerési kör", en: "Recognition round" },
    introNamed: {
      hu: "Adj minden csapattársadnak egy rövid, előremutató visszajelzést – és ha van, egy elismerést. A visszajelzések nevesítettek: a címzett látja, kitől jöttek.",
      en: "Give each teammate a short, forward-looking piece of feedback – and, if you have one, an appreciation. Feedback is named: recipients see who it came from.",
    },
    introAnon: {
      hu: "Adj minden csapattársadnak egy rövid, előremutató visszajelzést. A javaslatok név nélkül, összesítve jutnak el a címzetthez (legalább 3 beküldőnél); az elismerések nevesítettek.",
      en: "Give each teammate a short, forward-looking piece of feedback. Suggestions reach recipients anonymously and aggregated (with at least 3 senders); appreciations are named.",
    },
    alreadyDone: { hu: "{count} csapattársnak már beküldted.", en: "Already submitted for {count} teammates." },
    appreciationLabel: { hu: "Elismerés", en: "Appreciation" },
    appreciationPlaceholder: { hu: "Pl. „Köszönöm, hogy az ügyféltalálkozó előtt átnézted a bemutatómat.”", en: "E.g. \"Thanks for reviewing my deck before the demo.\"" },
    continueLabel: { hu: "Folytasd, mert…", en: "Keep doing, because…" },
    continuePlaceholder: { hu: "Egy konkrét viselkedés, ami működik – és miért.", en: "A specific behaviour that works – and why." },
    tryLabel: { hu: "Legközelebb próbáld…", en: "Next time, try…" },
    tryPlaceholder: { hu: "Egy konkrét javaslat, amelyet legközelebb kipróbálhat.", en: "One specific, forward-looking suggestion." },
    optional: { hu: "(opcionális)", en: "(optional)" },
    toneNudge: {
      hu: "Tipp: a visszajelzés akkor hasznosul, ha konkrét helyzetről és viselkedésről szól – a „mindig/soha” és a személyre irányuló ítélet jellemzően védekezést vált ki.",
      en: "Tip: feedback lands when it is about a specific situation and behaviour – \"always/never\" and person-level judgements typically trigger defensiveness.",
    },
    submit: { hu: "Beküldés", en: "Submit" },
    fillAllHint: { hu: "Minden csapattársnál töltsd ki a két visszajelzési mezőt.", en: "Fill in both feedback fields for every teammate." },
    submitError: { hu: "A beküldés nem sikerült – próbáld újra.", en: "Submitting failed – try again." },
    doneTitle: { hu: "Kész – köszönjük!", en: "Done – thank you!" },
    doneBody: {
      hu: "A visszajelzéseidet rögzítettük. Az elismerések azonnal megjelennek a címzetteknél; a javaslatok a kör szabályai szerint jutnak el hozzájuk.",
      en: "Your feedback has been recorded. Appreciations appear immediately; suggestions reach recipients according to the round's rules.",
    },
    nonePendingTitle: { hu: "Nincs nyitott visszajelzési köröd", en: "No open feedback round" },
    nonePendingBody: {
      hu: "Most nincs olyan aktív mérésed, ahol az elismerési kör lenne az aktuális lépés.",
      en: "You have no active campaign where the peer feedback round is your current step.",
    },
    backToDashboard: { hu: "Vissza a vezérlőre", en: "Back to dashboard" },
    progressLabel: { hu: "Kész: {done}/{total}", en: "Done: {done}/{total}" },
    stepLabel: { hu: "{current}. / {total} csapattárs", en: "Teammate {current} of {total}" },
    nextPerson: { hu: "Tovább", en: "Next" },
    prevPerson: { hu: "Vissza", en: "Back" },
    nextPersonHint: {
      hu: "A továbblépéshez töltsd ki a két visszajelzési mezőt.",
      en: "Fill in both feedback fields to continue.",
    },
    personDoneBadge: { hu: "Kész", en: "Done" },
    personMissingBadge: { hu: "{count} mező hiányzik", en: "{count} fields missing" },
    jumpToMissing: { hu: "Ugrás a következő hiányzóhoz", en: "Jump to next incomplete" },
    draftSaved: { hu: "Piszkozat mentve ezen az eszközön", en: "Draft saved on this device" },
    fieldMissing: { hu: "Ez a mező még kitöltésre vár.", en: "This field still needs to be filled in." },
    missingSummary: {
      hu: "Még {count} csapattársnál hiányzik a két kötelező mező: {names}",
      en: "Both required fields are still missing for {count} teammates: {names}",
    },
  },
  campaignWiz: {
    stepDetails: { hu: "Részletek", en: "Details" },
    stepMembers: { hu: "Tagok", en: "Members" },
    stepConfirm: { hu: "Megerősítés", en: "Confirm" },
    unknownError: { hu: "Ismeretlen hiba", en: "Unknown error" },
    detailsTitle: { hu: "Mérés adatai", en: "Measurement details" },
    nameLabel: { hu: "Mérés neve", en: "Measurement name" },
    namePlaceholder: { hu: "pl. II. negyedévi 360°-os visszajelzés", en: "e.g. Q2 360° feedback" },
    descLabel: { hu: "Leírás", en: "Description" },
    optional: { hu: "(opcionális)", en: "(optional)" },
    descPlaceholder: { hu: "Rövid leírás a mérésről…", en: "Brief description..." },
    next: { hu: "Tovább", en: "Next" },
    selectParticipants: { hu: "Résztvevők kiválasztása", en: "Select participants" },
    deselectAll: { hu: "Kijelölések törlése", en: "Deselect all" },
    selectAll: { hu: "Mindenki", en: "Select all" },
    noMembers: { hu: "Nincsenek tagok a szervezetben.", en: "No members in this organization." },
    back: { hu: "Vissza", en: "Back" },
    summary: { hu: "Összefoglalás", en: "Summary" },
    campaignNameLabel: { hu: "mérés neve", en: "measurement name" },
    participantsLabel: { hu: "résztvevők · {count} fő", en: "participants · {count}" },
    noneSelected: { hu: "Nincs kiválasztva – később is hozzáadhatók.", en: "None selected – can be added later." },
    draftNote: {
      hu: "A mérés piszkozatként jön létre. Az aktiválást a mérés oldalán végezheted el.",
      en: "Campaign is created in DRAFT status. You can activate it from the campaign page.",
    },
    creating: { hu: "Létrehozás…", en: "Creating..." },
    createCampaign: { hu: "Mérés létrehozása", en: "Create measurement" },
    createAndActivate: { hu: "Létrehozás és aktiválás", en: "Create and activate" },
    activateNowLabel: { hu: "Aktiválás azonnal a létrehozás után.", en: "Activate immediately after creation." },
    activateNowHint: {
      hu: "A résztvevők azonnal értesítést kapnak, és kitölthetik az első kérdőívet. Csak akkor jelöld be, ha a névsor végleges: az aktiválás nem vonható vissza.",
      en: "Participants get their step-opening notification right away and the first questionnaire starts. Only check this if the roster is final – activation cannot be undone.",
    },
    activateNowNoParticipants: {
      hu: "Résztvevő nélkül nem aktiválható – előbb válassz résztvevőket, vagy aktiváld később a mérés oldaláról.",
      en: "Cannot activate without participants – select participants first, or activate later from the campaign page.",
    },
    activateNowMinimumParticipants: {
      hu: "A mérés legalább 3 résztvevővel indítható. Válassz még {missing} főt, vagy hozd létre most piszkozatként.",
      en: "A measurement requires at least 3 participants. Select {missing} more, or create it as a draft for now.",
    },
    activateNowNote: {
      hu: "A mérés létrejön ÉS azonnal aktiválódik: mindenki értesítést kap, az életciklus (piszkozat → aktív → lezárt) nem fordítható vissza.",
      en: "The campaign is created AND activated immediately: everyone is notified, and the lifecycle (DRAFT → ACTIVE → CLOSED) cannot be reversed.",
    },
    activateFailed: {
      hu: "A mérés létrejött (piszkozatként), de az aktiválás nem sikerült – aktiváld a mérés oldaláról.",
      en: "The campaign was created (as draft), but activation failed – activate it from the campaign page.",
    },

    // Típusválasztó (0. lépés)
    stepType: { hu: "Mérés típusa", en: "Measurement type" },
    typeTitle: { hu: "Mit szeretnél mérni?", en: "What do you want to measure?" },
    packageRecommended: { hu: "Ajánlott", en: "Recommended" },
    scanV1Meta: {
      hu: "Rögzített pilotcsomag · mások személyiségértékelése és csapattársi visszajelzési kör nélkül",
      en: "Fixed pilot set · without observer and peer rounds",
    },
    packageCustomName: { hu: "Egyedi mérési kör", en: "Custom measurement round" },
    packageCustomDesc: {
      hu: "Haladó összeállítás egycélú méréshez, második körhöz vagy kiegészítő modulhoz.",
      en: "Advanced setup for a focused measurement, second round or add-on module.",
    },
    typeSelfName: { hu: "Önértékelés", en: "Self-assessment" },
    typeSelfDesc: {
      hu: "A tagok kitöltik a 60 állításos személyiségkérdőívet, külső értékelők meghívása nélkül.",
      en: "Members complete the 60-item personality questionnaire without inviting external observers.",
    },
    typeSelfMeta: { hu: "60 állítás · ~10 perc / fő", en: "60 items · ~10 min per member" },
    typeSelfOut: {
      hu: "Eredmény: a mérési körhöz tartozó önértékelési profil és a személyiségdimenziók csapatszintű áttekintése",
      en: "Output: round-labelled self profile and team-level dimension control",
    },
    typeObserverName: { hu: "Külső visszajelzés (360°)", en: "External feedback (360°)" },
    typeObserverDesc: {
      hu: "A tagok visszajelzést kérnek a kollégáiktól, így összevethetik a saját véleményüket azzal, ahogyan mások látják őket.",
      en: "Members invite colleagues who describe them from the outside – self-image and outside image become comparable.",
    },
    typeObserverMeta: { hu: "~10 perc / visszajelző · név szerinti meghívás", en: "~10 min per observer · named invitations" },
    typeObserverOut: { hu: "Eredmény: az önkép és mások visszajelzéseinek összehasonlítása, mért kapcsolati adatok a riportban", en: "Output: self vs. outside comparison, measured relationship data in the report" },
    typeRoleName: { hu: "Csapatszerep-kör", en: "Team role round" },
    typeRoleDesc: {
      hu: "A csapat tagjai kitöltik a szerepkérdőívet – a becsült szerepek helyett mért szereptérkép készül.",
      en: "Team members fill out the role questionnaire – a measured role map replaces estimates.",
    },
    typeRoleMeta: { hu: "~4 perc / fő · egy csapatra indítható", en: "~4 min per member · launched for one team" },
    typeRoleOut: { hu: "Eredmény: mért szereplefedettség a csapatoldalon és a riportban", en: "Output: measured role coverage on the team page and in the report" },
    typeRole360Name: { hu: "Csapattársi szerep-visszajelzés", en: "Team role peer feedback" },
    typeRole360Desc: {
      hu: "A tagok kiválasztják az egymásra leginkább jellemző viselkedéseket. Az önkép így összevethető a csapattársak visszajelzéseivel.",
      en: "Members pick each other's most characteristic behaviours – a measured team view lands next to the self-image.",
    },
    typeRole360Meta: { hu: "~3-4 perc / értékelt fő · névtelen, összesített kép (min. 3 értékelő)", en: "~3-4 min per teammate · anonymous, aggregated view (min. 3 raters)" },
    typeRole360Out: { hu: "Eredmény: az önkép és a csapattársak visszajelzéseinek összevetése a csapatoldalon és a riportban", en: "Output: self-image vs. team view comparison on the team page and in the report" },
    intervalLabel: { hu: "Kérdőívek üteme", en: "Questionnaire pacing" },
    intervalHint: { hu: "Az előző kérdőív befejezése után ennyi idővel válik elérhetővé a következő. A tagok ekkor értesítést is kapnak róla. A „Küldés most” gombbal korábban is elérhetővé teheted.", en: "The next questionnaire opens (and notifies) this long after the previous one is completed – so members aren't flooded at once. You can override anytime with \u201cSend now\u201d." },
    intervalNone: { hu: "Egymás után", en: "Back-to-back" },
    interval12h: { hu: "12 óránként", en: "Every 12h" },
    interval24h: { hu: "Naponta egy (ajánlott)", en: "One per day (recommended)" },
    interval48h: { hu: "Kétnaponta", en: "Every 2 days" },
    allowExternalLabel: { hu: "Külső értékelők jóváhagyás nélkül.", en: "External observers without approval." },
    allowExternalHint: { hu: "Ha bekapcsolod, a tagok jóváhagyás nélkül hívhatnak meg szervezeten kívüli értékelőket. Ha kikapcsolod, ezeket a meghívókat a vezetőnek, a szervezeti adminisztrátornak vagy a tanácsadónak kell jóváhagynia.", en: "If enabled, members can freely invite observers from outside the organization. If disabled, external invites need manager / org admin / consultant approval." },
    typeTrustName: { hu: "Bizalmi háló kör", en: "Trust network round" },
    typeTrustDesc: {
      hu: "Rövid kérdéssor a csapattársakkal való együttműködésről. A kapcsolati térképen a becsléseket mért adatok váltják fel.",
      en: "Short pairwise questions on how collaboration actually works – measured relationship data replaces the dynamics map estimates.",
    },
    typeTrustMeta: { hu: "5 kérdés / csapattárs · ~2-3 perc / fő", en: "5 questions per teammate · ~2-3 min per member" },
    typeTrustOut: {
      hu: "Eredmény: páronként összesített, mért adatok a kapcsolati térképen; a csapatot összekötő és az erős bizalmi kapcsolat nélküli tagok jelzése",
      en: "Output: measured relationship view on the dynamics map (combined per pair), highlighting connectors and unembedded members",
    },
    typePeerFbName: { hu: "Elismerési kör", en: "Recognition round" },
    typePeerFbDesc: {
      hu: "A tagok strukturált lapon adnak egymásnak elismerést és egy előremutató javaslatot – a kör zárja a méréssorozatot, amikor már felépült a bizalom.",
      en: "Members give each other structured appreciation and one forward-looking suggestion – this round closes the series, once trust has been built.",
    },
    typePeerFbMeta: { hu: "tagonként ~1-2 perc / csapattárs · a sor végén nyílik", en: "~1-2 min per teammate · opens at the end of the sequence" },
    typePeerFbOut: {
      hu: "Eredmény: névvel küldött köszönetek és fejlesztő javaslatok. A javaslatok név nélkül, összesítve is megjeleníthetők.",
      en: "Output: named kudos + development suggestions (with anonymous-aggregated option)",
    },
    freshLabel: { hu: "Újrafelvételi kör.", en: "Re-measurement round." },
    freshHint: {
      hu: "A korábbi eredmények ebben a körben nem számítanak – minden résztvevő újra kitölti a kérdőíveket. A régi eredmények megmaradnak, a kör a későbbi összehasonlítás alapja.",
      en: "Previous results don't count in this round – every participant fills in the questionnaires again. Old results are kept; the round becomes the basis for later comparison.",
    },
    scanV1FreshLabel: {
      hu: "Az adott körben kitöltött önértékelés.",
      en: "Round-labelled self data.",
    },
    scanV1FreshHint: {
      hu: "A Scan v1 programban minden résztvevő újra kitölti az önértékelést. Így a kiinduló mérés és a későbbi mérések eredményei egyértelműen az adott körhöz és annak résztvevőihez köthetők.",
      en: "In Scan v1 every participant completes a fresh self-assessment. This keeps the baseline, follow-up and pilot cohort tied to the exact measurement round.",
    },
    peerFbAnonLabel: { hu: "Név nélkül, összesítve megjelenő javaslatok.", en: "Anonymous, aggregated suggestions." },
    peerFbAnonHint: {
      hu: "A fejlesztő javaslatok a címzettnél név nélkül, összekeverve jelennek meg, és csak legalább 3 beküldőnél. Az elismerések mindig nevesítettek.",
      en: "Development suggestions appear to the recipient without names, shuffled, and only with at least 3 senders. Appreciations are always named.",
    },
    typePsychName: { hu: "Pszichológiai biztonság felmérése", en: "Psychological safety pulse" },
    typePsychDesc: {
      hu: "Rövid, anonim csapatkérdőív arról, mennyire biztonságos hibázni, kérdezni, ellentmondani.",
      en: "Short, anonymous team survey on how safe it feels to fail, ask, and disagree.",
    },
    typePsychMeta: { hu: "8 állítás · ~2 perc / fő · névtelen", en: "8 statements · ~2 min per member · anonymous" },
    typePsychOut: {
      hu: "Eredmény: csapatszintű biztonságindex és állításonkénti kép – egyéni válaszok nélkül",
      en: "Output: team-level safety index and per-statement view – without individual answers",
    },
    typeComingSoon: { hu: "Hamarosan", en: "Coming soon" },
    typeMultiHint: {
      hu: "Több mérést is kiválaszthatsz – a tagoknak sorban nyílnak meg: amikor valaki végez az egyikkel, számára megnyílik a következő, és értesítést kap róla.",
      en: "You can select multiple measurements – they open for members one at a time: when someone finishes one, the next opens for them, with a notification.",
    },
    seriesName: { hu: "Méréssorozat", en: "Measurement series" },

    // Célzás (csapat-alapú)
    stepTargeting: { hu: "Résztvevők", en: "Participants" },
    teamsTitle: { hu: "Csapatok", en: "Teams" },
    teamMemberCount: { hu: "{count} tag", en: "{count} members" },
    noTeams: { hu: "Nincs csapat a szervezetben – válassz tagokat egyénileg.", en: "No teams in this organization – pick members individually." },
    individualTitle: { hu: "Egyéni kiválasztás", en: "Individual selection" },
    roleTeamHint: {
      hu: "A csapathoz kötött mérésekben mindig a teljes csapat vesz részt. Több csapatot is kiválaszthatsz; mindenki a saját csapatában ad értékelést.",
      en: "Team-bound measurements run for whole teams – you can pick multiple teams; everyone rates within their own team.",
    },
    targetTeamLabel: { hu: "részt vevő csapatok", en: "target team(s)" },
    typeSummaryLabel: { hu: "mérés típusa", en: "measurement type" },
    autoNameHint: { hu: "A nevet mi javasoltuk – átírhatod.", en: "We suggested the name – feel free to change it." },

    // Életciklus megerősítések
    activateConfirm: {
      hu: "Aktiválod a mérést?\n\n• A résztvevők e-mailes értesítést kapnak.\n• Aktív méréshez később is adhatsz résztvevőt.\n• A későbbi lezárás végleges – a mérés nem nyitható újra.",
      en: "Activate this campaign?\n\n• Participants will receive an email notification.\n• You can still add participants while active.\n• Closing later is final – the campaign cannot be reopened.",
    },
    closeConfirm: {
      hu: "Lezárod a mérést?\n\n• A kitöltés leáll, több visszajelzés nem érkezik.\n• A lezárás végleges – a mérés nem nyitható újra.\n• Az eddig beérkezett adatok megmaradnak és a riportban felhasználhatók.",
      en: "Close this campaign?\n\n• Filling stops; no more responses will arrive.\n• Closing is final – the campaign cannot be reopened.\n• Data collected so far is kept and usable in the report.",
    },
    closedReportCta: { hu: "Mért adat érkezett – riport frissítése", en: "Measured data arrived – update the report" },
  },

  // ── Hiring ───────────────────────────────────────────────────────────────
  hiring: {
    // page.tsx
    back: { hu: "Vissza", en: "Back" },

    // HiringDashboard — status labels
    statusExpired: { hu: "Lejárt", en: "Expired" },
    statusCompleted: { hu: "Kitöltve", en: "Completed" },
    statusCanceled: { hu: "Visszavonva", en: "Canceled" },
    statusInProgress: { hu: "Folyamatban", en: "In progress" },
    statusSent: { hu: "Elküldve", en: "Sent" },

    // HiringDashboard — candidate row
    unnamedCandidate: { hu: "Névtelen jelölt", en: "Unnamed candidate" },
    resultsLink: { hu: "Eredmények", en: "Results" },
    resendSent: { hu: "Elküldve ✓", en: "Sent ✓" },
    resendButton: { hu: "Újraküldés", en: "Resend" },

    // HiringDashboard — header
    eyebrow: { hu: "felvételi", en: "hiring" },
    // A hero címe. NEM „trita Felvétel": a felület a felhasználó saját
    // munkájáról szól, nem a termékről — a márkanév a fejlécben már ott van.
    // A „Felvétel" pedig HR-folyamatot nevez meg; a cél viszont az, hogy új
    // ember érkezik a csapatba.
    title: { hu: "Új csapattagok", en: "New teammates" },
    heroSummary: {
      hu: "Kezeld egy helyen a jelöltfolyamatot: meghívás, státusz és eredménykövetés.",
      en: "Manage the full candidate flow in one place: invites, status, and results.",
    },
    snapshotLabel: { hu: "Élő pillanatkép", en: "Live snapshot" },
    completionRate: { hu: "Befejezett kitöltések aránya", en: "Completion rate" },
    candidatesTotal: { hu: "jelölt összesen", en: "candidates total" },
    completedLabel: { hu: "kitöltve", en: "completed" },
    inProgressLabel: { hu: "folyamatban", en: "in progress" },
    cancelButton: { hu: "Mégse", en: "Cancel" },
    inviteCandidate: { hu: "Jelölt meghívása", en: "Invite candidate" },

    // HiringDashboard — credit pool
    creditEyebrow: { hu: "jelöltkreditek", en: "candidate credits" },
    creditsAvailable: { hu: "kredit elérhető", en: "credits available" },
    creditsPurchased: { hu: "vásárolt", en: "purchased" },
    creditsUsed: { hu: "felhasznált", en: "used" },

    // HiringDashboard — no-credits warning
    noCreditsWarning: {
      hu: "Nincs elérhető kredit. Kérd az admint, hogy vásároljon újabb krediteket.",
      en: "No credits available. Ask your admin to purchase more credits.",
    },

    // HiringDashboard — invite form
    inviteFormEyebrow: { hu: "új jelölt meghívása", en: "invite new candidate" },

    // HiringDashboard — stat strip
    statInProgress: { hu: "Folyamatban", en: "In progress" },
    statCompleted: { hu: "Kitöltve", en: "Completed" },
    statExpired: { hu: "Lejárt", en: "Expired" },

    // HiringDashboard — section headings
    sectionInProgress: { hu: "Folyamatban", en: "In progress" },
    sectionSent: { hu: "Elküldve", en: "Sent" },
    sectionCompleted: { hu: "Kitöltve", en: "Completed" },
    candidatesSuffix: { hu: "jelölt", en: "candidates" },
    candidateSuffix: { hu: "jelölt", en: "candidate" },

    // HiringDashboard — credit history
    creditLogEyebrow: { hu: "kreditnapló", en: "credit log" },
    creditPurchase: { hu: "Kreditvásárlás", en: "Credit purchase" },
    creditUsage: { hu: "Kreditfelhasználás", en: "Credit usage" },

    // HiringDashboard — empty state
    noCandidatesTitle: { hu: "Még nincs jelölt", en: "No candidates yet" },
    noCandidatesDesc: {
      hu: "Hívd meg az első jelöltedet, hogy elkezdhesd a felvételi folyamatot.",
      en: "Invite your first candidate to start the hiring process.",
    },

    // HiringPaywall — features
    featureEmailTitle: { hu: "Meghívó e-mailben", en: "Email invitation" },
    featureEmailDesc: {
      hu: "Küldj személyre szabott meghívót a jelölteknek egyetlen kattintással.",
      en: "Send personalised invitations to candidates with a single click.",
    },
    featureComparisonTitle: { hu: "Összehasonlítás", en: "Comparison" },
    featureComparisonDesc: {
      hu: "Hasonlítsd össze a jelöltek személyiségprofilját a csapatod mintázatával.",
      en: "Compare candidate personality profiles against your team patterns.",
    },
    featureRoleFitTitle: { hu: "Szerepilleszkedés", en: "Role fit" },
    featureRoleFitDesc: {
      hu: "Lásd, mennyire illik a jelölt a pozícióhoz a személyiségprofil alapján.",
      en: "See how well a candidate fits the role based on their personality profile.",
    },

    // HiringPaywall — general
    premiumFeature: { hu: "prémium funkció", en: "premium feature" },
    addonEyebrow: { hu: "kiegészítő modul", en: "add-on" },
    paywallDesc: {
      hu: "Használd a trita személyiségmérését a felvételi folyamatban – hívj meg jelölteket, hasonlítsd össze a profiljukat, és hozz adatalapú döntéseket.",
      en: "Use trita personality assessments in your hiring process – invite candidates, compare their profiles, and make data-driven decisions.",
    },
    addonPricing: {
      hu: "A jelöltkreditek ára a program részeként, egyedi ajánlatban szerepel.",
      en: "Candidate credit pricing is part of your individual program quote.",
    },
    noSubPricing: {
      hu: "Aktív előfizetés szükséges a Hiring modul használatához.",
      en: "An active subscription is required to use the Hiring module.",
    },

    // HiringPaywall — actions
    activateAddon: { hu: "Kreditek vásárlása", en: "Purchase credits" },
    upgradeToOrg: {
      hu: "Vagy válts Org csomagra a korlátlan jelölt-hozzáférésért:",
      en: "Or upgrade to the Org plan for unlimited candidate access:",
    },
    orgPlanDetails: { hu: "Org csomag részletek", en: "Org plan details" },
    addonAdminRequired: {
      hu: "A Hiring kreditek aktiválásához keresd a szervezeted adminisztrátorát.",
      en: "Contact your organisation admin to activate Hiring credits.",
    },
    activateSubscription: { hu: "Előfizetés aktiválása", en: "Activate subscription" },

    // Candidate result page (/hiring/[orgId]/candidates/[inviteId])
    backHiring: { hu: "Vissza · Felvétel", en: "Back · Hiring" },
    candidateResultEyebrow: { hu: "jelölt eredménye", en: "candidate result" },
    unnamedCandidateFull: { hu: "Névtelen jelölt", en: "Unnamed candidate" },
    assignedTeam: { hu: "Hozzárendelt csapat: ", en: "Assigned team: " },
    compareWithTeam: { hu: "Összehasonlítás csapattal", en: "Compare with team" },
    noAssessments: {
      hu: "Nincs befejezett értékelés a csapatban: „{name}”.",
      en: "{name} has no completed assessments.",
    },
    managerSummaryEyebrow: { hu: "vezetői összefoglaló", en: "manager summary" },
    quickOverview: { hu: "Gyors áttekintés", en: "Quick overview" },
    strengthsEyebrow: { hu: "erősségek", en: "strengths" },
    balancedProfile: {
      hu: "Kiegyensúlyozott profil, nincs kiemelkedő dimenzió",
      en: "Balanced profile, no standout dimension",
    },
    watchAreasEyebrow: { hu: "figyelendő", en: "watch areas" },
    noLowArea: { hu: "Nincs kritikusan alacsony terület", en: "No critically low area" },
    teamFitEyebrow: { hu: "hasonlóság a csapathoz", en: "team similarity" },
    teamComparisonNA: {
      hu: "A csapattal való összehasonlítás nem elérhető",
      en: "Team comparison not available",
    },
    notEnoughTeamData: {
      hu: "Nincs elég csapatadat az összehasonlításhoz – legalább {min} kitöltött önértékelés szükséges.",
      en: "Not enough team data for a comparison – at least {min} completed self-assessments are needed.",
    },
    // A címke a csapatátlaghoz mért HASONLÓSÁG, nem alkalmasság — az eltérő
    // profil kiegészítő is lehet, ezért nem kap minősítést.
    // A zaj-padló alatti hasonlóság a mérési hibán belüli EGYEZÉS — nem
    // „kiváló egyezés" (hamis precizitás lenne — a mért SEM≈7,6 mellett is).
    similarityWithinError: {
      hu: "A mérési hibán belül egyezik a csapatátlaggal",
      en: "Matches the team average within measurement error",
    },
    similarityHigh: { hu: "Nagyon hasonló a csapatátlaghoz", en: "Very similar to the team average" },
    similarityMid: { hu: "Hasonló a csapatátlaghoz", en: "Similar to the team average" },
    similarityLow: {
      hu: "Eltér a csapatátlagtól – kiegészítő profil lehet",
      en: "Differs from the team average – may be complementary",
    },
    // Az átlagos eltérés-szám marad, a ±-jel nem (2026-08-11 termékdöntés).
    avgDeviation: { hu: "Átlagos eltérés: {points} pont", en: "Average deviation: {points} points" },
    largestGap: { hu: "Legnagyobb: {label} ({gap})", en: "Largest: {label} ({gap})" },
    tritanProfileEyebrow: { hu: "személyiségprofil", en: "personality profile" },
    personalityProfile: { hu: "Személyiségprofil", en: "Personality profile" },
    teamAvgTooltip: { hu: "Csapatátlag", en: "Team avg" },
    candidateInTeam: { hu: "Jelölt a csapatban", en: "Candidate in the team" },
    deviationsFromTeam: { hu: "Eltérések a csapatátlagtól", en: "Deviations from team average" },
    deviationExplanation: {
      hu: "A pozitív eltérés azt jelenti, hogy a jelölt pontszáma a csapatátlag fölött van, a negatív, hogy alatta. Az eltérés önmagában nem minősítés: a csapatátlagtól eltérő profil kiegészítő szerepet is betölthet.",
      en: "A positive deviation means the candidate scores above the team average, a negative one below it. Deviation by itself is not a judgement: a profile that differs from the team average can also play a complementary role.",
    },
    behavioralPatternsEyebrow: { hu: "működési minták", en: "behavioral patterns" },
    characteristicDynamics: { hu: "Jellemző működési dinamikák", en: "Characteristic dynamics" },
    strengthBadge: { hu: "Erősség", en: "Strength" },
    watchAreaBadge: { hu: "Figyelendő", en: "Watch area" },
    // Mért csapatszerep-blokk (forrás-jelöléssel)
    teamRolesEyebrow: { hu: "csapatszerepek", en: "team roles" },
    teamRolesTitle: { hu: "Csapatszerepkérdőív eredménye", en: "Team-role questionnaire result" },
    measuredBadge: { hu: "Mért", en: "Measured" },

    subscriptionAdminRequired: {
      hu: "Az előfizetés aktiválásához keresd a szervezeted adminisztrátorát.",
      en: "Contact your organisation admin to activate a subscription.",
    },

    // RequestCreditsButton
    requestSent: { hu: "✓ Kérés elküldve", en: "✓ Request sent" },
    requestCredits: { hu: "Kredit igénylése az admintól", en: "Request credits from admin" },
  },

  // ── Manager components (/components/manager/) ─────────────────────────
  manager: {
    // TeamCreateForm
    teamCreate: {
      teamName: { hu: "Csapat neve", en: "Team name" },
      placeholder: { hu: "pl. Marketing csapat", en: "e.g. Marketing team" },
      error: { hu: "Hiba. Próbáld újra.", en: "Something went wrong. Please try again." },
      creating: { hu: "Létrehozás…", en: "Creating…" },
      create: { hu: "Létrehozás", en: "Create team" },
    },

    // TeamInviteForm
    teamInvite: {
      alreadyMember: { hu: "Ez a személy már tagja a csapatnak (vagy meghívó küldve).", en: "This person is already a member or has a pending invite." },
      error: { hu: "Hiba. Próbáld újra.", en: "Something went wrong." },
      emailLabel: { hu: "E-mail-cím", en: "Email address" },
      emailPlaceholder: { hu: "nev@email.hu", en: "name@email.com" },
      adding: { hu: "Hozzáadás…", en: "Adding…" },
      add: { hu: "Hozzáadás", en: "Add member" },
      memberAdded: { hu: "A tagot hozzáadtuk.", en: "Member added successfully." },
      inviteSent: { hu: "Meghívó elküldve. Automatikusan csatlakozik, ha regisztrál.", en: "Invite sent. They'll join automatically once they register." },
    },

    // TeamInsights
    teamInsights: {
      avgByDimension: { hu: "Csapatátlag dimenziónként", en: "Team average by dimension" },
      // A korábbi „±: szórás…" jelmagyarázat a kivezetett ±-számot magyarázta;
      // az új sor azt mondja el, amit a blokk ténylegesen mutat.
      stdDevHint: { hu: "Csapatátlagok – egyéni értékek nem jelennek meg.", en: "Team averages – individual values are not shown." },
      teamDynamics: { hu: "Csapatdinamika", en: "Team dynamics" },
      teamStrength: { hu: "Csapat erőssége", en: "Team strength" },
      growthArea: { hu: "Fejlesztési terület", en: "Growth area" },
      mostDiverse: { hu: "Legnagyobb sokszínűség", en: "Most diverse" },
      diversityDesc: { hu: "A csapattagok eltérően közelítik meg ezt a területet. A különböző nézőpontok tartalmas vitákat és új ötleteket indíthatnak el.", en: "Team members bring diverse approaches and perspectives to this area – this represents rich discussion and creative potential." },
      analysisBasis: { hu: "Az elemzés {scored} kitöltött teszten alapul ({remaining} tag még nem töltötte ki).", en: "Analysis based on {scored} completed assessments ({remaining} members haven't completed yet)." },
    },

    // TeamHeatmap
    teamHeatmap: {
      member: { hu: "Csapattag", en: "Member" },
      notCompleted: { hu: "Nincs kitöltve", en: "Not completed" },
      scoreHigh: { hu: "Magas", en: "High" },
      scoreMid: { hu: "Közép", en: "Mid" },
      scoreLow: { hu: "Alacsony", en: "Low" },
      legendRange: { hu: "Alacsony → Magas pontszám", en: "Low → High score" },
      legendNoAssessment: { hu: "Nincs kitöltött teszt", en: "No assessment yet" },
      dimensionGuide: { hu: "Dimenziók magyarázata", en: "Dimension guide" },
    },

    // CandidateInviteForm
    candidateInvite: {
      emailLabel: { hu: "E-mail-cím (opcionális)", en: "Email address (optional)" },
      emailPlaceholder: { hu: "nev@email.hu", en: "name@email.com" },
      nameLabel: { hu: "Jelölt neve", en: "Candidate name" },
      namePlaceholder: { hu: "Kovács Anna", en: "Jane Smith" },
      nameRequired: { hu: "A jelölt neve kötelező.", en: "Candidate name is required." },
      positionLabel: { hu: "Pozíció (opcionális)", en: "Position (optional)" },
      positionPlaceholder: { hu: "pl. frontendfejlesztő, technológiai vezető, értékesítési vezető", en: "e.g. Frontend dev, CTO, Sales manager" },
      teamLabel: { hu: "Csapat (opcionális)", en: "Team (optional)" },
      noTeam: { hu: "– Nincs csapat –", en: "– No team –" },
      emailLang: { hu: "Az e-mail nyelve", en: "Email language" },
      createError: { hu: "Hiba történt a meghívó létrehozása során.", en: "An error occurred while creating the invite." },
      genericError: { hu: "Hiba történt. Próbáld újra.", en: "An error occurred. Please try again." },
      creating: { hu: "Létrehozás…", en: "Creating…" },
      createInvite: { hu: "Meghívó létrehozása", en: "Create invite" },
      inviteCreated: { hu: "Meghívó létrehozva!", en: "Invite created!" },
      copyInstruction: { hu: "Másold ki az alábbi linket és küldd el a jelöltnek:", en: "Copy the link below and send it to the candidate:" },
      copied: { hu: "Másolva!", en: "Copied!" },
      copy: { hu: "Másolás", en: "Copy" },
    },

    // CandidateTeamPicker
    candidateTeamPicker: {
      noTeam: { hu: "– Nincs csapat –", en: "– No team –" },
      saving: { hu: "Mentés…", en: "Saving…" },
      save: { hu: "Mentés", en: "Save" },
      saved: { hu: "Mentve!", en: "Saved!" },
      error: { hu: "Hiba történt. Próbáld újra.", en: "Something went wrong. Please try again." },
    },

    // CandidateRevokeButton
    candidateRevoke: {
      revoke: { hu: "Visszavon", en: "Revoke" },
      revokeTitle: { hu: "Meghívó visszavonása", en: "Revoke invite" },
      revokeDescription: { hu: "A meghívólink érvénytelenné válik, a jelölt nem tudja majd kitölteni a felmérést. Ez a művelet nem vonható vissza.", en: "The invite link will become invalid and the candidate will no longer be able to complete the assessment. This cannot be undone." },
      cancel: { hu: "Mégse", en: "Cancel" },
      revoking: { hu: "Visszavonás…", en: "Revoking…" },
    },

    // TeamMemberRemoveButton
    teamMemberRemove: {
      remove: { hu: "Eltávolítás", en: "Remove" },
      confirmYes: { hu: "Igen", en: "Yes" },
      confirmNo: { hu: "Nem", en: "No" },
    },

    // PendingInviteResendButton
    pendingInviteResend: {
      sent: { hu: "Elküldve ✓", en: "Sent ✓" },
      errorRetry: { hu: "Hiba – újra?", en: "Error – retry?" },
      sending: { hu: "Küldés…", en: "Sending…" },
      resend: { hu: "Újraküld", en: "Resend" },
    },

    // PendingInviteCancelButton
    pendingInviteCancel: {
      cancelInvite: { hu: "Törlés", en: "Cancel" },
      confirmYes: { hu: "Igen", en: "Yes" },
      confirmNo: { hu: "Nem", en: "No" },
    },
  },

  // ── Team components (src/components/team/) ──────────────────────────────
  teamComp: {
    // TeamPageShell — tabs
    tabOverview: { hu: "Áttekintés", en: "Overview" },
    tabIntelligence: { hu: "Csapatintelligencia", en: "Team Intelligence" },
    tabIntelligenceShort: { hu: "Intelligencia", en: "Intelligence" },
    tabProfile: { hu: "Személyiségprofil", en: "Personality" },
    tabMembers: { hu: "Tagok", en: "Members" },

    // TeamOverviewTab — campaign banner
    activeBadge: { hu: "Aktív", en: "Active" },
    selfAssessmentLabel: { hu: "önértékelés", en: "self-assessment" },
    observerLabel: { hu: "mások visszajelzései", en: "observer" },
    daysLabel: { hu: "nap", en: "days" },
    viewCampaign: { hu: "Mérés megnyitása", en: "Open measurement" },

    // TeamOverviewTab — empty state
    noDataEyebrow: { hu: "nincs adat", en: "no data yet" },
    noAssessmentsTitle: { hu: "Még nincs kitöltött értékelés", en: "No completed assessments yet" },
    noAssessmentsDesc: {
      hu: "Indíts egy mérést, hogy a csapattagok megkezdhessék az értékeléseket.",
      en: "Start a 360° campaign so team members can begin their assessments.",
    },
    startCampaign: { hu: "Mérés indítása", en: "Start a measurement" },

    // TeamOverviewTab — personality profile card
    teamAvgSelfEyebrow: { hu: "csapatátlag · önkép", en: "team avg · self" },
    tritanProfile: { hu: "Személyiségprofil", en: "Personality profile" },
    membersSelf: { hu: "fő · önértékelés", en: "members · self" },
    noAssessmentsProfile: {
      hu: "Még nincs kitöltött felmérés. A profilok megjelenítéséhez legalább 1 tag töltse ki.",
      en: "No completed assessments yet. At least one member needs to complete one to show the profiles.",
    },

    // TeamOverviewTab — dynamics card
    teamDynamicsEyebrow: { hu: "csapatdinamika", en: "team dynamics" },
    keyCharacteristics: { hu: "Fő jellemzők", en: "Key characteristics" },
    notEnoughData: { hu: "Nincs elég adat az elemzéshez.", en: "Not enough data for analysis." },
    teamStrengthEyebrow: { hu: "csapat erőssége", en: "team strength" },
    growthAreaEyebrow: { hu: "fejlesztési terület", en: "growth area" },
    mostDiverseEyebrow: { hu: "legnagyobb sokszínűség", en: "most diverse" },
    diversePerspectives: {
      hu: "A csapattagok eltérő megközelítéseket és perspektívákat hoznak erre a területre.",
      en: "Team members bring diverse perspectives to this area.",
    },

    // TeamOverviewTab — members mini list
    membersEyebrow: { hu: "tagok", en: "members" },
    teamMembersTitle: { hu: "Csapattagok", en: "Members" },
    noMembersYet: { hu: "Még nincsenek tagok.", en: "No members yet." },
    doneBadge: { hu: "✓ Kész", en: "✓ Done" },
    pendingBadge: { hu: "◌ Függőben", en: "◌ Pending" },

    // TeamPatternCard
    teamPatternEyebrow: { hu: "csapatminta", en: "team pattern" },
    dominantPattern: { hu: "Domináns működési mintázat", en: "Dominant operating pattern" },
    patternRequiresData: {
      hu: "A mintázat kiszámításához legalább 3 kitöltött értékelés szükséges. Jelenleg: {total} tagból {completed} töltötte ki.",
      en: "Pattern calculation requires at least 3 completed assessments.",
    },
    sampleLabel: { hu: "Minta", en: "Sample" },
    stabilityLabel: { hu: "Stabilitás", en: "Stability" },
    patternClarityLabel: { hu: "A mintázat egyértelműsége", en: "Pattern clarity" },
    confidenceLabel: { hu: "pontosság", en: "confidence" },
    strengthsEyebrow: { hu: "erősségek", en: "strengths" },
    blindSpotsEyebrow: { hu: "vakfoltok", en: "blind spots" },
    nextStepsEyebrow: { hu: "ajánlott következő lépések", en: "recommended next steps" },
    thisWeek: { hu: "Ezen a héten", en: "This week" },
    thisMonth: { hu: "Ebben a hónapban", en: "This month" },
    ongoing: { hu: "Rendszeresen", en: "Ongoing" },
    explorePattern: { hu: "Megnézem a csapatmintát", en: "Explore team pattern" },
    alternativePattern: { hu: "Közeli alternatív mintázat:", en: "Closest alternative pattern:" },
    memberAssessments: { hu: "tag értékelése alapján", en: "member assessments" },
    missingData: { hu: "hiányzó adat", en: "missing" },
    framingNote: {
      hu: "A mintázat a csapat jelenlegi önértékelési eredményeinek megértését segíti. Nem validált tipológia, diagnózis vagy teljesítményértékelés. A bizalmi háló és a pszichológiai biztonság közvetlen mérése külön adatokkal egészíti ki ezt a képet.",
      en: "Interpretive language for the team's current self-assessment-based axes – not a validated typology, diagnosis, or performance label. The directly measured trust network and psychological safety are separate evidence.",
    },

    // TeamRoleSection
    estimatedRolesEyebrow: { hu: "csapatszerepek", en: "team roles" },
    peerEyebrow: { hu: "önkép és csapatkép", en: "self-image vs. team view" },
    peerTitle: { hu: "Így látja a csapat", en: "How the team sees it" },
    peerDesc: {
      hu: "A csapattársi visszajelzési kör összesített képe tagonként – az önkitöltés mellé mért csapatkép kerül. A pötty a csapatkép azon szerepét jelöli, amely az önképben nem szerepel.",
      en: "The aggregated view from the peer feedback round, per member – a measured team view next to the self-report. The dot marks roles in the team view that don't appear in the self-image.",
    },
    // Az anonimitás-padló ({min} = MIN_RATERS_FOR_ANONYMOUS_AGGREGATE) a
    // hívóból interpolálódik — literál számot ide ne égess be.
    peerCoverage: { hu: "{above} / {total} tagnál áll össze a csapatkép (legalább {min} értékelő)", en: "team view available for {above} / {total} members (at least {min} raters)" },
    peerRaterCount: { hu: "{n} értékelő", en: "{n} raters" },
    peerBelowThreshold: {
      hu: "Még kevesebb mint {min} csapattárs adott visszajelzést. A névtelenség védelmében az összesített kép csak a szükséges válaszszám elérésekor jelenik meg.",
      en: "Fewer than {min} teammates have responded so far – to protect anonymity, the aggregated view only appears above the threshold.",
    },
    peerSelfLabel: { hu: "Önkép (saját kitöltés)", en: "Self-image (own answers)" },
    peerTeamLabel: { hu: "Csapatkép (társak szerint)", en: "Team view (per teammates)" },
    peerNoSelf: { hu: "Nincs saját kitöltés – az összevetéshez töltsd ki a szerepkérdőívet.", en: "No self-report yet – fill in the role questionnaire to compare." },
    peerDiff: { hu: "Az önképben nem szerepel", en: "Not in the self-image" },
    peerFootnote: {
      hu: "A csapatkép névtelen: senki egyéni jelölése nem visszakereshető, és {min} értékelő alatt nem jelenik meg.",
      en: "The team view is anonymous: no individual's answers can be traced, and nothing is shown below {min} raters.",
    },
    teamRoleTitle: { hu: "Csapatszerep-elemzés", en: "Team role analysis" },
    teamRoleDesc: {
      hu: "A csapattagok szerepprofiljai. A kitöltött csapatszerep-kérdőív mért adat; ahol még nincs kitöltés, a személyiségprofilból becslünk – a forrást minden tagnál külön jelöljük.",
      en: "Per-member team-role profiles. A completed team-role questionnaire is measured data; where it is missing, we estimate from the personality profile – the source is badged for every member.",
    },
    profileStatus: { hu: "A személyiségprofil állapota", en: "Personality profile status" },
    profileStatusDesc: {
      hu: "{done} / {total} tagnak van személyiségprofilja – a csapatszerep-becslések erre épülnek",
      en: "{done} / {total} members have personality data – team-role estimates are derived from this",
    },
    roleDistributionEyebrow: { hu: "szerepek megoszlása", en: "role distribution" },
    roleCompositionTitle: { hu: "Csapatszerepek megoszlása", en: "Team role composition" },
    noRoleData: { hu: "Nincs elég adat a csapatszerep-eloszláshoz.", en: "Not enough data for role distribution." },
    balanceAlertsEyebrow: { hu: "a szerepek egyensúlya", en: "balance alerts" },
    wellDiversified: {
      hu: "A csapatban minden fő szerepkör képviselt.",
      en: "The team is well-diversified – all key roles are represented.",
    },
    missingRoles: { hu: "Hiányzó szerepkörök", en: "Missing roles" },
    overrepresentedRoles: { hu: "Túlreprezentált szerepkörök", en: "Overrepresented roles" },
    categoryAnalysisEyebrow: { hu: "szerepkategóriák elemzése", en: "category analysis" },
    categoryAnalysisDesc: {
      hu: "Így oszlanak meg a csapattagok a három fő szerepkategória között.",
      en: "How team members distribute across the three core role categories.",
    },
    actionOriented: { hu: "Cselekvő", en: "Action-oriented" },
    peopleOriented: { hu: "Kapcsolati", en: "People-oriented" },
    thoughtOriented: { hu: "Gondolkodó", en: "Thought-oriented" },
    individualRolesEyebrow: { hu: "egyéni szerepkörök", en: "individual roles" },
    memberRoleProfiles: { hu: "A tagok szerepprofilja", en: "Member role profiles" },
    thMember: { hu: "Tag", en: "Member" },
    thPrimary: { hu: "Elsődleges", en: "Primary" },
    thSecondary: { hu: "Másodlagos", en: "Secondary" },
    thSupporting: { hu: "Kiegészítő", en: "Supporting" },
    noData: { hu: "Nincs adat", en: "No data" },
    // Forrás-jelölés (S1) — mért kitöltés vs profil-alapú becslés. A vizuális
    // konvenció a TeamIntelligence-ével azonos: sage = mért, amber = becsült.
    sourceMeasuredBadge: { hu: "kitöltött", en: "measured" },
    sourceEstimateBadge: { hu: "becslés", en: "estimate" },
    roleSourceMixLine: {
      hu: "{measured} valódi kitöltés · {estimated} profilalapú becslés",
      en: "{measured} real fill-outs · {estimated} profile-based estimates",
    },
    sourceMixMeasured: { hu: "{n} mért kitöltésből", en: "{n} from measured fill-outs" },
    sourceMixEstimated: { hu: "{n} profilalapú becslésből", en: "{n} from profile-based estimates" },

    // TeamMembersTab
    membersTabEyebrow: { hu: "tagok", en: "members" },
    membersTabTitle: { hu: "Tagok", en: "Members" },
    doneTest: { hu: "Kitöltve", en: "Completed" },
    noTest: { hu: "Nincs teszt", en: "No test" },
    inviteSent: { hu: "Meghívó elküldve", en: "Invite sent" },
    pendingStatus: { hu: "Függőben", en: "Pending" },
    noMembersInvite: {
      hu: "Még nincs csapattag. Hívj meg valakit lentebb!",
      en: "No team members yet. Invite someone below!",
    },
    addMember: { hu: "Tag hozzáadása", en: "Add a member" },
    addMemberDesc: {
      hu: "Add meg a csapattag e-mail-címét. A felhasználónak regisztrálva kell lennie.",
      en: "Enter the member's email. They must already be registered on trita.",
    },

    // TeamMemberRoleEditor
    roleManagerLabel: { hu: "Menedzser", en: "Manager" },
    roleMemberLabel: { hu: "Tag", en: "Member" },
    cannotChangeSelf: { hu: "A saját szerepkörödet nem módosíthatod.", en: "Cannot change own role." },
    somethingWentWrong: { hu: "Hiba történt.", en: "Something went wrong." },
    networkError: { hu: "Hálózati hiba.", en: "Network error." },

    // TeamProfileTab
    personalityProfileEyebrow: { hu: "személyiségprofil", en: "personality profile" },
    teamHeatmapTitle: { hu: "A csapat személyiségprofilja", en: "Team Personality Heatmap" },
    heatmapDesc: {
      hu: "Minden oszlop egy személyiségdimenziót mutat – minél mélyebb a szín, annál magasabb a pontszám.",
      en: "Each column represents a personality dimension – deeper color means a higher score.",
    },
    analysisEyebrow: { hu: "elemzés", en: "analysis" },
    teamAnalysis: { hu: "Csapatelemzés", en: "Team Analysis" },
    noMembersProfile: {
      hu: "Még nincs csapattag. Hívj meg valakit a Tagok fülön!",
      en: "No team members yet. Invite someone on the Members tab!",
    },
    noAssessmentProfile: {
      hu: "Még egyik csapattag sem töltötte ki a felmérést.",
      en: "No team members have completed an assessment yet.",
    },

    // DynamicsMap
    noDynamicsTitle: { hu: "Még nincs kapcsolati adat", en: "No dynamics data yet" },
    noDynamicsDesc: {
      hu: "Indíts szakmai visszajelzési kört a kapcsolati térkép feltöltéséhez",
      en: "Run a peer feedback round to populate the dynamics map",
    },
    dynamicsHiddenHint: {
      hu: "A kapcsolati nézet akkor jelenik meg, ha már érkezett másoktól visszajelzés a csapattagok kapcsolatairól.",
      en: "The dynamics view is available only when observer or peer relationship data exists.",
    },
    connectionsEyebrow: { hu: "kapcsolatok", en: "connections" },
    edgeGood: { hu: "jó együttműködés", en: "good collab." },
    edgeTension: { hu: "feszültség", en: "tension" },
    edgeNeutral: { hu: "semleges", en: "neutral" },
    edgeAligned: { hu: "hasonló profil", en: "aligned" },
    // MÉRT (trust) aligned élre: az erős bizalom nem profil-hasonlóság —
    // ott a semleges címke jár, nem az edgeAligned.
    edgeAlignedNeutral: { hu: "összehangolt", en: "aligned" },
    edgeFriction: { hu: "lehetséges súrlódás", en: "potential friction" },
    edgeComplementary: { hu: "kiegészítő", en: "complementary" },
    incomingConnections: { hu: "kapcsolat ebben a hálóban", en: "connections in this network" },
    legendGood: { hu: "Jó együttműködés", en: "Good collab." },
    legendNeutral: { hu: "Semleges", en: "Neutral" },
    legendTension: { hu: "Feszültség", en: "Tension" },
    legendAligned: { hu: "Hasonló profil", en: "Similar profile" },
    // Ha a térképen mért (trust) él is van, az aligned szín jelentése vegyes
    // (erős bizalom VAGY hasonló profil) — a jelmagyarázat ilyenkor semleges.
    legendAlignedNeutral: { hu: "Összehangolt", en: "Aligned" },
    legendComplementary: { hu: "Kiegészítő", en: "Complementary" },
    legendFriction: { hu: "Potenciális súrlódás", en: "Potential friction" },
    hubPerson: { hu: "Összekötő csapattag", en: "Hub person" },
    clickPerson: { hu: "Kattints egy személyre", en: "Click on a person" },
    clickPersonConnections: { hu: "a kapcsolatai megtekintéséhez", en: "to view their connections" },
    edgeOneSided: { hu: "egyoldalú visszajelzés", en: "one-sided feedback" },
    // Dimenzió-bontás elrejtve, ha a páros valamelyik tagjának nincs valódi
    // profil-adata — kitalált (50-es default) értékek ellen nem számolunk gap-et.
    breakdownNoProfile: {
      hu: "Nincs profiladat a bontáshoz – a páros legalább egyik tagja még nem töltötte ki a személyiségfelmérést.",
      en: "No profile data for this breakdown – at least one member of the pair hasn't completed the personality assessment yet.",
    },

    // Dinamika-forrás állapotcímkék (mért/becsült él-arány szerint)
    dynamicsStateMeasured: { hu: "mért", en: "measured" },
    dynamicsStateMixed: { hu: "vegyes", en: "mixed" },
    dynamicsStateEstimated: { hu: "profilból becsült", en: "profile estimate" },
    dynamicsStateNone: { hu: "nincs adat", en: "no data" },

    // Térkép-minőség címkék (kitöltöttség szerint)
    mapStateSufficient: { hu: "elegendő adat", en: "sufficient data" },
    mapStatePartial: { hu: "részleges adat", en: "partial data" },
    mapStateNone: { hu: "nincs adat", en: "no data" },

    // „Csapat nyomás alatt" pólus-címkék
    polePolarized: { hu: "két ellentétes pólus", en: "two opposite poles" },
    poleHigh: { hu: "magas pólus", en: "high pole" },
    poleLow: { hu: "alacsony pólus", en: "low pole" },

    // RoleFitMap
    dominantDimsEyebrow: { hu: "domináns dimenziók", en: "dominant dimensions" },
    noRoleFitDataTitle: { hu: "Még nincs elegendő adat", en: "Not enough data yet" },
    noRoleFitDataDesc: {
      hu: "A szerepilleszkedéshez legalább egy kitöltött felmérés szükséges.",
      en: "Role fit requires at least one completed assessment.",
    },
    roleFitScore: { hu: "Illeszkedési pontszám", en: "Fit score" },
    roleFitConfidence: { hu: "Megbízhatóság", en: "Confidence" },
    roleFitConfidenceHigh: { hu: "magas", en: "high" },
    roleFitConfidenceMedium: { hu: "közepes", en: "medium" },
    roleFitConfidenceLow: { hu: "alacsony", en: "low" },
    missingRoleLabel: { hu: "Hiányzó szerep:", en: "Missing role:" },
    missingRoleTag: { hu: "⚠ hiányzik", en: "⚠ missing" },
    clickPersonRole: { hu: "Kattints egy személyre", en: "Click on a person" },
    clickPersonRoleDesc: { hu: "a szerepe megtekintéséhez", en: "to view their role" },

    // RoleFitMap — zone labels
    zoneMediatorLabel: { hu: "Mediátor", en: "Mediator" },
    zoneInnovatorLabel: { hu: "Innovátor", en: "Innovator" },
    zoneExecutorLabel: { hu: "Kivitelező", en: "Executor" },
    zoneAnalyzerLabel: { hu: "Elemző", en: "Analyzer" },
    zoneEnergizerLabel: { hu: "Energizáló", en: "Energizer" },
    zoneStrategistLabel: { hu: "Stratéga", en: "Strategist" },

    // TeamIntelligence — sub-tab labels
    subMap: { hu: "① Csapattérkép", en: "① Team Map" },
    subDynamics: { hu: "② Dinamika", en: "② Dynamics Map" },
    subRoles: { hu: "③ Szerepilleszkedés", en: "③ Role Fit" },
    evidenceEyebrow: { hu: "adatminőség", en: "data quality" },
    evidenceSource: { hu: "Forrás", en: "Source" },
    evidenceQuality: { hu: "Minőség", en: "Quality" },
    evidenceConfidence: { hu: "Megbízhatóság", en: "Confidence" },
    evidenceSourceSelf: { hu: "Önértékelés", en: "Self assessment" },
    // A dinamika-nézet mért éle a BIZALMI KÖRBŐL jön, nem az observer-
    // körből (friction-model isMeasuredDynamicsSource). A korábbi
    // „Önértékelés + külső visszajelzés" címke olyan forrást állított, ami
    // nem járult hozzá — ld. team-intelligence.ts.
    evidenceSourceSelfTrust: { hu: "Önértékelés + bizalmi kör", en: "Self + trust round" },
    evidenceSourceInferred: { hu: "Becsült modell", en: "Inferred model" },
    // ── Visszajelzési kultúra (csapat observer-blokk) ─────────────────────
    // A hangnem tudatos: az eltérés nem hiba, hanem a visszajelzés
    // áramlásáról szóló jel. Semmilyen szöveg nem minősítheti a csapatot.
    feedbackCultureEyebrow: { hu: "Visszajelzési kultúra", en: "Feedback culture" },
    feedbackCultureTitle: {
      hu: "Mennyire egyezik az önkép azzal, ahogy mások látnak",
      en: "How closely self-image matches how others see you",
    },
    feedbackCultureLead: {
      hu: "A szervezet {total} tagja közül {covered} kapott elegendő visszajelzést másoktól. Az alábbi bontás csak rájuk vonatkozik.",
      en: "{covered} of {total} members have a measured external view – the breakdown below covers only them.",
    },
    feedbackCultureAligned: { hu: "egybevágó önkép", en: "matching self-image" },
    feedbackCultureAlignedHint: {
      hu: "Az önértékelés a mérési hibán belül egyezik a kollégák képével.",
      en: "Self-assessment matches colleagues' view within measurement error.",
    },
    feedbackCultureGap: { hu: "érdemi eltérés", en: "meaningful difference" },
    feedbackCultureGapHint: {
      hu: "Legalább egy dimenzión a mérési hibát meghaladó a különbség. Ez nem hiba – jelzés, hogy ott érdemes beszélgetni.",
      en: "On at least one dimension the difference exceeds measurement error. Not a fault – a cue that a conversation is worth having.",
    },
    feedbackCultureNote: {
      hu: "Forrás: a szervezet kampányaiban másoktól gyűjtött visszajelzések (a személyes, kampányon kívüli visszajelzések nem szerepelnek benne). Tagonként legalább 3 értékelő kell hozzá, és csak összesített darabszám látszik – sem név, sem egyéni érték, sem dimenziónkénti bontás.",
      en: "Source: external feedback collected in this organisation's campaigns (personal, non-campaign feedback is excluded). At least 3 raters per member are required, and only aggregate counts are shown – no names, individual values, or dimension breakdown.",
    },
    evidenceQualityNone: { hu: "nincs", en: "none" },
    evidenceQualityPartial: { hu: "részleges", en: "partial" },
    evidenceQualitySufficient: { hu: "elegendő", en: "sufficient" },
    evidenceConfidenceLow: { hu: "alacsony", en: "low" },
    evidenceConfidenceMedium: { hu: "közepes", en: "medium" },
    evidenceConfidenceHigh: { hu: "magas", en: "high" },

    // Szerep-hiány prioritás indoklása — forrás-tudatos változatok
    // (hitelességi alapelv: mért szerepképre nem írhatjuk, hogy „becsült").
    roleGapReasonMeasured: {
      hu: "A mért szerepképben nem látszik: {roles}.",
      en: "The measured role map is missing: {roles}.",
    },
    roleGapReasonMixed: {
      hu: "A részben mért, részben becsült szerepképben nem látszik: {roles}.",
      en: "The partly measured, partly estimated role map is missing: {roles}.",
    },
    roleGapReasonEstimated: {
      hu: "A becsült szerepképben nem látszik: {roles}.",
      en: "Estimated role map is missing: {roles}.",
    },
  },

  // ── Team pages (/team, /team/[id]) ──────────────────────────────────────
  team: {
    fb: {
      eyebrow: { hu: "visszajelzés", en: "feedback" },
      title: { hu: "Fejlesztő visszajelzés", en: "Development feedback" },
      hint: {
        hu: "Kérj visszajelzést a csapattársaidtól egy konkrét témában. Te választod ki, ki válaszolhat, és hogy engedélyezed-e a név nélküli válaszokat. A visszajelzéseket csak te látod.",
        en: "Ask your teammates for feedback on a specific topic – you decide who can answer and whether anonymously. Responses are visible only to you.",
      },
      forMeLabel: { hu: "Rád váró kérések ({count})", en: "Requests waiting for you ({count})" },
      asksAbout: { hu: "visszajelzést kér:", en: "asks for feedback on:" },
      respond: { hu: "Válaszolok", en: "Respond" },
      cancel: { hu: "Mégse", en: "Cancel" },
      continueLabel: { hu: "Folytasd, mert…", en: "Keep doing, because…" },
      tryLabel: { hu: "Legközelebb próbáld…", en: "Next time, try…" },
      commentLabel: { hu: "További megjegyzés", en: "Free comment" },
      optional: { hu: "(opcionális)", en: "(optional)" },
      respondAnonymously: { hu: "Név nélkül válaszolok", en: "Respond anonymously" },
      sendResponse: { hu: "Válasz küldése", en: "Send response" },
      respondError: { hu: "A válasz küldése nem sikerült – próbáld újra.", en: "Sending the response failed – try again." },
      newRequestTitle: { hu: "Kérek visszajelzést", en: "Request feedback" },
      topicPlaceholder: { hu: "Miről kérsz visszajelzést? Pl. „Hasznosak az általam vezetett megbeszélések?”", en: "What do you want feedback on? E.g. \"Are my meetings useful?\"" },
      allowAnonymous: { hu: "Név nélküli válaszokat is elfogadok", en: "I also accept anonymous responses" },
      create: { hu: "Kérés elküldése", en: "Send request" },
      createdOk: { hu: "Elküldve", en: "Sent" },
      createError: { hu: "A kérés létrehozása nem sikerült.", en: "Creating the request failed." },
      mineLabel: { hu: "Kéréseim és a válaszok", en: "My requests and responses" },
      requestMeta: { hu: "{count}/{total} válasz érkezett", en: "{count}/{total} responses received" },
      anonBadge: { hu: "név nélküli válaszok engedélyezve", en: "anonymous responses allowed" },
      continueShort: { hu: "Folytasd", en: "Keep" },
      tryShort: { hu: "Próbáld", en: "Try" },
      anonymousResponder: { hu: "névtelen válaszadó", en: "anonymous responder" },
      suggestionsLabel: { hu: "A mérési körökben kapott javaslataid", en: "Suggestions from measurement rounds" },
      pendingAnonymous: {
        hu: "{count} név nélküli javaslat vár még – legalább 3 beküldőnél jelenik meg, összesítve.",
        en: "{count} anonymous suggestions pending – shown aggregated once there are at least 3 senders.",
      },
    },
    kudos: {
      eyebrow: { hu: "köszönet", en: "kudos" },
      title: { hu: "Köszönetek", en: "Kudos" },
      hint: {
        hu: "Küldj nevesített köszönetet egy csapattársadnak – egy konkrét helyzetért vagy viselkedésért. Te döntöd el, hogy személyes maradjon-e.",
        en: "Send named kudos to a teammate – for a specific situation or behaviour. You decide whether it stays personal.",
      },
      pickMember: { hu: "Válassz csapattársat…", en: "Pick a teammate…" },
      badgeLabel: { hu: "Jelvény", en: "Badge" },
      placeholder: { hu: "Pl. „Köszönöm, hogy a keddi ügyféltalálkozó előtt átnézted a bemutatómat. Sokat segítettél vele.”", en: "E.g. \"Thanks for reviewing my deck before Tuesday's demo – it made a real difference.\"" },
      send: { hu: "Köszönet küldése", en: "Send kudos" },
      sentOk: { hu: "Elküldve", en: "Sent" },
      sendError: { hu: "A küldés nem sikerült – próbáld újra.", en: "Sending failed – try again." },
      visibilityLabel: { hu: "Ki láthatja?", en: "Who can see it?" },
      privateTitle: { hu: "Csak a címzett", en: "Recipient only" },
      privateHint: { hu: "Személyes köszönet", en: "Personal kudos" },
      teamTitle: { hu: "Az egész csapat", en: "The whole team" },
      teamHint: { hu: "Megjelenik az elismerésfolyamban", en: "Shown in the recognition feed" },
      teamConsent: {
        hu: "A címzett értesítést kap, és a küldővel együtt később is elrejtheti a csapatfolyamból. A személyes köszönet ettől megmarad.",
        en: "The recipient is notified and can hide it from the team feed later, as can the sender. The personal kudos remains available.",
      },
      receivedLabel: { hu: "Kapott köszöneteid ({count})", en: "Kudos you received ({count})" },
      empty: { hu: "Még nem kaptál köszönetet. Ha szeretnéd, te is küldhetsz egyet valamelyik csapattársadnak.", en: "No kudos received yet – maybe you'll be the first to send one?" },
      receivedTab: { hu: "Neked érkezett", en: "Received" },
      teamTab: { hu: "Csapat elismerései", en: "Team recognition" },
      teamFeedLabel: { hu: "Csapatszintű köszönetek ({count})", en: "Team kudos ({count})" },
      teamFeedEmpty: { hu: "Még nincs a csapattal megosztott köszönet.", en: "No kudos have been shared with the team yet." },
      teamVisibleBadge: { hu: "a csapat is látja", en: "visible to the team" },
      hideFromTeam: { hu: "Elrejtés a csapat elől", en: "Hide from team" },
      hideError: { hu: "Az elrejtés nem sikerült – próbáld újra.", en: "Hiding the kudos failed – try again." },
    },
    eyebrow: { hu: "HR & Csapat", en: "HR & Team" },
    title: { hu: "Csapataim", en: "My Teams" },
    createNew: { hu: "Új csapat létrehozása", en: "Create a new team" },
    createNewDesc: {
      hu: "Adj nevet a csapatnak, majd add hozzá a tagokat e-mail-cím alapján.",
      en: "Give your team a name, then add members by their email address.",
    },
    teamsLabel: { hu: "Csapatok", en: "Teams" },
    noTeams: {
      hu: "Még nincs csapatod. Hozz létre egyet fentebb!",
      en: "No teams yet. Create one above!",
    },
    noTeamsTitle: { hu: "Még nincs csapatod", en: "You don't have a team yet" },
    noTeamsMember: {
      hu: "Még nem kerültél csapatba. A szervezeti menedzser tud hozzáadni egyhez.",
      en: "You haven't been added to a team yet. An organization manager can add you.",
    },
    memberTag: { hu: "tag", en: "member" },
    membersTag: { hu: "tag", en: "members" },
    createdPrefix: { hu: "Létrehozva: ", en: "Created " },
    open: { hu: "Megnyitás", en: "Open" },

    // team/[id] — detail page
    detailEyebrowPrefix: { hu: "csapat", en: "team" },
    roleManager: { hu: "Menedzser", en: "Manager" },
    roleMember: { hu: "Tag", en: "Member" },
    campaignButton: { hu: "Mérés", en: "Measurement" },

    // stat strip labels
    statMembers: { hu: "Tagok", en: "Members" },
    statCompleted: { hu: "kitöltötte", en: "completed" },
    statObserverCoverage: { hu: "Mások visszajelzéseinek lefedettsége", en: "Observer coverage" },
    statNoCampaign: { hu: "nincs aktív mérés", en: "no active measurement" },
    statCampaignDaysActive: { hu: "{days} napja aktív", en: "Active for {days} days" },
    statStartCampaign: {
      hu: "Indíts mérést az összehasonlításhoz",
      en: "Start a 360° campaign to compare",
    },
    statTeamStrength: { hu: "Csapat erőssége", en: "Team strength" },
    statGrowthArea: { hu: "Fejlesztési terület", en: "Growth area" },
    statActiveCampaign: { hu: "Aktív mérés", en: "Active measurement" },
    statInProgress: { hu: "folyamatban", en: "in progress" },
  },

  // ── Join pages (/join/[token], /join/org/[inviteId]) ────────────────────
  join: {
    // ── Shared ──────────────────────────────────────────────────────────
    inviteEyebrow: { hu: "meghívó", en: "invite" },
    profileHint: {
      hu: "Ezeket az adatokat bármikor módosíthatod a profiloldalon.",
      en: "You can edit these details anytime on your profile page.",
    },
    usernameLabel: { hu: "Megjelenítési név", en: "Display name" },
    usernamePlaceholder: { hu: "pl. Kovács Péter", en: "e.g. Alex Walker" },
    birthYearLabel: { hu: "Születési év", en: "Birth year" },
    birthYearPlaceholder: { hu: "pl. {example}", en: "e.g. {example}" },
    birthYearHint: { hu: "{min}–{max} között", en: "Between {min} and {max}" },
    genderLabel: { hu: "Nem", en: "Gender" },
    consentText: {
      hu: "Hozzájárulok adataim kezeléséhez az",
      en: "I consent to the processing of my data according to the",
    },
    privacyLabel: { hu: "Adatvédelmi tájékoztató", en: "Privacy Policy" },
    consentSuffix: { hu: "alapján.", en: "." },
    submitting: { hu: "Csatlakozás…", en: "Joining..." },
    submitErrorGeneric: {
      hu: "Hiba történt, próbáld újra.",
      en: "Something went wrong. Please try again.",
    },
    joinEyebrow: { hu: "csatlakozás", en: "join" },
    welcomePrefix: { hu: "Szia", en: "Welcome" },
    submitNew: {
      hu: "Csatlakozás és felmérés indítása",
      en: "Join and start assessment",
    },
    submitExisting: { hu: "Csatlakozás", en: "Join" },

    // ── /join/[token] — team invite ─────────────────────────────────────
    teamTitle: { hu: "Csatlakozz a csapathoz", en: "Join the team" },
    stepProfile: { hu: "Profil", en: "Profile" },
    stepDone: { hu: "Kész", en: "Done" },
    switchEyebrow: { hu: "szervezetváltás", en: "switch context" },
    switchTitle: {
      hu: "Már tartozol egy szervezethez",
      en: "You already belong to an organization",
    },
    switchDescription: {
      hu: "Jelenleg ennek a szervezetnek a felületét használod: {existingOrg}. Csatlakozás után ide váltasz: {orgName}. A korábbi tagságod megmarad.",
      en: "Your active org context is {existingOrg}. If you join {orgName}, your previous memberships remain intact and only your active context changes.",
    },
    switchPrimaryLoading: { hu: "Váltás…", en: "Switching..." },
    switchPrimary: {
      hu: "Átváltás: {orgName}",
      en: "Switch to {orgName}",
    },
    switchSecondary: {
      hu: "Maradok a jelenlegi szervezetben",
      en: "Stay in current organization",
    },
    readySameOrg: {
      hu: "A meglévő szervezeti tagságoddal ehhez a csapathoz csatlakozol: {teamName}.",
      en: "You are joining {teamName} with your existing organization membership.",
    },
    readyNewOrg: {
      hu: "Szervezet, amelyhez csatlakozol: {orgName}. Csapat: {teamName}. A meglévő eredményeid megmaradnak.",
      en: "You are joining {orgName} and the {teamName} team. Your existing results stay with you.",
    },
    joinLoading: { hu: "Csatlakozás…", en: "Joining..." },
    joinCta: { hu: "Csatlakozás", en: "Join" },
    step1Eyebrow: { hu: "01", en: "01" },
    step1Title: { hu: "Személyes adatok", en: "Basic profile" },
    step1Sub: {
      hu: "Ezek szükségesek a személyre szabott csapatképhez.",
      en: "These details are required for personalized team insight.",
    },
    continueCta: { hu: "Tovább", en: "Continue" },
    step2Eyebrow: { hu: "02", en: "02" },
    step2Title: { hu: "Egy utolsó lépés", en: "One final step" },
    backCta: { hu: "Vissza", en: "Back" },

    // ── /join/org/[inviteId] — org invite ───────────────────────────────
    orgTitle: { hu: "Csatlakozz a szervezethez", en: "Join organization" },
    profileEyebrow: { hu: "01", en: "01" },
    profileTitle: { hu: "Néhány alapadat", en: "A few basic details" },
    profileSub: {
      hu: "Ezek szükségesek a személyre szabott csapatképhez.",
      en: "These details are required for personalized team insight.",
    },
    readyText: {
      hu: "Ehhez a szervezethez csatlakozol: {orgName}. A meglévő személyes eredményeid megmaradnak.",
      en: "You're ready to join {orgName}. Your existing personal results remain available.",
    },
  },

  // ── Team detail page (/team/[id]) — server page ──────────────────────────
  teamDetail: {
    metaTitle: { hu: "Csapat | trita", en: "Team | trita" },

    // Hero
    heroEyebrow: { hu: "Csapatnézet", en: "Team view" },
    heroPatternReady: { hu: "Csapatkép elérhető", en: "Pattern ready" },
    heroViewPattern: { hu: "Csapatkép megnyitása", en: "Open team picture" },
    heroManageRound: { hu: "Visszajelzési kör kezelése", en: "Manage feedback round" },
    heroStartRound: { hu: "Kör indítása", en: "Start round" },

    // Live snapshot aside
    snapshotLabel: { hu: "Élő pillanatkép", en: "Live snapshot" },
    snapshotMembers: { hu: "Tag", en: "Members" },
    // A KÉSZ/VÁR és a bal oldali gyűrű a SZEMÉLYISÉG-PROFILRA vonatkozik
    // (önértékelés) — a többi mérés haladása a lenti mérés-bontásban él.
    snapshotDone: { hu: "Profil kész", en: "Profile done" },
    snapshotWait: { hu: "Kitöltésre vár", en: "Profile pending" },
    snapshotCompletionRate: { hu: "Személyiségprofil", en: "Personality profile" },
    snapshotDoneInProgress: { hu: "{done} kész · {inProgress} folyamatban", en: "{done} done · {inProgress} in progress" },

    // Secondary progress
    secondaryFeedbackRound: { hu: "Visszajelzési kör", en: "Feedback round" },
    secondaryPatternReadiness: { hu: "A csapatkép készültsége", en: "Pattern readiness" },
    secondaryObserverProgress: { hu: "{done} kész · {remaining} hátra", en: "{done} done · {remaining} remaining" },
    secondaryPatternAvailable: { hu: "A csapatkép elérhető", en: "Team pattern is available" },
    secondaryPatternProgress: { hu: "{done}/{target} kész", en: "{done}/{target} done" },

    // Mérés-bontás (aktív kampány lépései a csapat-állapotképben)
    measurementBreakdownTitle: { hu: "Mérések állása", en: "Measurement progress" },
    measurementBreakdownHint: {
      hu: "Mérésenkénti állás ebben a körben: „{name}”. A fenti kitöltési arány csak a személyiségprofilra vonatkozik.",
      en: "Per measurement in the \"{name}\" round – the completion rate above covers the personality profile only.",
    },
    measurementBreakdownDone: { hu: "{done}/{total} kész", en: "{done}/{total} done" },

    // Recommended action
    nextStep: { hu: "Következő lépés", en: "Next step" },
    actionObserverActive: { hu: "A visszajelzési kör folyamatban van. Kövesd a válaszok beérkezését, és emlékeztesd azokat, akik még nem végeztek.", en: "The feedback round is active. Track and close remaining feedback." },
    actionPatternReady: { hu: "A csapatkép kész, most érdemes elindítani a visszajelzési kört.", en: "Team pattern is ready. Launch the feedback round now." },
    actionCloseMissing: { hu: "Előbb fejezzétek be a még hiányzó kitöltéseket, majd indítsatok új kört.", en: "Close missing assessments first, then launch the round." },
    actionManageRound: { hu: "Kör kezelése", en: "Manage round" },
    actionStartRound: { hu: "Kör indítása", en: "Start round" },
    actionViewPattern: { hu: "Csapatkép megnyitása", en: "Open team picture" },
    actionPatternAvailable: { hu: "A csapatkép már elérhető, nézd át a mintázatokat a következő döntés előtt.", en: "Team pattern is available. Review it before your next decision." },
    actionNeedMore: { hu: "A csapatkép megjelenítéséhez további kitöltések szükségesek.", en: "More completed assessments are needed to unlock team pattern." },
    actionViewPatternAlt: { hu: "Csapatkép megnyitása", en: "Open team picture" },
    actionOpenMembers: { hu: "Tagok megnyitása", en: "Open members" },

    // Summary section
    sectionSnapshot: { hu: "Állapotkép", en: "Snapshot" },
    summaryLabel: { hu: "ÖSSZEFOGLALÓ", en: "SUMMARY" },
    // A kártya a SZEMÉLYISÉG-PROFIL (önértékelés) kitöltöttségét mutatja —
    // a cím ezt kimondja, hogy ne tűnjön a teljes mérés-kör arányának.
    completionRateTitle: { hu: "A SZEMÉLYISÉGFELMÉRÉS KITÖLTÖTTSÉGE", en: "PERSONALITY PROFILE COMPLETION" },
    completionRateSub: { hu: "{done} kész · {inProgress} folyamatban · {waiting} várakozik", en: "{done} done · {inProgress} in progress · {waiting} waiting" },
    teamPatternTitle: { hu: "CSAPATMINTÁZAT", en: "TEAM PATTERN" },
    teamPatternAvailable: { hu: "Elérhető", en: "Available" },
    teamPatternNotYet: { hu: "Még nem", en: "Not yet" },
    teamPatternProgress: { hu: "A kitöltések {pct}%-ánál tart. Minimum 3 kitöltés szükséges.", en: "{pct}% complete. Minimum 3 assessments required." },
    teamPatternViewCta: { hu: "Csapatkép megtekintése", en: "View team pattern" },

    // Journey checklist section
    sectionJourney: { hu: "Bevezetési lépések", en: "Journey checklist" },
    journeyProgress: { hu: "haladás", en: "progress" },
    journeyTitle: { hu: "A csapat haladása", en: "Track team journey" },
    journeyDescription: { hu: "Itt láthatod, hol tart a csapat a felmérésben, és mi szükséges a következő lépéshez.", en: "Built on the same journey logic, this shows where the team stands and what is missing for the next level." },
    journeyNextStep: { hu: "Következő lépés", en: "Next step" },

    // Checklist items
    checkCoreTeam: { hu: "Magcsapat kialakítása", en: "Core team in place" },
    checkCoreTeamDetail: { hu: "{count} tag aktív a csapatban", en: "{count} active members in the team" },
    checkCoreTeamCta: { hu: "Tagok kezelése", en: "Manage members" },
    checkAssessments: { hu: "A kitöltések befejezése", en: "Assessments completed" },
    checkAssessmentsDetail: { hu: "{done}/3 szükséges az első csapatképhez", en: "{done}/3 needed for first team pattern" },
    checkAssessmentsCta: { hu: "Hiányzók követése", en: "Track missing members" },
    checkFeedbackRound: { hu: "Visszajelzési kör", en: "Feedback round" },
    checkFeedbackActive: { hu: "A csapatban jelenleg aktív mérési kör zajlik.", en: "An active round is running." },
    checkFeedbackNone: { hu: "Még nincs aktív visszajelzési kör.", en: "No active observer round yet." },
    checkFeedbackCta: { hu: "Kör indítása", en: "Start round" },

    // 4+2 layer section
    sectionLayers: { hu: "A 4+2 mérési terület állapota", en: "4+2 layer readiness" },
    layersLabel: { hu: "Csapatszintű rétegek", en: "Team-level layers" },
    layersDoneSuffix: { hu: "kész", en: "done" },
    statusCompleted: { hu: "Kész", en: "Completed" },
    statusInProgress: { hu: "Folyamatban", en: "In progress" },
    statusAvailable: { hu: "Elérhető", en: "Available" },
    statusLocked: { hu: "Zárolt", en: "Locked" },

    // People section
    sectionPeople: { hu: "Emberek", en: "People" },
    membersLabel: { hu: "TAGOK", en: "MEMBERS" },
    memberDone: { hu: "Kész", en: "Done" },
    memberInProgress: { hu: "Folyamatban", en: "In progress" },
    memberWaiting: { hu: "Várakozik", en: "Waiting" },
    memberProfileCta: { hu: "Profil", en: "Profile" },
    memberRemindCta: { hu: "Eml.", en: "Remind" },

    // Next step section
    sectionNextStep: { hu: "Következő lépés", en: "Next step" },
    nextStepActiveFeedback: { hu: "{count} aktív visszajelzés", en: "{count} active feedback" },
    nextStepFocusInsight: { hu: "Fókuszban a csapatkép", en: "Focus on team insight" },
  },

  // ── Org onboarding wizard (/onboarding) ──────────────────────────────────
  orgOnboarding: {
    // Heading
    welcomeTitle: { hu: "Üdvözlünk a tritában.", en: "Welcome to trita." },
    welcomeSubtitle: { hu: "3 perc és látod az első csapatképet.", en: "In 3 minutes you'll unlock your first team snapshot." },

    // Step labels
    stepProfile: { hu: "Profil", en: "Profile" },
    stepCompany: { hu: "Cég", en: "Company" },
    stepTeam: { hu: "Csapat", en: "Team" },
    stepDone: { hu: "Kész", en: "Done" },

    // Layer roadmap
    layerRoadmap: { hu: "Mérési útiterv", en: "Measurement roadmap" },
    statusCompleted: { hu: "Kész", en: "Completed" },
    statusInProgress: { hu: "Folyamatban", en: "In progress" },
    statusAvailable: { hu: "Elérhető", en: "Available" },
    statusLocked: { hu: "Zárolt", en: "Locked" },
    layerPlusNote: { hu: "A két kiegészítő mérés akkor válik elérhetővé, amikor az alapvető egyéni és csapatszintű mérések elkészültek.", en: "The +2 layers appear as optional deepening once the core self and team layers are ready." },

    // Step 1
    step01: { hu: "01. lépés", en: "Step 01" },
    step01Title: { hu: "Személyes adatok", en: "Personal details" },
    step01Subtitle: { hu: "Ezek szükségesek a személyre szabott csapatképhez.", en: "These details are required for personalized team insight." },
    displayName: { hu: "Megjelenítési név", en: "Display name" },
    displayNamePlaceholder: { hu: "pl. Kovács Péter", en: "e.g. Alex Walker" },
    birthYear: { hu: "Születési év", en: "Birth year" },
    birthYearPlaceholder: { hu: "pl. {year}", en: "e.g. {year}" },
    birthYearRange: { hu: "{min}–{max} között", en: "Between {min} and {max}" },
    gender: { hu: "Nem", en: "Gender" },
    country: { hu: "Ország", en: "Country" },
    countryPlaceholder: { hu: "Válassz országot", en: "Select country" },
    continueBtn: { hu: "Tovább", en: "Continue" },

    // Validation
    valMinChars: { hu: "Legalább 2 karakter szükséges", en: "At least 2 characters are required" },
    valMaxChars20: { hu: "Maximum 20 karakter", en: "Maximum 20 characters" },
    valPleaseChoose: { hu: "Válassz egyet", en: "Please choose one" },
    valOrgNameRequired: { hu: "A cég neve kötelező", en: "Company name is required" },
    valMaxChars100: { hu: "Maximum 100 karakter", en: "Maximum 100 characters" },
    valTeamNameRequired: { hu: "A csapat neve kötelező", en: "Team name is required" },
    valMaxChars60: { hu: "Maximum 60 karakter", en: "Maximum 60 characters" },
    valGenericError: { hu: "Hiba történt, próbáld újra", en: "Something went wrong. Please try again." },
    valConsentError: { hu: "Hiba történt, próbáld újra.", en: "Something went wrong. Please try again." },

    // Step 2
    step02: { hu: "02. lépés", en: "Step 02" },
    step02Title: { hu: "A céged", en: "Your company" },
    step02Subtitle: { hu: "Ezek az adatok segítenek személyre szabni a csapatképet.", en: "These details help us tailor the team insight." },
    roleLabel: { hu: "Mi a szerepköröd?", en: "What is your role?" },
    optional: { hu: "(opcionális)", en: "(optional)" },
    companyName: { hu: "Cég neve", en: "Company name" },
    companyNamePlaceholder: { hu: "pl. Kovács és Társa Kft.", en: "e.g. Acme Inc." },
    industryLabel: { hu: "Iparág", en: "Industry" },
    teamSizeLabel: { hu: "Csapat mérete", en: "Team size" },
    backBtn: { hu: "Vissza", en: "Back" },
    creatingBtn: { hu: "Létrehozás…", en: "Creating..." },

    // Step 3
    step03: { hu: "03. lépés", en: "Step 03" },
    step03Title: { hu: "Az első csapatod", en: "Your first team" },
    step03Subtitle: { hu: "Adj nevet a csapatnak, majd oszd meg a meghívólinket a tagokkal.", en: "Name your team, then share the invite link with members." },
    teamName: { hu: "Csapat neve", en: "Team name" },
    teamNamePlaceholder: { hu: "pl. Értékesítési csapat", en: "e.g. Sales Team" },
    createTeamBtn: { hu: "Csapat létrehozása", en: "Create team" },
    skipForNow: { hu: "Kihagyom most, beállítom később", en: "Skip for now, set up later" },
    defaultTeamName: { hu: "Első csapatom", en: "My first team" },

    // Invite link
    inviteLinkLabel: { hu: "Meghívólink", en: "Invite link" },
    copiedBtn: { hu: "✓ Másolva!", en: "✓ Copied!" },
    copyBtn: { hu: "Másolás", en: "Copy" },
    inviteLinkDescription: { hu: "Küldd el ezt a linket a csapattagjaidnak. Regisztráció után automatikusan csatlakoznak a csapathoz és elkezdhetik a felmérést.", en: "Share this link with your teammates. After registration they will join the team automatically and can start the assessment." },
    inviteQrAlt: { hu: "QR-kód a csapat-meghívólinkhez", en: "QR code for the team invite link" },
    inviteQrHint: {
      hu: "Ha egy teremben ültök: a csapattársad a telefonjával beolvasva egyből a csatlakozási oldalra jut.",
      en: "If you're in the same room: your teammate scans it with their phone and lands straight on the join page.",
    },
    goToDashboard: { hu: "Tovább a vezérlőre", en: "Go to dashboard" },

    // Step 4
    step04: { hu: "04. lépés", en: "Step 04" },
    step04Title: { hu: "Egy utolsó lépés", en: "One final step" },
    consentPrefix: { hu: "Hozzájárulok adataim kezeléséhez az", en: "I consent to the processing of my data according to the" },
    privacyPolicy: { hu: "Adatvédelmi tájékoztató", en: "Privacy Policy" },
    consentSuffix: { hu: "alapján.", en: "." },
    savingBtn: { hu: "Mentés…", en: "Saving..." },
    saveAndContinueBtn: { hu: "Beállítások mentése és tovább", en: "Save settings and continue" },

    // Footer
    footerNote: { hu: "Bármikor módosíthatod ezeket a beállításokat a profiloldalon.", en: "You can update these settings anytime on your profile page." },

    // Country picker
    countryPickerTitle: { hu: "Ország", en: "Country" },
    countryPickerSearch: { hu: "Keresés…", en: "Search..." },
  },

  // ── Tag-dossié (/org/[id]/members/[userId]) ──────────────────────────
  memberDossier: {
    // Rater-minőség aggregátum — csak darabszám, raterenkénti flag soha.
    observerQualityNote: {
      hu: "{n} értékelésben a válaszadó kevéssé különböztette meg az egyes jellemzőket. Az eltéréseket ezért érdemes óvatosan értelmezni.",
      en: "{n} external rating(s) show low differentiation – read the differences with caution.",
    },
  },
} as const;
