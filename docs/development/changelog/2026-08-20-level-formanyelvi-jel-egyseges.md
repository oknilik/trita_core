# 2026-08-20 — A formanyelvi jel minden levélen: a család-fogalom kivezetése

Felhasználói észrevétel: *„az üdvözlet előtt a legtöbb helyen szerepel a trita
kis ábra, de nem minden levélben."*

Pontos megfigyelés — és nem hiba volt, hanem **szabály**, amit az arculati
átállás vezetett be (`2026-08-19-level-arculat-atallas.md`, „Két család").

## Mi volt

A jel (`EMAIL_ART.mark` — csillag + bronz nap + zsálya ellensúly) a láblécben
ül, közvetlenül az aláírás fölött, és csak akkor renderelődött, ha
`family === "client"`. 19 sablonból **16** kapta meg; kimaradt:

| sablon | mit csinál |
|---|---|
| `verification_code` | belépési kód |
| `magic_link` | belépő link |
| `hiring_credits_request` | belső értesítő a trita adminnak |

Az indoklás („a kód megtalálása a feladat, nem a márka") elvben állt, de a
`hiring_credits_request` már a saját logikája szerint sem illett a körbe: az
nem biztonsági levél. A `family` ezen kívül egyetlen dolgot csinált — az
eyebrow tónusát. Vagyis egy majdnem üres fogalom, ami cserébe **látható
szórást** okozott a levél-készleten. Pont az a fajta csúszás, ami miatt az
egész réteg elavult.

## Mi lett

**A család-fogalom kivezetve.** Minden levél ugyanazt kapja: bronz eyebrow és
formanyelvi jel a láblécben.

- `EmailFamily` típus törölve;
- `buildEmailLayout` és a `sendEmail()` kapu `family` paramétere törölve —
  38 hívási-helyi mező tűnt el;
- `emailArtAttachments()` paraméter nélküli, és **mindig** mindkét eszközt
  csatolja;
- `renderEyebrow` feltétel nélkül `accent` / `accentText`;
- az előnézet-index „Család" oszlopa és a minta-típus `family` mezője törölve.

Nincs feltétel, tehát nincs mit elrontani.

## Guardrail

A korábbi eset (*„formanyelvi jel csak az ügyfél-levélen"*) az **ellenkezőjére**
fordult: *„formanyelvi jel MINDEN levélen ott van, és dekorációként."* Ez zárja
ki, hogy bárki visszavezessen egy feltételt.

## Ellenőrzés

Type-check 0 hiba · a levél-guardrail 19/19 zöld · mind a **41** renderben
pontosan egy formanyelvi jel (`role="presentation"`, `margin:0 auto 16px`).
