// ─────────────────────────────────────────────────────────────────────
// Observer submit — bejelentkezett néző (Clerk) feloldása.
//
// Külön modulban azért él, hogy integrációs tesztben kicserélhető legyen
// (a Clerk szerver-SDK a node:test + react-server condition környezetben
// nem tud betöltődni). A seam a meglévő __setAcceptanceRuntimeForTests
// mintáját követi; éles futásban a viselkedés változatlan: lazy Clerk
// import + auth() — így a külsős (nem nevesített) submit útvonal
// továbbra sem tölti be a Clerk-et.
// ─────────────────────────────────────────────────────────────────────

export type ObserverSubmitViewerResolver = () => Promise<string | null>;

const defaultResolver: ObserverSubmitViewerResolver = async () => {
  const { auth } = await import("@clerk/nextjs/server");
  const { userId } = await auth();
  return userId;
};

let activeResolver: ObserverSubmitViewerResolver = defaultResolver;

/** A submit-oldali néző clerkId-ja (nincs bejelentkezve → null). */
export function resolveObserverSubmitViewerClerkId(): Promise<string | null> {
  return activeResolver();
}

/** CSAK tesztből: a Clerk-feloldó cseréje. A visszaadott fn állítja vissza. */
export function __setObserverSubmitViewerResolverForTests(
  resolver: ObserverSubmitViewerResolver | null,
): () => void {
  const previous = activeResolver;
  activeResolver = resolver ?? defaultResolver;
  return () => {
    activeResolver = previous;
  };
}
