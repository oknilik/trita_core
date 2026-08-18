# 2026-08-18 — Facet-attribúció a pár-nézetben („hol fut az eltérés")

> A pár-összevetés lemegy alskála-szintre, de NEM 24 önálló facet-állítással.
> Az új sor egy dimenzió-szinten MÁR megállapított eltérést rendel hozzá
> egyetlen alskálához. Emellett a korábbi nüansz-réteg kapuja szigorodott,
> mert a bevezetés utáni mérés szerint zajra tüzelt.
>
> Teljes elemzés: `docs/audits/interaction-pair-coverage-2026-08-18.md` §8

## A kérdés és a válasz

„Le tudnánk vinni ezt facet szintre, finomabb és pontosabb riportért?" —
**finomabb igen, pontosabb nem.** A rövid formán egy alskála α ≈ 0,47, azaz
a variancia több mint fele mérési zaj (dimenzió-szinten α ≈ 0,78). Két
AZONOS valós profilú ember között egy önálló, 24 facetes összevetés
**7,33 hamis „mérhető eltérés" jelzést** adna — a párok 100 %-ánál legalább
egyet. A teljes forma sem menti meg (7,37), mert a kapu együtt nő a mérési
hibával.

Önálló facet-riporthoz ~168 item kellene (α ≥ 0,70) a mai 60 helyett. Az
termékdöntés, nem mérnöki kérdés.

## Amit helyette építettünk

A kulcs a **hipotézisek száma**, nem a facetek haszontalansága.

| | mit állít | státusz | kapu |
|---|---|---|---|
| **attribúció** (új) | „ezen a dimenzión ide sűrűsödik az eltérés" | egy MÁR megállapított különbség hozzárendelése | 1×√2·SEM **+ pontosan egy alskála lépi át a dimenzió irányában** |
| **nüansz** (meglévő) | „dimenzió-szinten egyeztek, de ezen az alskálán nem" | ÖNÁLLÓ állítás | **2×√2·SEM** |

Az attribúciónál nem a kapu a szűrő, hanem a koncentráció-feltétel: ha két
alskála is átlépi a küszöböt, az eltérés nem sűrűsödik egy helyre, és a
„főleg itt fut" mondat hamis volna — ilyenkor a motor hallgat. Ezért marad
6 dimenzió-szintű döntés, nem lesz belőle 24.

A felület a kettőt KÜLÖN blokkban mutatja („Hol fut az eltérés" /
„Azonos címke, más működés"), mert episztemikusan más a státuszuk — egy
listába keverve a gyengébbiké a másikra is átragadna.

## A nüansz kapuját szigorítani kellett

A réteg a 2026-08-18-i lefedettség-körben az 1×-es kapun indult. A
bevezetés UTÁNI mérés megmutatta, hogy zajra tüzel: páronként 1,4–1,7
nüansz-sor, vagyis majdnem minden pár két állítást kapott a legzajosabb
rétegből. Az önálló nüansz sok facetre egyszerre fut (egyező dimenziónként
négy teszt), ezért `NUANCE_GATE_MULTIPLIER = 2`:

```
hamis jelzés két AZONOS profil között, facetenként
  1× kapu (17 pont):   31,0 %
  2× kapu (34 pont):    4,0 %
```

## Diagnosztika

A `scripts/diagnose-interaction-coverage.ts` új, 4. blokkja méri a
facet-réteget. Két külön szám, és a különbségük fontos:

- **feltevés-mentes** — a hamis-jelzés arány a mért SEM-ből;
- **modell-feltevéses** — a tüzelési gyakoriság, mert a facetek dimenzión
  BELÜLI szórására (σ_W) nincs saját adatunk. A script három feltevés-értékre
  is lefut, és a kimenet kiírja, hogy ez tájékozódó szám, nem mérés.

## Ami nyitva marad

- A magyar pilot felülírja az `r̄ = 0,264`-et; ezzel a 168-as itemszám is.
- σ_W mérendő a pilot-adatból — ez a hiányzó paraméter.
- Önálló facet-riport csak egy ~170 itemes formával, tanácsadói opcióként.
