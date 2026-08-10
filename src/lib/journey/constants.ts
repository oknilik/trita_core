// ─────────────────────────────────────────────────────────────────────
// Journey-küszöbök EGYETLEN igazságforrása.
//
// Korábban ez a két konstans háromszor volt deklarálva (context.ts,
// state.ts, progress.ts) azonos értékkel — a duplikáció miatt könnyű lett
// volna elcsúsztatni őket. Innen importál mindhárom.
//
// Ennyi KÉSZ (self-eredménnyel bíró) tag kell a csapat-, illetve a
// szervezet-szintű insight feloldásához. NEM anonimitás-padló (ld.
// lib/anonymity.ts) — journey-elégségességi küszöb.
// ─────────────────────────────────────────────────────────────────────

export const MIN_MEMBERS_FOR_TEAM_INSIGHTS = 3;
export const MIN_MEMBERS_FOR_ORG_INSIGHTS = 3;
