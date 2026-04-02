# Dokumentáció

## Mappaszerkezet

### `architecture/` — Rendszer felépítés és döntések
| Fájl | Tartalom |
|------|----------|
| `capability-matrix.md` | Role x Subscription x Capability mátrix |
| `journey-engine-adr.md` | ADR-0001: Journey engine architektúra döntés |
| `journey-improvement-plan.md` | Journey engine v2.2 fejlesztési terv |
| `navigation-ia-decision.md` | Navigáció információs architektúra döntések |
| `page-to-nav-map.md` | Route → nav elem megfeleltetés |
| `platform-route-target-structure.md` | Cél route struktúra (platform shell) |
| `source-of-truth.md` | Melyik rendszer minek a source-of-truth-ja |
| `user-journey-map.md` | Teljes user journey térkép |

### `product/` — Feature tervezés és termék scope
| Fájl | Tartalom |
|------|----------|
| `feature-ideas.md` | Feature backlog (bizalmi háló, Belbin menedzselés) |
| `dashboard-content-scope.md` | Dashboard tartalmi scope és blokkok |
| `observer-flow-inventory.md` | Observer flow teljes lifecycle inventory |
| `join-apply-inventory.md` | Join/apply flow leltár |
| `team-intelligence-redesign-task-list.md` | Team intelligence redesign feladatlista |
| `team-intelligence-visualization-policy.md` | Vizualizációs szabályzat (mi becslés, mi mért) |

### `development/` — Fejlesztési útmutatók és konvenciók
| Fájl | Tartalom |
|------|----------|
| `ui-contribution-guide.md` | UI fejlesztési útmutató (Design A/B tokenek) |
| `ui-design-unification-plan.md` | Design rendszer egységesítési terv |
| `ui-hex-replacement-policy.md` | Hex szín → CSS variable csere szabályzat |
| `ui-spacing-guideline.md` | Spacing és layout konvenciók |
| `ui-token-map.md` | CSS variable token térkép |
| `ui-migration-regression-playbook.md` | UI migráció regressziós playbook |
| `nav-convergence-rfc.md` | Navigáció konvergencia RFC |
| `test-ownership.md` | Teszt fájl ownership és felelősség |
| `testing-quality-gate.md` | Teszt quality gate szabályok |
| `changelog/` | Napi changelog fájlok (dátum szerint) |

### `audits/` — Egyszeri auditok és ellenőrzések
| Fájl | Tartalom |
|------|----------|
| `functional-audit-followup.md` | Funkcionális audit eredmények és javítások |
| `org-team-functional-audit.md` | Org/team felületek funkcionális audit |
| `team-intelligence-audit-2026-04-02.md` | Team intelligence audit |
| `ui-audit-baseline.md` | UI audit kiinduló állapot |
| `ui-hotspots.md` | UI hotspot-ok (prioritásos javítási lista) |
| `avatar-policy-audit.md` | Avatar megjelenítés policy audit |
| `d4-end-to-end-sanity-pass-2026-04-01.md` | End-to-end sanity pass eredmények |
| `navigation-regression-checklist.md` | Navigáció regresszió checklist |
| `journey-entrypoint-inventory.md` | Journey belépési pont leltár |

### Gyökér `trita/docs/` (a codebase-en kívül)
| Elem | Tartalom |
|------|----------|
| `architecture.md` | Rendszerarchitektúra leírás |
| `architecture-diagrams.md` | Mermaid diagram definíciók |
| `diagrams-png/` | Renderelt diagramok (PNG + MMD forrás) |
| `export-diagrams.mjs` | Diagram export script |
