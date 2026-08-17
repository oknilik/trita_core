// ─────────────────────────────────────────────────────────────────────
// Self assessment submit API — bejelentkezett hívó (Clerk) feloldása.
//
// Külön modulban azért él, hogy a valódi beadási út integrációs tesztben
// kicserélhető legyen. Éles futásban a viselkedés változatlan: lazy Clerk
// import + auth(); tesztben a seam nem tölt be Next/Clerk runtime-ot.
// ─────────────────────────────────────────────────────────────────────

export type AssessmentSubmitViewerResolver = () => Promise<string | null>;

const defaultResolver: AssessmentSubmitViewerResolver = async () => {
  const { auth } = await import("@clerk/nextjs/server");
  const { userId } = await auth();
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
