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
  // Integrációs teszt-env: a Clerk szerver-SDK betöltése a node:test +
  // react-server condition alatt (CI: node24) a next/navigation
  // createContext-jén dob MÁR A MODUL-BETÖLTÉSKOR. A dinamikus import
  // elutasítását — bár a hívó try/catch-eli — a node:test unhandledRejection-
  // figyelője flaky teszt-hibaként (egy KÉSŐBBI esethez rendelve) csapja le.
  // A submit néző-feloldása amúgy is best-effort (kontextus hiányában anonim
  // null), ezért teszt-env-ben egyszerűen kihagyjuk a Clerk-importot. Ez a
  // korábbi manuális seam (__setObserverSubmitViewerResolverForTests)
  // automatikus, minden teszt-fájlra ható változata — így nem kell minden
  // full-submit tesztben külön beállítani.
  if (process.env.TRITA_INTEGRATION_TEST_DB === "1") return null;
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
