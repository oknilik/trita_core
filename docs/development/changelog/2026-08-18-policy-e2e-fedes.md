# 2026-08-18 — E2E-fedés a policy-sorrendre (minőségkapu zárása)

> A `claude/pilot-p0-fixes` branch folytatása. A PR CI-jén a Quality Gate
> pirosat adott: „Critical flow files changed, but no E2E test update found".
> A kritikus fájl a `src/lib/policy-engine.ts` volt (P1-kör, szerep-ellenőrzés
> az előfizetés-ellenőrzés elé). Ez a kör megírja a hiányzó e2e-fedést.

## Miért nem elég a meglévő unit teszt

A `tests/unit/policy/policy-engine.test.ts` a döntést magát fedi (adott
bemenetre `ROLE_INSUFFICIENT` jön, nem `SUBSCRIPTION_RESTRICTED`). Amit NEM
fed: hogy ez a döntés a valódi stacken keresztül — DB → `policy-service` →
`/team/[id]` → `policy-ux` → `TeamHeroBlock` — tényleg a felületre is így ér
ki. A sorrend-javítás értelme épp a felületi üzenet volt, szóval a fedésnek
odáig kell érnie.

## Új: `tests/e2e/policy/capability-gate.test.ts`

Két eset, egy közös fixture-ön (org `past_due` előfizetéssel → `restricted`,
egy csapat, két néző):

- **org-tag (csapat-manager)** — org-szinten `ORG_MEMBER`, a saját csapatában
  `manager`. A `restricted` állapot a `teamManage` capabilityt elveszi, így a
  capability-gate renderelődik. Elvárás: a **szerep**-indoklás jelenik meg, és
  a billing-szöveg NEM — ez a regresszió-őr, mert a régi sorrendben ez a
  szerep „Előfizetés kezelése" CTA-t kapott egy olyan akcióra, amihez a
  szerepe eleve kevés (és ezzel kiszivárgott az org billing-állapota).
- **org-manager** — kontroll-eset ugyanabban a csapatban: nála a szerep
  elegendő, tehát továbbra is az **előfizetés**-indoklást kell kapnia. Enélkül
  a sorrend-csere némán elnyelhetné a reaktiválási teendőt.

A várt szövegeket a teszt a `getCapabilityGateCopy`-ból származtatja, nem
másolja: így a copy-átírás nem töri el, a sorrend-visszaesés viszont igen.

## Verifikáció

A teszt bizonyítottan fogja a regressziót: a `policy-engine.ts`-t ideiglenesen
a javítás előtti állapotra visszaállítva az első eset **elbukik** (a
szerep-szöveg nem jelenik meg), a kontroll-eset pedig mindkét verzióban zöld —
tehát nincs véletlen összecsatolás a két ág között. A javított kódon 2/2 zöld.

Helyben futtatva teljes körben: type-check 0 hiba, `pnpm test:unit`
1036/1036, `pnpm test:client` 207/207, ESLint tiszta, Quality Gate zöld.
A futtatáshoz a `PLAYWRIGHT_CHROMIUM_PATH` menekülő-útra volt szükség (a
konténerben más chromium-build van, mint amit a pin vár) — CI-ben ez nem
kell, ott a Playwright saját letöltése fut.
