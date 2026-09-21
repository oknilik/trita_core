export const candidateSuggestionTranslations = {
  candidateSuggestions: {
    workshop: { hu: "Tanácsadói műhely", en: "Consultant workshop" },
    observations: {
      hu: "Megfigyelések a közös munkához",
      en: "Observations for working together",
    },
    journey: { hu: "A személyestől a közösig", en: "From personal to shared" },
    selfStep: { hu: "Önértékelés", en: "Self-assessment" },
    roleStep: {
      hu: "Csapatszerepek",
      en: "Team roles",
    },
    optionalStep: { hu: "Opcionális", en: "Optional" },
    feedbackStep: { hu: "Tanácsadói visszajelzés", en: "Consultant feedback" },
    title: {
      hu: "Tanácsadói szövegjavaslatok",
      en: "Consultant text suggestions",
    },
    notice: {
      hu: "Szerkeszthető felvetések, nem alkalmassági ítéletek. Beillesztés után mentsd és hagyd jóvá a visszajelzést. Az újragenerálás a jegyzeteidet nem írja felül.",
      en: "Editable hypotheses, not suitability judgments. Save and review the feedback after insertion. Regeneration never overwrites your notes.",
    },
    profile: {
      hu: "A jelölt működési képe",
      en: "Candidate working preferences",
    },
    connection: {
      hu: "Kapcsolódások a csapathoz",
      en: "Connections with the team",
    },
    difference: { hu: "Eltérő nézőpontok", en: "Different perspectives" },
    roles: { hu: "Csapatszerepek", en: "Team roles" },
    interview: {
      hu: "Interjú és beilleszkedés",
      en: "Interview and onboarding",
    },
    insert: { hu: "Beillesztés", en: "Insert" },
    edit: { hu: "Szerkesztés", en: "Edit" },
    dismiss: { hu: "Elvetés", en: "Dismiss" },
    regenerate: {
      hu: "Javaslatok újragenerálása",
      en: "Regenerate suggestions",
    },
    tooLong: {
      hu: "Ez a szöveg már nem fér a célmezőbe. Rövidítsd a javaslatot vagy a meglévő jegyzetet.",
      en: "This text exceeds the destination field limit. Shorten the suggestion or existing notes.",
    },
    source: {
      hu: "Forrás: jelölti önértékelés · {date} · szabályalapú szövegjavaslat v1",
      en: "Source: candidate self-report · {date} · rule-based suggestion v1",
    },
    teamSource: {
      hu: "Csapatforrás: {name} · {date} · riport v{revision} · n={count}",
      en: "Team source: {name} · {date} · report v{revision} · n={count}",
    },
    roleSource: {
      hu: "Jelölti szerepkérdőív: kitöltve; külön kitöltési időpont nincs rögzítve.",
      en: "Candidate role questionnaire: completed; no separate completion timestamp is recorded.",
    },
    hypothesis: {
      hu: "A személyes profil alapján ellenőrizendő felvetés:",
      en: "A hypothesis to explore from the personal profile:",
    },
    balanced: {
      hu: "A profil alapján nem emelünk ki markáns pólust. Konkrét munkahelyi példákkal érdemes feltárni, mikor melyik működés jelenik meg.",
      en: "No pronounced pole is highlighted. Explore concrete work examples to understand which preferences appear in different situations.",
    },
    close: {
      hu: "{dimensions}: a jelölt és a csapatátlag pontértékei közeliek. Ez nem bizonyít azonos működést vagy jó illeszkedést; beszéljetek át közös munkapéldákat.",
      en: "{dimensions}: candidate and team-mean scores are close. This does not establish identical behavior or good fit; discuss concrete shared work situations.",
    },
    noClose: {
      hu: "Nem emelünk ki közeli pontértékeket. Ez önmagában nem jelent együttműködési nehézséget.",
      en: "No close scores are highlighted. This alone does not imply collaboration difficulties.",
    },
    gap: {
      hu: "{dimension}: jelölt {candidate}, csapatátlag {team}, csapatszórás {sd}. A nagyobb leíró eltérés eltérő munkamódok megbeszélését indokolhat; nem teljesítménykülönbség.",
      en: "{dimension}: candidate {candidate}, team mean {team}, team SD {sd}. This larger descriptive difference may warrant discussing different work preferences; it is not a performance difference.",
    },
    noGap: {
      hu: "Nem emelünk ki a konzervatív megjelenítési küszöböt meghaladó eltérést. Ez nem bizonyít azonosságot.",
      en: "No difference exceeds the conservative display threshold. This does not establish equivalence.",
    },
    noSpread: {
      hu: "A rögzített csapatriportból hiányzik a teljes dimenziónkénti szórás; ezért nem generálunk eltérésállítást pusztán az átlagból.",
      en: "The frozen team report lacks complete dimension spreads, so no difference claims are generated from means alone.",
    },
    method: {
      hu: "Megjelenítési szabály: a különbség meghaladja az egyéni rövid forma 1,96 × SEM hibasávját és a csapat egy szórását. Ez óvatos szerkesztési szabály, nem szignifikanciateszt. A csapatátlag nem ír le minden tagot.",
      en: "Display rule: the gap exceeds both 1.96 × individual short-form SEM and one team SD. This is a conservative editorial rule, not a significance test. A team mean does not describe every member.",
    },
    roleOwn: {
      hu: "A jelölt szerepkérdőíve alapján előtérbe kerülő preferenciák: {roles}. Ezek nem igazolt képességek vagy teljesítményeredmények.",
      en: "Preferences highlighted by the candidate role questionnaire: {roles}. These do not establish ability or performance.",
    },
    noRole: {
      hu: "Nincs érvényes, kitöltött jelölti szerepkérdőív. A személyiségből nem helyettesítjük becsléssel.",
      en: "No valid completed candidate role questionnaire is available. Personality estimates are not substituted.",
    },
    mixedRoles: {
      hu: "A csapat szerepadata hiányos, becsült vagy vegyes forrású; ebből nem állítunk szerephiányt vagy lefedettséget.",
      en: "Team role evidence is missing, estimated or mixed; no role gaps or coverage are inferred from it.",
    },
    overlap: {
      hu: "A csapat rögzített kérdőíves szerepadataiban is megjelenik: {roles}. Érdemes tisztázni a feladatmegosztást.",
      en: "Also represented in the team's frozen questionnaire evidence: {roles}. Clarify how responsibilities would be shared.",
    },
    complement: {
      hu: "A csapat rögzített elsődleges és másodlagos szerepei között nem jelenik meg: {roles}. Vizsgáljátok meg, van-e igény erre a hozzájárulásra; ez nem bizonyított hiány.",
      en: "Not represented among the team's frozen primary and secondary roles: {roles}. Explore whether this contribution is needed; this is not a proven deficit.",
    },
    question: {
      hu: "Milyen konkrét helyzetben segített, és mikor nehezítette az együttműködésedet a(z) {dimension} kapcsán leírt működés? Mit kérnél a csapattól az első hónapban?",
      en: "When has the preference described for {dimension} helped or complicated collaboration? What support would you ask from the team in your first month?",
    },
    roleQuestion: {
      hu: "Mikor vállaltad önként ezeket a szerepeket? Mutass egy példát az eredményére, és egyet arra, amikor másnak adtad át a feladatot.",
      en: "When have you voluntarily taken these roles? Give an example of the outcome and another of handing the responsibility to someone else.",
    },
    genericQuestion: {
      hu: "Mesélj egy közös feladatról, ahol eltérő munkamódokat kellett összehangolnod. Milyen elvárásokat és visszajelzési rendet egyeztetnél az első hónapban?",
      en: "Describe a task where you had to reconcile different working preferences. Which expectations and feedback routines would you agree on in your first month?",
    },
  },
};
