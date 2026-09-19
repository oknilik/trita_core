export const programReviewTranslations = {
  programReview: {
    baselineSource: {
      hu: "Kiinduló riport: {date}. A személyiségréteg ebből a korábbi mérésből származik; nem újramérés.",
      en: "Baseline report: {date}. Personality is historical context from this measurement, not a remeasurement.",
    },
    personalitySource: {
      hu: "Korábbi személyiségmérés · kiinduló riport: {date}. Történeti háttér, nem a jelen kör újramérése.",
      en: "Previous personality measurement · baseline report: {date}. Historical context, not remeasured in this round.",
    },
    observerRequirement: {
      hu: "Résztvevőnként {count} válasz a cél. A várakozás nem zárja le a többi kérdőívet. Hiányos lefedettséget a tanácsadó indoklással fogadhat el a riportban.",
      en: "The target is {count} responses per participant. Waiting does not block other questionnaires. A consultant may accept incomplete coverage with a documented rationale in the report.",
    },
    closeHelp: {
      hu: "A lezárás befejezi az adatgyűjtést. Hiányos mérés is lezárható, de riport csak az adatminimumok teljesülése után hagyható jóvá.",
      en: "Closing ends data collection. An incomplete measurement may be closed, but the report can only be approved when data minimums are met.",
    },
    measure: { hu: "Terület", en: "Measure" },
    previous: { hu: "Korábbi", en: "Previous" },
    current: { hu: "Jelenlegi", en: "Current" },
    difference: { hu: "Eltérés", en: "Difference" },
    overrideTitle: {
      hu: "Hiányos külső visszajelzés elfogadása",
      en: "Accept incomplete observer coverage",
    },
    overrideHelp: {
      hu: "Opcionális tanácsadói döntés: legalább 20 karakterben indokold, miért értékelhető a riport a hiányzó külső válaszok mellett. Az indoklás és a lefedettség a publikált riportban is megjelenik. Üres mező esetén a teljes observer-kapu érvényes. A többi mérés minimumai nem írhatók felül.",
      en: "Optional consultant decision: explain in at least 20 characters why the report can be interpreted despite missing observer responses. The reason and coverage appear in the published report. Leave blank to require complete observer coverage. Other measurement minimums cannot be overridden.",
    },
    overrideCoverage: {
      hu: "Hiányos külső visszajelzés: {completed}/{total} résztvevő érte el a szükséges válaszszámot. A riport tanácsadói felülbírálással készült.",
      en: "Incomplete observer coverage: {completed}/{total} participants reached the required response count. This report uses a consultant override.",
    },
    overrideReason: {
      hu: "A tanácsadó indoklása: {reason}",
      en: "Consultant rationale: {reason}",
    },
    uncertainty: {
      hu: "A pontérték becslés. A rövid kérdőív egyéni dimenzióértékének közelítő 95%-os mérési hibasávja ±{margin} pont. Ez nem a csapatátlagtól való eltérés szignifikanciatesztje és nem alkalmassági minősítés.",
      en: "Scores are estimates. An individual dimension score from the short questionnaire has an approximate 95% measurement-error margin of ±{margin} points. This is not a significance test against the team mean or a suitability rating.",
    },
    neutral: {
      hu: "{dimension}: mindkét pólus leíró jellemző, nem erősség vagy hiányosság.",
      en: "{dimension}: both poles describe characteristics, not strengths or deficits.",
    },
  },
};
