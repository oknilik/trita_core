# Napi audit — a `main` ág változásai, 2026-08-24 → 2026-08-25

> Készült: 2026-08-25 este, a `main@4191bce` állapotán. Hatókör: a két nap
> alatt a main-re került **18 PR** (107 commit, 334 fájl, +14 802/−5 144 sor),
> amelyek mind éles deployt kaptak (trita.io).
>
> Módszer: a teljes minőségi kapu újrafuttatása lokálisan a main csúcsán,
> a GitHub Actions futások kiértékelése merge-enként, valamint öt párhuzamos
> mélyreview (platform-backlog, kudos/feedback, dossier/observer,
> blog/hírlevél, marketing) — minden lelet a main **végállapotán**, a teljes
> fájl elolvasásával megerősítve, a kritikus gyanúk empirikusan (futtatott
> teszttel) is igazolva. Korlát: az auditkörnyezet hálózati szabályzata a
> trita.io-t nem éri el, ezért az éles felület közvetlen smoke-checkje
> helyett CI-bizonyíték (production build, pilot gate) + kódszintű
> ellenőrzés szerepel; a kézi ellenőrzőlista a 7. pontban.

## 0. Verdikt

**A két nap mérnöki tartalma erős — a folyamatfegyelem lemaradt a tempó
mögött.** A gerinc két kiemelkedő minőségű audit-javító kör (#45 a 08-23-i
teljes audit kódból javítható blokkolóira, #53 a pilot-backlogra): a P0-célok
(tranzakcionális/idempotens kampány-előrehaladás, atomikus observer-claim,
draft-scope, pulse-anonimitás, truthful email-réteg) hibátlanul és valódi
konkurencia-tesztekkel fedve érkeztek meg. A blog admin-szerkesztő éles-képes
lett, a jogi oldal valós cégadatokkal indexelhetővé vált, a blogcikkek
kitalált statisztikái valódi forrásokra cserélődtek.

Az árnyoldal: 08-24-én **öt PR piros main-re merge-ölt** (egy valódi, a #48
által behozott guardrail-regresszióval, amely ~12 órán át élesben volt — az
API-szintű policy-réteg tartott, a kár a dashboard-CTA-k szintjén maradt);
a 18 PR-ból **egyiken sem volt code review**; a changelog 08-25-re üres,
a CLAUDE.md több ponton elavult. Öt megerősített P1 maradt a mainen —
egyik sem töri a pilot fő útját (Scan v1), de kettő látható élesben
(blog-főcím mérete, observer „Vissza" gomb), egy pedig termék-szintű
beleegyezési rés (kudos-feed).

## 1. Mi került ki — PR-térkép és értékelés

| PR | Téma | CI a merge-nél | Értékelés |
|---|---|---|---|
| #45 | 08-23-i audit javítókör (Clerk-host, rate-limit mátrix, hibariasztás, CI-bővítés, .env.example) | ✅ | **Kiemelkedő** — a changelog minden állítása visszaellenőrizve igaz |
| #46 | Auth-fejléc + navigációs jelrendszer (nyíl→ikonréteg, footer-átfedés) | ✅ | Jó; guardrail-tesztekkel rögzített konvenció |
| #48 | Journey-akciók szerep-kapuzása + copy | ❌ | Jó szándék, **regressziót hozott** (ld. 2.1) |
| #50 | Blog UI/CTA polish | ❌ (örökölt piros) | Rendben |
| #49 | Blog/hírlevél admin-szerkesztő (sha-ütközésvédelem, ág-célzás, borító-feltöltés) | ❌ (örökölt piros) | **Erős** — éles-képes szerkesztő, mintaszerű upload-pipeline |
| #51 | Marketing oldalak redesign + editorial-art rendszer | ❌ (örökölt piros) | Jó, de innen jön a `text-fluid-heading` fantom-utility (P1) |
| #52 | Szerkesztői borító-workflow + OG-cache | ❌ (örökölt piros) | Erős; a c98d8bb önjavító kör helytálló |
| #53 | **Pre-pilot backlog** (tranzakcionalitás, claim-ek, anonimitás, a11y, tesztcsomag) | ✅ (main újra zöld) | **Kiemelkedő** a magban; a peremen 1 P1 + 3 P2 |
| #54 | Blog-források revíziója + about-egyszerűsítés | ✅ | Jó; a végállapot gépi kulcs-diffel igazoltan tiszta |
| #55 | Borító-binárisok cseréje | ✅ | Rendben (cache-megjegyzéssel) |
| #56 | Logout-fejléc + olvasási progress-bar fix | ✅ | Rendben |
| #58 | Mobil LCP (H1 animáció le) | ✅ | **Tankönyvi** minimál-javítás |
| #59 | Új brand-ikon + kereső-logó | ✅ | Él; halott régi ikon-route-ok maradtak |
| #57 | Privacy: valós cégadatok, draft/noindex kivezetés | ⏹️ (felülírta a #60 zöld futása) | **Teljes körű** kódban; doksi-frissítés elmaradt |
| #60 | Hírlevél-kártyák + mobil subject | ✅ | Rendben |
| #61 | Profil/onboarding refresh, eredmény-átmenet | ✅ | Jó közepes; 1 néma adatvesztő mentési ág |
| #62 | **Kudos-feed + feedback-hub** + dossier-szűkítés + org overview | ✅ | Funkcionálisan erős; beleegyezési modell P1, scope-creep |
| #63 | **Facet-dossier + observer redesign** + org PDF | ✅ | Erős ott, ahol a tét nagy (authz/anonimitás); kitöltő-perem gyengébb |

## 2. Folyamat-leletek

### 2.1 Piros main-epizód (08-24, 10:17–22:07 UTC)

A #48 a `src/lib/journey/state.ts`-ben **literal szerep-összehasonlítást**
vezetett be (`orgRole === "ORG_MANAGER" || …`) a CLAUDE.md-ben előírt
központi döntési pontok (`hasOrgRole`) helyett, és ezzel eltörte a
restricted/frozen előfizetési guardrail 3 integrációs tesztjét
(`guardrails.integration.test.ts`, `journey-contract.integration.test.ts` —
a tesztfájlokhoz a két napban senki nem nyúlt, tehát a tesztek jeleztek
jól). Ezután **négy további PR (#50, #49, #51, #52) landolt piros main-re**,
mindegyik éles deployjal; a javítást a #53 hozta (`hasOrgRole`-ra váltás),
~12 órával később.

Hatás élesben: korlátozott/fagyasztott előfizetésű org-oknál a journey
felkínálhatott menedzsment-CTA-kat, amelyeket nem kellett volna — az
API-szintű policy engine érintetlen volt, tehát tényleges tiltott műveletet
nem engedett (defense in depth működött). Tanulság kettős: (1) a
konvenció-sértés (literal role check) azonnal valódi hibát termelt;
(2) a piros Integration jobot 4,5 órán át senki nem kezelte blokkolóként.

### 2.2 Review-kapu

A 18 PR-ból **0 kapott code review-t** (GitHub reviews: üres). A PR-öket
AI-agentek írták (codex/claude ágak), a merge kézi. A CI jó és bővül
(a #45 óta type+lint+build is fut, a codex/** ágakra is), de a piros
main-epizód mutatja, hogy a CI-eredmény kikényszerítése (branch protection:
required checks a merge-hez) hiányzik.

### 2.3 Dokumentációs fegyelem

- **Changelog**: 08-24-re 7 bejegyzés készült, **08-25-re nulla** — miközben
  aznap 10 PR ment ki, köztük sémamódosítás + adat-migráció (#62) és
  jogosultság-szűkítés (dossier). A CLAUDE.md szerint a changelog
  „KARBANTARTANDÓ".
- **CLAUDE.md drift**: a `/privacy (tervezet: noindex)` sor elavult (#57
  kivezette); a team-tab lista nem tartalmazza a feedback/report tabokat;
  a `launch-checklist.md` a cégadat-tételt még „BLOKKOLT"-ként és a már
  nem létező `LEGAL_DOCS_ARE_DRAFT` lépéssel írja le.
- **OpenAPI drift**: az új résztvevő-törlő route-tal 122 route áll a
  dokumentált 121 mellett — pont a #45-ben felállított „121=121" elv sérül.

### 2.4 Migrációk élesítése

Három új migráció érkezett (draft-scope + eredmény-dedup egyediségi
indexszel; kudos-mezők; notification-link átirányítás). A dedup-migráció
példásan defenzív (ütköző adatnál RAISE EXCEPTION, shareToken-megőrzés).
**De**: a build csak `prisma generate`-et futtat, `migrate deploy` lépés
nincs — a migrációk éles alkalmazása kézi, nem dokumentált folyamat. Ha
bármelyik kimaradt volna, a draft-mentés / kudos / dossier felület 500-azna.
Ellenőrzés: 7. pont.

## 3. Kiemelt hibák (P1 — a main végállapotán megerősítve)

1. **Observer-kitöltő: a „Vissza" gomb lapozáshatáron visszapattan** —
   `src/app/(app)/observe/[token]/ObserverClient.tsx` (lap-inicializáló
   effekt vs. `handlePreviousPage`). A lap első kérdésén állva a Vissza a
   előző (teljesen kitöltött) lapra lép, amit az init-effekt draft-resume-nak
   érzékel és azonnal visszaléptet — a publikus flow-ban minden 5.
   kérdésnél halott a látható vezérlő. Empirikusan igazolva (RTL-teszt:
   a Vissza után az előző kérdés nem látszik). Öröklött hiba, de az
   e1f5566 „stabilize observer assessment navigation" commitnak pont ez
   lett volna a hatóköre. Javítás-irány: manual-back flag vagy az
   inicializált lap követése a vissza-lépésnél.

2. **Kudos-feed: a címzett beleegyezése nélkül publikálódik a róla szóló
   kudos** — `src/app/api/team/[id]/kudos/route.ts` +
   `src/lib/i18n/notifications.ts`. A `teamVisible`-t kizárólag a feladó
   állítja; a címzett értesítése azonos a privát esettel (nem jelzi a
   nyilvánosságot), és a saját „Neked érkezett" listában elrejtő gomb
   sincs — csak a feed-fülön. A szerkezet egyébként zárt (csak named
   appreciation kerülhet ki, anonim tartalom szerkezetileg nem). Javítás:
   külön értesítés-variáns team-visible kudosra + hide-gomb a saját
   listaelemen; megfontolandó az opt-in (címzetti jóváhagyás) modell.

3. **Blog-index: fantom tipográfiai utility** —
   `src/app/(marketing)/blog/BlogListContent.tsx:240,297` a sehol nem
   definiált `text-fluid-heading` osztályt használja (a globals.css-ben
   csak `text-fluid-title`/`text-fluid-display` létezik) → a kiemelt cikk
   címe és az ajánló h2 alap szövegméretben renderel élesben. Egysoros
   javítás; lint nem fogja (csak a `text-[Npx]`-et tiltja).

4. **TeamActionEvent: az akció-audit kulcs-hozzárendelése rutinszerkesztés
   alatt korrumpálódik** — `src/app/api/team/[id]/report/route.ts`
   (`normalizeActionIds`): pozicionális id-öröklés miatt törlés+új elem egy
   körben duplikált `actionKey`-t gyárt, az append-only történet rossz
   elemhez könyveli a változást, és a duplikált id tartósan bekerül az
   `actionItems`-be. Enyhítés: a történetet még semmilyen UI nem olvassa.
   Javítás: szerver-oldali id-generálás a válaszban visszaadva, vagy
   kliens-oldali stabil id már létrehozáskor.

5. **Hírlevél-route-ok Vercel file-tracing hézaga (éles ellenőrzést
   igényel)** — a `next.config.ts` csak 4 route-nak csomagolja be a
   `content/blog`-ot, de a napi digest cron, a hírlevél-preview/küldő és a
   kattintás-redirect route is futásidőben olvassa. Ha a bundle-ből tényleg
   hiányzik: a digest **némán 0 cikket talál**, a szerkesztett szám
   `INVALID_ARTICLES`-szel áll meg, a levélbeli kattintás a /blog listára
   esik. Örökölt hiány, amit a #49 bővítése láthatóvá tett. Ellenőrzés:
   egy éles preview/próbaküldés + a digest-cron log (talált cikkek száma).

## 4. Fontosabb P2-k (válogatás)

**Platform (#53):**
- A lezárt kampányból is törölhető résztvevő az új DELETE API-n (a POST-ág
  `CAMPAIGN_CLOSED` guardja a törlésről hiányzik) — lezárt kör statisztikáit
  módosíthatja utólag.
- A 100%-os kampány-mérföldkő értesítés strukturálisan csak akkor sül el,
  ha az utolsó lépés psych-safety — a Scan v1-et nem érinti, minden custom
  lépéssort igen.
- Az observer-meghívó új `EMAIL_DELIVERY_FAILED` (502) hibakódjához nincs
  i18n kulcs → generikus hibaüzenet, miközben a meghívó létrejött és a
  max-5 keretet fogyasztja.
- A riport-létrehozás CREATED audit-eseményei tranzakción kívül,
  count-guarddal íródnak (duplikálódhat / elmaradhat).

**Kudos/profil (#61, #62):**
- Nincs moderációs út a csapat-feedhez (manager/tanácsadó nem tud bántó
  elemet eltávolítani); a kudos-composerben nincs tone-nudge.
- Profil-mentés: `eduLevel` nélkül választott `eduField` némán elveszik,
  hamis „mentve" visszajelzéssel.

**Observer/skála (#63):**
- A confidence-kérdés a „…igaz" végpont-címkéket örökölte („Egyáltalán nem
  igaz / Teljesen igaz" egy magabiztossági kérdés alatt) — a hint mást mond;
  a confidence-rating validitását rontja. Az EN `helpLikertAbout` továbbra
  is „agree"-t mond a „true" skála alatt.
- A lejárt/visszavont tokenre érkező kitöltő teljesen króm nélküli
  zsákutca-képernyőt lát (a #63 a hibaágakra nem tett fejlécet).

**Blog/admin (#49–#52):**
- A szerkesztő Escape/háttér-kattintásra megerősítés nélkül dobja el a nem
  mentett cikkszöveget.
- EXIF-forgatott fotónál a kliens- és szerver-validálás széttart
  (`INVALID_ASPECT_RATIO` álpozitív).
- A publikus `/api/newsletter/cover/[slug]` query-buszterrel cache-kerülhető
  (sharp CPU-amplifikáció); rate limit nincs rajta.
- Tudatosítandó: az admin blogtartalom MDX-ként fordul → az `ADMIN_EMAILS`
  fiók gyakorlatilag kódfuttatási határ (a doksi a szűk PAT-ot helyesen
  írja elő).

**Marketing/ikon (#51, #57, #59):**
- Halott régi ikon-route-ok (`/icon`, `/apple-icon`) a régi hexagon-brandet
  szolgálják ki; a 159 kB-os favicon.ico optimalizálatlan (duplikátummal).
- A blog-hero szűrő-állapottól függetlenül renderel (duplikált kártya
  aktív szűrőnél).
- Kiterjedt inline HU/EN ternary-k az i18n kulcsrendszer megkerülésével
  (#51, #57, #61, #62 — parity mindenhol megvan, a konvenció nem).

## 5. Ami kifejezetten jól sikerült

- **Konkurencia-kezelés felnőtt szinten** (#53): feltételes claim-ek,
  dokumentált lock-sorrend (Campaign FOR SHARE → Participant FOR UPDATE),
  in-tx revalidáció, és **ténylegesen párhuzamos tranzakciókat futtató**
  integrációs tesztek + tripwire-ök.
- **Anonimitás-padlók következetesen**: facet-szinten listwise n≥3
  (dossier), pulse user-referencia nélkül nap-pontos időbélyeggel,
  trust csak kölcsönös élekkel, kudos-feed szerkezeti (nem UI-fegyelmen
  múló) szűréssel.
- **Truthful-elv végigvive**: email-hibák őszinték és riasztanak,
  mentés/PDF állapotok igazat mondanak — a termék hitelességi alapelvével
  konzisztens mérnöki munka.
- **Blog-szerkesztő upload-pipeline**: bájt-szintű formátum-sniff,
  sharp-újrakódolás (EXIF/payload-tisztítás), szigorú path-validálás minden
  határon, staged upload + rollback, tartalom-hashes fájlnév.
- **Tartalmi hitelesség**: 14 cikk kitalált statisztikái valódi, linkelt
  forrásokra cserélve, explicit alkalmazhatósági korlátokkal.
- **Jogi felület**: valós cégadatok egyetlen forrásból
  (`src/lib/legal/company.ts`, provenance-kommentekkel), a draft/noindex
  mechanizmus maradéktalan, konzisztens kivezetése.
- **Minőségi kapuk a HEAD-en**: type-check 0, lint 0, unit + client zöld,
  CI-ben production build és pilot gate is zöld; a tesztállomány érdemben
  nőtt (konkurencia-, axe-, guardrail-tesztek).

## 6. Nyitott, kódon kívüli tételek

- **ÁSZF/felhasználási feltételek** (08-23-i audit P0-2): továbbra sincs
  `/terms` — a privacy rendezésével ez maradt az utolsó jogi indulási
  blokkoló.
- A #53 changelogja szerint P0-OPS-01 / P0-LEGAL-01 / P0-QA-01 külső kapui
  (DNS/Vercel/Clerk/Resend/Upstash konfiguráció, aláírások) érvényben.

## 7. Kézi ellenőrzőlista élesben (az audit-környezetből nem elvégezhető)

1. `prisma migrate status` a prod DB-re — mindhárom új migráció applied?
2. Hírlevél: admin-preview + próbaküldés, majd a reggeli digest-cron log
   (talált cikkek száma > 0) — a 3/5-ös P1 eldöntése.
3. Blog-index (kijelentkezve, mobil+desktop): a kiemelt cikk címmérete —
   a 3/3-as P1 vizuális megerősítése.
4. Observer-flow próbakitöltés: a 6. kérdésen „Vissza" — a 3/1-es P1
   megerősítése élesben.
5. Favicon/új ikon megjelenése + Search Console: a /privacy indexelhető.

## 8. Javasolt sorrend

1. **Gyors javítókör (kis diffek, nagy látszat):** `text-fluid-heading` →
   `text-fluid-title`; observer vissza-navigáció; `EMAIL_DELIVERY_FAILED`
   i18n kulcs; confidence-skála saját címkekészlete.
2. **Kudos-beleegyezés**: külön értesítés-variáns + hide a saját listán
   (vagy opt-in modell) — termék-döntés, de a mostani állapot a saját
   hitelesség-elvvel ütközik.
3. **Folyamat:** branch protection required checks-szel (a piros main-epizód
   ne ismétlődhessen); changelog-pótlás 08-25-re; CLAUDE.md +
   launch-checklist szinkron; `migrate deploy` lépés dokumentálása vagy
   automatizálása.
4. **Adat-integritás:** TeamActionEvent kulcs-generálás javítása, amíg
   nincs UI-fogyasztója; DELETE-ág `CAMPAIGN_CLOSED` guard.
5. **Jogi:** ÁSZF.

---

*Az audit alapja: lokálisan futtatott kapuk (`pnpm check`, `test:unit`,
`test:client` — mind zöld a 4191bce-n), GitHub Actions futás-történet,
valamint fájlszintű review a fenti PR-diffeken. A hivatkozott sorok a
main@4191bce állapotára mutatnak.*
