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
    submitSendCode: { hu: "Kód küldése és folytatás", en: "Send code & continue" },
    submitSendCodeLoading: { hu: "Küldés...", en: "Sending..." },
    magicLinkSentTitle: { hu: "Ellenőrizd az emailedet!", en: "Check your email!" },
    magicLinkSentBody: {
      hu: "Küldtünk egy bejelentkezési linket a(z) {email} címre. Kattints a levélben lévő gombra a belépéshez.",
      en: "We sent a sign-in link to {email}. Click the button in the email to continue.",
    },
    magicLinkBack: { hu: "Más email cím megadása", en: "Use a different email" },
    intentQuestion: { hu: "Mire használod a triát?", en: "What will you use trita for?" },
    errorBoundaryMessage: {
      hu: "Valami hiba történt. Kérjük, frissítsd az oldalt.",
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
    step1Label: { hu: "Alapadatok", en: "Basic info" },
    step2Label: { hu: "Hozzájárulás", en: "Consent" },
    step2Title: { hu: "Egy utolsó lépés", en: "One last step" },
    avatarTitle: { hu: "Válassz avatart", en: "Choose an avatar" },
    avatarSub: { hu: "Ez jelenik meg a profilodban.", en: "This will appear on your profile." },
    avatarShowAll: {
      hu: "+ Összes megjelenítése ({count})",
      en: "+ Show all ({count})",
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
} as const;
