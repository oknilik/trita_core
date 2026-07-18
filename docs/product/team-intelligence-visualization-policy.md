# Team Intelligence Visualization Policy

## Purpose

This document defines visualization ownership for team intelligence surfaces and prevents chart/insight duplication.

## Scope Ownership

- `?tab=intelligence` is a summary-first operational surface.
- `?tab=team-role` (Csapatszerepek) is the deep-dive analytical surface.

## Intelligence Rules

- The intelligence page should prefer:
  - short evidence labels (`source`, `quality`, `confidence`)
  - compact metric chips
  - member cards with role pills and key TRITAN dimensions
  - explicit next-step CTAs
- The intelligence page should avoid detailed chart-heavy blocks by default.
- If data is insufficient (fewer than 3 completed self assessments), show a dedicated collection-first state instead of partial analytics layouts.

## Deep-Dive Rules

- Detailed role distribution, gap analysis and analytical charting belong to `?tab=team-role`.
- Intelligence must provide a clear handoff CTA to the deep-dive view.
- Do not duplicate the same detailed role visualizations in both surfaces.

## Guardrail

- New intelligence UI additions must stay summary-oriented unless the same capability cannot be expressed without a chart.
- If a chart is proposed for intelligence, document why summary components are insufficient and why it does not duplicate deep-dive ownership.
