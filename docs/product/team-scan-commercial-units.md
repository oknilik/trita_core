# Team Scan kereskedelmi egységek — partneri szerződés

> Döntés: 2026-08-16 · Lumina-benchmark P2.4. Ez a dokumentum a jövőbeli
> certified partner elszámolás domain-szerződése; **nem kapcsol vissza online
> fizetést vagy önkiszolgáló partner-hozzáférést a pilot előtt**.

## 1. Kód-audit korrekció

A stratégiai dokumentum azon állítása, hogy a `Subscription`, `Purchase` és
`BillingEventLog` modellek mind megmaradtak, nem felel meg a jelenlegi
sémának:

- a `Subscription` megmaradt, de ma szervezeti hozzáférési állapotgép;
- a `Purchase` táblát a `20260731090000_drop_legacy_billing` migráció törölte;
- `BillingEventLog` sincs a jelenlegi Prisma-sémában;
- a hivatkozott `billing-v1-parked` tag nem létezett. 2026-08-16-án létrejött
  a teljes Stripe/Billingo réteg eltávolítása előtti `ba9dc5be` commitra.

A régi tag helyreállítási forrás, nem telepítési utasítás. A régi provider-,
ár- és csomaglogikát nem szabad egészben visszamerge-elni: a Team/Org/Scale és
jelölt-kredit modell nem az itt rögzített üzleti egység.

## 2. A két kanonikus egység

| Kód | Mit jelent | Mennyiségi alap | Bevételi jelleg | Teljesítés |
|---|---|---|---|---|
| `TEAM_SCAN_LICENSE` | Egy csapat első teljes Team Scan v1 diagnózisa | 1 csapat | egyszeri | a kampány lezárt, és a konkrét kampányból publikált riport elkészült |
| `REMEASUREMENT_CYCLE` | Ugyanazon csapat minden további teljes Team Scan v1 köre | 1 csapat × 1 kör | kör-előfizetés használati egysége | a kampány lezárt, és a konkrét kampányból publikált riport elkészült |

Nem a workshop, a résztvevő, az item vagy a kampány a számlázási egység. Egy
többcsapatos kampány csapatonként külön egységet termel. Observer-, peer- vagy
más kiegészítőre ez a szerződés nem gyárt automatikusan új SKU-t.

Az első és a további kör közti döntés forrása a későbbi, append-only usage
ledger ugyanazon csapathoz tartozó, nem voidolt teljesítésszáma. A kampánynév,
a riportok nyers darabszáma és a lépéssorból való visszakövetkeztetés nem
elszámolási forrás.

## 3. Teljesítési és idempotencia-szabály

A `src/lib/team-scan-commercial.ts` fail-closed szerződése csak akkor ad
egységet, ha mind teljesül:

1. a kampányon explicit `presetId = SCAN_V1` van;
2. a kampány `CLOSED`;
3. a riport `PUBLISHED`;
4. a befagyasztott riport `assessmentCampaignId` értéke pontosan a kampány;
5. a korábbi teljesítésszám érvényes, nem negatív egész.

Az idempotenciakulcs `team-scan:v1:<campaignId>:<teamId>`. Ugyanaz a riport
újrapublikálása nem lehet új usage, két csapat ugyanabban a kampányban viszont
két külön egység. A jelenlegi kampánylétrehozó ezért mostantól opcionálisan
megőrzi a preset eredetét; régi és custom kampány `presetId = null`, és nem
minősül visszamenőleg Scan v1 egységnek. A nevesített preset lépéssora
draftban sem írható át; csak a célcsapat és a pacing változhat.

A kereskedelmi teljesítés és a kutatási felhasználhatóság két külön állapot.
Egy korlátozásokkal publikált, de ténylegesen leszállított kör lehet
elszámolható, miközben kompozíciós warning vagy elégtelen adat miatt nem kerül
a kalibrációs kohorszba. A fizetési státusz soha nem írhatja felül a P0.1/P0.2
mérési kapukat.

## 4. Mi működik most, a pilotban?

- A partner/ügyfél feltétele kézi megállapodás és külső számlázás marad.
- Az esetnapló a kanonikus egységkódot és a `paid` / `discounted` /
  `pilot_free` / `barter` kezelést rögzíti, az ár és a számla viszont csak a
  védett kereskedelmi rekordban él.
- A `Subscription` továbbra is kizárólag org-hozzáférést kapuz; a legacy
  `planType` nem Team Scan SKU és nem usage ledger.
- A `src/lib/team-scan-commercial.ts` tiszta döntési szerződés, runtime hívó
  és adatbázis-írás nélkül. Emiatt a pilot nem hoz létre véletlen számlatételt.

## 5. Aktiválási kapu a certified partner rendszer előtt

A partneri automatizálás csak a prioritási sorrend 7. lépésében indulhat, ha:

- legalább 20 teljes, strukturált esetnapló alapján lezártuk a playbookot;
- kész az akkreditáció, felfüggesztés és minőségbiztosítás szabálya;
- az önkiszolgáló org-létrehozás tenant- és jogosultsági modellje auditált;
- döntés született az árról, pénznemről, adóról, minimum időszakról,
  lemondásról, void/refund folyamatról és arról, ki a szerződő fél;
- elkészült a providerfüggetlen, append-only usage ledger egyedi
  `(campaignId, teamId)` kulccsal és admin korrekciós audit traillel;
- a payment/számlázási adapter csak ezután kapcsolódik a ledgerhez.

Nyitott üzleti döntés tehát továbbra is a konkrét ár és előfizetési cadence.
Ezeket a pilot price-discovery adata nélkül kódba írni hamis bizonyosság lenne.

## 6. Visszaállítási referencia

```bash
git show billing-v1-parked
git diff billing-v1-parked..main -- prisma/schema.prisma src/lib/billing
```

A tagből szükség esetén provider-adapter, idempotencia- vagy számlázási minta
emelhető át külön review-val. A régi checkout, termékcsomag és entitlement
nem tekinthető kompatibilisnek az új egységekkel.
