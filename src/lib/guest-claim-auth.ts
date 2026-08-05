// ─────────────────────────────────────────────────────────────────────
// Vendég-claim API — bejelentkezett hívó (Clerk) feloldása.
//
// Külön modulban azért él, hogy integrációs tesztben kicserélhető legyen
// (a Clerk szerver-SDK a node:test + react-server condition környezetben
// nem tud betöltődni). A seam az observer/submit-auth mintáját követi;
// éles futásban a viselkedés változatlan: lazy Clerk import + auth().
// ─────────────────────────────────────────────────────────────────────

export type GuestClaimViewerResolver = () => Promise<string | null>;

const defaultResolver: GuestClaimViewerResolver = async () => {
  const { auth } = await import("@clerk/nextjs/server");
  const { userId } = await auth();
  return userId;
};

let activeResolver: GuestClaimViewerResolver = defaultResolver;

/** A claim-hívó clerkId-ja (nincs bejelentkezve → null). */
export function resolveGuestClaimViewerClerkId(): Promise<string | null> {
  return activeResolver();
}

/** CSAK tesztből: a Clerk-feloldó cseréje. A visszaadott fn állítja vissza. */
export function __setGuestClaimViewerResolverForTests(
  resolver: GuestClaimViewerResolver | null,
): () => void {
  const previous = activeResolver;
  activeResolver = resolver ?? defaultResolver;
  return () => {
    activeResolver = previous;
  };
}
