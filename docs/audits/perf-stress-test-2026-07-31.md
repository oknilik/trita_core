# Terhelés- és válaszidő-mérés — 2026-07-31

Mérés a feltöltött bemutató-adaton (Aurora Dinamika Kft., 3 csapat × 5 tag,
lezárt hatlépéses kampány, publikált riportok). Ez az első mérés, amely
VALÓDI kampány-adaton fut — a `perf-call-chain-audit-2026-07-30.md` számai
lényegében üres csapatokon készültek.

---

## 1. Módszertan — és mi az, ami NEM mérés

| Mérőszám | Honnan | Megbízható? |
|---|---|---|
| Query-darabszám, duplikátumok | `pnpm perf:pages` (DB_METRICS) | igen |
| Hullámok (egymás utáni körfordulás-láncok) | ugyanaz | igen |
| DB-idő, DB-időszak (span) | ugyanaz | igen |
| Nyers körfordulás, hidegindítás | közvetlen Prisma-mérés | igen |
| **Éles fal-idő** | **modell, nem mérés** | lásd lent |

**Amit nem tudtam megmérni, és miért.**

1. **Éles (Vercel) válaszidő.** A deployment URL-t Vercel Deployment
   Protection védi, a kérés a függvényig el sem jut. Nem léptem be a
   fiókodba, ezért az éles fal-időt nem mértem, hanem **modelleztem** —
   a modell bemenete mért adat, a kimenete becslés. A 4. fejezet
   mindkét forgatókönyvet megadja.

2. **Lokális production build.** A `pnpm perf:pages --prod` authentikált
   oldalakra használhatatlan (F5), ezért a mérés **dev módban** futott.
   A query-szám, a hullámok és a DB-idő ettől nem torzul — ugyanaz a
   kód-út fut. A dev fal-idő viszont fordítási többletet tartalmaz,
   ezért ezt az oszlopot nem is közlöm következtetésként.

Mérési környezet: fejlesztői gép (Budapest) → Neon `eu-central-1`
(Frankfurt), 3 kör, az utolsó a mért. Felhasználó: Aurora Kata (ORG_ADMIN,
csapattag) — a legtöbb felületet látó profil.

---

## 2. Nézetenkénti terhelés (mért)

| Nézet | query | dup | hullám | párhuz. | DB ms | DB span | exec/query |
|---|---:|---:|---:|---:|---:|---:|---:|
| csapat · tagok | 45 | 0 | 7 | 2,5 | 2090 | 850 | 20 ms |
| csapat · áttekintés | 43 | 0 | 5 | 2,6 | 2041 | 778 | 21 ms |
| csapat · riport | 43 | 0 | 4 | 3,4 | 1620 | 476 | 12 ms |
| org cockpit | 42 | 0 | 8 | 3,6 | 1529 | 424 | 10 ms |
| org · kampányok | 42 | 0 | 8 | 3,7 | 1596 | 437 | 12 ms |
| org · tagok | 42 | 0 | 8 | 2,7 | 1758 | 657 | 16 ms |
| csapat · intelligence | 38 | 0 | 3 | 5,2 | 1778 | 343 | 21 ms |
| csapat-lista | 33 | 0 | 4 | 4,3 | 1227 | 282 | 11 ms |
| API: nav-kontextus | 33 | **3** | 7 | 4,3 | 1118 | 261 | 8 ms |
| org · beállítások | 32 | 0 | 3 | 5,1 | 1094 | 216 | 8 ms |
| journey dispatcher | 31 | 0 | 5 | 4,2 | 1092 | 260 | 9 ms |
| org-lista | 31 | 0 | 6 | 3,5 | 1068 | 302 | 8 ms |
| saját eredmények | 30 | 0 | 6 | 4,1 | 1087 | 264 | 10 ms |
| profil | 30 | 0 | 6 | 3,9 | 1120 | 288 | 11 ms |
| feladataim | 30 | 0 | 6 | 3,9 | 1003 | 257 | 7 ms |
| manager cockpit | 30 | 0 | 7 | 4,1 | 1100 | 271 | 11 ms |
| kérdőív | 30 | 0 | 7 | 3,7 | 1107 | 296 | 11 ms |
| **összesen** | **605** | **3** | | | | | |

`exec/query` = a lekérdezés tényleges futásideje a körfordulás levonása után
(`DB ms / query − 26 ms`).

**A 2026-07-30-i kör után nem romlott semmi.** A `csapat · tagok` 47 → 45,
a `csapat · intelligence` 39 → 38 query. A React.cache tartja magát:
605 query-ből **3 duplikátum**.

---

## 3. DB-oldal (mért)

| | érték |
|---|---|
| Nyers körfordulás (medián / p95 / min) | **26,0 / 26,8 / 23,9 ms** |
| Hidegindítás — Neon autosuspend ébredés | **340 ms** |
| 30 párhuzamos indexelt count | 297 ms |
| `pg_stat_statements` | elérhető, **nincs telepítve** |

Legnagyobb táblák: `Notification` 358 sor, `TrustObservation` 119,
`CampaignParticipant` 116, `TeamRoleObservation` 100, `UserProfile` 81.

**A legfontosabb következtetés az egész mérésből:** a legnagyobb tábla 358
soros, a lekérdezések tényleges futásideje 7–21 ms, a körfordulás viszont
26 ms. **A rendszer nem adat-kötött, hanem késleltetés-kötött.** Indexeléssel,
lekérdezés-optimalizálással itt gyakorlatilag nincs mit nyerni — a nyereség a
körfordulások SZÁMÁN és HOSSZÁN van.

---

## 4. Éles becslés — a régió-kérdés

A Vercel build a logja szerint **`iad1`-ben** (Washington) futott. A Neon
adatbázisok mind `eu-central-1` (Frankfurt). Sem a `vercel.json`, sem a
`next.config.ts` nem állít `regions`-t.

**FIGYELEM — ezt nem sikerült igazolni.** A build régiója nem feltétlenül
azonos a függvény régiójával, és a válasz-fejléc (`x-vercel-id: fra1::…`)
csak az edge-et mutatja, ami a KLIENSHEZ közeli — nem a függvényt. Ellenőrizni
egy helyen lehet: **Vercel → Settings → Functions → Function Region**.

A modell a mért `exec/query` értékekből számol, csak a körfordulást cserélve
(`span = query × (exec + RTT) / párhuzamosság`):

| Nézet | mért (lokál, 26 ms) | ha `iad1` (~90 ms) | ha `fra1` (~2 ms) |
|---|---:|---:|---:|
| csapat · tagok | 850 ms | **1988 ms** | 404 ms |
| csapat · áttekintés | 778 ms | 1843 ms | 388 ms |
| org · tagok | 657 ms | 1647 ms | 278 ms |
| csapat · riport | 476 ms | 1286 ms | 173 ms |
| org cockpit | 424 ms | 1171 ms | 145 ms |
| profil | 288 ms | 779 ms | 103 ms |
| feladataim | 257 ms | 749 ms | 73 ms |
| **17 nézet együtt** | **6647 ms** | **17 467 ms** | **2595 ms** |

**A két forgatókönyv között 6,7-szeres a különbség.** Ha a függvény ma
`iad1`-ben fut, ez egyetlen beállítással behozható nyereség — több, mint
amennyit a teljes 2026-07-30-i optimalizálási kör hozott (−40 % fal-idő).

---

## 5. Megállapítások

**F1 — Régió.** Lásd 4. fejezet. Ellenőrizendő, potenciálisan 6,7×.

**F2 — Késleltetés-kötött rendszer.** A táblák háromszámjegyűek, a
lekérdezések gyorsak. Minden további nyereség a körfordulások számának
csökkentéséből jön, nem SQL-hangolásból.

**F3 — Layout-alapdíj: 30 query.** A legegyszerűbb belépett nézet
(`feladataim`, `profil`, `saját eredmények`) is 30 query. Ez a padló: a
nav-kontextus + journey minden oldalon lefut. A nézet SAJÁT tartalma
ehhez képest olcsó — a `csapat · tagok` 45 query-jéből is csak ~15 a
csapat-adat.

**F4 — Neon hidegindítás 340 ms.** Autosuspend után az első kérés ennyivel
indul. Ritkán látogatott appnál ez minden munkamenet elején jelentkezik.

**F5 — A `--prod` mérőmód hibás.** A `next start` `NODE_ENV=production`-t
állít, az E2E auth-bypass viszont pontosan ezt zárja ki
(`src/proxy.ts:50`, `src/lib/auth-server.ts:10`). Következmény: minden
belépést igénylő nézet 307-tel a `/`-re megy, a mérés 0 query-vel zárul —
csendben, hibaüzenet nélkül. **A guard helyes, nem szabad lazítani**: ha
éles buildben is engedné a bypasst, egy tévesen beállított env-változó
megkerülné a teljes authentikációt.

**F6 — `/api/nav/context`: 33 query, 3 duplikátum, 7 hullám.** Ez az
EGYETLEN hely a mérésben, ahol duplikátum maradt (`UserProfile.findUnique×2`,
`OrganizationMember.findMany×2`, `Campaign.count×2`). Route handlerben a
`React.cache` nem hat, ezért itt kézi memoizáció kell.

**F7 — `csapat · tagok`: a legrosszabb párhuzamosság (2,5).** 45 query 7
hullámban. A `getTeamPageData` (`src/lib/team-stats.ts:217`) mind a 7 fülre
lefuttatja a teljes gyűjtést (minden tag eredménye + trust-network), akkor is,
ha a `members` fül csak a névsort mutatja.

**F8 — `pg_stat_statements` nincs telepítve.** Lekérdezés-szintű éles
rálátás nélkül minden jövőbeli mérés az alkalmazás-oldali metrikákra szorul.

---

## 6. Javaslatok — hatás / ráfordítás sorrendben

### R1. Függvény-régió ellenőrzése és `fra1`-re állítása
**Ráfordítás: percek. Hatás: potenciálisan 6,7×.**

Vercel → Settings → Functions → Function Region → `fra1` (Frankfurt), vagy
a repóban:

```json
{ "regions": ["fra1"] }
```

Ha már most `fra1`, ez a tétel lekerül a listáról — de akkor is tudni kell,
mert a 4. fejezet minden becslése ezen áll. **Ezt érdemes legelőször
megnézni**, mert minden más javaslat hatása ehhez képest mérendő.

### R2. `getTeamPageData` fül-szintű bontása
**Ráfordítás: közepes. Hatás: a legdrágább nézeten ~10 query, és a
párhuzamosság javulása.**

A `members` és a `feedback` fülnek nincs szüksége a trust-network-re és a
tagok teljes eredmény-halmazára. Egy `include`-szintű kapcsoló (mit kér a fül)
a 45 query-t ~35-re viszi, és a 7 hullámot rövidíti. Ez a
`perf-call-chain-audit-2026-07-30.md` 9.7-es listájának első tétele is.

### R3. `/api/nav/context` memoizáció
**Ráfordítás: kicsi. Hatás: 3 query + 1–2 hullám, minden navigációnál.**

Route handlerben `React.cache` helyett kérés-szintű `Map`-alapú memoizáció
(vagy a három lekérdezés összevonása). Kicsi tétel, de a nav-kontextus a
LEGGYAKRABBAN hívott végpont.

### R4. A 30 query-s layout-padló támadása
**Ráfordítás: nagy. Hatás: minden oldalon.**

Ez a legnagyobb szerkezeti tétel, de a 2026-07-30-i kör már megvizsgálta és
tudatosan a Router Cache-t (`staleTimes.dynamic = 30`) választotta a fejléc
Suspense-bontása helyett, UX-indokkal. **Ezt a döntést nem javaslom
felülírni** — R1 és R2 után érdemes újramérni, és csak akkor visszatérni rá,
ha a padló még mindig dominál.

### R5. Neon hidegindítás kezelése
**Ráfordítás: kicsi. Hatás: 340 ms az első kérésen.**

A napi cron (`0 5 * * *`) nem tartja ébren az adatbázist. Ha zavaró, egy
gyakoribb külső ping (GitHub Actions, lásd a cron-szálat) melegen tartja —
viszont Neon-oldali compute-órát fogyaszt. Kis felhasználószámnál a 340 ms
valószínűleg elfogadható; ezt inkább tudni kell, mint javítani.

### R6. A `--prod` mérőmód javítása
**Ráfordítás: kicsi. Hatás: a mérés hitelessége.**

Nem a guardot kell lazítani, hanem vagy (a) a `--prod` módot valódi Clerk
munkamenet-sütivel ellátni, vagy (b) a szkriptet úgy módosítani, hogy
`--prod` mellett ELSZÁLLJON, ha 307/401-et lát — a mostani csendes 0-query
eredmény rosszabb, mint egy hibaüzenet.

### R7. `pg_stat_statements` bekapcsolása
**Ráfordítás: egy `CREATE EXTENSION`. Hatás: éles rálátás.**

```sql
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
```

Enélkül nem látszik, mely lekérdezés viszi az időt éles terhelés alatt.

---

## 7. Reprodukálás

```bash
# adat (ha üres a DB)
npx tsx scripts/seed-showcase-org.ts --env-file .env --consultant-email <admin@…>
npx tsx scripts/seed-campaign-cycle.ts --env-file .env

# mérés — a --prod NE legyen rajta (F5)
node scripts/measure-page-queries.mjs --port=3210 \
  --user=<clerkId> --org=<orgId> --team=<teamId> \
  --passes=3 --json=perf.json
```

Ha a dev szerver „90 s alatt nem jött fel" hibával áll meg: a `.next` egy
korábbi production buildet tartalmaz, ilyenkor előbb egy sima `next dev`
indítással melegítsd be a cache-t.
