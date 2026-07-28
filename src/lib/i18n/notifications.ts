export const notificationTranslations = {
  notifications: {
    peerFeedbackRequested: {
      title: { hu: "Visszajelzést kérnek tőled", en: "Feedback requested from you" },
      body: { hu: "{name} visszajelzést kér tőled: „{topic}”. Pár percet vesz igénybe.", en: "{name} is asking for your feedback: \"{topic}\". It only takes a few minutes." },
    },
    peerFeedbackResponse: {
      title: { hu: "Válasz érkezett a kérésedre", en: "A response to your request arrived" },
      body: { hu: "Új válasz érkezett a visszajelzés-kérésedre a(z) {team} csapatban.", en: "A new response arrived to your feedback request in the {team} team." },
    },
    peerKudosReceived: {
      title: { hu: "Köszönetet kaptál", en: "You received kudos" },
      body: { hu: "{name} köszönetet küldött neked a(z) {team} csapatban.", en: "{name} sent you kudos in the {team} team." },
    },
    observerCompleted: {
      title: { hu: "Megfigyelői visszajelzés érkezett", en: "Observer feedback received" },
      body: { hu: "{name} kitöltötte a megfigyelői értékelést.", en: "{name} completed the observer assessment." },
    },
    observerSubmitted: {
      title: { hu: "Értékelés elküldve", en: "Assessment submitted" },
      body: { hu: "Sikeresen kitöltötted {inviterName} értékelését. Köszönjük!", en: "You successfully completed {inviterName}'s assessment. Thank you!" },
    },
    resultReady: {
      title: { hu: "Az eredményed elkészült", en: "Your results are ready" },
      body: { hu: "A személyiségteszted kiértékelése megtekinthető.", en: "Your personality assessment results are now available." },
    },
    purchaseConfirmed: {
      title: { hu: "Sikeres vásárlás", en: "Purchase confirmed" },
      body: { hu: "A vásárlásodat feldolgoztuk.", en: "Your purchase has been successfully processed." },
    },
    orgInviteReceived: {
      title: { hu: "Szervezeti meghívás", en: "Organization invite" },
      body: { hu: "Meghívást kaptál a(z) {orgName} szervezetbe.", en: "You've been invited to join {orgName}." },
    },
    campaignLaunched: {
      title: { hu: "Mérés elindítva", en: "Measurement launched" },
      body: { hu: "A(z) \"{campaignName}\" kampány aktív.", en: "The \"{campaignName}\" campaign is now active." },
    },
    stepOpened: {
      title: { hu: "Új mérés vár rád", en: "A new measurement is ready for you" },
      body: {
        hu: "A(z) \"{campaignName}\" kampányban megnyílt a következő méréslépésed — pár perc az egész, kattints és töltsd ki.",
        en: "Your next measurement step in \"{campaignName}\" is now open — it only takes a few minutes.",
      },
    },
    observerColleagueInvited: {
      title: { hu: "Kollégád visszajelzést kér tőled", en: "A colleague asked for your feedback" },
      body: {
        hu: "{inviterName} arra kér, hogy adj visszajelzést a személyiségképéhez — ~10 perc, a válaszaid név nélkül, összesítve jelennek meg.",
        en: "{inviterName} asked you for feedback on their personality picture — ~10 minutes; your answers appear anonymously, aggregated.",
      },
    },
    observerApprovalRequested: {
      title: { hu: "Külső értékelő-meghívó vár jóváhagyásra", en: "External observer invite awaits approval" },
      body: {
        hu: "{inviterName} külső értékelőt hívna meg ({targetLabel}) — a mérés szabálya szerint ehhez jóváhagyás kell.",
        en: "{inviterName} wants to invite an external observer ({targetLabel}) — the campaign requires approval for this.",
      },
    },
    observerInviteApproved: {
      title: { hu: "Külső meghívód jóváhagyva", en: "Your external invite was approved" },
      body: {
        hu: "A(z) {targetLabel} címre szóló értékelő-meghívódat jóváhagyták — a meghívó e-mail kiment.",
        en: "Your observer invite to {targetLabel} was approved — the invitation email has been sent.",
      },
    },
    observerInviteDeclined: {
      title: { hu: "Külső meghívód elutasítva", en: "Your external invite was declined" },
      body: {
        hu: "A(z) {targetLabel} címre szóló értékelő-meghívódat a vezetőd nem hagyta jóvá. Kérdés esetén egyeztess vele.",
        en: "Your observer invite to {targetLabel} was not approved by your manager. Please check with them if needed.",
      },
    },
    candidateCompleted: {
      title: { hu: "Jelölt-felmérés elkészült", en: "Candidate assessment completed" },
      body: {
        hu: "{name} kitöltötte a felmérést{position} — az eredmény és a csapat-illesztés megnyitható.",
        en: "{name} completed the assessment{position} — the result and team fit are ready to review.",
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
      body: { hu: "A(z) \"{campaignName}\" kampány lezárult.", en: "The \"{campaignName}\" campaign has closed." },
    },
    teamReportPublished: {
      title: { hu: "A csapatkép elkészült", en: "Team picture ready" },
      body: { hu: "A(z) {teamName} csapat validált csapatképe elérhető.", en: "The validated team picture for {teamName} is available." },
    },
    teamMemberAdded: {
      title: { hu: "Új csapattag", en: "New team member" },
      body: { hu: "{name} csatlakozott a(z) {teamName} csapathoz.", en: "{name} joined the {teamName} team." },
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
      body: { hu: "Már csak {remaining} jelöltkeret maradt.", en: "Only {remaining} candidate credits remaining." },
    },
    memberCompletedAssessment: {
      title: { hu: "Tag elvégezte az értékelést", en: "Member completed assessment" },
      body: { hu: "{name} elvégezte az önértékelést.", en: "{name} completed their self-assessment." },
    },
    campaignMilestone: {
      title: { hu: "Mérés mérföldkő", en: "Measurement milestone" },
      body: { hu: "A(z) \"{campaignName}\" kampány {percent}%-os kitöltöttséget ért el.", en: "Campaign \"{campaignName}\" reached {percent}% completion." },
    },

    // UI labels
    markAllRead: { hu: "Összes olvasottnak jelölése", en: "Mark all as read" },
    noNotifications: { hu: "Nincs új értesítés", en: "No new notifications" },
    bellLabel: { hu: "Értesítések", en: "Notifications" },
  },
};
