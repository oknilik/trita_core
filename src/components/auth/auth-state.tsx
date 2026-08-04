"use client";

import { createContext, useContext, useEffect, useState } from "react";

// ─────────────────────────────────────────────────────────────────────
// Közös auth-állapot a NAV-rétegnek — Clerk kliens-hookok NÉLKÜL.
//
// Cél: a marketing-fa (landing/blog/pricing/patterns/…) ne szállítson
// clerk-js bundle-t. A publikus nav/footer/help/patterns csak EGY bitet kér
// (isSignedIn) + az UserMenu-hoz a nevet — ezt itt egy könnyű context adja.
//
//   · app/auth zóna: ServerAuthStateProvider — a szerver már ismeri az
//     állapotot (userId), nincs fetch, nincs Clerk a nav-rétegben.
//   · marketing zóna: FetchAuthStateProvider — egyetlen /api hívás dönt.
//
// A belépett APP-felület fejléce külön komponens (NavHeaderUI) és marad
// Clerk-alapú a (app) ClerkProvider alatt — azt ez NEM érinti.
// ─────────────────────────────────────────────────────────────────────

export interface AuthState {
  isSignedIn: boolean;
  username: string | null;
  email: string | null;
  /** true, amíg a kliens-oldali auth-lekérés fut (csak a fetch-provider állítja). */
  loading: boolean;
}

const SIGNED_OUT: AuthState = {
  isSignedIn: false,
  username: null,
  email: null,
  loading: false,
};

const AuthStateContext = createContext<AuthState | null>(null);

export function useAuthState(): AuthState {
  // Provider nélkül biztonságos alap: kijelentkezett. Nem dobunk, hogy egy
  // elszigetelt render (pl. teszt) se törjön el.
  return useContext(AuthStateContext) ?? SIGNED_OUT;
}

/**
 * Szerver által ismert auth-állapot (app/auth zóna). Nincs fetch, nincs Clerk
 * a nav-rétegben — a layout szerver-oldalon már feloldotta az állapotot.
 */
export function ServerAuthStateProvider({
  isSignedIn,
  username = null,
  email = null,
  children,
}: {
  isSignedIn: boolean;
  username?: string | null;
  email?: string | null;
  children: React.ReactNode;
}) {
  return (
    <AuthStateContext.Provider value={{ isSignedIn, username, email, loading: false }}>
      {children}
    </AuthStateContext.Provider>
  );
}

/**
 * Publikus (marketing) zóna auth-állapota. Egyetlen könnyű lekérés dönt
 * (`/api/profile/onboarding` → 200 belépve, 401 kijelentkezve) — Clerk
 * kliens-bundle nélkül. SSR-kor kijelentkezett (statikus prerender marad),
 * a belépett látogató navja a lekérés után áll be; a kijelentkezett
 * többségnek nincs villanás.
 */
export function FetchAuthStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ ...SIGNED_OUT, loading: true });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/profile/onboarding", {
          headers: { "cache-control": "no-cache" },
        });
        if (!alive) return;
        if (res.ok) {
          const data = (await res.json().catch(() => ({}))) as {
            username?: string | null;
            email?: string | null;
          };
          setState({
            isSignedIn: true,
            username: data?.username ?? null,
            email: data?.email ?? null,
            loading: false,
          });
        } else {
          setState(SIGNED_OUT);
        }
      } catch {
        if (alive) setState(SIGNED_OUT);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return <AuthStateContext.Provider value={state}>{children}</AuthStateContext.Provider>;
}
