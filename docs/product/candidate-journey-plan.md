# Candidate Journey — Szétválasztási terv

> Dátum: 2026-04-02
> Státusz: implementáció alatt

---

## Jelenlegi állapot

A `/hiring/[orgId]` oldalon a jelölt flow, a credit rendszer, és a vásárlás egy dashboardon van összekeverve. A manager és az admin nagyjából ugyanazt látja, csak az admin kap extra credit szekciót.

## Célállapot

| Felület | Ki látja | Mit tartalmaz |
|---------|----------|---------------|
| **Jelölt folyamat** (`/hiring/[orgId]`) | Manager + Admin | Saját csapat(ok) jelöltjei, meghívás, státusz, eredmények |
| **Credit kezelés** (`/org/[orgId]/settings`) | Csak Admin | Egyenleg, vásárlás, tranzakció történet |
| **Manager credit kérés** | Manager (inline) | "Kredit kérése" gomb → email az admin(ok)nak |

## Változások

### 1. Hiring page: credit szekció kiszedése
- A `HiringDashboard`-ból kikerül a credit balance megjelenítés, credit history, és vásárlás UI
- Manager: ha nincs kredit → "Nincs elérhető kredit · Kérj az admintól" CTA
- Admin: ha nincs kredit → "Kreditek kezelése" link → `/org/[orgId]/settings`
- A hero-ban marad a plan tier badge, de a credit részletek nem

### 2. Credit kezelés az org settings-be
- A credit balance, vásárlás, és történet átkerül a `/org/[orgId]/settings` oldalra
- Csak admin látja (a settings oldal már admin-only)

### 3. Nav menü rendezés
- "Jelöltek" dropdown:
  - "Jelöltfolyamat" → `/hiring/[orgId]` (manager+)
  - "Új jelölt hozzáadása" → `/hiring/[orgId]?invite=true` (manager+)
  - ~~"Csomagok és kreditek"~~ → eltávolítva (admin az org settings-ből éri el)

### 4. PlatformPageShell bekötés
- A hiring oldal `PlatformPageShell surface="team"` alá kerül
- A raw `div.bg-cream > main` wrapper lecserélve
