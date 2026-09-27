export const programReviewTranslations = {
  programReview: {
    baselineSource: {
      hu: "Kiinduló riport: {date}. A személyiségadatok ebből a korábbi mérésből származnak; ebben a körben nem mértük újra őket.",
      en: "Baseline report: {date}. Personality is historical context from this measurement, not a remeasurement.",
    },
    personalitySource: {
      hu: "Korábbi személyiségmérés · kiinduló riport: {date}. Ezek az adatok háttérként segítik az értelmezést; a jelenlegi körben nem mértük újra őket.",
      en: "Previous personality measurement · baseline report: {date}. Historical context, not remeasured in this round.",
    },
    observerRequirement: {
      hu: "Résztvevőnként {count} visszajelzést várunk. Amíg ezek beérkeznek, a többi kérdőívet továbbra is ki lehet tölteni. Ha nincs meg minden válasz, a tanácsadó indoklással fogadhatja el a hiányos visszajelzéseket a riporthoz.",
      en: "The target is {count} responses per participant. Waiting does not block other questionnaires. A consultant may accept incomplete coverage with a documented rationale in the report.",
    },
    closeHelp: {
      hu: "A mérés lezárása után már nem érkezhet új válasz. Hiányos mérés is lezárható, a riport jóváhagyásához viszont minden kötelező adatminimumot teljesíteni kell.",
      en: "Closing ends data collection. An incomplete measurement may be closed, but the report can only be approved when data minimums are met.",
    },
    measure: { hu: "Terület", en: "Measure" },
    previous: { hu: "Korábbi", en: "Previous" },
    current: { hu: "Jelenlegi", en: "Current" },
    difference: { hu: "Eltérés", en: "Difference" },
    overrideTitle: {
      hu: "Hiányzó visszajelzések elfogadása",
      en: "Accept incomplete observer coverage",
    },
    overrideHelp: {
      hu: "Tanácsadóként elfogadhatod a hiányos visszajelzéseket. Legalább 20 karakterben indokold meg, miért értelmezhető így is a riport. Az indoklás és a lefedettség a közzétett riportban is megjelenik. Ha a mezőt üresen hagyod, minden résztvevőnél el kell érni az előírt visszajelzésszámot. A többi mérés minimális követelményei nem módosíthatók.",
      en: "Optional consultant decision: explain in at least 20 characters why the report can be interpreted despite missing observer responses. The reason and coverage appear in the published report. Leave blank to require complete observer coverage. Other measurement minimums cannot be overridden.",
    },
    overrideCoverage: {
      hu: "{completed}/{total} résztvevő kapta meg a szükséges számú visszajelzést. A tanácsadó a hiányzó válaszok mellett is értelmezhetőnek ítélte a riportot; indoklását alább olvashatod.",
      en: "Incomplete observer coverage: {completed}/{total} participants reached the required response count. This report uses a consultant override.",
    },
    overrideReason: {
      hu: "A tanácsadó indoklása: {reason}",
      en: "Consultant rationale: {reason}",
    },
    uncertainty: {
      hu: "A pontszám becslés. A rövid kérdőívben egy személyiségdimenzió egyéni pontszámának közelítő, 95%-os mérési hibasávja ±{margin} pont. Ebből nem állapítható meg, hogy a csapatátlagtól való eltérés statisztikailag szignifikáns-e, és nem ad alkalmassági minősítést sem.",
      en: "Scores are estimates. An individual dimension score from the short questionnaire has an approximate 95% measurement-error margin of ±{margin} points. This is not a significance test against the team mean or a suitability rating.",
    },
    neutral: {
      hu: "{dimension}: a skála két vége eltérő jellemzőket ír le. Egyik sem jelent önmagában erősséget vagy hiányosságot.",
      en: "{dimension}: both poles describe characteristics, not strengths or deficits.",
    },
  },
};
