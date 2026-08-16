# Portfólió-parkolás és visszaállítás — 2026-08

Kapcsolódó döntés: `lumina-benchmark-strategia-2026-08.md`, P2.2.

## Cél

A pilot alatt egyetlen zászlóshajó marad élő: a **Trita Team Scan** és annak
mérési körei. A szélesebb portfólió kódját és adatait nem töröljük, de nem
engedjük ki ügyfél-, admin-, API- vagy keresőfelületre. Így a parkolt modul nem
ígér karbantartott terméket, és nem visz becsült állítást a tanácsadói
beszélgetésbe.

## Visszaállítható pillanatkép

- Git tag: `portfolio-v1-pre-parking-2026-08-16`
- Commit: `b7d78cb2e9436d610edc6de07b9bb370ef1afef2`
- Tartalma: a P2.1 utáni, P2.2 parkolás előtti teljes forrásállapot.

A tag vészhelyzeti forrásreferencia, nem ajánlott deploy-cél: a későbbi
biztonsági és adatmodell-javításokat nem tartalmazza. Normál visszaállításkor a
mindig aktuális ágon kell feloldani a központi kaput.

## Parkolt felületek

| Felület | Központi kulcs | Lezárt belépők | Megőrzött állapot |
|---|---|---|---|
| Karrier-motor és katalógus | `career` | `/career`, career/industry/profile API-k, riport-CTA | katalógus, algoritmus, `careerBackground`, feedback |
| Jelölt/hiring flow | `hiring` | `/hiring`, `/apply`, candidate/hiring API-k, nav és org-fül | meghívók, eredmények, kreditek |
| CRM és ajánlat | `crm` | admin CRM/quote oldalak és API-k; napi sweep és inquiry auto-attach szünetel | dealek, aktivitások, ajánlatok, inquiry-kapcsolatok |
| Blog | `blog` | publikus blog, admin API/fül, nav, sitemap, `llms.txt` | MDX tartalom és szerkesztő |
| Fake door | `fakedoor` | publikus mérő API-k, admin riport/export | view/response és korábbi interest adatok |
| `/patterns` felfedező | `patternExplorer` | oldal, team-riport CTA, footer, sitemap, `llms.txt` | a mintamotor és riportbeli értelmezés élő marad |
| Publikus profilmegosztás/OG | `publicSharing` | `/share`, share API, eredményoldali CTA | tokenek nem törlődnek, csak nem oldhatók fel |

A HTTP-kapu a `src/lib/portfolio-parking.ts` állapotából dolgozik. Parkolt
oldal a fő belépőre irányít, parkolt API `404 FEATURE_PARKED` választ ad. A
hasonló előtagú, de nem modulhoz tartozó utak (`/blogger`,
`/patterns-library`, `/api/profile/shareholder`) nem záródnak le.

## Visszaállítási checklist

Egy felületet csak konkrét tulajdonossal, üzleti céllal és fenntartási
kapacitással szabad visszaállítani.

1. A `PORTFOLIO_SURFACE_STATE` megfelelő kulcsát állítsd `active` értékre.
2. Ellenőrizd a függőségeket:
   - a karrier-motornál a `CAREER_MODULE_READY` is legyen tudatos döntés;
   - a career fake door csak a `fakedoor` kapuval együtt mérhet;
   - hiringnél ellenőrizd a kreditet, a meghívó-emailt és a régi tokeneket;
   - CRM-nél a napi sweep, inquiry auto-attach és a korábbi értesítések is
     automatikusan visszakapcsolnak.
3. Nézd át az adott felület adatvédelmi, anonimitási és jogosultsági kapuit;
   régi adatot ne migrálj vagy törölj automatikusan.
4. Futtasd az érintett unit-, route- és end-to-end teszteket, valamint a teljes
   typecheck/lint/build ellenőrzést.
5. Kézzel ellenőrizd legalább az oldalt, az API 2xx/4xx viselkedését, a
   navigációs belépőt, az email/értesítés mélylinket és — publikus felületnél —
   a sitemap/robots/`llms.txt` konzisztenciát.
6. A visszaállítást külön döntési dokumentumban és changelogban rögzítsd;
   egy kulcs feloldása külön commit legyen.

## Adatkezelési garancia

A parkolás nem futtat sémamigrációt és nem töröl rekordot. A korábbi publikus
share tokenek, jelöltlinkek és admin-mélylinkek HTTP-szinten záródnak le; a
visszaállíthatósághoz szükséges adat változatlanul megmarad. A tag szintén nem
mozgat adatbázist — kizárólag forrásreferencia.

