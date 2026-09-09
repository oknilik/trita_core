# 2026-09-09 — Árak: közvetlenebb kalkulátor-szövegek, egységes ár-szekció

- **Kalkulátor-szövegek átírva közvetlen mondatokra**, a körülírások helyett
  konkrét ármagyarázattal (`pricing.*` kulcsok, HU + EN):
  - cím és bevezető: „Mennyibe kerül a csapatotoknak?" + csomagválasztás,
    létszám, teljes díj és egy főre jutó ár; több csapatnál is az összes
    résztvevő alapján számolunk;
  - csomag-leírások: „Felmérések, riportok és az eredmények közös
    átbeszélése online" / „A Csapatkép minden eleme, személyes workshoppal
    és hat hónappal későbbi újraméréssel";
  - létszámválasztó: „Hányan vesztek részt?"; a csúszka alatti magyarázat a
    díjkártya számaival: az első {band} résztvevő fejenkénti díja, a
    {band+1}. résztvevőtől a további fők díja (`headcountNote`, új `first`
    és `next` változó);
  - csomagtartalom címe: „Mit tartalmaz a {tier}?";
  - **a nagy szám címkét kapott**: „Egy főre jutó ár", a sáv felett „Egy főre
    jutó átlagár" (`perHeadLabel` / `perHeadAverageLabel`), hogy ne
    keveredjen a további résztvevők kedvezményes díjával;
  - **a csapatszám-sáv („1–2 csapat") kikerült** — korlátozónak hatott;
    helyette egy mondat: a résztvevők több csapatból is érkezhetnek, minden
    csapat külön csapatképet és saját eredménymegbeszélést kap. Az
    `estimateTeamRange` helper és tesztje törölve;
  - fizetés: „A program díja akár több részletben is fizethető." (a
    kalkulátorban és a GYIK-ben is; a korábbi „egy összegben, a program
    indulásakor" ellentmondott volna);
  - gomb: „Beszéljünk a csapatotokról"; alatta: „Egy munkanapon belül
    válaszolunk. Az egyeztetés után írásos ajánlatot küldünk.";
  - pilot: „Pilotpartnerként – az első {total} csapat egyikeként – a
    Csapatprogram fenti díjából {pct}% kedvezményt kaptok." — kiderül, hogy a
    kijelzett ár NEM tartalmazza a kedvezményt, és melyik csomagra érvényes;
  - záró szekció címe: „Az egyeztetés után a kalkulált díjat írásos
    ajánlatban is megerősítjük." az „ugyanezt kapjátok írásban" helyett.
- **/team-dynamics ár-szekció**: a cím és a bevezető az /pricing fejlécével
  azonos („Létszám alapú, átlátható árazási struktúra." + az ingyenes egyéni
  szint és a létszám-alap).
