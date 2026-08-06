export const authTranslations = {
  auth: {
    signInTitle: { hu: "Bejelentkezés", en: "Sign in" },
    signInSubtitle: { hu: "Küldünk egy egyszeri kódot az emailedre", en: "We'll send a one-time code to your email" },
    signUpTitle: { hu: "Hozd létre a fiókodat", en: "Create your account" },
    signUpSubtitle: { hu: "Add meg az email címed, és küldünk egy kódot a folytatáshoz.", en: "Enter your email and we'll send you a code to continue." },
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
    verifySent: { hu: "Küldtünk egy kódot erre a címre: {email}", en: "We sent a code to {email}" },
    verifyCodeLabel: { hu: "Megerősítő kód", en: "Verification code" },
    errorSignInFailed: { hu: "A bejelentkezés nem sikerült. Próbáld újra.", en: "Sign in failed. Please try again." },
    errorNoAccount: { hu: "Nem található fiók ezzel az email címmel.", en: "No account found with this email." },
    errorBadPassword: { hu: "Hibás jelszó. Próbáld újra.", en: "Incorrect password. Please try again." },
    errorSignInGeneric: { hu: "Hiba történt a bejelentkezés során.", en: "An error occurred during sign in." },
    errorGoogleSignIn: { hu: "Nem sikerült elindítani a Google bejelentkezést.", en: "Could not start Google sign in." },
    errorEmailExists: { hu: "Ez az email cím már regisztrálva van. Jelentkezz be.", en: "This email is already registered. Please sign in." },
    errorWeakPassword: { hu: "A jelszó túl gyenge. Használj legalább 8 karaktert, nagybetűt és számot.", en: "Password is too weak. Use at least 8 characters, one uppercase letter, and one number." },
    errorSignUpGeneric: { hu: "Hiba történt a regisztráció során.", en: "An error occurred during sign up." },
    errorVerificationIncomplete: { hu: "A megerősítés nem fejeződött be. Próbáld újra.", en: "Verification did not complete. Please try again." },
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
    errorSecondFactorRequired: { hu: "Kétlépcsős azonosítás szükséges — jelentkezz be a második lépcsővel is.", en: "Second factor required. Please complete 2FA." },
    submitSendLink: { hu: "Link küldése", en: "Send link" },
    submitSendLinkLoading: { hu: "Küldés...", en: "Sending..." },
    submitSendCode: { hu: "Kód küldése és folytatás", en: "Send code & continue" },
    submitSendCodeLoading: { hu: "Küldés...", en: "Sending..." },
    magicLinkSentTitle: { hu: "Ellenőrizd az emailedet!", en: "Check your email!" },
    magicLinkSentBody: {
      hu: "Küldtünk egy bejelentkezési linket erre a címre: {email}. Kattints a levélben lévő gombra a belépéshez.",
      en: "We sent a sign-in link to {email}. Click the button in the email to continue.",
    },
    magicLinkBack: { hu: "Más email cím megadása", en: "Use a different email" },
    intentQuestion: { hu: "Mire használnád a Tritát?", en: "What will you use Trita for?" },
    errorBoundaryMessage: {
      hu: "Hiba történt. Frissítsd az oldalt.",
      en: "Something went wrong. Please refresh the page.",
    },
    errorBoundaryReload: { hu: "Újratöltés", en: "Reload" },
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
      hu: "Ezek az adatok a pontosabb eredményekhez kellenek, és bizalmasan kezeljük őket.",
      en: "This data makes your results more accurate and is handled confidentially.",
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
    careerSectionLabel: { hu: "Karrier-háttér (opcionális)", en: "Career background (optional)" },
    eduLabel: { hu: "Legmagasabb végzettséged", en: "Highest education" },
    eduFieldLabel: { hu: "Végzettség területe", en: "Field of study" },
    industryLabel: { hu: "Jelenlegi vagy legutóbbi munkaterületed", en: "Current or most recent field of work" },
    optionalPlaceholder: { hu: "Válassz (kihagyható)", en: "Select (optional)" },
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
      hu: "A Trita személyiség- és csapatintelligencia platform, amely önértékelésre és ismerősi visszajelzésre épülő, validált személyiségfelméréseket kínál. Ez a tájékoztató ismerteti, hogyan gyűjtjük, kezeljük és védjük az adataidat.",
      en: "Trita is a personality and team intelligence platform offering validated personality assessments based on self-ratings and feedback from others. This policy describes how we collect, process, and protect your data.",
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
      hu: "Tesztadatok: személyiségteszt válaszok, számított pontszámok, ismerősi értékelések, valamint az eredmények utáni visszajelző kérdőív (korábbi teszttapasztalat, munkakörülmények, motiváció stb.).",
      en: "Assessment data: personality test answers, calculated scores, ratings from others, and the post-results feedback survey (prior test experience, work context, motivation, etc.).",
    },
    dataTechnical: {
      hu: "Technikai és használati adatok: nyelvi beállítás (cookie), munkamenet-azonosítók, valamint felületi események (megnyitott oldal, gombkattintás, űrlap elkezdése, a kitöltés hányadik kérdésénél tartasz). Az események nem tartalmaznak nevet, e-mail-címet, szabad szöveget, kérdőív-választ vagy pontszámot.",
      en: "Technical and usage data: language preference (cookie), session identifiers, and interface events (page opened, button clicked, form started, which question of the assessment you are on). Events contain no name, email address, free text, questionnaire answer or score.",
    },
    purposeTitle: {
      hu: "Mire használjuk az adatokat?",
      en: "How do we use your data?",
    },
    purposeResearch: {
      hu: "A szolgáltatás fejlesztése: a módszertan pontosítása, a felmérések minőségének javítása és a felület használhatóságának mérése — aggregált adatok alapján, jogos érdek jogalapon (GDPR 6. cikk (1) f)). A profilod törlésével a hozzád köthető használati események is elveszítik a kapcsolatot veled.",
      en: "Service improvement: refining the methodology, improving assessment quality and measuring interface usability — based on aggregated data, on the legal basis of legitimate interest (Art. 6(1)(f) GDPR). Deleting your profile also severs the link between you and the usage events recorded about you.",
    },
    purposeService: {
      hu: "Szolgáltatás működtetése: a teszt kitöltése, eredmények megjelenítése, ismerősi meghívók kezelése.",
      en: "Service operation: delivering the assessment, displaying results, managing invitations.",
    },
    // TR360-LEGAL — csapatszintű visszajelzések és pulzus-mérések szakasz
    teamFeedbackTitle: {
      hu: "Csapatszintű visszajelzések és pulzus-mérések",
      en: "Team-level feedback and pulse measurements",
    },
    teamFeedbackCollected: {
      hu: "Mit gyűjtünk: csapattársi szerep-visszajelzéseket (a csapatszerep-kérdőív társértékelései), bizalmi kör válaszokat (rövid értékelések az együttműködési kapcsolatokról), valamint pszichológiai biztonság pulzus-válaszokat. A pulzus-válaszok rögzítése eleve felhasználói azonosító nélkül történik.",
      en: "What we collect: teammate role feedback (peer ratings from the team-role questionnaire), trust-circle responses (short ratings about working relationships), and psychological-safety pulse responses. Pulse responses are recorded without any user identifier from the outset.",
    },
    teamFeedbackAnonymity: {
      hu: "Anonimitás-szabály: egyéni válasz soha nem jelenik meg. A társértékelések és a pulzus-eredmények kizárólag összesített (aggregált) formában láthatók, és csak akkor, ha legalább 3 értékelő, illetve kitöltő válasza áll rendelkezésre — a küszöb alatt eredmény nem jelenik meg.",
      en: "Anonymity rule: individual answers are never displayed. Peer ratings and pulse results are shown only in aggregated form, and only once responses from at least 3 raters or respondents exist — below this threshold no result is displayed.",
    },
    teamFeedbackAccess: {
      hu: "Ki látja: az összesített csapatképet a csapat vezetője, a szervezeti adminisztrátor és a szervezethez rendelt Trita-tanácsadó láthatja; az értékelt személy a saját, összesített társ-visszajelzését látja. A bizalmi kör esetén a kapcsolati (páronkénti, két irány átlagából képzett) kép a vezetői/tanácsadói dinamika-nézetben jelenik meg — egyéni irányított válasz ott sem látható.",
      en: "Who can see it: the aggregated team picture is visible to the team's manager, the organization admin, and the Trita consultant assigned to the organization; the person being rated sees their own aggregated peer feedback. For the trust circle, the relationship-level view (pairwise, averaged across both directions) appears in the manager/consultant dynamics view — individual directed answers are never shown there either.",
    },
    teamFeedbackRetention: {
      hu: "Meddig: ezek a válaszok a csapat- és mérési adatokkal együtt, a szolgáltatás nyújtásához szükséges ideig tárolódnak. A profilod törlésével a hozzád köthető válaszok is törlődnek; a már anonimizált, összesített eredmények személyhez nem visszavezethetők, és nem törölhetők.",
      en: "How long: these responses are stored together with the team and measurement data for as long as needed to provide the service. Deleting your profile also deletes the responses linked to you; already anonymized, aggregated results cannot be traced back to a person and cannot be deleted.",
    },
    cookiesTitle: {
      hu: "Cookie-k",
      en: "Cookies",
    },
    cookiesBody: {
      hu: "Kizárólag technikailag szükséges cookie-kat használunk: munkamenet-kezeléshez (Clerk hitelesítés) és nyelvi beállításhoz. Nem használunk marketing vagy nyomkövető sütiket, és a használat-mérésünk sem tesz le sütit, sem semmilyen más azonosítót az eszközödön — ezért nincs süti-elfogadó felugró sem.",
      en: "We only use technically necessary cookies: for session management (Clerk authentication) and language preference. We use no marketing or tracking cookies, and our usage measurement stores no cookie or any other identifier on your device — which is why there is no cookie consent banner either.",
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
      hu: "A használatot SAJÁT, first-party rendszerrel mérjük: az események a mi szervereinkre érkeznek és a mi adatbázisunkban maradnak — nincs mögötte külső analitikai szolgáltató, és semmilyen adat nem megy ki reklámhálózathoz. A látogató azonosítója NAPONTA ROTÁLÓ álnév, amit az IP-címből és a böngésző-azonosítóból számolt visszafejthetetlen kivonat ad; magát az IP-címet nem tároljuk, és másnap ugyanaz a látogató már más álnév alatt jelenik meg. Ha a böngésződ nyomkövetés-tiltást jelez (Global Privacy Control vagy Do Not Track), semmit nem mérünk. Az adatkezelés jogalapja a jogos érdek (GDPR 6. cikk (1) f)): a szolgáltatás fejlesztése és hibakeresés; ez ellen bármikor tiltakozhatsz. Megőrzés: 12 hónap, utána automatikus törlés. Emellett a Vercel Analytics és Speed Insights méri a forgalmat és a betöltési teljesítményt — ezek sem használnak sütit, és kizárólag aggregált statisztikát adnak.",
      en: "We measure usage with our OWN, first-party system: events arrive at our servers and stay in our database — there is no third-party analytics provider behind it, and no data goes to advertising networks. The visitor identifier is a DAILY ROTATING pseudonym derived as an irreversible digest of the IP address and browser identifier; we do not store the IP address itself, and the next day the same visitor appears under a different pseudonym. If your browser signals a tracking opt-out (Global Privacy Control or Do Not Track), we measure nothing. The legal basis is legitimate interest (Art. 6(1)(f) GDPR): improving the service and debugging; you may object at any time. Retention: 12 months, then automatic deletion. In addition, Vercel Analytics and Speed Insights measure traffic and loading performance — these use no cookies either and provide only aggregated statistics.",
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
      hu: "Neon (neon.tech) – PostgreSQL adatbázis-tárhely, amelyen a felhasználói adatok tárolódnak. Adatközpontok az EU-ban.",
      en: "Neon (neon.tech) – PostgreSQL database hosting where user data is stored. Data centres within the EU.",
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
    rightsObject: {
      hu: "Tiltakozás: tiltakozhatsz a jogos érdeken alapuló adatkezelés — így a használat-mérés — ellen; ilyenkor a rád vonatkozó mérést leállítjuk.",
      en: "Objection: you may object to processing based on legitimate interest — including usage measurement; we will then stop measuring in relation to you.",
    },
    rightsWithdraw: {
      hu: "Hozzájárulás visszavonása: a profil törlésével visszavonod a hozzájárulásodat. A már anonimizált, aggregált adatok nem törölhetők.",
      en: "Withdrawal of consent: deleting your profile withdraws your consent. Already anonymized, aggregated data cannot be deleted.",
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
} as const;
