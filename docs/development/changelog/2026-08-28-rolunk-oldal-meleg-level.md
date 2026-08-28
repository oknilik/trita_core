# 2026-08-28 — Rólunk oldal: „Meleg levél” irány

## Az /about (Rólunk) oldal újratervezve

Három látványterv-irányból (Meleg levél · Sötét színpad · Műhelyfal) a
„Meleg levél" került kiválasztásra: tömör, barátságos, középre zárt
kompozíció, a többi noauth oldal vizuális nyelvén.

- **Szerkezet**: középre zárt hero („Szia, mi vagyunk a trita.") →
  konstelláció-sáv → három elv (3 hasáb, számozva) → történet (bg-warm)
  → kijelentés (inverz sáv) → CTA-kártya. A korábbi 4 lépéses
  folyamat-szekció kikerült — a folyamat a /how-we-work oldalon él.
- **Miro-ihlette ábra**: a hero alatt a formanyelv 2. szintjének szabad
  konstellációja (`EditorialArt`, `artKeyFrom("about", "hero")`) — az
  egyetlen-nagy-felület szabálynak megfelelően, nem SectionTransition.
- **Történet-narratíva pontosítva**: a trita nem tanácsadói munkából,
  hanem több év csapatokban végzett munkából és csapatvezetésből nőtt
  ki — az i18n `about.story*` kulcsok és a page metadata is eszerint
  fogalmaz.
- Az `about.*` i18n blokk teljesen újraírva (HU+EN), a nem használt
  `steps*` kulcsok törölve.
