export const commonTranslations = {
  // ── Hibahatár-oldalak (error.tsx) közös szövegei ────────────────────────
  // A nyers error.message SOHA nem kerül a felhasználó elé (technikai,
  // angol, és belső részletet szivárogtathat) — helyette semleges szöveg +
  // opcionális digest-hibakód a support-azonosításhoz.
  errors: {
    eyebrow: { hu: "hiba történt", en: "something went wrong" },
    genericTitle: { hu: "Valami félrement", en: "Something went wrong" },
    dashboardTitle: { hu: "Hiba a betöltés közben", en: "Error while loading" },
    teamTitle: {
      hu: "Nem sikerült betölteni a csapat adatait",
      en: "Couldn't load the team data",
    },
    orgTitle: {
      hu: "Nem sikerült betölteni a szervezet adatait",
      en: "Couldn't load the organization data",
    },
    assessmentTitle: {
      hu: "Hiba a teszt betöltésekor",
      en: "Error loading the assessment",
    },
    body: {
      hu: "Próbáld újra – ha a hiba megmarad, írj nekünk a Kapcsolat oldalról.",
      en: "Try again – if the problem persists, reach us via the Contact page.",
    },
    retry: { hu: "Újrapróbálás", en: "Try again" },
    errorCode: { hu: "Hibakód", en: "Error code" },
  },

  // Kliensoldali műveletek egységes, emberi hangú hibaüzenetei. Az API
  // technikai hibakódját a user-errors.ts fordítja ezekre a kulcsokra.
  userErrors: {
    actionFailed: {
      hu: "A művelet most nem sikerült. Próbáld újra.",
      en: "We couldn't complete that. Please try again.",
    },
    temporary: {
      hu: "Átmeneti hiba történt. Próbáld újra egy kicsit később.",
      en: "There's a temporary problem. Please try again in a moment.",
    },
    network: {
      hu: "Nem sikerült kapcsolódni. Ellenőrizd az internetkapcsolatot, majd próbáld újra.",
      en: "We couldn't connect. Check your internet connection and try again.",
    },
    sessionExpired: {
      hu: "A munkameneted lejárt. Jelentkezz be újra.",
      en: "Your session has expired. Please sign in again.",
    },
    forbidden: {
      hu: "Ehhez a művelethez nincs jogosultságod.",
      en: "You don't have permission to do this.",
    },
    notFound: {
      hu: "A keresett adat már nem elérhető. Frissítsd az oldalt.",
      en: "This item is no longer available. Refresh the page.",
    },
    invalidInput: {
      hu: "Ellenőrizd a megadott adatokat, majd próbáld újra.",
      en: "Check the information you entered and try again.",
    },
    conflict: {
      hu: "Az adat időközben megváltozott. Frissítsd az oldalt, majd próbáld újra.",
      en: "This item changed in the meantime. Refresh the page and try again.",
    },
    rateLimited: {
      hu: "Túl sok próbálkozás történt. Várj egy kicsit, majd próbáld újra.",
      en: "Too many attempts. Wait a moment and try again.",
    },
    loadFailed: {
      hu: "Nem sikerült betölteni az adatokat. Próbáld újra.",
      en: "We couldn't load the data. Please try again.",
    },
    saveFailed: {
      hu: "Nem sikerült menteni a módosításokat. Próbáld újra.",
      en: "We couldn't save your changes. Please try again.",
    },
    sendFailed: {
      hu: "Nem sikerült elküldeni. Próbáld újra.",
      en: "We couldn't send it. Please try again.",
    },
    emailMissing: {
      hu: "Ehhez a felhasználóhoz nincs email-cím beállítva.",
      en: "This user doesn't have an email address yet.",
    },
    invitationNotPending: {
      hu: "Ez a meghívó már nem vár kiküldésre.",
      en: "This invitation is no longer waiting to be sent.",
    },
    invitationExpired: {
      hu: "Ez a meghívó lejárt, ezért már nem küldhető el.",
      en: "This invitation has expired and can no longer be sent.",
    },
    assessmentAlreadyCompleted: {
      hu: "A tesztet időközben már kitöltötték.",
      en: "The assessment was completed in the meantime.",
    },
    campaignMinimumParticipants: {
      hu: "A mérés legalább 3 résztvevővel indítható. Adj még tagokat a méréshez, majd próbáld újra.",
      en: "A measurement requires at least 3 participants. Add more members, then try again.",
    },
  },

  meta: {
    title: {
      hu: "trita - Személyiség- és csapatintelligencia",
      en: "trita - Personality and Team Intelligence",
    },
    // SEO: a leírás a KERESETT kifejezéssel indul („személyiségteszt
    // magyarul"), nem a felszólítással — a snippet első
    // szavai döntik el, hogy a találat relevánsnak látszik-e.
    description: {
      hu: "Személyiségteszt magyarul, hat dimenzió mentén: vesd össze az önértékelésed a környezeted visszajelzésével, és lásd tisztán a csapatod működését.",
      en: "A personality test across six dimensions: compare your self-image with feedback from people who know you, and see how your team really works.",
    },
    assessmentTitle: {
      hu: "Teszt kitöltése | trita",
      en: "Take the test | trita",
    },
    tryTitle: {
      hu: "Ingyenes személyiségteszt – első eredmény 10 perc alatt | trita",
      en: "Free personality test – 60 questions, about 10 minutes | trita",
    },
    tryDescription: {
      hu: "Töltsd ki a trita személyiségtesztet regisztráció nélkül: 60 kérdés, körülbelül 10 perc, azonnali visszajelzés a hat személyiségdimenzió mentén.",
      en: "Take the trita personality assessment without registration: 60 questions, about 10 minutes, instant feedback across six personality dimensions.",
    },
    dashboardTitle: {
      hu: "Vezérlő | trita",
      en: "Dashboard | trita",
    },
    observeTitle: {
      hu: "Visszajelzés kitöltése | trita",
      en: "Observer assessment | trita",
    },
    onboardingTitle: {
      hu: "Személyes adatok | trita",
      en: "Personal details | trita",
    },
    adminTitle: {
      hu: "Admin | trita",
      en: "Admin | trita",
    },
  },
  nav: {
    home: { hu: "Főoldal", en: "Home" },
    publicHome: { hu: "Főoldal", en: "Home" },
    dashboard: { hu: "Vezérlő", en: "Dashboard" },
    signIn: { hu: "Bejelentkezés", en: "Sign in" },
    signOut: { hu: "Kijelentkezés", en: "Sign out" },
    menu: { hu: "Menü", en: "Menu" },
    blog: { hu: "Blog", en: "Blog" },
    pricing: { hu: "Együttműködés", en: "How we work" },
    pilot: { hu: "Pilotprogram", en: "Pilot program" },
    profile: { hu: "Profilom", en: "My profile" },
    team: { hu: "Csapat", en: "Team" },
    organizations: { hu: "Szervezetek", en: "Organizations" },
    ctaSelf: { hu: "Kipróbálom", en: "Try it" },
    /** A megosztott profil (/share/[token]) minimál fejlécének egyetlen CTA-ja. */
    ctaSharedOwnProfile: { hu: "Saját profil készítése", en: "Create my profile" },
    ctaTeam: { hu: "Pilotprogram", en: "Pilot program" },
    modeSelf: { hu: "Önismeret", en: "Self-awareness" },
    modeTeam: { hu: "Csapatműködés", en: "Team dynamics" },
    dropdownProfile: { hu: "Profilom", en: "My profile" },
    dropdownSignOut: { hu: "Kijelentkezés", en: "Sign out" },
  },
  pageState: {
    loading: { hu: "Az oldal betöltése folyamatban", en: "Loading page" },
    errorEyebrow: { hu: "Átmeneti hiba", en: "Temporary issue" },
    errorTitle: {
      hu: "Ezt most nem sikerült betölteni",
      en: "We couldn't load this right now",
    },
    errorBody: {
      hu: "Az adataid megmaradtak. Próbáld újra, vagy térj vissza a vezérlőhöz.",
      en: "Your data is safe. Try again, or return to the dashboard.",
    },
    retry: { hu: "Újrapróbálás", en: "Try again" },
    dashboard: { hu: "Vezérlő", en: "Dashboard" },
    reference: { hu: "Hivatkozási azonosító", en: "Reference ID" },
  },
  footer: {
    tagline: { hu: "Személyiség és csapatintelligencia platform.", en: "Personality and team intelligence platform." },
    colProduct: { hu: "Termék", en: "Product" },
    colAccount: { hu: "Fiók", en: "Account" },
    colLegal: { hu: "Jogi", en: "Legal" },
    blog: { hu: "Blog", en: "Blog" },
    about: { hu: "Rólunk", en: "About" },
    pricing: { hu: "Együttműködés", en: "How we work" },
    pilot: { hu: "Pilotprogram", en: "Pilot program" },
    // A fogalmi/tartalmi lap eddig CSAK a sitemapben és belső
    // hivatkozásokban élt — a láblécből minden oldalról linkelve viszont
    // valódi belső linkerőt kap, és a crawler is minden bejáráskor látja.
    // (A /holland-kod 2026-08-07-én kikerült: a karrier-réteg fagyasztva
    // van, fake door mögött — nem hivatkozunk rá.)
    patterns: { hu: "Csapatmintázatok", en: "Team patterns" },
    navFounding: { hu: "Alapítói program", en: "Founding" },
    signIn: { hu: "Bejelentkezés", en: "Sign in" },
    signUp: { hu: "Regisztráció", en: "Sign up" },
    legalDocuments: { hu: "Jogi dokumentumok", en: "Legal documents" },
    privacy: { hu: "Adatvédelem", en: "Privacy" },
    contact: { hu: "Kapcsolat", en: "Contact" },
    copyright: { hu: "© 2026 trita. Minden jog fenntartva.", en: "© 2026 trita. All rights reserved." },
  },
  common: {
    or: { hu: "vagy", en: "or" },
    emailMissing: {
      hu: "Email cím nincs beállítva.",
      en: "No email address set.",
    },
    anonymous: { hu: "anonim", en: "anonymous" },
    userFallback: { hu: "Felhasználó", en: "User" },
    inviterFallback: { hu: "Ismerős", en: "Contact" },
    someone: { hu: "Valaki", en: "Someone" },
    statusCompleted: { hu: "Kitöltve", en: "Completed" },
    statusPending: { hu: "Függőben", en: "Pending" },
    statusCanceled: { hu: "Törölve", en: "Canceled" },
    statusExpired: { hu: "Lejárt", en: "Expired" },
    back: { hu: "Vissza", en: "Back" },
    next: { hu: "Tovább", en: "Next" },
    close: { hu: "Bezárás", en: "Close" },
    cancel: { hu: "Mégse", en: "Cancel" },
    // A töltő-jel felolvasott szövege (StarLoaderScreen). A néma spinner úgy
    // viselkedik a képernyőolvasón, mintha az oldal befagyott volna.
    loading: { hu: "Betöltés…", en: "Loading…" },
  },
  locale: {
    label: { hu: "Nyelv", en: "Language" },
    hu: { hu: "Magyar", en: "Magyar" },
    en: { hu: "English", en: "English" },
  },
  actions: {
    startTest: { hu: "Teszt kitöltése", en: "Start test" },
    next: { hu: "Következő", en: "Next" },
    prev: { hu: "Előző", en: "Previous" },
    save: { hu: "Mentés...", en: "Saving..." },
    viewResults: { hu: "Eredmények megtekintése", en: "View results" },
    submit: { hu: "Küldés", en: "Submit" },
    copyLink: { hu: "Link másolása", en: "Copy link" },
    copied: { hu: "Másolva", en: "Copied" },
    delete: { hu: "Törlés", en: "Delete" },
    openFill: { hu: "Kitöltés megnyitása", en: "Open assessment" },
    generate: { hu: "Generálás...", en: "Generating..." },
    newInviteLink: { hu: "Új meghívó link", en: "New invite link" },
    emailInvite: { hu: "Meghívás emailben", en: "Invite by email" },
    signOut: { hu: "Kijelentkezés", en: "Sign out" },
    saveShort: { hu: "Mentés", en: "Save" },
    deleting: { hu: "Törlés...", en: "Deleting..." },
    deleteProfile: { hu: "Fiók törlése", en: "Delete account" },
    signInCta: { hu: "Bejelentkezés", en: "Sign in" },
    signUpCta: { hu: "Regisztráció", en: "Sign up" },
    goDashboard: { hu: "Ugrás a vezérlőre", en: "Go to dashboard" },
    verify: { hu: "Megerősítés", en: "Verify" },
    verifying: { hu: "Ellenőrzés...", en: "Verifying..." },
    backToSignUp: {
      hu: "Vissza a regisztrációhoz",
      en: "Back to sign up",
    },
    continueTest: { hu: "Folytatás", en: "Continue" },
    continueDraft: { hu: "Teszt folytatása", en: "Continue test" },
    back: { hu: "Vissza", en: "Back" },
  },
  error: {
    NO_TEST_TYPE: {
      hu: "Nincs hozzárendelt teszttípusod. Előbb töltsd ki a tesztet.",
      en: "No test type assigned yet. Complete the test first.",
    },
    INVITE_LIMIT_REACHED: {
      hu: "Egyszerre legfeljebb 5 aktív meghívód lehet – ezt most elérted.",
      en: "You reached the maximum (5) invite limit.",
    },
    SELF_INVITE: {
      hu: "Nem hívhatod meg saját magadat.",
      en: "You cannot invite yourself.",
    },
    INVALID_TOKEN: {
      hu: "Érvénytelen meghívó link.",
      en: "Invalid invite link.",
    },
    ALREADY_USED: {
      hu: "Ez a meghívó már fel lett használva.",
      en: "This invite has already been used.",
    },
    INVITE_CANCELED: {
      hu: "Ez a meghívó már nem aktív.",
      en: "This invite is no longer active.",
    },
    INVITE_EXPIRED: {
      hu: "Ez a meghívó lejárt.",
      en: "This invite has expired.",
    },
    INVITE_NOT_APPROVED: {
      hu: "Ez a meghívó még jóváhagyásra vár, egyelőre nem tölthető ki.",
      en: "This invite is still awaiting approval and can't be completed yet.",
    },
    SELF_SUBMISSION: {
      hu: "A saját meghívódra nem küldhetsz be visszajelzést.",
      en: "You can't submit feedback on your own invite.",
    },
    INVALID_TEST_TYPE: {
      hu: "Ez a teszt már nem elérhető.",
      en: "This test is no longer available.",
    },
    ANSWER_COUNT_MISMATCH: {
      hu: "A válaszok száma nem egyezik a kérdések számával.",
      en: "The number of answers does not match the number of questions.",
    },
    DUPLICATE_ANSWER: {
      hu: "Ugyanarra a kérdésre több válasz is érkezett.",
      en: "Duplicate answer received for the same question.",
    },
    MISSING_ANSWER: {
      hu: "Egy kérdésre nem érkezett válasz.",
      en: "An answer is missing for a question.",
    },
    INVALID_LIKERT_ANSWER: {
      hu: "Érvénytelen válaszérték.",
      en: "Invalid Likert answer.",
    },
    EMAIL_SEND_FAILED: {
      hu: "A meghívó létrejött, de az email küldése nem sikerült. Másold ki a linket.",
      en: "Invitation created, but we couldn't send the email. Copy the link instead.",
    },
    DUPLICATE_INVITE_EMAIL: {
      hu: "Erre az email címre már van aktív meghívód. Előbb töröld a meglévőt, ha újat szeretnél küldeni.",
      en: "You already have an active invite for this email address. Delete the existing one first if you want to send a new one.",
    },
    INVALID_DIMENSION_CODE: {
      hu: "Érvénytelen dimenziókód.",
      en: "Invalid dimension code.",
    },
  },
  userMenu: {
    profileFallback: { hu: "Profil", en: "Profile" },
    profile: { hu: "Profilom", en: "My profile" },
    greetingPrefix: { hu: "Szia, ", en: "Hi, " },
    coach: { hu: "HR & Csapat", en: "HR & Team" },
    coachDashboard: { hu: "HR & Csapat felület", en: "HR & Team dashboard" },
    teams: { hu: "Csapataim", en: "My Teams" },
    settings: { hu: "Beállítások", en: "Settings" },
    closePanel: { hu: "Panel bezárása", en: "Close panel" },
    becomeCoach: { hu: "Csatlakozz coachként", en: "Become a coach" },
  },
  becomeCoach: {
    tag: { hu: "Coach program", en: "Coach program" },
    title: { hu: "Csatlakozz coachként", en: "Become a coach on trita" },
    subtitle: {
      hu: "Segíts ügyfeleidnek mélyebben megismerni önmagukat érvényes személyiségadatok és AI-támogatott kiértékelés segítségével.",
      en: "Help your clients understand themselves more deeply with validated personality data and AI-powered debriefs.",
    },
    featuresTitle: { hu: "Mit kapsz?", en: "What you get" },
    feature1Title: { hu: "Ügyfélkezelés", en: "Client management" },
    feature1Body: {
      hu: "Áttekintheted ügyfeleid személyiségprofilját, önértékeléseit és a mások visszajelzéseivel való összevetést egyetlen felületen.",
      en: "View your clients' personality profiles, self-assessments, and observer comparisons in one place.",
    },
    feature2Title: { hu: "AI-generált kiértékelés", en: "AI-generated debrief" },
    feature2Body: {
      hu: "Minden ügyfélhez egy személyre szabott coaching összefoglaló készül, amely az erősségeket, fejlesztési területeket és konkrét kérdéseket tartalmaz.",
      en: "A personalized coaching debrief is generated for each client, covering strengths, development areas, and targeted coaching questions.",
    },
    feature3Title: { hu: "Önismeret vs. mások képe", en: "Self-image vs. how others see them" },
    feature3Body: {
      hu: "Az ügyfeleid a platformon keresztül kérhetnek visszajelzést az ismerőseiktől – az eredményt te is látod.",
      en: "Your clients can request feedback from people they know through the platform – and you see the results too.",
    },
    forTitle: { hu: "Kinek szól?", en: "Who is it for?" },
    forItems: {
      hu: "Tanúsított coachok (ICF, EMCC)|HR szakemberek és szervezetfejlesztők|Pszichológusok és tanácsadók|Karriercoachok és mentálhigiénés szakemberek",
      en: "Certified coaches (ICF, EMCC)|HR professionals and OD consultants|Psychologists and counselors|Career coaches and wellbeing professionals",
    },
    formTitle: { hu: "Jelentkezés", en: "Apply now" },
    formSubtitle: {
      hu: "Töltsd ki az alábbi űrlapot, és hamarosan felvesszük veled a kapcsolatot.",
      en: "Fill in the form below and we will get back to you shortly.",
    },
    nameLabel: { hu: "Neved", en: "Your name" },
    namePlaceholder: { hu: "Kovács Anna", en: "Jane Smith" },
    emailLabel: { hu: "Email cím", en: "Email address" },
    emailPlaceholder: { hu: "anna@example.com", en: "jane@example.com" },
    backgroundLabel: { hu: "Szakmai háttér", en: "Professional background" },
    backgroundPlaceholder: {
      hu: "Pl. 5 éve dolgozom coaching területen, ICF ACC tanúsítással rendelkezem, főként leadership és karrierváltás témában dolgozom...",
      en: "E.g. I have been working in coaching for 5 years, hold ICF ACC certification, mainly focused on leadership and career transitions...",
    },
    motivationLabel: { hu: "Motiváció", en: "Motivation" },
    motivationPlaceholder: {
      hu: "Miért szeretnél coachként csatlakozni a tritához? Hogyan tudnád hasznosítani a platformot az ügyfeleid számára?",
      en: "Why do you want to join trita as a coach? How would you use the platform with your clients?",
    },
    specializationsLabel: { hu: "Szakterületek (opcionális)", en: "Specializations (optional)" },
    specializationsPlaceholder: {
      hu: "Pl. leadership, karrierváltás, csapatdinamika, stresszkezelés",
      en: "E.g. leadership, career transitions, team dynamics, stress management",
    },
    submitButton: { hu: "Jelentkezés beküldése", en: "Submit application" },
    submitting: { hu: "Küldés...", en: "Submitting..." },
    successTitle: { hu: "Köszönjük a jelentkezést!", en: "Thank you for applying!" },
    successBody: {
      hu: "Megkaptuk a kérelmedet. Hamarosan felvesszük veled a kapcsolatot az általad megadott email-címen.",
      en: "We received your application. We will get back to you shortly at the email address you provided.",
    },
    errorGeneric: {
      hu: "Nem sikerült elküldeni. Kérlek próbáld újra.",
      en: "Could not submit. Please try again.",
    },
  },
  contact: {
    // Page
    metaTitle: {
      hu: "Beszéljünk a csapatotokról | trita",
      en: "Team diagnostics and development – contact | trita",
    },
    metaDescription: {
      hu: "Kérj személyes egyeztetést csapatdiagnosztikáról, csapatfejlesztésről, pilotprogramról vagy árazásról. Egy munkanapon belül válaszolunk.",
      en: "Talk to us about team diagnostics, team development, the pilot program, or pricing. We respond within one business day.",
    },
    eyebrow: { hu: "Kapcsolat", en: "Contact" },
    title: { hu: "Beszéljünk arról, miben tud segíteni a trita.", en: "Let's talk about how trita can help." },
    subtitle: {
      hu: "Demó, árazás, partneri együttműködés vagy támogatás – írj nekünk itt, és egy munkanapon belül válaszolunk.",
      en: "Demo, pricing, partnerships, or support – send us a note and we'll reply within one business day.",
    },
    heroCta: { hu: "Írok nektek", en: "Send a message" },
    chipResponseTime: { hu: "24 órás válaszidő", en: "24h response time" },

    // Form section
    sectionEyebrow: { hu: "Kapcsolatfelvétel", en: "Get in touch" },
    sectionTitle: { hu: "Miben segíthetünk?", en: "How can we help?" },
    sectionLead: {
      hu: "Pár mondat is elég. Ha tudjuk a témát, gyorsabban tudunk segíteni.",
      en: "A few sentences are enough. Knowing the topic helps us respond faster.",
    },

    // Info cards
    infoTitle: { hu: "Mi történik beküldés után?", en: "What happens next?" },
    infoBody: { hu: "Az üzeneted közvetlenül a csapathoz érkezik, a válasz emailben jön.", en: "Your message goes to the team directly. We reply by email." },
    responseTitle: { hu: "Válaszidő", en: "Response time" },
    responseBody: { hu: "Munkanapokon jellemzően 24 órán belül.", en: "Usually within 24 hours on business days." },
    legalTitle: { hu: "Adatkezelés", en: "Data handling" },
    legalBody: { hu: "A megadott adatokat kizárólag a megkeresésed megválaszolásához használjuk.", en: "We only use the submitted data to respond to your message." },

    // Form fields
    name: { hu: "Név", en: "Name" },
    email: { hu: "Email", en: "Email" },
    company: { hu: "Cég (opcionális)", en: "Company (optional)" },
    topic: { hu: "Téma", en: "Topic" },
    message: { hu: "Üzenet", en: "Message" },
    submit: { hu: "Üzenet küldése", en: "Send message" },
    submitting: { hu: "Küldés...", en: "Sending..." },
    requiredHint: { hu: "* kötelező mező", en: "* required field" },
    successTitle: { hu: "Megkaptuk az üzeneted.", en: "We received your message." },
    successBody: {
      hu: "1 munkanapon belül visszajelzünk a megadott email címen.",
      en: "We will get back to you within 1 business day.",
    },
    sendAnother: { hu: "Új üzenet írása", en: "Send another message" },
    errorGeneric: {
      hu: "Nem sikerült elküldeni az üzenetet. Kérlek próbáld újra.",
      en: "We could not send your message. Please try again.",
    },
    topicDemo: { hu: "Demó igény", en: "Demo request" },
    topicPricing: { hu: "Árazás", en: "Pricing" },
    topicSupport: { hu: "Terméktámogatás", en: "Product support" },
    topicPartnership: { hu: "Partnerség", en: "Partnership" },
    topicOther: { hu: "Egyéb", en: "Other" },
  },
} as const;
