# Landing kontraszt — WCAG AA a `/` és `/team-dynamics` oldalon

## Mi változott

Kézi axe-futtatás (wcag2a/wcag2aa/wcag21aa, light+dark, 360 és 1440 px)
több „serious" színkontraszt-hibát adott a két publikus belépő oldalon.
Nem a 2026-09-08-i ár/nav-változásból jöttek, hanem régebbi landing-
komponensekből, és a CI axe-listája (`tests/e2e/accessibility/
axe-critical-routes.test.ts`) nem fedte őket. Minden javítás a meglévő
token-rendszeren belül, új hex nélkül (`pnpm check:colors` tiszta).

| Hol | Volt | Lett |
|---|---|---|
| `CtaSection` mikroszöveg (12 px, self+team ág) | `text-ink-body/60` — 2,9:1 világosban | `--color-text-muted` teljes tónus — 4,8:1 krémen, 4,6:1 a meleg surface-muted kártyán |
| `CtaSection` záró címsor `<em>` (self) | `--color-accent-primary` — 3,0:1 alatt | `--color-accent-primary-mid` — 3,9:1 (a hero H1-gyel azonos fok) |
| `Features` / `HowItWorks` / `ProofSection` címsor `<em>` (self) | `--color-accent-primary` inline — 3,0:1 alatt | `headlineAccentColor` = `accent-primary-mid`; az ikonok/dekoratív folt marad az alap bronzon |
| `Features` badge (10 px félkövér) | bronz fehér kártyán 3,3:1, és a `${var}15` hex-alfa érvénytelen volt (háttér nélkül állt) | szöveg `--color-accent-primary-strong` (6,1:1), háttér `color-mix(… 10%, transparent)` |
| `panels.tsx` SelfPanel „Elsődleges / Másodlagos" rangcímke | sáv-szín + `opacity-60` — 1,9–3,6:1 | külön `labelColor`: zsálya teljes tónus (5,7:1), bronz helyett `accent-primary-strong` (5,7:1); a sáv/korong színe változatlan |
| `panels.tsx` TeamPanel „Figyelendő" eyebrow | `--color-bronze-dark` krém-300-on 4,2:1 | `--color-accent-primary-strong` — 5,3:1 (a bal oldali `sage-dark` párja) |
| `TeamPathway` CTA (14 px félkövér, világos bronz gomb) | `--color-layer-team-hero-from` — 4,0:1 / 4,1:1 | `--color-layer-team-hero-to` — 7,5:1 világosban, 6,6:1 sötétben; a szilva-tónus marad |

A `HeroSection` H1 kiemelése már korábban is a középső fokon állt
(3,9:1, nagy szöveg) — ott nem kellett nyúlni.

## CI

A `/` és a `/team-dynamics` felkerült az axe-kritikus útvonalak listájára
(2 oldal × 2 nézet × 2 téma = 8 új teszt). Negatív ellenőrzés: a javítás
előtti `CtaSection`-nel a `/ · desktop · light` teszt `color-contrast`
hibával bukott, a javítással mind a 8 zöld.

## Ellenőrzés

- `pnpm check` — type-check 0, lint 0, check:colors OK (nyers hex 18/22)
- `pnpm test:client` — 69 fájl, 337 teszt zöld
- axe e2e a két oldalra: 8/8 zöld
