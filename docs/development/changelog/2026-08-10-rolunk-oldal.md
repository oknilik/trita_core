# 2026-08-10 — `/rolunk`: kik vagyunk + motiváció, és a brand-hang T/1-re vált

Az /about brand-átnézése után maradt egy jogos hiány: a motiváció csak a
hero kis aside-kártyáján ült (mobilon a hajtás alá csúszva), „kik vagyunk"
tartalom pedig **sehol nem volt** — a pilot-oldal E/1-ben beszélt
(„személyesen dolgozom együtt"), de sosem mondtuk meg, ki az az „én". Egy
tanácsadás-vezérelt márkánál ez valódi rés: az ügyfél a tanácsadót veszi
meg.

## Döntés: külön lap, nem /about-szekció

Az /about a **gondolaté** (mi ez, hogyan épül fel), a /rolunk az
**embereké** (ki építi, miért, hogyan dolgozik). Összemosva mindkettő
fókusza hígult volna; a nemzetközi gyakorlat is így választja szét. A híd:
az /about motiváció-aside-ja teaserré vált, és átlinkel a /rolunk-ra.

Felépítés:
1. **Hero** — pozicionáló állítás: „A Trita mögött nem szoftvercég áll,
   hanem egy tanácsadói műhely." + halk konstelláció.
2. **Miért építjük** — a származás-történet három bekezdésben: a workshop
   „láthatóvá válás" pillanatából született, először saját eszköznek.
3. **Így dolgozunk** — három nem-alku elv: a tanácsadás az első · kicsik
   vagyunk, szándékosan · a módszertan nyitott könyv.
4. **CTA** — kapcsolat + vissza a felépítéshez (/about).

**Név és fotó szándékosan nincs még.** Amíg nincs publikus bemutatkozó,
nem tákolunk arctalan „csapatunk" rácsot — a lap enélkül is őszinte, mert
műhelyként beszél, nem személyként. Amint lesz név/bio/fotó, ide kerül.

## Brand-hang: egységesen T/1 („mi")

Ugyanebben a körben a teljes publikus copy **többes szám első személyre**
váltott — eddig a pilot-oldal és az org-upgrade E/1-ben beszélt, a többi
felület „mi"-ben, ami két külön hangot kevert:

- pilot heroBody: „személyesen dolgozom" → „személyesen dolgozunk"
- pilot asideBody: „cégeket keresek" → „keresünk"
- pilot benefit1: „adok ajánlatot" → „adunk"
- pilot formBody: „visszajelzek" → „visszajelzünk"
- pilot successBody: „kereslek" → „keresünk"
- org requestFollowUp: „kereslek" → „keresünk" (az EN már eddig is
  többesben volt — a pár most szinkronban van)

A user-hangú E/1 stringek (observer „Nem válaszolok", teszt-idézetek,
fake-door célok) **változatlanok** — azok a kitöltő mondatai, nem a
mieink.

## Egyéb

- Footer: „Rólunk" a Termék oszlopban, a „Mi az a Trita" után.
- sitemap (0.5) + llms.txt sor.
- Új i18n blokk: `aboutUs.*` a landing doménben (a szűk publikus szótár
  automatikusan viszi).

## Ellenőrzés

`pnpm check` zöld, unit + client zölden (benne a publikus szótár őrző
tesztje, ami minden új kulcsot HU+EN felold).
