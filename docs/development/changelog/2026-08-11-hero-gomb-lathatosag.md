# 2026-08-11 — Hero-gomb: a sötét panelen világos gomb-készlet futott

> Bejelentés: „a heróban nem látszik jól a gomb, csak hoverre — self-en és a
> jelöltnél is." Valóban regresszió-maradvány volt.

## A gyökérok: a `cn()` nem tailwind-merge

A self-hero „Megosztás" gombja így nézett ki:

```tsx
<Button variant="ghost"
        className="… text-[var(--color-text-on-inverse-muted)] hover:text-white …" />
```

A hívóhely abban bízott, hogy a `className` felülírja a variant színét.
**Nem írja felül.** A `src/lib/ui/cn.ts` egy sima összefűző (nem
tailwind-merge): az ütköző utility-k MINDKETTEN kimennek az osztálylistába,
és hogy melyik nyer, azt a **generált CSS sorrendje** dönti, nem a
`className` sorrendje. Itt a ghost variant világos `text-action-secondary-fg`-je
nyert — sötét felirat a zsálya-gradiensen, vagyis láthatatlan gomb.

Ez magyarázza a „csak hoverre látszik" tünetet is: a ghost saját
`hover:bg-state-hover-bg`-je **világos krém**, és alatta a sötét felirat
hirtelen olvashatóvá vált. Nem a hover javította meg a gombot — a hover
csinált alá világos felületet.

## Miért maradt itt

A `onInverse` prop 2026-08-09 óta LÉTEZETT, de csak a **tiltott állapotot** és
a fókuszgyűrű-eltolást kezelte (akkor a jelölt-hero disabled gombja mosódott
kékes-szürke folttá). Az **alapállapot** világos maradt — a rés ott nyílt.

## Javítás

Új `VARIANT_ON_INVERSE_CLASSES` a `Button` primitívben: sötét panelen a
variant a saját készletét kapja a világos **HELYETT**, nem mellé. Így nincs
mit feloldani a kaszkádban — a hiba osztálya szűnik meg, nem csak az esete.

- `ghost` / `secondary`: fehér-wash háttér, `text-on-inverse` felirat,
  erősebb wash + fehér felirat hoveren;
- `primary`: réteg-semlegesen világos töltés sötét felirattal (a működő
  herók mintája). Amelyik hívó a RÉTEG akcentjét akarja (self: bronz-300,
  jelölt: terrakotta), az inline `style`-lal teszi — az megbízhatóan nyer a
  kaszkádban, szemben egy utility-osztállyal.

Hívóhelyek:
- **self-hero** (`ProfileHero`): `onInverse`, és a nem működő kézi
  szín-felülírás törölve;
- **jelölt-hero** (`HiringDashboard`): a „Mégse" az inverz ghost készletet
  kapja, a „Jelölt meghívása" pedig `variant="primary" onInverse` + inline
  réteg-akcent (a self-hero PDF-gombjának bevált mintája) a korábbi,
  variant ellen küzdő osztály-lánc helyett.

Átnézve a többi sötét panel is: a team/org/manager hero sima `<Link>`-et
használ explicit `text-on-accent`-tel, az upsell-teaserek és a
`CareerFakeDoor` nem a Button primitívet — ezek rendben voltak. A bejelentett
kettő volt az összes érintett.

## Regressziós védelem

Új: `tests/unit/design/button-on-inverse.test.ts` (5 teszt)

- az inverz ghost/secondary nem viheti a világos `text-action-secondary-fg`-t,
  és van sötét-panel szövegszíne;
- az inverz készlet nem támaszkodik világos hover-háttérre (ez okozta a
  „csak hoverre látszik" tünetet);
- az inverz primary nem a sötét zsálya töltést kapja;
- a világos és az inverz készlet **kizárja** egymást (nincs ütközés);
- forrás-őrszem: a `SurfaceHero actions=` slotjába kerülő minden `<Button>`
  `onInverse`. A tag-illesztő mélység-tudatos — egy `onClick={() => …}`
  nyílfüggvénye is `>`-t tartalmaz, a naiv illesztés ott elvágná a tagot és
  néma hamis-riasztást adna.

Az őrszem visszamérve a hiba előtti forráson pontosan a bejelentett gombot
jelöli meg (2 hero-gombból 1 hiányos).

Ellenőrzés: type-check 0, lint 0, check-colors OK, unit 950/950, client 154/154.

## Tágabb lelet (nem javítva)

A `cn()` nem-merge viselkedése **rendszerszintű csapda**: bárhol, ahol egy
hívóhely `className`-nel próbálja felülírni a variant színét, a nyertes a
CSS-sorrendtől függ. Egy ilyen látens eset a `HiringDashboard` EmptyState-
gombja (`variant` default primary + `bg-accent-candidate` osztály) — ott
mindkét szín olvasható, tehát nem láthatósági hiba, csak márkaszín-bizonytalanság.

A gyökérszintű megoldás a `cn()` tailwind-merge-re cserélése lenne. Ez az
egész alkalmazásra ható változás valódi regressziós kockázattal, ezért NEM
része ennek a javításnak — külön körben, saját vizuális átnézéssel érdemes.
