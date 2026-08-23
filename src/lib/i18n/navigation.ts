// Fejléc-navigáció címkéi (B18): a builderek eddig hardcode magyar
// címkéket adtak, így az EN felület közepén magyar menü ült. A dinamikus
// címkék (csapatnevek) továbbra is nyersen mennek át — csak a fix
// menüpontok kulcsosítottak.
export const navigationTranslations = {
  nav: {
    home: { hu: "Vezérlő", en: "Dashboard" },
    results: { hu: "Eredményeim", en: "My results" },
    interaction: { hu: "Összehasonlítás", en: "Comparison" },
    career: { hu: "Karrier", en: "Career" },
    tasks: { hu: "Feladataim", en: "My tasks" },
    teams: { hu: "Csapatok", en: "Teams" },
    myTeam: { hu: "Csapatom", en: "My team" },
    teamItemDescription: {
      hu: "Csapatoldal és publikált csapatkép",
      en: "Team page and published team profile",
    },
    // A Csapatok-dropdown utolsó tétele adminnál: innen lehet csapatot
    // létrehozni és a teljes listát kezelni.
    allTeams: { hu: "Összes csapat", en: "All teams" },
    allTeamsDescription: {
      hu: "Lista és új csapat a szervezet oldalán",
      en: "Full list and new team on the organization page",
    },
    hiring: { hu: "Jelöltek", en: "Candidates" },
    org: { hu: "Szervezet", en: "Organization" },
    adminConsole: { hu: "Admin vezérlő", en: "Admin console" },
    backToHome: { hu: "Vissza a vezérlőre", en: "Back to dashboard" },
    // Felhasználó-menü (a fejléc avatár-dropdownja). Ezek 2026-08-23-ig
    // bedrótozott magyar szövegek voltak — a legláthatóbb felületen, tehát
    // az EN-re váltott felhasználó a saját menüjében magyarul látott mindent.
    account: { hu: "Fiók", en: "Account" },
    profileSettings: { hu: "Profil beállítások", en: "Profile settings" },
    signOut: { hu: "Kijelentkezés", en: "Sign out" },
    language: { hu: "Nyelv", en: "Language" },
    newClientOrg: { hu: "Új ügyfél-szervezet", en: "New client organization" },
  },
  theme: {
    label: { hu: "Megjelenés", en: "Appearance" },
    system: { hu: "Rendszer", en: "System" },
    light: { hu: "Világos", en: "Light" },
    dark: { hu: "Sötét", en: "Dark" },
  },
};
