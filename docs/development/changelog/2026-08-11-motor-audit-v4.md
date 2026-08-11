# 2026-08-11 — motor-audit negyedik kör (vak, feltárás-only)

A v3-javítási kör (3 commit, `pnpm check` PASS · unit 748 · client 121) után
**negyedszer** is a nulláról futott a motor-audit: hat friss elemző a hat motor-
területen, tiltva minden korábbi audit- és changelog-doksi. **Feltárás-only** —
nincs kód-változás. Teljes lista: `docs/audits/motor-audit-v4-2026-08-11.md`.
Vizuális riport: claude.ai artifact „Trita motor-audit · negyedik kör".

## Összkép

- **A v2/v3-javítások TARTANAK — 0 regresszió.** Mind a hat elemző külön
  megerősítette (közös rankDimensionScores a címke+ábra mögött, egységes
  isMeasuredDynamicsSource, centralizált anonimitás-padló, debiased FNV tie-break,
  diversify-monotonitás, a W6-törlés helyes sorrendje, Kultúra-jelölő zárva).
- A negyedik pass a **MINTÁT** találta meg, nem a példányt: **a javítások
  lokálisak voltak** — ugyanaz a hiba-osztály visszatér a testvér-felületeken.

## A négy réteg

1. **A v3-fixek lokálisak** — nem érték el az összes hívási utat: W6 (case-
   sensitivity + CANCELED + a Clerk-webhook megkerüli — saját bugok), W1 (a saját
   commentem doc-drift: teljes-pontosságú timestamp a payloadban), minForReveal=2
   default él; csapatszerep S1 (member-report badge nélkül) / S2 (exact 1/6
   felületen + kerekített-átlag bias) / S4 (results+dossier scope kimarad); az
   S3-kapu nyelvi párjai (glyph-plate/archetype/interakció még állítják a sorrendet).
2. **Mért-vs-becsült jelölés** — sokkal több helyen sérül: karrier observer-blend
   visszafejthető min-3 alatt (ungated differencia-támadás), member-report becsült
   szerep „A te szereped"-ként, flat-50 kitalált profil „MÉRT" badge alatt.
3. **RESO fordított orientáció** — rendszerszintű: a stabil user #1 „fejlődési
   fókusza" a Félelem/Szorongás + „stresszkezelés" tipp; observer-gap + PDF
   profile-character + blanket „figyelendő" mind invertál.
4. **Mérési hiba fegyelem** — a különbség-kapuk 1×SEM-et használnak SE(diff)=√2·SEM
   helyett; a próza állítja a sorrendet, amit a kapu tilt; kemény küszöbök a hibán belül.

Plusz: privacy-réteg (külső draft olvasható/felülírható; role-round GET guard
nélkül; dossier org-határ) és a változatlan, pilot-gated validitási alap.

## Ajánlás

Egy fókuszált **v5-javítási kör** a „zárható most" oszlopot zárhatja — élén a
v3-fixek testvér-felületekre terjesztésével (a saját W6/W1 réseimmel), a privacy-
réteggel és a RESO-orientációval. A validitási alap a pilot-backlog.
