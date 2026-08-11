# 2026-08-11 — Observer a csapat-szinten: hamis evidencia-címke + visszajelzési kultúra blokk

> Kiindulás: „be vannak-e vezetve az observer értékelések csapatszintre?"
> Válasz: **nem** — és közben előkerült egy hitelességi hiba.

## Lelet: hol állt meg az observer-adat

Az observer-**pontszámok** két egyén-szintű felületre jutottak el:
`/profile/results` (a saját önkép–külső kép összevetése) és a tag-dosszié
(org admin/tanácsadó, egy tagról). Csapat-szinten csak ennyi volt:

| Hol | Mi |
|---|---|
| `team-stats.ts` | `teamObserverDoneCount` — *hányan* fejezték be. Darabszám. |
| `manager-cockpit.ts` | `observer_received` feed-esemény |
| `campaign-steps-core.ts` | `OBSERVER_360` mint kampány-lépés |
| `team-intelligence.ts` | `missing_observer_round` prioritás |

A csapat tartalmi képe — `dimAvg`, heatmap, tagkártyák, csapat-mintázat,
súrlódás-modell — **kizárólag önértékelésből** épült.

## 1. Javítás: a dinamika-nézet hamis forrás-címkéje

A csapat-intelligencia „Kapcsolatok" nézete **„Önértékelés + külső
visszajelzés"** evidencia-badge-et mutatott. De a `self_plus_observer`
forrást a `measuredDynamicsEdgeCount` billentette — ami **bizalmi kör**
adat (`isMeasuredDynamicsSource`), nem observer. A `DEFAULT_EVIDENCE.dynamics`
ráadásul **adat nélkül is** ezt állította, `quality: "none"` mellett.

Egy termékben, ahol a forrás- és confidence-jelölés a deklarált hitelességi
alapelv, ez nem kozmetikai hiba: a badge olyan mérést hirdetett, ami nem
történt meg.

- `self_plus_observer` → **`self_plus_trust`**, címke: „Önértékelés + bizalmi
  kör" / „Self + trust round";
- az adat nélküli alapállapot forrása `self` (nem állít mért kört);
- a régi állítást rögzítő teszt frissítve, **és** új szerkezeti teszt: a
  dinamika-evidencia bemenetei közt egyáltalán nincs observer-jel, tehát
  semmilyen kombináció nem termelhet observer forrás-címkét.

## 2. Új: visszajelzési kultúra blokk (csapat-intelligencia fül)

**Amit tudatosan NEM építettünk: csapat observer-átlagot.** Három okból
védhetetlen lenne — az indoklás a `team-observer.ts` fejkommentjében él:

1. **Összemérhetetlen értékelői körök.** A tag maga nominál (max 5 aktív
   meghívó): „A" három közeli ismerőse és „B" öt kollégája kerülne egy
   átlagba. A szám rigorózusnak látszana, de nem az.
2. **Önszelektált minta.** Kampányban a jóváhagyás **vétó, nem mintavételi
   terv**; kampányon kívül teljesen a tag választ.
3. **Differencia-támadás.** Csapat-observer-átlag + megnyitható tag-dossziék
   → a hiányzó tag értéke visszaszámolható.

Helyette: **minden számítás személyen belül fut** (önkép vs. a *saját*
értékelői köre), és csak az eredmény-kategória aggregálódik darabszámmá. Így
soha nem hasonlítjuk „A" raterjét „B" raterjéhez — az összemérhetetlenség
szerkezetileg megszűnik.

Kimenet: hány tagnak van mért külső képe, és közülük hánynál esik az önkép a
mérési hibán belülre. A küszöb a kanonikus `DOSSIER_GAP_MIN_DELTA` (√2·SEM),
ugyanaz, amit a tag-dosszié futtat — a két felület nem mondhat mást ugyanarról
az emberről.

### Vörös vonalak (kódba égetve)

- **Csak kampány-hatókörű** observer-visszajelzés, és csak a csapat saját
  szervezetének kampányaiból (`campaign: { orgId }`). A privát, saját
  meghívós visszajelzés a tagé — a manager-feed ugyanezt a határt húzza.
- **`TEAM_OBSERVER_MIN_COVERED = 4`**: a per-fős n≥3 rater-padló csapat-
  szinten nem elég (2 lefedett tagnál egy „1 eltérés" kimenet 1-az-2-höz
  szűkítene). Padló alatt a blokk **nem renderel** — nem „0"-t mutat, hanem
  semmit. A csapatnézetet a manager is látja, a dossziét viszont nem
  (`canViewMemberDossier` = org admin + tanácsadó), ezért a küszöbnek itt is
  állnia kell.
- **Bucketelt darabszám only**: nincs név, tag-szintű érték, eltérés-nagyság
  vagy dimenzió-bontás. A kimenet kulcskészletét teszt zárja le — bármely
  bővítés (pl. `observerAvg`, `perMember`) újranyitná a támadási felületet,
  ezért ott bukjon el.
- **Valencia-mentes hangnem**: az eltérés nem hiba, hanem jelzés, hogy ott
  érdemes beszélgetni. Ugyanaz az elv, ami miatt az értékelő színrámpa
  lekerült a dimenziókról.

### Fájlok

- `src/lib/team-observer.ts` — tiszta modul (Prisma-mentes)
- `src/lib/team-observer.server.ts` — betöltő, kampány-hatókörű szűréssel
- `src/components/team/TeamFeedbackCultureCard.tsx` — megjelenítés
- `IntelligenceTabView` async lett (a többi tab mintája), a kártya a
  csapat-összefoglaló fölött ül

Tesztek: `tests/unit/team/team-observer-culture.test.ts` (12 teszt) —
anonimitás-padló mindkét irányból, per-fős rater-küszöb, self nélküli és
összevethetetlen tag kizárása, a hibahatáron belüli/kívüli besorolás,
egyetlen dimenzió eltérése, és a zárt kimenet-szerződés.

Ellenőrzés: type-check 0, lint 0, check-colors OK, unit 963/963, client 154/154.

## Nem épült meg (a javaslat 2. és 3. pontja)

- **Értékelői egyetértés** (személyen belüli rater-szórás csapat-szintű
  eloszlása) — ez a legerősebb OD-jel, de csak az 1. bejáratása után.
- **Irány-konzisztencia** (ugyanazon a dimenzión azonos irányú rés a
  többségnél) — nagyobb lefedettséget igényel, hogy ne zajt mondjunk.
