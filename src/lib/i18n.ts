export type Locale = "hu" | "en" | "de";

export const SUPPORTED_LOCALES: Locale[] = ["hu", "en", "de"];
export const DEFAULT_LOCALE: Locale = "hu";

type LocaleRecord = Record<Locale, string>;

const translations = {
  meta: {
    title: {
      hu: "Trita - Szemelyisegteszt kutatas",
      en: "Trita - Personality Assessment Research",
      de: "Trita - Personlichkeitstest-Forschung",
    },
    description: {
      hu: "Toltsd ki a szemelyisegtesztet es hasonlitsd ossze onertekelesed masok visszajelzeseivel. Tudomanyos kutatas kereteben.",
      en: "Complete a personality test and compare your self-assessment with peer feedback. Part of an academic research study.",
      de: "Fulle einen Personlichkeitstest aus und vergleiche deine Selbsteinschatzung mit Feedback anderer. Teil einer wissenschaftlichen Studie.",
    },
    assessmentTitle: {
      hu: "Teszt kitoltese | Trita",
      en: "Take the test | Trita",
      de: "Test ausfuellen | Trita",
    },
    dashboardTitle: {
      hu: "Dashboard | Trita",
      en: "Dashboard | Trita",
      de: "Dashboard | Trita",
    },
    observeTitle: {
      hu: "Megfigyeloi ertekeles | Trita",
      en: "Observer assessment | Trita",
      de: "Beobachterbewertung | Trita",
    },
    onboardingTitle: {
      hu: "Szemelyes adatok | Trita",
      en: "Personal details | Trita",
      de: "Persoenliche Daten | Trita",
    },
  },
  nav: {
    home: { hu: "Fooldal", en: "Home", de: "Startseite" },
    dashboard: { hu: "Dashboard", en: "Dashboard", de: "Dashboard" },
    signIn: { hu: "Bejelentkezes", en: "Sign in", de: "Anmelden" },
    menu: { hu: "Menu", en: "Menu", de: "Menue" },
  },
  common: {
    or: { hu: "vagy", en: "or", de: "oder" },
    emailMissing: {
      hu: "Email cim nincs beallitva.",
      en: "No email address set.",
      de: "Keine E-Mail-Adresse gesetzt.",
    },
    anonymous: { hu: "anonim", en: "anonymous", de: "anonym" },
    userFallback: { hu: "Felhasznalo", en: "User", de: "Nutzer" },
    inviterFallback: { hu: "Ismeros", en: "Contact", de: "Kontakt" },
    someone: { hu: "Valaki", en: "Someone", de: "Jemand" },
    statusCompleted: { hu: "Kitoltve", en: "Completed", de: "Abgeschlossen" },
    statusPending: { hu: "Fuggoben", en: "Pending", de: "Ausstehend" },
    statusCanceled: { hu: "Torolve", en: "Canceled", de: "Storniert" },
    statusExpired: { hu: "Lejart", en: "Expired", de: "Abgelaufen" },
  },
  locale: {
    label: { hu: "Nyelv", en: "Language", de: "Sprache" },
    hu: { hu: "Magyar", en: "Hungarian", de: "Ungarisch" },
    en: { hu: "Angol", en: "English", de: "Englisch" },
    de: { hu: "Nemet", en: "German", de: "Deutsch" },
  },
  actions: {
    startTest: { hu: "Teszt kitoltese", en: "Start test", de: "Test starten" },
    next: { hu: "Kovetkezo ->", en: "Next ->", de: "Weiter ->" },
    prev: { hu: "<- Elozo", en: "<- Previous", de: "<- Zuruck" },
    save: { hu: "Mentes...", en: "Saving...", de: "Speichern..." },
    viewResults: { hu: "Eredmenyek megtekintese", en: "View results", de: "Ergebnisse ansehen" },
    submit: { hu: "Kuldes", en: "Submit", de: "Senden" },
    copyLink: { hu: "Link masolasa", en: "Copy link", de: "Link kopieren" },
    delete: { hu: "Torles", en: "Delete", de: "Loschen" },
    openFill: { hu: "Kitoltes megnyitasa", en: "Open assessment", de: "Ausfullen offnen" },
    generate: { hu: "Generalas...", en: "Generating...", de: "Wird erstellt..." },
    newInviteLink: { hu: "Uj meghivo link", en: "New invite link", de: "Neuer Einladungslink" },
    emailInvite: { hu: "Meghivas emailben", en: "Invite by email", de: "Per E-Mail einladen" },
    signOut: { hu: "Kijelentkezes", en: "Sign out", de: "Abmelden" },
    saveShort: { hu: "Mentes", en: "Save", de: "Speichern" },
    deleting: { hu: "Torles...", en: "Deleting...", de: "Wird geloscht..." },
    deleteProfile: { hu: "Profil torlese", en: "Delete profile", de: "Profil loschen" },
    signInCta: { hu: "Bejelentkezes", en: "Sign in", de: "Anmelden" },
    signUpCta: { hu: "Regisztracio", en: "Sign up", de: "Registrieren" },
    goDashboard: { hu: "Ugras a dashboardra", en: "Go to dashboard", de: "Zum Dashboard" },
    verify: { hu: "Megerosites", en: "Verify", de: "Bestatigen" },
    verifying: { hu: "Ellenorzes...", en: "Verifying...", de: "Wird gepruft..." },
    backToSignUp: {
      hu: "Vissza a regisztraciohoz",
      en: "Back to sign up",
      de: "Zuruck zur Registrierung",
    },
  },
  landing: {
    heroTag: { hu: "Egyetemi kutatas", en: "University research", de: "Universitatsforschung" },
    heroTitle: {
      hu: "Segits osszehasonlitani a szemelyisegteszteket",
      en: "Help compare personality assessments",
      de: "Hilf beim Vergleich von Personlichkeitstests",
    },
    heroTitleLine1: {
      hu: "Segits osszehasonlitani",
      en: "Help compare",
      de: "Hilf beim Vergleich von",
    },
    heroTitleLine2: {
      hu: "a szemelyisegteszteket",
      en: "personality assessments",
      de: "Personlichkeitstests",
    },
    statsLanguages: { hu: "nyelv", en: "languages", de: "Sprachen" },
    heroBody: {
      hu: "Ez a felulet egy szakdolgozat kutatasahoz keszult. Celunk a HEXACO es Big Five modellek osszehasonlitasa onertekeles es ismerosi visszajelzes alapjan.",
      en: "This platform supports a thesis study. Our goal is to compare HEXACO and Big Five using self-ratings and observer feedback.",
      de: "Diese Plattform unterstutzt eine Abschlussarbeit. Ziel ist der Vergleich von HEXACO und Big Five auf Basis von Selbst- und Fremdeinschatzungen.",
    },
    joinResearch: { hu: "Reszvetel a kutatasban", en: "Join the research", de: "An der Studie teilnehmen" },
    openDashboard: { hu: "Dashboard megnyitasa", en: "Open dashboard", de: "Dashboard offnen" },
    signIn: { hu: "Bejelentkezes", en: "Sign in", de: "Anmelden" },
    estimatedTime: {
      hu: "Becsult idotartam: kb. 10-15 perc. Az eredmenyek anonimizaltan kerulnek felhasznalasra.",
      en: "Estimated time: about 10-15 minutes. Results are used in anonymized form.",
      de: "Geschaftzte Dauer: ca. 10-15 Minuten. Ergebnisse werden anonymisiert verwendet.",
    },
    researchAboutTitle: { hu: "Mirol szol a kutatas?", en: "What is this research about?", de: "Worum geht es in der Studie?" },
    researchAboutBody: {
      hu: "Tobbfajta szemelyisegteszt hatekonysagat hasonlitjuk ossze onertekelessel es ismerosi visszajelzessel.",
      en: "We compare multiple personality models using self-assessment and observer feedback.",
      de: "Wir vergleichen mehrere Personlichkeitsmodelle anhand von Selbst- und Fremdeinschatzungen.",
    },
    researchItem1: {
      hu: "Teszttipusok: HEXACO, modositott HEXACO, Big Five",
      en: "Test types: HEXACO, modified HEXACO, Big Five",
      de: "Testtypen: HEXACO, modifiziertes HEXACO, Big Five",
    },
    researchItem2: {
      hu: "Veletlenszeru kiosztas - mindenki 1 tesztet kap",
      en: "Balanced random assignment - each user gets 1 test",
      de: "Ausgewogene Zufallszuweisung - jede Person erhalt 1 Test",
    },
    researchItem3: {
      hu: "Ismerosi visszajelzes osszehasonlitas",
      en: "Observer comparison",
      de: "Vergleich mit Fremdeinschatzungen",
    },
    aboutTag: { hu: "A kutatasrol", en: "About the research", de: "Uber die Studie" },
    aboutTitle: { hu: "3 teszt, 1 kerdes", en: "3 tests, 1 question", de: "3 Tests, 1 Frage" },
    aboutBody: {
      hu: "Melyik szemelyisegteszt ad pontosabb kepet? Segits kideriteni a sajat kitolteseddel.",
      en: "Which personality model gives a more accurate picture? Help us find out with your own answers.",
      de: "Welches Modell liefert ein genaueres Bild? Hilf mit deiner Teilnahme bei der Antwort.",
    },
    testTypes: { hu: "teszttipus", en: "test types", de: "Testtypen" },
    completionTime: { hu: "kitoltesi ido", en: "completion time", de: "Ausfullzeit" },
    completionTimeValue: { hu: "~15 perc", en: "~15 min", de: "~15 Min." },
    howTag: { hu: "Hogyan mukodik", en: "How it works", de: "So funktioniert es" },
    howTitle: { hu: "3 egyszeru lepes", en: "3 simple steps", de: "3 einfache Schritte" },
    step1Title: { hu: "Regisztralj", en: "Sign up", de: "Registriere dich" },
    step1Body: {
      hu: "Gyors regisztracio utan automatikusan kapsz egy szemelyisegtesztet.",
      en: "After a quick sign-up you are automatically assigned a personality test.",
      de: "Nach einer kurzen Registrierung bekommst du automatisch einen Test zugewiesen.",
    },
    step2Title: { hu: "Toltsd ki a tesztet", en: "Complete the test", de: "Full den Test aus" },
    step2Body: {
      hu: "Valaszolj oszinten a kerdesekre, az eredmenyed azonnal megjelenik a dashboardon.",
      en: "Answer honestly and see your result on the dashboard right away.",
      de: "Antworte ehrlich und sieh dein Ergebnis sofort im Dashboard.",
    },
    step3Title: { hu: "Hivj meg ismerosoket", en: "Invite observers", de: "Lade Beobachter ein" },
    step3Body: {
      hu: "Kerd meg ismeroseidet egy rovid ertekelesre, az osszehasonlitas anonim.",
      en: "Ask people who know you to complete a short assessment. Comparison stays anonymous.",
      de: "Bitte Personen aus deinem Umfeld um eine kurze Bewertung. Der Vergleich bleibt anonym.",
    },
    featuresTag: { hu: "Miert erdemes reszt venni", en: "Why participate", de: "Warum teilnehmen" },
    featuresTitle: { hu: "A kutatas elonyei szamodra", en: "Benefits for you", de: "Dein Nutzen" },
    feature1Title: { hu: "Tudomanyos hatter", en: "Scientific basis", de: "Wissenschaftliche Basis" },
    feature1Desc: {
      hu: "A HEXACO es Big Five modern szemelyisegmodellek - te is hozzajarulhatsz az osszehasonlitashoz.",
      en: "HEXACO and Big Five are modern personality models, and your input supports their comparison.",
      de: "HEXACO und Big Five sind moderne Modelle, und dein Beitrag hilft beim Vergleich.",
    },
    feature2Title: { hu: "Azonnali eredmeny", en: "Immediate result", de: "Sofortiges Ergebnis" },
    feature2Desc: {
      hu: "Kitoltes utan azonnal latod a reszletes profilod vizualis kiertekelessel.",
      en: "You get a detailed visual profile right after completion.",
      de: "Du erhaltst direkt nach dem Ausfullen ein visuelles Detailprofil.",
    },
    feature3Title: { hu: "Ismerosi visszajelzes", en: "Observer feedback", de: "Fremdeinschatzung" },
    feature3Desc: {
      hu: "Hivj meg ismerosoket es vesd ossze az onkeped masok visszajelzesevel.",
      en: "Invite observers and compare your self-view to external feedback.",
      de: "Lade Beobachter ein und vergleiche Selbst- mit Fremdbild.",
    },
    feature4Title: { hu: "Anonim adatkezeles", en: "Anonymous data handling", de: "Anonyme Datenverarbeitung" },
    feature4Desc: {
      hu: "Az adatok anonimizaltan kerulnek felhasznalasra. A profil barmikor torolheto.",
      en: "Data is processed in anonymized form. You can delete your profile any time.",
      de: "Daten werden anonymisiert verarbeitet. Du kannst dein Profil jederzeit loschen.",
    },
    feature5Title: { hu: "Mobilbarat elmeny", en: "Mobile-friendly", de: "Mobilfreundlich" },
    feature5Desc: {
      hu: "A kerdoiv telefonon is kenyelmesen kitoltheto kb. 10-15 perc alatt.",
      en: "The questionnaire works smoothly on mobile and takes about 10-15 minutes.",
      de: "Der Fragebogen ist mobil nutzbar und dauert etwa 10-15 Minuten.",
    },
    ctaTag: { hu: "Keszen allsz?", en: "Ready?", de: "Bereit?" },
    ctaTitle: { hu: "Vegyel reszt a kutatasban", en: "Take part in the research", de: "Nimm an der Studie teil" },
    ctaBody: {
      hu: "A reszvetel onkentes es ingyenes. Az eredmenyek anonimizaltan kerulnek feldolgozasra.",
      en: "Participation is voluntary and free. Results are processed anonymously.",
      de: "Die Teilnahme ist freiwillig und kostenlos. Ergebnisse werden anonym verarbeitet.",
    },
    ctaSignUp: { hu: "Regisztralok", en: "Create account", de: "Registrieren" },
    footer: { hu: "Egyetemi kutatasi projekt.", en: "University research project.", de: "Universitares Forschungsprojekt." },
  },
  auth: {
    signInTitle: { hu: "Bejelentkezes", en: "Sign in", de: "Anmelden" },
    signInSubtitle: { hu: "Jelentkezz be a Trita fiokodba", en: "Sign in to your Trita account", de: "Melde dich bei deinem Trita-Konto an" },
    signUpTitle: { hu: "Fiok letrehozasa", en: "Create account", de: "Konto erstellen" },
    signUpSubtitle: { hu: "Regisztralj, es ismerd meg magad a teszttel", en: "Sign up and discover your profile", de: "Registriere dich und entdecke dein Profil" },
    emailLabel: { hu: "Email cim", en: "Email", de: "E-Mail" },
    passwordLabel: { hu: "Jelszo", en: "Password", de: "Passwort" },
    passwordPlaceholder: { hu: "Jelszo", en: "Password", de: "Passwort" },
    passwordMinPlaceholder: { hu: "Legalabb 8 karakter", en: "At least 8 characters", de: "Mindestens 8 Zeichen" },
    submitSignIn: { hu: "Bejelentkezes", en: "Sign in", de: "Anmelden" },
    submitSignInLoading: { hu: "Bejelentkezes...", en: "Signing in...", de: "Anmeldung..." },
    submitSignUp: { hu: "Regisztracio", en: "Sign up", de: "Registrieren" },
    submitSignUpLoading: { hu: "Regisztracio...", en: "Signing up...", de: "Registrierung..." },
    googleContinue: { hu: "Folytatas Google fiokkal", en: "Continue with Google", de: "Mit Google fortfahren" },
    noAccount: { hu: "Nincs meg fiokod?", en: "No account yet?", de: "Noch kein Konto?" },
    hasAccount: { hu: "Van mar fiokod?", en: "Already have an account?", de: "Schon ein Konto?" },
    verifyTitle: { hu: "Email megerositese", en: "Verify email", de: "E-Mail bestaetigen" },
    verifySent: { hu: "Kuldtunk egy kodot a(z) {email} cimre", en: "We sent a code to {email}", de: "Wir haben einen Code an {email} gesendet" },
    verifyCodeLabel: { hu: "Megerosito kod", en: "Verification code", de: "Bestaetigungscode" },
    errorSignInFailed: { hu: "A bejelentkezes nem sikerult. Probald ujra.", en: "Sign in failed. Please try again.", de: "Anmeldung fehlgeschlagen. Bitte erneut versuchen." },
    errorNoAccount: { hu: "Nem talalhato fiok ezzel az email cimmel.", en: "No account found with this email.", de: "Kein Konto mit dieser E-Mail gefunden." },
    errorBadPassword: { hu: "Hibas jelszo. Probald ujra.", en: "Incorrect password. Please try again.", de: "Falsches Passwort. Bitte erneut versuchen." },
    errorSignInGeneric: { hu: "Hiba tortent a bejelentkezes soran.", en: "An error occurred during sign in.", de: "Bei der Anmeldung ist ein Fehler aufgetreten." },
    errorGoogleSignIn: { hu: "Nem sikerult elinditani a Google bejelentkezest.", en: "Could not start Google sign in.", de: "Google-Anmeldung konnte nicht gestartet werden." },
    errorEmailExists: { hu: "Ez az email cim mar regisztralva van. Jelentkezz be.", en: "This email is already registered. Please sign in.", de: "Diese E-Mail ist bereits registriert. Bitte melde dich an." },
    errorWeakPassword: { hu: "A jelszo tul gyenge. Hasznalj legalabb 8 karaktert, nagybetut es szamot.", en: "Password is too weak. Use at least 8 characters, one uppercase letter, and one number.", de: "Passwort zu schwach. Nutze mindestens 8 Zeichen, einen Grossbuchstaben und eine Zahl." },
    errorSignUpGeneric: { hu: "Hiba tortent a regisztracio soran.", en: "An error occurred during sign up.", de: "Bei der Registrierung ist ein Fehler aufgetreten." },
    errorVerificationIncomplete: { hu: "A verifikacio nem fejezodott be. Probald ujra.", en: "Verification did not complete. Please try again.", de: "Verifizierung wurde nicht abgeschlossen. Bitte erneut versuchen." },
    errorVerificationInvalid: { hu: "Ervenytelen kod. Ellenorizd es probald ujra.", en: "Invalid code. Check and try again.", de: "Ungueltiger Code. Bitte pruefen und erneut versuchen." },
    errorGoogleSignUp: { hu: "Nem sikerult elinditani a Google regisztraciot.", en: "Could not start Google sign up.", de: "Google-Registrierung konnte nicht gestartet werden." },
  },
  assessment: {
    helpLikert: {
      hu: "Valaszd ki, mennyire ertesz egyet az allitassal (1 = egyaltalan nem, 5 = teljesen)",
      en: "Choose how much you agree (1 = not at all, 5 = completely)",
      de: "Waehle deine Zustimmung (1 = gar nicht, 5 = vollstaendig)",
    },
    helpBinary: {
      hu: "Valaszd ki, melyik jellemzobb",
      en: "Choose which is more characteristic",
      de: "Waehle, was eher zutrifft",
    },
    saveError: {
      hu: "Hiba tortent mentes kozben. Probald ujra.",
      en: "Saving failed. Please try again.",
      de: "Speichern fehlgeschlagen. Bitte erneut versuchen.",
    },
    saveResultError: {
      hu: "Nem sikerult elmenteni az eredmenyt.",
      en: "Could not save result.",
      de: "Ergebnis konnte nicht gespeichert werden.",
    },
    emptyValue: { hu: "Valassz egy erteket", en: "Select a value", de: "Wahle einen Wert" },
    scale1: { hu: "Egyaltalan nem ertek egyet", en: "Strongly disagree", de: "Stimme gar nicht zu" },
    scale2: { hu: "Nem ertek egyet", en: "Disagree", de: "Stimme nicht zu" },
    scale3: { hu: "Semleges", en: "Neutral", de: "Neutral" },
    scale4: { hu: "Egyetertek", en: "Agree", de: "Stimme zu" },
    scale5: { hu: "Teljesen egyetertek", en: "Strongly agree", de: "Stimme voll zu" },
    endLeft: { hu: "Egyaltalan nem", en: "Not at all", de: "Gar nicht" },
    endRight: { hu: "Teljesen", en: "Completely", de: "Vollstaendig" },
    questionCounter: { hu: "Kerdes {current} / {total}", en: "Question {current} / {total}", de: "Frage {current} / {total}" },
    evaluatingTitle: { hu: "Eredmenyeid kiertekelese...", en: "Evaluating your results...", de: "Deine Ergebnisse werden ausgewertet..." },
    evaluatingBody: { hu: "Egy pillanat es minden kesz!", en: "Just a moment, almost done!", de: "Einen Moment, fast fertig!" },
  },
  dashboard: {
    metadataTitle: { hu: "Dashboard | Trita", en: "Dashboard | Trita", de: "Dashboard | Trita" },
    personalTag: { hu: "Szemelyes Dashboard", en: "Personal Dashboard", de: "Persoenliches Dashboard" },
    noResultTitle: { hu: "Meg nincs kiertekelesed", en: "No results yet", de: "Noch keine Auswertung" },
    noResultBody: { hu: "Toltsd ki a(z) {testName} tesztet, hogy lathasd az eredmenyeidet.", en: "Complete the {testName} test to see your results.", de: "Fuell den {testName}-Test aus, um deine Ergebnisse zu sehen." },
    latestEvaluation: { hu: "Legutobbi kiertekeles", en: "Latest evaluation", de: "Letzte Auswertung" },
    profileOverview: { hu: "{testName} profil attekintes", en: "{testName} profile overview", de: "{testName}-Profiluebersicht" },
    overviewLikert: { hu: "A {count} dimenzio vizualis osszefoglalasa.", en: "Visual summary of {count} dimensions.", de: "Visuelle Zusammenfassung von {count} Dimensionen." },
    overviewMbti: { hu: "A negy dichotomia menten elert eredmenyed.", en: "Your result across the four dichotomies.", de: "Dein Ergebnis entlang der vier Dichotomien." },
    strongest: { hu: "Legerosebb dimenzio", en: "Strongest dimension", de: "Staerkste Dimension" },
    weakest: { hu: "Fejlesztheto terulet", en: "Growth area", de: "Entwicklungspotenzial" },
    detailedTitle: { hu: "Reszletes kiertekeles", en: "Detailed results", de: "Detaillierte Auswertung" },
    detailedBody: { hu: "A skalaertekek es rovid jellemzesed.", en: "Scale values and short interpretation.", de: "Skalenwerte und kurze Interpretation." },
    dimensionHint: { hu: "Kattints a reszletekert", en: "Tap for details", de: "Tippe fuer Details" },
    dimensionWhat: { hu: "Mit mer ez a dimenzio?", en: "What does this dimension measure?", de: "Was misst diese Dimension?" },
    dimensionInterpretation: { hu: "Az eredmenyed ertelmezesei:", en: "Your result interpretation:", de: "Deine Ergebnisinterpretation:" },
    dimensionLow: { hu: "Alacsony (< 40%)", en: "Low (< 40%)", de: "Niedrig (< 40%)" },
    dimensionMid: { hu: "Kozepes (40-69%)", en: "Medium (40-69%)", de: "Mittel (40-69%)" },
    dimensionHigh: { hu: "Magas (>= 70%)", en: "High (>= 70%)", de: "Hoch (>= 70%)" },
    invitesReceivedTitle: { hu: "Meghivoid", en: "Invitations you received", de: "Erhaltene Einladungen" },
    invitesReceivedBody: { hu: "Itt latod azokat a meghivokat, amelyeket te kaptal.", en: "Here you can see the invitations you received.", de: "Hier siehst du Einladungen, die du erhalten hast." },
    retake: { hu: "Teszt ujra kitoltese", en: "Retake test", de: "Test erneut ausfuellen" },
    retakeConfirmTitle: {
      hu: "Biztosan ujra kitoltod?",
      en: "Retake the test?",
      de: "Test erneut ausfuellen?",
    },
    retakeConfirmBody: {
      hu: "Az uj eredmeny felulirja a korabbiat a dashboardon. A regi eredmeny az adatbazisban megmarad.",
      en: "The new result will replace the current one on your dashboard. The old result is kept in the database.",
      de: "Das neue Ergebnis ersetzt das aktuelle auf deinem Dashboard. Das alte bleibt in der Datenbank.",
    },
    retakeConfirm: { hu: "Ujra kitoltom", en: "Retake", de: "Erneut ausfuellen" },
    retakeCancel: { hu: "Megse", en: "Cancel", de: "Abbrechen" },
  },
  invite: {
    title: { hu: "Ismeros meghivasa", en: "Invite observer", de: "Beobachter einladen" },
    body: {
      hu: "Hivj meg ismerosoket, hogy ertekeljenek ugyanazzal a teszttel. Az eredmenyek anonimak maradnak.",
      en: "Invite people to rate you with the same test. Results remain anonymous.",
      de: "Lade Personen ein, dich mit demselben Test zu bewerten. Ergebnisse bleiben anonym.",
    },
    createFailed: { hu: "Nem sikerult meghivot letrehozni.", en: "Could not create invite.", de: "Einladung konnte nicht erstellt werden." },
    createLinkSuccess: { hu: "Meghivo link letrehozva.", en: "Invite link created.", de: "Einladungslink erstellt." },
    createEmailSuccess: { hu: "Meghivo e-mail elkuldve.", en: "Invitation email sent.", de: "Einladungs-E-Mail gesendet." },
    copied: { hu: "Link masolva!", en: "Link copied!", de: "Link kopiert!" },
    deleteSuccess: { hu: "Meghivo torolve.", en: "Invite canceled.", de: "Einladung storniert." },
    deleteFailed: { hu: "Nem sikerult torolni a meghivot.", en: "Could not delete invite.", de: "Einladung konnte nicht geloescht werden." },
    byEmailTitle: { hu: "Meghivas emailben", en: "Invite by email", de: "Einladung per E-Mail" },
    byEmailPlaceholder: { hu: "ismeros@email.com", en: "friend@email.com", de: "kontakt@email.com" },
    activeLimit: { hu: "Maximum 5 aktiv meghivo lehet egyszerre.", en: "Maximum 5 active invites at a time.", de: "Maximal 5 aktive Einladungen gleichzeitig." },
    stats: { hu: "{completed} kitoltve, {pending} fuggoben, {canceled} torolve", en: "{completed} completed, {pending} pending, {canceled} canceled", de: "{completed} abgeschlossen, {pending} ausstehend, {canceled} storniert" },
  },
  observer: {
    metadataTitle: { hu: "Megfigyeloi ertekeles | Trita", en: "Observer assessment | Trita", de: "Beobachterbewertung | Trita" },
    completeTitle: { hu: "Mar kitoltotted ezt az ertekelest", en: "This assessment is already completed", de: "Diese Bewertung wurde bereits ausgefuellt" },
    completeBody: { hu: "Ez a meghivo mar fel lett hasznalva. Koszonjuk a reszvetelt!", en: "This invite link has already been used. Thank you for participating!", de: "Dieser Einladungslink wurde bereits verwendet. Danke fuer die Teilnahme!" },
    inactiveTitle: { hu: "A meghivo mar nem aktiv", en: "Invite is no longer active", de: "Einladung ist nicht mehr aktiv" },
    inactiveBody: { hu: "Ez a meghivo vissza lett vonva. Kerj uj linket az ismerosodtol.", en: "This invite was canceled. Ask for a new link.", de: "Diese Einladung wurde zurueckgezogen. Bitte um einen neuen Link." },
    expiredTitle: { hu: "A meghivo lejart", en: "Invite expired", de: "Einladung abgelaufen" },
    expiredBody: { hu: "Ez a meghivo mar nem ervenyes. Kerj uj linket.", en: "This invite is no longer valid. Ask for a new link.", de: "Diese Einladung ist nicht mehr gueltig. Bitte um einen neuen Link." },
    introTitle: { hu: "Megfigyeloi ertekeles", en: "Observer assessment", de: "Beobachterbewertung" },
    introBody: { hu: "{inviter} arra ker, hogy toltsd ki ezt a(z) {testName} tesztet rola.", en: "{inviter} invited you to complete this {testName} assessment about them.", de: "{inviter} hat dich gebeten, diesen {testName}-Test ueber ihn/sie auszufuellen." },
    introBody2: { hu: "A valaszaid anonimak maradnak, csak osszesitett atlag lathato.", en: "Your answers remain anonymous; only aggregated averages are visible.", de: "Deine Antworten bleiben anonym; sichtbar sind nur aggregierte Durchschnitte." },
    relationshipLabel: { hu: "Milyen a kapcsolatotok?", en: "What is your relationship?", de: "Wie ist eure Beziehung?" },
    durationLabel: { hu: "Miota ismered?", en: "How long have you known them?", de: "Wie lange kennst du die Person?" },
    start: { hu: "Kezdjuk ({count} kerdes)", en: "Start ({count} questions)", de: "Starten ({count} Fragen)" },
    thinkOf: { hu: "Gondolj {inviter} szemelyere a valaszadas soran.", en: "Keep {inviter} in mind while answering.", de: "Denke beim Antworten an {inviter}." },
    next: { hu: "Kovetkezo ->", en: "Next ->", de: "Weiter ->" },
    prev: { hu: "<- Elozo", en: "<- Previous", de: "<- Zurueck" },
    submitLoading: { hu: "Mentes...", en: "Saving...", de: "Speichern..." },
    submit: { hu: "Kuldes", en: "Submit", de: "Senden" },
    genericError: { hu: "Hiba tortent.", en: "Something went wrong.", de: "Ein Fehler ist aufgetreten." },
    saveError: { hu: "Hiba tortent mentes kozben.", en: "Failed to save.", de: "Speichern fehlgeschlagen." },
    relationFriend: { hu: "Barat", en: "Friend", de: "Freund/in" },
    relationColleague: { hu: "Kollega", en: "Colleague", de: "Kollege/in" },
    relationFamily: { hu: "Csaladtag", en: "Family", de: "Familie" },
    relationPartner: { hu: "Partner", en: "Partner", de: "Partner/in" },
    relationOther: { hu: "Egyeb", en: "Other", de: "Sonstiges" },
    durationLt1: { hu: "Kevesebb mint 1 eve", en: "Less than 1 year", de: "Weniger als 1 Jahr" },
    duration1to3: { hu: "1-3 eve", en: "1-3 years", de: "1-3 Jahre" },
    duration3to5: { hu: "3-5 eve", en: "3-5 years", de: "3-5 Jahre" },
    duration5p: { hu: "5 evnel regebben", en: "More than 5 years", de: "Mehr als 5 Jahre" },
    helpLikertAbout: {
      hu: "Valaszd ki, mennyire ertesz egyet az allitassal {inviter} kapcsan (1 = egyaltalan nem, 5 = teljesen)",
      en: "Choose how much you agree regarding {inviter} (1 = not at all, 5 = completely)",
      de: "Waehle den Grad der Zustimmung zu {inviter} (1 = gar nicht, 5 = vollstaendig)",
    },
    helpBinaryAbout: {
      hu: "Valaszd ki, melyik jellemzobb {inviter} szemelyere",
      en: "Choose which option is more characteristic of {inviter}",
      de: "Waehle, was eher auf {inviter} zutrifft",
    },
    confidenceLabel: {
      hu: "Mennyire vagy biztos a valaszaidban?",
      en: "How confident are you in your answers?",
      de: "Wie sicher bist du bei deinen Antworten?",
    },
    confidenceHint: {
      hu: "1 = nagyon bizonytalan, 5 = nagyon magabiztos",
      en: "1 = very unsure, 5 = very confident",
      de: "1 = sehr unsicher, 5 = sehr sicher",
    },
    doneTitle: { hu: "Koszonjuk a reszvetelt!", en: "Thank you for participating!", de: "Vielen Dank fuer deine Teilnahme!" },
    doneBody: { hu: "A valaszaid sikeresen elmentesre kerultek.", en: "Your answers were saved successfully.", de: "Deine Antworten wurden erfolgreich gespeichert." },
    doneSignedInHint: { hu: "A meghivoid es eredmenyeid a dashboardon erhetoek el.", en: "Your invites and results are available on your dashboard.", de: "Deine Einladungen und Ergebnisse findest du im Dashboard." },
    doneSignedOutHint: { hu: "Ha mar van fiokod, jelentkezz be a meghivoid megtekintesehez.", en: "If you already have an account, sign in to view your invites.", de: "Wenn du bereits ein Konto hast, melde dich an, um Einladungen zu sehen." },
    signInCta: { hu: "Bejelentkezes", en: "Sign in", de: "Anmelden" },
    goDashboard: { hu: "Ugras a dashboardra", en: "Go to dashboard", de: "Zum Dashboard" },
  },
  userMenu: {
    profileFallback: { hu: "Profil", en: "Profile", de: "Profil" },
    profile: { hu: "Profilom", en: "My profile", de: "Mein Profil" },
  },
  profile: {
    title: { hu: "Profilom", en: "My profile", de: "Mein Profil" },
    subtitle: { hu: "Itt szerkesztheted az adataidat, es torolheted a fiokodat.", en: "Here you can edit your basic data and delete your account.", de: "Hier kannst du deine Daten bearbeiten und dein Konto loeschen." },
    basicsTitle: { hu: "Alap adatok", en: "Basic data", de: "Grunddaten" },
    basicsBody: { hu: "Ezek az adatok a Clerk profilodban kerulnek mentesre.", en: "These values are stored in your Clerk profile.", de: "Diese Daten werden in deinem Clerk-Profil gespeichert." },
    lastName: { hu: "Vezeteknev", en: "Last name", de: "Nachname" },
    firstName: { hu: "Keresztnev", en: "First name", de: "Vorname" },
    missingEmail: { hu: "nincs megadva", en: "not set", de: "nicht gesetzt" },
    saveSuccess: { hu: "A profil frissitve lett.", en: "Profile updated.", de: "Profil aktualisiert." },
    saveError: { hu: "Nem sikerult frissiteni a profilt.", en: "Could not update profile.", de: "Profil konnte nicht aktualisiert werden." },
    localeTitle: { hu: "Nyelvi beallitasok", en: "Language settings", de: "Spracheinstellungen" },
    localeBody: {
      hu: "Valaszd ki az alapertelmezett nyelvet. Ez lesz betoltve ha bejelentkezel.",
      en: "Choose your default language. This will be loaded when you sign in.",
      de: "Waehle deine Standardsprache. Diese wird beim Anmelden geladen.",
    },
    deleteTitle: { hu: "Profil torlese", en: "Delete profile", de: "Profil loeschen" },
    deleteBody: { hu: "A profil torlese vegleges. A fiokod megszunik.", en: "Deleting your profile is permanent. Your account will be removed.", de: "Das Loeschen deines Profils ist dauerhaft. Dein Konto wird entfernt." },
    deleteError: { hu: "Nem sikerult torolni a profilt.", en: "Could not delete profile.", de: "Profil konnte nicht geloescht werden." },
    confirmTitle: { hu: "Profil torlese", en: "Delete profile", de: "Profil loeschen" },
    confirmBody: { hu: "Biztosan torlod a profilodat? Ez nem visszavonhato.", en: "Are you sure you want to delete your profile? This cannot be undone.", de: "Profil wirklich loeschen? Diese Aktion kann nicht rueckgaengig gemacht werden." },
    modalConfirm: { hu: "Torles", en: "Delete", de: "Loeschen" },
    modalCancel: { hu: "Megse", en: "Cancel", de: "Abbrechen" },
    demographicsTitle: { hu: "Szemelyes adatok", en: "Personal details", de: "Persoenliche Daten" },
    demographicsBody: {
      hu: "Ezeket az adatokat a kutatashoz hasznaljuk. Barmikor modosithatod.",
      en: "These details are used for research purposes. You can update them any time.",
      de: "Diese Angaben werden fuer die Forschung verwendet. Du kannst sie jederzeit aendern.",
    },
    demographicsSaveSuccess: {
      hu: "Szemelyes adatok frissitve.",
      en: "Personal details updated.",
      de: "Persoenliche Daten aktualisiert.",
    },
  },
  error: {
    NO_TEST_TYPE: {
      hu: "Nincs hozzarendelt teszttipusod. Elobb toltsd ki a tesztet.",
      en: "No test type assigned yet. Complete the test first.",
      de: "Noch kein Testtyp zugewiesen. Fuell zuerst den Test aus.",
    },
    INVITE_LIMIT_REACHED: {
      hu: "Elerted a maximalis (5) meghivo limitet.",
      en: "You reached the maximum (5) invite limit.",
      de: "Du hast das Einladungslimit (5) erreicht.",
    },
    SELF_INVITE: {
      hu: "Nem hivhatod meg sajat magadat.",
      en: "You cannot invite yourself.",
      de: "Du kannst dich nicht selbst einladen.",
    },
    INVALID_TOKEN: {
      hu: "Ervenytelen meghivo link.",
      en: "Invalid invite link.",
      de: "Ungueltiger Einladungslink.",
    },
    ALREADY_USED: {
      hu: "Ez a meghivo mar fel lett hasznalva.",
      en: "This invite has already been used.",
      de: "Diese Einladung wurde bereits verwendet.",
    },
    INVITE_CANCELED: {
      hu: "Ez a meghivo mar nem aktiv.",
      en: "This invite is no longer active.",
      de: "Diese Einladung ist nicht mehr aktiv.",
    },
    INVITE_EXPIRED: {
      hu: "Ez a meghivo lejart.",
      en: "This invite has expired.",
      de: "Diese Einladung ist abgelaufen.",
    },
    ANSWER_COUNT_MISMATCH: {
      hu: "A valaszok szama nem egyezik a kerdesek szamaval.",
      en: "The number of answers does not match the number of questions.",
      de: "Die Anzahl der Antworten stimmt nicht mit der Fragenzahl ueberein.",
    },
    DUPLICATE_ANSWER: {
      hu: "Duplikalt valasz erkezett ugyanarra a kerdesre.",
      en: "Duplicate answer received for the same question.",
      de: "Doppelte Antwort fuer dieselbe Frage erhalten.",
    },
    MISSING_ANSWER: {
      hu: "Hianyzik valasz egy kerdesre.",
      en: "An answer is missing for a question.",
      de: "Eine Antwort fehlt fuer eine Frage.",
    },
    INVALID_MBTI_ANSWER: {
      hu: "Ervenytelen MBTI valasz.",
      en: "Invalid MBTI answer.",
      de: "Ungueltige MBTI-Antwort.",
    },
    INVALID_LIKERT_ANSWER: {
      hu: "Ervenytelen Likert valasz.",
      en: "Invalid Likert answer.",
      de: "Ungueltige Likert-Antwort.",
    },
    EMAIL_SEND_FAILED: {
      hu: "A meghivo letrejott, de az email kuldese nem sikerult. Masold ki a linket.",
      en: "Invite created, but the email could not be sent. Copy the link instead.",
      de: "Einladung erstellt, aber E-Mail konnte nicht gesendet werden. Kopiere den Link.",
    },
  },
  onboarding: {
    title: {
      hu: "Szemelyes adatok",
      en: "Personal details",
      de: "Persoenliche Daten",
    },
    subtitle: {
      hu: "Ezek az adatok kizarolag kutatasi celra szolgalnak es bizalmasan kezeljuk oket.",
      en: "This data is used exclusively for research purposes and handled confidentially.",
      de: "Diese Daten werden ausschliesslich fuer Forschungszwecke verwendet und vertraulich behandelt.",
    },
    birthYearLabel: {
      hu: "Szuletesi ev",
      en: "Birth year",
      de: "Geburtsjahr",
    },
    birthYearPlaceholder: {
      hu: "pl. 1995",
      en: "e.g. 1995",
      de: "z.B. 1995",
    },
    genderLabel: {
      hu: "Nem",
      en: "Gender",
      de: "Geschlecht",
    },
    genderMale: {
      hu: "Ferfi",
      en: "Male",
      de: "Maennlich",
    },
    genderFemale: {
      hu: "No",
      en: "Female",
      de: "Weiblich",
    },
    genderOther: {
      hu: "Egyeb",
      en: "Other",
      de: "Andere",
    },
    genderPreferNot: {
      hu: "Nem valaszolok",
      en: "Prefer not to say",
      de: "Keine Angabe",
    },
    educationLabel: {
      hu: "Iskolai vegzettseg",
      en: "Education level",
      de: "Bildungsniveau",
    },
    educationPrimary: {
      hu: "Altalanos iskola",
      en: "Primary school",
      de: "Grundschule",
    },
    educationSecondary: {
      hu: "Kozepiskolai erettsegi",
      en: "High school diploma",
      de: "Abitur",
    },
    educationBachelor: {
      hu: "Alapkepzes (BSc/BA)",
      en: "Bachelor's degree",
      de: "Bachelorabschluss",
    },
    educationMaster: {
      hu: "Mesterkepzes (MSc/MA)",
      en: "Master's degree",
      de: "Masterabschluss",
    },
    educationDoctorate: {
      hu: "Doktori fokozat (PhD)",
      en: "Doctoral degree",
      de: "Doktorgrad",
    },
    educationOther: {
      hu: "Egyeb",
      en: "Other",
      de: "Andere",
    },
    occupationLabel: {
      hu: "Foglalkozas",
      en: "Occupation",
      de: "Beruf",
    },
    occupationPlaceholder: {
      hu: "pl. tanar, mernok, diak",
      en: "e.g. teacher, engineer, student",
      de: "z.B. Lehrer, Ingenieur, Student",
    },
    countryLabel: {
      hu: "Orszag",
      en: "Country",
      de: "Land",
    },
    countryPlaceholder: {
      hu: "Kereses...",
      en: "Search...",
      de: "Suchen...",
    },
    submit: {
      hu: "Tovabb a teszthez",
      en: "Continue to assessment",
      de: "Weiter zum Test",
    },
    saving: {
      hu: "Mentes...",
      en: "Saving...",
      de: "Speichern...",
    },
    errorGeneric: {
      hu: "Hiba tortent. Probald ujra!",
      en: "Something went wrong. Please try again.",
      de: "Ein Fehler ist aufgetreten. Bitte versuche es erneut.",
    },
  },
  comparison: {
    title: { hu: "Masok rolad", en: "Others about you", de: "Andere ueber dich" },
    body: { hu: "Onertekelesed es a megfigyelok ({count} fo) atlaganak osszehasonlitasa.", en: "Comparison of your self-rating and observer average ({count} people).", de: "Vergleich deiner Selbsteinschaetzung mit dem Beobachterdurchschnitt ({count} Personen)." },
    similar: { hu: "hasonlo", en: "similar", de: "aehnlich" },
    diffHigher: { hu: "+{diff}% (mások magasabbra ertekelnek)", en: "+{diff}% (others rate you higher)", de: "+{diff}% (andere bewerten dich hoeher)" },
    diffLower: { hu: "{diff}% (masok alacsonyabbra ertekelnek)", en: "{diff}% (others rate you lower)", de: "{diff}% (andere bewerten dich niedriger)" },
    self: { hu: "Te", en: "You", de: "Du" },
    others: { hu: "Masok", en: "Others", de: "Andere" },
    othersCount: { hu: "Masok ({count})", en: "Others ({count})", de: "Andere ({count})" },
    avgConfidence: { hu: "atl. magabiztossag: {value}/5", en: "avg. confidence: {value}/5", de: "Durchschn. Sicherheit: {value}/5" },
    typeLabel: { hu: "Tipusod", en: "Your type", de: "Dein Typ" },
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
  if (lower.startsWith("de")) return "de";
  return DEFAULT_LOCALE;
}
