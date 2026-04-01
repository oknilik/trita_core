# Nav Convergence RFC

## Status
- Date: 2026-04-01
- Owner: UI Architecture
- Decision: Accepted (Phase 1 implementation target)

## Context

Jelenleg a platform navigáció két párhuzamos implementációval él:

- `src/components/NavBar.tsx`
- `src/components/layout/nav-header-ui.tsx`

`src/app/layout.tsx` runtime döntéssel vált közöttük:
- ha van org kontextus (`navData`) -> `NavHeaderUI`
- egyébként -> `NavBar`

Ez rövid távon működik, de hosszú távon driftet okoz:
- párhuzamos mobile/desktop logika
- eltérő copy és i18n érettség
- eltérő signed-in IA (home/profile/team/org/hiring)
- nehezebb központi UX változtatás

Kapcsolódó, jelenleg nem használt komponensek:
- `src/components/layout/Topbar.tsx` (jelenleg nincs import)
- `src/components/layout/SidebarUI.tsx` (jelenleg nincs import)

## Audit summary

1. `NavBar` erős public + signed-out fókuszú, rendelkezik i18n és journey hint támogatással, de signed-in IA-ja egyszerűbb.
2. `NavHeaderUI` erős signed-in app IA-t ad (team/org/hiring), de több helyen hardcoded copy és lokális szerkezeti logika van benne.
3. A shell réteg (`PlatformPageShell`) még nem kezeli egységesen a breadcrumb/topbar/actions részeket, csak surface layoutot.
4. `Topbar`/`SidebarUI` funkcionálisan legacy irány, jelenleg dead code.

## Decision

### 1) Melyik marad alapnak?

Signed-in app navigáció alapja: `NavHeaderUI`.

Indok:
- jobban illeszkedik a platform IA-hoz (team/org/hiring)
- közelebb van a journey + policy + role kontextushoz
- már most ez fut, amikor teljes nav context rendelkezésre áll

### 2) Melyik deprecated?

- `NavBar` signed-in módja deprecated.
- `NavBar` public/signed-out módban marad (marketing + auth shell).
- `Topbar` deprecated (nem kerül visszavezetésre).
- `SidebarUI` deprecated (nem kerül visszavezetésre).

## Target architecture

### A) Root-level nav split (explicit)

- `PublicNav` (new): a mai `NavBar` public részéből
- `AppNav` (new): a mai `NavHeaderUI` evolúciója

`RootLayout` döntés:
- signed-out -> `PublicNav`
- signed-in -> `AppNav`

Megszűnik a mai implicit “fallback NavBar signed-in” ág.

### B) Közös shell API (page chrome)

`PlatformPageShell` bővítendő egy egységes chrome API-val:

```ts
type PageChromeConfig = {
  breadcrumb?: Array<{ label: string; href?: string }>;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  topbar?: ReactNode;
};
```

Javasolt `PlatformPageShell` használat:

```ts
<PlatformPageShell
  surface="org"
  chrome={{
    breadcrumb: [...],
    title: "...",
    subtitle: "...",
    actions: <... />,
  }}
>
  ...
</PlatformPageShell>
```

Megjegyzés:
- a `topbar` nem külön globális komponens lesz, hanem shell slot
- breadcrumb build központi helperből jön (`lib/navigation/breadcrumbs.ts` javasolt)
- actions mindig page-level slot, nem nav-level if/else

### C) Topbar / breadcrumb / actions illesztés

- `Topbar.tsx` helyett shell `chrome.breadcrumb`
- page CTA/action gombsor helye: `chrome.actions`
- nav nem tartalmaz page-specifikus action logikát
- breadcrumb route-intent + context alapján helperből készül

## Migration plan

1. `NavHeaderUI` i18n-hardcode cleanup (HU stringek kiváltása kulcsokra).
2. `NavBar` szétbontása: `PublicNav` + (optional) legacy wrapper.
3. `RootLayout` egyszerűsítése explicit signed-in/signed-out branchre.
4. `PlatformPageShell` chrome API bevezetése.
5. `Topbar` és `SidebarUI` jelölése `@deprecated`, majd eltávolítás következő cleanup körben.

## Guardrails

- Nincs új route-level saját breadcrumb generator.
- Nincs új párhuzamos nav implementáció.
- Signed-in home link kizárólag journey engine outputból jöhet.
- Page action CTA policy-gated marad, nem nav-ban döntjük el.

## Done criteria for convergence epic

- Egyetlen signed-in nav komponens (`AppNav`) él.
- `NavBar` csak public use-case-ben marad.
- `Topbar`/`SidebarUI` kivezetett vagy explicit deprecated.
- Shell breadcrumb/actions API legalább az org/team/profile fő útvonalakon használatban van.
