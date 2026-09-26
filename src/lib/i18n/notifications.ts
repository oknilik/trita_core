export const notificationTranslations = {
  notifications: {
    peerFeedbackRequested: {
      title: { hu: "Visszajelzést kérnek tőled", en: "Feedback requested from you" },
      body: { hu: "{name} visszajelzést kér tőled: „{topic}”. Pár percet vesz igénybe.", en: "{name} is asking for your feedback: \"{topic}\". It only takes a few minutes." },
    },
    peerFeedbackResponse: {
      title: { hu: "Válasz érkezett a kérésedre", en: "A response to your request arrived" },
      body: { hu: "Új választ kaptál a visszajelzéskérésedre. Csapat: „{team}”.", en: "A new response arrived to your feedback request in the {team} team." },
    },
    peerKudosReceived: {
      title: { hu: "Köszönetet kaptál", en: "You received kudos" },
      body: { hu: "{name} köszönetet mondott neked. Csapat: „{team}”.", en: "{name} sent you kudos in the {team} team." },
    },
    observerCompleted: {
      // Anonim üzenet — az értékelő neve szándékosan nem szerepel (a névvel a
      // futó átlagból beazonosítható lenne az utolsó értékelő).
      title: { hu: "Visszajelzés érkezett rólad", en: "Observer feedback received" },
      body: { hu: "Új visszajelzés érkezett a felmérésedhez.", en: "A new observer assessment was received." },
    },
    observerSubmitted: {
      title: { hu: "Értékelés elküldve", en: "Assessment submitted" },
      body: { hu: "Elküldted a visszajelzésedet. Az értékelést kérte: {inviterName}. Köszönjük!", en: "You successfully completed {inviterName}'s assessment. Thank you!" },
    },
    resultReady: {
      title: { hu: "Az eredményed elkészült", en: "Your results are ready" },
      body: { hu: "A személyiségteszted kiértékelése megtekinthető.", en: "Your personality assessment results are now available." },
    },
    // Páros összehasonlítás: a meghívó értesül, amikor a partner elfogadta.
    compareAccepted: {
      title: { hu: "Elfogadták az összehasonlítást", en: "Your comparison was accepted" },
      body: {
        hu: "{name} elfogadta a páros összehasonlítást – nézzétek meg, hogyan működnétek együtt.",
        en: "{name} accepted the pair comparison – see how the two of you would work together.",
      },
    },
    // Reflexiós utókövetés (D1): egyetlen, jól célzott érintés a kitöltés
    // után ~1 héttel — a "mi történik két hét múlva" rés első lépése.
    reflectionPrompt: {
      title: { hu: "Egy hét telt el. Mire ismertél rá magadban?", en: "A week has passed – what did you notice?" },
      body: {
        hu: "Ebben a dimenzióban kaptad a legmagasabb pontszámot: {dimLabelHu}. Figyeld meg, hogyan jelennek meg az ehhez kapcsolódó tulajdonságaid a hétköznapjaidban. A páros összehasonlítással azt is megnézheted, hogyan egészíthetitek ki egymást valakivel.",
        en: "Your highest-scoring dimension: {dimLabelEn}. Observe it deliberately in one situation this week – and if you're curious how you'd work with someone, try the pair comparison.",
      },
    },
    purchaseConfirmed: {
      title: { hu: "Sikeres vásárlás", en: "Purchase confirmed" },
      body: { hu: "A vásárlásodat feldolgoztuk.", en: "Your purchase has been successfully processed." },
    },
    orgInviteReceived: {
      title: { hu: "Szervezeti meghívás", en: "Organization invite" },
      body: { hu: "Meghívást kaptál a szervezetbe: „{orgName}”.", en: "You've been invited to join {orgName}." },
    },
    campaignLaunched: {
      title: { hu: "Mérés elindítva", en: "Measurement launched" },
      body: { hu: "Elindult a kampány: „{campaignName}”.", en: "The \"{campaignName}\" campaign is now active." },
    },
    stepOpened: {
      title: { hu: "Új mérés vár rád", en: "A new measurement is ready for you" },
      body: {
        hu: "Elérhető a következő feladatod ebben a mérésben: „{campaignName}”. Nyisd meg a kitöltéshez.",
        en: "Your next measurement step in \"{campaignName}\" is now open – it only takes a few minutes.",
      },
    },
    observerColleagueInvited: {
      title: { hu: "Kollégád visszajelzést kér tőled", en: "A colleague asked for your feedback" },
      body: {
        hu: "{inviterName} visszajelzést kér tőled a személyiségfelméréséhez. A kitöltés körülbelül 10 perc. A válaszaid név nélkül, összesítve jelennek meg.",
        en: "{inviterName} asked you for feedback on their personality picture – ~10 minutes; your answers appear anonymously, aggregated.",
      },
    },
    observerApprovalRequested: {
      title: { hu: "Külső értékelő meghívása vár jóváhagyásra", en: "External observer invite awaits approval" },
      body: {
        hu: "{inviterName} külső értékelőt hívna meg ({targetLabel}) – a mérés szabálya szerint ehhez jóváhagyás kell.",
        en: "{inviterName} wants to invite an external observer ({targetLabel}) – the campaign requires approval for this.",
      },
    },
    observerInviteApproved: {
      title: { hu: "Jóváhagyták a külső értékelő meghívását", en: "Your external invite was approved" },
      body: {
        hu: "Jóváhagyták a külső értékelő meghívását. A meghívót e-mailben elküldtük erre a címre: {targetLabel}.",
        en: "Your observer invite to {targetLabel} was approved – the invitation email has been sent.",
      },
    },
    observerInviteDeclined: {
      title: { hu: "Külső meghívód elutasítva", en: "Your external invite was declined" },
      body: {
        hu: "A vezetőd nem hagyta jóvá az értékelő-meghívódat erre a címre: {targetLabel}. Kérdés esetén egyeztess vele.",
        en: "Your observer invite to {targetLabel} was not approved by your manager. Please check with them if needed.",
      },
    },
    candidateCompleted: {
      title: { hu: "Elkészült a jelölt felmérése", en: "Candidate assessment completed" },
      body: {
        hu: "{name} kitöltötte a felmérést{position}. Megtekintheted az eredményét és a csapattal való összehasonlítást.",
        en: "{name} completed the assessment{position} – the result and team fit are ready to review.",
      },
    },
    inquiryReceived: {
      title: { hu: "Új kérdés érkezett", en: "New inquiry received" },
      body: {
        hu: "{name} kérdést küldött ({topic}). Nézd meg és válaszolj rá.",
        en: "{name} sent an inquiry ({topic}). Review and respond.",
      },
    },
    campaignClosed: {
      title: { hu: "Mérés lezárva", en: "Measurement closed" },
      body: { hu: "Lezárult a kampány: „{campaignName}”.", en: "The \"{campaignName}\" campaign has closed." },
    },
    teamReportPublished: {
      title: { hu: "A csapatkép elkészült", en: "Team picture ready" },
      body: { hu: "Elérhető a tanácsadó által jóváhagyott csapatkép: „{teamName}”.", en: "The consultant-approved team picture for {teamName} is available." },
    },
    teamMemberAdded: {
      title: { hu: "Csapatba kerültél", en: "You've been added to a team" },
      body: {
        hu: "Felvettek a csapatba: „{teamName}”. Az eddigi eredményeid megmaradnak – nem kell újra kitöltened a felmérést.",
        en: "You've been added to the {teamName} team. Your existing results carry over – no need to retake the assessment.",
      },
    },
    orgInviteAccepted: {
      title: { hu: "Meghívás elfogadva", en: "Invite accepted" },
      body: { hu: "{name} csatlakozott a szervezetedhez.", en: "{name} has joined your organization." },
    },
    trialEndingSoon: {
      title: { hu: "Próbaidőszak hamarosan lejár", en: "Trial ending soon" },
      body: { hu: "A próbaidőszakod {days} nap múlva lejár.", en: "Your trial expires in {days} days." },
    },
    trialExpired: {
      title: { hu: "Próbaidőszak lejárt", en: "Trial expired" },
      body: { hu: "A próbaidőszakod lejárt. Válassz csomagot a folytatáshoz.", en: "Your trial has expired. Choose a plan to continue." },
    },
    paymentFailed: {
      title: { hu: "Sikertelen fizetés", en: "Payment failed" },
      body: { hu: "A legutóbbi fizetési kísérlet sikertelen volt.", en: "Your latest payment attempt failed." },
    },
    subscriptionFrozen: {
      title: { hu: "Előfizetés felfüggesztve", en: "Subscription frozen" },
      body: { hu: "Az előfizetésedet felfüggesztettük.", en: "Your subscription has been frozen." },
    },
    lowCandidateCredits: {
      title: { hu: "Alacsony jelöltkeret", en: "Low candidate credits" },
      body: { hu: "Még {remaining} jelölt felmérésére van lehetőséged.", en: "Only {remaining} candidate credits remaining." },
    },
    memberCompletedAssessment: {
      title: { hu: "Egy csapattag kitöltötte az önértékelést", en: "Member completed assessment" },
      body: { hu: "{name} elvégezte az önértékelést.", en: "{name} completed their self-assessment." },
    },
    campaignMilestone: {
      title: { hu: "A mérés újabb szakaszhoz ért", en: "Measurement milestone" },
      body: { hu: "Elérte a {percent}%-os kitöltöttséget a kampány: „{campaignName}”.", en: "Campaign \"{campaignName}\" reached {percent}% completion." },
    },
    // CRM (admin-only felület, de a kulcskészlet HU+EN a hub-konvenció szerint)
    crmNextActionDue: {
      title: { hu: "Esedékes következő lépés", en: "Next action due" },
      body: {
        hu: "„{deal}” – a kitűzött következő lépés esedékes ({date}). Nézz rá a CRM-ben.",
        en: "\"{deal}\" – the scheduled next action is due ({date}). Review it in the CRM.",
      },
    },
    crmQuoteExpiring: {
      title: { hu: "Ajánlat hamarosan lejár", en: "Quote expiring soon" },
      body: {
        hu: "Hamarosan lejár ez az ajánlat: {quoteNo}. Ügylet: „{deal}”. Érvényesség vége: {date}. Egyeztess az ügyféllel a folytatásról.",
        en: "{quoteNo} – \"{deal}\": the quote is valid until {date}. Time to follow up.",
      },
    },
    legalAcceptanceRequired: {
      title: { hu: "Új jogi feltételek várnak elfogadásra", en: "Updated legal terms require acceptance" },
      body: {
        hu: "A trita használatának folytatásához tekintsd át és fogadd el a frissített feltételeket.",
        en: "Review and accept the updated terms to continue using trita.",
      },
    },

    // UI labels
    markAllRead: { hu: "Összes olvasottnak jelölése", en: "Mark all as read" },
    noNotifications: { hu: "Nincs új értesítés", en: "No new notifications" },
    emptyHint: {
      hu: "Kérj visszajelzést egy ismerősödtől, vagy indíts páros összehasonlítást.",
      en: "For fresh feedback, invite someone as an observer or start a pair comparison.",
    },
    bellLabel: { hu: "Értesítések", en: "Notifications" },
    // B16u — elvetés visszavonási ablakkal
    dismiss: { hu: "Értesítés elvetése", en: "Dismiss notification" },
    dismissedLabel: { hu: "Elvetve", en: "Dismissed" },
    undo: { hu: "Visszavonás", en: "Undo" },
  },
};
