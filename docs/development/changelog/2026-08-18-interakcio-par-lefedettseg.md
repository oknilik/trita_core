# 2026-08-18 — Pár-összehasonlítás: rés-alapú aktiválás, hat dimenziós sáv, facet-nüansz

> Az `/interaction?pair` nézet korábban a valós párok **34,7 %-ánál egyetlen
> mondatot sem adott**, és átlagosan **6-ból 1,39 dimenzióról** beszélt.
> Mostantól 3,80 / 6, üres kimenet 0,1 %. A partner nyers pontszáma
> továbbra sem hagyja el a szervert.
>
> Mérés és teljes elemzés: `docs/audits/interaction-pair-coverage-2026-08-18.md`
> · újrafuttatható: `npx tsx scripts/diagnose-interaction-coverage.ts`

## Miért

A motor PÓLUS-alapú volt: egy atom csak akkor szólalt meg, ha MINDKÉT fél a
szélső sávban (>65 / <35) állt ugyanazon a dimenzión. A mérési hibát
figyelmen kívül hagyta, holott a párdinamika RÉS-alapú — a platform saját
súrlódás-modellje (`friction-model.ts`) és a csapat-nézet dinamika-élei már
a súlyozott |Δ|-ra épülnek.

Következmény: egy 62 vs 38 pár a Lelkiismeretességen — 24 pont, a
dimenzió-szintű mérési hiba (`DIFF_MIN_GAP` = √2·SEM = 11) több mint
kétszerese — **semmit** nem produkált.

Két mellékleletet is érdemes rögzíteni:

- **A `maxAtoms` plafon inert volt.** 3-as kerettel 1,06 atom aktiválódott
  átlagosan; 12-esre emelve 1,42 dimenzió lett 1,39 helyett. A „mutassunk
  többet" javítás önmagában hatástalan lett volna.
- **A persona-fixture szisztematikusan szebb képet mutatott** (2,75 / 6) a
  valóságnál (1,39 / 6), mert a fixture-profilok sarkosak (86/68/52/48/44/30).
  Ezért nem tűnt fel korábban. A diagnosztika ezért MINDKÉT populáción mér.

## Mi változott

### 1. Rés-alapú aktiválás (`GAP_ATOMS`)

Új, 6 dimenziós atom-készlet a mérési hibát meghaladó, de nem pólusos
eltérésre. **Külön szöveg**, nem a `same-*-high-low` újrahasznosítása: az két
szélső értékre íródott („te hozod a lendületet, ő a nyugalmat"), és egy
58 vs 44 résre hamisan erős. A rés-változatok RELATÍV állítást tesznek
(„a kettőtök közül jellemzően te vagy a …-abb"), nem sávba sorolnak.

A sorok `basis: "gap"` jelölést kapnak, és a felületen „Mérhető különbség"
címkével jelennek meg — a pólusos sor jelöletlen marad, az az alapeset.

**Csak két valós profilra.** Archetípus ellen nem fut: a prototípus négy
dimenziója szerkezetileg 50, ott a „rés" a kitalált középértékhez mérődne.

### 2. Hat dimenziós összevetés-sáv (`PairDimensionBand`)

A próza válogat (max 4 atom), tehát önmagában nem különböztethető meg a
„megnéztük, és nincs róla mit mondani" a „nem néztük meg"-től. A sáv mind a
hat dimenzióról nyilatkozik, két állapottal: *hasonló* (a különbség a
mérési hibán belül) és *eltérés* (afölött), az utóbbinál iránnyal.

**Szóhasználat: „Nálad magasabb", nem „Nálad erősebb".** Az első változat az
értékelő szót használta — ugyanaz a hibaosztály, amit a valencia-mentes
szint-besorolás (2026-08-18) a tier-címkéken kivezetett. Párösszevetésben ez
még élesebb: ott az értékelő szó két EMBERT állítana sorrendbe, nem egy
pontszámot minősítene. A módszertani jegyzet ezért ki is mondja: „ez irány,
nem rangsor: egyik érték sem jobb a másiknál." Guardrail-teszt őrzi
(`interaction-language.test.ts`), hogy a sáv címkéibe ne kerüljön vissza
értékelő szótő.

### 3. Facet-nüansz — „azonos címke, más működés" (`PairFacetNuances`)

Azt az egy kérdést válaszolja meg, amit a dimenzió-szint nem tud: miért
súrlódik két, papíron egyforma ember. Ahol a két profil DIMENZIÓ-szinten
egyezik, ott is elválhat, melyik alskála viszi az eredményt.

Szándékosan szűk: csak egyező dimenzióban, dimenziónként a legnagyobb rés,
összesen legfeljebb 2 sor, és csak a forma szerinti küszöb (rövid: 17,
teljes: 15 pont) felett. A felület kimondja, hogy ez a legbizonytalanabb
réteg — a rövid kérdőíven 2–3 item visz egy alskálát.

## Adatvédelem — a döntés és ami őrzi

**A partner nyers pontszáma nem megy ki a kliensre.** A szerver a KÉSZ
összevetést küldi: dimenziónként egy állapot és az irány, nem a számok,
amikből a kliens visszafejtené. Az irány dimenziónként egyetlen bit —
beszélgetés-indításhoz elég, profil-rekonstrukcióhoz nem.

Guardrail: a `pair-simulation.test.ts` bejárja a szerializált
`PairSimulationView`-t, és **elbukik, ha bárhol `number` típusú érték
szerepel**. A `PairDimensionBand` kliens-tesztje ugyanezt a renderelt
szövegen ellenőrzi (nincs benne számjegy).

## Amit a tesztek fogtak meg

A rés-erősség első változata a küszöbtől 50 pontig skálázott, és emiatt egy
90 vs 10 páron KIÜTÖTTE a konkrétabb pólus-atomot — a meglévő tükrözés-teszt
bukott el rá. A rés most `|Δ| / 100`, ugyanazon a skálán, mint a pólus
(`|pont − 50| / 50`), plusz 0,8-as diszkont, mert gyengébb bizonyíték.
Ezen felül: ha ugyanarra a dimenzióra azonos dimenziós pólus-atom is
aktiválódott, a rés-jelölt eleve elmarad.

## Nem változott

- **Az archetípus-út.** Tulajdonosi döntés: marad a 86/74/50×4 recept. A négy
  néma dimenzió így őszinte — a típuscímke tényleg nem hordoz információt
  róluk. Az út lefedettsége változatlan (1,91 / 6).
- **A pólus-küszöb (65/35).** Nem lazult: a saját profil oldalán kalibrált.
- **A kereszt-atom bank.** Továbbra is 12/60 — a pótlás content-nehéz, és a
  rés-réteg a lyuk nagy részét betölti. Az audit 7. szakasza rögzíti.
