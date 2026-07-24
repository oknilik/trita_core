# trita — Design javítási akciólista (Claude Code-nak átadható)

Forrás: teljes UI-bejárás böngészőben (app + marketing oldalak, 2026-07-24) + a landing kódszintű átnézése (`src/components/landing/*`, a landing bejelentkezve nem érhető el, mert a `src/proxy.ts` a `/`-t a journey-kapura irányítja).

Használat: a feladatok önállóan, egyenként átadhatók Claude Code-nak. Minden feladatnál: érintett fájl(ok), probléma, teendő, elfogadási kritérium.

---

## P1 — Kritikus (fő flow-t érintő)

### 1. Állapotfüggő visszajelzés-banner a csapat vezérlőn
- **Fájl:** `src/app/(app)/team/[id]/page.tsx` (a „Kollégái visszajelzés kör" banner)
- **Probléma:** A banner szövege önértékelésről szól („Töltsd ki az önértékelést (~10 perc) — ez az alapja a csapatképnek…"), de a „Kitöltöm most" gomb a `/assessment/peer-feedback` oldalra (kollégái visszajelzés űrlap) visz. Ráadásul a felhasználó önértékelése már kész (100% kitöltés), tehát a szöveg az aktuális állapotban félrevezető.
- **Teendő:** A banner legyen állapotfüggő: (a) ha az önértékelés hiányzik → önértékelés copy + link az önértékelésre; (b) ha az önértékelés kész, de a kollégái visszajelzés nem → „Adj visszajelzést a csapattársaidnak" copy, a kör haladásával (pl. „6/9 kész"), CTA: „Visszajelzést adok"; (c) ha minden kész → a banner tűnjön el vagy váltson megerősítő állapotra.
- **Elfogadás:** A banner szövege és a CTA célja soha nem tér el egymástól; a haladás (x/y) látszik; mindhárom állapot tesztelve.

### 2. Kollégái visszajelzés űrlap újrastrukturálása
- **Fájl:** `src/app/(app)/assessment/peer-feedback/PeerFeedbackClient.tsx`, `page.tsx`
- **Probléma:** 8 csapattárs × 2 kötelező szabadszöveges mező egyetlen hosszú oldalon; a „Beküldés" gomb az oldal alján letiltva, csak általános súgószöveggel („Minden csapattársnál töltsd ki a két visszajelzés-mezőt."). Nincs haladásjelző, nincs személyenkénti kész-állapot, nem látszik, mely mezők hiányoznak, és nem látszik, hogy mentődik-e piszkozat.
- **Teendő:** (1) Személyenkénti léptetés (stepper) vagy accordion, kész-pipával; (2) sticky haladásjelző („3/8 kész"); (3) automatikus piszkozat-mentés vizuális visszajelzéssel („Mentve"); (4) beküldéskor / gombra hoverkor inline jelölés, kinél hiányzik mező; (5) a letiltott gomb mellett dinamikus szöveg: „Még 5 csapattársnál hiányzik a visszajelzés".
- **Elfogadás:** A felhasználó az oldal bármely pontján látja, hol tart; hiányzó mező konkrétan azonosítható; a piszkozat-mentés állapota látható.

### 3. Vissza-navigáció a fókusz-módú (fejléc nélküli) oldalakon
- **Fájl:** `src/app/(app)/assessment/peer-feedback/*` (és a többi assessment-oldal, ha ugyanígy viselkedik)
- **Probléma:** A visszajelzés űrlapon nincs app-fejléc és nincs vissza-link — csak a böngésző vissza gombjával lehet kilépni.
- **Teendő:** Minimál fejléc: trita logó (linkelve a vezérlőre) + „Vissza a csapathoz" link; a fókusz-mód (nav-elrejtés) maradhat.
- **Elfogadás:** Minden assessment-oldalról egy kattintással vissza lehet jutni az appba.

### 4. Landing: kitöltési idő egységesítése (~10 vs ~15 perc)
- **Fájl:** `src/components/landing/StatsBar.tsx` (11. és 17. sor: hardcoded `"~15"`), `src/lib/i18n/landing.ts` (`selfMetaTime: "~10 perc"`), plusz előfordulások: pricing copy, team banner copy
- **Probléma:** A hero chip „~10 perc"-et ígér, ugyanazon az oldalon a StatsBar „~15 perc átlagos kitöltés"-t mond. Bizalomromboló ellentmondás.
- **Teendő:** Döntsd el a valós értéket, tedd i18n kulcsba (ne hardcode), és használd egységesen: hero chip, StatsBar, pricing, app-banner.
- **Elfogadás:** `grep -rn "perc" src/` nem talál egymásnak ellentmondó időértéket a mérésre.

---

## P2 — Fontos (konzisztencia, akadálymentesség)

### 5. Landing: szekciócímek kiemelő színe kövesse a módot
- **Fájlok:** `src/components/landing/HowItWorks.tsx` (34–36. sor), `Features.tsx` (34. sor), `ProofSection.tsx` (34–36. sor), `CtaSection.tsx` (35. sor)
- **Probléma:** Team módban az eyebrow/CTA zöld (`--color-action-primary-bg`), de a címsorok dőlt kiemelése mindig `--color-accent-self` (narancs) marad — a mód-váltás színlogikája következetlen.
- **Teendő:** A címsor `em` színe is legyen módfüggő (self → accent-self, team → action-primary), ugyanazzal a mintával, ahogy a `HeroSection` az `accentColor`-t számolja.
- **Elfogadás:** `?mode=team` alatt egyetlen szekcióban sem marad self-narancs kiemelés.

### 6. Landing: emoji ikonok cseréje SVG-re
- **Fájlok:** `src/components/landing/HeroSection.tsx` (340–343. sor: ⏱ 🔬 ⚡ 🆓), `TrustBar.tsx` (13–16. sor: ✓ ⏱ 🔬 🔒), `ProofSection.tsx` (18–25. sor: 🔬 🧭 💬 / 🧬 👁 🔍)
- **Probléma:** Az emoji platformonként másképp renderel, kilóg az egyébként elegáns vizuális nyelvből (a `ModeSwitcher` már szép vonalas SVG-t használ), és a felolvasók bemondják.
- **Teendő:** Egységes vonalas SVG ikonkészlet (a ModeSwitcher stílusában), `aria-hidden="true"`-val. Ugyanez az appban: a „🙌 Visszajelzés" gomb a team oldalon.
- **Elfogadás:** Landing + team oldal gombjaiban nincs emoji; ikonok `aria-hidden`.

### 7. Landing: kontraszt-emelés a sötét paneleken
- **Fájlok:** `src/components/landing/HeroSection.tsx` (SelfPanel: `text-white/25`, `/30`, `/40`, `/45` — 45–61. sor), `StatsBar.tsx` (33. sor: `text-white/40`)
- **Probléma:** 10–12px szövegek 25–45% fehérrel sötét háttéren — messze a WCAG AA (4,5:1) alatt. A mockup-panel tartalma is olvashatatlan lehet gyengébb látással / rossz kijelzőn.
- **Teendő:** Kis szövegnél minimum `white/70`, másodlagosnál `white/60`; ellenőrzés kontraszt-kalkulátorral.
- **Elfogadás:** A landingen minden szöveg eléri a 4,5:1-et (nagy címeknél 3:1).

### 8. Globális: mikro-címkék és letiltott állapotok kontrasztja
- **Fájlok:** `src/app/globals.css` (muted/bronze tokenek), pricing űrlap (`src/app/(marketing)/contact` ill. pricing beágyazott form), footer (`src/components/Footer.tsx`)
- **Probléma:** A kis kapitális szekciócímkék (pl. „ÁLLAPOTKÉP", „TAG/KÉSZ/VÁR" a sötét herón), a footer halvány linkjei és a sötét űrlapon a letiltott „Elküldöm" gomb kontrasztja határ alatti.
- **Teendő:** A `--color-text-muted` / bronze címke-tokenek sötétítése úgy, hogy 11px-es kapitálisnál is meglegyen a 4,5:1; letiltott gombnál látható türelmi állapot (pl. körvonal + magyarázat).
- **Elfogadás:** Automatizált a11y-ellenőrzés (pl. axe) nem jelez kontraszt-hibát a fő oldalakon.

### 9. Radar diagram: kétértelmű tengelybetűk feloldása
- **Fájl:** a dimenzió-radar komponens (keresd: `T · R · I · T · A · N` tengelycímkék, pl. `src/components` alatt a results/team report chart)
- **Probléma:** Két dimenzió is „T" betűt kap (Társas energia, Tervezettség) — a tengelyek önmagukban nem azonosíthatók, csak az apró képaláírásból.
- **Teendő:** Rövid, egyedi címkék (pl. „Tár", „Terv") vagy teljes szavak kis méretben; hover/fókusz tooltip a teljes névvel; a jelmagyarázat betűméretének emelése.
- **Elfogadás:** Minden tengely egyedileg azonosítható a diagramon magán.

### 10. Gomb-hierarchia egységesítése az appban
- **Fájlok:** közös gomb-komponens / `globals.css`; érintett oldalak: team (`Kitöltöm most" — tinta, „Csapatkép megnyitása" — zöld, „🙌 Visszajelzés" — narancs), results („PDF letöltés" — narancs, „Visszajelzés kérése" — zöld)
- **Probléma:** Oldalanként más szín tölti be az „elsődleges gomb" szerepét — a szem nem tanulja meg, mi a fő akció.
- **Teendő:** Egy elsődleges gombstílus (javaslat: tinta/sötét), másodlagos: körvonalas; a zöld/narancs csak szemantikus kiemelésre. Button-variant rendszer bevezetése, oldalak átvezetése.
- **Elfogadás:** Minden oldalon legfeljebb egy vizuálisan elsődleges gomb, azonos stílussal.

### 11. „a(z)" névelő-sablon feloldása a riportszövegekben
- **Fájl:** keresd: `grep -rn "a(z)" src/` (team riport: „A csapatban a(z) Megvalósító szerep ritka" — kétszer fordul elő)
- **Teendő:** Névelő-feloldó segédfüggvény (magánhangzó → „az", egyébként „a"), sablonok átvezetése.
- **Elfogadás:** UI-ban sehol nem jelenik meg „a(z)".

### 12. /assessment némán átirányít a régi eredményekre
- **Fájl:** `src/app/(app)/assessment/page.tsx`
- **Probléma:** Kész méréssel a `/assessment` a `/profile/results?retake=true`-ra irányít, de az oldalon semmi nem jelzi, hogy miért az (régi) eredményeket látja a user, és mit jelent a retake.
- **Teendő:** A `retake=true` paraméternél jelenjen meg egy sáv: „A mérésed már készen van — szeretnéd újra kitölteni?" + „Újratöltés indítása" gomb; vagy a redirect helyett kérdező köztes képernyő.
- **Elfogadás:** A retake szándék explicit módon kezelt, nincs néma átirányítás.

### 13. „Segítőkészség — 0%" megjelenítés
- **Fájl:** `src/app/(app)/profile/results/page.tsx` (kiegészítő skála blokk)
- **Probléma:** A 0% üres sávval adathibának tűnik, miközben a mellette lévő szöveg normál működést ír le.
- **Teendő:** 0 közeli értéknél is legyen minimális sáv-jelzés + szöveges besorolás („nagyon alacsony"); ha az érték hiányzó adatot jelent, azt külön állapotként kell mutatni („nincs elég adat").
- **Elfogadás:** A 0% vizuálisan megkülönböztethető a „nincs adat" állapottól.

---

## P3 — Finomítás

### 14. Vezérlő hero: háromszoros információ-ismétlés
- **Fájl:** `src/app/(app)/team/[id]/page.tsx`
- **Probléma:** A „9 tagból 9 kész" info háromszor szerepel egy képernyőn (alcím, chipek, „Élő pillanatkép" kártyák).
- **Teendő:** Egy forrás maradjon (javaslat: az Élő pillanatkép kártyák), az alcím legyen kvalitatív („Mindenki kitöltötte — a csapatkép él"), a chipsor törölhető.

### 15. Landing: ModeSwitcher akadálymentesítése
- **Fájl:** `src/components/landing/ModeSwitcher.tsx`
- **Teendő:** `aria-pressed={isActive}` a gombokra (vagy tab-szemantika), látható fókuszgyűrű; ellenőrizd, hogy a mode-váltás bejelentésre kerül (pl. `aria-live` a szekció-tartalom váltásnál nem kell, de a gombállapot igen).

### 16. Landing: `not-italic italic` osztálypárok tisztítása
- **Fájlok:** `HeroSection.tsx` (289), `HowItWorks.tsx` (34, 36), `Features.tsx` (34), `ProofSection.tsx` (34), `CtaSection.tsx` (35)
- **Teendő:** Ellentmondó Tailwind-osztályok (`not-italic italic`) helyett egyértelmű stílus (ha a Fraunces italic tengely kell, elég az `italic`).

### 17. Landing: demo-adat jelölése + testimonial erősítése
- **Fájl:** `HeroSection.tsx` (SelfPanel/TeamPanel), `ProofSection.tsx` (59–69. sor)
- **Teendő:** A hero mockup-kártyákon apró „minta" jelölés, hogy ne tűnjön valós adatnak; a névtelen testimonial („Korai felhasználó, 31 éves PM") vagy kapjon erősebb forrást, vagy kerüljön ki — jelenlegi formában gyenge social proof. Team módban jelenleg nincs testimonial — ha lesz pilot-visszajelzés, ide kerüljön.

### 18. Marketing nav: „Főoldal" bejelentkezve
- **Fájl:** `src/components/NavBar.tsx`
- **Probléma:** Bejelentkezve a „Főoldal" a `/`-ra mutat, ami a proxy miatt az appba dob — a marketing oldalakról a landing elérhetetlen.
- **Teendő:** Bejelentkezett usernél a menüpont legyen „Vezérlő" (a journey handoffra), vagy a landing legyen elérhető pl. `/home`-on; plusz a fiók-chip skeleton kapjon fix szélességet a betöltési ugrás ellen.

### 19. Tagok lista: jobb szél és függő meghívók
- **Fájl:** `src/app/(app)/team/[id]/page.tsx` (members tab)
- **Teendő:** A dátumoszlop kapjon jobb oldali paddingot (jelenleg a kártya széléhez tapad); a „Függőben" sorok e-mail címei mellé kerüljön művelet (újraküldés/visszavonás), ha van rá API (`/api/team/pending-invite/[id]/resend` létezik).

### 20. Seed-szövegek tisztítása
- **Fájl:** seed/SQL (értesítés-szövegek)
- **Probléma:** Demó értesítésben trágár szöveg szerepel („Szerintetek f*sza vagyok?") — demózásnál kínos.
- **Teendő:** Seed-szövegek átfésülése semleges mintaszövegekre.

### 21. Hidratálás előtti kattintás a fő CTA-kon
- **Megfigyelés:** A „Kitöltöm most" gombra az első kattintás nem csinált semmit (dev módban), a második igen.
- **Teendő:** Ellenőrizd, hogy a banner-CTA valódi `<a href>`-ként renderelődik (Next `Link`), ne JS-only handlerként; ha Link, valószínűleg dev-only jelenség — prod buildben ellenőrizendő.

---

## Nem vizsgált területek (külön kör javasolt)
- Kijelentkezett landing vizuális ellenőrzése böngészőben (kód alapján néztem át) — érdemes inkognitóban is megnézni.
- Mobil nézet (a tesztkörnyezetben nem sikerült átméretezni) — a landing `clamp()` tipográfiája és a grid váltások kódszinten rendben vannak, de vizuális ellenőrzés kell.
- Admin, org, hiring, onboarding felületek; billentyűzetes navigáció és fókuszállapotok végig az appon.
