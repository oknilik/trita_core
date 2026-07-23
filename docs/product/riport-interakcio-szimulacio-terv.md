# Interakció-szimuláció — tervezési doksi (P5.7)

> „Mit él át egy Empatikus értékőr, amikor egy Hajtóerővel dolgozik? Amikor
> egy Újító a főnöke? Amikor három Újító kerül mellé?" — a 2. külső kör
> szerint ez az a funkció, amit sem a Hogan, sem a DISC, sem az MBTI, sem
> az Insights nem csinál jól. Ez a doksi a megvalósítás tervét rögzíti.

## 1. Mi ez — és mi nem

**Ez:** interaktív „mi lenne, ha" réteg a személyiségprofil tetején. A
felhasználó (vagy tanácsadó) kiválaszt egy másik működésmódot — kolléga,
vezető vagy csapat-összetétel — és a rendszer megmondja: mi megy magától,
hol lesz súrlódás, mit érdemes előre megbeszélni.

**Nem:** párkapcsolati kompatibilitás-teszt, és nem jóslat. Minden kimenet
hipotézis-keretezésű, forrás-jelöléssel (P1/P5-elvek), és a valós
csapat-mérés (team view) felé mutat.

## 2. Architektúra — a kulcsdöntés

NEM archetípus × archetípus mátrix (30×30 = 870 cella, karbantarthatatlan),
hanem **dimenzió-pár relációs motor** — a P4.2-ben bevált kompozíciós elv
kiterjesztése kétszemélyesre:

1. **Reláció-atom:** (én dimenzió-pólusom) × (ő dimenzió-pólusa) → rövid
   dinamika-szöveg. A 6 dimenzió × {high, low} × ugyanez a másik oldalon
   elvileg 144 pár — de csak az AZONOS dimenzión belüli és a kiemelt
   kereszt-párok relevánsak:
   - azonos dimenzió: 6 × 3 kombináció (high–high, high–low, low–low) = 18 atom;
   - kereszt-párok: a team-stats súrlódás-modell top-jóslói mentén válogatva
     (THOR×ADAP, TEMP×RESO, OPEN×THOR…) ~10–12 kiemelt atom.
   Összesen **~30 gondosan megírt reláció-atom** fedi le a teret.
2. **Kompozíció:** két profil találkozásakor a motor kiválasztja a
   legmarkánsabb 2–3 aktív atomot (mindkét fél pólusos dimenziói szerint,
   FRICTION_WEIGHTS-súlyozott sorrendben), és három blokkba rendezi:
   *Ami magától megy* · *Ahol súrlódás várható* · *Mit beszéljetek meg előre*.
3. **Aszimmetria:** minden atomnak két nézőpontja van („te ezt így éled
   meg / ő valószínűleg így") — ugyanaz az atom mindkét fél riportjában
   használható, tükrözve.
4. **Vezető-mód:** ugyanazok az atomok + 6×2 vezető-specifikus kiegészítő
   szöveg (mit jelent, ha a POLARIZÁLT dimenzió a vezetőnél van — pl.
   „Újító főnök, Rendszerépítő beosztott").
5. **Csapat-mód (később):** N profil → a csapat domináns pólusai vs. az
   egyén (a team-pattern tengelyei már ezt számolják) — „három Újító
   mellett te leszel a horgony, és ez fárasztó lehet".

## 3. Felület

- **v1: web, nem PDF.** A results-oldal új szekciója („Hogyan működnétek
  együtt?"): a felhasználó archetípust VAGY konkrét (megosztott profilú)
  kollégát választ. A PDF statikus — az interakció élménye a webre való.
- Tanácsadói használat: a team view-ból indítva két tag kiválasztásával
  (itt már valós pontszámokból, nem archetípus-prototípusból számol).
- Guest/marketing változat (később): a /patterns oldalon két archetípus
  összeeresztése — erős lead-magnet, valós pontszámok nélkül.

## 4. Adatforrás-szintek

| Szint | Bemenet | Pontosság-jelzés |
|---|---|---|
| Archetípus-szimuláció | prototípus-pontszámok (86/74-es recept) | „típus-szintű becslés" |
| Profil × archetípus | saját valós pontszám + prototípus | „félig becsült" |
| Profil × profil | két valós, megosztott profil | „profil-alapú becslés" + konszenzus a megosztásról |
| Mért pár-adat | team-stats élek (aligned/complementary/friction) | „csapat-mérésből" |

Adatvédelem: konkrét kolléga csak explicit profil-megosztás vagy közös
csapat-tagság esetén választható; a kimenet soha nem címkézi a másikat
(„ő ilyen”), hanem a KETTŐTÖK dinamikájáról beszél.

## 5. Ütemezés-javaslat

1. **F1 — reláció-atomok content-készlete** (18 azonos-dimenziós + ~12
   kereszt-atom, HU+EN, mindkét nézőponttal): a legnagyobb munka, ~M-L.
   Guardrail-teszt a lefedettségre.
2. **F2 — motor** (`src/lib/interaction-engine.ts`): tiszta függvény
   (profilA, profilB) → {easy, friction, discuss}; unit-tesztekkel. S-M.
3. **F3 — web UI** a results-oldalon archetípus-választóval. M.
4. **F4 — team view integráció** (valós párok) + vezető-mód. M.
5. **F5 — guest/marketing változat.** S-M.

## 6. Nyitott kérdések

1. Plus-only vagy részben ingyenes (marketing-érték vs. upsell)?
2. A vezető-mód a v1-be kerüljön, vagy F4-be? (A külső kör kifejezetten
   említette a „mit él át, ha X a főnöke" esetet.)
3. Kell-e a PDF-be egy statikus ízelítő (pl. a 3 leggyakoribb partner-típus
   dinamikája), vagy a PDF marad a mostani Csapatban működve oldallal?
