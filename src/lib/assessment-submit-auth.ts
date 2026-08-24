// ─────────────────────────────────────────────────────────────────────
// Self assessment submit API — bejelentkezett hívó (Clerk) feloldása.
//
// Külön modulban azért él, hogy a valódi beadási út integrációs tesztben
// kicserélhető legyen. Éles futásban a viselkedés változatlan: lazy Clerk
// import + auth(); tesztben a seam nem tölt be Next/Clerk runtime-ot.
// ─────────────────────────────────────────────────────────────────────

export type AssessmentSubmitViewerResolver = () => Promise<string | null>;

const defaultResolver: AssessmentSubmitViewerResolver = async () => {
  // A bypass-tudatos helper élesben ugyanarra a Clerk auth()-ra esik vissza;
  // e2e-ben a trita_e2e_user_id cookie-t oldja fel (ld. auth-server.ts).
  const { getServerAuth } = await import("@/lib/auth-server");
  const { userId } = await getServerAuth();
  return userId;
};

let activeResolver: AssessmentSubmitViewerResolver = defaultResolver;

/** A self-submit API-hívó clerkId-ja (nincs bejelentkezve → null). */
export function resolveAssessmentSubmitViewerClerkId(): Promise<string | null> {
  return activeResolver();
}

/** CSAK tesztből: a Clerk-feloldó cseréje. A visszaadott fn állítja vissza. */
export function __setAssessmentSubmitViewerResolverForTests(
  resolver: AssessmentSubmitViewerResolver | null,
): () => void {
  const previous = activeResolver;
  activeResolver = resolver ?? defaultResolver;
  return () => {
    activeResolver = previous;
  };
}
