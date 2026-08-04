// Értesítések — notification hub (harang, panel, olvasottság, dedupe) és az
// e-mail láb (reflexiós utókövetés, compare-accepted, lifecycle opt-out).
// Forrás-kód: src/lib/notifications/{orchestrator,repository,types,sweep}.ts,
// src/components/layout/{NotificationBell,NotificationPanel,NotificationsProvider}.tsx,
// src/app/api/notifications/*, src/app/api/cron/release-steps/route.ts,
// src/app/(app)/email-preferences/, src/app/api/interaction/invite/[token]/accept/route.ts.
export const cases = [
  // ── Notification hub (in-app) ────────────────────────────────────────────
  {
    id: "NOTIF-01",
    area: "Értesítések",
    name: "Harang-badge: új eseménynél olvasatlan-számláló jelenik meg",
    persona: "self-user + observer",
    emails: { fő: "AUTO", observer: "AUTO" },
    preconditions:
      "A fő fióknak nincs olvasatlan értesítése (üres harang); van kiküldött observer-meghívója.",
    steps:
      "1. A fő fiókkal maradj belépve bármely belső oldalon. 2. Inkognitóban töltsd ki a fő egyik observer-meghívóját (beküldésig). 3. A fő oldalán várj legfeljebb 1 percet (háttér-poll) vagy navigálj egyet. 4. Nézd meg a fejléc harang-ikonját.",
    expected:
      "A harangon megjelenik a kerek olvasatlan-badge „1” értékkel (99 felett 99+ formában). A panelt megnyitva az új „observer kitöltött” tétel olvasatlanként (fehér háttér, félkövér cím) áll a lista tetején.",
    automated: "none",
    coveredBy: "",
    priority: "P1",
  },
  {
    id: "NOTIF-02",
    area: "Értesítések",
    name: "Panel nyitás/zárás: harang-kattintás, Escape, kattintás mellé",
    persona: "self-user",
    emails: { fő: "AUTO" },
    preconditions: "A fő fióknak van legalább 1 értesítése (pl. NOTIF-01 után).",
    steps:
      "1. Kattints a harangra — figyeld a betöltést. 2. Zárd be Escape billentyűvel. 3. Nyisd meg újra, zárd be a panelen kívülre kattintva. 4. Nyisd meg és zárd be a harangra újra kattintva. 5. Nyisd meg gyors egymásutánban kétszer.",
    expected:
      "Nyitáskor rövid spinner után a lista jelenik meg fejléccel („Értesítések”). Mindhárom zárási mód működik (Escape, kívülre kattintás, harang-toggle). A gyors újranyitás nem indít újabb lekérést (20 mp-en belül a gyorsítótárazott lista jön) — a lista nem villog/duplázódik.",
    automated: "none",
    coveredBy: "",
    priority: "P1",
  },
  {
    id: "NOTIF-03",
    area: "Értesítések",
    name: "Üres panel: nem zsákutca — következő-lépés súgósor",
    persona: "self-user",
    emails: { fő: "AUTO" },
    preconditions: "Friss fiók értesítés nélkül (vagy minden tétel elvetve).",
    steps: "1. Kattints a harangra. 2. Olvasd el az üres állapot szövegeit.",
    expected:
      "„Nincs értesítésed” főszöveg alatt halvány súgósor jelenik meg (UX-B16), amely megmondja, mi fog ide érkezni / mi a következő értelmes lépés — a panel nem üres zsákutca.",
    automated: "none",
    coveredBy: "",
    priority: "P3",
  },
  {
    id: "NOTIF-04",
    area: "Értesítések",
    name: "Olvasottnak jelölés egyenként: kattintás olvasottá tesz ÉS a céloldalra visz",
    persona: "self-user",
    emails: { fő: "AUTO" },
    preconditions: "Legalább 2 olvasatlan értesítés (pl. observer-kitöltések után), badge > 0.",
    steps:
      "1. Nyisd meg a panelt, jegyezd fel a badge-értéket. 2. Kattints az egyik olvasatlan tétel törzsére. 3. A céloldalon nézd meg a harangot. 4. Nyisd meg újra a panelt, keresd meg a tételt.",
    expected:
      "A kattintás a tétel linkjére navigál (pl. observer-kitöltésnél a Külső kép fülre), és a tétel MÁR a navigáció előtt olvasottá válik: a badge eggyel csökken és az új oldal betöltése után sem ugrik vissza. A panelben a tétel némított stílusú (szürke, nem félkövér), a többi olvasatlan érintetlen.",
    automated: "none",
    coveredBy: "",
    priority: "P1",
  },
  {
    id: "NOTIF-05",
    area: "Értesítések",
    name: "Összes olvasottnak jelölése a panel fejlécéből",
    persona: "self-user",
    emails: { fő: "AUTO" },
    preconditions: "Több (2+) olvasatlan értesítés.",
    steps:
      "1. Nyisd meg a panelt — a fejlécben látszik az „Összes olvasottnak jelölése” link. 2. Kattints rá. 3. Figyeld a badge-et és a listát. 4. Zárd be, nyisd újra a panelt.",
    expected:
      "Minden tétel némított/olvasott stílusra vált, a harang-badge eltűnik (0). Újranyitáskor a fejléc-link már NEM látszik (nincs olvasatlan); a tételek maguk megmaradnak a listában.",
    automated: "none",
    coveredBy: "",
    priority: "P2",
  },
  {
    id: "NOTIF-06",
    area: "Értesítések",
    name: "Kategória-ikonok és prioritás-jelzés a panelben",
    persona: "self-user (org-tag)",
    emails: { fő: "AUTO" },
    preconditions:
      "Vegyes értesítés-készlet: observer- (pl. kitöltés), org- (pl. csapatba felvétel), kampány- (indítás) és assessment-tétel — org-környezetben összegyűjthető.",
    steps:
      "1. Nyisd meg a panelt olvasatlan tételekkel. 2. Hasonlítsd össze az ikon-plakettek színét kategóriánként. 3. Keress magas prioritású tételt (pl. csapat-riport publikálva). 4. Jelöld olvasottra az egyiket, nézd meg újra az ikonját.",
    expected:
      "Az ikon-plakett kategóriánként eltérő színű (observer: lila, org: kék, kampány: zöld, assessment: indigó, billing: borostyán, system: semleges), az ikon-glif típusonként értelmes. Magas prioritású OLVASATLAN tétel címe mellett piros pötty áll. Olvasott tételnél a plakett semleges szürkére vált.",
    automated: "partial",
    coveredBy:
      "tests/unit/notifications/notification-types.test.ts (kategória/prioritás-meta + i18n kulcsok)",
    priority: "P3",
  },
  {
    id: "NOTIF-07",
    area: "Értesítések",
    name: "Dedupe: ugyanaz az esemény nem hoz létre két értesítést",
    persona: "self-user + partner",
    emails: { fő: "AUTO", partner: "AUTO" },
    preconditions:
      "A fő páros-összehasonlítás meghívót küldött a partnernek (/interaction), a partnernek kész self-eredménye van.",
    steps:
      "1. A partner nyissa meg a compare-linket és fogadja el — a megerősítő gombra kattintson gyors egymásutánban KÉTSZER (dupla katt). 2. A fő fiókkal nyisd meg a harang-panelt, számold meg a „elfogadta az összehasonlítást” tételeket. 3. A partner nyissa meg újra a linket (ha a felület újra felkínálja, fogadja el ismét). 4. A fő paneljét frissítsd újra.",
    expected:
      "A főnél PONTOSAN EGY compare-accepted értesítés van — sem a dupla kattintás, sem az ismételt elfogadás nem duplázza (az elfogadás idempotens, az értesítés dedupe-kulcsos: eseményenként+címzettenként egyszeri). A tétel olvasottra jelölése után sem születik újra ugyanarra az eseményre.",
    automated: "partial",
    coveredBy: "tests/unit/notifications/notification-dedupe.test.ts",
    priority: "P1",
  },
  {
    id: "NOTIF-08",
    area: "Értesítések",
    name: "Tétel elvetése (✕): eltűnik és nem tér vissza",
    persona: "self-user",
    emails: { fő: "AUTO" },
    preconditions: "Legalább 2 értesítés a panelben.",
    steps:
      "1. Nyisd meg a panelt, kattints egy tétel ✕ gombjára. 2. Figyeld, hogy a kattintás NEM navigál el. 3. Zárd be, nyisd újra a panelt; frissítsd az oldalt is.",
    expected:
      "A tétel azonnal eltűnik a listából; a ✕ nem indítja el a tétel linkjét. Újranyitás és teljes oldal-frissítés után sem tér vissza (szerver-oldali soft-dismiss), a többi tétel érintetlen.",
    automated: "none",
    coveredBy: "",
    priority: "P3",
  },

  // ── E-mail láb ───────────────────────────────────────────────────────────
  {
    id: "NOTIF-09",
    area: "Értesítések",
    name: "Reflexiós utókövetés ~1 héttel a kitöltés után: in-app + személyre szabott e-mail",
    persona: "self-user",
    emails: { fő: "AUTO" },
    preconditions:
      "A fő legfrissebb self-eredménye 7–10 napja született (teszt-DB-ben a createdAt 8 nappal korábbra állítva — dev-segítség), lifecycle-emailekről NEM iratkozott le. A napi cron kézzel meghívható (GET /api/cron/release-steps, Bearer CRON_SECRET) vagy kivárható (05:00 UTC).",
    steps:
      "1. Futtasd le a cron-hívást (vagy várd meg a napi futást). 2. A fő fiókkal nézd meg a harang-panelt. 3. Nyisd meg a fő postafiókját. 4. Kattints az e-mail CTA-jára és az in-app tétel linkjére.",
    expected:
      "A fő EGY reflexiós in-app értesítést kap (assessment-kategória, alacsony prioritás), szövegében a legerősebb dimenziója nevesítve, linkje az /interaction oldalra visz. Párhuzamosan reflexiós e-mail érkezik ugyanezzel a személyre szabott dimenzió-címkével, /interaction CTA-val és a levél alján /email-preferences leiratkozó-linkkel.",
    automated: "partial",
    coveredBy: "tests/unit/platform/reflection-sweep.test.ts (7–10 napos ablak-kiválasztás)",
    priority: "P1",
  },
  {
    id: "NOTIF-10",
    area: "Értesítések",
    name: "Reflexiós érintés egyszeri: ismételt sweep-futás nem duplázza",
    persona: "self-user",
    emails: { fő: "AUTO" },
    preconditions: "NOTIF-09 lefutott: a fő már megkapta a reflexiós értesítést + e-mailt.",
    steps:
      "1. Futtasd le újra a cron-hívást (GET /api/cron/release-steps, Bearer CRON_SECRET) — akár többször. 2. Nézd meg a fő harang-panelét és postafiókját.",
    expected:
      "Nem születik második reflexiós értesítés és nem megy ki második e-mail — a dedupe user-szintű (REFLECTION_PROMPT userenként egyszeri, akkor is, ha a tétel már olvasott/elvetett).",
    automated: "partial",
    coveredBy:
      "tests/unit/platform/reflection-sweep.test.ts + tests/unit/notifications/notification-dedupe.test.ts",
    priority: "P2",
  },
  {
    id: "NOTIF-11",
    area: "Értesítések",
    name: "Compare-accepted: a partner elfogadása után a meghívó a páros nézetre hívó értesítést kap",
    persona: "self-user + partner",
    emails: { fő: "AUTO", partner: "AUTO" },
    preconditions:
      "Mindkét fióknak kész self-eredménye van; a fő az /interaction oldalról páros-összehasonlítás meghívót küldött a partner címére.",
    steps:
      "1. A partner a kapott linken (/interaction/compare/<token>) fogadja el az összehasonlítást. 2. A fő fiókkal nyisd meg a harang-panelt. 3. Kattints az új tételre.",
    expected:
      "A fő compare-accepted értesítést kap a partner nevével (assessment-kategória). A tételre kattintva közvetlenül a páros összehasonlítás-nézet nyílik meg (/interaction?pair=…), ahol a két profil egymás mellett látszik — a kattintás a tételt olvasottá is teszi.",
    automated: "partial",
    coveredBy: "tests/unit/results/compare-invite.test.ts (meghívó-állapotgép)",
    priority: "P1",
  },
  {
    id: "NOTIF-12",
    area: "Értesítések",
    name: "Lifecycle opt-out az /email-preferences oldalon: a levél elmarad, az in-app marad",
    persona: "self-user",
    emails: { fő: "AUTO" },
    preconditions:
      "A fő belépett; előkészíthető egy reflexiós-ablakba eső self-eredmény MÁSIK teszt-userrel is összevetésképp (NOTIF-09 mintájára, dev-segítség).",
    steps:
      "1. A fő fiókkal nyisd meg az /email-preferences oldalt (pl. a reflexiós levél leiratkozó-linkjéből). 2. Vedd KI a pipát az életciklus-emailek kapcsolójából, várd meg a visszajelzést. 3. Töltsd újra az oldalt. 4. Futtasd le a reflexiós sweepet egy opt-outolt, ablakban lévő userrel (cron-hívás). 5. Nézd meg a postafiókot és a harangot.",
    expected:
      "A kapcsoló mentése megerősítő szöveget ad, újratöltés után is kikapcsolt állapotot mutat (perzisztens). Az opt-outolt userhez a sweep NEM küld reflexiós e-mailt, de az in-app reflexiós értesítés ettől függetlenül megszületik — a leiratkozás csak az e-mail lábat némítja. A pipa visszakapcsolása után a mentés ugyanígy megerősítést ad.",
    automated: "none",
    coveredBy: "",
    priority: "P1",
  },
];
