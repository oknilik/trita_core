// Karrier-iránytű fake door — szövegek.
//
// Két szabály minden mondatra:
//  · Nem ígérhet olyat, amit nem szállítunk. Nincs kitalált szám, nincs
//    „%-os illeszkedés" — a küszöbalapú módszertan ilyet nem ad, és egy
//    fantázia-előnézet pont a módszertani pozíciót rombolná le.
//  · Az őszinteségi keret marad: készülő funkció, még nem létezik, most nem
//    kérünk fizetést. Ez a megkülönböztető jegyünk, nem gyengeség.

export const fakeDoorTranslations = {
  fakeDoor: {
    // ── Hero (T6) ─────────────────────────────────────────────────────
    badge: { hu: "Készülő funkció", en: "In development" },
    badgeNote: {
      hu: "Ez a funkció még nem létezik — azt mérjük, érdemes-e megépíteni.",
      en: "This feature doesn't exist yet — we're measuring whether it's worth building.",
    },
    eyebrow: { hu: "Karrier-iránytű", en: "Career compass" },
    heroTitle: {
      hu: "Lehet, hogy nem veled van a baj. Csak rossz szerepben vagy.",
      en: "Maybe nothing's wrong with you. You're just in the wrong role.",
    },
    heroLead: {
      hu: "Már látjuk, hogyan működsz. Most azt mutatnánk meg, hol lennél ebben erős — és hol húzna le a szerep.",
      en: "We can already see how you work. Next we'd show where that makes you strong — and where the role would drag you down.",
    },
    /** T10: a fő pozicionálás a hero alá emelve, nem kártya-végi lábjegyzetbe. */
    heroPositioning: {
      hu: "Nem jóslat, hanem kiindulópont.",
      en: "A starting point, not a prediction.",
    },
    heroPersonal: {
      hu: "A te mintázatod: {pattern}. Ebből indulna.",
      en: "Your pattern: {pattern}. That's where it would start.",
    },

    // ── „Wow" blokk (T9) ──────────────────────────────────────────────
    wow: {
      hu: "Ugyanaz az ember lehet kiváló termékfejlesztő, közepes projektvezető és gyenge értékesítő. Nem azért, mert az egyikhez kevésbé tehetséges — hanem mert a három szerep teljesen mást követel tőle.",
      en: "The same person can be an excellent product developer, a mediocre project lead and a weak salesperson. Not because they're less talented at one — but because the three roles demand completely different things of them.",
    },

    // ── Kártyák (T10) ─────────────────────────────────────────────────
    whatTitle: { hu: "Mit kapnál", en: "What you'd get" },
    card1Lead: { hu: "Hol lennél a helyeden", en: "Where you'd be in your element" },
    card1Body: {
      hu: "Munka-területek, ahol a mintázatod előny lehet — mindegyikhez néhány példa-szerep, és jelölve, mi elérhető most, és mihez kellene képzés.",
      en: "Areas of work where your pattern could be an advantage — each with example roles, marked for what's reachable now and what would need training.",
    },
    card2Lead: { hu: "Miért éppen ott", en: "Why exactly there" },
    card2Body: {
      hu: "Melyik vonásod húz arra, és hol feszülhet. Minden állítás mellé odatesszük, mennyire biztos.",
      en: "Which trait pulls you there, and where it might strain. Every claim comes with how certain it is.",
    },
    card3Lead: { hu: "Kis, kipróbálható lépések", en: "Small steps you can try" },
    card3Body: {
      hu: "Nem kell azonnal váltanod: néhány alacsony kockázatú lépés, és álláshirdetés-kulcsszavak — mit keress, és mi legyen gyanús.",
      en: "No need to switch anything right away: a few low-risk steps, plus job-ad keywords — what to look for and what should raise a flag.",
    },
    card4Lead: { hu: "Vihető összefoglaló", en: "A summary you can take along" },
    card4Body: {
      hu: "Egy letölthető oldal, amit elvihetsz egy beszélgetésre — vezetőhöz, mentorhoz vagy tanácsadóhoz.",
      en: "A downloadable page you can bring to a conversation — with a manager, mentor or advisor.",
    },

    // ── Bizalom (T8) ──────────────────────────────────────────────────
    trustTitle: { hu: "Mire épül", en: "What it's built on" },
    trustItem1: { hu: "hatfaktoros személyiségmodell", en: "a six-factor personality model" },
    trustItem2: { hu: "munkahelyi illeszkedés-kutatások", en: "workplace fit research" },
    trustItem3: { hu: "csapatszerep-modellek", en: "team role models" },
    trustItem4: {
      hu: "saját mintánk 189 kitöltő adatán validálva",
      en: "validated on our own sample of 189 respondents",
    },

    // ── Ár (T11) ──────────────────────────────────────────────────────
    priceLabel: { hu: "Tervezett ár", en: "Planned price" },
    priceFraming: {
      hu: "Egyszeri díj — nagyjából egy coaching óra ára.",
      en: "A one-off fee — about the price of a single coaching hour.",
    },
    // Kiemelt sor, nem szürke lábjegyzet: ez az oldal legfontosabb ígérete.
    // NINCS pénzvisszafizetési ígéret: a funkció nem létezik, fizetési
    // folyamat sincs — egy visszatérítés-ígéret valótlan állítás lenne.
    priceNoCard: {
      hu: "Most nem fizetsz, és bankkártya-adatot sem kérünk. Ha megépítjük, újra döntesz.",
      en: "You're not paying now, and we don't collect card details. If we build it, you decide again.",
    },

    // ── Döntés ───────────────────────────────────────────────────────
    askTitle: { hu: "Megvennéd ezt ennyiért?", en: "Would you buy this at that price?" },
    askNote: {
      hu: "A válaszod dönti el, megépül-e. A „nem” ugyanolyan hasznos, mint az „igen”.",
      en: "Your answer decides whether it gets built. A “no” is just as useful as a “yes”.",
    },
    yes: { hu: "Igen, megvenném", en: "Yes, I'd buy it" },
    no: { hu: "Nem venném meg", en: "No, I wouldn't" },

    // ── „Igen" ág (T3) ────────────────────────────────────────────────
    goalTitle: { hu: "Mi lenne számodra a legértékesebb ebből?", en: "What would be most valuable to you here?" },
    goalFit: { hu: "Megtudni, milyen munkák illenek hozzám", en: "Finding out what work suits me" },
    goalSwitch: { hu: "Pályaváltás előtt dönteni", en: "Deciding before a career change" },
    goalInterview: { hu: "Állásinterjúra felkészülni", en: "Preparing for an interview" },
    goalConfirm: { hu: "Megerősítést kapni, hogy jó helyen vagyok", en: "Confirming I'm in the right place" },
    goalOther: { hu: "Egyéb", en: "Something else" },
    otherPlaceholder: { hu: "Írd le pár szóban", en: "Tell us in a few words" },
    notifyTitle: { hu: "Szóljunk, amikor elkészül?", en: "Shall we tell you when it's ready?" },
    notifyNote: {
      hu: "Csak erről az egy funkcióról írunk, és bármikor leiratkozhatsz.",
      en: "We'd only write about this one feature, and you can unsubscribe any time.",
    },
    emailPlaceholder: { hu: "email@pelda.hu", en: "you@example.com" },
    emailInvalid: { hu: "Ez az e-mail-cím nem tűnik érvényesnek.", en: "That email doesn't look valid." },

    // ── „Nem" ág (T4) ─────────────────────────────────────────────────
    reasonTitle: { hu: "Mi tartana vissza leginkább?", en: "What would hold you back most?" },
    reasonPrice: { hu: "Drágának tűnik", en: "Feels expensive" },
    reasonAccuracy: { hu: "Nem hiszem, hogy elég pontos lenne", en: "I doubt it would be accurate enough" },
    reasonNoNeed: { hu: "Most nem foglalkoztat a karrierem", en: "My career isn't on my mind right now" },
    reasonOther: { hu: "Egyéb", en: "Something else" },
    // Ár-csúszka: a „drága" önmagában nem mond semmit arról, MENNYI lenne jó.
    priceAskTitle: { hu: "Mennyit fizetnél érte szívesen?", en: "What would you happily pay for it?" },
    priceAskNote: {
      hu: "Húzd oda, ahol már megérné neked. A nulla is válasz: azt jelenti, ezért a funkcióért nem fizetnél.",
      en: "Drag it to where it would be worth it to you. Zero is an answer too: it means you wouldn't pay for this feature.",
    },
    priceZero: { hu: "Ezért nem fizetnék", en: "I wouldn't pay for this" },

    // ── Közös ────────────────────────────────────────────────────────
    submit: { hu: "Elküldöm", en: "Send it" },
    skip: { hu: "Kihagyom", en: "Skip this" },
    thanksTitle: { hu: "Köszönjük — ez ugyanolyan hasznos.", en: "Thank you — that's just as useful." },
    thanksNote: {
      hu: "Nem ígérünk határidőt: ha nem lesz elég érdeklődés, ez a modul nem épül meg.",
      en: "We're not promising a date: if there isn't enough interest, this module won't be built.",
    },
    thanksEmail: {
      hu: "Az e-mail-címedet feljegyeztük — csak erről a funkcióról írunk.",
      en: "We've noted your email — we'll only write about this feature.",
    },
    changeAnswer: { hu: "Meggondoltam magam", en: "I changed my mind" },
    error: { hu: "Nem sikerült elmenteni, próbáld újra.", en: "Couldn't save it, please try again." },
    back: { hu: "Vissza az eredményeidhez", en: "Back to your results" },

    // ── Átvezető a riport aljáról ────────────────────────────────────
    ctaTitle: {
      hu: "Lehet, hogy nem veled van a baj — csak rossz szerepben vagy.",
      en: "Maybe nothing's wrong with you — you're just in the wrong role.",
    },
    ctaBody: {
      hu: "Karrier-iránytű készül a profilodra. Nézd meg, mit tudna — és mondd meg, megvennéd-e.",
      en: "A career compass is in the works for your profile. See what it would do — and tell us if you'd buy it.",
    },
    ctaButton: { hu: "Megnézem, mit tudna", en: "See what it would do" },
  },
} as const;
