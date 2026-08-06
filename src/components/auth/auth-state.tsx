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

/** `document.cookie` → név/érték párok (üres string, ha nincs cookie). */
function readCookieEntries(): Array<{ name: string; value: string }> {
  if (typeof document === "undefined" || !document.cookie) return [];
  return document.cookie.split(";").map((raw) => {
    const entry = raw.trim();
    const separator = entry.indexOf("=");
    return separator === -1
      ? { name: entry, value: "" }
      : { name: entry.slice(0, separator), value: entry.slice(separator + 1) };
  });
}

/**
 * Van-e egyáltalán ESÉLY aktív munkamenetre? (Csak cookie-jelekből, hálózat
 * nélkül.)
 *
 * A Clerk a `__client_uat` cookie-t szándékosan JS-ből olvashatóan teszi ki
 * pont erre a célra: az értéke a session utolsó frissítésének időbélyege,
 * `0` = nincs aktív session. (Dev/satellite instance-on a név utótagot kap:
 * `__client_uat_<hash>` — ezért prefix-egyezést nézünk.)
 *
 * Ha a jel EGYÉRTELMŰEN „nincs session", nem indítunk lekérést — így a
 * publikus landingen a kijelentkezett látogató nem kap 401-et (felesleges
 * kérés + konzol-hiba minden publikus oldalbetöltésnél, PSI best-practices).
 * Bizonytalan esetben (nincs `__client_uat`, de van `__session` vagy e2e
 * bypass-cookie) MARAD a lekérés: a belépett viselkedés nem változhat.
 */
function mayHaveSession(): boolean {
  const entries = readCookieEntries();
  if (entries.length === 0) return false;

  // E2E auth-bypass (auth-server.ts): Clerk-cookie nélkül is belépett.
  if (entries.some((e) => e.name === "trita_e2e_user_id" && e.value !== "")) {
    return true;
  }

  const clientUat = entries.filter((e) => e.name.startsWith("__client_uat"));
  if (clientUat.length > 0) {
    return clientUat.some((e) => e.value !== "" && e.value !== "0");
  }

  return entries.some((e) => e.name.startsWith("__session"));
}

/**
 * Publikus (marketing) zóna auth-állapota. Egyetlen könnyű lekérés dönt
 * (`/api/profile/onboarding` → 200 belépve, 401 kijelentkezve) — Clerk
 * kliens-bundle nélkül. SSR-kor kijelentkezett (statikus prerender marad),
 * a belépett látogató navja a lekérés után áll be; a kijelentkezett
 * többségnek nincs villanás.
 *
 * A lekérés csak akkor indul, ha a cookie-k szerint egyáltalán lehet session
 * (`mayHaveSession`) — kijelentkezett látogatónál nincs hálózati kérés és
 * nincs 401 a konzolon.
 */
export function FetchAuthStateProvider({ children }: { children: React.ReactNode }) {
  // A KEZDŐÁLLAPOT dönti el, kell-e lekérés: ha a cookie-k szerint nincs
  // session, rögtön SIGNED_OUT (loading:false) — így nincs effect-beli
  // setState és nincs kaszkád-render. SSR-kor nincs `document`, ott is
  // SIGNED_OUT: a hidratálás kimenete változatlan (a `loading` bitet
  // kijelentkezett állapotban egyetlen fogyasztó sem olvassa — az UserMenu
  // csak `isSignedIn` mellett renderel).
  const [state, setState] = useState<AuthState>(() =>
    mayHaveSession() ? { ...SIGNED_OUT, loading: true } : SIGNED_OUT,
  );

  useEffect(() => {
    if (!mayHaveSession()) return;
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
