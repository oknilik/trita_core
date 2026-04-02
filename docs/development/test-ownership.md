# Test Ownership — Layer Responsibilities

Ez a dokumentum röviden rögzíti, melyik tesztréteg mit véd.

## Unit = pure business logic

- Fókusz: tiszta, determinisztikus domain logika
- Tipikus scope: pure function, reducer, mapper, decision helper
- Nem cél: DB, hálózat, UI wiring

Példák:

- journey szabályok és invariánsok
- policy capability döntések
- assessment progress/validator logika

## Integration = API + DB truth

- Fókusz: endpoint + adatbázis + domain rétegek együttműködése
- Tipikus scope: request → validation → mutation/query → response
- Cél: üzleti igazság ellenőrzése boundary-kon át

Példák:

- join/apply acceptance és membership mutation
- billing state transition + webhook mapping
- observer token acceptance és submission lánc

## Client = interaktív edge case-ek

- Fókusz: kliens oldali komponens viselkedés és state transition
- Tipikus scope: gyors kattintás, disabled state, localStorage restore, race-like UI események
- Cél: UI regressziók és felhasználói interakciós hibák fogása

Példák:

- assessment next/back spam
- page action gating (active/restricted/frozen)
- observer questionnaire UX állapotok

## E2E = üzleti flow és wiring

- Fókusz: end-to-end felhasználói útvonalak
- Tipikus scope: több oldal, redirect, auth handoff, service wiring
- Cél: kritikus üzleti folyamatok működnek-e a teljes stacken

Példák:

- signup → onboarding → assessment → results
- invite accept / apply flow
- billing upgrade és visszatérés

## Rövid döntési szabály

- Ha tiszta domain döntés változik: unit kötelező
- Ha API/DB boundary változik: integration kötelező
- Ha interaktív komponenslogika változik: client kötelező
- Ha belépési pont / redirect / többlépéses flow változik: E2E frissítés kötelező
