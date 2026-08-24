# Backlog-maradék és PR #53 utójavítások — 2026-08-24

A PR #53 (`codex/pre-pilot-audit-backlog-20260824`) felülvizsgálata három
hibát talált (piros Pilot Gate CI-n és lokálisan), és három backlog-tétel
nem készült el. Ez a kör mindet lezárja; az ág a PR #53-ra épül.

## A PR #53 három hibájának javítása

- **E2E szelektor-regresszió:** a válaszgombok `role="radio"`-t kaptak, de az
  `observer-flow` és `assessment-flow` e2e továbbra is `getByRole("button")`-nal
  keresett — 5 teszt bukott. A szelektorok radio-ra váltva.
- **Axe-kontraszt (12 bukó konfiguráció):** display-`em` kiemelések
  `accent-primary` → `accent-primary-strong` (2.98 → 5.59); a /pilot mauve
  paneljén a kis szövegek `text-on-inverse`-re (3.88/4.26 → 5.67); a
  NewsletterForm inverz input-színei `!`-tal determinisztikusak (a sötét
  kártyán a beírt szöveg 1.32-es aránnyal olvashatatlan volt).
- **Migráció-védelem:** az `AssessmentResult (userProfileId, campaignId)`
  egyediségi index elé dedupe-DELETE került — a régi, nem idempotens submit
  duplikátumai éles adaton elbuktatták volna a `migrate deploy`-t.

## Backlog-maradék

- **P1-OPS-02 — lépés-célzott emlékeztető:** a remind mostantól MINDEN
  befejezetlen résztvevőt a saját nyitott lépésénél ér el (self-kész/
  trust-függő és trust-kész/pulse-függő kohorsz is), közvetlen lépés-linkkel.
  Idempotencia: `CampaignParticipant.lastRemindedAt/lastRemindedStep`,
  48 órás ablak (`STEP_REMINDER_COOLDOWN_MS`), CSAK sikeres küldés zárja.
  Tiszta kohorsz-választó: `selectStepReminderCohort`
  (campaign-steps-core, 4 unit teszttel) — egy jövőbeli cron ugyanazt hívja.
  Válasz: `{ remindedCount, failedCount, skippedRecent, gated, done }`.
- **P1-UX-03 — overlay-szerződés:** a `Picker` és a közös `MobileMenuShell`
  megkapta a Modal mintáját: `role="dialog"` + `aria-modal` + címke,
  fókusz-csapda, fókusz-visszaadás, Escape, scroll-zár; a Picker fix világos
  `#faf9f6` háttere a témázott `--color-surface-header` tokenre váltott
  (sötét módban eddig világos panel ült a sötét lapon). `PickerTrigger`:
  `aria-haspopup="dialog"`; kereső és bezáró gomb címkézett (`nav.menu` és
  `common.close` kulcs).
- **P1-UX-04 — onboarding űrlap:** valódi `<form>` Enter-submittal; sikertelen
  submit után TARTÓS mezőhibák üres mezőre is; a gender választó címkézett
  `radiogroup` (`role="radio"`, `aria-checked`), hiányánál `role="alert"`
  hibaszöveg `aria-describedby`-jal; ország-hiba szintén tartós. Új kulcs:
  `onboarding.requiredChoice`.

## Kisebb kiegészítések

- **P0-PRIV-01 (szöveg-oldal):** a trust-consent kimondja, hogy páros érték
  CSAK mindkét irány beérkezése után jelenik meg (a kód már így működik).
- **P1-QA-02:** új belépett e2e (`assessment-authed-flow`): szerver-draft
  folytatás → utolsó válasz → idempotens submit → pontosan 1 eredménysor →
  `/profile/results` renderel → scope-olt draft törlődött. Bekötve a
  Pilot Gate-be.
- **P2-UI-01:** az `/observe/[token]` hat `text-2xl font-bold` fejléce a
  `font-fraunces text-title` szerep-utilityre igazítva.
- openapi: a remind új válasz-szerződése dokumentálva.

## Tudatosan nyitva maradt

- P1-SEC-01 route-mátrix és mező-minimalizálás (szisztematikus kör, külön
  ütemezéssel); a TRITAN-blog-slug döntés (tulajdonosi); Neon melegen tartás
  (ops); axe a belépett route-okra (a kapu előbb legyen zölden stabil).
