# Navigation IA Decision

Date: 2026-04-02
Status: Proposed
Scope: signed-in admin and manager navigation, dashboard IA, org/team/profile information architecture

## Goal

The platform navigation should become easier to learn and easier to operate under real role-based usage.

Target principles:
- dashboard = operational home
- analytics = interpretation layer, not operational home
- organization = admin and management surface
- self/profile should not occupy first-level topnav real estate
- admin and manager should not see the same menu with random items hidden

## Final IA Model

The signed-in information architecture is organized around five mental models:

1. Daily operations
2. Team management
3. Hiring
4. Organization admin
5. Analytics and interpretation

These are not all exposed equally to every role.

## Top-Level Navigation Decision

### Admin top-level nav

Admin sees:
- `Kezdőlap`
- `Csapatok`
- `Jelöltek` when hiring capability is available
- `Szervezet`
- `Analitika`

Admin does not get:
- `Saját profil` as first-level topnav item

Rationale:
- Admin needs one operational home plus direct access to org-wide control surfaces.
- Profile is personal/account-level and belongs in user menu.
- Analytics deserves an explicit destination because it is not the same as daily execution.

### Manager top-level nav

Manager sees:
- `Kezdőlap`
- `Csapatok`
- `Jelöltek` when hiring capability is available
- `Analitika`

Manager does not get:
- first-level `Szervezet` admin entry
- `Saját profil` as first-level topnav item

Manager may still reach allowed org-level operational views indirectly when the product requires it, but the topnav should not present manager navigation as a reduced admin console.

Rationale:
- Manager mental model is team execution, follow-up, campaign progress, and hiring.
- Org settings, billing, and structural administration are not part of the manager’s primary navigation model.

## Dashboard Decision

### Dashboard purpose

The dashboard is the signed-in operational home.

It answers:
- what needs attention now
- what is blocked
- what is the next best action
- which team or org operation should be resumed

### What belongs on dashboard

Allowed on dashboard:
- next best action
- urgent blockers
- team/org progress summaries
- pending invites / missing assessments / campaign follow-up
- recent activity
- small operational snapshots
- links into execution surfaces

Dashboard should be optimized for:
- triage
- prioritization
- continuation

### What should not live on dashboard as a primary content block

Should move off dashboard:
- deep analytics interpretation
- detailed HEXACO comparison views
- broad organizational reporting surfaces
- settings / billing / structural admin
- personal profile management

Rationale:
- these are interpretation or administration contexts, not operational home tasks

## Analytics Decision

### Separate Analytics page

A distinct `Analitika` destination should exist for admin and manager.

Analytics contains:
- team pattern views
- org-level interpretation summaries
- comparison and trend views
- deeper personality/assessment reading
- cross-team or org-wide insight narratives

Analytics does not contain:
- billing
- org settings
- profile editing
- daily admin task inbox behavior

Rationale:
- analytics is a reading and interpretation surface, not a control panel

## Organization Surface Decision

### Separate Organization area

`Szervezet` is the admin and management container for structural operations.

It contains:
- members and roles
- teams overview
- campaigns management
- org settings
- billing and subscription management

Admin scope:
- full access to organization area including settings and billing

Manager scope:
- only the org-level areas explicitly allowed by capability and role
- no presentation of admin-only settings in first-level nav

Rationale:
- org surface is where the system structure is managed
- it should not be mixed into dashboard or profile

## User Menu Decision

The user menu should absorb personal and account-level items.

Move under user menu:
- `Saját profil`
- account/profile settings
- personal results
- language
- sign out
- personal billing/upgrade if relevant for self-only or plus journeys

Do not keep these as first-level nav:
- `Saját profil`
- profile editing
- account actions

Rationale:
- these are identity/account tasks, not workspace navigation

## Role-Specific Menu Shape

### Admin

Top-level:
- Kezdőlap
- Csapatok
- Jelöltek
- Szervezet
- Analitika

User menu:
- Saját profil
- Fiókbeállítások
- Nyelv
- Kijelentkezés

### Manager

Top-level:
- Kezdőlap
- Csapatok
- Jelöltek
- Analitika

User menu:
- Saját profil
- Fiókbeállítások
- Nyelv
- Kijelentkezés

## Navigation Rules

### Topnav rules

- No feature dump in topnav.
- No settings or billing mixed into operational menus unless that menu is explicitly admin-only.
- No personal profile item at top level.
- Role differences must be config-driven, not inline condition sprawl in render code.

### Dashboard rules

- Dashboard is not the place for deep interpretation.
- Dashboard is not the place for billing/settings administration.
- Every major card should answer either:
  - what requires action now
  - what changed recently
  - where the user should continue

### Analytics rules

- Analytics is read/interpret first.
- It should not be overloaded with admin mutations.

### Organization rules

- Structural management lives here.
- Admin-only actions must not be exposed to manager entrypoints as dead-end links.

## Config Model Decision

Navigation must be driven from central config, not scattered role checks inside multiple nav components.

Minimum desired model:
- nav section definitions
- role visibility rules
- capability visibility rules
- destination labels and descriptions

This config should control:
- desktop topnav
- desktop dropdowns
- mobile quickview
- mobile expanded menu

## IA Mapping Summary

### Dashboard

Contains:
- operational alerts
- next actions
- progress
- recent activity

### Analytics

Contains:
- interpretation
- pattern reading
- comparison
- broader insight surfaces

### Organization

Contains:
- members
- teams
- campaigns
- settings
- billing

### User menu

Contains:
- self/profile
- account
- language
- sign out

## Explicit Non-Goals

- Do not make dashboard the universal surface for every signed-in feature.
- Do not keep admin and manager on the same nav and only hide one or two links.
- Do not expose admin-only destinations from capability-adjacent menus if the user cannot actually open them.

## Approval Checklist

This IA is ready to approve when the team agrees that:
- `Saját profil` leaves top-level nav
- `Analitika` becomes a distinct first-level destination
- `Szervezet` becomes explicitly admin-first
- dashboard is treated as operational home only
- nav rendering will be moved to central config
