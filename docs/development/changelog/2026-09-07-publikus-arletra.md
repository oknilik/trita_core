# Publikus árlétra — fejenkénti ár a díjkártyából

## Mi változott

- **A platform publikál árat.** Két fejenkénti szint, minden méréssel:
  **Csapatkép** (mérés, validált csapatriport, vezetői visszajelzés,
  90 perces online közös értelmezés) és **Csapatprogram** (Csapatkép +
  félnapos workshop + utánkövető mérés fél év múlva). Alapértelmezés:
  35 000 / 50 000 Ft/fő nettó, 10 fő felett 20 000 Ft/fő, további
  workshop-nap 180 000 Ft. A mérések száma nem növeli az árat — a több
  mérés több magyarázatot igényel, ami a workshop-időben jön vissza.
  Indoklás és piaci viszonyítás: `docs/product/pricing-ladder-2026-09.md`.
- **Egy forrás: a díjkártya.** A `QuoteRateCard` (admin: `/admin/quote` →
  Díjtételek) új, 2-es verziójú sémát kapott (`src/lib/quote/rate-card.ts`):
  szintek fejenkénti ára, sávhatár, extra nap, extra kör %, kísérés,
  kiszállás, pilot-kedvezmény %, óra-modell, cél-óradíj, kedvezmény-keret.
  A publikus részhalmazt `derivePublicLadder()` vágja ki
  (`src/lib/pricing/team-ladder.ts`, keretmentes), a szerver-oldali
  betöltő fail-open az alapértelmezésre (`team-ladder.server.ts`). A
  régi (programdíjas) mentett kártya a sémán elbukik → alapértelmezés +
  figyelmeztetés az admin felületen.
- **`/how-we-work` Ajánlat-szekció:** a két statikus kártya és az
  ár-jegyzet helyén a `TeamPricingConfigurator` (szint-váltó + létszám-
  csúszka 5–40 fő + fejenkénti ár és csapat-összeg + tartalom-lista + CTA),
  alatta három rövid válasz (több csapat, egész napos workshop, mitől
  változik az ár) és az ingyenes egyéni felmérés sora. A csúszka utolsó
  foka „40+": ott a panel szám helyett „Egyedi ajánlat" + „Beszéljünk"
  állapotra vált (`PUBLIC_HEADCOUNT_OVER`, `isOverPublicMax`; az
  analitika-sáv `40+`). GYIK: „Mennyibe
  kerül?" a számokkal, „Miért nincsenek listaárak?" → „Mit tartalmaz az
  ár?". Service JSON-LD: a két szint `UnitPriceSpecification`-nel.
- **Főoldal csapat-blokk (`TeamPathway`):** ár-horgony „35 000 Ft / fő-től*"
  csillagos lábjegyzettel (5–10 fős kkv-csapat, Csapatkép; workshoppal
  50 000; nagyobb csapatnak kevesebb) + „Részletes árak" link.
- **`/pilot` ténysáv 3. cella:** „Egyedi ár" helyett a Csapatprogram
  listaára áthúzva, −50% jelvény, partneri ár, lábjegyzettel.
- **ISR + revalidálás:** a három publikus oldal `revalidate = 3600`, a
  díjkártya mentése `revalidatePath`-tal azonnal frissíti őket.
- **Admin ajánlat-kalkulátor** a létrára állt: Program (szint + létszám +
  csapatok) · A szint tartalmán felül (extra workshop-nap, extra mérési
  kör, kísérés, kiszállás) · Kedvezmény (hatókör-választó kikerült: minden
  nem-továbbhárított tételre) · Díjtételek (publikus/belső jelöléssel).
  A saját költség kalkulátora (óra-becslés, cél-óradíj, padló, effektív
  óradíj) változatlan elvvel, új óra-tételekkel. A vevő-szöveg a szint
  tartalmát is felsorolja.
- **CRM-kompatibilitás:** a `QuoteInput` új alakja (`tier`,
  `extraWorkshopDays`, `extraWaves`; a `steps`, `workshopDays`, `waves`,
  `discountScope` kikerült). A 2026-09-07 előtti mentett bemenetek
  olvasáskor átfordulnak (`readQuoteInput`: workshop vagy hullám →
  Csapatprogram); régi díjkártya-pillanatképből dokumentum nem
  generálható (`QUOTE_SNAPSHOT_MISMATCH`) — másolat kell. A kereskedelmi
  PDF a mérés-lépések helyett a szint tartalmát sorolja.
- **Analitika:** új zárt esemény `pricing.configure` (szint + létszám-sáv,
  P2) — az árblokk első beállítása.
- **CSS:** `input[type="range"].pricing-slider` a globals.css-ben
  (kitöltött track `--pct`-ből, 26px thumb, 44px érintőfelület).

## Ellenőrzés

- `pnpm check` (tsc + lint + check:colors) tiszta.
- Unit: 1257 zöld (új/átírt: `tests/unit/quote/calculate.test.ts` — a
  fejenkénti rész azonos a publikus létrával, sávhatár-monotonitás, belépő
  és pilot-ár, örökség-átfordítás; `tests/unit/crm/quote-input-schema.test.ts`).
- Client: 337 + 4 zöld (új: `tests/client/landing/pricing-configurator.test.tsx`
  — nyitó állapot, szint-váltás, sávhatár feletti bontás, egyetlen
  `pricing.configure` esemény).
- Integration (`crm-flow`): a díjkártya-módosítás → másolat-újraszámolás
  próbája a Csapatprogram fejenkénti árára írva át (helyi DB nélkül nem
  futtatva — CI).
- Dummy-env `next build` zöld.
