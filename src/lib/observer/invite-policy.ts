// ─────────────────────────────────────────────────────────────────────
// Observer-meghívó típus- és jóváhagyás-szabályok — TISZTA logika
// (prisma-mentes, kliens-oldalon is importálható).
//
// Típus-taxonómia (ObserverType):
//   TEAM     — csapaton belüli kolléga (közös csapat az aktív org-ban)
//   ORG      — szervezeti kolléga (közös org, nem közös csapat)
//   EXTERNAL — szervezeten kívüli értékelő (email-alapú meghívó)
//   INTERNAL — örökség (2026-07 előtti, megkülönböztetés nélküli meghívók)
//   ANONYMOUS — nyílt link (link-service)
//
// Jóváhagyás-szabály: KÜLSŐ meghívó kampány-kontextusban csak akkor megy
// ki azonnal, ha a kampányon engedélyezett (allowExternalObservers) —
// különben AWAITING_APPROVAL, és menedzser / org admin / tanácsadó dönt.
// Kampány-kontextus nélkül (self-serve / magán használat) nincs kapu.
// ─────────────────────────────────────────────────────────────────────

export type ColleagueObserverType = "TEAM" | "ORG";

export interface ObserverTypeBadge {
  hu: string;
  en: string;
}

export const OBSERVER_TYPE_BADGES: Record<string, ObserverTypeBadge> = {
  TEAM: { hu: "Csapattárs", en: "Teammate" },
  ORG: { hu: "Szervezeti", en: "Organization" },
  EXTERNAL: { hu: "Külső", en: "External" },
  INTERNAL: { hu: "Ismerős", en: "Personal" },
  ANONYMOUS: { hu: "Nyílt link", en: "Open link" },
};

/** Kolléga-meghívó típusa: közös csapat → TEAM, különben ORG. */
export function resolveColleagueObserverType(params: {
  inviterTeamIds: string[];
  colleagueTeamIds: string[];
}): ColleagueObserverType {
  const colleagueSet = new Set(params.colleagueTeamIds);
  return params.inviterTeamIds.some((id) => colleagueSet.has(id)) ? "TEAM" : "ORG";
}

/**
 * Kell-e menedzseri jóváhagyás a meghívóhoz?
 * Csak külső meghívóra, csak kampány-kontextusban, és csak akkor, ha a
 * kampány nem engedélyezi szabadon a külsőket.
 */
export function observerInviteRequiresApproval(params: {
  observerType: string;
  campaign: { allowExternalObservers: boolean } | null;
}): boolean {
  if (params.observerType !== "EXTERNAL") return false;
  if (!params.campaign) return false;
  return !params.campaign.allowExternalObservers;
}
