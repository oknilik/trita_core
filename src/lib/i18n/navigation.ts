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
    hiring: { hu: "Jelöltek", en: "Candidates" },
    org: { hu: "Szervezet", en: "Organization" },
    adminConsole: { hu: "Admin vezérlő", en: "Admin console" },
    backToHome: { hu: "Vissza a vezérlőre", en: "Back to dashboard" },
  },
};
