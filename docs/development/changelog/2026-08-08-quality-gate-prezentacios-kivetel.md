# 2026-08-08 — quality gate: prezentációs kivétel

## A probléma

A sötét mód PR-jén (251 fájl) a **Quality Gate** bukott, egyedüliként — a
Unit, Client, Integration és E2E zöld volt. Az indok:

```
Protected modules changed, but no integration test update found
- src/components/assessment/ABSelector.tsx
- src/components/assessment/SliderSelector.tsx
- src/components/assessment/TeamRoleQuestionnaire.tsx
- src/components/journey/JourneyNextStepCard.tsx
```

A kapu szabálya — „védett modul módosult → bizonyítsd teszttel" —
VISELKEDÉS-változásra van szabva, és arra helyes. Ez a négy fájl viszont
kizárólag `className`-eket cserélt (`bg-white` → `bg-surface-card`,
`text-white` → `text-[var(--color-action-primary-fg)]`): **egyetlen sor
logika sem változott.**

Olyan integrációs tesztet írni, aminek nincs mit lefednie, kimódolt teszt —
az rosszabb, mint a hiánya: zajt visz a hálóba, és elszoktat attól, hogy a
kapu jelzésére odafigyeljünk.

## A megoldás

`scripts/lib/presentation-diff.mjs` — megnézi, hogy a védett fájl két
verziója KIZÁRÓLAG a `className`-attribútumok értékében tér-e el. Ha igen, a
fájl kiesik a védett listából; ha bármi más változott (logika, prop, inline
`style`, látható szöveg), a követelmény marad.

A felismerő egy kis JSX-tudatú szkenner: kezeli az idézőjeles, a
template-literálos (`${…}`-mal) és a kapcsos-zárójeles (tömb / `cn()`)
alakot, a kommenteket és a stringeket pedig érintetlenül hagyja, hogy a
bennük szereplő „className" szó ne tévessze meg.

**Biztonsági alapértelmezés:** bármilyen bizonytalanságnál (nem elemezhető
forrás, párosítatlan zárójel, nem `.tsx`/`.jsx`, új vagy törölt fájl) a
válasz „nem prezentációs". A kapu inkább kérjen feleslegesen tesztet, mint
hogy egy viselkedés-változás átcsússzon rajta.

A kapu kiírja, mely fájlokat engedett át és miért — a reviewer látja.

## Ellenőrzés

- 13 unit teszt (`tests/unit/platform/presentation-diff.test.ts`), a
  súlypont a NEMLEGES eseteken: logika, inline style, szöveg, hasonló nevű
  prop (`wrapperClassName`), nem-tsx fájl, új/törölt fájl, elemezhetetlen
  forrás.
- Élő regresszió-próba: a `JourneyNextStepCard`-ban egy `href` átírása után
  a kapu **továbbra is bukik** — a kivétel nem takarja el a viselkedést.
- A sötét mód PR-jén a kapu átmegy, a négy fájl prezentációsként felsorolva.
