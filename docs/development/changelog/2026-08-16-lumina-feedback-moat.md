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

## P0.2 — kompozíció-kontroll és stabil mag

- A riport-pillanatkép tanácsadói, belső összehasonlítási alapot tárol:
  csapat-specifikus SHA-256 pszeudonim kulcsot és a hat befagyasztott
  dimenziópontot. Név, email, user ID és itemválasz nem kerül bele.
- A belső alap a szervezeti vezető/tag szerializációjából redaktálódik; csak a
  kontrollált tanácsadói felület kapja meg.
- Az összehasonlító számolja a közös, új és kimaradt kitöltőket. A kisebbik
  kör 70%-a és legalább 3 közös fő kell az értelmezhető stabil maghoz.
- Megfelelő átfedésnél a dimenziódeltát csak a mindkét körben jelen lévő
  tagokból számolja újra; gyenge vagy ismeretlen kompozíciónál fail-closed,
  explicit figyelmeztetéssel nem állít profilváltozást.
