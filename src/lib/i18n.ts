export type Locale = "hu" | "en";

export const SUPPORTED_LOCALES: Locale[] = ["hu", "en"];
export const DEFAULT_LOCALE: Locale = "hu";

type LocaleRecord = Record<Locale, string>;

const translations = {
  meta: {
    title: {
      hu: "Trita - Személyiségteszt kutatás",
      en: "Trita - Personality Assessment Research",
    },
    description: {
      hu: "Töltsd ki a személyiségtesztet, majd vesd össze az önértékelésed a környezeted visszajelzésével. Kutatási fázisban.",
      en: "Take a personality test and compare your self-assessment with feedback from people who know you. Currently in the research phase.",
    },
    assessmentTitle: {
      hu: "Teszt kitöltése | Trita",
      en: "Take the test | Trita",
    },
    dashboardTitle: {
      hu: "Dashboard | Trita",
      en: "Dashboard | Trita",
    },
    observeTitle: {
      hu: "Visszajelzés kitöltése | Trita",
      en: "Observer assessment | Trita",
    },
    onboardingTitle: {
      hu: "Személyes adatok | Trita",
      en: "Personal details | Trita",
    },
    researchTitle: {
      hu: "Kutatás módszertana | Trita",
      en: "Research methodology | Trita",
    },
    adminTitle: {
      hu: "Admin | Trita",
      en: "Admin | Trita",
    },
  },
  nav: {
    home: { hu: "Főoldal", en: "Home" },
    dashboard: { hu: "Dashboard", en: "Dashboard" },
    signIn: { hu: "Bejelentkezés", en: "Sign in" },
    menu: { hu: "Menü", en: "Menu" },
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
  },
  locale: {
    label: { hu: "Nyelv", en: "Language" },
    hu: { hu: "Magyar", en: "Hungarian" },
    en: { hu: "Angol", en: "English" },
  },
  actions: {
    startTest: { hu: "Teszt kitöltése", en: "Start test" },
    next: { hu: "Következő ->", en: "Next ->" },
    prev: { hu: "<- Előző", en: "<- Previous" },
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
    goDashboard: { hu: "Ugrás a dashboardra", en: "Go to dashboard" },
    verify: { hu: "Megerősítés", en: "Verify" },
    verifying: { hu: "Ellenőrzés...", en: "Verifying..." },
    backToSignUp: {
      hu: "Vissza a regisztrációhoz",
      en: "Back to sign up",
    },
    continueTest: { hu: "Folytatás", en: "Continue" },
    continueDraft: { hu: "Teszt folytatása", en: "Continue test" },
  },
  landing: {
    heroTag: { hu: "Kutatási fázis", en: "Research phase" },
    heroTitle: {
      hu: "A világ bizonytalan, a kiindulópont legyen biztos",
      en: "The world is uncertain, let your starting point be solid.",
    },
    heroTitleLine1: {
      hu: "A világ bizonytalan,",
      en: "The world is uncertain,",
    },
    heroTitleLine2: {
      hu: "a kiindulópont legyen biztos",
      en: "let your starting point be solid",
    },
    statsLanguages: { hu: "nyelv", en: "languages" },
    heroBody: {
      hu: "Fedezd fel a személyiséged mintázatait, és lásd tisztábban, hogyan működsz a munkahelyeden és a kapcsolataidban. Értsd meg, hogyan hat rád a világ és te hogyan hatsz rá.",
      en: "Discover your personality patterns and see more clearly how you operate at work and in your relationships. Understand how the world affects you, and how you affect it.",
    },
    joinResearch: { hu: "Vágjunk bele", en: "Let's dive in" },
    notifyMe: { hu: "A kutatásról", en: "About the research" },
    openDashboard: { hu: "Dashboard megnyitása", en: "Open dashboard" },
    signIn: { hu: "Bejelentkezés", en: "Sign in" },
    estimatedTime: {
      hu: "Az eredmények anonimizáltan kerülnek felhasználásra a kutatásban.",
      en: "Results are used in anonymized form in the research.",
    },
    researchAboutTitle: { hu: "Miről szól a kutatás?", en: "What is this research about?" },
    researchAboutBody: {
      hu: "Többféle személyiségteszt hatékonyságát hasonlítjuk össze önértékeléssel és ismerősi visszajelzéssel.",
      en: "We compare multiple personality models using self-assessment and feedback from others.",
    },
    researchItem1: {
      hu: "Teszt-típusok: HEXACO, Big Five",
      en: "Test types: HEXACO, Big Five",
    },
    researchItem2: {
      hu: "Véletlenszerű kiosztás: mindenki egy tesztet kap",
      en: "Random assignment: everyone gets one test",
    },
    researchItem3: {
      hu: "Ismerősi visszajelzések összehasonlítása",
      en: "Compare with feedback from others",
    },
    aboutTag: { hu: "Háttér", en: "Research foundation" },
    aboutTitle: { hu: "Önismeret, ami adatra épül", en: "Self-knowledge grounded in data" },
    aboutBody: {
      hu: "A platform jelenleg kutatási fázisban, randomizált modell kiosztással működik. Ez támogatja a módszertan validálását és folyamatos finomhangolását.",
      en: "The platform is currently in a research phase and operates with randomized model assignment. This supports methodology validation and continuous refinement.",
    },
    testTypes: { hu: "modellek", en: "models" },
    completionTime: { hu: "kitöltési idő", en: "completion time" },
    completionTimeValue: { hu: "~15 perc", en: "~15 min" },
    howTag: { hu: "Hogyan működik", en: "How it works" },
    howTitle: { hu: "3 egyszerű lépés", en: "3 simple steps" },
    step1Title: { hu: "Regisztrálj", en: "Sign up" },
    step1Body: {
      hu: "Gyors regisztráció után automatikusan kapsz egy személyiségtesztet.",
      en: "After a quick sign-up you are automatically assigned a personality test.",
    },
    step2Title: { hu: "Töltsd ki a tesztet", en: "Complete the test" },
    step2Body: {
      hu: "Válaszolj őszintén a kérdésekre, és az eredményed azonnal megjelenik a dashboardon.",
      en: "Answer honestly and see your result on the dashboard right away.",
    },
    step3Title: { hu: "Hívj meg ismerősöket", en: "Invite people" },
    step3Body: {
      hu: "Kérd meg kollégáidat, barátaidat, családtagjaidat egy rövid értékelésre.",
      en: "Ask colleagues, friends, or family for a quick rating.",
    },
    featuresTag: { hu: "Miért érdemes részt venni", en: "Why participate" },
    featuresTitle: { hu: "A kutatás előnyei számodra", en: "Benefits for you" },
    feature1Title: { hu: "Tudományos háttér", en: "Scientific basis" },
    feature1Desc: {
      hu: "Empirikusan megalapozott személyiségmérési keretrendszereket vetünk össze. Az adatokat anonimizáltan, a visszajelzéseitek alapján a felhasználói élménnyel együtt elemezzük.",
      en: "We compare empirically grounded personality measurement frameworks. We analyze anonymized data together with user experience, based on your feedback.",
    },
    feature2Title: { hu: "Azonnali eredmény", en: "Immediate result" },
    feature2Desc: {
      hu: "A kitöltés után azonnal megkapod a részletes személyiségprofilodat, vizuális kiértékeléssel és könnyen értelmezhető összefoglalóval, hogy gyorsan átlásd a fő mintázatokat.",
      en: "Right after completion, you receive your detailed personality profile with a visual evaluation and an easy-to-understand summary, so you can quickly grasp the key patterns.",
    },
    feature3Title: { hu: "Visszajelzések", en: "Feedback" },
    feature3Desc: {
      hu: "Nézd meg, mennyire egyezik az önképed mások rólad alkotott képével.",
      en: "See how closely your self-image matches the way others perceive you.",
    },
    feature4Title: { hu: "Anonimitás", en: "Anonymity" },
    feature4Desc: {
      hu: "Az adatok anonimizáltan kerülnek felhasználásra. A profil bármikor törölhető.",
      en: "Data is used in anonymized form. Your profile can be deleted at any time.",
    },
    feature5Title: { hu: "Saját tempóban", en: "At your own pace" },
    feature5Desc: {
      hu: "A kérdőívet a saját tempódban töltheted ki: bármikor megszakíthatod, mentjük a haladásod, és később ott folytathatod, ahol abbahagytad.",
      en: "You can complete the questionnaire at your own pace: pause anytime, your progress is saved, and continue later where you left off.",
    },
    ctaTag: { hu: "Készen állsz?", en: "Ready?" },
    ctaTitle: { hu: "Vegyél részt a kutatásban", en: "Take part in the research" },
    ctaBody: {
      hu: "A részvétel önkéntes és ingyenes. Az eredmények anonimizáltan kerülnek feldolgozásra.",
      en: "Participation is voluntary and free. Results are processed anonymously.",
    },
    ctaSignUp: { hu: "Regisztrálok", en: "Create account" },
    ctaCompleteProfile: { hu: "Profil befejezése", en: "Complete profile" },
    ctaRequestFeedback: { hu: "Visszajelzések kérése", en: "Request feedback" },
    ctaViewResults: { hu: "Eredmények megtekintése", en: "View results" },
    ctaTagInProgress: { hu: "Jó úton jársz", en: "You are on your way" },
    ctaTitleCompleteProfile: { hu: "Fejezd be a profilod", en: "Complete your profile" },
    ctaBodyCompleteProfile: {
      hu: "Már csak egy rövid lépés, és indulhat a kitöltés.",
      en: "Just one short step left before you can start the assessment.",
    },
    ctaTitleContinue: { hu: "Folytasd, ahol abbahagytad", en: "Continue where you left off" },
    ctaBodyContinue: {
      hu: "A válaszaid mentve vannak, bármikor folytathatod.",
      en: "Your answers are saved, so you can continue anytime.",
    },
    ctaTitleStartAssessment: { hu: "Kezdd el az első kitöltést", en: "Start your first assessment" },
    ctaBodyStartAssessment: {
      hu: "Röviden végigmész a kérdéseken, és máris látod az eredményedet.",
      en: "Go through the questions in a few minutes and see your result right away.",
    },
    ctaTitleRequestFeedback: { hu: "Kérj visszajelzéseket", en: "Request feedback" },
    ctaBodyRequestFeedback: {
      hu: "Hívd meg azokat, akik jól ismernek, és hasonlítsd össze a nézőpontokat.",
      en: "Invite people who know you well and compare perspectives.",
    },
    ctaTitleResults: { hu: "Nézd meg az eredményeidet", en: "Review your results" },
    ctaBodyResults: {
      hu: "A dashboardon nyomon követheted az eredményeidet és a visszajelzéseket.",
      en: "Track your results and feedback anytime on your dashboard.",
    },
    footer: { hu: "Research", en: "Research" },
    privacyLink: { hu: "Adatvédelem", en: "Privacy" },
    researchLink: { hu: "Módszertan", en: "Methodology" },
    contactLink: { hu: "Kapcsolat", en: "Contact" },
    contactSubject: { hu: "Kapcsolat", en: "Contact" },
  },
  research: {
    title: {
      hu: "Kutatás módszertana",
      en: "Research methodology",
    },
    subtitle: {
      hu: "Áttekintés a kutatás céljairól, menetéről, eszközeiről és az adatkezelés alapelveiről.",
      en: "Overview of the research goals, study flow, instruments, and core data handling principles.",
    },
    tldrTitle: { hu: "Röviden", en: "TL;DR" },
    tldrItems: {
      hu: "Kitöltesz egy rövid személyiségtesztet.|Azonnal kapsz egy átlátható profilt a munkahelyi működésedről.|Opcionálisan kérhetsz külső visszajelzést ismerősöktől, és összevetheted a nézőpontokat.",
      en: "You complete a short personality test.|You immediately get a clear profile focused on work-related behavior.|Optionally, you can request external feedback and compare perspectives.",
    },
    introTitle: {
      hu: "Miért készül a kutatás?",
      en: "Why this study?",
    },
    introBody: {
      hu: "A Trita egy kutatási fázisban lévő platform, amelyet személyiséglélektani adatgyűjtésre fejlesztettem.",
      en: "Trita is a platform in its research phase, developed for collecting personality psychology data.",
    },
    goalsTitle: {
      hu: "Kutatási célok",
      en: "Research goals",
    },
    goalsItems: {
      hu: "Megvizsgálni, mennyire egyezik az önértékelés és a külső visszajelzés dimenziónként.|Összehasonlítani a HEXACO és a Big Five modellek kérdésbankjait és eredményeit.|Feltárni, mennyire tartják a résztvevők relevánsnak a kapott személyiségprofilt és a munka világára vonatkozó következtetéseket.|Megvizsgálni, hogy a kapcsolat típusa és időtartama befolyásolja-e a külső visszajelzések pontosságát.|Feltárni, hogy munkahelyi kapcsolatokban (kolléga párok) szisztematikusan eltér-e az önkép és a mások által látott kép – előzetes adatként a csapatdinamikai kutatás következő fázisához.",
      en: "Examine agreement between self-assessment and ratings from others across dimensions.|Compare the HEXACO and Big Five question banks and results.|Explore how relevant participants find their profile, especially conclusions applied to work.|Investigate whether relationship type and duration moderate rating accuracy.|Explore colleague pairs as preliminary data for the next phase of team dynamics research.",
    },
    designTitle: {
      hu: "Kutatási design",
      en: "Study design",
    },
    designBody: {
      hu: "Online, kérdőíves pilot kutatás. Minden résztvevő véletlenszerűen kap egy önértékelő tesztet (HEXACO vagy Big Five), majd opcionálisan ismerősöket hívhat meg külső visszajelzésre.",
      en: "Online, questionnaire-based pilot study. Each participant completes one randomly assigned self-assessment (HEXACO or Big Five), and can optionally invite people for external feedback.",
    },
    flowTitle: {
      hu: "A kutatás menete",
      en: "Study flow",
    },
    flowItems: {
      hu: "Regisztráció és önkéntes hozzájárulás megadása.|Demográfiai adatok rögzítése (onboarding).|Önértékelő kérdőív kitöltése (HEXACO vagy Big Five – véletlenszerűen kiosztva).|Személyiségprofil megtekintése a dashboardon.|Rövid kutatási visszajelzés kitöltése.|Értékelők meghívása (opcionális) – értesítést küldünk, ha elkészülnek.",
      en: "Registration and informed consent.|Demographic onboarding (age, gender, education, occupation).|Self-assessment questionnaire (HEXACO or Big Five – randomly assigned).|View your personality profile on the dashboard.|Complete a short research feedback survey.|Invite people for external feedback (optional) – you'll get an email when they finish.",
    },
    instrumentsTitle: {
      hu: "Mérőeszközök",
      en: "Instruments",
    },
    instrumentsItems: {
      hu: "HEXACO-PI-R kérdésbank (önértékelő és külső értékelő változat).|Big Five Aspect Scales (BFAS) kérdésbank (önértékelő és külső értékelő változat).|Minden résztvevő véletlenszerűen kap egyet a kettő közül.",
      en: "HEXACO-PI-R item set (self-report and external rating versions).|Big Five Aspect Scales (BFAS) item set (self-report and external rating versions).|Each participant is randomly assigned to one of the two instruments.",
    },
    dataTitle: {
      hu: "Adatkezelés röviden",
      en: "Data handling (summary)",
    },
    dataItems: {
      hu: "Demográfiai adatok (életkor, nem, végzettség, foglalkozási státusz, ország).|Kérdőíves válaszok és összesített pontszámok.|Kutatási visszajelzés (önismeret-pontosság, motiváció, megosztási szándék).|Hozzájárulás időpontja és az érvényes adatkezelési verzió.|Az értékelői meghívók e-mail címe csak értesítéshez kell; az értékelők kiléte az eredményekben név nélkül jelenik meg.|A részvétel önkéntes, bármikor megszakítható.",
      en: "Demographic data (age, gender, education, occupation status, country).|Questionnaire responses and aggregated scores.|Research feedback (self-recognition accuracy, motivation, sharing intent).|Consent timestamp and applicable privacy policy version.|Invitee email addresses are used only for sending invitations; individual identities are not shown in results.|Participation is voluntary and can be stopped at any time.",
    },
    contactTitle: {
      hu: "Kapcsolat",
      en: "Contact",
    },
    contactBody: {
      hu: "Kérdés esetén írj az info@trita.io címre.",
      en: "For questions, contact info@trita.io.",
    },
  },
  auth: {
    signInTitle: { hu: "Bejelentkezés", en: "Sign in" },
    signInSubtitle: { hu: "Küldünk egy egyszeri kódot az emailedre", en: "We'll send a one-time code to your email" },
    signUpTitle: { hu: "Fiók létrehozása", en: "Create account" },
    signUpSubtitle: { hu: "Küldünk egy megerősítő kódot az emailedre", en: "We'll send a verification code to your email" },
    observeTokenHint: {
      hu: "A kitöltött visszajelzésed automatikusan a fiókodhoz kapcsolódik.",
      en: "Your completed assessment will be automatically linked to your account.",
    },
    resendCode: { hu: "Kód újraküldése", en: "Resend code" },
    resendCodeLoading: { hu: "Küldés...", en: "Sending..." },
    resendCodeSent: { hu: "Kód elküldve.", en: "Code sent." },
    resendCodeWait: { hu: "Próbáld újra {seconds} mp múlva.", en: "Try again in {seconds}s." },
    emailLabel: { hu: "Email cím", en: "Email" },
    passwordLabel: { hu: "Jelszó", en: "Password" },
    passwordPlaceholder: { hu: "Jelszó", en: "Password" },
    passwordMinPlaceholder: { hu: "Legalább 8 karakter", en: "At least 8 characters" },
    submitSignIn: { hu: "Bejelentkezés", en: "Sign in" },
    submitSignInLoading: { hu: "Bejelentkezés...", en: "Signing in..." },
    submitSignUp: { hu: "Regisztráció", en: "Sign up" },
    submitSignUpLoading: { hu: "Regisztráció...", en: "Signing up..." },
    googleContinue: { hu: "Folytatás Google fiókkal", en: "Continue with Google" },
    noAccount: { hu: "Nincs még fiókod?", en: "No account yet?" },
    hasAccount: { hu: "Van már fiókod?", en: "Already have an account?" },
    verifyTitle: { hu: "Email megerősítése", en: "Verify email" },
    verifySent: { hu: "Küldtünk egy kódot a(z) {email} címre", en: "We sent a code to {email}" },
    verifyCodeLabel: { hu: "Megerősítő kód", en: "Verification code" },
    errorSignInFailed: { hu: "A bejelentkezés nem sikerült. Próbáld újra.", en: "Sign in failed. Please try again." },
    errorNoAccount: { hu: "Nem található fiók ezzel az email címmel.", en: "No account found with this email." },
    errorBadPassword: { hu: "Hibás jelszó. Próbáld újra.", en: "Incorrect password. Please try again." },
    errorSignInGeneric: { hu: "Hiba történt a bejelentkezés során.", en: "An error occurred during sign in." },
    errorGoogleSignIn: { hu: "Nem sikerült elindítani a Google bejelentkezést.", en: "Could not start Google sign in." },
    errorEmailExists: { hu: "Ez az email cím már regisztrálva van. Jelentkezz be.", en: "This email is already registered. Please sign in." },
    errorWeakPassword: { hu: "A jelszó túl gyenge. Használj legalább 8 karaktert, nagybetűt és számot.", en: "Password is too weak. Use at least 8 characters, one uppercase letter, and one number." },
    errorSignUpGeneric: { hu: "Hiba történt a regisztráció során.", en: "An error occurred during sign up." },
    errorVerificationIncomplete: { hu: "A verifikáció nem fejeződött be. Próbáld újra.", en: "Verification did not complete. Please try again." },
    errorVerificationInvalid: { hu: "Érvénytelen kód. Ellenőrizd és próbáld újra.", en: "Invalid code. Check and try again." },
    errorGoogleSignUp: { hu: "Nem sikerült elindítani a Google regisztrációt.", en: "Could not start Google sign up." },
    forgotPassword: { hu: "Elfelejtett jelszó", en: "Forgot password?" },
    resetTitle: { hu: "Jelszó visszaállítása", en: "Reset password" },
    resetSubtitle: { hu: "Küldünk egy kódot az emailedre", en: "We will send a code to your email" },
    resetSend: { hu: "Kód küldése", en: "Send code" },
    resetSendLoading: { hu: "Küldjük...", en: "Sending..." },
    resetSent: { hu: "Kódot küldtünk ide:", en: "We sent a code to:" },
    resetCodeLabel: { hu: "Megerősítő kód", en: "Verification code" },
    resetNewPasswordLabel: { hu: "Új jelszó", en: "New password" },
    resetSubmit: { hu: "Jelszó frissítése", en: "Update password" },
    resetSubmitLoading: { hu: "Frissítés...", en: "Updating..." },
    resetMissingEmail: { hu: "Add meg az email címed.", en: "Please enter your email." },
    resetRequestError: { hu: "Nem sikerült elküldeni a kódot.", en: "Could not send the code." },
    resetVerifyError: { hu: "Nem sikerült frissíteni a jelszót.", en: "Could not reset the password." },
    backToSignIn: { hu: "Vissza a bejelentkezéshez", en: "Back to sign in" },
    errorSecondFactorRequired: { hu: "Második faktor szükséges. Jelentkezz be a megfelelő módon.", en: "Second factor required. Please complete 2FA." },
    submitSendLink: { hu: "Link küldése", en: "Send link" },
    submitSendLinkLoading: { hu: "Küldés...", en: "Sending..." },
    submitSendCode: { hu: "Kód küldése", en: "Send code" },
    submitSendCodeLoading: { hu: "Küldés...", en: "Sending..." },
    magicLinkSentTitle: { hu: "Ellenőrizd az emailedet!", en: "Check your email!" },
    magicLinkSentBody: {
      hu: "Küldtünk egy bejelentkezési linket a(z) {email} címre. Kattints a levélben lévő gombra a belépéshez.",
      en: "We sent a sign-in link to {email}. Click the button in the email to continue.",
    },
    magicLinkBack: { hu: "Más email cím megadása", en: "Use a different email" },
  },
  assessment: {
    introWelcome: { hu: "Köszönjük, hogy részt veszel a kutatásban!", en: "Thank you for taking part in the research!" },
    introBody: { hu: "A következő kérdőívet kérjük figyelmesen töltsd ki — minden kérdésnél az első benyomásodra hagyatkozz, ne gondolkozz sokat.", en: "Please fill in the questionnaire carefully — go with your first impression on each question, don't overthink it." },
    introAutoAdvanceHint: {
      hu: "Alapból automatikusan továbblépünk, miután válaszolsz. Ha lassabban mennél, bármikor kikapcsolhatod.",
      en: "By default, we move forward automatically after you answer. You can turn this off anytime.",
    },
    introCount: { hu: "😅 Tudjuk, 100 kérdés sok. De bármikor félbeszakíthatod — mentjük a haladásod, és később ott folytathatod, ahol abbahagytad.", en: "😅 We know, 100 questions is a lot. But you can stop anytime — your progress saves automatically so you can pick up right where you left off." },
    introStart: { hu: "Kezdjük el →", en: "Let's start →" },
    helpLikert: {
      hu: "Válaszd ki, mennyire értesz egyet az állítással (1 = egyáltalán nem, 5 = teljesen)",
      en: "Choose how much you agree (1 = not at all, 5 = completely)",
    },
    helpBinary: {
      hu: "Válaszd ki, melyik jellemzőbb",
      en: "Choose which is more characteristic",
    },
    saveError: {
      hu: "Hiba történt mentés közben. Próbáld újra.",
      en: "Saving failed. Please try again.",
    },
    saveResultError: {
      hu: "Nem sikerült elmenteni az eredményt.",
      en: "Could not save result.",
    },
    loadQuestionsError: {
      hu: "Nem sikerült betölteni a kérdéseket.",
      en: "Could not load questions.",
    },
    loadingQuestions: {
      hu: "Kérdések betöltése...",
      en: "Loading questions...",
    },
    emptyValue: { hu: "Válassz egy értéket", en: "Select a value" },
    scale1: { hu: "Egyáltalán nem értek egyet", en: "Strongly disagree" },
    scale2: { hu: "Nem értek egyet", en: "Disagree" },
    scale3: { hu: "Semleges", en: "Neutral" },
    scale4: { hu: "Egyetértek", en: "Agree" },
    scale5: { hu: "Teljesen egyetértek", en: "Strongly agree" },
    endLeft: { hu: "Egyáltalán nem", en: "Not at all" },
    endRight: { hu: "Teljesen", en: "Completely" },
    questionCounter: { hu: "Kérdés {current} / {total}", en: "Question {current} / {total}" },
    evaluatingTitle: { hu: "Eredményeid kiértékelése...", en: "Evaluating your results..." },
    evaluatingBody: { hu: "Egy pillanat és minden kész!", en: "Just a moment, almost done!" },
    pageProgress: { hu: "{current}. oldal / {total}", en: "Page {current} of {total}" },
    pageQuestionCounter: { hu: "{current}/{total} kérdés ezen az oldalon", en: "{current}/{total} questions on this page" },
    nextPage: { hu: "Következő oldal", en: "Next page" },
    nextQuestion: { hu: "Következő kérdés", en: "Next question" },
    prevQuestion: { hu: "Előző kérdés", en: "Previous question" },
    prevPage: { hu: "Előző oldal", en: "Previous page" },
    prevCta: { hu: "Vissza", en: "Back" },
    nextCta: { hu: "Tovább", en: "Next" },
    evaluateCta: { hu: "Kiértékelésre", en: "Evaluate" },
    focusMode: { hu: "Fókusz mód", en: "Focus mode" },
    showAllQuestions: { hu: "Összes kérdés", en: "Show all questions" },
    autoAdvance: { hu: "Automatikus továbblépés", en: "Auto-advance" },
    keyboardHint: { hu: "Tippek: 1-5 = válasz, Enter = tovább", en: "Tips: 1-5 = answer, Enter = continue" },
    etaRemaining: { hu: "Hátralévő idő: ~{minutes} perc", en: "Time left: ~{minutes} min" },
    savedState: { hu: "Mentve", en: "Saved" },
    checkpointReached: { hu: "{percent}% kész - szuper tempó!", en: "{percent}% done - great pace!" },
    journeyMilestone: { hu: "Mérföldkő", en: "Milestone" },
    journeyMilestoneHint: { hu: "Szép munka! Nyomj tovább a folytatáshoz.", en: "Nice work! Press next to continue." },
    journeyMilestone25: { hu: "Az első negyed megvan – szuper start, haladj csak így tovább!", en: "First quarter done – great start, keep going!" },
    journeyMilestone25Hint: { hu: "Nyomj a következőre, és irány a folytatás!", en: "Hit next and keep the momentum going!" },
    journeyMilestone50: { hu: "Pontosan félúton jársz – ez igazán szép teljesítmény!", en: "You're exactly halfway – that's a real achievement!" },
    journeyMilestone50Hint: { hu: "Tudtad? A válaszaid folyamatosan mentődnek, így bármikor félbehagyhatod és onnan folytathatod, ahol abbahagytad.", en: "Did you know? Your answers are saved automatically, so you can leave anytime and pick up right where you left off." },
    journeyMilestone75: { hu: "Már a célegyenesen vagy – ilyen tempóval hamar kész leszel!", en: "You're on the home stretch – at this pace you'll be done in no time!" },
    journeyMilestone75Hint: { hu: "Csak még egy kis kitartás – a végeredmény megér minden kérdést!", en: "Just a little more perseverance – the result is worth every question!" },
  },
  dashboard: {
    metadataTitle: { hu: "Dashboard | Trita", en: "Dashboard | Trita" },
    personalTag: { hu: "Személyes Dashboard", en: "Personal Dashboard" },
    continueDraftTitle: { hu: "Félbehagyott teszt", en: "Unfinished test" },
    continueDraftBody: { hu: "Folytasd onnan, ahol abbahagytad ({answered}/{total} kérdés kész).", en: "Continue where you left off ({answered}/{total} questions done)." },
    noResultTitle: { hu: "Még nincs kiértékelésed", en: "No results yet" },
    noResultBody: { hu: "Töltsd ki a(z) {testName} tesztet, hogy lásd az eredményeidet.", en: "Complete the {testName} test to see your results." },
    latestEvaluation: { hu: "Legutóbbi kiértékelés", en: "Latest evaluation" },
    guidedTag: { hu: "A Te utad", en: "Your journey" },
    nextStepTitle: { hu: "Következő lépés", en: "Next step" },
    guidedPraise: { hu: "Nem vagy egyedül, lépésről lépésre vezetünk.", en: "You are not alone. We will guide you step by step." },
    journeyProgress: { hu: "Haladás", en: "Progress" },
    journeyStepSelf: { hu: "Saját eredmény", en: "Self result" },
    journeyStepInvite: { hu: "Meghívások", en: "Invitations" },
    journeyStepObserver: { hu: "Visszajelzés másoktól", en: "Observer feedback" },
    journeyStepFeedback: { hu: "Visszajelzésed", en: "Your feedback" },
    nextStepInviteTitle: { hu: "Hogyan látnak mások?", en: "See how others see you" },
    nextStepInviteBodyPre:       { hu: "Hívd meg kollégáidat, barátaidat — legalább ", en: "Invite your colleagues and friends — at least " },
    nextStepInviteBodyHighlight: { hu: "2 visszajelzés", en: "2 responses" },
    nextStepInviteBodyPost:      { hu: " kell az összehasonlításhoz.", en: " are needed for the comparison." },
    nextStepInviteNote: {
      hu: "Ennyi kell, hogy értelmezhető összehasonlítást láss (átlag alapján).",
      en: "That’s the minimum needed for a meaningful comparison (based on an average).",
    },
    nextStepInviteCta: { hu: "Meghívó küldése", en: "Send invite" },
    nextStepWaitTitle: { hu: "Várjuk a visszajelzéseket", en: "Waiting for feedback" },
    nextStepWaitBody: { hu: "{received}/2 visszajelzés érkezett · {pending} függőben", en: "{received}/2 responses received · {pending} pending" },
    nextStepManageInvitesCta: { hu: "Meghívók kezelése", en: "Manage invites" },
    nextStepCompareTitle: { hu: "Nézd meg a különbségeket", en: "See the differences" },
    nextStepCompareBody: { hu: "Hasonlítsd össze, hogyan látod magad és hogyan látnak mások.", en: "Compare how you see yourself with how others see you." },
    nextStepCompareCta: { hu: "Ugrás a hasonlításhoz", en: "Jump to comparison" },
    nextStepFeedbackTitle: { hu: "Add a visszajelzésed", en: "Share your feedback" },
    nextStepFeedbackBody: { hu: "Pár kérdés arról, mennyire értesz egyet az eredménnyel.", en: "A few quick questions about how well the results match you." },
    nextStepFeedbackCta: { hu: "Visszajelzés megadása", en: "Give feedback" },
    nextStepDoneTitle: { hu: "Készen is vagy!", en: "You're all set!" },
    nextStepDoneBody: { hu: "Reméljük, hogy az eredmények és a visszajelzések hasznos felismeréseket hoztak!", en: "We hope the results and feedback brought you useful insights!" },
    nextStepDoneCta: { hu: "Vissza az eredményekhez", en: "Back to results" },
    nextStepSurveyTitle: { hu: "Segíts nekünk!", en: "Help us improve" },
    nextStepSurveyBody: { hu: "Töltsd ki a rövid visszajelző kérdőívünket — pár kérdés, nagy segítség.", en: "Fill in our short feedback survey — a few questions, a big help." },
    nextStepSurveyCta: { hu: "Kitöltöm", en: "Fill it out" },
    nextStepTestTitle: { hu: "Kezdd el a tesztet", en: "Take the test" },
    nextStepTestBody: { hu: "Az első lépés a saját személyiségértékelésed elvégzése.", en: "The first step is completing your own personality assessment." },
    nextStepDraftTitle: { hu: "Folytasd a tesztet", en: "Continue the test" },
    nextStepDraftBody: { hu: "Már elindítottad a kitöltést — folytasd ott, ahol abbahagytad.", en: "You've already started the test — continue where you left off." },
    profileOverview: { hu: "Személyiségprofil áttekintés", en: "Personality profile overview" },
    overviewLikert: { hu: "Gyors vizuális összkép a fő személyiségdimenzióidról.", en: "A quick visual snapshot of your main personality dimensions." },
    radarLegendSelf: { hu: "Saját", en: "Self" },
    radarLegendObservers: { hu: "Mások", en: "Others" },
    spectrumHigh: { hu: "Magas", en: "High" },
    spectrumLow: { hu: "Alacsony", en: "Low" },
    detailedTitle: { hu: "Részletes kiértékelés", en: "Detailed results" },
    detailedBody: { hu: "A skálaértékek és rövid jellemzésed.", en: "Scale values and short interpretation." },
    altruismTitle: { hu: "Altruizmus (kiegészítő skála)", en: "Altruism (additional scale)" },
    altruismBody: { hu: "Az altruizmus több fő dimenzióhoz is kapcsolódik, ezért nem számít bele a 6 főfaktor átlagába. Külön pontszámként érdemes nézni.", en: "Altruism relates to multiple core dimensions, so it isn’t included in the 6-factor average. It’s best interpreted as a separate score." },
    dimensionHint: { hu: "Kattints a részletekért", en: "Tap for details" },
    openDetails: { hu: "Részletek", en: "Details" },
    dimensionWhat: { hu: "Mit mér ez a dimenzió?", en: "What does this dimension measure?" },
    dimensionInterpretation: { hu: "Az eredményed értelmezései:", en: "Your result interpretation:" },
    dimensionLow: { hu: "Alacsony (< 40%)", en: "Low (< 40%)" },
    dimensionMid: { hu: "Közepes (40-69%)", en: "Medium (40-69%)" },
    dimensionHigh: { hu: "Magas (>= 70%)", en: "High (>= 70%)" },
    facetsTitle: { hu: "Facetek", en: "Facets" },
    aspectsTitle: { hu: "Aspektusok", en: "Aspects" },
    showSubScales: { hu: "További részletek", en: "Show details" },
    hideSubScales: { hu: "Részletek elrejtése", en: "Hide details" },
    dimension: {
      feedbackTitle: {
        hu: "Mennyire találó ez a dimenzió?",
        en: "How accurate is this dimension?",
      },
      feedbackBackToDetails: {
        hu: "Megnézem még egyszer",
        en: "Review again",
      },
      feedbackPrompt: {
        hu: "Kérlek, segíts javítani a teszt pontosságát a visszajelzéseddel.",
        en: "Please help us improve the test accuracy with your feedback.",
      },
      feedbackVeryInaccurate: {
        hu: "Nagyon pontatlan",
        en: "Very inaccurate",
      },
      feedbackSomewhatInaccurate: {
        hu: "Inkább pontatlan",
        en: "Somewhat inaccurate",
      },
      feedbackNeutral: {
        hu: "Semleges",
        en: "Neutral",
      },
      feedbackAccurate: {
        hu: "Találó",
        en: "Accurate",
      },
      feedbackVeryAccurate: {
        hu: "Nagyon találó",
        en: "Very accurate",
      },
      feedbackAddComment: {
        hu: "+ Megjegyzés hozzáadása (opcionális)",
        en: "+ Add comment (optional)",
      },
      feedbackHideComment: {
        hu: "− Megjegyzés elrejtése",
        en: "− Hide comment",
      },
      feedbackCommentPlaceholder: {
        hu: "Mi volt találó vagy pontatlan ebben a dimenzióban?",
        en: "What felt accurate or inaccurate about this dimension?",
      },
      feedbackSubmit: {
        hu: "Visszajelzés beküldése",
        en: "Submit feedback",
      },
      feedbackSubmitting: {
        hu: "Küldés...",
        en: "Submitting...",
      },
      feedbackThankYou: {
        hu: "Köszönjük!",
        en: "Thank you!",
      },
      feedbackError: {
        hu: "Nem sikerült elküldeni a visszajelzést. Próbáld újra!",
        en: "Could not submit feedback. Please try again.",
      },
      feedbackTagsLabel: {
        hu: "Melyeket érzed igaznak a dimenzió kapcsán?",
        en: "Which of these feel true for this dimension?",
      },
      feedbackRatingLabel: {
        hu: "Hogyan értékelnéd összességében ezt a dimenziót?",
        en: "How would you rate this dimension overall?",
      },
    },
    feedbackTitle: { hu: "Visszajelzés az eredményről", en: "Feedback on your results" },
    feedbackBody: { hu: "Mondd el, mennyire érzed találónak a kiértékelést.", en: "Tell us how accurate the results feel." },
    feedbackOpenCta: { hu: "Visszajelzés megadása", en: "Give feedback" },
    feedbackThanks: { hu: "Köszönjük!", en: "Thank you!" },
    feedbackAgreementLabel: { hu: "Mennyire ismertél magadra az eredményekben?", en: "How well did you recognize yourself in the results?" },
    feedbackObserverUsefulnessLabel: { hu: "Mennyire voltak hasznosak számodra a visszajelzések a meghívottaktól?", en: "How useful was the feedback from the people you invited?" },
    feedbackSiteUsefulnessLabel: { hu: "Hasznosnak találtad-e az oldalt?", en: "Did you find the site useful?" },
    feedbackScaleVeryLow: { hu: "Egyáltalán nem", en: "Not at all" },
    feedbackScaleLow: { hu: "Inkább nem", en: "Rather not" },
    feedbackScaleNeutral: { hu: "Semleges", en: "Neutral" },
    feedbackScaleHigh: { hu: "Egyezik", en: "Agree" },
    feedbackScaleVeryHigh: { hu: "Teljesen egyezik", en: "Fully agree" },
    feedbackContinuePrompt: { hu: "Köszönjük! Ha van még 30 másodperced, segíts néhány további kérdéssel.", en: "Thank you! If you have 30 more seconds, help us with a few more questions." },
    feedbackContinueButton: { hu: "Folytatom", en: "Continue" },
    feedbackWantsUpdatesYes: { hu: "Igen", en: "Yes" },
    feedbackWantsUpdatesNo: { hu: "Nem", en: "No" },
    feedbackFreeformLabel: { hu: "Kérlek, ha bármilyen gondolatod, észrevételed van, írd meg nekünk", en: "Please share any thoughts or comments you have" },
    feedbackFreeformPlaceholder: { hu: "Mit változtatnál? Mi volt igazán találó?", en: "What would you change? What felt accurate?" },
    feedbackUpdatesLabel: { hu: "Érdekelnek a fejlesztés további részletei", en: "I want updates about the project" },
    feedbackSubmit: { hu: "Beküldés", en: "Submit" },
    feedbackSubmitLoading: { hu: "Mentés...", en: "Saving..." },
    feedbackError: { hu: "Nem sikerült beküldeni. Próbáld újra!", en: "Could not submit. Please try again." },
    // ── Research survey ──────────────────────────────────────────────────────
    surveyTitle: { hu: "Kutatási kérdőív", en: "Research survey" },
    surveySubtitle: { hu: "5–6 kérdés, ~1 perc · segíts a kutatásunkban", en: "5–6 questions, ~1 min · help with our research" },
    surveyMultiHint: { hu: "Több is választható", en: "Multiple selections allowed" },
    surveyNext: { hu: "Tovább", en: "Next" },
    surveySubmit: { hu: "Beküldés", en: "Submit" },
    surveySkip: { hu: "Kihagyom", en: "Skip" },
    surveyThanks: { hu: "Köszönjük a visszajelzést!", en: "Thanks for your feedback!" },
    surveySubmitting: { hu: "Mentés...", en: "Saving..." },
    surveyError: { hu: "Nem sikerült beküldeni. Próbáld újra!", en: "Could not submit. Please try again." },
    // Q1
    surveyQ1Label: { hu: "Mennyire ismertél magadra az eredményekben?", en: "How well did you recognize yourself in the results?" },
    // Q2
    surveyQ2Label: { hu: "Töltöttél-e már ki hasonló személyiségtesztet?", en: "Have you taken a similar personality test before?" },
    surveyQ2Mbti: { hu: "MBTI", en: "MBTI" },
    surveyQ2BigFive: { hu: "Big Five", en: "Big Five" },
    surveyQ2Hexaco: { hu: "HEXACO", en: "HEXACO" },
    surveyQ2Disc: { hu: "DISC", en: "DISC" },
    surveyQ2Other: { hu: "Igen, mást", en: "Yes, another one" },
    surveyQ2None: { hu: "Még nem", en: "Not yet" },
    // Q3a — employed
    surveyQ3aLabel: { hu: "Milyen szintű pozícióban dolgozol?", en: "What level is your current position?" },
    surveyQ3aJunior: { hu: "Beosztott", en: "Individual contributor" },
    surveyQ3aMiddle: { hu: "Középvezető", en: "Middle manager" },
    surveyQ3aSenior: { hu: "Felsővezető", en: "Senior executive" },
    surveyQ3aIndependent: { hu: "Önálló vállalkozó", en: "Independent / Freelance" },
    // Q3b — student
    surveyQ3bLabel: { hu: "Milyen területen tanulsz?", en: "What field do you study?" },
    surveyQ3bBusiness: { hu: "Gazdaság / Üzlet", en: "Business / Economics" },
    surveyQ3bStem: { hu: "Természettudomány / Tech", en: "Science / Technology" },
    surveyQ3bHumanities: { hu: "Humán / Társadalom", en: "Humanities / Social Sciences" },
    surveyQ3bHealth: { hu: "Egészségügy", en: "Healthcare" },
    surveyQ3bOther: { hu: "Más", en: "Other" },
    // Q4 industry
    surveyQ4iLabel: { hu: "Milyen iparágban dolgozol / tanulsz?", en: "What industry do you work or study in?" },
    surveyQ4iTech: { hu: "Tech / IT", en: "Tech / IT" },
    surveyQ4iFinance: { hu: "Pénzügy / Bank", en: "Finance / Banking" },
    surveyQ4iHealth: { hu: "Egészségügy / Gyógyszer", en: "Healthcare / Pharma" },
    surveyQ4iEducation: { hu: "Oktatás / Kutatás", en: "Education / Research" },
    surveyQ4iRetail: { hu: "Kereskedelem / Logisztika", en: "Retail / Logistics" },
    surveyQ4iManufacturing: { hu: "Gyártás / Ipar", en: "Manufacturing / Industry" },
    surveyQ4iConsulting: { hu: "Tanácsadás / Marketing", en: "Consulting / Marketing" },
    surveyQ4iPublic: { hu: "Közszféra / NGO", en: "Public sector / NGO" },
    surveyQ4iOther: { hu: "Más", en: "Other" },
    // Q5 motivation
    surveyQ5Label: { hu: "Mi motiválta a kitöltést?", en: "What motivated you to take this assessment?" },
    surveyQ5SelfKnowledge: { hu: "Önismeret 🪞", en: "Self-knowledge 🪞" },
    surveyQ5Career: { hu: "Szakmai fejlődés 💼", en: "Career development 💼" },
    surveyQ5ObserverFeedback: { hu: "Visszajelzés másoktól 👁", en: "Feedback from others 👁" },
    surveyQ5HelpResearch: { hu: "Segíteni akartam 🤝", en: "Wanted to help 🤝" },
    surveyQ5Recommended: { hu: "Ajánlotta valaki 👥", en: "Someone recommended it 👥" },
    surveyQ5Curiosity: { hu: "Csak kipróbáltam 🎲", en: "Just curious 🎲" },
    // Q6 sharing — universal multi-select
    surveyQ6Label: { hu: "Szívesen megosztanád az eredményeidet valakivel?", en: "Would you be happy to share your results with someone?" },
    surveyQ6Manager: { hu: "Főnökömmel / vezetőmmel", en: "My manager / boss" },
    surveyQ6Hr: { hu: "HR-rel", en: "HR" },
    surveyQ6Colleagues: { hu: "Munkatársakkal", en: "Colleagues" },
    surveyQ6Friends: { hu: "Barátokkal / ismerősökkel", en: "Friends / acquaintances" },
    surveyQ6Nobody: { hu: "Nem osztanám meg senkivel", en: "I wouldn't share it with anyone" },
    // Q7 feedback sources — employed only, multi-select
    surveyQ7Label: { hu: "Ki szokott általában visszajelzést adni neked?", en: "Who typically gives you feedback?" },
    surveyQ7Manager: { hu: "Közvetlen vezető", en: "Direct manager" },
    surveyQ7Peers: { hu: "Kollégák / csapattársak", en: "Colleagues / teammates" },
    surveyQ7Reports: { hu: "Beosztottak", en: "Direct reports" },
    surveyQ7Clients: { hu: "Ügyfelek / partnerek", en: "Clients / partners" },
    surveyQ7None: { hu: "Nincs rendszeres visszajelzőm", en: "No regular feedback source" },
    // Q8 360 process — employed only
    surveyQ8Label: { hu: "Van-e formalizált 360 fokos értékelési folyamat a szervezetedben?", en: "Is there a formal 360-degree review process in your organisation?" },
    surveyQ8Yes: { hu: "Igen, van", en: "Yes, there is" },
    surveyQ8No: { hu: "Nem, nincs", en: "No, there isn't" },
    surveyQ8Unknown: { hu: "Nem tudom / Nem releváns", en: "I don't know / Not applicable" },
    // Q9 personality importance — everyone
    surveyQ9Label: { hu: "Mennyire tartod fontosnak a személyiség szerepét a munkahelyi / tanulmányi teljesítményben?", en: "How important do you think personality is for workplace or academic performance?" },
    // Q10 observer usefulness
    surveyQ10Label: { hu: "Mennyire voltak hasznosak a másoktól kapott visszajelzések?", en: "How useful was the feedback from the people you invited?" },
    // Custom scale labels for Q9 / Q10
    surveyScaleImportanceHigh: { hu: "Fontos", en: "Important" },
    surveyScaleImportanceVeryHigh: { hu: "Nagyon fontos", en: "Very important" },
    surveyScaleUsefulnessHigh: { hu: "Hasznos", en: "Useful" },
    surveyScaleUsefulnessVeryHigh: { hu: "Nagyon hasznos", en: "Very useful" },
    invitesReceivedTitle: { hu: "Meghívóid", en: "Invitations you received" },
    invitesReceivedBody: { hu: "Itt látod azokat a meghívókat, amelyeket te kaptál.", en: "Here you can see the invitations you received." },
    retake: { hu: "Teszt újra kitöltése", en: "Retake test" },
    retakeConfirmTitle: {
      hu: "Biztosan újra kitöltöd?",
      en: "Retake the test?",
    },
    retakeConfirmBody: {
      hu: "Az új eredmény felülírja a korábbit a dashboardon. A régi eredmény az adatbázisban megmarad.",
      en: "The new result will replace the current one on your dashboard. The old result is kept in the database.",
    },
    retakeConfirm: { hu: "Újra kitöltöm", en: "Retake" },
    retakeCancel: { hu: "Mégse", en: "Cancel" },
    discardDraft: { hu: "Félkész teszt elvetése", en: "Discard draft" },
    discardDraftConfirmTitle: { hu: "Elveted a félkész tesztet?", en: "Discard this draft?" },
    discardDraftConfirmBody: {
      hu: "Az eddigi válaszaid elvesznek. Az előző eredményed megmarad.",
      en: "Your current answers will be lost. Your previous result will remain.",
    },
    discardDraftConfirm: { hu: "Elvetem", en: "Discard" },
    tabResults: { hu: "Eredmények", en: "Results" },
    tabComparison: { hu: "Összehasonlítás", en: "Comparison" },
    tabInvites: { hu: "Meghívók", en: "Invites" },
    tabComparisonEmptyTitle: { hu: "Még nincs összehasonlítás", en: "No comparison yet" },
    tabComparisonEmptyBody: { hu: "Hívj meg ismerősöket, hogy lásd, hogyan látnak mások.", en: "Invite people you know to see how others see you." },
    tabComparisonEmptyCta: { hu: "Meghívók kezelése", en: "Manage invites" },
  },
  invite: {
    title: { hu: "Ismerős meghívása", en: "Invite someone" },
    body: {
      hu: "Kérd meg kollégáidat, barátaidat vagy családtagjaidat egy rövid értékelésre.",
      en: "Ask colleagues, friends, or family for a quick rating.",
    },
    createNew: { hu: "Új meghívó létrehozása", en: "Create new invitation" },
    emailPlaceholder: { hu: "Email cím (opcionális)", en: "Email address (optional)" },
    create: { hu: "Létrehozás", en: "Create" },
    creating: { hu: "Létrehozás...", en: "Creating..." },
    created: { hu: "Létrehozva", en: "Created" },
    completed: { hu: "Befejezett", en: "Completed" },
    pending: { hu: "Függőben", en: "Pending" },
    limit: { hu: "Limit", en: "Limit" },
    helpText: {
      hu: "Egy link = egy kitöltő. Email nélkül te osztod meg, email címmel mi küldjük ki.",
      en: "One link, one person. No email: share it yourself. With email: we send it.",
    },
    privacyNote: {
      hu: "A visszajelzések név nélkül jelennek meg, és csak összesített átlagokat mutatunk.",
      en: "Feedback is anonymous, and we show only aggregated averages.",
    },
    compareHint: {
      hu: "Az összehasonlításhoz legalább 2 visszajelzés kell. ({count}/2 megérkezett.)",
      en: "For the comparison, you’ll need at least 2 responses. ({count}/2 received.)",
    },
    noInvitations: { hu: "Még nincs meghívásod", en: "No invitations yet" },
    createPrompt: { hu: "Hozz létre egyet a fenti űrlappal", en: "Create one with the form above" },
    createFailed: { hu: "Nem sikerült meghívót létrehozni.", en: "Could not create invite." },
    createLinkSuccess: { hu: "Meghívó link létrehozva.", en: "Invite link created." },
    createEmailSuccess: { hu: "Meghívó e-mail elküldve.", en: "Invitation email sent." },
    copied: { hu: "Link másolva!", en: "Link copied!" },
    copyFailed: { hu: "Nem sikerült a link másolása.", en: "Could not copy the link." },
    deleteSuccess: { hu: "Meghívó törölve.", en: "Invite canceled." },
    deleteFailed: { hu: "Nem sikerült törölni a meghívót.", en: "Could not delete invite." },
    byEmailTitle: { hu: "Meghívás emailben", en: "Invite by email" },
    byEmailPlaceholder: { hu: "ismerős@email.com", en: "friend@email.com" },
    activeLimit: { hu: "Maximum 5 aktív meghívó lehet egyszerre.", en: "Maximum 5 active invites at a time." },
    stats: { hu: "{completed} kitöltve, {pending} függőben, {canceled} törölve", en: "{completed} completed, {pending} pending, {canceled} canceled" },
  },
  observer: {
    metadataTitle: { hu: "Visszajelzés kitöltése | Trita", en: "Observer assessment | Trita" },
    completeTitle: { hu: "Már kitöltötted ezt az értékelést", en: "This assessment is already completed" },
    completeBody: { hu: "Ez a meghívó már fel lett használva. Köszönjük a részvételt!", en: "This invite link has already been used. Thank you for participating!" },
    inactiveTitle: { hu: "A meghívó már nem aktív", en: "Invite is no longer active" },
    inactiveBody: { hu: "Ez a meghívó vissza lett vonva. Kérj új linket az ismerősödtől.", en: "This invite was canceled. Ask for a new link." },
    expiredTitle: { hu: "A meghívó lejárt", en: "Invite expired" },
    expiredBody: { hu: "Ez a meghívó már nem érvényes. Kérj új linket.", en: "This invite is no longer valid. Ask for a new link." },
    introTitle: { hu: "Visszajelzés", en: "Observer assessment" },
    introBody: { hu: "{inviter} arra kér, hogy töltsd ki ezt a(z) {testName} tesztet róla.", en: "{inviter} asked you to complete this {testName} assessment about them." },
    introBody2: { hu: "A válaszaid név nélkül jelennek meg, és csak összesített átlagok láthatók.", en: "Your answers remain anonymous; only aggregated averages are visible." },
    introWelcome: { hu: "Örülünk, hogy itt vagy!", en: "We're glad you're here!" },
    introInvitedBy: { hu: "{inviter} kért meg, hogy töltsd ki a személyiségtesztjét.", en: "{inviter} asked you to fill in their personality test." },
    introBodyShort: { hu: "Kérjük, figyelmesen töltsd ki: minden kérdésnél az első benyomásodra hagyatkozz, ne gondolkozz sokat. A válaszaid név nélkül jelennek meg.", en: "Please fill in carefully — go with your first impression on each question, don't overthink it. Your answers remain anonymous." },
    introPauseNote: { hu: "😅 Tudjuk, 100 kérdés sok. De bármikor félbeszakíthatod — mentjük a haladásod, és később ott folytathatod, ahol abbahagytad.", en: "😅 We know, 100 questions is a lot. But you can stop anytime — your progress saves automatically so you can pick up right where you left off." },
    relationshipLabel: { hu: "Milyen a kapcsolatotok?", en: "What is your relationship?" },
    durationLabel: { hu: "Mióta ismered?", en: "How long have you known them?" },
    start: { hu: "Kezdjük el →", en: "Let's start →" },
    thinkOf: {
      hu: "Ne feledd! {inviter} kért meg az értékelésre, gondolj rá, amikor válaszolsz a kérdésekre. ✨",
      en: "Don't forget: {inviter} asked you for this assessment. Keep them in mind as you answer the questions. ✨",
    },
    next: { hu: "Következő ->", en: "Next ->" },
    prev: { hu: "<- Előző", en: "<- Previous" },
    submitLoading: { hu: "Mentés...", en: "Saving..." },
    submit: { hu: "Küldés", en: "Submit" },
    genericError: { hu: "Hiba történt.", en: "Something went wrong." },
    saveError: { hu: "Hiba történt mentés közben.", en: "Failed to save." },
    relationFriend: { hu: "Barát", en: "Friend" },
    relationColleague: { hu: "Kolléga", en: "Colleague" },
    relationFamily: { hu: "Családtag", en: "Family" },
    relationPartner: { hu: "Partner", en: "Partner" },
    relationOther: { hu: "Egyéb", en: "Other" },
    durationLt1: { hu: "Kevesebb mint 1 éve", en: "Less than 1 year" },
    duration1to3: { hu: "1-3 éve", en: "1-3 years" },
    duration3to5: { hu: "3-5 éve", en: "3-5 years" },
    duration5p: { hu: "5 évnél régebben", en: "More than 5 years" },
    helpLikertAbout: {
      hu: "Válaszd ki, mennyire értesz egyet az állítással {inviter} kapcsán (1 = egyáltalán nem, 5 = teljesen)",
      en: "Choose how much you agree regarding {inviter} (1 = not at all, 5 = completely)",
    },
    helpBinaryAbout: {
      hu: "Válaszd ki, melyik jellemzőbb {inviter} személyére",
      en: "Choose which option is more characteristic of {inviter}",
    },
    confidenceLabel: {
      hu: "Mennyire vagy biztos a válaszaidban?",
      en: "How confident are you in your answers?",
    },
    confidenceHint: {
      hu: "1 = nagyon bizonytalan, 5 = nagyon magabiztos",
      en: "1 = very unsure, 5 = very confident",
    },
    doneTitle: { hu: "Köszönjük a részvételt!", en: "Thank you for participating!" },
    doneBody: { hu: "A válaszaid sikeresen elmentésre kerültek.", en: "Your answers were saved successfully." },
    doneSignedInHint: { hu: "A meghívóid és eredményeid a dashboardon elérhetőek.", en: "Your invites and results are available on your dashboard." },
    doneSignedOutHint: { hu: "Szeretnél te is részt venni a kutatásban? Regisztrálj, vagy jelentkezz be, ha már van fiókod.", en: "Want to take the test yourself? Sign up, or sign in if you already have an account." },
    signInCta: { hu: "Bejelentkezés", en: "Sign in" },
    signUpCta: { hu: "Regisztráció", en: "Sign up" },
    goDashboard: { hu: "Ugrás a dashboardra", en: "Go to dashboard" },
    selectBothFields: { hu: "Kérjük, válassz kapcsolatot és időtartamot a folytatáshoz.", en: "Please select a relationship and duration to continue." },
  },
  userMenu: {
    profileFallback: { hu: "Profil", en: "Profile" },
    profile: { hu: "Profilom", en: "My profile" },
    greetingPrefix: { hu: "Szia, ", en: "Hi, " },
    participant: { hu: "Kutatási résztvevő", en: "Research participant" },
    coach: { hu: "HR & Csapat", en: "HR & Team" },
    coachDashboard: { hu: "HR & Csapat felület", en: "HR & Team dashboard" },
    teams: { hu: "Csapataim", en: "My Teams" },
    research: { hu: "Kutatási státusz", en: "Research status" },
    settings: { hu: "Beállítások", en: "Settings" },
    closePanel: { hu: "Panel bezárása", en: "Close panel" },
    becomeCoach: { hu: "Coach-ként csatlakozz", en: "Become a coach" },
  },
  becomeCoach: {
    tag: { hu: "Coach program", en: "Coach program" },
    title: { hu: "Csatlakozz coach-ként", en: "Become a coach on Trita" },
    subtitle: {
      hu: "Segíts ügyfeleidnek mélyebben megismerni önmagukat érvényes személyiségadatok és AI-támogatott debrief segítségével.",
      en: "Help your clients understand themselves more deeply with validated personality data and AI-powered debriefs.",
    },
    featuresTitle: { hu: "Mit kapsz?", en: "What you get" },
    feature1Title: { hu: "Ügyfélkezelés", en: "Client management" },
    feature1Body: {
      hu: "Áttekintheted ügyfeleid személyiségprofilját, önértékeléseit és a mások visszajelzéseivel való összevetést egyetlen felületen.",
      en: "View your clients' personality profiles, self-assessments, and observer comparisons in one place.",
    },
    feature2Title: { hu: "AI-generált debrief", en: "AI-generated debrief" },
    feature2Body: {
      hu: "Minden ügyfélhez egy személyre szabott coaching összefoglaló készül, amely az erősségeket, fejlesztési területeket és konkrét kérdéseket tartalmaz.",
      en: "A personalized coaching debrief is generated for each client, covering strengths, development areas, and targeted coaching questions.",
    },
    feature3Title: { hu: "Önismeret vs. mások képe", en: "Self-image vs. how others see them" },
    feature3Body: {
      hu: "A platformon belüli observer mechanizmus segítségével ügyfeleid visszajelzést kérhetnek ismerőseiktől, amit te is láthatsz.",
      en: "Through the built-in observer mechanism, your clients can collect peer feedback that you can also review.",
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
      hu: "Miért szeretnél coach-ként csatlakozni a Tritához? Hogyan tudnád hasznosítani a platformot az ügyfeleid számára?",
      en: "Why do you want to join Trita as a coach? How would you use the platform with your clients?",
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
  profile: {
    title: { hu: "Profilom", en: "My profile" },
    subtitle: { hu: "Itt szerkesztheted az adataidat, és törölheted a fiókodat.", en: "Here you can edit your basic data and delete your account." },
    researchTag: { hu: "Kutatási fázis", en: "Research phase" },
    researchBody: {
      hu: "Az adataid anonimizált formában kerülnek elemzésre a módszertan fejlesztéséhez.",
      en: "Your data is analyzed in anonymized form to improve the methodology.",
    },
    participationTitle: { hu: "Részvételi állapot", en: "Participation status" },
    participationBody: {
      hu: "Kövesd, hol tartasz a kitöltés és visszajelzések folyamatában.",
      en: "Track your progress in the assessment and feedback flow.",
    },
    statusProfile: { hu: "Profil", en: "Profile" },
    statusTest: { hu: "Teszt", en: "Assessment" },
    statusFeedback: { hu: "Visszajelzések", en: "Feedback" },
    statusDone: { hu: "Kész", en: "Done" },
    statusInProgress: { hu: "Folyamatban", en: "In progress" },
    statusNotStarted: { hu: "Nincs elkezdve", en: "Not started" },
    statusWaiting: { hu: "Várakozás", en: "Waiting" },
    statusRequested: { hu: "Kikérve", en: "Requested" },
    statusReceived: { hu: "Érkezett", en: "Received" },
    saveBarLabel: { hu: "Változtatások", en: "Changes" },
    saveBarUnsaved: { hu: "Nem mentett módosítások", en: "Unsaved changes" },
    saveBarSaved: { hu: "Mentve", en: "Saved" },
    saveChanges: { hu: "Változtatások mentése", en: "Save changes" },
    missingEmail: { hu: "nincs megadva", en: "not set" },
    saveSuccess: { hu: "A profil frissítve lett.", en: "Profile updated." },
    saveError: { hu: "Nem sikerült frissíteni a profilt.", en: "Could not update profile." },
    localeTitle: { hu: "Nyelv", en: "Language" },
    localeBody: {
      hu: "Ezen a nyelven jelenik meg az oldal és az eredményed.",
      en: "Your pages and results will appear in this language.",
    },
    localeAutoHint: {
      hu: "Ha még nincs beállítva, a böngésző nyelvét használjuk.",
      en: "If not set yet, we use your browser language.",
    },
    localePending: {
      hu: "A nyelvválasztás mentésre vár.",
      en: "Language change is waiting to be saved.",
    },
    localeSaved: {
      hu: "Nyelv mentve",
      en: "Language saved",
    },
    deleteTitle: { hu: "Fiók törlése", en: "Delete account" },
    deleteBody: { hu: "A fiókod véglegesen törlődik, és nem állítható vissza.", en: "Your account will be permanently deleted and cannot be restored." },
    deleteLoadingNote: { hu: "Ez eltarthat egy pillanatig...", en: "This may take a moment..." },
    deleteError: { hu: "Nem sikerült törölni a profilt.", en: "Could not delete profile." },
    confirmTitle: { hu: "Fiók törlése", en: "Delete account" },
    confirmBody: { hu: "Biztosan törlöd a profilodat? Ez nem visszavonható.", en: "Are you sure you want to delete your profile? This cannot be undone." },
    modalConfirm: { hu: "Törlés", en: "Delete" },
    modalCancel: { hu: "Mégse", en: "Cancel" },
    demographicsTitle: { hu: "Személyes adatok", en: "Personal details" },
    demographicsBody: {
      hu: "Ezeket az adatokat a kutatáshoz használjuk. Bármikor módosíthatod.",
      en: "These details are used for research purposes. You can update them any time.",
    },
    demographicsSaveSuccess: {
      hu: "Személyes adatok frissítve.",
      en: "Personal details updated.",
    },
  },
  error: {
    NO_TEST_TYPE: {
      hu: "Nincs hozzárendelt teszttípusod. Előbb töltsd ki a tesztet.",
      en: "No test type assigned yet. Complete the test first.",
    },
    INVITE_LIMIT_REACHED: {
      hu: "Elérted a maximális (5) meghívó limitet.",
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
    INVALID_TEST_TYPE: {
      hu: "Ez a teszt már nem elérhető.",
      en: "This test is no longer available.",
    },
    ANSWER_COUNT_MISMATCH: {
      hu: "A válaszok száma nem egyezik a kérdések számával.",
      en: "The number of answers does not match the number of questions.",
    },
    DUPLICATE_ANSWER: {
      hu: "Duplikált válasz érkezett ugyanarra a kérdésre.",
      en: "Duplicate answer received for the same question.",
    },
    MISSING_ANSWER: {
      hu: "Hiányzik válasz egy kérdésre.",
      en: "An answer is missing for a question.",
    },
    INVALID_LIKERT_ANSWER: {
      hu: "Érvénytelen Likert válasz.",
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
      hu: "Érvénytelen dimenzió kód.",
      en: "Invalid dimension code.",
    },
  },
  onboarding: {
    progress: {
      hu: "Kitöltve: {completed}/{total}",
      en: "Completed: {completed}/{total}",
    },
    title: {
      hu: "Személyes adatok",
      en: "Personal details",
    },
    subtitle: {
      hu: "Ezek az adatok kizárólag kutatási célra szolgálnak és bizalmasan kezeljük őket.",
      en: "This data is used exclusively for research purposes and handled confidentially.",
    },
    blockBasicsTitle: {
      hu: "Alapadatok",
      en: "Basic details",
    },
    blockBasicsHint: {
      hu: "Rövid személyes alapinformációk",
      en: "Short personal background details",
    },
    blockEducationTitle: {
      hu: "Tanulmányok",
      en: "Education",
    },
    blockEducationHint: {
      hu: "Legmagasabb végzettség",
      en: "Highest completed level",
    },
    blockStatusTitle: {
      hu: "Jelenlegi státusz",
      en: "Current status",
    },
    blockStatusHint: {
      hu: "Munka és/vagy tanulás jelenlegi helyzete",
      en: "Your current work and/or study situation",
    },
    usernameLabel: {
      hu: "Hogy szólíthatunk?",
      en: "What should we call you?",
    },
    usernamePlaceholder: {
      hu: "pl. Anna",
      en: "e.g. Anna",
    },
    birthYearLabel: {
      hu: "Születési év",
      en: "Birth year",
    },
    birthYearPlaceholder: {
      hu: "pl. 1995",
      en: "e.g. 1995",
    },
    genderLabel: {
      hu: "Nem",
      en: "Gender",
    },
    genderMale: {
      hu: "Férfi",
      en: "Male",
    },
    genderFemale: {
      hu: "Nő",
      en: "Female",
    },
    genderOther: {
      hu: "Egyéb",
      en: "Other",
    },
    genderPreferNot: {
      hu: "Nem válaszolok",
      en: "Prefer not to say",
    },
    educationLabel: {
      hu: "Iskolai végzettség",
      en: "Education level",
    },
    educationPrimary: {
      hu: "Általános iskola",
      en: "Primary school",
    },
    educationSecondary: {
      hu: "Középiskolai érettségi",
      en: "High school diploma",
    },
    educationBachelor: {
      hu: "Alapképzés (BSc/BA)",
      en: "Bachelor's degree",
    },
    educationMaster: {
      hu: "Mesterképzés (MSc/MA)",
      en: "Master's degree",
    },
    educationDoctorate: {
      hu: "Doktori fokozat (PhD)",
      en: "Doctoral degree",
    },
    educationOther: {
      hu: "Egyéb",
      en: "Other",
    },
    occupationStatusLabel: {
      hu: "Foglalkozási helyzet",
      en: "Employment situation",
    },
    occupationStatusWorking: {
      hu: "Dolgozom",
      en: "Working",
    },
    occupationStatusStudying: {
      hu: "Tanulok",
      en: "Studying",
    },
    occupationStatusWorkingAndStudying: {
      hu: "Dolgozom és tanulok",
      en: "Working and studying",
    },
    occupationStatusNeither: {
      hu: "Jelenleg egyik sem",
      en: "Currently neither",
    },
    occupationStatusUnemployed: {
      hu: "Munkanélküli / álláskereső",
      en: "Unemployed / job seeking",
    },
    occupationStatusPreferNotToSay: {
      hu: "Nem szeretném megadni",
      en: "Prefer not to say",
    },
    workScheduleLabel: {
      hu: "Milyen munkarendben dolgozol?",
      en: "What is your work arrangement?",
    },
    workScheduleFullTime: {
      hu: "Teljes munkaidő",
      en: "Full-time",
    },
    workSchedulePartTime: {
      hu: "Részmunkaidő",
      en: "Part-time",
    },
    workScheduleContractor: {
      hu: "Vállalkozó",
      en: "Contractor / self-employed",
    },
    workScheduleOther: {
      hu: "Egyéb",
      en: "Other",
    },
    companySizeLabel: {
      hu: "Mekkora cégnél dolgozol?",
      en: "What is your company size?",
    },
    companySizeMicro: {
      hu: "1-9 fő",
      en: "1-9 employees",
    },
    companySizeSmall: {
      hu: "10-49 fő",
      en: "10-49 employees",
    },
    companySizeMedium: {
      hu: "50-249 fő",
      en: "50-249 employees",
    },
    companySizeLarge: {
      hu: "250-999 fő",
      en: "250-999 employees",
    },
    companySizeEnterprise: {
      hu: "1000+ fő",
      en: "1000+ employees",
    },
    companySizeNotSure: {
      hu: "Nem tudom",
      en: "Not sure",
    },
    studyLevelLabel: {
      hu: "Képzési szint",
      en: "Study level",
    },
    studyLevelSecondarySchool: {
      hu: "Középiskola",
      en: "Secondary school",
    },
    studyLevelBachelor: {
      hu: "Alapképzés",
      en: "Bachelor",
    },
    studyLevelMaster: {
      hu: "Mesterképzés",
      en: "Master",
    },
    studyLevelDoctoral: {
      hu: "Doktori",
      en: "Doctoral",
    },
    studyLevelOther: {
      hu: "Egyéb",
      en: "Other",
    },
    unemploymentDurationLabel: {
      hu: "Mióta vagy álláskereső?",
      en: "How long have you been job seeking?",
    },
    unemploymentDuration0To3: {
      hu: "0-3 hónap",
      en: "0-3 months",
    },
    unemploymentDuration3To12: {
      hu: "3-12 hónap",
      en: "3-12 months",
    },
    unemploymentDuration1Plus: {
      hu: "1+ év",
      en: "1+ year",
    },
    unemploymentDurationOptionalHint: {
      hu: "Opcionális",
      en: "Optional",
    },
    countryLabel: {
      hu: "Ország",
      en: "Country",
    },
    countryPlaceholder: {
      hu: "Keresés...",
      en: "Search...",
    },
    submit: {
      hu: "Tovább a teszthez",
      en: "Continue to assessment",
    },
    saving: {
      hu: "Mentés...",
      en: "Saving...",
    },
    usernameError: {
      hu: "A névnek 2-20 karakter hosszúnak kell lennie",
      en: "Name must be 2-20 characters long",
    },
    birthYearError: {
      hu: "Az életkornak 16-100 év közé kell esnie",
      en: "Age must be between 16-100 years",
    },
    validationError: {
      hu: "Kérlek javítsd a következő hibákat:",
      en: "Please correct the following errors:",
    },
    usernameHint: {
      hu: "2-20 karakter",
      en: "2-20 characters",
    },
    birthYearHint: {
      hu: "16-100 év között",
      en: "Age 16-100",
    },
    validRangeLabel: {
      hu: "Érvényes tartomány",
      en: "Valid range",
    },
    errorGeneric: {
      hu: "Hiba történt. Próbáld újra!",
      en: "Something went wrong. Please try again.",
    },
    consentLabel: {
      hu: "Elolvastam és elfogadom: {link}",
      en: "I have read and accept the {link}",
    },
    consentLinkText: {
      hu: "Adatvédelmi tájékoztató",
      en: "Privacy Policy",
    },
    optional: {
      hu: "opcionális",
      en: "optional",
      de: "optional",
    },
    footerHint: {
      hu: "Ezeket az adatokat bármikor módosíthatod a profil oldalon.",
      en: "You can update these details at any time from your profile.",
      de: "Diese Angaben können jederzeit in deinem Profil geändert werden.",
    },
  },
  privacy: {
    title: {
      hu: "Adatvédelmi tájékoztató",
      en: "Privacy Policy",
    },
    lastUpdated: {
      hu: "Utoljára frissítve: 2026. február",
      en: "Last updated: February 2026",
    },
    introTitle: {
      hu: "Bevezetés",
      en: "Introduction",
    },
    introBody: {
      hu: "A Trita egy egyetemi kutatási projekt, amely személyiségtesztek (HEXACO, Big Five) összehasonlítását végzi önértékelés és ismerősi visszajelzés alapján. Ez a tájékoztató ismerteti, hogyan gyűjtjük, kezeljük és védjük az adataidat.",
      en: "Trita is a university research project that compares personality assessments (HEXACO, Big Five) using self-ratings and feedback from others. This policy describes how we collect, process, and protect your data.",
    },
    dataCollectedTitle: {
      hu: "Milyen adatokat gyűjtünk?",
      en: "What data do we collect?",
    },
    dataAuth: {
      hu: "Fiókadatok: email cím, hitelesítési adatok (Clerk szolgáltatáson keresztül), Google fiók azonosító (ha Google bejelentkezést használsz).",
      en: "Account data: email address, authentication data (via Clerk), Google account identifier (if you use Google sign-in).",
    },
    dataDemographic: {
      hu: "Demográfiai adatok: felhasználónév, születési év, nem, végzettség, ország, jelenlegi státusz (munka/tanulás), munkarend, cégméret, képzési szint, munkanélküliség időtartama.",
      en: "Demographic data: username, birth year, gender, education level, country, current status (work/study), work arrangement, company size, study level, unemployment duration.",
    },
    dataAssessment: {
      hu: "Tesztadatok: személyiségteszt válaszok, számított pontszámok, ismerősi értékelések, valamint az eredmények utáni kutatási kérdőív (korábbi teszttapasztalat, munkakörülmények, motiváció stb.).",
      en: "Assessment data: personality test answers, calculated scores, ratings from others, and the post-results research survey (prior test experience, work context, motivation, etc.).",
    },
    dataTechnical: {
      hu: "Technikai adatok: nyelvi beállítás (cookie), munkamenet-azonosítók, anonimizált látogatottsági statisztikák (Vercel Analytics, süti nélküli).",
      en: "Technical data: language preference (cookie), session identifiers, anonymized usage statistics (Vercel Analytics, without cookies).",
    },
    purposeTitle: {
      hu: "Mire használjuk az adatokat?",
      en: "How do we use your data?",
    },
    purposeResearch: {
      hu: "Tudományos kutatás: a személyiségteszt-modellek összehasonlítása egyetemi szakdolgozat keretében. A kutatási eredmények kizárólag anonimizált, aggregált formában kerülnek publikálásra.",
      en: "Scientific research: comparing personality assessment models as part of a university thesis. Research results are published exclusively in anonymized, aggregated form.",
    },
    purposeService: {
      hu: "Szolgáltatás működtetése: a teszt kitöltése, eredmények megjelenítése, ismerősi meghívók kezelése.",
      en: "Service operation: delivering the assessment, displaying results, managing invitations.",
    },
    cookiesTitle: {
      hu: "Cookie-k",
      en: "Cookies",
    },
    cookiesBody: {
      hu: "Kizárólag technikailag szükséges cookie-kat használunk: munkamenet-kezeléshez (Clerk hitelesítés) és nyelvi beállításhoz. Nem használunk marketing vagy nyomkövető sütiket. A Vercel Analytics sütiket nem alkalmaz.",
      en: "We only use technically necessary cookies: for session management (Clerk authentication) and language preference. We do not use marketing or tracking cookies. Vercel Analytics operates without cookies.",
    },
    storageTitle: {
      hu: "Adattárolás",
      en: "Data storage",
    },
    storageBody: {
      hu: "Az adatokat biztonságos, titkosított PostgreSQL adatbázisban tároljuk (Neon). A hitelesítési adatokat a Clerk kezeli, amely az iparági sztenderdeknek megfelelő biztonsági intézkedéseket alkalmaz.",
      en: "Data is stored in a secure, encrypted PostgreSQL database (Neon). Authentication data is managed by Clerk, which applies industry-standard security measures.",
    },
    analyticsTitle: {
      hu: "Látogatottság mérése",
      en: "Usage analytics",
    },
    analyticsBody: {
      hu: "A Trita a Vercel Analytics és a Vercel Speed Insights szolgáltatásokat használja a látogatottság és a betöltési teljesítmény méréséhez. Ezek a szolgáltatások sütiket nem alkalmaznak. Az IP-cím rövid idejű, anonimizált hash formájában kerül feldolgozásra az egyedi látogatók megkülönböztetéséhez, és személyes adatként nem kerül hosszú távon tárolásra. A mért adatok kizárólag aggregált forgalmi statisztikákra és Core Web Vitals mutatókra korlátozódnak.",
      en: "Trita uses Vercel Analytics and Vercel Speed Insights to measure site traffic and loading performance. These services do not use cookies. IP addresses are processed briefly in anonymized, hashed form to distinguish unique visitors and are not stored as personal data long-term. The collected data is limited to aggregated traffic statistics and Core Web Vitals metrics.",
    },
    processorsTitle: {
      hu: "Adatfeldolgozók",
      en: "Data processors",
    },
    processorsClerk: {
      hu: "Clerk (clerk.com) – hitelesítés és munkamenet-kezelés. Az EU/US adatvédelmi keretrendszerek (EU–U.S. Data Privacy Framework) szerint működik.",
      en: "Clerk (clerk.com) – authentication and session management. Operates under EU/US data protection frameworks (EU–U.S. Data Privacy Framework).",
    },
    processorsNeon: {
      hu: "Neon (neon.tech) – PostgreSQL adatbázis-tárhely, amelyen a felhasználói és kutatási adatok tárolódnak. Adatközpontok az EU-ban.",
      en: "Neon (neon.tech) – PostgreSQL database hosting where user and research data is stored. Data centres within the EU.",
    },
    processorsVercel: {
      hu: "Vercel (vercel.com) – alkalmazás-tárhely és anonimizált forgalomstatisztikák (Vercel Analytics). A Vercel DPA (adatfeldolgozói megállapodás) elfogadva.",
      en: "Vercel (vercel.com) – application hosting and anonymized traffic statistics (Vercel Analytics). Vercel DPA (data processing agreement) accepted.",
    },
    processorsResend: {
      hu: "Resend (resend.com) – tranzakciós e-mailek küldése (pl. ismerősi meghívók). Az e-mail-cím kizárólag az üzenet kézbesítéséhez kerül továbbításra.",
      en: "Resend (resend.com) – transactional email delivery (e.g. invitations). Email addresses are shared solely for message delivery.",
    },
    rightsTitle: {
      hu: "A jogaid",
      en: "Your rights",
    },
    rightsAccess: {
      hu: "Hozzáférés: megtekintheted adataidat a profiloldaladon.",
      en: "Access: you can view your data on your profile page.",
    },
    rightsDeletion: {
      hu: "Törlés: bármikor törölheted a profilodat és az összes hozzárendelt adatot a profiloldaladon.",
      en: "Deletion: you can delete your profile and all associated data at any time from your profile page.",
    },
    rightsWithdraw: {
      hu: "Hozzájárulás visszavonása: a profil törlésével visszavonod a hozzájárulásodat. A már anonimizált kutatási adatok nem törölhetők.",
      en: "Withdrawal of consent: deleting your profile withdraws your consent. Already anonymized research data cannot be deleted.",
    },
    contactTitle: {
      hu: "Kapcsolat",
      en: "Contact",
    },
    contactBody: {
      hu: "Adatvédelmi kérdésekkel kapcsolatban írj az info@trita.io címre.",
      en: "For privacy-related questions, contact us at info@trita.io.",
    },
  },
  admin: {
    title: { hu: "Admin Dashboard", en: "Admin Dashboard" },
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
    avgAge: { hu: "Átlag életkor", en: "Avg age" },
    medianAge: { hu: "Medián életkor", en: "Median age" },
    ageRange: { hu: "Kor tartomány", en: "Age range" },
  },
  comparison: {
    title: { hu: "Mások rólad", en: "Others about you" },
    body: { hu: "Önértékelésed és az értékelők ({count} fő) átlagának összehasonlítása.", en: "Comparison of your self-rating and the average from the people you invited ({count} people)." },
    similar: { hu: "hasonló", en: "similar" },
    diffHigher: { hu: "+{diff} pont (mások magasabbra értékelnek)", en: "+{diff} pts (others rate you higher)" },
    diffLower: { hu: "{diff} pont (mások alacsonyabbra értékelnek)", en: "{diff} pts (others rate you lower)" },
    pointsUnitShort: { hu: "pont", en: "pts" },
    self: { hu: "Te", en: "You" },
    others: { hu: "Mások", en: "Others" },
    othersCount: { hu: "Mások ({count})", en: "Others ({count})" },
    avgConfidence: { hu: "átl. magabiztosság: {value}/5", en: "avg. confidence: {value}/5" },
    typeLabel: { hu: "Típusod", en: "Your type" },
    confidenceLabel: { hu: "Átl. magabiztosság", en: "Avg. confidence" },
    observersLabel: { hu: "Értékelők", en: "Raters" },
    insightHigher: { hu: "Mások magasabbra értékelnek ebben a dimenzióban, mint te magad.", en: "Others rate you higher in this dimension than you rate yourself." },
    insightLower: { hu: "Te magasabbra értékeled magad ebben a dimenzióban, mint ahogy mások látnak.", en: "You rate yourself higher in this dimension than others rate you." },
    facetMapTitle: { hu: "Alskálák összehasonlítása", en: "Sub-scale comparison" },
    facetMapSubtitle: { hu: "Facetek és aspektusok, az eltérés mértéke szerint rendezve. A különbség: (mások átlaga) − (te).", en: "Facets and aspects sorted by absolute divergence. Difference is (others' average) − (you)." },
    heatmapMatch: { hu: "Közel azonos", en: "Close match" },
    heatmapObsHigher: { hu: "Mások magasabbra értékelnek", en: "Others rate higher" },
    heatmapSelfHigher: { hu: "Te értékeled magasabbra", en: "You rate higher" },
    deltaDirectionMatch: { hu: "Közel azonos értékelés", en: "Ratings are close" },
    deltaDirectionHigher: { hu: "Mások itt magasabbra értékelnek, mint te.", en: "Others rate this higher than you do." },
    deltaDirectionLower: { hu: "Te itt magasabbra értékeled magad, mint az értékelők.", en: "You rate yourself higher here than others do." },
    showAll: { hu: "Összes megjelenítése", en: "Show all" },
    showLess: { hu: "Csak a legnagyobb eltérések", en: "Show only largest gaps" },
    anonGateTitle: { hu: "Az összehasonlítás hamarosan elérhető", en: "Comparison almost ready" },
    anonGateBody: { hu: "A névtelenség védelme érdekében legalább 2 visszajelzés szükséges az eredmények megjelenítéséhez.", en: "To protect privacy, comparisons are shown only after at least 2 responses." },
    anonGateProgress: { hu: "{count} / 2 visszajelzés megérkezett.", en: "{count} / 2 responses received." },
    anonGateCta: { hu: "Meghívók kezelése", en: "Manage invitations" },
    nextActionTitle: { hu: "Mi legyen a következő lépés?", en: "What next?" },
    nextActionBody: { hu: "Ha szeretnéd, kérhetsz még visszajelzést, vagy kitöltheted a rövid kutatási kérdőívet.", en: "If you’d like, you can request more feedback or fill out the short research survey." },
    nextActionBodyNoSurvey: { hu: "Ha szeretnéd, kérhetsz még visszajelzést.", en: "If you’d like, you can request more feedback." },
    nextActionInvite: { hu: "Kérek még visszajelzést", en: "Request more feedback" },
    nextActionSurvey: { hu: "Kitöltöm a kérdőívet", en: "Fill out the survey" },
  },
} as const;

function resolvePath(path: string): LocaleRecord | undefined {
  const parts = path.split(".");
  let current: unknown = translations;
  for (const part of parts) {
    if (!current || typeof current !== "object" || !(part in (current as Record<string, unknown>))) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  if (!current || typeof current !== "object") return undefined;
  return current as LocaleRecord;
}

export function t(key: string, locale: Locale): string {
  const record = resolvePath(key);
  if (!record) return key;
  return record[locale] ?? record[DEFAULT_LOCALE] ?? key;
}

export function tf(
  key: string,
  locale: Locale,
  vars: Record<string, string | number>
): string {
  const template = t(key, locale);
  return template.replace(/\{(\w+)\}/g, (_, name: string) => {
    const value = vars[name];
    return value == null ? `{${name}}` : String(value);
  });
}

export function normalizeLocale(value?: string | null): Locale {
  if (!value) return DEFAULT_LOCALE;
  const lower = value.toLowerCase();
  if (lower.startsWith("hu")) return "hu";
  if (lower.startsWith("en")) return "en";
  return DEFAULT_LOCALE;
}
