# Lumina-benchmark végrehajtás — 2026-08-16

Forrás: `docs/product/lumina-benchmark-strategia-2026-08.md`.

## P0.1 — mérési-hiba kapu

- A pszichometriai mag két független csapatátlag különbségének standard
  hibáját is számolja; érvénytelen mintán fail-closed működik.
- A riport-összehasonlító a dimenzióeltéréseket a résztvevőszám és a mért
  TSFI-S dimenzió-SEM alapján kapuzza.
- A pszichológiai biztonság változása ideiglenes, konzervatív reliabilitási
  priorral kapott kaput. A prior a pilotadatból újrabecsülendő.
- A felület csak a mérési hibán túli eltérést emeli változássá; a többit nem
  rangsorolja és halk összesítő jelzésben kezeli.
- Unit teszt védi a mintanagyság-invariánst és az önmagával összevetett riport
  nulla érdemi változását.
