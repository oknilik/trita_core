# 2026-08-18 — A UI/UX-kör (#32) beolvasztása + a pipeline zöldre vitele

> A `codex/pilot-p0-ux` ág (PR #32, 14 commit, 127 fájl) beolvad a
> `claude/pilot-p0-fixes` branchbe. A két kör ugyanarról a `3b364875` bázisról
> indult, és 11 fájlban átfedték egymást — ebből 5 valódi konfliktus volt.
> A PR #32 CI-je két kapun bukott (E2E: 8 teszt, Quality Gate); ez a kör
> mindkettőt lezárja.

## Konfliktus-feloldások

**A négy `(app)` hibahatár** (`assessment`, `dashboard`, `org/[id]`,
`team/[id]`) — a két kör egymástól függetlenül egységesítette ugyanazt az öt
error-boundary-t, más absztrakcióval. A #32 `PageErrorState`-je nyert:
`PlatformPageShell`-t használ (marad a nav és van kiút a vezérlőre), a `Button`
primitívet, az új token-réteget, `role="alert"`-et, és egy `PageLoadingState`
párja is van. Az én `ErrorScreen`-em két érdemi nyereségét azonban átemeltem:

- a **client-logger telemetria** bekerült a `PageErrorState`-be (a hibahatár
  korábban némán nyelte el a hibát — a felhasználó látta a képernyőt, mi nem);
- a **gyökér `src/app/error.tsx`** továbbra is az `ErrorScreen`-t használja.
  Ez nem duplikáció, hanem elvi határ: a gyökér-határ a marketing-fa hibáit is
  fogja, ezért a PUBLIKUS szótárból dolgozik (a teljes app-szótár visszahozná
  a ~110 KB-os chunkot a publikus bundle-be), és nincs körülötte app-shell,
  amit a `PageErrorState` feltételez.

**`PricingContent.tsx`** — a #32 átstrukturálta a szekciót (kártyás grid,
`FOCUS_RING_CLASS`), az én oldalamon viszont a pilot-tölcsér analitika ült.
A #32 szerkezete maradt, és visszakerült rá a két `track("cta.click")` hívás
(`pricing_team` a `/contact`-ra, `pricing_pilot` a pilot-kártyára). A
`faq.open` követés magától rendben egyesült.

## E2E-bukások — mi volt mögöttük

**1. Öt journey-szerződésteszt (valódi viselkedésváltás).** A #32
`proxy.ts`-e a védett route-ok vendég-fallbackját a landingről (`/`) a
`/sign-in?redirect_url=…`-ra vitte át. A szándék helyes (a mélylink nem vész
el), csak a szerződéstesztek a régi kontraktust rögzítették. A teszteket az ÚJ
szerződésre írtam át, de erősebbre a puszta elvárás-cserénél: az új
`expectSignInWithReturnTo` azt is állítja, hogy a `redirect_url` az eredeti
útvonalat + query-t megőrzi. Plusz egy új eset: **az auth-bounce elutasítja a
külső `redirect_url`-t** (`//evil.example`) — a `sanitizeInternalRedirect`
egységtesztje a függvényt fedi, ez azt bizonyítja, hogy a middleware a valódi
ágon meg is hívja. Nyitott átirányítás itt valódi biztonsági hiba lenne.

**2. Az auth-belépő mobil-tesztje (valódi UX-hiba a termékben).** A teszt `h1`-et
várt a `/sign-in`-en, és nem talált. Ok: a sign-in (és a sign-up) `if (!isLoaded)
return null`-lal némította el a TELJES oldalt, amíg a clerk-js megérkezik — azaz
fehér képernyő, cím nélkül. A hermetikus e2e dummy Clerk-kulccsal fut, ott ez
sosem oldódik fel, de lassú mobilhálózaton a valódi felhasználó is fehér
képernyőt kap. Javítás: a váz, a fejléc és az űrlap AZONNAL renderel, és csak a
Clerk-et ténylegesen hívó gombok várnak (`disabled={!isLoaded}`). A
heading-sorrend a11y-szerződése így az első festéstől teljesül.

**3. A vendég-assessment mobil-tesztje (teszt-verseny).** A helper azonnali
`isVisible()`-lel nézte az intro-gombot; a `/try` dev-módban igény szerint
fordul, így a fordítás alatt hamisat kapott, a kattintás szó nélkül kimaradt,
majd 15s-et várt egy el sem indított kitöltőre. Ez okozta a „hol az egyik, hol
a másik mobil-projekt bukik" mintát: amelyik projekt először ért oda, az
fizette a fordítást. Most megvárjuk, hogy vagy az intro-gomb, vagy már maga a
kitöltő kiálljon.

## Mellékesen talált valódi hiba

A #32 új haladás-sávja `aria-label={tf('assessment.progressLabel', …)}`-lel
készült, de a kulcs a `myTasks` névtérben létezett, az `assessment`-ben nem —
így a `tf` a NYERS kulcsot adta vissza, és a képernyőolvasó szó szerint az
„assessment.progressLabel" szöveget mondta be. A11y-fókuszú körben ez érdemi:
a kulcs felvéve az `assessment` névtérbe, HU+EN.

## Quality Gate

A #32 önmagában azért bukott, mert `assessment` védett modult módosított
integration teszt nélkül. A beolvasztott ág viszont hozza a
`step-release.integration.test.ts`-t és a `capability-gate.test.ts`-t is, így
a kapu mindhárom rétegre (unit/integration/e2e) teljesül.

## Verifikáció

Teljes kör helyben, a CI beállításaival (`--workers=1`): **e2e 36 zöld / 2
skipped / 0 bukás** (3 projekt: chromium + mobile-compact + mobile-standard).
Type-check 0 hiba, unit 1046/1046, client 211/211, ESLint tiszta,
`check:colors` zöld, Quality Gate zöld.
