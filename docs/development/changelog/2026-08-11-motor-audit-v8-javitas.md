# 2026-08-11 — Motor-audit v8: vak kör + javítások (RESO-valencia, ± leszedés, GDPR)

Folytatás a v7-körhöz (HEXACO-címkék, hero-CTA-k, ±-eltávolítás). Ez a nap a
nyolcadik VAK auditot (6 elemző, csak kód alapján) és annak teljes kód-rétegét
zárta le. Részletes riport: `docs/audits/motor-audit-v8-2026-08-11.md`,
ledger: `docs/audits/motor-known-residuals.md`.

## A vak kör megerősítette a v7-et

0 regresszió. Független ellenőrzés: nyers dimenzió-kódok nem szivárognak
user-facing szövegbe; mind a négy hero (self/team/org/hiring) CTA-ja látható és
kontraszt-helyes; a scoring/type-mag (reverse-scoring, `DIFF_MIN_GAP`,
hedge-kapuk) és az anonimitás-padlók tiszták; a hozzáférés-kontroll (LAST_ADMIN,
IDOR, token-join, webhook-aláírás) rendben.

## Javítva (13 kód-lelet)

**RESO-valencia inverzió (osztály-szintű, 3 felület).** A RESO fordított irányú
(alacsony = érzelmi stabilitás, nem hiányosság), mégis nyers magas/alacsony
alapon kapott erősség/kockázat címkét:
- `team-report.ts` — a legalacsonyabb csapatátlag a „Kockázatok" blokkba került;
  RESO-nál a szöveg a MAGAS pólust írta le, de csak a LEGALACSONYABB esetén
  tüzelt → affirmatívan fordított. Egy stabil csapat a stabilitását látta
  kockázatként.
- `team-insights.ts` (`generateTeamSummary`) — a „elég-e ez a szerep igényeihez?"
  mondat a stabilitást kérdőjelezte meg.
- Jelölt-összegző — RESO-alacsony a narancs „figyelendő", RESO-magas a zöld
  „erősségek" panelbe került (fordított felvételi döntéstámogatás).

**± szám a felületen (a 2026-08-11 döntés kimaradt testvérei).**
- `i18n/landing.ts` — a PUBLIKUS landing team-hero még kiírta a
  „Csapatátlag ± szórás" / „Team average ± spread" jegyzetet.
- `team-intelligence.ts` — a `dimension_spread` és `leader_team_mismatch`
  `reason` szövege még „(N pont)" értékeket hordozott a konzultánsi tabon.
A kiváltó logika (szórás/delta küszöb) változatlan, csak a szám ment ki.

**GDPR-törlés kiterjesztés.** A scrub tombstone-t csinál, ezért az FK SetNull nem
tüzel — csak a kézzel érintett táblák tisztulnak. Bekerült az `Inquiry`
(kapcsolat-űrlap név/email/cég/szabad-szöveges üzenet — a konzultáns és az admin
visszaolvasta) és a `CandidateInvite` (jelölt email/név) redaktálása. A score
pszeudonimizálva marad az anonim aggregátumhoz.

**Egyedi.** Observer-kvóta: a kliens a kitöltött meghívókat is beszámolta az
5-es keretbe (5 válasz után eltűnt a kérő-űrlap, holott a szerver elfogadta
volna) → függő-alapú kapu a közös konstanssal. `computeObserverAverage`:
per-ÉRTÉK anonimitás-padló (1–2 értékelős dimenzió-átlag felfedte az egyéni
választ). Pattern-route: hiányos score-JSON már nem 500-azza az endpointot.
Karrier: a H-padlós komponens nem vált ki „above-target" jelzést (önmagával
ellentmondó kártya). `useCredit`: a `> 0` őr az UPDATE-re került (check-then-act
→ negatív egyenleg). Fake-door `emailRate`: a számláló az igen-kohorszra
szűkítve (100% feletti arány). Vezető-csapat összevetés: a bázis már nem
tartalmazza a vezetőt. Két félrevezető megjegyzés/mezőszöveg javítva
(facet-küszöb „≥2" → 3; TSFI-leírásból ki a tiltott „HEXACO-alapú").

## Ledger-mozgás

- **LEZÁRVA:** „törölt profil demográfia-retenció" — a döntés a TÖRLÉS, kóddal és
  integrációs teszttel fedve (a v8 eleji `shareToken`-visszavonás + tombstone
  bővítés része).
- **ÚJ RÉSZLET a W1-hez:** a differencia-támadásnál a FACET-átlag is
  betöltésenként újraszámol (~24 egyenlet) — élesíti az egy-rater visszafejtést,
  a mitigációnak erre is ki kell terjednie. Pilot-kalibrált termék-döntés.
- **ÚJ termék-döntés:** org-roster email-láthatóság (bármely tag látja a tagok és
  a függő meghívottak email-címét).
- A validitási alap (§1) változatlan — nyolc kör óta nincs új strukturális
  meglepetés.

## CI / tesztek

Az integrációs réteg CI-flakysége megszűnt: gyökér-ok a submit-útvonal
`await import("@clerk/nextjs/server")` hívása volt — node24 + `react-server`
feltétel alatt a Clerk szerver-SDK a `next/navigation` `createContext`-jén dob
MÁR MODUL-BETÖLTÉSKOR, és a node:test a dinamikus import elutasítását egy
KÉSŐBBI teszt-esethez rendelte. A teszt-env-ben a néző-feloldás most Clerk-import
nélkül ad `null`-t (a feloldás amúgy is best-effort). Emellett a `/join`
not-found e2e türelmi ideje 15s → 30s (terhelt runneren a dev-render határos volt).

type-check tiszta · unit 823/823 · client 148/148 · integration 137/137 · e2e zöld.
